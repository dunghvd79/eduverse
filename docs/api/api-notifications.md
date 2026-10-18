# 🔔 Đặc Tả API: Module Thông Báo (Notifications) — api-notifications.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`api-assignments.md`](api-assignments.md), [`api-courses.md`](api-courses.md), [`design-decisions.md`](../architecture/design-decisions.md) (quyết định dùng HTTP Polling ở Phase 1)  
> **Base Path:** `/api/v1/notifications`  
> **Mục đích:** Thông báo trong ứng dụng (in-app) cho mọi vai trò. Phase 1 dùng HTTP Polling (frontend hỏi số chưa đọc 30–60 giây/lần); Socket.IO và email để Phase 2.

---

## 1. Danh Sách Endpoint

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/notifications` | `[Authenticated]` | Danh sách thông báo của tôi (mới nhất trước), kèm số chưa đọc |
| `GET` | `/api/v1/notifications/unread-count` | `[Authenticated]` | Chỉ trả số thông báo chưa đọc (nhẹ, dùng để cập nhật chuông) |
| `PATCH` | `/api/v1/notifications/read-all` | `[Authenticated]` | Đánh dấu tất cả thông báo của tôi là đã đọc |
| `PATCH` | `/api/v1/notifications/:id/read` | `[Authenticated]` | Đánh dấu một thông báo là đã đọc |

**Quy tắc chung:**
- Mỗi người chỉ xem và đổi được thông báo của **chính mình** (lấy từ `req.user`). Thông báo của người khác trả `404` (không lộ việc tồn tại).
- Chỉ có thao tác đọc và đánh dấu đã đọc. Không có API tạo/xóa: thông báo do hệ thống tự sinh khi có sự kiện (mục 3).
- Thông báo là phần phụ của nghiệp vụ: nếu tạo thông báo lỗi (ví dụ chưa chạy migration), thao tác chính (giao bài, chấm điểm, duyệt khóa học...) **vẫn thành công**, lỗi chỉ ghi log cảnh báo ở backend.

---

## 2. Đặc Tả Chi Tiết

### 2.1. `GET /api/v1/notifications`
* **Query:** `page` (mặc định 1), `limit` (mặc định 20, tối đa 50), `unreadOnly` (`true` chỉ lấy thông báo chưa đọc, mặc định `false`).

#### Response Thành Công (`200 OK`) — phần `data`:
```json
{
  "items": [
    {
      "id": "0b6f1c9e-8f3a-4c35-9d79-2a1c6c3a9e11",
      "type": "assignment_graded",
      "title": "Bài tập đã được chấm điểm",
      "message": "Giảng viên đã chấm bài \"Bài tập 1: REST API\" của bạn: 8.5/10.",
      "link": "/student/classes/3542b790-702c-4d51-b049-1e4c011b8bca/assignments/a1b2c3d4-0000-4000-8000-000000000001",
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-10-17T03:15:00.000Z"
    }
  ],
  "unreadCount": 3,
  "meta": { "page": 1, "limit": 20, "totalItems": 12, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```
`link` là đường dẫn trong frontend (có thể `null`); frontend điều hướng tới đó khi người dùng bấm vào thông báo.

### 2.2. `GET /api/v1/notifications/unread-count`
`data`: `{ "unreadCount": 3 }`

### 2.3. `PATCH /api/v1/notifications/read-all`
`data`: `{ "updated": 3 }` (số thông báo vừa được đánh dấu).

### 2.4. `PATCH /api/v1/notifications/:id/read`
`data`: thông báo đã cập nhật (cùng cấu trúc phần tử trong `items`, `isRead = true`, `readAt` có giá trị). Đánh dấu lại thông báo đã đọc vẫn trả `200` và giữ nguyên `readAt` cũ.

---

## 3. Sự Kiện Sinh Thông Báo

| `type` | Khi nào | Người nhận | `link` |
|---|---|---|---|
| `assignment_assigned` | Giảng viên giao bài tập **lần đầu** cho lớp (`PUT /classes/:classId/assignments/:assignmentId/schedule`); đổi hạn sau đó không gửi lại | Học viên đang học trong lớp | `/student/classes/:classId/assignments/:assignmentId` |
| `assignment_graded` | Chấm hoặc chấm lại bài (`PATCH /assignment-submissions/:id/grade`, `.../submissions/bulk-grade`) | Học viên của bài nộp | `/student/classes/:classId/assignments/:assignmentId` |
| `assignment_resubmission` | Giảng viên yêu cầu nộp lại (`POST /assignment-submissions/:id/request-resubmission`), kèm lý do | Học viên của bài nộp | `/student/classes/:classId/assignments/:assignmentId` |
| `course_pending` | Giảng viên gửi khóa học chờ duyệt (`POST /courses/:id/publish-request`) | Mọi Quản lý đào tạo đang hoạt động | `/manager/approvals/:courseId/review` |
| `course_approved` | Quản lý phê duyệt khóa học | Chủ khóa học | `/teacher/courses` |
| `course_rejected` | Quản lý từ chối khóa học, kèm lý do | Chủ khóa học | `/teacher/courses/:courseId/curriculum` |

---

## 4. Cấu Trúc Bảng `notifications`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID, PK | |
| `user_id` | UUID, FK → `users.id` | `ON DELETE CASCADE`; index `(user_id, is_read, created_at)` |
| `type` | VARCHAR(50) | Giá trị ở mục 3 |
| `title` | VARCHAR(255) | |
| `message` | TEXT | |
| `link` | VARCHAR(500), null | Đường dẫn trong frontend |
| `is_read` | BOOLEAN, mặc định `false` | |
| `read_at` | TIMESTAMPTZ, null | |
| `created_at` | TIMESTAMPTZ | Không có `updated_at`, không xóa mềm |

Tạo bảng bằng migration idempotent: `npm run db:migrate:notifications` (trong `backend/`).

---

## 5. Bảng Lỗi

| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tham số truy vấn không hợp lệ | `page`/`limit`/`unreadOnly` sai kiểu hoặc vượt giới hạn |
| `400` | `Bad Request` | Mã định danh "id" không hợp lệ | `:id` không phải UUID |
| `401` | `Unauthorized` | Phiên làm việc không hợp lệ | Thiếu hoặc hết hạn Access Token |
| `404` | `Not Found` | Không tìm thấy thông báo | Không tồn tại hoặc thuộc người khác |
| `500` | `Internal Server Error` | | Chưa chạy migration tạo bảng `notifications` |

---

## 6. Trạng Thái Triển Khai (17/10/2026)

- ✅ 4 endpoint, bảng `notifications`, 6 loại sự kiện ở mục 3.
- ✅ Chuông thông báo ở giao diện (18/10/2026): hỏi `unread-count` mỗi 30 giây, danh sách thả xuống, bấm vào thông báo để đánh dấu đã đọc và chuyển tới `link`, nút "Đánh dấu tất cả đã đọc".
- ⏳ Chưa làm: email (cần Nodemailer + BullMQ), Socket.IO push, thông báo đề kiểm tra mới/đề được chấm, xóa/dọn thông báo cũ.
