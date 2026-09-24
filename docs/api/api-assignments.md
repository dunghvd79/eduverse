# 📝 Đặc Tả API: Module Bài Tập Tự Luận & Nộp File S3 — api-assignments.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`seq-assign-001.md`](../sequences/seq-assign-001.md), [`actor-student.md`](../use-cases/actor-student.md#uc-assign-001), [`actor-teacher.md`](../use-cases/actor-teacher.md#uc-assign-002)  
> **Base Path:** `/api/v1/assignments`, `/api/v1/classes/:classId/assignments`, `/api/v1/assignment-submissions`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ soạn thảo khung bài tập tự luận, cấu hình lịch nộp theo lớp (Deadline, Cut-off date, Nộp muộn), quy trình nộp bài trực tiếp lên AWS S3 bằng Presigned URL (chống nghẽn băng thông server), cơ chế nộp lại (Resubmission do học viên chủ động hoặc do Giảng viên yêu cầu phúc khảo/nộp lại), chấm điểm & nhận xét (Chấm đơn lẻ & Bulk Grade), kích hoạt tiến độ học tập và tải trọn gói file ZIP toàn bộ bài nộp của cả lớp để chấm offline.

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Phân hệ Quản lý Khung bài tập (Master Assignments - Giảng viên & Quản trị)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/assignments` | `[Authenticated]` | Lấy danh sách khung bài tập (phân trang, lọc theo khóa học/bài học) |
| `GET` | `/api/v1/assignments/:id` | `[Authenticated]` | Xem thông tin chi tiết khung bài tập (đề bài, định dạng file, dung lượng tối đa) |
| `POST` | `/api/v1/assignments` | `[Roles: teacher, admin]` | Tạo khung bài tập mới (gắn 1:1 với bài học dạng `assignment`) |
| `PATCH` | `/api/v1/assignments/:id` | `[Roles: teacher, admin]` | Cập nhật nội dung đề bài, định dạng file hoặc dung lượng tối đa |
| `DELETE` | `/api/v1/assignments/:id` | `[Roles: teacher, admin]` | Xóa mềm khung bài tập |

### 1.2. Phân hệ Cấu hình Lịch nộp & Deadline theo Lớp (Class Assignments - Giảng viên)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/classes/:classId/assignments` | `[Authenticated]` | Lấy danh sách bài tập được giao cho lớp kèm trạng thái và hạn nộp |
| `GET` | `/api/v1/classes/:classId/assignments/:assignmentId` | `[Authenticated]` | Xem chi tiết bài tập của lớp (Lịch mở, Deadline, Hạn chót tuyệt đối, Cho phép nộp muộn) |
| `PUT` | `/api/v1/classes/:classId/assignments/:assignmentId/schedule` | `[Roles: teacher, admin]` | Thiết lập hoặc cập nhật lịch mở đề, deadline và chính sách nộp muộn theo lớp |

### 1.3. Phân hệ Nộp bài của Học viên (Student Submission & S3 Direct Upload)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/classes/:classId/assignments/:assignmentId/submissions/presigned-url` | `[Roles: student]` | Sinh AWS S3 Presigned URL (TTL 15 phút) để tải file bài làm trực tiếp lên S3 |
| `POST` | `/api/v1/classes/:classId/assignments/:assignmentId/submissions` | `[Roles: student]` | Xác nhận nộp bài (ghi đè bài cũ nếu nộp lại, phân loại `submitted` hoặc `late_submitted`) |
| `GET` | `/api/v1/classes/:classId/assignments/:assignmentId/my-submission` | `[Roles: student]` | Học viên xem bài làm cá nhân đã nộp (kèm link tải an toàn, điểm số và nhận xét của GV) |

### 1.4. Phân hệ Chấm điểm, Nhận xét & Tiện ích Lớp học (Teacher Grading & Utilities)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/classes/:classId/assignments/:assignmentId/submissions` | `[Roles: teacher, admin]` | Giảng viên xem danh sách bài nộp của cả lớp (lọc theo trạng thái, tìm kiếm, phân trang) |
| `GET` | `/api/v1/assignment-submissions/:id` | `[Roles: teacher, admin]` | Xem chi tiết bài nộp của 1 học viên (kèm S3 Presigned Download URL để tải/xem bài) |
| `PATCH` | `/api/v1/assignment-submissions/:id/grade` | `[Roles: teacher, admin]` | Chấm điểm thang 10 & ghi nhận xét (hỗ trợ cập nhật/chấm lại khi phúc khảo) |
| `POST` | `/api/v1/assignment-submissions/:id/request-resubmission` | `[Roles: teacher, admin]` | Giảng viên yêu cầu học viên nộp lại bài (do lỗi file, sai đề...) kèm lý do |
| `PATCH` | `/api/v1/classes/:classId/assignments/:assignmentId/submissions/bulk-grade` | `[Roles: teacher, admin]` | Giảng viên chấm điểm và nhận xét hàng loạt cho nhiều bài nộp cùng lúc |
| `GET` | `/api/v1/classes/:classId/assignments/:assignmentId/submissions/download-all` | `[Roles: teacher, admin]` | Yêu cầu tải trọn gói file ZIP nén toàn bộ bài làm của cả lớp (Đồng bộ hoặc Bất đồng bộ) |
| `GET` | `/api/v1/classes/:classId/assignments/:assignmentId/submissions/download-all/status` | `[Roles: teacher, admin]` | Kiểm tra tiến độ nén file ZIP khi xử lý bất đồng bộ qua BullMQ Queue |

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

### 2.1. Lấy danh sách khung bài tập

#### `GET /api/v1/assignments`
* **Mô tả chức năng:** Trả về danh sách khung bài tập trong khóa học có phân trang và lọc theo bài học.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang hiện tại.
  * `limit` *(number, default: 10, max: 100)*: Số bản ghi mỗi trang.
  * `lessonId` *(string UUID, optional)*: Lọc bài tập thuộc bài học cụ thể.
  * `courseId` *(string UUID, optional)*: Lọc bài tập thuộc khóa học cụ thể.
  * `search` *(string, optional)*: Tìm kiếm theo tiêu đề bài tập.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách bài tập thành công",
  "data": {
    "items": [
      {
        "id": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "title": "Xây dựng RESTful API CRUD Người dùng với NestJS & TypeORM",
        "allowedFileTypes": "pdf,zip,docx",
        "maxFileSizeMb": 25,
        "createdAt": "2026-09-24T08:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 4,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T20:10:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |

---

### 2.2. Xem thông tin chi tiết khung bài tập

#### `GET /api/v1/assignments/:id`
* **Mô tả chức năng:** Xem toàn bộ đề bài, hướng dẫn chi tiết và ràng buộc kỹ thuật của khung bài tập.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID khung bài tập.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin bài tập thành công",
  "data": {
    "id": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Xây dựng RESTful API CRUD Người dùng với NestJS & TypeORM",
    "instruction": "### Yêu cầu bài tập:\n1. Khởi tạo module `users` trong NestJS.\n2. Cấu hình kết nối PostgreSQL qua TypeORM.\n3. Viết đầy đủ các endpoint CRUD có phân trang và validate DTO bằng class-validator.\n\n**Quy cách nộp bài:** Nén toàn bộ mã nguồn vào file `.zip` (loại bỏ thư mục `node_modules`) kèm báo cáo định dạng `.pdf`.",
    "allowedFileTypes": "pdf,zip,docx",
    "maxFileSizeMb": 25,
    "createdAt": "2026-09-24T08:00:00.000Z",
    "updatedAt": "2026-09-24T08:00:00.000Z"
  },
  "timestamp": "2026-09-24T20:11:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `404` | `Not Found` | Không tìm thấy bài tập | ID không tồn tại hoặc đã bị xóa |

---

### 2.3. Tạo khung bài tập mới

#### `POST /api/v1/assignments`
* **Mô tả chức năng:** Giảng viên tạo khung bài tập gắn vào một bài học trong khóa học. Mỗi bài học dạng `assignment` chỉ được gắn duy nhất 1 khung bài tập (Quan hệ 1:1).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`CreateAssignmentDto`):
```json
{
  "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "title": "Xây dựng RESTful API CRUD Người dùng với NestJS & TypeORM",
  "instruction": "Yêu cầu hoàn thành các API Users theo tài liệu hướng dẫn và nộp file nén mã nguồn.",
  "allowedFileTypes": "pdf,zip,docx",
  "maxFileSizeMb": 25
}
```
* **Validation Rules:**
  * `lessonId`: Bắt buộc, chuỗi UUID hợp lệ trỏ tới bài học có `lessonType = assignment`.
  * `title`: Bắt buộc, độ dài từ 5 đến 255 ký tự.
  * `instruction`: Bắt buộc, nội dung mô tả/đề bài chi tiết (hỗ trợ Markdown).
  * `allowedFileTypes`: Tùy chọn, chuỗi các đuôi file phân cách bằng dấu phẩy (mặc định: `'pdf,zip,docx'`).
  * `maxFileSizeMb`: Tùy chọn, số nguyên dương từ 1 đến 100 MB (mặc định: `25`).

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo bài tập thành công",
  "data": {
    "id": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Xây dựng RESTful API CRUD Người dùng với NestJS & TypeORM",
    "allowedFileTypes": "pdf,zip,docx",
    "maxFileSizeMb": 25,
    "createdAt": "2026-09-24T20:12:00.000Z"
  },
  "timestamp": "2026-09-24T20:12:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu đầu vào không hợp lệ | Dung lượng vượt quá 100MB hoặc thiếu thông tin bắt buộc |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền tạo bài tập | Không phải giảng viên phụ trách khóa học |
| `404` | `Not Found` | Không tìm thấy bài học liên kết | `lessonId` không tồn tại |
| `409` | `Conflict` | Bài học này đã có bài tập | Mỗi bài học chỉ được gắn tối đa 1 bài tập |

---

### 2.4. Cập nhật khung bài tập

#### `PATCH /api/v1/assignments/:id`
* **Mô tả chức năng:** Cập nhật nội dung tiêu đề, đề bài, định dạng file hoặc dung lượng tối đa của khung bài tập.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID khung bài tập cần cập nhật.

#### Request Body (`UpdateAssignmentDto`):
```json
{
  "title": "Xây dựng RESTful API Người dùng (Cập nhật)",
  "maxFileSizeMb": 50,
  "allowedFileTypes": "pdf,zip,rar,docx"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật bài tập thành công",
  "data": {
    "id": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Xây dựng RESTful API Người dùng (Cập nhật)",
    "maxFileSizeMb": 50,
    "allowedFileTypes": "pdf,zip,rar,docx",
    "updatedAt": "2026-09-24T20:13:00.000Z"
  },
  "timestamp": "2026-09-24T20:13:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa bài tập này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy bài tập | `id` không tồn tại |

---

### 2.5. Xóa khung bài tập

#### `DELETE /api/v1/assignments/:id`
* **Mô tả chức năng:** Xóa mềm khung bài tập (`deleted_at = now()`).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID khung bài tập cần xóa.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa bài tập thành công",
  "data": null,
  "timestamp": "2026-09-24T20:14:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xóa bài tập này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy bài tập | `id` không tồn tại |

---

### 2.6. Lấy danh sách bài tập được giao cho lớp

#### `GET /api/v1/classes/:classId/assignments`
* **Mô tả chức năng:** Trả về danh sách tất cả các bài tập được giao cho một lớp học cụ thể kèm trạng thái hạn nộp.
  * Với Học viên trong lớp: Hiển thị thêm trạng thái bài làm cá nhân (`chưa nộp`, `đã nộp`, `nộp muộn`, `đã chấm`).
  * Với Giảng viên: Hiển thị thống kê nhanh số lượng bài nộp của cả lớp (sĩ số nộp, chưa nộp, chưa chấm).
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách bài tập của lớp thành công",
  "data": {
    "items": [
      {
        "id": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "classAssignmentId": "ca1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "title": "Xây dựng RESTful API CRUD Người dùng với NestJS & TypeORM",
        "openTime": "2026-09-20T00:00:00.000Z",
        "deadline": "2026-09-30T23:59:59.000Z",
        "cutoffTime": "2026-10-02T23:59:59.000Z",
        "allowLateSubmission": true,
        "isExpired": false,
        "mySubmission": {
          "status": "submitted",
          "submittedAt": "2026-09-24T15:30:00.000Z",
          "grade": null
        },
        "stats": {
          "totalEnrolled": 45,
          "submittedCount": 32,
          "gradedCount": 10
        }
      }
    ]
  },
  "timestamp": "2026-09-24T20:15:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn không thuộc lớp học này | Học viên chưa ghi danh vào lớp |
| `404` | `Not Found` | Không tìm thấy lớp học | `classId` không tồn tại |

---

### 2.7. Xem chi tiết bài tập của lớp

#### `GET /api/v1/classes/:classId/assignments/:assignmentId`
* **Mô tả chức năng:** Xem toàn bộ nội dung đề bài, các ràng buộc kỹ thuật và lịch nộp bài tập được cấu hình riêng cho lớp học đó.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy chi tiết bài tập lớp thành công",
  "data": {
    "id": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "classAssignmentId": "ca1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Xây dựng RESTful API CRUD Người dùng với NestJS & TypeORM",
    "instruction": "### Yêu cầu bài tập:\n1. Khởi tạo module users trong NestJS...\n2. Nộp file nén .zip.",
    "allowedFileTypes": "pdf,zip,docx",
    "maxFileSizeMb": 25,
    "openTime": "2026-09-20T00:00:00.000Z",
    "deadline": "2026-09-30T23:59:59.000Z",
    "cutoffTime": "2026-10-02T23:59:59.000Z",
    "allowLateSubmission": true,
    "isOpen": true,
    "isLatePeriod": false,
    "isClosed": false
  },
  "timestamp": "2026-09-24T20:16:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền truy cập lớp học này | Không phải giảng viên hoặc học viên trong lớp |
| `404` | `Not Found` | Không tìm thấy bài tập hoặc lớp học | ID không tồn tại |

---

### 2.8. Thiết lập / Cập nhật lịch nộp bài tập theo lớp (Schedule Assignment)

#### `PUT /api/v1/classes/:classId/assignments/:assignmentId/schedule`
* **Mô tả chức năng:** Giảng viên cấu hình hoặc điều chỉnh thời gian mở đề, hạn nộp (Deadline), hạn chót tuyệt đối (Cut-off date) và bật/tắt chính sách cho phép nộp muộn cho lớp mình phụ trách.
* **Side-effects:** Tự động kích hoạt sự kiện thông báo (Notification) đến toàn thể học viên trong lớp về hạn nộp mới hoặc sự thay đổi lịch nộp bài.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Request Body (`ScheduleClassAssignmentDto`):
```json
{
  "openTime": "2026-09-20T00:00:00.000Z",
  "deadline": "2026-09-30T23:59:59.000Z",
  "cutoffTime": "2026-10-02T23:59:59.000Z",
  "allowLateSubmission": true
}
```
* **Validation Rules:**
  * `deadline`: Bắt buộc, chuỗi thời gian ISO 8601 hợp lệ, phải lớn hơn `openTime` (nếu có).
  * `openTime`: Tùy chọn, mặc định lấy thời điểm hiện tại `now()` nếu bỏ trống.
  * `allowLateSubmission`: Boolean, mặc định `true`.
  * `cutoffTime`: Tùy chọn. Nếu `allowLateSubmission = true`, `cutoffTime` (nếu có) bắt buộc phải lớn hơn hoặc bằng `deadline`. Nếu `allowLateSubmission = false`, hệ thống tự động gán `cutoffTime = deadline`.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thiết lập lịch bài tập thành công",
  "data": {
    "classAssignmentId": "ca1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "classId": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "assignmentId": "as1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "openTime": "2026-09-20T00:00:00.000Z",
    "deadline": "2026-09-30T23:59:59.000Z",
    "cutoffTime": "2026-10-02T23:59:59.000Z",
    "allowLateSubmission": true,
    "updatedAt": "2026-09-24T20:17:00.000Z"
  },
  "timestamp": "2026-09-24T20:17:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Thời gian deadline không hợp lệ | Deadline nhỏ hơn thời gian mở đề hoặc cutoffTime nhỏ hơn deadline |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền quản lý lớp học này | Không phải giảng viên phụ trách lớp |
| `404` | `Not Found` | Không tìm thấy bài tập hoặc lớp | ID không tồn tại |

---

### 2.9. Sinh S3 Presigned URL để tải file bài làm trực tiếp

#### `POST /api/v1/classes/:classId/assignments/:assignmentId/submissions/presigned-url`
* **Mô tả chức năng:** Học viên yêu cầu hệ thống cấp một đường dẫn tải lên AWS S3 an toàn có gắn chữ ký tạm thời (**S3 Presigned PUT URL**, hạn dùng 15 phút). Trình duyệt frontend sẽ tải file binary trực tiếp lên AWS S3 mà không đi qua backend, ngăn chặn hoàn toàn việc làm nghẽn CPU và băng thông của NestJS server ([`SEQ-ASSIGN-001`](../sequences/seq-assign-001.md)).
* **Quy chuẩn bảo mật chữ ký S3 (Security Requirements):**
  * Backend **bắt buộc** ràng buộc `ContentType` và `ContentLength` ngay trong lệnh ký URL (`PutObjectCommand({ ContentType: dto.contentType, ContentLength: dto.fileSize })`).
  * **Yêu cầu đối với Frontend:** Khi gọi lệnh HTTP `PUT` tải file lên S3 theo `uploadUrl`, Request Header `Content-Type` gửi lên S3 **phải khớp chính xác 100%** với `contentType` đã đăng ký khi xin chữ ký. Nếu sai khác, AWS S3 sẽ từ chối tải tệp với mã lỗi `403 SignatureDoesNotMatch`.
* **Quyền hạn:** `[Roles: student]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Request Body (`GetSubmissionPresignedUrlDto`):
```json
{
  "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
  "fileSize": 15420000,
  "contentType": "application/pdf"
}
```
* **Validation Rules:**
  * `fileName`: Bắt buộc, tên file gốc kèm đuôi mở rộng hợp lệ theo cấu hình `allowedFileTypes` (ví dụ: `.pdf`, `.zip`, `.docx`).
  * `fileSize`: Bắt buộc, dung lượng tính bằng byte, phải $\le$ `maxFileSizeMb * 1024 * 1024`.
  * `contentType`: Bắt buộc, MIME type hợp lệ (ví dụ: `application/pdf`, `application/zip`, `application/x-zip-compressed`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Khởi tạo URL tải tệp S3 thành công",
  "data": {
    "uploadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/assignments/cl1a2/as1a2/std1a2/1727209200_Bao_Cao_Nhom_5.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...",
    "fileKey": "assignments/cl1a2/as1a2/std1a2/1727209200_Bao_Cao_Nhom_5.pdf",
    "expiresInSeconds": 900
  },
  "timestamp": "2026-09-24T20:18:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Định dạng tệp không được hỗ trợ | Đuôi file hoặc MIME type không nằm trong danh mục cho phép |
| `400` | `Bad Request` | Dung lượng tệp vượt quá giới hạn | File lớn hơn mức `maxFileSizeMb` cấu hình cho bài tập |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bài tập đã đóng nhận bài | Quá `cutoffTime` hoặc quá `deadline` mà `allowLateSubmission = false` |
| `403` | `Forbidden` | Bạn chưa ghi danh vào lớp học này | Học viên không thuộc lớp học |

---

### 2.10. Xác nhận nộp bài tập (Confirm Submission & Resubmission)

#### `POST /api/v1/classes/:classId/assignments/:assignmentId/submissions`
* **Mô tả chức năng:** Sau khi Frontend tải file thành công lên S3 bằng Presigned URL, client gọi API này để hệ thống:
  1. Kiểm tra sự tồn tại của tệp trên S3 (`HeadObjectCommand`).
  2. So sánh mốc thời gian hiện tại với `deadline` để phân loại trạng thái: `submitted` (Đúng hạn) hoặc `late_submitted` (Nộp muộn).
  3. **Cơ chế Nộp lại (Resubmission):**
     * Trường hợp 1 (Học viên tự đổi file): Nếu bài chưa được chấm (`grade IS NULL`) và còn trong hạn cho phép nộp.
     * Trường hợp 2 (Giảng viên yêu cầu nộp lại): Bài nộp đang ở trạng thái `resubmission_requested` (được phép nộp lại kể cả khi đã có điểm cũ hoặc đã quá deadline thông thường).
     * Khi nộp lại, hệ thống ghi đè thông tin bản ghi cũ, đồng thời gọi lệnh xóa tệp cũ trên S3 (`DeleteObjectCommand`) để tránh lãng phí dung lượng lưu trữ.
  4. **Kích hoạt tiến độ học tập (Side-effects):** Tự động ghi nhận hoặc cập nhật bản ghi vào bảng `lesson_progress` liên kết với bài học tương ứng (`is_completed = true`, `completed_at = now()`).
* **Quyền hạn:** `[Roles: student]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Request Body (`ConfirmSubmissionDto`):
```json
{
  "fileKey": "assignments/cl1a2/as1a2/std1a2/1727209200_Bao_Cao_Nhom_5.pdf",
  "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
  "fileSize": 15420000,
  "studentNote": "Em gửi bài làm báo cáo nhóm 5 kèm link demo sản phẩm ạ."
}
```

#### Response Thành Công — Nộp đúng hạn (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Nộp bài tập thành công!",
  "data": {
    "submissionId": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
    "fileSize": 15420000,
    "status": "submitted",
    "isLate": false,
    "lateDurationMinutes": 0,
    "submittedAt": "2026-09-24T20:20:00.000Z",
    "isResubmission": false
  },
  "timestamp": "2026-09-24T20:20:00.000Z"
}
```

#### Phản hồi khi Nộp muộn hợp lệ (`status = late_submitted`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Nộp bài tập thành công (Ghi nhận nộp muộn)!",
  "data": {
    "submissionId": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
    "status": "late_submitted",
    "isLate": true,
    "lateDurationMinutes": 135,
    "submittedAt": "2026-10-01T02:15:00.000Z",
    "isResubmission": true
  },
  "timestamp": "2026-10-01T02:15:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tệp chưa được tải lên máy chủ lưu trữ | S3 chưa tồn tại file với `fileKey` này |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bài tập đã hết hạn nộp và không cho phép nộp muộn | Quá hạn `deadline` khi `allowLateSubmission = false` |
| `403` | `Forbidden` | Bài tập đã khóa hoàn toàn | Quá hạn chót tuyệt đối `cutoffTime` |
| `403` | `Forbidden` | Bài tập đã được chấm, không thể nộp lại | Giảng viên đã chấm điểm và chưa gửi yêu cầu nộp lại |

---

### 2.11. Học viên xem bài làm cá nhân đã nộp

#### `GET /api/v1/classes/:classId/assignments/:assignmentId/my-submission`
* **Mô tả chức năng:** Học viên xem lại file bài nộp của chính mình, trạng thái nộp, điểm số và lời phê nhận xét của giảng viên. Tự động sinh **S3 Presigned GET URL** (hạn dùng 30 phút) để học viên có thể click tải/xem lại file bài làm an toàn từ private bucket. Hỗ trợ hiển thị cảnh báo nếu giảng viên yêu cầu nộp lại bài.
* **Quyền hạn:** `[Roles: student]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Response Thành Công — Bài đã được chấm (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin bài nộp thành công",
  "data": {
    "hasSubmitted": true,
    "submission": {
      "id": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
      "fileSize": 15420000,
      "downloadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/assignments/...pdf?X-Amz-Signature=...",
      "studentNote": "Em gửi bài làm báo cáo nhóm 5.",
      "submittedAt": "2026-09-24T20:20:00.000Z",
      "status": "graded",
      "grade": "9.50",
      "feedback": "Báo cáo trình bày rất sạch đẹp, cấu trúc NestJS module chuẩn chỉ, có validation đầy đủ. Rất tốt!",
      "gradedAt": "2026-09-25T09:00:00.000Z",
      "canResubmit": false,
      "resubmissionReason": null
    }
  },
  "timestamp": "2026-09-25T10:00:00.000Z"
}
```

#### Phản hồi khi Giảng viên Yêu Cầu Nộp Lại (`status = resubmission_requested`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin bài nộp thành công",
  "data": {
    "hasSubmitted": true,
    "submission": {
      "id": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "fileName": "Bao_Cao_Nhom_5_Loi.zip",
      "fileSize": 1204000,
      "downloadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/assignments/...",
      "submittedAt": "2026-09-24T18:00:00.000Z",
      "status": "resubmission_requested",
      "grade": null,
      "feedback": null,
      "canResubmit": true,
      "resubmissionReason": "File nén .zip của em bị lỗi định dạng Corrupted không giải nén được. Em nộp lại file mới trước 23h59 hôm nay nhé."
    }
  },
  "timestamp": "2026-09-25T10:00:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn chưa tham gia lớp học này | Học viên không thuộc lớp |

---

### 2.12. Giảng viên xem danh sách bài nộp của cả lớp

#### `GET /api/v1/classes/:classId/assignments/:assignmentId/submissions`
* **Mô tả chức năng:** Giảng viên xem danh sách toàn bộ bài làm của học viên trong lớp phục vụ quản lý và chấm điểm. Hỗ trợ tìm kiếm theo tên học viên, lọc theo trạng thái (`submitted`, `late_submitted`, `graded`, `resubmission_requested`, `missing` - chưa nộp) và phân trang.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang hiện tại.
  * `limit` *(number, default: 20, max: 100)*: Số bản ghi mỗi trang.
  * `status` *(string, optional)*: Lọc theo trạng thái (`submitted`, `late_submitted`, `graded`, `resubmission_requested`, `missing`).
  * `search` *(string, optional)*: Tìm kiếm theo họ tên hoặc email học viên.
  * `sortBy` *(string, default: `submittedAt`)*: Cột sắp xếp (`submittedAt`, `studentName`, `grade`).
  * `sortOrder` *(string, default: `DESC`)*: Thứ tự (`ASC`, `DESC`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách bài nộp thành công",
  "data": {
    "items": [
      {
        "submissionId": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "student": {
          "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
          "fullName": "Nguyễn Văn A",
          "email": "student1@eduverse.edu.vn",
          "avatarUrl": "https://s3.amazonaws.com/...avatar.png"
        },
        "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
        "fileSize": 15420000,
        "submittedAt": "2026-09-24T20:20:00.000Z",
        "status": "graded",
        "isLate": false,
        "grade": "9.50"
      },
      {
        "submissionId": "sm3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
        "student": {
          "id": "u3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e",
          "fullName": "Lê Văn C",
          "email": "student3@eduverse.edu.vn",
          "avatarUrl": null
        },
        "fileName": "Bai_Tap_Loi.zip",
        "fileSize": 520000,
        "submittedAt": "2026-09-24T19:00:00.000Z",
        "status": "resubmission_requested",
        "isLate": false,
        "grade": null
      },
      {
        "submissionId": null,
        "student": {
          "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
          "fullName": "Trần Thị B",
          "email": "student2@eduverse.edu.vn",
          "avatarUrl": null
        },
        "fileName": null,
        "fileSize": null,
        "submittedAt": null,
        "status": "missing",
        "isLate": false,
        "grade": null
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "summary": {
      "totalEnrolled": 45,
      "submittedCount": 37,
      "lateCount": 4,
      "gradedCount": 15,
      "resubmissionRequestedCount": 1,
      "missingCount": 7
    }
  },
  "timestamp": "2026-09-25T10:05:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xem danh sách này | Không phải giảng viên phụ trách lớp |
| `404` | `Not Found` | Không tìm thấy bài tập hoặc lớp | ID không tồn tại |

---

### 2.13. Xem chi tiết bài nộp của một học viên

#### `GET /api/v1/assignment-submissions/:id`
* **Mô tả chức năng:** Giảng viên mở giao diện thẩm định bài làm của 1 học viên cụ thể. Trả về thông tin sinh viên, ghi chú, đường dẫn tải file an toàn từ S3 (Presigned GET URL có chữ ký), điểm số hiện tại và lịch sử nhận xét.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bản ghi nộp bài (`submissionId`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy chi tiết bài nộp thành công",
  "data": {
    "id": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "student": {
      "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
      "fullName": "Nguyễn Văn A",
      "email": "student1@eduverse.edu.vn"
    },
    "fileName": "Bao_Cao_Nhom_5_EduVerse.pdf",
    "fileSize": 15420000,
    "downloadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/assignments/...pdf?X-Amz-Signature=...",
    "studentNote": "Em gửi bài làm báo cáo nhóm 5 ạ.",
    "submittedAt": "2026-09-24T20:20:00.000Z",
    "status": "submitted",
    "isLate": false,
    "lateDurationMinutes": 0,
    "grade": null,
    "feedback": null,
    "gradedAt": null
  },
  "timestamp": "2026-09-25T10:10:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền chấm bài này | Không phải giảng viên phụ trách lớp học tương ứng |
| `404` | `Not Found` | Không tìm thấy bản ghi bài nộp | `id` không tồn tại |

---

### 2.14. Giảng viên chấm điểm & nhận xét bài nộp

#### `PATCH /api/v1/assignment-submissions/:id/grade`
* **Mô tả chức năng:** Giảng viên nhập điểm số theo thang điểm 10 và viết lời phê, nhận xét cho bài làm của học viên. Cập nhật trạng thái bài nộp sang `graded`. Hỗ trợ chấm lại (sửa đổi điểm và nhận xét khi học viên phúc khảo) ([`UC-GRADE-002`](../use-cases/actor-teacher.md#uc-grade-002)).
* **Kích hoạt sự kiện (Side-effects):**
  1. Tự động gửi thông báo (Notification) In-app & Email cho học viên: *"Giảng viên đã chấm điểm bài tập của bạn (Điểm: [X]/10)"*.
  2. Đồng bộ tiến độ bài học: Cập nhật hoặc đảm bảo bản ghi trong bảng `lesson_progress` đạt trạng thái `is_completed = true`.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bản ghi bài nộp cần chấm.

#### Request Body (`GradeSubmissionDto`):
```json
{
  "grade": 9.5,
  "feedback": "Mã nguồn tổ chức rất gọn gàng, áp dụng đúng chuẩn RESTful API và có Unit Test mẫu. Cần chú ý thêm chỉ mục Database cho các trường tìm kiếm."
}
```
* **Validation Rules:**
  * `grade`: Bắt buộc, số thực trong khoảng từ `0.0` đến `10.0` (thang điểm 10, tối đa 2 chữ số thập phân).
  * `feedback`: Tùy chọn, chuỗi văn bản lời phê / nhận xét tối đa 2000 ký tự.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Chấm điểm bài tập thành công",
  "data": {
    "id": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "grade": "9.50",
    "feedback": "Mã nguồn tổ chức rất gọn gàng, áp dụng đúng chuẩn RESTful API...",
    "status": "graded",
    "gradedBy": "u9f8e7d6-5c4b-3a2b-1c0d-9e8f7a6b5c4d",
    "gradedAt": "2026-09-25T10:15:00.000Z"
  },
  "timestamp": "2026-09-25T10:15:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Điểm số không hợp lệ | Điểm < 0.0 hoặc > 10.0 |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền chấm bài này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy bản ghi bài nộp | `id` không tồn tại |

---

### 2.15. Giảng viên yêu cầu học viên nộp lại bài (Request Resubmission)

#### `POST /api/v1/assignment-submissions/:id/request-resubmission`
* **Mô tả chức năng:** Nếu bài làm của học viên bị hỏng file, sai định dạng hoặc nộp nhầm đề, giảng viên sử dụng chức năng này để yêu cầu học viên làm lại và nộp lại file mới ([`UC-GRADE-002`](../use-cases/actor-teacher.md#uc-grade-002)).
* **Cơ chế xử lý:**
  1. Cập nhật trạng thái bài nộp sang `resubmission_requested`, xóa điểm cũ (nếu có), lưu lý do yêu cầu vào trường `feedback`.
  2. Mở quyền đặc cách cho học viên này được phép tải file thay thế lên S3 và gọi `POST /submissions` xác nhận, **bỏ qua ràng buộc đã hết hạn nộp hoặc đã từng có điểm**.
* **Kích hoạt sự kiện (Side-effects):** Bắn thông báo khẩn cấp (Push Notification & Email) đến học viên kèm lý do yêu cầu nộp lại của giảng viên.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bản ghi bài nộp.

#### Request Body (`RequestResubmissionDto`):
```json
{
  "reason": "File nén .zip của em bị lỗi định dạng Corrupted không giải nén được. Em nộp lại file mới trước 23h59 hôm nay nhé."
}
```
* **Validation Rules:**
  * `reason`: Bắt buộc, chuỗi văn bản giải thích lý do, độ dài từ 10 đến 1000 ký tự.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã gửi yêu cầu nộp lại bài tập tới học viên",
  "data": {
    "id": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "status": "resubmission_requested",
    "resubmissionReason": "File nén .zip của em bị lỗi định dạng Corrupted không giải nén được. Em nộp lại file mới trước 23h59 hôm nay nhé.",
    "requestedAt": "2026-09-25T10:18:00.000Z"
  },
  "timestamp": "2026-09-25T10:18:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Lý do yêu cầu nộp lại không hợp lệ | Thiếu nội dung lý do hoặc dưới 10 ký tự |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền thao tác trên bài nộp này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy bản ghi bài nộp | `id` không tồn tại |

---

### 2.16. Chấm điểm & nhận xét hàng loạt (Bulk Grade)

#### `PATCH /api/v1/classes/:classId/assignments/:assignmentId/submissions/bulk-grade`
* **Mô tả chức năng:** Giảng viên chấm điểm và nhập nhận xét cho nhiều bài nộp cùng lúc trong một Transaction CSDL (ví dụ: sau khi chấm offline trên file Excel hoặc chấm nhanh dạng danh sách bảng).
* **Side-effects:** Tự động phát thông báo điểm số cho tất cả các học viên có bài nộp được cập nhật điểm trong đợt này.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Request Body (`BulkGradeSubmissionsDto`):
```json
{
  "grades": [
    {
      "submissionId": "sm1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "grade": 9.5,
      "feedback": "Rất tốt!"
    },
    {
      "submissionId": "sm2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "grade": 8.0,
      "feedback": "Cần bổ sung thêm Swagger documentation."
    }
  ]
}
```
* **Validation Rules:**
  * `grades`: Bắt buộc, mảng chứa từ 1 đến 100 đối tượng chấm điểm.
  * Mỗi đối tượng gồm `submissionId` hợp lệ, `grade` từ `0.0` đến `10.0`, và `feedback` tùy chọn.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Chấm điểm hàng loạt thành công",
  "data": {
    "totalUpdated": 2
  },
  "timestamp": "2026-09-25T10:20:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu mảng chấm điểm không hợp lệ | Điểm số ngoài khoảng hoặc mảng rỗng |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền chấm bài lớp này | Không phải giảng viên phụ trách |

---

### 2.17. Tải trọn gói toàn bộ bài làm cả lớp dạng file ZIP (Download All Submissions)

#### `GET /api/v1/classes/:classId/assignments/:assignmentId/submissions/download-all`
* **Mô tả chức năng:** Giảng viên yêu cầu tải trọn bộ file bài làm của tất cả sinh viên trong lớp để chấm offline.
  * **Xử lý Linh hoạt (Hybrid Strategy):**
    * Nếu tổng dung lượng nhỏ ($\le 50\text{MB}$) hoặc file ZIP của lớp đã có sẵn trong S3 Cache: Hệ thống xử lý đồng bộ và trả về ngay `200 OK` kèm link tải.
    * Nếu tổng dung lượng lớn ($> 50\text{MB}$) hoặc chưa được nén: Hệ thống trả về `202 Accepted` kèm `jobId`, đẩy tác vụ nén vào hàng đợi nền **BullMQ (Redis Queue)** để tránh treo HTTP server hoặc gây lỗi `504 Gateway Timeout`.
* **Quy chuẩn đặt tên tệp bên trong ZIP:** `[MSSV]_[HoTen]_[TenFileGoc]` (Ví dụ: `B22DCCN001_NguyenVanA_BaoCao.pdf`).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).

#### Response Thành Công — Trả về link ngay (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Khởi tạo file nén bài nộp thành công",
  "data": {
    "status": "ready",
    "zipDownloadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/exports/cl1a2_as1a2_all_submissions.zip?X-Amz-Signature=...",
    "totalFiles": 38,
    "totalSizeMb": 42.5,
    "expiresInSeconds": 1800
  },
  "timestamp": "2026-09-25T10:25:00.000Z"
}
```

#### Response Đang xử lý ở hàng đợi nền (`202 Accepted`):
```json
{
  "success": true,
  "statusCode": 202,
  "message": "Tác vụ nén file ZIP đang được xử lý trong nền",
  "data": {
    "status": "processing",
    "jobId": "job_zip_cl1a2_as1a2_1727210700",
    "totalFiles": 45,
    "estimatedSeconds": 45,
    "checkStatusUrl": "/api/v1/classes/cl1a2/assignments/as1a2/submissions/download-all/status?jobId=job_zip_cl1a2_as1a2_1727210700"
  },
  "timestamp": "2026-09-25T10:25:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Chưa có bài nộp nào để tải về | Không có học viên nào nộp bài |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền tải bài làm lớp này | Không phải giảng viên phụ trách |

---

### 2.18. Kiểm tra tiến độ nén file ZIP (Check ZIP Job Status)

#### `GET /api/v1/classes/:classId/assignments/:assignmentId/submissions/download-all/status`
* **Mô tả chức năng:** Frontend gọi thăm dò (polling mỗi 3-5 giây) hoặc nhận sự kiện WebSocket kiểm tra xem tiến trình nén file ZIP ở hàng đợi BullMQ đã hoàn thành hay chưa.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `classId` *(string UUID, required)*: ID lớp học.
  * `assignmentId` *(string UUID, required)*: ID khung bài tập (`assignments.id`).
* **Query Parameters:**
  * `jobId` *(string, required)*: ID tiến trình nén trả về từ API `202 Accepted`.

#### Response khi Đang xử lý (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tiến trình nén đang diễn ra",
  "data": {
    "jobId": "job_zip_cl1a2_as1a2_1727210700",
    "status": "processing",
    "progressPercent": 65
  },
  "timestamp": "2026-09-25T10:25:30.000Z"
}
```

#### Response khi Hoàn tất (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nén file bài làm thành công",
  "data": {
    "jobId": "job_zip_cl1a2_as1a2_1727210700",
    "status": "completed",
    "progressPercent": 100,
    "zipDownloadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/exports/cl1a2_as1a2_all_submissions.zip?X-Amz-Signature=...",
    "totalSizeMb": 380.2,
    "expiresInSeconds": 1800
  },
  "timestamp": "2026-09-25T10:26:00.000Z"
}
```

---

## 3. Ghi Chú Kỹ Thuật & Nghiệp Vụ Module Assignments

- **Kiến trúc Tải lên trực tiếp AWS S3 (S3 Direct Upload qua Presigned URL):**
  - **Vấn đề nghẽn cổ chai (Bottleneck):** Nếu học viên upload file 25–50MB qua server NestJS, server sẽ chịu tải I/O cực lớn và nghẽn băng thông khi 50–100 học viên nộp bài cùng lúc trước giờ deadline.
  - **Giải pháp:** Client chỉ gửi metadata (`fileName`, `fileSize`, `contentType`) lên NestJS để nhận **S3 Presigned PUT URL** (TTL 15 phút). Trình duyệt sẽ thực hiện HTTP `PUT` đẩy nhị phân trực tiếp lên AWS S3. Sau khi upload thành công, client gọi API Confirm để backend ghi nhận CSDL ([`SEQ-ASSIGN-001`](../sequences/seq-assign-001.md)).
- **Bảo mật File trên AWS S3 (Private Bucket Security):**
  - Toàn bộ S3 Bucket chứa bài nộp của học viên bắt buộc để chế độ **Private**, chặn truy cập Public toàn bộ (`Block Public Access: ON`).
  - Khi Giảng viên hoặc Học viên xem/tải bài làm, Backend sử dụng AWS SDK v3 (`@aws-sdk/s3-request-presigner`) để sinh **Presigned GET URL** có hạn dùng 15–30 phút. Học viên không thể đoán link để xem trộm bài làm của người khác.
  - **Ràng buộc Content-Type Strict Signature:** Khi ký `PutObjectCommand`, backend luôn gắn chặt `ContentType` và `ContentLength`. Frontend bắt buộc gửi header `Content-Type` khớp hoàn toàn với MIME type đã đăng ký để tránh bị S3 trả mã `403 SignatureDoesNotMatch`.
- **Ánh xạ Dữ liệu CSDL (`file_url` vs `fileKey`):**
  - Cột `file_url` trong bảng `assignment_submissions` ([`schema.md`](../database/schema.md#17-bảng-assignment_submissions-bài-làm-đã-nộp)) thực chất lưu trữ **S3 Object Key** (hoặc `s3://bucket/key`).
  - Hệ thống không bao giờ lưu URL trực tiếp có chữ ký vào Database vì chữ ký S3 sẽ hết hạn sau thời gian TTL. Mỗi khi Client gọi API xem chi tiết (`GET /my-submission` hoặc `GET /assignment-submissions/:id`), Backend sẽ dynamically sinh ra URL chữ ký mới.
- **Chính sách Nộp lại & Dọn dẹp rác S3 (Resubmission & Garbage Collection):**
  - **Học viên tự đổi file:** Cho phép nộp đè khi bài chưa được chấm và còn trong hạn nộp.
  - **Giảng viên yêu cầu nộp lại (`resubmission_requested`):** Đặc cách cho phép học viên nộp lại bài khi file bị lỗi hoặc cần sửa đổi kể cả khi bài đã quá deadline thông thường.
  - Khi nộp lại bài thành công, Backend tự động gọi lệnh `s3.send(new DeleteObjectCommand({ Bucket, Key: oldFileKey }))` để xóa vĩnh viễn file cũ trên S3, giúp tiết kiệm chi phí lưu trữ đám mây.
- **Tính toán Nộp muộn (Late Calculation) & Khóa bài tuyệt đối (Cut-off Date):**
  - Khi nhận yêu cầu xác nhận nộp bài (`POST /submissions`), backend kiểm tra thời gian:
    - Nếu $\text{now} \le \text{deadline}$: Gán `status = 'submitted'`, `isLate = false`.
    - Nếu $\text{deadline} < \text{now} \le \text{cutoffTime}$ và $\text{allowLateSubmission} = \text{true}$: Gán `status = 'late_submitted'`, tính số phút muộn:
      $$\text{lateDurationMinutes} = \text{Math.floor}\left( \frac{\text{now} - \text{deadline}}{60000} \right)$$
    - Nếu $\text{now} > \text{cutoffTime}$ (hoặc quá deadline mà `allowLateSubmission = false`): Từ chối nhận bài (`403 Forbidden`). Ngoại lệ duy nhất là học viên được Giảng viên mở cờ `resubmission_requested`.
- **Tự động Cập nhật Tiến độ Học tập (`lesson_progress`):**
  - Ngay khi học viên nộp bài thành công (`POST /submissions`), hệ thống thực hiện Upsert vào bảng `lesson_progress` với `is_completed = true` và `completed_at = now()`, cập nhật tức thì tỷ lệ hoàn thành khóa học của học viên.
- **Xử lý Nén tệp ZIP cho cả lớp qua Hàng đợi nền (BullMQ Queue):**
  - Với tệp nén lớn (> 50MB), tác vụ được tách khỏi luồng HTTP chính, đưa vào Queue `zip-submissions-queue` do Redis quản lý. 
  - Worker tiến hành stream từng file từ S3 qua thư viện `archiver`, nén trực tiếp lên S3 multipart upload. Sau khi nén xong, hệ thống gửi thông báo WebSocket/Email thông báo file ZIP đã sẵn sàng cho Giảng viên tải về.
