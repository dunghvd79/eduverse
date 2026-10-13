# 📊 Đặc Tả API: Module Tổng Quan (Dashboard) — api-dashboard.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`grading-policy.md`](../requirements/grading-policy.md), [`api-classes.md`](api-classes.md), [`api-assignments.md`](api-assignments.md), [`api-quizzes.md`](api-quizzes.md)  
> **Base Path:** `/api/v1/dashboard`  
> **Mục đích:** Cung cấp số liệu thật cho trang Tổng quan của 4 vai trò. Mỗi trang gọi đúng 1 request; số liệu tính từ các bảng hiện có, không thêm bảng mới.

---

## 1. Danh Sách Endpoint Tổng Quan

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/dashboard/student` | `[Roles: student]` | Lớp đang học, điểm TB, tiến độ, việc cần làm |
| `GET` | `/api/v1/dashboard/teacher` | `[Roles: teacher]` | Khóa học của tôi, lớp phụ trách, bài chờ chấm, khóa bị từ chối |
| `GET` | `/api/v1/dashboard/manager` | `[Roles: training_manager]` | Hàng đợi duyệt khóa, lớp theo trạng thái, khóa vừa duyệt |
| `GET` | `/api/v1/dashboard/admin` | `[Roles: admin]` | Thống kê người dùng, phân bổ vai trò, tình trạng dịch vụ |

**Quy tắc chung:**
- Chỉ đọc, không có tham số (path/query/body). Phạm vi dữ liệu luôn lấy từ người đang đăng nhập (`req.user`), không nhận `userId`/`classId` từ client.
- Mỗi vai trò chỉ gọi được endpoint của mình (Admin không xem được dashboard học viên/giảng viên): sai vai trò → `403`.
- Điểm số là `number` thang 10, làm tròn 2 chữ số; thời gian dạng ISO 8601 (UTC). Mọi response có `generatedAt`.
- Không lưu cache: mỗi lần gọi tính lại từ CSDL.

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

### 2.1. Tổng quan học tập (Học viên)

#### `GET /api/v1/dashboard/student`
* **Mô tả chức năng:** Số liệu trang Tổng quan của học viên.
* **Quyền hạn:** `[Roles: student]`
* **Headers:** `Authorization: Bearer <access_token>`

**Quy tắc tính:**
- **Lớp đang học:** ghi danh `active` **và** lớp `status = 'active'` (lớp tạm dừng/đã kết thúc vẫn xem được ở trang Điểm số, không vào dashboard). Khóa học bị xóa mềm không tính.
- **`averageFinalScore`:** trung bình cộng điểm tổng kết các lớp đang học, mỗi lớp tính bằng đúng hàm của trang Điểm số (`grading-policy.md`, chưa làm = 0). `null` khi chưa có lớp.
- **Việc cần làm** (chỉ lớp có khóa học `published`), sắp xếp theo hạn tăng dần, hạn `null` xếp cuối, trả tối đa 8 mục (`todo.total` là tổng số):
  - *Bài tập:* chưa nộp và cửa sổ nộp đang mở (`on_time` hoặc `late`), hoặc giảng viên đã yêu cầu nộp lại (`needsResubmission: true`, bỏ qua hạn). `isOverdue = true` khi đã qua `deadline` (đang trong hạn nộp muộn).
  - *Bài kiểm tra:* đề đang mở cho lớp (theo lịch `class_quizzes`), có câu hỏi, chưa đạt điểm qua, và còn lượt làm hoặc đang có lượt làm dở còn giờ. `deadline` = giờ đóng đề (có thể `null`).
- **`dueSoonCount`:** số việc cần làm có hạn trong 7 ngày tới (việc đã quá hạn không tính).
- **`quizzesPassed`:** số đề (theo từng lớp) có điểm cao nhất ≥ `passScore`.
- **`continueLearning`:** lớp có bài học hoàn thành gần nhất; chưa học lớp nào thì là lớp ghi danh mới nhất. `null` khi chưa có lớp.
- `classes` sắp theo hoạt động gần nhất. Không trả email giảng viên, mã lớp, nội dung đề hay đáp án.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy dữ liệu tổng quan thành công",
  "data": {
    "stats": { "activeClasses": 2, "averageFinalScore": 7.42, "dueSoonCount": 3, "quizzesPassed": 4 },
    "continueLearning": {
      "classId": "3542b790-702c-4d51-b049-1e4c011b8bca",
      "className": "Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)",
      "courseTitle": "Lập trình Ứng dụng Web Hiện đại với Node.js, Express và React",
      "lastActiveAt": "2026-10-12T08:00:00.000Z"
    },
    "classes": [
      {
        "id": "3542b790-702c-4d51-b049-1e4c011b8bca",
        "name": "Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)",
        "course": { "id": "37f0c425-aada-4ad8-8004-7e8165c4a08f", "title": "Lập trình Ứng dụng Web...", "thumbnailUrl": null },
        "teacher": { "id": "9b847917-3071-4cc1-83b0-8fd72c49e6c8", "fullName": "ThS. Nguyễn Văn An", "avatarUrl": null },
        "progress": { "completedLessons": 2, "totalLessons": 3, "progressPercentage": 66.67 },
        "finalScore": 7.8,
        "ranking": "Khá",
        "lastActiveAt": "2026-10-12T08:00:00.000Z"
      }
    ],
    "todo": {
      "total": 1,
      "items": [
        {
          "type": "quiz",
          "id": "e43a8eaa-d708-4ab2-8a68-3d1bffe106d2",
          "title": "Kiểm tra kiến thức Node.js & Express.js",
          "classId": "3542b790-702c-4d51-b049-1e4c011b8bca",
          "className": "Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)",
          "deadline": null,
          "isOverdue": false,
          "needsResubmission": false
        }
      ]
    },
    "generatedAt": "2026-10-13T04:01:59.590Z"
  },
  "timestamp": "2026-10-13T04:02:01.817Z"
}
```
`type` là `assignment` hoặc `quiz`. Frontend mở bài tập tại `/student/classes/:classId/assignments/:id`, bài kiểm tra tại `/student/quizzes/:id/take?classId=:classId`.

---

### 2.2. Tổng quan giảng dạy (Giảng viên)

#### `GET /api/v1/dashboard/teacher`
* **Mô tả chức năng:** Số liệu trang Tổng quan của giảng viên.
* **Quyền hạn:** `[Roles: teacher]`
* **Headers:** `Authorization: Bearer <access_token>`

**Quy tắc tính:**
- **`stats.courses`:** khóa học do giảng viên **tạo** (`owner_id`), đếm theo trạng thái. Khóa chỉ đứng lớp (người khác tạo) không tính.
- **`activeClasses` / `totalClasses`:** lớp giảng viên phụ trách đang `active` / tất cả.
- **`activeStudents`:** số học viên khác nhau đang học (ghi danh `active`) trong các lớp `active`.
- **Bài chờ chấm:** cùng quy tắc với trang chấm bài: `status ∈ {submitted, late_submitted}` và (chưa có điểm **hoặc** nộp lại sau lần chấm gần nhất), chỉ học viên còn trong lớp. Tính trên **mọi** lớp phụ trách (kể cả lớp đã đóng, vì vẫn chấm được). `needsGrading` gom theo bài tập của từng lớp, bài nộp chờ lâu nhất lên đầu, tối đa 8 nhóm; `submissionsNeedGrading` là tổng.
- **`rejectedCourses`:** tối đa 5 khóa bị từ chối gần nhất, kèm lý do.
- **Bảng lớp:** lớp `active` lên trước, tối đa 10 lớp (`classes.total` là tổng). `averageProgress`, `averageFinalScore` và `distribution` (số học viên theo xếp loại của `grading-policy.md`) lấy từ bảng điểm lớp; hai giá trị trung bình là `null` khi lớp chưa có học viên. Không trả tên/email học viên.

#### Response Thành Công (`200 OK`) — phần `data`:
```json
{
  "stats": {
    "courses": { "total": 5, "draft": 2, "pending": 1, "published": 2, "rejected": 0 },
    "activeClasses": 1,
    "totalClasses": 1,
    "activeStudents": 3,
    "submissionsNeedGrading": 4
  },
  "needsGrading": [
    {
      "classId": "3542b790-702c-4d51-b049-1e4c011b8bca",
      "className": "Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)",
      "courseTitle": "Lập trình Ứng dụng Web...",
      "assignmentId": "a1b2c3d4-...",
      "assignmentTitle": "Bài tập 1: REST API",
      "count": 4,
      "oldestSubmittedAt": "2026-10-11T09:30:00.000Z",
      "deadline": "2026-10-12T16:59:00.000Z"
    }
  ],
  "rejectedCourses": [
    { "id": "47d6a401-...", "title": "KHÓA HỌC TA CƠ BẢN", "rejectionReason": "Thiếu mô tả bài học", "rejectedAt": "2026-10-10T03:00:00.000Z" }
  ],
  "classes": {
    "total": 1,
    "items": [
      {
        "id": "3542b790-702c-4d51-b049-1e4c011b8bca",
        "name": "Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)",
        "classCode": "EDU2026A",
        "status": "active",
        "endDate": "2026-11-30",
        "course": { "id": "37f0c425-...", "title": "Lập trình Ứng dụng Web..." },
        "studentCount": 3,
        "averageProgress": 33.3,
        "averageFinalScore": 5.12,
        "distribution": { "Giỏi": 0, "Khá": 1, "Trung bình": 1, "Chưa đạt": 1 }
      }
    ]
  },
  "generatedAt": "2026-10-13T04:02:11.615Z"
}
```

---

### 2.3. Tổng quan đào tạo (Quản lý đào tạo)

#### `GET /api/v1/dashboard/manager`
* **Mô tả chức năng:** Số liệu trang Tổng quan của Quản lý đào tạo (toàn hệ thống).
* **Quyền hạn:** `[Roles: training_manager]`
* **Headers:** `Authorization: Bearer <access_token>`

**Quy tắc tính:**
- **Hàng đợi duyệt:** khóa `pending`, gửi sớm nhất lên đầu, tối đa 6 mục (`pendingQueue.total` là tổng). `submittedAt` lấy từ `updated_at` (khóa `pending` bị khóa chỉnh sửa nên đây là lúc gửi duyệt; CSDL chưa có cột riêng).
- **Lớp theo trạng thái / `activeClasses`:** không tính lớp của khóa học đã bị xóa mềm.
- **`activeStudents`:** số học viên khác nhau đang học trong các lớp `active`.
- **`recentlyApproved`:** 5 khóa `published` duyệt gần nhất (theo `approved_at`). Thay cho "Hoạt động gần đây" vì hệ thống chưa có nhật ký hoạt động.
- Chỉ trả họ tên giảng viên, không trả email.

#### Response Thành Công (`200 OK`) — phần `data`:
```json
{
  "stats": { "pendingCourses": 1, "publishedCourses": 2, "activeClasses": 1, "activeStudents": 3 },
  "pendingQueue": {
    "total": 1,
    "items": [
      {
        "id": "47d6a401-be31-4e27-b811-b99342526cfd",
        "title": "KHÓA HỌC TA CƠ BẢN",
        "thumbnailUrl": null,
        "teacher": { "id": "9b847917-...", "fullName": "ThS. Nguyễn Văn An" },
        "category": null,
        "submittedAt": "2026-10-09T12:13:58.537Z"
      }
    ]
  },
  "classesByStatus": { "active": 1, "paused": 0, "closed": 0, "total": 1 },
  "recentlyApproved": [
    { "id": "7b428f9f-...", "title": "Khóa Test UI", "teacher": { "id": "9b847917-...", "fullName": "ThS. Nguyễn Văn An" }, "approvedAt": "2026-10-10T17:45:58.690Z" }
  ],
  "generatedAt": "2026-10-13T04:02:12.156Z"
}
```

---

### 2.4. Tổng quan hệ thống (Admin)

#### `GET /api/v1/dashboard/admin`
* **Mô tả chức năng:** Thống kê người dùng và tình trạng các dịch vụ.
* **Quyền hạn:** `[Roles: admin]`
* **Headers:** `Authorization: Bearer <access_token>`

**Quy tắc tính:**
- Tài khoản đã xóa mềm không tính. `blockedUsers` = `is_active = false`; `unverifiedUsers` = `email_verified = false`; `newUsersLast7Days` theo `created_at`.
- **`newestUsers`:** 6 tài khoản mới nhất, chỉ các trường hiển thị (không có `password_hash`, `block_reason`, số điện thoại).
- **`system.services[].status`:**

| `key` | Giá trị `status` | Cách kiểm tra |
|---|---|---|
| `database` | `ok` \| `degraded` \| `down` | Ping thật bằng `sequelize.authenticate()`, timeout 5 giây; `degraded` khi ≥ 1000 ms. Kèm `latencyMs`. |
| `storage` | `configured` \| `not_configured` | Có đủ `AWS_REGION` và `S3_BUCKET` (cùng điều kiện với API upload). Không kiểm tra kết nối tới S3. |
| `ai` | `configured` \| `not_configured` | Có `GEMINI_API_KEY`. |
| `email` | `dev_console` | Chưa cài Nodemailer: OTP và link đặt lại mật khẩu in ra console backend. |

- **Bảo mật:** chỉ trả trạng thái. Không bao giờ trả giá trị biến môi trường, tên bucket/region/model hay thông báo lỗi kết nối CSDL (có thể chứa host).

#### Response Thành Công (`200 OK`) — phần `data`:
```json
{
  "stats": { "totalUsers": 10, "blockedUsers": 0, "unverifiedUsers": 0, "newUsersLast7Days": 2 },
  "roleDistribution": [
    { "role": "student", "count": 5, "percentage": 50 },
    { "role": "teacher", "count": 3, "percentage": 30 },
    { "role": "training_manager", "count": 1, "percentage": 10 },
    { "role": "admin", "count": 1, "percentage": 10 }
  ],
  "system": {
    "checkedAt": "2026-10-13T04:02:12.634Z",
    "uptimeSeconds": 25,
    "services": [
      { "key": "database", "status": "ok", "latencyMs": 41 },
      { "key": "storage", "status": "not_configured" },
      { "key": "ai", "status": "configured" },
      { "key": "email", "status": "dev_console" }
    ]
  },
  "newestUsers": [
    {
      "id": "8c9c4faf-7d4f-4cfa-8235-1c565299e562",
      "fullName": "TS. Mai Hồng",
      "email": "teacher.nhung@eduverse.com",
      "role": "teacher",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2026-10-10T18:11:46.512Z"
    }
  ],
  "generatedAt": "2026-10-13T04:02:12.700Z"
}
```

---

### 2.5. Bảng lỗi chung

| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Phiên làm việc không hợp lệ hoặc thiếu Token xác thực / Access Token đã hết hạn... | Thiếu, sai hoặc hết hạn access token |
| `403` | `Forbidden` | Bạn không có quyền thực hiện hành động này. | Gọi endpoint của vai trò khác |
| `403` | `Forbidden` | Bạn cần đổi mật khẩu tạm thời trước khi tiếp tục sử dụng hệ thống. | Tài khoản phải đổi mật khẩu tạm trước (`errors: ["MUST_CHANGE_PASSWORD"]`) |
| `403` | `Forbidden` | Tài khoản của bạn đã bị khóa... | Tài khoản bị khóa |
| `500` | `Internal Server Error` | Lỗi máy chủ nội bộ | Lỗi truy vấn CSDL |

---

## 3. Ghi Chú Kỹ Thuật & Nghiệp Vụ

- **Không chép lại quy tắc:** các quy tắc "cần chấm" (`needsGrading`), cửa sổ nộp bài (`windowOf`), lịch mở đề (`availabilityOf`), hết giờ làm bài (`isExpired`) và điểm tổng kết (`computeGradebook`) được import từ service gốc. Sửa quy tắc ở service gốc thì dashboard tự đúng theo.
- **Chỉ đọc:** dashboard không gọi `finalizeExpired` (hàm này ghi CSDL). Lượt làm bài quá giờ nhưng chưa được chốt vẫn tính là đã dùng lượt và không còn "làm dở"; điểm tổng kết không bị ảnh hưởng vì lượt đó chưa có điểm (tính 0 như chưa làm).
- **Hiệu năng:** điểm tổng kết tốn khoảng 8 truy vấn mỗi lớp; chạy song song tối đa 3 lớp để không chiếm hết pool kết nối (max 10). Bảng lớp của giảng viên giới hạn 10 lớp. Thời gian đo trên Neon dev: học viên 1 lớp ~2 giây (lần đầu), giảng viên ~0.5 giây, quản lý/admin < 0.2 giây.
- **Các chỉ số đã bỏ** so với giao diện mẫu vì CSDL chưa ghi nhận: giờ học mỗi tuần, đánh giá khóa học, % thay đổi so với kỳ trước, uptime/dung lượng S3, nhật ký hoạt động và sự kiện bảo mật.

---

## 4. Trạng Thái Triển Khai (cập nhật 13/10/2026)

| Endpoint | Trạng thái | Ghi chú |
|---|:---:|---|
| `GET /dashboard/student` | ✅ | Điểm TB khớp trang Điểm số |
| `GET /dashboard/teacher` | ✅ | |
| `GET /dashboard/manager` | ✅ | |
| `GET /dashboard/admin` | ✅ | |
