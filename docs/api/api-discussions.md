# 💬 Đặc Tả API: Module Thảo Luận / Hỏi Đáp Trong Bài Học (Discussions) — api-discussions.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`api-classes.md`](api-classes.md), [`api-courses.md`](api-courses.md), [`api-notifications.md`](api-notifications.md), [`business-rules.md`](../requirements/business-rules.md) (BR-070 → BR-078)  
> **Base Path:** `/api/v1`  
> **Mục đích:** Học viên đặt câu hỏi ngay dưới bài học đang học, giảng viên và bạn học trả lời. Mỗi cuộc thảo luận thuộc về **một lớp + một bài học** (hai lớp học cùng khóa học có hai khu thảo luận riêng, không lẫn câu hỏi). Không có real-time (BR-062): danh sách cập nhật khi tải lại trang.

---

## 1. Danh Sách Endpoint

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/classes/:classId/lessons/:lessonId/discussions` | `[Học viên của lớp, Giảng viên phụ trách, Manager, Admin]` | Danh sách câu hỏi của một bài học trong lớp (kèm câu trả lời) |
| `POST` | `/api/v1/classes/:classId/lessons/:lessonId/discussions` | `[Học viên của lớp, Giảng viên phụ trách]` | Đặt câu hỏi mới |
| `POST` | `/api/v1/discussions/:id/replies` | `[Học viên của lớp, Giảng viên phụ trách]` | Trả lời một câu hỏi |
| `PATCH` | `/api/v1/discussions/:id` | `[Tác giả]` | Sửa nội dung câu hỏi / câu trả lời của mình |
| `DELETE` | `/api/v1/discussions/:id` | `[Tác giả, Giảng viên phụ trách, Manager, Admin]` | Xóa (mềm) câu hỏi hoặc câu trả lời |
| `PATCH` | `/api/v1/discussions/:id/resolve` | `[Người đặt câu hỏi, Giảng viên phụ trách, Manager, Admin]` | Đánh dấu / bỏ đánh dấu "đã giải đáp" |
| `GET` | `/api/v1/classes/:classId/discussions` | `[Giảng viên phụ trách, Manager, Admin]` | Tổng quan thảo luận cả lớp (tab "Thảo luận" của lớp) |

**Quy tắc chung:**
- "Học viên của lớp" = học viên có ghi danh `active` trong lớp (BR-070). Học viên khác hoặc đã bị xóa khỏi lớp: `403`.
- "Giảng viên phụ trách" = `classes.teacher_id` là chính người dùng. Giảng viên khác: `403`.
- Manager và Admin **xem và kiểm duyệt (xóa)** được, nhưng không đăng bài (`403` khi `POST`).
- Bài học `:lessonId` phải thuộc khóa học của lớp `:classId`, nếu không trả `404`.
- Lớp có `status` khác `active` (`paused`, `closed`) là **chỉ đọc**: không đăng, sửa, trả lời hay đánh dấu với học viên (`409`). Giảng viên, Manager, Admin vẫn xóa được để kiểm duyệt.
- Nội dung là **văn bản thuần** 1–2000 ký tự sau khi bỏ khoảng trắng hai đầu; frontend hiển thị dạng text (không render HTML/Markdown), nên không có rủi ro chèn script.
- Chỉ có **một cấp trả lời**: trả lời gắn vào câu hỏi gốc, không trả lời lồng nhau (BR-072).
- Đăng bài / trả lời bị giới hạn tần suất: tối đa 10 lượt mỗi phút mỗi người dùng (`429`).
- Thông báo là phần phụ: tạo thông báo lỗi không làm hỏng thao tác chính (xem `api-notifications.md`).

---

## 2. Đặc Tả Chi Tiết

### 2.1. `GET /api/v1/classes/:classId/lessons/:lessonId/discussions`
* **Query:** `status` (`all` mặc định, `open` chưa giải đáp, `resolved` đã giải đáp), `page` (mặc định 1), `limit` (mặc định 20, tối đa 50). Phân trang theo **câu hỏi gốc**; câu trả lời luôn trả đầy đủ bên trong từng câu hỏi.
* **Thứ tự:** câu hỏi mới nhất trước; câu trả lời cũ nhất trước (đọc như hội thoại).

#### Response Thành Công (`200 OK`) — phần `data`:
```json
{
  "items": [
    {
      "id": "7d1c2a54-5c0e-4a77-9b53-0f3c8a1b2d10",
      "classId": "3542b790-702c-4d51-b049-1e4c011b8bca",
      "lessonId": "b1f0e6a2-0000-4000-8000-000000000011",
      "content": "REST khác RPC ở điểm nào ạ?",
      "isResolved": false,
      "editedAt": null,
      "createdAt": "2026-10-25T03:15:00.000Z",
      "author": { "id": "…", "fullName": "Nguyễn Văn Dũng", "avatarUrl": null, "role": "student" },
      "canEdit": true,
      "canDelete": true,
      "canResolve": true,
      "replies": [
        {
          "id": "9a8b7c6d-0000-4000-8000-000000000021",
          "content": "REST xoay quanh tài nguyên và HTTP method, RPC xoay quanh hành động.",
          "editedAt": null,
          "createdAt": "2026-10-25T04:02:00.000Z",
          "author": { "id": "…", "fullName": "Trần Văn An", "avatarUrl": null, "role": "teacher" },
          "canEdit": false,
          "canDelete": true
        }
      ]
    }
  ],
  "canPost": true,
  "totalReplies": 1,
  "meta": { "page": 1, "limit": 20, "totalItems": 1, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```
- `totalReplies`: tổng số câu trả lời trong các câu hỏi của trang này.
- `author.role` giúp giao diện gắn huy hiệu "Giảng viên" cho câu trả lời của giảng viên.
- `canEdit` / `canDelete` / `canResolve` / `canPost` tính theo người đang xem (và trạng thái lớp) để frontend chỉ hiện nút hợp lệ; backend vẫn kiểm tra lại ở từng endpoint.
- Email người dùng **không** nằm trong dữ liệu thảo luận.

### 2.2. `POST /api/v1/classes/:classId/lessons/:lessonId/discussions`
#### Request Body:
```json
{ "content": "REST khác RPC ở điểm nào ạ?" }
```
#### Response Thành Công (`201 Created`) — phần `data`: câu hỏi vừa tạo (cùng cấu trúc phần tử `items`, `replies: []`).

### 2.3. `POST /api/v1/discussions/:id/replies`
`:id` là mã câu hỏi **gốc**. Body giống 2.2. Trả `201` với câu trả lời vừa tạo (cùng cấu trúc phần tử `replies`). Nếu `:id` là một câu trả lời (không phải gốc): `400`.

### 2.4. `PATCH /api/v1/discussions/:id`
Body `{ "content": "..." }`. Chỉ tác giả sửa được (kể cả giảng viên chỉ sửa bài của chính mình). Đặt `editedAt` = thời điểm sửa; giao diện hiện "(đã chỉnh sửa)". Trả `200` với bản ghi đã cập nhật.

### 2.5. `DELETE /api/v1/discussions/:id`
Xóa mềm. Xóa **câu hỏi gốc** thì xóa luôn các câu trả lời của nó. Học viên chỉ xóa được bài của mình; giảng viên phụ trách, Manager, Admin xóa được mọi bài trong lớp. `data`: `{ "deleted": 1 }` (số bản ghi bị xóa, gồm cả câu trả lời).

### 2.6. `PATCH /api/v1/discussions/:id/resolve`
Body `{ "isResolved": true }`. Chỉ áp dụng cho câu hỏi gốc (`400` nếu là câu trả lời). Trả `200` với câu hỏi đã cập nhật.

### 2.7. `GET /api/v1/classes/:classId/discussions`
* **Query:** `status` (`open` mặc định, `resolved`, `all`), `lessonId` (lọc theo bài học, tùy chọn), `page`, `limit` (mặc định 20, tối đa 50).
* Mỗi phần tử có cùng cấu trúc như ở 2.1 (kèm `replies` đầy đủ, `canEdit`/`canDelete`/`canResolve`) và thêm `lesson: { id, title }`, `replyCount`, `lastActivityAt` (lần trả lời gần nhất, hoặc `createdAt` nếu chưa có trả lời). Sắp theo `lastActivityAt` mới nhất trước.
* `data` thêm `canPost` (giảng viên phụ trách và lớp đang `active` thì `true`; Quản lý, Admin luôn `false`) và `summary: { open, resolved, total }` (đếm toàn lớp, không phụ thuộc bộ lọc).
* `unanswered` (số câu hỏi chưa có câu trả lời nào của giảng viên) không tính ở Phase 2.

---

## 3. Sự Kiện Sinh Thông Báo

| `type` | Khi nào | Người nhận | `link` |
|---|---|---|---|
| `discussion_question` | **Học viên** đặt câu hỏi mới | Giảng viên phụ trách lớp | `/teacher/classes/:classId?tab=discussions` |
| `discussion_reply` | Có người trả lời câu hỏi | Người đặt câu hỏi (trừ khi chính họ trả lời) | Học viên: `/student/courses/:courseId/learn/:lessonId?classId=:classId`; giảng viên: `/teacher/classes/:classId?tab=discussions` |

Giảng viên đăng câu hỏi hay học viên trả lời nhau không gửi thông báo cho cả lớp (tránh spam).

---

## 4. Cấu Trúc Bảng `lesson_discussions`

Xem chi tiết ở [`schema.md`](../database/schema.md) mục 19. Tóm tắt: `id`, `class_id`, `lesson_id`, `author_id`, `parent_id` (null = câu hỏi gốc), `content`, `is_resolved`, `edited_at`, `created_at`, `updated_at`, `deleted_at` (xóa mềm).

Tạo bảng bằng migration idempotent: `npm run db:migrate:discussions` (trong `backend/`).

---

## 5. Bảng Lỗi

| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu không hợp lệ | `content` rỗng hoặc dài hơn 2000 ký tự; `isResolved` không phải boolean; query sai kiểu |
| `400` | `Bad Request` | Tham số đường dẫn không hợp lệ | `:classId`/`:lessonId`/`:id` không phải UUID |
| `400` | `Bad Request` | Chỉ có thể trả lời câu hỏi gốc / Chỉ đánh dấu được câu hỏi gốc | Gọi `replies` hoặc `resolve` trên một câu trả lời |
| `401` | `Unauthorized` | Phiên làm việc không hợp lệ | Thiếu hoặc hết hạn Access Token |
| `403` | `Forbidden` | Bạn không có quyền ... | Không phải học viên của lớp / không phải giảng viên phụ trách / Manager, Admin đăng bài / sửa bài của người khác |
| `404` | `Not Found` | Không tìm thấy lớp học / bài học / thảo luận | Không tồn tại, đã xóa, hoặc bài học không thuộc khóa học của lớp |
| `409` | `Conflict` | Lớp học đã tạm dừng hoặc kết thúc, thảo luận chỉ có thể xem | Học viên thao tác ghi khi lớp không `active` |
| `429` | `Too Many Requests` | Bạn thao tác quá nhanh | Quá 10 lượt đăng/trả lời mỗi phút |
| `500` | `Internal Server Error` | | Chưa chạy migration tạo bảng `lesson_discussions` |

---

## 6. Giao Diện

- **Học viên** (`/student/courses/:courseId/learn/:lessonId?classId=...`): khu "Thảo luận" ở cuối bài học; ô nhập câu hỏi, danh sách câu hỏi kèm câu trả lời, nút Trả lời / Sửa / Xóa / Đã giải đáp theo quyền. Lớp không `active` hiện thông báo chỉ đọc, ẩn ô nhập. Khi vào bài học không kèm `classId` (xem bài ở chế độ khác), khu này ẩn.
- **Giảng viên / Quản lý / Admin** (`/teacher/classes/:id?tab=discussions`, tương tự cho `/manager/…`, `/admin/…`): tab "Thảo luận" liệt kê câu hỏi cả lớp, lọc "Chưa giải đáp / Đã giải đáp / Tất cả" và theo bài học; mở câu hỏi để xem, trả lời (giảng viên), đánh dấu, xóa.

---

## 7. Trạng Thái Triển Khai

- ✅ Đã triển khai (26/10/2026): 7 endpoint, bảng `lesson_discussions`, 2 loại thông báo (mục 3), khu Thảo luận cuối bài học (học viên) và tab "Thảo luận" của lớp (giảng viên, Quản lý, Admin).
- 🧪 Kiểm thử: 28 unit test quy tắc quyền (`discussionRules.test.js`), 12 kiểm tra API trong `api.e2e.js`.
- Không làm ở Phase 2: real-time (BR-062), đính kèm tệp/ảnh, bình chọn hữu ích, mention `@`, tìm kiếm toàn văn, email thông báo (làm riêng ở mục email BullMQ).
