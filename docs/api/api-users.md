# 👤 Đặc Tả API: Module Quản Lý Người Dùng & Hồ Sơ Cá Nhân — api-users.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`actor-admin.md`](../use-cases/actor-admin.md#uc-admin-001), [`actor-student.md`](../use-cases/actor-student.md), [`actor-teacher.md`](../use-cases/actor-teacher.md)  
> **Base Path:** `/api/v1/users`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ xem và cập nhật hồ sơ cá nhân của người dùng, xem hồ sơ công khai của Giảng viên, đổi mật khẩu an toàn, cũng như phân hệ Quản trị tài khoản & phân quyền (RBAC) toàn trường dành riêng cho Quản trị viên (Admin).

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Phân hệ Hồ sơ cá nhân (Personal Profile Management)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/users/me` | `[Authenticated]` | Lấy thông tin hồ sơ của người dùng đang đăng nhập |
| `PATCH` | `/api/v1/users/me` | `[Authenticated]` | Cập nhật thông tin hồ sơ cá nhân (Họ tên, Ảnh đại diện, SĐT, Giới thiệu) |
| `PATCH` | `/api/v1/users/me/password` | `[Authenticated]` | Người dùng tự đổi mật khẩu tài khoản và thu hồi các phiên đăng nhập khác |
| `GET` | `/api/v1/users/:id/profile` | `[Authenticated]` | Xem hồ sơ công khai của Giảng viên / Người dùng (ẩn thông tin nhạy cảm) |

### 1.2. Phân hệ Quản trị Tài khoản & Phân quyền (Admin User & RBAC Management)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/users` | `[Roles: admin]` | Danh sách người dùng toàn trường (phân trang, tìm kiếm, lọc theo vai trò, trạng thái) |
| `GET` | `/api/v1/users/:id` | `[Roles: admin]` | Xem chi tiết toàn diện thông tin một tài khoản người dùng cụ thể |
| `POST` | `/api/v1/users` | `[Roles: admin]` | Khởi tạo tài khoản Giảng viên / Quản lý / Admin (sinh mật khẩu tạm, gửi email) |
| `PATCH` | `/api/v1/users/:id` | `[Roles: admin]` | Cập nhật thông tin người dùng và Gán / Thu hồi vai trò (RBAC) |
| `PATCH` | `/api/v1/users/:id/status` | `[Roles: admin]` | Khóa / Mở khóa tài khoản người dùng kèm lý do vi phạm |
| `POST` | `/api/v1/users/:id/reset-password` | `[Roles: admin]` | Đặt lại mật khẩu khẩn cấp cho người dùng (khi quên pass / lỗi email) |
| `DELETE` | `/api/v1/users/:id` | `[Roles: admin]` | Xóa mềm tài khoản người dùng (`deleted_at = now()`) |
| `POST` | `/api/v1/users/bulk-import` | `[Roles: admin]` | Nhập danh sách người dùng hàng loạt qua tệp Excel (`.xlsx`) hoặc `.csv` |

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

---

### 2.1. Lấy thông tin hồ sơ người dùng hiện tại

#### `GET /api/v1/users/me`
* **Mô tả chức năng:** Trả về thông tin hồ sơ cá nhân chi tiết của người dùng đang đăng nhập dựa trên JWT Access Token, phục vụ hiển thị Header / Profile Dashboard trên giao diện Web.
* **Quyền hạn:** `[Authenticated]` (Mọi tài khoản đã đăng nhập hợp lệ).
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin hồ sơ cá nhân thành công",
  "data": {
    "id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "email": "teacher1@eduverse.vn",
    "fullName": "ThS. Hoàng Minh Đức",
    "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher1.png",
    "phoneNumber": "0987654321",
    "bio": "Giảng viên bộ môn Công nghệ Phần mềm - Chuyên gia Fullstack Web & Cloud Computing.",
    "role": "teacher",
    "isActive": true,
    "emailVerified": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-09-24T10:30:00.000Z"
  },
  "timestamp": "2026-09-24T14:00:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Phiên đăng nhập không hợp lệ hoặc đã hết hạn | Token thiếu, sai chữ ký hoặc bị thu hồi |
| `403` | `Forbidden` | Tài khoản của bạn hiện đang bị tạm khóa | Người dùng bị Admin khóa tài khoản (`is_active = false`) |

---

### 2.2. Cập nhật hồ sơ cá nhân

#### `PATCH /api/v1/users/me`
* **Mô tả chức năng:** Cho phép người dùng tự cập nhật thông tin hiển thị cơ bản của bản thân (Họ và tên, ảnh đại diện `avatarUrl`, số điện thoại, lời giới thiệu `bio`). Ảnh đại diện phải được upload qua module [`api-uploads.md`](api-uploads.md) (`purpose: avatar`) trước khi lưu URL vào đây.
* **Quyền hạn:** `[Authenticated]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`application/json`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `fullName` | `string` | ❌ | Họ và tên hiển thị mới (Độ dài từ 2 đến 150 ký tự, tự động trim khoảng trắng thừa) |
| `avatarUrl` | `string` | ❌ | Đường dẫn ảnh đại diện công khai hợp lệ từ AWS S3 |
| `phoneNumber` | `string` | ❌ | Số điện thoại liên hệ (9 - 15 chữ số, định dạng hợp lệ) |
| `bio` | `string` | ❌ | Giới thiệu ngắn về bản thân hoặc học vị (Tối đa 500 ký tự) |

```json
{
  "fullName": "TS. Hoàng Minh Đức",
  "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/avatar-u1a2b3c4.jpg",
  "phoneNumber": "0987654321",
  "bio": "Tiến sĩ Khoa học Máy tính - Đam mê phát triển kiến trúc Microservices và ứng dụng AI trong giáo dục."
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật hồ sơ cá nhân thành công",
  "data": {
    "id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "email": "teacher1@eduverse.vn",
    "fullName": "TS. Hoàng Minh Đức",
    "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/avatar-u1a2b3c4.jpg",
    "phoneNumber": "0987654321",
    "bio": "Tiến sĩ Khoa học Máy tính - Đam mê phát triển kiến trúc Microservices và ứng dụng AI trong giáo dục.",
    "role": "teacher",
    "updatedAt": "2026-09-24T14:05:00.000Z"
  },
  "timestamp": "2026-09-24T14:05:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Họ và tên phải có độ dài từ 2 đến 150 ký tự | Dữ liệu `fullName` không thỏa mãn validation |
| `400` | `Bad Request` | Số điện thoại không đúng định dạng | Chuỗi `phoneNumber` chứa ký tự chữ hoặc không đúng độ dài |
| `401` | `Unauthorized` | Phiên đăng nhập hết hạn | Access Token không hợp lệ |

---

### 2.3. Tự đổi mật khẩu tài khoản cá nhân

#### `PATCH /api/v1/users/me/password`
* **Mô tả chức năng:** Người dùng tự cập nhật mật khẩu đăng nhập mới. Hệ thống sẽ so khớp mật khẩu hiện tại bằng bcrypt, hash mật khẩu mới, cập nhật vào bảng `users`, đồng thời **thu hồi toàn bộ Refresh Token trên các thiết bị khác** (chỉ giữ lại phiên đăng nhập hiện tại) để ngăn chặn kẻ xấu chiếm quyền điều khiển. Nếu cờ `must_change_password` đang là `true`, hệ thống sẽ tự động chuyển về `false`.
* **Quyền hạn:** `[Authenticated]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`application/json`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `currentPassword` | `string` | ✔️ | Mật khẩu hiện tại của người dùng |
| `newPassword` | `string` | ✔️ | Mật khẩu mới (Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt) |
| `confirmPassword` | `string` | ✔️ | Xác nhận lại mật khẩu mới (Bắt buộc phải khớp với `newPassword`) |

```json
{
  "currentPassword": "OldPassword@2025",
  "newPassword": "NewStrongPassword@2026",
  "confirmPassword": "NewStrongPassword@2026"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được đăng xuất để bảo mật.",
  "data": {
    "passwordChangedAt": "2026-09-24T14:10:00.000Z",
    "mustChangePassword": false,
    "revokedOtherSessions": true
  },
  "timestamp": "2026-09-24T14:10:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Mật khẩu mới không được trùng với mật khẩu cũ | Người dùng nhập lại mật khẩu hiện tại |
| `400` | `Bad Request` | Mật khẩu xác nhận không khớp | `confirmPassword` khác `newPassword` |
| `400` | `Bad Request` | Mật khẩu hiện tại không chính xác | So sánh bcrypt `currentPassword` thất bại |

---

### 2.4. Xem hồ sơ công khai của Giảng viên / Người dùng (Public Profile)

#### `GET /api/v1/users/:id/profile`
* **Mô tả chức năng:** Cho phép bất kỳ người dùng đã đăng nhập nào (đặc biệt là Học viên) xem trang giới thiệu công khai của Giảng viên phụ trách môn học. Endpoint này **bảo vệ quyền riêng tư tuyệt đối**: tự động lược bỏ các thông tin nhạy cảm (Email, Số điện thoại, Trạng thái tài khoản, Cờ bảo mật) và bổ sung các thống kê học thuật liên quan.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID)*: Mã định danh của người dùng cần xem hồ sơ công khai.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy hồ sơ người dùng thành công",
  "data": {
    "id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "fullName": "TS. Hoàng Minh Đức",
    "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher1.png",
    "bio": "Tiến sĩ Khoa học Máy tính - Đam mê phát triển kiến trúc Microservices và ứng dụng AI trong giáo dục.",
    "role": "teacher",
    "stats": {
      "publishedCoursesCount": 3,
      "activeClassesCount": 2,
      "totalStudentsTaught": 128
    },
    "createdAt": "2026-09-01T08:00:00.000Z"
  },
  "timestamp": "2026-09-24T14:12:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `404` | `Not Found` | Không tìm thấy người dùng | `id` không tồn tại hoặc tài khoản đã bị xóa mềm / bị khóa |

---

### 2.5. Lấy danh sách người dùng toàn trường (Admin Tra Cứu)

#### `GET /api/v1/users`
* **Mô tả chức năng:** Quản trị viên tra cứu, tìm kiếm và phân trang danh sách người dùng toàn hệ sinh thái (`UC-ADMIN-001`). Hỗ trợ bộ lọc kết hợp đa tiêu chí theo vai trò (`role`), tình trạng hoạt động (`status`), sắp xếp linh hoạt theo chuẩn [`api-conventions.md`](api-conventions.md).
* **Quyền hạn:** `[Roles: admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Query Parameters:**
  * `page` *(number, default: 1)*: Số trang hiển thị (1-indexed).
  * `limit` *(number, default: 20, max: 100)*: Số người dùng mỗi trang.
  * `search` *(string, optional)*: Từ khóa tìm kiếm theo Họ tên, Email hoặc Số điện thoại người dùng (sử dụng toán tử ILIKE).
  * `role` *(string, optional, enum: `student`, `teacher`, `training_manager`, `admin`)*: Lọc theo vai trò.
  * `status` *(string, optional, enum: `active`, `blocked`, `unverified`)*:
    * `active`: Tài khoản đang hoạt động bình thường (`is_active = true` AND `email_verified = true`).
    * `blocked`: Tài khoản đang bị Admin khóa (`is_active = false`).
    * `unverified`: Tài khoản chưa hoàn tất xác thực email (`email_verified = false`).
  * `sortBy` *(string, default: `"createdAt"`)*: Tiêu chí sắp xếp (`createdAt`, `fullName`, `email`, `role`).
  * `sortOrder` *(string, default: `"DESC"`, enum: `"ASC"`, `"DESC"`)*: Chiều sắp xếp.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "items": [
      {
        "id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "email": "teacher1@eduverse.vn",
        "fullName": "TS. Hoàng Minh Đức",
        "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher1.png",
        "phoneNumber": "0987654321",
        "role": "teacher",
        "isActive": true,
        "emailVerified": true,
        "mustChangePassword": false,
        "createdAt": "2026-09-01T08:00:00.000Z"
      },
      {
        "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
        "email": "student1@eduverse.vn",
        "fullName": "Nguyễn Văn An",
        "avatarUrl": null,
        "phoneNumber": null,
        "role": "student",
        "isActive": true,
        "emailVerified": true,
        "mustChangePassword": false,
        "createdAt": "2026-09-05T09:15:00.000Z"
      },
      {
        "id": "u5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
        "email": "student_spam@eduverse.vn",
        "fullName": "Lê Văn Vi Phạm",
        "avatarUrl": null,
        "phoneNumber": "0912345678",
        "role": "student",
        "isActive": false,
        "emailVerified": true,
        "mustChangePassword": false,
        "createdAt": "2026-09-10T11:20:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 154,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T14:15:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn không có quyền quản trị người dùng | Người dùng không mang vai trò `admin` |

---

### 2.6. Xem chi tiết toàn diện thông tin người dùng (Admin Detail)

#### `GET /api/v1/users/:id`
* **Mô tả chức năng:** Quản trị viên xem hồ sơ chi tiết và tóm tắt hoạt động của một tài khoản người dùng bất kỳ (bao gồm cả lý do bị khóa `blockReason`, cờ đổi pass `mustChangePassword`, số lớp giảng dạy, số khóa học đã tạo).
* **Quyền hạn:** `[Roles: admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID)*: Mã định danh của người dùng cần xem.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy chi tiết người dùng thành công",
  "data": {
    "id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "email": "teacher1@eduverse.vn",
    "fullName": "TS. Hoàng Minh Đức",
    "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/teacher1.png",
    "phoneNumber": "0987654321",
    "bio": "Tiến sĩ Khoa học Máy tính - Đam mê phát triển kiến trúc Microservices.",
    "role": "teacher",
    "isActive": true,
    "blockReason": null,
    "emailVerified": true,
    "mustChangePassword": false,
    "statistics": {
      "teachingClassesCount": 4,
      "createdCoursesCount": 2
    },
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-09-24T14:05:00.000Z"
  },
  "timestamp": "2026-09-24T14:20:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `404` | `Not Found` | Không tìm thấy người dùng | `id` không tồn tại hoặc đã bị xóa mềm |

---

### 2.7. Khởi tạo tài khoản Giảng viên / Quản lý / Admin (Admin Cấp Tài Khoản)

#### `POST /api/v1/users`
* **Mô tả chức năng:** Quản trị viên chủ động cấp tài khoản cho cán bộ giảng viên, quản lý đào tạo hoặc quản trị viên cấp dưới (`UC-ADMIN-002`). Hệ thống tự động sinh mật khẩu tạm thời ngẫu nhiên độ an toàn cao (12 ký tự gồm chữ hoa, số, ký tự đặc biệt), lưu hash bcrypt vào DB, kích hoạt trạng thái `email_verified = true`, đánh dấu cờ `must_change_password = true` và gọi SMTP Email Service gửi thông tin đăng nhập đến email của nhân sự.
* **Quyền hạn:** `[Roles: admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`application/json`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `email` | `string` | ✔️ | Địa chỉ email người dùng (Duy nhất, định dạng chuẩn RFC 5322) |
| `fullName` | `string` | ✔️ | Họ và tên đầy đủ (2 - 150 ký tự) |
| `role` | `string` | ✔️ | Vai trò phân cấp (`teacher`, `training_manager`, `admin`, `student`) |
| `phoneNumber` | `string` | ❌ | Số điện thoại liên hệ (9 - 15 chữ số) |

```json
{
  "email": "le.thu.ha@eduverse.vn",
  "fullName": "ThS. Lê Thu Hà",
  "role": "teacher",
  "phoneNumber": "0978123456"
}
```

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Khởi tạo tài khoản thành công. Email chứa thông tin tài khoản và mật khẩu tạm đã được gửi đến người dùng.",
  "data": {
    "id": "u7a8b9c0-1d2e-3f4a-5b6c-7d8e9f0a1b2c",
    "email": "le.thu.ha@eduverse.vn",
    "fullName": "ThS. Lê Thu Hà",
    "role": "teacher",
    "isActive": true,
    "emailVerified": true,
    "mustChangePassword": true,
    "createdAt": "2026-09-24T14:25:00.000Z"
  },
  "timestamp": "2026-09-24T14:25:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Vai trò được phân bổ không hợp lệ | `role` nằm ngoài danh mục cho phép |
| `409` | `Conflict` | Địa chỉ email này đã tồn tại trong hệ thống | Email đã được sử dụng bởi một tài khoản đang hoạt động |

---

### 2.8. Cập nhật thông tin & Gán / Thu hồi vai trò (RBAC)

#### `PATCH /api/v1/users/:id`
* **Mô tả chức năng:** Quản trị viên cập nhật thông tin họ tên, số điện thoại hoặc thay đổi vai trò phân quyền RBAC của người dùng (`UC-ADMIN-003`). Nếu thay đổi vai trò của người dùng đang online, hệ thống sẽ tự động vô hiệu hóa Refresh Token của người dùng đó để ép buộc phiên đăng nhập sau nhận JWT mang Payload vai trò mới.
* **Quyền hạn:** `[Roles: admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`application/json`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `fullName` | `string` | ❌ | Cập nhật họ tên mới (2 - 150 ký tự) |
| `phoneNumber` | `string` | ❌ | Cập nhật số điện thoại liên hệ |
| `role` | `string` | ❌ | Gán vai trò mới (`student`, `teacher`, `training_manager`, `admin`) |

```json
{
  "role": "training_manager"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật phân quyền người dùng thành công",
  "data": {
    "id": "u7a8b9c0-1d2e-3f4a-5b6c-7d8e9f0a1b2c",
    "email": "le.thu.ha@eduverse.vn",
    "fullName": "ThS. Lê Thu Hà",
    "role": "training_manager",
    "updatedAt": "2026-09-24T14:30:00.000Z"
  },
  "timestamp": "2026-09-24T14:30:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Không thể tự thu hồi quyền Admin của chính mình | Admin cố tình hạ quyền tài khoản bản thân khiến hệ thống mất quản trị |
| `404` | `Not Found` | Không tìm thấy người dùng | `id` không tồn tại |

---

### 2.9. Khóa / Mở khóa tài khoản người dùng

#### `PATCH /api/v1/users/:id/status`
* **Mô tả chức năng:** Quản trị viên thực hiện vô hiệu hóa tài khoản vi phạm chính sách hoặc mở khóa cho tài khoản sau khi giải trình (`UC-ADMIN-004`). Khi tài khoản bị khóa (`isActive = false`), lý do được lưu vào cột `block_reason`, toàn bộ Refresh Token của tài khoản đó lập tức bị thu hồi, người dùng bị đẩy văng khỏi hệ thống và nhận email thông báo kỷ luật. Khi mở khóa (`isActive = true`), `block_reason` được thiết lập về `null`.
* **Quyền hạn:** `[Roles: admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`application/json`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `isActive` | `boolean` | ✔️ | `false`: Khóa tài khoản; `true`: Kích hoạt/Mở khóa lại |
| `reason` | `string` | ❌ | Lý do thực hiện hành động (Bắt buộc khi `isActive = false`, tối đa 500 ký tự) |

```json
{
  "isActive": false,
  "reason": "Phát hiện hành vi gian lận thi cử có hệ thống trong bài kiểm tra giữa kỳ môn Web Development."
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã khóa tài khoản người dùng thành công và gửi thông báo qua email",
  "data": {
    "id": "u5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
    "email": "student_spam@eduverse.vn",
    "isActive": false,
    "blockReason": "Phát hiện hành vi gian lận thi cử có hệ thống trong bài kiểm tra giữa kỳ môn Web Development.",
    "updatedAt": "2026-09-24T14:35:00.000Z"
  },
  "timestamp": "2026-09-24T14:35:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Phải cung cấp lý do khi thực hiện khóa tài khoản | Thiếu trường `reason` khi `isActive: false` |
| `400` | `Bad Request` | Không thể tự khóa tài khoản của chính mình | Admin cố tình tự khóa tài khoản bản thân |
| `404` | `Not Found` | Không tìm thấy người dùng | `id` không tồn tại |

---

### 2.10. Đặt lại mật khẩu khẩn cấp cho người dùng (Admin Emergency Password Reset)

#### `POST /api/v1/users/:id/reset-password`
* **Mô tả chức năng:** Quản trị viên hỗ trợ đặt lại mật khẩu cho giảng viên hoặc sinh viên khi họ bị mất quyền truy cập hòm thư hoặc gặp sự cố khẩn cấp. Hệ thống tự sinh mật khẩu ngẫu nhiên mới, hash lưu vào DB, bật cờ `must_change_password = true`, thu hồi toàn bộ phiên đăng nhập cũ và gửi thư thông báo kèm mật khẩu mới cho người dùng.
* **Quyền hạn:** `[Roles: admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID)*: ID người dùng cần đặt lại mật khẩu.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đặt lại mật khẩu thành công. Mật khẩu mới đã được gửi tới email của người dùng.",
  "data": {
    "id": "u2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
    "email": "student1@eduverse.vn",
    "mustChangePassword": true,
    "resetAt": "2026-09-24T14:38:00.000Z"
  },
  "timestamp": "2026-09-24T14:38:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `404` | `Not Found` | Không tìm thấy người dùng | `id` không tồn tại |

---

### 2.11. Xóa mềm tài khoản người dùng

#### `DELETE /api/v1/users/:id`
* **Mô tả chức năng:** Xóa tài khoản người dùng khỏi hệ thống theo phương pháp **Soft Delete** (`deleted_at = now()`). Hệ thống bảo lưu toàn vẹn dữ liệu điểm thi, bài tập đã nộp, phản hồi và phân công lớp học của người dùng đó trong quá khứ nhưng ngăn chặn hoàn toàn việc đăng nhập.
* **Quyền hạn:** `[Roles: admin]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã xóa mềm tài khoản người dùng thành công",
  "data": {
    "id": "u5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
    "deletedAt": "2026-09-24T14:40:00.000Z"
  },
  "timestamp": "2026-09-24T14:40:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Không thể xóa tài khoản của chính mình | Admin cố xóa chính tài khoản đang phiên làm việc |
| `404` | `Not Found` | Người dùng không tồn tại hoặc đã bị xóa | `id` không hợp lệ |

---

### 2.12. Cấp tài khoản hàng loạt qua file Excel / CSV (Bulk Import Users)

#### `POST /api/v1/users/bulk-import`
* **Mô tả chức năng:** Nhập dữ liệu danh sách hàng trăm sinh viên/giảng viên cùng lúc từ file bảng tính (`.xlsx` hoặc `.csv`). Hệ thống duyệt qua từng dòng dữ liệu, kiểm tra tính hợp lệ và trùng lặp email, tạo bản ghi trong bảng `users`, sinh mật khẩu tạm thời ngẫu nhiên, bật cờ `must_change_password = true` và gửi email hàng loạt thông qua hàng đợi bất đồng bộ (BullMQ Job Worker).
* **Quyền hạn:** `[Roles: admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: multipart/form-data`
* **Multipart Payload:**
  * `file`: Tệp bảng tính định dạng `.xlsx` hoặc `.csv` (Dung lượng tối đa $5\text{ MB}$).
  * `defaultRole` *(string, optional, enum: `student`, `teacher`, default: `student`)*: Vai trò mặc định nếu trong file không chỉ định cột `role`.

* **Cấu trúc cột chuẩn của file bảng tính:**
  | Cột A | Cột B | Cột C | Cột D |
  |---|---|---|---|
  | `email` *(Bắt buộc)* | `fullName` *(Bắt buộc)* | `phoneNumber` *(Tùy chọn)* | `role` *(Tùy chọn: `student`, `teacher`, `training_manager`)* |
  | `sv2026001@eduverse.vn` | `Nguyễn Văn A` | `0981234567` | `student` |
  | `sv2026002@eduverse.vn` | `Trần Thị B` | `0987654321` | `student` |

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xử lý nhập danh sách người dùng hoàn tất",
  "data": {
    "totalRows": 50,
    "successCount": 48,
    "failureCount": 2,
    "errors": [
      {
        "row": 12,
        "email": "invalid-email-format",
        "reason": "Địa chỉ email không đúng định dạng"
      },
      {
        "row": 35,
        "email": "teacher1@eduverse.vn",
        "reason": "Địa chỉ email đã tồn tại trong hệ thống"
      }
    ]
  },
  "timestamp": "2026-09-24T14:45:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Định dạng file không hợp lệ | File tải lên không phải đuôi `.xlsx` hoặc `.csv` |
| `400` | `Bad Request` | Dung lượng file vượt quá giới hạn 5MB | Tệp tải lên quá lớn |
| `422` | `Unprocessable Entity` | File rỗng hoặc thiếu các cột tiêu đề bắt buộc | File không có các cột `email`, `fullName` |

---

## 3. Ghi Chú Kỹ Thuật & Bảo Mật Module Users

### 3.1. Đảm bảo tính Toàn vẹn Dữ liệu với Soft Delete (Xóa mềm)
- Cột `deleted_at` trong bảng `users` cho phép bảo lưu toàn bộ lịch sử điểm số, bài nộp `assignment_submissions`, bài thi `quiz_attempts` và phân công lớp học của học viên / giảng viên đó.
- Cột `email` áp dụng **Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX uq_users_email_active ON users (email) WHERE deleted_at IS NULL;
  ```
  Nhờ đó, nếu một tài khoản cũ bị xóa mềm trong quá khứ, địa chỉ email đó vẫn có thể được tái sử dụng để đăng ký tài khoản mới trong tương lai mà không bị xung đột khóa ngoại Unique Constraint.

### 3.2. Cơ chế Thu hồi Phiên (Session Invalidation) khi Đổi Mật Khẩu / Khóa Tài Khoản
- Khi người dùng đổi mật khẩu thành công (`PATCH /users/me/password`), khi Admin đặt lại mật khẩu khẩn cấp (`POST /users/:id/reset-password`), hoặc khi Admin khóa tài khoản (`PATCH /users/:id/status` với `isActive: false`):
  1. Toàn bộ Token trong bảng `user_tokens` hoặc Redis Token Whitelist/Blacklist liên kết với `userId` đó sẽ bị xóa/vô hiệu hóa tức thì.
  2. Bất kỳ request nào sau đó sử dụng Refresh Token cũ để gia hạn Access Token đều sẽ bị từ chối với mã lỗi `401 Unauthorized`.
  3. Riêng người đổi mật khẩu tại phiên làm việc hiện tại sẽ được cấp một cặp Token mới hoặc giữ nguyên phiên đang thực thi.

### 3.3. Xử lý Bất đồng bộ khi Import Hàng Loạt (Asynchronous Bulk Import Worker)
- Thao tác `POST /users/bulk-import` với số lượng hàng trăm đến hàng nghìn người dùng sẽ được đưa vào hàng đợi **BullMQ** chạy nền trong Worker để tránh gây treo HTTP Request của Backend:
  1. Fast-parse file Excel và kiểm tra sơ bộ định dạng các dòng.
  2. Batch Insert các bản ghi người dùng hợp lệ vào Database bằng một Transaction duy nhất (`chunkSize: 100`).
  3. Bắn các Task gửi email chứa mật khẩu khởi tạo qua Mail Worker có giới hạn tốc độ (Rate Limiting SMTP) để không bị nhà cung cấp email chặn thư rác (Spam Filter).

### 3.4. Thứ tự Khai báo Route trong Express Router (Route Precedence)
- **Lưu ý sống còn khi code Backend Express.js:** Do cơ chế Route Matching từ trên xuống dưới theo thứ tự đăng ký middleware, các route tĩnh phải được định nghĩa **TRƯỚC** các route có path parameter `:id`:
  ```javascript
  // ✅ ĐÚNG: Khai báo route tĩnh trước
  router.get('/me', authMiddleware, userController.getProfile);
  router.patch('/me/password', authMiddleware, validateChangePassword, userController.changePassword);
  router.post('/bulk-import', authMiddleware, requireRole('ADMIN'), upload.single('file'), userController.bulkImport);

  // Sau đó mới đến route động :id
  router.get('/:id', authMiddleware, validateUUIDParam, userController.getUserById);
  ```
  Nếu đặt ngược lại (`router.get('/:id', ...)` lên trước), Express sẽ bắt chuỗi `"me"` làm giá trị `:id` (`req.params.id = 'me'`) và ném lỗi `400 Bad Request: Validation failed (UUID is expected)`.

