# 🏫 Đặc Tả API: Module Lớp Học & Ghi Danh — api-classes.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`actor-student.md`](../use-cases/actor-student.md#uc-class-001), [`actor-teacher.md`](../use-cases/actor-teacher.md)  
> **Base Path:** `/api/v1/classes`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ quản lý Lớp học, tạo mã tham gia (Class Code), Học viên ghi danh bằng mã, và quản lý danh sách học viên trong lớp.

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Phân hệ Quản lý Lớp học (Class Lifecycle)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/classes` | `[Authenticated]` | Lấy danh sách lớp học (phân trang, lọc theo khóa học, trạng thái) |
| `GET` | `/api/v1/classes/my-classes` | `[Authenticated]` | Lấy danh sách các lớp của người dùng hiện tại (học viên hoặc giảng viên) |
| `GET` | `/api/v1/classes/:id` | `[Authenticated]` | Xem thông tin chi tiết lớp học (thông tin giảng viên, sĩ số hiện tại) |
| `POST` | `/api/v1/classes` | `[Roles: teacher, training_manager, admin]` | Mở lớp học mới dựa trên khóa học đã công khai (`published`) |
| `PATCH` | `/api/v1/classes/:id` | `[Roles: teacher, training_manager, admin]` | Cập nhật thông tin lớp học (tên, ngày bắt đầu/kết thúc, trạng thái) |
| `DELETE` | `/api/v1/classes/:id` | `[Roles: teacher, training_manager, admin]` | Xóa mềm lớp học |
| `POST` | `/api/v1/classes/:id/regenerate-code` | `[Roles: teacher, admin]` | Làm mới mã tham gia lớp học (khi mã cũ bị rò rỉ) |

### 1.2. Phân hệ Ghi danh & Quản lý Thành viên (Enrollment & Members)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/classes/enroll` | `[Roles: student]` | Học viên tham gia lớp học bằng mã Class Code (`UC-CLASS-001`) |
| `GET` | `/api/v1/classes/:id/members` | `[Authenticated]` | Lấy danh sách học viên trong lớp học (phân trang, tìm kiếm) |
| `POST` | `/api/v1/classes/:id/members` | `[Roles: teacher, admin]` | Thêm học viên thủ công vào lớp bằng địa chỉ email |
| `DELETE` | `/api/v1/classes/:id/members/:studentId` | `[Roles: teacher, admin]` | Xóa học viên khỏi lớp học (chuyển trạng thái `dropped`) |

### 1.3. Phân hệ Thống Kê Tiến Độ & Bảng Điểm (Progress & Grade Reports)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/classes/:id/progress` | `[Roles: teacher, training_manager, admin]` | Báo cáo thống kê tiến độ học tập của cả lớp (`UC-PROGRESS-003`) |
| `GET` | `/api/v1/classes/:id/grades/export-excel` | `[Roles: teacher, training_manager, admin]` | Xuất bảng điểm tổng hợp của lớp ra file Excel/CSV (`UC-GRADE-003`) |

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

### 2.1. Lấy danh sách lớp học chung

#### `GET /api/v1/classes`
* **Mô tả chức năng:** Trả về danh sách lớp học trong hệ thống có phân trang, tìm kiếm theo tên và lọc theo khóa học hoặc trạng thái.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Query Parameters:**
  * `page` *(number, default: 1)*: Số trang.
  * `limit` *(number, default: 10, max: 100)*: Số bản ghi mỗi trang.
  * `search` *(string, optional)*: Từ khóa tìm kiếm theo tên lớp học.
  * `courseId` *(string UUID, optional)*: Lọc lớp học theo khóa học cụ thể.
  * `status` *(string, optional)*: Lọc theo trạng thái (`active`, `paused`, `closed`).
  * `teacherId` *(string UUID, optional)*: Lọc lớp theo giảng viên phụ trách.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách lớp học thành công",
  "data": {
    "items": [
      {
        "id": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "name": "Lập trình Web React & NestJS - Khóa K2026A",
        "classCode": "WEB2026A",
        "status": "active",
        "startDate": "2026-10-01",
        "endDate": "2026-12-31",
        "totalStudents": 35,
        "course": {
          "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
          "title": "Lập trình Web với React & NestJS",
          "thumbnailUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/thumbnails/course-web.jpg"
        },
        "teacher": {
          "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
          "fullName": "ThS. Trần Thị Giảng Viên",
          "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher-1.jpg"
        },
        "createdAt": "2026-09-22T08:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 8,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T11:10:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |

---

### 2.2. Lấy danh sách lớp học của người dùng hiện tại (My Classes)

#### `GET /api/v1/classes/my-classes`
* **Mô tả chức năng:**
  * Nếu người đăng nhập là **Học viên (`student`)**: Trả về các lớp học mà học viên đã ghi danh thành công (`status: active`).
  * Nếu người đăng nhập là **Giảng viên (`teacher`)**: Trả về các lớp học do chính giảng viên này phụ trách giảng dạy.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách lớp học cá nhân thành công",
  "data": [
    {
      "id": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "name": "Lập trình Web React & NestJS - Khóa K2026A",
      "classCode": "WEB2026A",
      "status": "active",
      "startDate": "2026-10-01",
      "endDate": "2026-12-31",
      "course": {
        "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
        "title": "Lập trình Web với React & NestJS",
        "thumbnailUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/thumbnails/course-web.jpg"
      },
      "teacher": {
        "fullName": "ThS. Trần Thị Giảng Viên"
      },
      "enrolledAt": "2026-09-23T14:20:00.000Z"
    }
  ],
  "timestamp": "2026-09-24T11:12:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc không hợp lệ |

---

### 2.3. Xem thông tin chi tiết một lớp học

#### `GET /api/v1/classes/:id`
* **Mô tả chức năng:** Trả về thông tin chi tiết của một lớp học, bao gồm đề cương khóa học gốc, giảng viên và sĩ số.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:** `id` (UUID lớp học)

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin lớp học thành công",
  "data": {
    "id": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "name": "Lập trình Web React & NestJS - Khóa K2026A",
    "classCode": "WEB2026A",
    "status": "active",
    "startDate": "2026-10-01",
    "endDate": "2026-12-31",
    "totalStudents": 35,
    "course": {
      "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
      "title": "Lập trình Web với React & NestJS",
      "slug": "lap-trinh-web-voi-react-nestjs"
    },
    "teacher": {
      "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
      "fullName": "ThS. Trần Thị Giảng Viên",
      "email": "teacher@eduverse.edu.vn",
      "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher-1.jpg"
    }
  },
  "timestamp": "2026-09-24T11:15:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `404` | `Not Found` | Không tìm thấy lớp học | ID lớp học không tồn tại hoặc đã bị xóa |

---

### 2.4. Mở lớp học mới

#### `POST /api/v1/classes`
* **Mô tả chức năng:** Mở lớp học mới dựa trên một khóa học đã được phê duyệt (`status: published`). Giảng viên tự động được gán làm người phụ trách (hoặc Quản lý chỉ định `teacherId`). Nếu không truyền `classCode`, hệ thống tự sinh mã 6 ký tự ngẫu nhiên.
* **Quyền hạn:** `[Roles: teacher, training_manager, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`CreateClassDto`):
```json
{
  "courseId": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
  "name": "Lập trình Web React & NestJS - Khóa K2026A",
  "classCode": "WEB2026A",
  "teacherId": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "startDate": "2026-10-01",
  "endDate": "2026-12-31"
}
```
* **Validation Rules:**
  * `courseId`: Bắt buộc, UUID hợp lệ của khóa học đã `published`.
  * `name`: Bắt buộc, độ dài từ 5 đến 255 ký tự.
  * `classCode` *(tùy chọn)*: Độ dài từ 4 đến 20 ký tự chữ và số, viết hoa, không chứa khoảng trắng. Nếu trống, hệ thống tự sinh 6 ký tự.
  * `teacherId` *(tùy chọn với Quản lý, Giảng viên tự động lấy id của mình)*.
  * `startDate` & `endDate` *(tùy chọn)*: Định dạng `YYYY-MM-DD`, `endDate >= startDate`.

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo lớp học thành công",
  "data": {
    "id": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "name": "Lập trình Web React & NestJS - Khóa K2026A",
    "classCode": "WEB2026A",
    "status": "active",
    "createdAt": "2026-09-24T11:18:00.000Z"
  },
  "timestamp": "2026-09-24T11:18:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Khóa học chưa được công khai | Chỉ được mở lớp cho khóa học có status `published` |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền tạo lớp học | Tài khoản không có vai trò phù hợp |
| `409` | `Conflict` | Mã lớp học đã tồn tại | `classCode` bị trùng lặp với một lớp đang hoạt động khác |

---

### 2.5. Cập nhật thông tin lớp học

#### `PATCH /api/v1/classes/:id`
* **Mô tả chức năng:** Cập nhật tên lớp học, ngày bắt đầu/kết thúc hoặc đổi trạng thái (`active` $\rightarrow$ `paused` hoặc `closed`).
* **Quyền hạn:** `[Roles: teacher, training_manager, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`UpdateClassDto`):
```json
{
  "name": "Lập trình Web React & NestJS - Khóa K2026A (Mở rộng)",
  "status": "active",
  "endDate": "2027-01-15"
}
```
* **Validation Rules:**
  * `name` *(tùy chọn)*: Độ dài từ 5 đến 255 ký tự.
  * `status` *(tùy chọn)*: Chỉ nhận một trong các giá trị: `active`, `paused`, `closed`.
  * `endDate` *(tùy chọn)*: Định dạng `YYYY-MM-DD`, phải sau `startDate`.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật lớp học thành công",
  "data": {
    "id": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "name": "Lập trình Web React & NestJS - Khóa K2026A (Mở rộng)",
    "status": "active",
    "endDate": "2027-01-15",
    "updatedAt": "2026-09-24T11:20:00.000Z"
  },
  "timestamp": "2026-09-24T11:20:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu không hợp lệ | Giá trị trạng thái hoặc ngày kết thúc sai format |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa lớp học này | Không phải giảng viên phụ trách hoặc quản trị viên |
| `404` | `Not Found` | Không tìm thấy lớp học | ID không tồn tại |

---

### 2.6. Xóa mềm lớp học

#### `DELETE /api/v1/classes/:id`
* **Mô tả chức năng:** Xóa mềm lớp học (`deleted_at = now()`). Mã lớp `classCode` của lớp bị xóa sẽ được giải phóng.
* **Quyền hạn:** `[Roles: teacher, training_manager, admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa lớp học thành công",
  "data": null,
  "timestamp": "2026-09-24T11:21:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xóa lớp học này | Không phải giảng viên phụ trách hoặc quản trị viên |
| `404` | `Not Found` | Không tìm thấy lớp học | ID không tồn tại |

---

### 2.7. Làm mới mã tham gia lớp học (Regenerate Class Code)

#### `POST /api/v1/classes/:id/regenerate-code`
* **Mô tả chức năng:** Sinh mã tham gia mới cho lớp học. Dùng khi Giảng viên phát hiện mã lớp cũ bị rò rỉ ra ngoài hoặc không muốn nhận thêm học viên qua mã cũ. Cho phép giảng viên tự chỉ định mã mới hoặc để trống để hệ thống tự sinh ngẫu nhiên.
* **Quyền hạn:** `[Roles: teacher, admin]` (Giảng viên phụ trách lớp hoặc Admin)
* **Headers:** 
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`RegenerateCodeDto`) *(Tùy chọn)*:
```json
{
  "customCode": "K26WEB"
}
```
* **Validation Rules:**
  * `customCode` *(tùy chọn)*: Độ dài từ 4 đến 20 ký tự chữ và số, viết hoa, không chứa khoảng trắng. Nếu không truyền hoặc để body rỗng `{}`, hệ thống sẽ tự sinh ngẫu nhiên 6 ký tự viết hoa.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Làm mới mã lớp học thành công",
  "data": {
    "id": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "newClassCode": "K26WEB"
  },
  "timestamp": "2026-09-24T11:22:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Mã tùy chỉnh không hợp lệ | `customCode` chứa ký tự đặc biệt hoặc khoảng trắng |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền đổi mã lớp học này | Không phải giảng viên phụ trách lớp |
| `404` | `Not Found` | Không tìm thấy lớp học | ID lớp học không tồn tại |
| `409` | `Conflict` | Mã lớp học đã tồn tại | `customCode` bị trùng với một lớp đang hoạt động khác |

---

### 2.8. Học viên ghi danh vào lớp bằng mã (Enroll by Code)

#### `POST /api/v1/classes/enroll`
* **Mô tả chức năng:** Học viên nhập mã tham gia lớp (Class Code). Hệ thống kiểm tra mã, xác nhận lớp học đang `active`, tạo bản ghi trong bảng `enrollments` với `status: active` và ghi nhận thời gian tham gia.
* **Quyền hạn:** `[Roles: student]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`EnrollClassDto`):
```json
{
  "classCode": "WEB2026A"
}
```
* **Validation Rules:**
  * `classCode`: Bắt buộc, chuỗi ký tự viết hoa.

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Ghi danh thành công vào lớp học!",
  "data": {
    "classId": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "className": "Lập trình Web React & NestJS - Khóa K2026A",
    "enrolledAt": "2026-09-24T11:25:00.000Z",
    "courseTitle": "Lập trình Web với React & NestJS"
  },
  "timestamp": "2026-09-24T11:25:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Lớp học này hiện không nhận thêm học viên | Lớp học đang ở trạng thái `paused` hoặc `closed` |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `404` | `Not Found` | Mã lớp học không tồn tại | Nhập sai `classCode` hoặc lớp đã bị xóa |
| `409` | `Conflict` | Bạn đã là thành viên của lớp học này rồi | Học viên đã ghi danh vào lớp trước đó |

---

### 2.9. Lấy danh sách thành viên trong lớp học

#### `GET /api/v1/classes/:id/members`
* **Mô tả chức năng:** Lấy danh sách toàn bộ học viên đã tham gia lớp học có hỗ trợ phân trang và tìm kiếm theo họ tên/email.
* **Quyền hạn:** `[Authenticated]` (Chỉ thành viên trong lớp hoặc Giảng viên/Quản lý)
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:** `id` (UUID lớp học)
* **Query Parameters:**
  * `page` *(number, default: 1)*
  * `limit` *(number, default: 20, max: 100)*
  * `search` *(string, optional)*: Tìm kiếm theo tên hoặc email học viên.
  * `status` *(string, default: "active")*: `active`, `dropped`.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách thành viên lớp học thành công",
  "data": {
    "items": [
      {
        "studentId": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
        "fullName": "Nguyễn Văn A",
        "email": "student@eduverse.edu.vn",
        "avatarUrl": null,
        "enrolledAt": "2026-09-24T11:25:00.000Z",
        "status": "active"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 35,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T11:28:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xem danh sách thành viên | Người gọi không thuộc lớp học này |
| `404` | `Not Found` | Không tìm thấy lớp học | ID không tồn tại |

---

### 2.10. Thêm học viên thủ công vào lớp

#### `POST /api/v1/classes/:id/members`
* **Mô tả chức năng:** Giảng viên phụ trách hoặc Quản trị viên thêm trực tiếp một học viên vào lớp thông qua địa chỉ email của học viên đó mà không cần học viên tự nhập mã.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`AddMemberDto`):
```json
{
  "email": "hocvienmoi@eduverse.edu.vn"
}
```
* **Validation Rules:**
  * `email`: Bắt buộc, đúng định dạng email RFC 5322.

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Thêm học viên vào lớp thành công",
  "data": {
    "studentId": "u4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
    "fullName": "Lê Thị B",
    "email": "hocvienmoi@eduverse.edu.vn",
    "enrolledAt": "2026-09-24T11:30:00.000Z"
  },
  "timestamp": "2026-09-24T11:30:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền thêm học viên | Không phải giảng viên phụ trách lớp |
| `404` | `Not Found` | Không tìm thấy tài khoản với email này | Email chưa đăng ký tài khoản trên hệ thống |
| `409` | `Conflict` | Học viên đã có trong danh sách lớp | Học viên đã được thêm trước đó |

---

### 2.11. Xóa học viên khỏi lớp học (Kick Student)

#### `DELETE /api/v1/classes/:id/members/:studentId`
* **Mô tả chức năng:** Giảng viên phụ trách xóa học viên ra khỏi lớp. Bản ghi ghi danh chuyển trạng thái sang `status: dropped` và đánh dấu `deleted_at = now()` để học viên không còn quyền truy cập nội dung bài học của lớp này nữa.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã xóa học viên ra khỏi lớp học thành công",
  "data": null,
  "timestamp": "2026-09-24T11:32:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xóa học viên | Không phải giảng viên phụ trách lớp |
| `404` | `Not Found` | Không tìm thấy học viên trong lớp | `studentId` không có trong danh sách lớp |

### 2.12. Thống kê tiến độ học tập của cả lớp (Class Progress Report)

#### `GET /api/v1/classes/:id/progress`
* **Mô tả chức năng:** Giảng viên phụ trách, Quản lý đào tạo hoặc Admin xem báo cáo trực quan về tình hình học tập và tỷ lệ hoàn thành bài học của toàn bộ học viên trong lớp (`UC-PROGRESS-003`). Phục vụ phát hiện các học viên chậm tiến độ để kịp thời hỗ trợ, nhắc nhở.
* **Quyền hạn:** `[Roles: teacher, training_manager, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID)*: ID lớp học cần xem thống kê.
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang danh sách học viên.
  * `limit` *(number, default: 20, max: 100)*: Số học viên mỗi trang.
  * `search` *(string, optional)*: Tìm kiếm học viên theo họ tên hoặc email.
  * `status` *(string, optional)*: Lọc theo phân loại tiến độ (`completed`, `in_progress`, `not_started`).
  * `sortBy` *(string, default: `progress`)*: Sắp xếp theo `progress` (% tiến độ), `name`, `lastActiveAt`.
  * `order` *(string, default: `asc`)*: Thứ tự `asc` (ưu tiên học viên tiến độ thấp lên đầu để hỗ trợ) hoặc `desc`.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy báo cáo tiến độ học tập của lớp thành công",
  "data": {
    "summary": {
      "classId": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "className": "Lập trình Web React & NestJS - Khóa K2026A",
      "totalLessons": 24,
      "totalStudents": 35,
      "completedCount": 12,
      "inProgressCount": 18,
      "notStartedCount": 5,
      "averageProgressPercentage": 64.5
    },
    "items": [
      {
        "student": {
          "id": "u3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e",
          "fullName": "Nguyễn Văn An",
          "email": "student1@eduverse.vn",
          "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/u3c4.jpg"
        },
        "completedLessons": 24,
        "totalLessons": 24,
        "progressPercentage": 100.0,
        "status": "completed",
        "lastActiveAt": "2026-09-24T10:15:00.000Z",
        "enrolledAt": "2026-09-01T08:00:00.000Z"
      },
      {
        "student": {
          "id": "u4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
          "fullName": "Trần Thị Bích",
          "email": "student2@eduverse.vn",
          "avatarUrl": null
        },
        "completedLessons": 14,
        "totalLessons": 24,
        "progressPercentage": 58.3,
        "status": "in_progress",
        "lastActiveAt": "2026-09-23T16:40:00.000Z",
        "enrolledAt": "2026-09-02T09:30:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 35,
    "totalPages": 2
  },
  "timestamp": "2026-09-24T11:35:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xem tiến độ của lớp | Giảng viên không được phân công phụ trách lớp học này |
| `404` | `Not Found` | Không tìm thấy lớp học | ID lớp học không tồn tại trong hệ thống |

---

### 2.13. Xuất bảng điểm tổng hợp của lớp ra file Excel (Export Grades)

#### `GET /api/v1/classes/:id/grades/export-excel`
* **Mô tả chức năng:** Tạo và tải về file bảng điểm học tập chi tiết của cả lớp (`UC-GRADE-003`). Bảng tính tổng hợp điểm số từ toàn bộ các bài trắc nghiệm (`class_quizzes`), bài tập tự luận (`class_assignments`), tỷ lệ hoàn thành bài giảng và tính toán Điểm tổng kết theo thang điểm 10.
* **Quyền hạn:** `[Roles: teacher, training_manager, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID)*: ID lớp học cần xuất bảng điểm.
* **Query Parameters:**
  * `format` *(string, optional, enum: `xlsx`, `csv`, default: `xlsx`)*: Định dạng tệp xuất ra.

#### Response Thành Công (`200 OK` — Binary File Stream):
* **Headers:**
  * `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (cho `.xlsx`) hoặc `text/csv; charset=utf-8` (cho `.csv`)
  * `Content-Disposition`: `attachment; filename="Bang_Diem_Lop_WEB2026A_20260924.xlsx"`
* **Cấu trúc cột dữ liệu trong tệp Excel xuất ra:**
  1. `STT`: Số thứ tự học viên.
  2. `Mã học viên / ID`: UUID hoặc mã sinh viên.
  3. `Họ và tên`: Họ tên đầy đủ.
  4. `Email`: Email học viên.
  5. `Tiến độ học tập (%)`: % bài học đã hoàn thành theo `lesson_progress`.
  6. **Cụm cột Điểm Quizzes:** Điểm từng bài Quiz trong lớp (lấy điểm cao nhất nếu làm nhiều lần).
  7. **Cụm cột Điểm Assignments:** Điểm từng bài tập lớn/bài tập về nhà đã được giảng viên chấm.
  8. `Điểm TB Quizzes`: Trung bình cộng điểm bài kiểm tra trắc nghiệm.
  9. `Điểm TB Assignments`: Trung bình cộng điểm bài tập tự luận.
  10. `Điểm Tổng kết (GPA - Thang 10)`: Điểm trung bình gia quyền (hoặc theo công thức cấu hình).
  11. `Xếp loại`: Giỏi / Khá / Trung bình / Chưa đạt.

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xuất bảng điểm | Người dùng không phải giảng viên đứng lớp hoặc người quản lý |
| `404` | `Not Found` | Không tìm thấy lớp học | ID lớp học không tồn tại |

---

## 3. Ghi Chú Kỹ Thuật & Nghiệp Vụ Module Classes

- **Quy tắc Duy nhất của Mã Lớp học (Unique Class Code):**
  - Cột `class_code` trong bảng `classes` áp dụng Partial Unique Index: `uq_classes_code_active` UNIQUE (`class_code`) WHERE `deleted_at IS NULL`.
  - Khi một lớp học bị xóa mềm (`deleted_at IS NOT NULL`), mã lớp đó sẽ được tự do giải phóng để các lớp sau có thể tái sử dụng.
- **Ràng buộc Ghi danh lại (Re-enrollment):**
  - Bảng `enrollments` sử dụng Partial Unique Index trên cặp `(class_id, student_id)` với điều kiện `deleted_at IS NULL`.
  - Nếu học viên từng bị xóa khỏi lớp (`dropped`), sau này vẫn có thể được thêm lại mà không vi phạm ràng buộc Unique trong Database.
- **Bảo mật Quyền xem Thành viên:**
  - Danh sách học viên (`GET /members`) chỉ cho phép thành viên thuộc lớp đó hoặc giảng viên đứng lớp xem, tránh tình trạng người ngoài lớp dò quét danh sách sinh viên.
