# 📐 Quy Chuẩn Thiết Kế API — EduVerse API Conventions

> **Tài liệu quy chuẩn kỹ thuật:** Hướng dẫn tiêu chuẩn thiết kế kiến trúc RESTful API thống nhất cho toàn bộ hệ thống EduVerse.  
> **Áp dụng cho:** Đội ngũ phát triển Backend (Express.js), Frontend (React) và Kiểm thử (QA).  
> **Phiên bản:** v1.0.0 — Cập nhật lần cuối: 24/09/2026.

---

## 1. Nguyên Tắc Thiết Kế Chung (General Principles)

Hệ thống API của EduVerse được thiết kế tuân thủ nghiêm ngặt các nguyên tắc **RESTful API**, tối ưu cho ứng dụng Single Page Application (React) và kiến trúc 3 lớp của Express.js.

### 1.1. Giao thức & Địa chỉ cơ sở (Base URL)
* Mọi giao tiếp môi trường sản xuất (Production) đều bắt buộc qua **HTTPS**.
* Định dạng Base URL có tiền tố phiên bản:
  * **Production:** `https://api.eduverse.edu.vn/api/v1`
  * **Local Development:** `http://localhost:3000/api/v1`
* Quy chuẩn trong Express.js: `app.use('/api/v1', router)`.

### 1.2. Quy tắc đặt tên (Naming Conventions)
* **Resource URLs:** 
  * Sử dụng danh từ số nhiều, chữ thường, nối từ bằng dấu gạch ngang (kebab-case):  
    * ✅ `/api/v1/courses`
    * ✅ `/api/v1/quiz-attempts`
    * ✅ `/api/v1/assignment-submissions`
    * ❌ `/api/v1/getCourse` (không dùng động từ)
    * ❌ `/api/v1/quiz_attempts` (không dùng snake_case trên URL)
* **Quan hệ lồng nhau (Sub-resources / Nested Routes):**
  * Chỉ lồng tối đa 2 cấp để giữ URL sạch và dễ bảo trì:
    * ✅ `/api/v1/courses/:courseId/chapters`
    * ✅ `/api/v1/quizzes/:quizId/questions`
    * ❌ `/api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/comments` (quá sâu $\rightarrow$ tách thành `/api/v1/lessons/:lessonId/comments`)
* **JSON Request & Response Fields:**
  * Toàn bộ key trong JSON sử dụng kiểu **camelCase**:
    * ✅ `{ "fullName": "Nguyen Van A", "expiresAt": "2026-09-24T10:00:00Z" }`
    * ❌ `{ "full_name": "Nguyen Van A" }`
* **Query Parameters:**
  * Sử dụng kiểu **camelCase**: `?sortBy=createdAt&sortOrder=DESC&page=1&limit=10`.

### 1.3. Phương thức HTTP (HTTP Methods)
| Phương thức | Ý nghĩa RESTful | Mô tả & Tính chất |
|:---:|---|---|
| `GET` | Đọc dữ liệu | Lấy danh sách hoặc chi tiết bản ghi. **Idempotent** (an toàn, không thay đổi trạng thái server). |
| `POST` | Tạo mới / Tác vụ nghiệp vụ | Tạo bản ghi mới hoặc thực thi tác vụ xử lý (Login, Submit Quiz, Presigned URL). |
| `PUT` | Cập nhật toàn phần | Thay thế toàn bộ thực thể bằng dữ liệu mới. |
| `PATCH` | Cập nhật từng phần | Cập nhật một số trường cụ thể của thực thể (khuyên dùng trong EduVerse). |
| `DELETE` | Xóa dữ liệu | Xóa bản ghi (thực tế hệ thống áp dụng Soft Delete qua Sequelize paranoid). |

### 1.4. Chính sách CORS & Cookie (Cross-Origin & Credentials)
* **CORS (Cross-Origin Resource Sharing):**
  * Backend Express.js cấu hình qua middleware `cors`:
    * **Origins cho phép:** `http://localhost:5173` (Vite dev server) và `https://eduverse.edu.vn` (Production).
    * **Credentials:** `credentials: true` (bắt buộc để trình duyệt nhận và gửi cookie an toàn).
* **Cookie Policy (Refresh Token):**
  * Refresh Token được lưu trong Cookie bảo mật với cờ:
    * `httpOnly: true` (ngăn mã JavaScript client đọc cookie, chống XSS tuyệt đối).
    * `secure: true` (chỉ gửi qua HTTPS trong môi trường production).
    * `sameSite: 'strict'` (chống tấn công giả mạo yêu cầu CSRF).
* **Phía Frontend (Axios):**
  * Bắt buộc cấu hình `axios.defaults.withCredentials = true` khi khởi tạo API client.

---

## 2. Cấu Trúc Phản Hồi Chuẩn (Unified Response Envelope)

Để Frontend (Axios Interceptor) dễ dàng xử lý đồng nhất dữ liệu và bắt lỗi tự động hiển thị Toast, **100% API của EduVerse đều được bọc trong cấu trúc vỏ chuẩn (Envelope Pattern)**.

### 2.1. Phản hồi thành công (Success Response Envelope)

Áp dụng thông qua Express response helper (hoặc middleware format chuẩn):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-09-24T09:30:00.000Z"
}
```

* **Ý nghĩa các trường:**
  * `success` *(boolean)*: Luôn bằng `true` khi request xử lý thành công.
  * `statusCode` *(number)*: Mã HTTP status code (200, 201).
  * `message` *(string)*: Thông điệp nghiệp vụ ngắn gọn bằng tiếng Việt, hỗ trợ hiển thị UI Notification/Toast.
  * `data` *(object \| array \| null)*: Dữ liệu thực tế trả về. Với thao tác xóa hoặc không có data, trả về `null`.
  * `timestamp` *(string)*: Mốc thời gian ISO 8601 theo múi giờ UTC.

### 2.2. Phản hồi thất bại / Lỗi (Error Response Envelope)

Áp dụng thông qua Express Centralized Error Handling Middleware (`errorHandler.js`):

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Dữ liệu gửi lên không hợp lệ",
  "errors": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "path": "/api/v1/auth/register",
  "timestamp": "2026-09-24T09:30:00.000Z"
}
```

* **Ý nghĩa các trường:**
  * `success` *(boolean)*: Luôn bằng `false` khi có ngoại lệ.
  * `statusCode` *(number)*: Mã lỗi HTTP (400, 401, 403, 404, 409, 500, 503).
  * `error` *(string)*: Tên định danh ngắn gọn của lỗi (theo chuẩn HTTP Exception).
  * `message` *(string)*: Thông báo lỗi tóm tắt cho người dùng.
  * `errors` *(array)* *(tùy chọn)*: Mảng chi tiết các trường bị lỗi validation (`Joi`). Chỉ xuất hiện khi có lỗi nhập liệu chi tiết.
  * `path` *(string)*: Đường dẫn URI gây ra lỗi.
  * `timestamp` *(string)*: Mốc thời gian xảy ra lỗi.

---

## 3. Quy Chuẩn Phân Trang, Tìm Kiếm & Sắp Xếp (Pagination & Filtering)

Đối với các endpoint trả về danh sách (`GET /api/v1/courses`, `GET /api/v1/classes`...), bắt buộc phải hỗ trợ phân trang để tránh quá tải bộ nhớ và tối ưu tốc độ mạng.

### 3.1. Query Parameters chuẩn
| Tham số | Kiểu dữ liệu | Mặc định | Giới hạn | Mô tả |
|---|:---:|:---:|:---:|---|
| `page` | `number` | `1` | $\ge 1$ | Số thứ tự trang hiện tại (1-indexed). |
| `limit` | `number` | `10` | $1 \le limit \le 100$ | Số lượng bản ghi trên một trang. |
| `search` | `string` | `""` | Tối đa 100 ký tự | Từ khóa tìm kiếm tự do (tìm theo title, name, email...). |
| `sortBy` | `string` | `"createdAt"` | Theo entity fields | Tên trường cần sắp xếp. |
| `sortOrder` | `string` | `"DESC"` | `ASC` \| `DESC` | Chiều sắp xếp (tăng dần hoặc giảm dần). |

### 3.2. Cấu trúc Response phân trang chuẩn
Khối `data` sẽ gồm danh sách `items` và khối thông tin `meta`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách khóa học thành công",
  "data": {
    "items": [
      {
        "id": "c1f7a2d4-3a21-4f9e-8c3b-7f1a2b3c4d5e",
        "title": "Lập trình Web với React & ExpressJS",
        "code": "WEB2026",
        "createdAt": "2026-09-20T08:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T09:30:00.000Z"
}
```

---

## 4. Bảo Mật, Xác Thực & Phân Quyền (Authentication & RBAC)

### 4.1. Request Headers bắt buộc
* **Content-Type:** `application/json` (cho các request có body payload).
* **Authorization:** `Bearer <JWT_ACCESS_TOKEN>` (cho các endpoint yêu cầu xác thực).
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 4.2. Ma trận phân quyền vai trò (Role-Based Access Control)
Hệ thống quản lý 4 vai trò độc lập theo đúng tài liệu Use Case:

| Ký hiệu quyền | Tên vai trò | Ý nghĩa phạm vi |
|---|---|---|
| `[Public]` | Khách vãng lai | Không cần đăng nhập (Đăng ký, Đăng nhập, Quên mật khẩu, Tra cứu mã lớp). |
| `[Authenticated]` | Người dùng đã đăng nhập | Bất kỳ ai có JWT hợp lệ (Xem Profile cá nhân, Đổi mật khẩu, Logout). |
| `[Roles: student]` | Học viên | Làm bài kiểm tra, nộp bài tập, ghi danh vào lớp, xem điểm cá nhân. |
| `[Roles: teacher]` | Giảng viên | Soạn đề thi, dùng AI sinh câu hỏi, giao bài tập, chấm điểm và nhận xét. |
| `[Roles: training_manager]` | Quản lý đào tạo | Phê duyệt đề cương khóa học, giám sát tiến độ các lớp học. |
| `[Roles: admin]` | Quản trị viên hệ thống | Quản lý tài khoản người dùng, cấu hình tham số hệ thống, xem log audit. |

### 4.3. Nguyên tắc bảo vệ thông tin (Security Best Practices)
1. **Tuyệt đối không rò rỉ Password:** Cột mật khẩu băm (`password_hash`) và token nhạy cảm phải được cấu hình loại trừ (`defaultScope` hoặc `toJSON` exclude) trong Model Sequelize, không bao giờ xuất hiện trong response JSON.
2. **Ẩn đáp án đúng khi thi:** API làm bài thi trắc nghiệm (`GET /attempts/:id/questions`) **tuyệt đối không trả về trường `isCorrect`**.
3. **Thông báo lỗi mơ hồ khi đăng nhập sai:** Trả về câu chung: *"Email hoặc mật khẩu không chính xác"* để tránh tấn công dò quét tài khoản (User Enumeration).
4. **Không đưa AWS Credentials về Client:** Tải file lên Cloud bắt buộc dùng **S3 Presigned URL**.

---

## 5. Bảng Mã Trạng Thái HTTP Chuẩn (HTTP Status Codes Matrix)

| Mã HTTP | Tên chuẩn | Khi nào sử dụng trong EduVerse | Ví dụ cụ thể |
|:---:|---|---|---|
| **200** | `OK` | Thao tác đọc (`GET`), cập nhật (`PATCH`), xóa thành công hoặc POST tác vụ trả về dữ liệu. | Đăng nhập thành công, nộp bài xong trả về điểm số. |
| **201** | `Created` | Tạo mới bản ghi thành công (`POST`). | Đăng ký tài khoản mới, tạo khóa học, tạo đề thi mới. |
| **400** | `Bad Request` | Lỗi dữ liệu đầu vào không hợp lệ hoặc vi phạm logic nghiệp vụ thông thường. | Sai format email, mật khẩu dưới 8 ký tự, OTP hết hạn, nộp bài quá giờ. |
| **401** | `Unauthorized` | Không có hoặc gửi sai/hết hạn JWT Access Token; hoặc sai email/password khi login. | Chưa gửi Header Bearer, Token JWT đã hết hạn quá 15 phút. |
| **403** | `Forbidden` | Token hợp lệ nhưng không đủ quyền truy cập (sai role hoặc không phải chủ sở hữu). | Học viên cố gọi API xóa khóa học; Học viên vào xem bài nộp của bạn khác. |
| **404** | `Not Found` | Không tìm thấy tài nguyên theo ID yêu cầu. | Không tìm thấy khóa học với ID `abc-123`. |
| **409** | `Conflict` | Xung đột trạng thái dữ liệu hiện tại trong Database. | Đăng ký với email đã tồn tại trong hệ thống. |
| **422** | `Unprocessable Entity` | Dữ liệu đúng cú pháp JSON nhưng vi phạm ràng buộc ngữ nghĩa nghiệp vụ sâu. | Bài tập yêu cầu file PDF nhưng gửi metadata định dạng file EXE. |
| **429** | `Too Many Requests` | Vượt quá giới hạn tần suất gọi API (Rate Limit). | Gọi gửi lại OTP quá 3 lần/giờ, gọi AI Gemini quá 10 lần/giờ. |
| **500** | `Internal Server Error` | Lỗi ngoài ý muốn phía backend (bug code, crash logic không bắt được). | Lỗi logic chưa được try/catch trong Service. |
| **503** | `Service Unavailable` | Dịch vụ bên ngoài (Third-party) hoặc hạ tầng tạm thời mất kết nối. | Máy chủ SMTP gửi mail sập, Google Gemini API bị lỗi gián đoạn mạng. |

---

## 6. Mẫu Cấu Trúc Tài Liệu Từng API (API Specification Template)

Khi viết tài liệu cho các module (`api-auth.md`, `api-courses.md`...), tất cả các endpoint đều phải trình bày theo đúng khuôn mẫu sau:

---

### `METHOD /api/v1/resource-path`
* **Mô tả chức năng:** Tóm tắt ngắn gọn mục đích của endpoint.
* **Quyền hạn truy cập:** `[Public]` / `[Authenticated]` / `[Roles: role_name]`
* **Headers:**
  * `Authorization: Bearer <token>` *(nếu cần)*
  * `Content-Type: application/json`

#### Request Body:
```json
{
  "fieldA": "value",
  "fieldB": 123
}
```

#### Response Thành Công (Ví dụ: `200 OK` / `201 Created`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thông báo thành công",
  "data": { ... },
  "timestamp": "2026-09-24T09:30:00.000Z"
}
```

#### Các lỗi thường gặp (Error Cases):
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Validation failed | Dữ liệu đầu vào thiếu hoặc sai định dạng |
| `401` | `Unauthorized` | Token expired | JWT token đã hết hạn |
| `403` | `Forbidden` | Access denied | Tài khoản không đủ quyền thực hiện |
