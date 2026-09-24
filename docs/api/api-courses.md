# 📚 Đặc Tả API: Module Khóa Học, Đề Cương & Tiến Độ Học Tập — api-courses.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`actor-teacher.md`](../use-cases/actor-teacher.md), [`actor-manager.md`](../use-cases/actor-manager.md), [`actor-student.md`](../use-cases/actor-student.md)  
> **Base Path:** `/api/v1/courses`, `/api/v1/chapters`, `/api/v1/lessons`, `/api/v1/classes/:classId/lessons`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ quản lý Khóa học, quy trình Phê duyệt Khóa học (Giảng viên & Quản lý đào tạo), quản lý Chương học (Chapters), Bài học (Lessons), công cụ Kéo thả Sắp xếp lại đề cương (Batch Reorder), và cơ chế Ghi nhận Tiến độ học tập (`lesson_progress`).

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Phân hệ Khóa học (Courses) & Quy trình Phê duyệt
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/courses` | `[Public / Auth]` | Lấy danh sách khóa học (phân trang, tìm kiếm, lọc theo trạng thái) |
| `GET` | `/api/v1/courses/:id` | `[Public / Auth]` | Xem thông tin chi tiết khóa học (theo UUID hoặc slug, hiển thị lý do từ chối nếu có) |
| `GET` | `/api/v1/courses/:id/curriculum` | `[Public / Auth]` | Lấy trọn vẹn cây đề cương (Course $\rightarrow$ Chapters $\rightarrow$ Lessons; hỗ trợ `?classId` lấy tiến độ) |
| `POST` | `/api/v1/courses` | `[Roles: teacher, admin]` | Giảng viên tạo khóa học mới (trạng thái ban đầu `draft`) |
| `PATCH` | `/api/v1/courses/:id` | `[Roles: teacher, admin]` | Giảng viên cập nhật thông tin khóa học (chủ sở hữu hoặc admin) |
| `DELETE` | `/api/v1/courses/:id` | `[Roles: teacher, admin]` | Xóa mềm khóa học (`deleted_at = now()`) |
| `POST` | `/api/v1/courses/:id/publish-request` | `[Roles: teacher]` | Giảng viên gửi yêu cầu phê duyệt khóa học (`draft`/`rejected` $\rightarrow$ `pending`) |
| `PATCH` | `/api/v1/courses/:id/approve` | `[Roles: training_manager, admin]` | Quản lý đào tạo phê duyệt khóa học (`pending` $\rightarrow$ `published`) |
| `PATCH` | `/api/v1/courses/:id/reject` | `[Roles: training_manager, admin]` | Quản lý đào tạo từ chối duyệt kèm lý do lưu vào CSDL (`pending` $\rightarrow$ `rejected`) |

### 1.2. Phân hệ Chương học (Chapters)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/courses/:courseId/chapters` | `[Public / Auth]` | Lấy danh sách các chương của khóa học |
| `POST` | `/api/v1/courses/:courseId/chapters` | `[Roles: teacher, admin]` | Thêm chương học mới vào khóa học |
| `PATCH` | `/api/v1/chapters/:id` | `[Roles: teacher, admin]` | Cập nhật tiêu đề chương học |
| `PATCH` | `/api/v1/courses/:courseId/chapters/reorder` | `[Roles: teacher, admin]` | Sắp xếp lại thứ tự các chương học hàng loạt (Batch Reorder kéo thả) |
| `DELETE` | `/api/v1/chapters/:id` | `[Roles: teacher, admin]` | Xóa chương học (cascade xóa bài học bên trong) |

### 1.3. Phân hệ Bài học (Lessons)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/chapters/:chapterId/lessons` | `[Public / Auth]` | Lấy danh sách bài học thuộc một chương |
| `GET` | `/api/v1/lessons/:id` | `[Authenticated]` | Xem nội dung chi tiết bài học (Lý thuyết Markdown, URL Video bài giảng) |
| `POST` | `/api/v1/chapters/:chapterId/lessons` | `[Roles: teacher, admin]` | Tạo bài học mới (Lý thuyết, Video, Trắc nghiệm, Bài tập lớn) |
| `PATCH` | `/api/v1/lessons/:id` | `[Roles: teacher, admin]` | Cập nhật nội dung hoặc tiêu đề bài học |
| `PATCH` | `/api/v1/chapters/:chapterId/lessons/reorder` | `[Roles: teacher, admin]` | Sắp xếp lại thứ tự bài học trong chương hàng loạt (Batch Reorder kéo thả) |
| `DELETE` | `/api/v1/lessons/:id` | `[Roles: teacher, admin]` | Xóa bài học khỏi chương |

### 1.4. Phân hệ Tiến độ Học tập (Lesson Progress)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/classes/:classId/lessons/:lessonId/progress` | `[Roles: student]` | Học viên đánh dấu hoàn thành / hủy hoàn thành bài học lý thuyết/video |

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

---

### 2.1. Lấy danh sách khóa học (Phân trang & Tìm kiếm)

#### `GET /api/v1/courses`
* **Mô tả chức năng:** Trả về danh sách khóa học hỗ trợ phân trang, tìm kiếm theo tiêu đề/mô tả và lọc theo trạng thái:
  * Với khách hoặc học viên: Mặc định chỉ hiển thị khóa học `status = published`.
  * Với giảng viên: Xem được thêm các khóa học `draft`, `pending`, `rejected` do chính mình sở hữu (`owner_id = current_user.id`).
  * Với quản lý đào tạo / admin: Xem được tất cả khóa học của mọi giảng viên.
* **Quyền hạn:** `[Public / Authenticated]`
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang hiện tại (1-indexed).
  * `limit` *(number, default: 10, max: 100)*: Số lượng bản ghi trên một trang.
  * `search` *(string, optional)*: Từ khóa tìm kiếm theo tiêu đề khóa học (toán tử ILIKE).
  * `status` *(string, optional, enum: `draft`, `pending`, `published`, `rejected`)*: Lọc theo trạng thái.
  * `sortBy` *(string, default: "createdAt")*: Sắp xếp theo cột (`createdAt`, `title`, `price`).
  * `sortOrder` *(string, default: "DESC", enum: "ASC", "DESC")*: Thứ tự sắp xếp.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách khóa học thành công",
  "data": {
    "items": [
      {
        "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
        "title": "Lập trình Web với React & NestJS",
        "slug": "lap-trinh-web-voi-react-nestjs",
        "description": "Khóa học thực chiến xây dựng ứng dụng Fullstack từ cơ bản đến nâng cao.",
        "thumbnailUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/thumbnails/course-web.jpg",
        "price": "0.00",
        "status": "published",
        "owner": {
          "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
          "fullName": "ThS. Hoàng Minh Đức"
        },
        "createdAt": "2026-09-20T08:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 15,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T10:45:00.000Z"
}
```

---

### 2.2. Xem thông tin chi tiết một khóa học

#### `GET /api/v1/courses/:id`
* **Mô tả chức năng:** Trả về thông tin chi tiết của một khóa học (theo UUID hoặc slug SEO), bao gồm thông tin giảng viên, tổng số chương/bài học và lý do từ chối `rejectionReason` (nếu khóa học đang ở trạng thái `rejected`).
* **Quyền hạn:** `[Public / Authenticated]`
* **Path Parameters:**
  * `id`: UUID của khóa học hoặc chuỗi `slug` (ví dụ: `lap-trinh-web-voi-react-nestjs`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy chi tiết khóa học thành công",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "title": "Lập trình Web với React & NestJS",
    "slug": "lap-trinh-web-voi-react-nestjs",
    "description": "Khóa học thực chiến xây dựng ứng dụng Fullstack từ cơ bản đến nâng cao.",
    "thumbnailUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/thumbnails/course-web.jpg",
    "price": "0.00",
    "status": "rejected",
    "rejectionReason": "Chương 2 thiếu tài liệu bài giảng và video chưa có phụ đề. Vui lòng bổ sung trước khi gửi lại.",
    "owner": {
      "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
      "fullName": "ThS. Hoàng Minh Đức",
      "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher-1.jpg"
    },
    "totalChapters": 5,
    "totalLessons": 24,
    "createdAt": "2026-09-20T08:00:00.000Z",
    "updatedAt": "2026-09-22T10:00:00.000Z"
  },
  "timestamp": "2026-09-24T10:45:30.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `404` | `Not Found` | Không tìm thấy khóa học | ID hoặc slug không tồn tại hoặc đã bị xóa |

---

### 2.3. Lấy toàn bộ cây đề cương khóa học (Sidebar Curriculum & Progress)

#### `GET /api/v1/courses/:id/curriculum`
* **Mô tả chức năng:** Trả về toàn bộ cấu trúc phân cấp Khóa học $\rightarrow$ Các Chương $\rightarrow$ Các Bài học để Frontend hiển thị thanh Sidebar mục lục học tập chỉ với **duy nhất 1 request API**.
* **Tích hợp Tiến độ & Liên kết Phụ:** Nếu truyền thêm Query `classId`, hệ thống tự động kiểm tra bảng `lesson_progress` của học viên hiện tại để trả về cờ `isCompleted: true/false`, kèm `quizId` (nếu bài học là Quiz) và `assignmentId` (nếu bài học là Assignment).
* **Quyền hạn:** `[Public / Authenticated]`
* **Path Parameters:**
  * `id`: UUID của khóa học (hoặc `slug`).
* **Query Parameters:**
  * `classId` *(string UUID, optional)*: ID lớp học học viên đang tham gia để kiểm tra tiến độ tích xanh (Checkmark).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy cấu trúc đề cương khóa học thành công",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "title": "Lập trình Web với React & NestJS",
    "totalChapters": 2,
    "totalLessons": 4,
    "completedLessons": 2,
    "progressPercentage": 50.0,
    "chapters": [
      {
        "id": "ch1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "title": "Chương 1: Khởi động với React & TypeScript",
        "orderIndex": 1,
        "lessons": [
          {
            "id": "l1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
            "title": "Bài 1: Giới thiệu kiến trúc Single Page Application",
            "lessonType": "theory",
            "orderIndex": 1,
            "isCompleted": true
          },
          {
            "id": "l2a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
            "title": "Bài 2: Thực hành Components & Props",
            "lessonType": "video",
            "orderIndex": 2,
            "isCompleted": true
          }
        ]
      },
      {
        "id": "ch2a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "title": "Chương 2: Xây dựng Backend với NestJS",
        "orderIndex": 2,
        "lessons": [
          {
            "id": "l3a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
            "title": "Bài 1: Tổng quan Modules, Controllers & Services",
            "lessonType": "theory",
            "orderIndex": 1,
            "isCompleted": false
          },
          {
            "id": "l4a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
            "title": "Bài 2: Kiểm tra kiến thức chương 2",
            "lessonType": "quiz",
            "quizId": "q9f8e7d6-5c4b-3a21-0f9e-8d7c6b5a4321",
            "orderIndex": 2,
            "isCompleted": false
          }
        ]
      }
    ]
  },
  "timestamp": "2026-09-24T10:46:00.000Z"
}
```

---

### 2.4. Tạo khóa học mới

#### `POST /api/v1/courses`
* **Mô tả chức năng:** Giảng viên tạo khung khóa học mới. Hệ thống tự động sinh `slug` từ tiêu đề và gán trạng thái ban đầu là `status: draft`.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`CreateCourseDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `title` | `string` | ✔️ | Tiêu đề khóa học (5 - 255 ký tự) |
| `description` | `string` | ❌ | Mô tả chi tiết mục tiêu khóa học (tối đa 2000 ký tự) |
| `thumbnailUrl` | `string` | ❌ | Đường dẫn ảnh đại diện khóa học trên S3 |
| `price` | `number` | ❌ | Học phí (số dương $\ge 0$, mặc định `0`) |

```json
{
  "title": "Lập trình Web với React & NestJS",
  "description": "Khóa học thực chiến xây dựng ứng dụng Fullstack từ cơ bản đến nâng cao.",
  "thumbnailUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/thumbnails/course-web.jpg",
  "price": 0
}
```

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo khóa học thành công",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "title": "Lập trình Web với React & NestJS",
    "slug": "lap-trinh-web-voi-react-nestjs",
    "status": "draft",
    "ownerId": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
    "createdAt": "2026-09-24T10:48:00.000Z"
  },
  "timestamp": "2026-09-24T10:48:00.000Z"
}
```

---

### 2.5. Cập nhật thông tin khóa học

#### `PATCH /api/v1/courses/:id`
* **Mô tả chức năng:** Giảng viên chủ sở hữu (hoặc Admin) cập nhật tiêu đề, mô tả, ảnh bìa hoặc giá của khóa học. Nếu cập nhật tiêu đề, hệ thống tự động làm mới `slug`.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`UpdateCourseDto`):
```json
{
  "title": "Lập trình Web Fullstack với React & NestJS (2026)",
  "description": "Nội dung cập nhật mới nhất cho năm 2026...",
  "thumbnailUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/thumbnails/course-web-v2.jpg"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật khóa học thành công",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "title": "Lập trình Web Fullstack với React & NestJS (2026)",
    "slug": "lap-trinh-web-fullstack-voi-react-nestjs-2026",
    "status": "draft",
    "updatedAt": "2026-09-24T10:49:00.000Z"
  },
  "timestamp": "2026-09-24T10:49:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `403` | `Forbidden` | Không có quyền sửa khóa học này | Người dùng không phải chủ sở hữu hoặc admin |
| `404` | `Not Found` | Không tìm thấy khóa học | ID không tồn tại |

---

### 2.6. Xóa mềm khóa học

#### `DELETE /api/v1/courses/:id`
* **Mô tả chức năng:** Giảng viên chủ sở hữu (hoặc Admin) xóa mềm khóa học (`deleted_at = now()`). Khóa học sẽ không hiển thị trên danh mục nhưng các lớp học đang diễn ra vẫn giữ được dữ liệu bài học lịch sử.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa khóa học thành công",
  "data": null,
  "timestamp": "2026-09-24T10:49:30.000Z"
}
```

---

### 2.7. Giảng viên gửi yêu cầu duyệt khóa học

#### `POST /api/v1/courses/:id/publish-request`
* **Mô tả chức năng:** Sau khi soạn thảo xong nội dung (đã có ít nhất 1 chương và 1 bài học), Giảng viên gửi yêu cầu để Quản lý đào tạo xem xét. Trạng thái chuyển từ `draft` (hoặc `rejected`) sang `pending`.
* **Quyền hạn:** `[Roles: teacher]` (Chủ sở hữu khóa học)
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã gửi yêu cầu phê duyệt khóa học tới Quản lý đào tạo.",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "status": "pending"
  },
  "timestamp": "2026-09-24T10:50:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Khóa học chưa có bài học nào | Không thể gửi duyệt khóa học trống |
| `400` | `Bad Request` | Khóa học đang ở trạng thái pending hoặc đã published | Khóa học đã gửi duyệt trước đó hoặc đã công khai |
| `403` | `Forbidden` | Không có quyền thao tác trên khóa học này | Giảng viên không phải chủ sở hữu khóa học |

---

### 2.8. Quản lý đào tạo phê duyệt khóa học

#### `PATCH /api/v1/courses/:id/approve`
* **Mô tả chức năng:** Quản lý đào tạo (`training_manager`) duyệt nội dung khóa học. Trạng thái chuyển từ `pending` sang `published`, ghi nhận `approved_by`, `approved_at` và xóa trắng `rejection_reason`. Khóa học chính thức công khai cho học viên xem và mở lớp.
* **Quyền hạn:** `[Roles: training_manager, admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Phê duyệt khóa học thành công. Khóa học đã được công khai.",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "status": "published",
    "approvedBy": "u3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e",
    "approvedAt": "2026-09-24T10:52:00.000Z"
  },
  "timestamp": "2026-09-24T10:52:00.000Z"
}
```

---

### 2.9. Quản lý đào tạo từ chối phê duyệt khóa học

#### `PATCH /api/v1/courses/:id/reject`
* **Mô tả chức năng:** Quản lý đào tạo từ chối duyệt khóa học do nội dung chưa đạt yêu cầu. Trạng thái chuyển từ `pending` sang `rejected`, lưu lý do vào cột `rejection_reason` trong CSDL và gửi email/thông báo giải trình tới Giảng viên.
* **Quyền hạn:** `[Roles: training_manager, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`RejectCourseDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `reason` | `string` | ✔️ | Lý do từ chối chi tiết để giảng viên sửa chữa (tối đa 1000 ký tự) |

```json
{
  "reason": "Chương 2 thiếu tài liệu bài giảng và video chưa có phụ đề. Vui lòng bổ sung trước khi gửi lại."
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã từ chối duyệt khóa học và phản hồi lý do đến Giảng viên.",
  "data": {
    "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "status": "rejected",
    "rejectionReason": "Chương 2 thiếu tài liệu bài giảng và video chưa có phụ đề. Vui lòng bổ sung trước khi gửi lại."
  },
  "timestamp": "2026-09-24T10:55:00.000Z"
}
```

---

### 2.10. Lấy danh sách chương của khóa học

#### `GET /api/v1/courses/:courseId/chapters`
* **Mô tả chức năng:** Lấy toàn bộ danh sách các chương thuộc một khóa học cụ thể, sắp xếp theo thứ tự hiển thị `orderIndex` tăng dần.
* **Quyền hạn:** `[Public / Authenticated]`
* **Path Parameters:**
  * `courseId`: UUID của khóa học.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách chương thành công",
  "data": [
    {
      "id": "ch1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "courseId": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
      "title": "Chương 1: Khởi động với React & TypeScript",
      "orderIndex": 1,
      "createdAt": "2026-09-20T08:30:00.000Z"
    }
  ],
  "timestamp": "2026-09-24T10:56:00.000Z"
}
```

---

### 2.11. Thêm Chương học mới (Chapter)

#### `POST /api/v1/courses/:courseId/chapters`
* **Mô tả chức năng:** Giảng viên thêm một chương mới vào khóa học. Hệ thống tự động tính toán `orderIndex` kế tiếp nếu không truyền.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`CreateChapterDto`):
```json
{
  "title": "Chương 3: Làm việc với Cơ sở dữ liệu TypeORM & PostgreSQL",
  "orderIndex": 3
}
```

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Thêm chương học thành công",
  "data": {
    "id": "ch3a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "courseId": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
    "title": "Chương 3: Làm việc với Cơ sở dữ liệu TypeORM & PostgreSQL",
    "orderIndex": 3,
    "createdAt": "2026-09-24T10:58:00.000Z"
  },
  "timestamp": "2026-09-24T10:58:00.000Z"
}
```

---

### 2.12. Cập nhật tiêu đề Chương học

#### `PATCH /api/v1/chapters/:id`
* **Mô tả chức năng:** Giảng viên cập nhật tiêu đề chương học.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`UpdateChapterDto`):
```json
{
  "title": "Chương 3: Thiết kế CSDL & TypeORM Nâng cao"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật chương học thành công",
  "data": {
    "id": "ch3a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Chương 3: Thiết kế CSDL & TypeORM Nâng cao",
    "orderIndex": 3,
    "updatedAt": "2026-09-24T10:59:00.000Z"
  },
  "timestamp": "2026-09-24T10:59:00.000Z"
}
```

---

### 2.13. Sắp xếp lại thứ tự các Chương học (Batch Reorder Chapters)

#### `PATCH /api/v1/courses/:courseId/chapters/reorder`
* **Mô tả chức năng:** Cập nhật vị trí hiển thị của toàn bộ các chương học trong khóa học bằng thao tác kéo thả (Drag & Drop) thông qua **1 request duy nhất**. Server cập nhật `order_index` trong một Transaction CSDL an toàn.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`ReorderChaptersDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|:---:|---|
| `chapterIds` | `string[]` | ✔️ | Mảng UUID các chương theo đúng thứ tự hiển thị mới mong muốn |

```json
{
  "chapterIds": [
    "ch2a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "ch1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "ch3a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
  ]
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sắp xếp lại thứ tự các chương học thành công",
  "data": null,
  "timestamp": "2026-09-24T10:59:15.000Z"
}
```

---

### 2.14. Xóa Chương học

#### `DELETE /api/v1/chapters/:id`
* **Mô tả chức năng:** Xóa một chương học. Hệ thống thực hiện xóa cascade toàn bộ các bài học thuộc chương đó trong CSDL.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa chương học thành công",
  "data": null,
  "timestamp": "2026-09-24T10:59:30.000Z"
}
```

---

### 2.15. Lấy danh sách bài học thuộc chương

#### `GET /api/v1/chapters/:chapterId/lessons`
* **Mô tả chức năng:** Trả về danh sách tiêu đề và loại bài học (`theory`, `video`, `quiz`, `assignment`) thuộc một chương. Không trả về `contentText` chi tiết để giữ payload nhẹ.
* **Quyền hạn:** `[Public / Authenticated]`
* **Path Parameters:**
  * `chapterId`: UUID của chương học.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách bài học thành công",
  "data": [
    {
      "id": "l1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
      "chapterId": "ch1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "title": "Bài 1: Giới thiệu kiến trúc Single Page Application",
      "lessonType": "theory",
      "orderIndex": 1
    }
  ],
  "timestamp": "2026-09-24T10:59:45.000Z"
}
```

---

### 2.16. Tạo Bài học mới (Lesson)

#### `POST /api/v1/chapters/:chapterId/lessons`
* **Mô tả chức năng:** Thêm bài học mới vào một chương cụ thể. Hỗ trợ 4 loại bài học: `theory` (Lý thuyết / Markdown text), `video` (Bài giảng video), `quiz` (Khung bài trắc nghiệm), `assignment` (Khung bài tập lớn nộp file).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`CreateLessonDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|:---:|---|
| `title` | `string` | ✔️ | Tiêu đề bài học (2 - 255 ký tự) |
| `lessonType` | `string` | ✔️ | Phân loại bài học (`theory`, `video`, `quiz`, `assignment`) |
| `videoUrl` | `string` | ❌ | Đường dẫn video (bắt buộc nếu `lessonType = video`) |
| `contentText` | `string` | ❌ | Nội dung Markdown lý thuyết (bắt buộc nếu `lessonType = theory`) |
| `orderIndex` | `number` | ❌ | Thứ tự hiển thị trong chương (tự tính nếu không truyền) |

```json
{
  "title": "Bài 1: Cài đặt và cấu hình TypeORM trong NestJS",
  "lessonType": "video",
  "videoUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/videos/nest-typeorm-setup.mp4",
  "contentText": "Trong bài học này chúng ta sẽ tìm hiểu cách kết nối NestJS với PostgreSQL qua TypeORM...",
  "orderIndex": 1
}
```

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo bài học mới thành công",
  "data": {
    "id": "l5a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "chapterId": "ch3a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Bài 1: Cài đặt và cấu hình TypeORM trong NestJS",
    "lessonType": "video",
    "videoUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/videos/nest-typeorm-setup.mp4",
    "orderIndex": 1,
    "createdAt": "2026-09-24T11:00:00.000Z"
  },
  "timestamp": "2026-09-24T11:00:00.000Z"
}
```

---

### 2.17. Xem nội dung chi tiết bài học

#### `GET /api/v1/lessons/:id`
* **Mô tả chức năng:** Trả về nội dung đầy đủ của bài học (nội dung lý thuyết Markdown, đường dẫn xem video bài giảng). Chỉ cho phép học viên đã ghi danh vào lớp học tương ứng (hoặc Giảng viên / Quản lý) được truy cập.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy nội dung bài học thành công",
  "data": {
    "id": "l5a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "chapterId": "ch3a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Bài 1: Cài đặt và cấu hình TypeORM trong NestJS",
    "lessonType": "video",
    "videoUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/videos/nest-typeorm-setup.mp4",
    "contentText": "# Hướng dẫn cài đặt TypeORM\n\nBước 1: Chạy lệnh `npm install @nestjs/typeorm typeorm pg`...",
    "orderIndex": 1,
    "updatedAt": "2026-09-24T11:00:00.000Z"
  },
  "timestamp": "2026-09-24T11:02:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `403` | `Forbidden` | Bạn chưa ghi danh vào lớp học chứa bài học này | Học viên chưa là thành viên của lớp học |
| `404` | `Not Found` | Không tìm thấy bài học | ID bài học không tồn tại hoặc đã bị xóa |

---

### 2.18. Cập nhật Bài học

#### `PATCH /api/v1/lessons/:id`
* **Mô tả chức năng:** Giảng viên cập nhật tiêu đề, nội dung Markdown, đường link video của bài học.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`UpdateLessonDto`):
```json
{
  "title": "Bài 1: Cài đặt và cấu hình TypeORM (Bản sửa đổi)",
  "contentText": "Nội dung cập nhật mới..."
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật bài học thành công",
  "data": {
    "id": "l5a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "title": "Bài 1: Cài đặt và cấu hình TypeORM (Bản sửa đổi)",
    "updatedAt": "2026-09-24T11:03:00.000Z"
  },
  "timestamp": "2026-09-24T11:03:00.000Z"
}
```

---

### 2.19. Sắp xếp lại thứ tự bài học trong chương (Batch Reorder Lessons)

#### `PATCH /api/v1/chapters/:chapterId/lessons/reorder`
* **Mô tả chức năng:** Cập nhật vị trí hiển thị của toàn bộ các bài học trong một chương thông qua giao diện kéo thả (Drag & Drop). Giúp tránh việc phải gửi hàng chục request PATCH đơn lẻ.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`ReorderLessonsDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|:---:|---|
| `lessonIds` | `string[]` | ✔️ | Mảng UUID các bài học theo đúng thứ tự hiển thị mới mong muốn |

```json
{
  "lessonIds": [
    "l2a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "l1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "l5a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c"
  ]
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sắp xếp lại thứ tự bài học thành công",
  "data": null,
  "timestamp": "2026-09-24T11:03:30.000Z"
}
```

---

### 2.20. Đánh dấu hoàn thành / hủy hoàn thành bài học (Lesson Progress)

#### `POST /api/v1/classes/:classId/lessons/:lessonId/progress`
* **Mô tả chức năng:** Học viên bấm nút **"Đánh dấu đã hoàn thành"** (hoặc bỏ tích) sau khi xem xong video hoặc đọc xong bài lý thuyết. Hệ thống thực hiện Upsert vào bảng `lesson_progress` trên cặp `(class_id, student_id, lesson_id)` với `is_completed = isCompleted` và `completed_at = now()`. Tự động cập nhật tức thì tỷ lệ hoàn thành khóa học của học viên.
* **Quyền hạn:** `[Roles: student]` (Thành viên lớp học)
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `classId` *(string UUID)*: ID lớp học học viên đang tham gia.
  * `lessonId` *(string UUID)*: ID bài học hoàn thành.

#### Request Body (`UpdateLessonProgressDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|:---:|---|
| `isCompleted` | `boolean` | ✔️ | `true`: Hoàn thành; `false`: Bỏ đánh dấu hoàn thành |

```json
{
  "isCompleted": true
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật tiến độ bài học thành công",
  "data": {
    "classId": "cl1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "lessonId": "l1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "isCompleted": true,
    "completedAt": "2026-09-24T11:03:45.000Z",
    "overallClassProgress": {
      "completedLessons": 12,
      "totalLessons": 24,
      "progressPercentage": 50.0
    }
  },
  "timestamp": "2026-09-24T11:03:45.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `403` | `Forbidden` | Bạn không phải là thành viên của lớp học này | Học viên chưa ghi danh vào lớp |
| `404` | `Not Found` | Không tìm thấy bài học hoặc lớp học | ID không tồn tại |

---

### 2.21. Xóa Bài học

#### `DELETE /api/v1/lessons/:id`
* **Mô tả chức năng:** Xóa một bài học khỏi chương.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa bài học thành công",
  "data": null,
  "timestamp": "2026-09-24T11:04:00.000Z"
}
```

---

## 3. Ghi Chú Kỹ Thuật & Nghiệp Vụ Module Courses

### 3.1. Quan hệ Xóa Mềm & Toàn vẹn Dữ liệu (Soft Delete & Cascade)
- Bảng `courses` áp dụng Soft Delete (`deleted_at IS NOT NULL`). Khi một khóa học bị xóa mềm, toàn bộ các lớp học đã mở trước đó vẫn giữ nguyên dữ liệu lịch sử để đảm bảo tính toàn vẹn kết quả học tập của sinh viên.
- Khi xóa một Chương (`DELETE /chapters/:id`), các bài học con bên trong sẽ được xóa cascade theo cấu hình CSDL `ON DELETE CASCADE`.

### 3.2. Đường dẫn SEO (Slug Generation)
- Cột `slug` được sinh tự động bằng hàm `slugify(title)` chuyển tiếng Việt có dấu thành không dấu (ví dụ: `lap-trinh-web-voi-react-nestjs`).
- Đảm bảo tính duy nhất qua Partial Unique Index:
  ```sql
  CREATE UNIQUE INDEX uq_courses_slug_active ON courses (slug) WHERE deleted_at IS NULL;
  ```

### 3.3. Quy trình Duyệt & Lý do Từ chối (Course Review Workflow)
- Khi Quản lý đào tạo từ chối duyệt (`PATCH /courses/:id/reject`), lý do giải trình được lưu trực tiếp vào cột `rejection_reason` trong bảng `courses`.
- Khi Giảng viên gửi duyệt lại (`POST /courses/:id/publish-request`), trường `rejection_reason` vẫn được lưu vết cho tới khi Quản lý phê duyệt chính thức (`PATCH /courses/:id/approve`), lúc đó trường này mới được xóa về `NULL`.

### 3.4. Thứ tự Ưu tiên Route trong NestJS Controller
- Các route tĩnh và route hành động (`/curriculum`, `/publish-request`, `/approve`, `/reject`) bắt buộc phải được khai báo **TRƯỚC** các route tham số động `@Get(':id')` trong NestJS CourseController để tránh bị bắt nhầm tham số URL.
