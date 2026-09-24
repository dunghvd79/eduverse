# 🔐 Đặc Tả API: Module Xác Thực & Phiên Đăng Nhập — api-auth.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`api-users.md`](api-users.md), [`seq-auth-001.md`](../sequences/seq-auth-001.md), [`seq-auth-002.md`](../sequences/seq-auth-002.md)  
> **Base Path:** `/api/v1/auth`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ đăng ký tài khoản, kích hoạt email OTP, đăng nhập JWT Dual-token (HttpOnly Cookie), xoay vòng Refresh Token (Token Rotation), đăng xuất thu hồi phiên, quên mật khẩu và kiểm tra phiên làm việc.

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Vòng đời Xác thực & Đăng nhập (Authentication & Session)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/auth/register` | `[Public]` | Đăng ký tài khoản học viên mới (`email_verified = false`, gửi OTP kích hoạt) |
| `POST` | `/api/v1/auth/verify-otp` | `[Public]` | Xác thực mã OTP 6 số để kích hoạt tài khoản & tự động cấp JWT token |
| `POST` | `/api/v1/auth/resend-otp` | `[Public]` | Gửi lại mã OTP xác thực email (giới hạn tần suất 3 lần/giờ) |
| `POST` | `/api/v1/auth/login` | `[Public]` | Đăng nhập hệ thống (nhận Access Token body JSON & HttpOnly Cookie Refresh Token) |
| `POST` | `/api/v1/auth/refresh-token` | `[Public / Cookie]` | Cấp Access Token mới và xoay vòng Refresh Token (Token Rotation) |
| `POST` | `/api/v1/auth/logout` | `[Authenticated]` | Đăng xuất, xóa Cookie và thu hồi Refresh Token trong DB |

### 1.2. Khôi phục & Quản lý Mật khẩu (Password Recovery & Management)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/auth/forgot-password` | `[Public]` | Yêu cầu gửi link đặt lại mật khẩu an toàn vào email |
| `POST` | `/api/v1/auth/reset-password` | `[Public]` | Đặt lại mật khẩu mới thông qua reset token |
| `PATCH` | `/api/v1/auth/change-password` | `[Authenticated]` | Đổi mật khẩu tài khoản và thu hồi các phiên đăng nhập khác *(Route alias của `api-users.md`)* |

### 1.3. Kiểm tra Phiên làm việc (Session Verification)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/auth/me` | `[Authenticated]` | Kiểm tra nhanh tính hợp lệ của phiên đăng nhập (Token Claims Verification) |

> [!NOTE]
> Để cập nhật thông tin hồ sơ chi tiết (Họ tên, Ảnh đại diện S3, Số điện thoại, Tiểu sử bio) hoặc thực hiện các thao tác quản trị người dùng nâng cao, vui lòng xem tài liệu chuyên biệt **[`api-users.md`](api-users.md)**.

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

---

### 2.1. Đăng ký tài khoản mới

#### `POST /api/v1/auth/register`
* **Mô tả chức năng:** Tiếp nhận thông tin đăng ký của khách, kiểm tra tính duy nhất của email, băm mật khẩu bằng `bcrypt`, tạo bản ghi trong bảng `users` với cờ `email_verified = false`, tạo mã OTP 6 chữ số lưu trong bảng `user_tokens` (`token_type: email_verification`, TTL 10 phút) và gửi email kích hoạt qua dịch vụ SMTP.
* **Quyền hạn:** `[Public]`
* **Headers:** `Content-Type: application/json`

#### Request Body (`RegisterDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `email` | `string` | ✔️ | Địa chỉ email người dùng (Duy nhất, định dạng RFC 5322, tối đa 255 ký tự) |
| `password` | `string` | ✔️ | Mật khẩu tài khoản (8 - 32 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt) |
| `fullName` | `string` | ✔️ | Họ và tên đầy đủ của học viên (2 - 150 ký tự) |

```json
{
  "email": "student@eduverse.edu.vn",
  "password": "Password123@",
  "fullName": "Nguyễn Văn A"
}
```

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực OTP kích hoạt tài khoản.",
  "data": {
    "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "email": "student@eduverse.edu.vn",
    "fullName": "Nguyễn Văn A",
    "role": "student",
    "emailVerified": false,
    "isActive": true
  },
  "timestamp": "2026-09-24T10:00:00.000Z"
}
```

#### Các lỗi thường gặp (Error Cases):
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu gửi lên không hợp lệ | Thiếu trường bắt buộc, email sai định dạng hoặc mật khẩu yếu |
| `409` | `Conflict` | Địa chỉ email này đã tồn tại trong hệ thống | Email đã được sử dụng bởi một tài khoản đang hoạt động |
| `503` | `Service Unavailable` | Không thể gửi email xác thực | Hạ tầng SMTP gặp sự cố (Transaction tự động rollback hủy tạo tài khoản) |

---

### 2.2. Xác thực mã OTP kích hoạt tài khoản

#### `POST /api/v1/auth/verify-otp`
* **Mô tả chức năng:** Học viên nhập mã OTP 6 chữ số nhận từ email. Hệ thống kiểm tra mã trong bảng `user_tokens`, đối chiếu thời hạn hết hạn (`expires_at > now()`), cập nhật `email_verified = true` trong bảng `users`, đánh dấu `is_used = true` cho OTP, và tự động cấp cặp token JWT (tự động đăng nhập).
* **Quyền hạn:** `[Public]`
* **Headers:** `Content-Type: application/json`

#### Request Body (`VerifyOtpDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `email` | `string` | ✔️ | Địa chỉ email cần xác thực |
| `otp` | `string` | ✔️ | Mã OTP 6 chữ số nhận qua email |

```json
{
  "email": "student@eduverse.edu.vn",
  "otp": "654321"
}
```

#### Response Thành Công (`200 OK`):
* **Headers kèm theo:** `Set-Cookie: refreshToken=...; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Kích hoạt tài khoản thành công!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
      "email": "student@eduverse.edu.vn",
      "fullName": "Nguyễn Văn A",
      "avatarUrl": null,
      "role": "student",
      "emailVerified": true,
      "isActive": true,
      "mustChangePassword": false
    }
  },
  "timestamp": "2026-09-24T10:01:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tài khoản đã được kích hoạt email từ trước | `email_verified` đã bằng `true` |
| `400` | `Bad Request` | Mã OTP không chính xác | Mã 6 số không khớp bản ghi trong bảng `user_tokens` |
| `400` | `Bad Request` | Mã OTP đã hết hạn | Quá 10 phút kể từ lúc sinh mã OTP |
| `429` | `Too Many Requests` | Thử sai quá 5 lần | Nhập sai OTP quá 5 lần (Mã OTP tự động bị hủy để chống tấn công brute-force) |

---

### 2.3. Gửi lại mã OTP kích hoạt

#### `POST /api/v1/auth/resend-otp`
* **Mô tả chức năng:** Hủy mã OTP cũ chưa sử dụng, sinh mã OTP 6 số mới và gửi lại email kích hoạt cho người dùng. Áp dụng Rate Limiting tối đa 3 lần / giờ cho mỗi địa chỉ email.
* **Quyền hạn:** `[Public]`
* **Headers:** `Content-Type: application/json`

#### Request Body (`ResendOtpDto`):
```json
{
  "email": "student@eduverse.edu.vn"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Mã OTP mới đã được gửi vào hòm thư của bạn.",
  "data": null,
  "timestamp": "2026-09-24T10:02:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tài khoản đã được kích hoạt trước đó | Người dùng đã `email_verified = true` |
| `404` | `Not Found` | Không tìm thấy tài khoản | Email chưa từng được đăng ký trong hệ thống |
| `429` | `Too Many Requests` | Vượt quá giới hạn gửi lại mã | Đã gọi gửi lại quá 3 lần trong vòng 1 giờ |

---

### 2.4. Đăng nhập hệ thống

#### `POST /api/v1/auth/login`
* **Mô tả chức năng:** Xác thực email và mật khẩu qua `bcrypt.compare`. Kiểm tra tài khoản không bị khóa (`is_active = true`) và đã xác thực email (`email_verified = true`). Sau đó sinh Access Token (15 phút) trả về body JSON, và lưu Refresh Token hash SHA-256 (7 ngày) vào bảng `user_tokens` (`token_type: refresh_token`), đồng thời đính kèm cookie `httpOnly` an toàn vào Header phản hồi.
* **Quyền hạn:** `[Public]`
* **Headers:** `Content-Type: application/json`

#### Request Body (`LoginDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `email` | `string` | ✔️ | Địa chỉ email đăng nhập |
| `password` | `string` | ✔️ | Mật khẩu tài khoản |

```json
{
  "email": "student@eduverse.edu.vn",
  "password": "Password123@"
}
```

#### Response Thành Công (`200 OK`):
* **Headers kèm theo:** `Set-Cookie: refreshToken=...; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
      "email": "student@eduverse.edu.vn",
      "fullName": "Nguyễn Văn A",
      "avatarUrl": null,
      "role": "student",
      "emailVerified": true,
      "isActive": true,
      "mustChangePassword": false
    }
  },
  "timestamp": "2026-09-24T10:03:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Email hoặc mật khẩu không chính xác | Sai mật khẩu hoặc email không tồn tại (thông báo chung để chống dò quét tài khoản) |
| `403` | `Forbidden` | Tài khoản chưa được kích hoạt email | Tài khoản có `email_verified = false`. Vui lòng xác thực OTP |
| `403` | `Forbidden` | Tài khoản của bạn đã bị khóa: [Lý do] | Tài khoản có `is_active = false`. Đính kèm nội dung `block_reason` |
| `429` | `Too Many Requests` | Đăng nhập sai quá nhiều lần | Thử sai quá 5 lần liên tiếp trong 5 phút |

---

### 2.5. Cấp lại Access Token mới (Refresh Token & Token Rotation)

#### `POST /api/v1/auth/refresh-token`
* **Mô tả chức năng:** Frontend gọi endpoint này (thông qua Axios Interceptor) khi Access Token hiện tại hết hạn. Server đọc Refresh Token từ Cookie `httpOnly` (hoặc body fallback), đối chiếu mã băm trong bảng `user_tokens`. 
* **Cơ chế Token Rotation:** Nếu hợp lệ, Server đánh dấu token cũ `is_used = true`, sinh cặp token mới (Access Token mới + Refresh Token mới), cập nhật lại Cookie trình duyệt nhằm ngăn chặn tuyệt đối nguy cơ phát lại token đánh cắp (Token Replay Attack).
* **Quyền hạn:** `[Public / Cookie]`
* **Headers:** 
  * `Cookie: refreshToken=...` *(Khuyên dùng trên nền tảng Web)*
  * `Content-Type: application/json` *(Nếu gửi qua Body trên Mobile / Postman)*

#### Request Body (`RefreshTokenDto`) *(Tùy chọn nếu đã có Cookie)*:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response Thành Công (`200 OK`):
* **Headers kèm theo:** `Set-Cookie: refreshToken=...; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=604800` (Xoay vòng token mới)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cấp lại Access Token thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-09-24T10:18:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Phiên làm việc đã hết hạn hoặc không hợp lệ | Refresh Token không tồn tại, đã hết hạn 7 ngày hoặc đã bị thu hồi |

---

### 2.6. Đăng xuất hệ thống

#### `POST /api/v1/auth/logout`
* **Mô tả chức năng:** Thu hồi Refresh Token trong DB (đánh dấu `is_used = true` trong bảng `user_tokens`) và xóa Cookie `refreshToken` trên trình duyệt bằng cách trả về cờ `Max-Age=0`. Hỗ trợ tùy chọn đăng xuất toàn bộ thiết bị.
* **Quyền hạn:** `[Authenticated]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`LogoutDto`) *(Tùy chọn)*:
| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
|---|---|:---:|---|
| `allDevices` | `boolean` | `false` | `true`: Thu hồi toàn bộ Refresh Token của tài khoản trên tất cả các thiết bị |

```json
{
  "allDevices": false
}
```

#### Response Thành Công (`200 OK`):
* **Headers kèm theo:** `Set-Cookie: refreshToken=; Path=/api/v1/auth; HttpOnly; Max-Age=0` (Lệnh xóa cookie trình duyệt)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng xuất thành công",
  "data": null,
  "timestamp": "2026-09-24T10:20:00.000Z"
}
```

---

### 2.7. Quên mật khẩu (Yêu cầu gửi Reset Token)

#### `POST /api/v1/auth/forgot-password`
* **Mô tả chức năng:** Người dùng nhập email khi quên mật khẩu. Hệ thống tạo một bản ghi Reset Token ngẫu nhiên (UUID băm SHA-256, TTL 15 phút) lưu vào bảng `user_tokens` (`token_type: password_reset`), đồng thời gửi link `https://eduverse.edu.vn/reset-password?token=...` qua email.
* **Quyền hạn:** `[Public]`
* **Headers:** `Content-Type: application/json`

#### Request Body (`ForgotPasswordDto`):
```json
{
  "email": "student@eduverse.edu.vn"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.",
  "data": null,
  "timestamp": "2026-09-24T10:25:00.000Z"
}
```
> *Lưu ý an ninh:* Kể cả khi email không tồn tại trong hệ thống, API vẫn luôn trả về thông điệp `200 OK` giống hệt nhau để ngăn chặn kẻ tấn công dò quét sự tồn tại của email.

---

### 2.8. Đặt lại mật khẩu mới

#### `POST /api/v1/auth/reset-password`
* **Mô tả chức năng:** Người dùng gửi mật khẩu mới kèm chuỗi token trích xuất từ link email. Hệ thống kiểm tra hạn token trong bảng `user_tokens`, băm mật khẩu mới bằng `bcrypt`, cập nhật vào bảng `users`, đồng thời đánh dấu `is_used = true` cho token và thu hồi toàn bộ phiên đăng nhập cũ trên các thiết bị khác.
* **Quyền hạn:** `[Public]`
* **Headers:** `Content-Type: application/json`

#### Request Body (`ResetPasswordDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `token` | `string` | ✔️ | Chuỗi token bảo mật lấy từ liên kết email |
| `newPassword` | `string` | ✔️ | Mật khẩu mới (Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt) |

```json
{
  "token": "a1b2c3d4e5f6-secure-reset-token",
  "newPassword": "NewStrongPassword123@"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.",
  "data": null,
  "timestamp": "2026-09-24T10:27:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn | Token sai, đã sử dụng hoặc quá thời hạn 15 phút |
| `400` | `Bad Request` | Mật khẩu mới không đủ độ an toàn | Mật khẩu vi phạm chính sách độ dài/ký tự |

---

### 2.9. Thay đổi mật khẩu khi đang đăng nhập (Change Password)

#### `PATCH /api/v1/auth/change-password`
* **Mô tả chức năng:** Route bí danh (alias) tương thích của `PATCH /api/v1/users/me/password`. Cho phép người dùng đang đăng nhập đổi mật khẩu, xác thực mật khẩu cũ qua bcrypt, băm mật khẩu mới và tự động vô hiệu hóa toàn bộ Refresh Token trên các thiết bị khác. Tự động chuyển cờ `must_change_password` về `false`.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** 
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`ChangePasswordDto`):
| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Ràng buộc |
|---|---|:---:|---|
| `currentPassword` | `string` | ✔️ | Mật khẩu hiện tại của người dùng |
| `newPassword` | `string` | ✔️ | Mật khẩu mới (8 - 32 ký tự, đủ chữ hoa, thường, số, ký tự đặc biệt) |
| `confirmPassword` | `string` | ✔️ | Xác nhận lại mật khẩu mới (phải khớp `newPassword`) |

```json
{
  "currentPassword": "OldPassword123@",
  "newPassword": "NewSecurePassword456@",
  "confirmPassword": "NewSecurePassword456@"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được thu hồi.",
  "data": {
    "passwordChangedAt": "2026-09-24T10:35:00.000Z",
    "mustChangePassword": false,
    "revokedOtherSessions": true
  },
  "timestamp": "2026-09-24T10:35:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Mật khẩu hiện tại không chính xác | Người dùng nhập sai mật khẩu cũ |
| `400` | `Bad Request` | Mật khẩu mới không được trùng mật khẩu cũ | Nhập lại mật khẩu đang sử dụng |
| `400` | `Bad Request` | Mật khẩu xác nhận không khớp | `confirmPassword` khác `newPassword` |

---

### 2.10. Kiểm tra phiên đăng nhập hiện tại (Session Claims Verification)

#### `GET /api/v1/auth/me`
* **Mô tả chức năng:** Được gọi khi ứng dụng Frontend khởi tạo hoặc người dùng tải lại trang (F5). Endpoint này giải mã Access Token để trả về thông tin danh tính cơ bản và trạng thái cờ an ninh của người dùng, giúp giao diện hiển thị đúng vai trò và xử lý điều hướng.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xác thực phiên làm việc thành công",
  "data": {
    "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "email": "student@eduverse.edu.vn",
    "fullName": "Nguyễn Văn A",
    "avatarUrl": "https://s3.ap-southeast-1.amazonaws.com/eduverse/avatars/user-1.jpg",
    "role": "student",
    "emailVerified": true,
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-20T08:00:00.000Z"
  },
  "timestamp": "2026-09-24T10:30:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Phiên làm việc không hợp lệ hoặc đã hết hạn | Header Authorization thiếu hoặc token sai chữ ký |
| `403` | `Forbidden` | Tài khoản của bạn hiện đang bị tạm khóa | `is_active = false` |

---

## 3. Ghi Chú Kỹ Thuật & Bảo Mật Module Auth

### 3.1. Quản lý Token tập trung qua Bảng `user_tokens`
Toàn bộ mã xác thực ngắn hạn và phiên dài hạn đều được quản lý tập trung trong bảng `user_tokens` với cấu trúc chuẩn:
- **Mã OTP Kích hoạt Email:** `token_type = 'email_verification'`, TTL 10 phút, mã 6 số được hash SHA-256.
- **Mã Đặt lại Mật khẩu:** `token_type = 'password_reset'`, TTL 15 phút, chuỗi ngẫu nhiên 32 bytes hash SHA-256.
- **Phiên Refresh Token:** `token_type = 'refresh_token'`, TTL 7 ngày, chuỗi JWT refresh băm SHA-256 để kiểm tra tính hợp lệ và thu hồi khi người dùng đăng xuất.

### 3.2. Cơ chế Bảo vệ JWT & Cookie An Toàn
- **Access Token:** Hạn ngắn **15 phút**, thuật toán ký `HS256`, Payload chứa `{ sub: userId, email, role }`. Lưu hoàn toàn trong bộ nhớ JavaScript (Memory) của Frontend, không lưu LocalStorage để ngăn ngừa tấn công XSS.
- **Refresh Token:** Hạn dài **7 ngày**, lưu trong Cookie với các thuộc tính bảo mật nghiêm ngặt:
  - `httpOnly: true` — Trình duyệt ngăn hoàn toàn việc mã script truy cập cookie.
  - `secure: true` — Chỉ truyền tải qua kênh mã hóa HTTPS (ngoại trừ dev localhost).
  - `sameSite: 'strict'` — Ngăn chặn triệt để tấn công giả mạo yêu cầu chéo trang CSRF.
  - `path: '/api/v1/auth'` — Cookie chỉ được tự động gửi kèm khi gọi các endpoint thuộc module auth.

### 3.3. Giới hạn tần suất gọi API (Rate Limiting / Throttler)
- `POST /api/v1/auth/login`: Tối đa **5 lần / 5 phút** (chống tấn công dò mật khẩu brute-force).
- `POST /api/v1/auth/register`: Tối đa **5 lần / 1 giờ** cho mỗi địa chỉ IP (chống spam rác tạo tài khoản ảo).
- `POST /api/v1/auth/resend-otp`: Tối đa **3 lần / 1 giờ** cho mỗi địa chỉ email.
- `POST /api/v1/auth/verify-otp`: Tối đa **5 lần nhập sai** (sau 5 lần sai, bản ghi OTP tự động bị hủy).
- `POST /api/v1/auth/forgot-password`: Tối đa **3 lần / 1 giờ** cho mỗi địa chỉ email.
