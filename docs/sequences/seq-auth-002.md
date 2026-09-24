# 🔄 SEQ-AUTH-002: Đăng nhập & Cấp JWT Token

> **Use Case liên quan:** [UC-AUTH-002](../use-cases/actor-student.md#uc-auth-002)  
> **Actor chính:** Tất cả vai trò (Học viên, Giảng viên, Quản trị viên, Quản lý đào tạo)  
> **Tóm tắt luồng:** Người dùng nhập email và mật khẩu, hệ thống kiểm tra danh tính qua hash bcrypt, xác thực trạng thái tài khoản (`ACTIVE`), sinh cặp mã JWT (Access Token hạn ngắn + Refresh Token hạn dài), lưu Refresh Token và điều hướng người dùng tới Dashboard tương ứng với vai trò.

---

## 1. Sơ Đồ Tuần Tự (Sequence Diagram)

### 1.1. Luồng Thành Công — Đăng Nhập (Happy Path)

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend
    participant CTRL as AuthController
    participant SVC as AuthService
    participant DB as Repository

    User->>FE: Điền thông tin đăng nhập (email, password)
    FE->>CTRL: POST /api/v1/auth/login
    CTRL->>SVC: login(loginDto)

    SVC->>DB: findOneBy email
    DB-->>SVC: user (email_verified=true, is_active=true)

    SVC->>SVC: comparePassword (bcrypt.compare)
    SVC->>SVC: generateTokens (accessToken 15m, refreshToken 7d)

    SVC->>DB: saveToken (user_tokens: token_type=refresh_token, hashedToken)
    DB-->>SVC: ok

    SVC-->>CTRL: return authResult (tokens, userSummary)
    CTRL-->>FE: 200 OK - {accessToken, user} + Set-Cookie refreshToken
    FE->>FE: Lưu accessToken vào memory
    FE->>FE: Xác định Dashboard route theo vai trò (Role-based)
    FE-->>User: Điều hướng vào Dashboard tương ứng vai trò
```

### 1.2. Luồng Ngoại Lệ & Cấp Lại Token (Error Paths & Refresh Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend
    participant CTRL as AuthController
    participant SVC as AuthService
    participant DB as Repository

    User->>FE: Điền form đăng nhập
    FE->>CTRL: POST /api/auth/login

    alt Dữ liệu không hợp lệ (email sai định dạng, mật khẩu trống)
        CTRL->>CTRL: validate DTO (class-validator)
        CTRL-->>FE: 400 Bad Request - Dữ liệu không hợp lệ
        FE-->>User: Hiển thị lỗi validation trên form
    else Sai thông tin đăng nhập (email không tồn tại hoặc sai mật khẩu)
        CTRL->>SVC: login(loginDto)
        SVC->>DB: findOneBy email
        DB-->>SVC: user hoặc null
        SVC->>SVC: kiểm tra mật khẩu thất bại
        SVC-->>CTRL: throw UnauthorizedException
        CTRL-->>FE: 401 Unauthorized - Email hoặc mật khẩu không chính xác
        FE-->>User: Hiển thị lỗi đăng nhập thất bại chung
    else Tài khoản chưa kích hoạt (status=PENDING)
        CTRL->>SVC: login(loginDto)
        SVC->>DB: findOneBy email
        DB-->>SVC: user (status=PENDING)
        SVC-->>CTRL: throw ForbiddenException
        CTRL-->>FE: 403 Forbidden - Tài khoản chưa kích hoạt email
        FE-->>User: Hiển thị thông báo & Nút gửi lại OTP kích hoạt
    else Tài khoản bị khóa (status=BANNED)
        CTRL->>SVC: login(loginDto)
        SVC->>DB: findOneBy email
        DB-->>SVC: user (status=BANNED)
        SVC-->>CTRL: throw ForbiddenException
        CTRL-->>FE: 403 Forbidden - Tài khoản bị khóa
        FE-->>User: Hiển thị thông báo liên hệ Quản trị viên
    end

    opt Khi Access Token hết hạn - Luồng Refresh Token
        FE->>CTRL: POST /api/auth/refresh-token (kèm refreshToken)
        CTRL->>SVC: refreshToken(refreshTokenDto)
        SVC->>DB: findRefreshToken (userId, hashedToken)
        DB-->>SVC: validTokenRecord
        SVC->>SVC: generateAccessToken mới (15m)
        SVC-->>CTRL: return newAccessToken
        CTRL-->>FE: 200 OK - {accessToken: newAccessToken}
        FE->>FE: Cập nhật accessToken mới trong memory
    end
```

---

## 2. Bảng Mô Tả Chi Tiết Các Bước

### 2.1. Luồng Đăng Nhập (Happy Path — tương ứng 14 bước trên sơ đồ 1.1)

| Bước | Từ | Đến | Phương thức / Thao tác | Dữ liệu gửi | Dữ liệu nhận | Mô tả nghiệp vụ |
|:---:|---|---|---|---|---|---|
| 1 | User | Frontend | Nhập form | `{email, password}` | — | Người dùng điền email và mật khẩu tại trang Login |
| 2 | Frontend | AuthController | `POST /api/auth/login` | `LoginDto` | — | Gửi request đăng nhập lên backend API |
| 3 | AuthController | AuthService | `authService.login(dto)` | `LoginDto` | — | Chuyển tiếp DTO sau khi ValidationPipe xác nhận dữ liệu hợp lệ |
| 4 | AuthService | UserRepository | `repo.findOneBy({email})` | `{email}` | — | Tìm kiếm thông tin người dùng trong cơ sở dữ liệu theo email |
| 5 | UserRepository | AuthService | Trả kết quả | — | `user (status=ACTIVE)` | Trả về thực thể user với mật khẩu băm và trạng thái hoạt động |
| 6 | AuthService | AuthService | `bcrypt.compare()` | `(plainPassword, user.password)` | `boolean (true)` | So khớp mật khẩu người dùng nhập với hash đã lưu |
| 7 | AuthService | AuthService | `generateTokens()` | `{sub: user.id, role: user.role}` | `tokens` | Sinh cặp Access Token (TTL 15 phút) và Refresh Token (TTL 7 ngày) |
| 8 | AuthService | RefreshTokenRepo | `repo.save()` | `{userId, hashedRefreshToken}` | — | Băm và lưu Refresh Token vào DB để quản lý phiên và thu hồi |
| 9 | RefreshTokenRepo | AuthService | Trả kết quả | — | `ok` | Xác nhận lưu phiên đăng nhập thành công |
| 10 | AuthService | AuthController | Return | — | `{accessToken, refreshToken, user}` | Trả về kết quả xác thực cho Controller |
| 11 | AuthController | Frontend | `HTTP 200 OK` | `Set-Cookie: refreshToken` | `{accessToken, user}` | Trả Access Token trong body JSON, đính kèm Refresh Token qua httpOnly cookie |
| 12 | Frontend | Frontend | Xử lý token | `accessToken, user.role` | — | Lưu Access Token vào bộ nhớ (Memory/State) và đọc vai trò người dùng |
| 13 | Frontend | Frontend | Role-based routing | `user.role` | — | Xác định đường dẫn Dashboard phù hợp (`/student`, `/teacher`, `/admin`) |
| 14 | Frontend | User | Điều hướng | — | — | Chuyển hướng người dùng vào màn hình làm việc tương ứng |

---

## 3. Ghi Chú Kỹ Thuật & Nghiệp Vụ Quan Trọng

- **Bảo mật:**
  - **Thông điệp lỗi bảo mật (Information Leakage):** Khi sai thông tin đăng nhập, **chỉ trả về một câu thông báo chung**: *"Email hoặc mật khẩu không chính xác"*. Tuyệt đối không chỉ rõ email không tồn tại hay sai mật khẩu để ngăn tấn công dò quét tài khoản (User Enumeration).
  - **Cơ chế Token (JWT Dual-token):**
    - **Access Token:** Hạn ngắn (**15 phút**), mang payload `{sub: userId, email, role}`, ký bằng secret key `JWT_ACCESS_SECRET`.
    - **Refresh Token:** Hạn dài (**7 ngày**), lưu dưới dạng mã hóa `SHA-256` hoặc `bcrypt` trong bảng `refresh_tokens`, trả về qua `httpOnly`, `Secure`, `SameSite=Strict` Cookie nhằm chống tấn công XSS.
  - **Thu hồi phiên đăng nhập (Token Revocation / Logout):** Xóa bản ghi Refresh Token trong DB khi người dùng bấm Đăng xuất hoặc khi phát hiện Refresh Token bị dùng lại bất thường (Refresh Token Rotation).
  - **Chống Brute-force Login:** Áp dụng Rate Limiting qua `@nestjs/throttler` — tối đa **5 lần thử đăng nhập sai liên tiếp trong 5 phút** cho mỗi IP/Email.

- **Hiệu năng & Khả năng mở rộng:**
  - Bản ghi Refresh Token có thể lưu trữ trong **Redis** với TTL tự động để tối ưu tốc độ đọc/ghi và giảm tải cho PostgreSQL.
  - Phía Frontend dùng **Axios Interceptor** để tự động bắt mã `401 Unauthorized` khi Access Token hết hạn, âm thầm gọi `/api/auth/refresh-token` lấy token mới mà không làm gián đoạn trải nghiệm người dùng.

- **Phụ thuộc kỹ thuật (Dependencies):**
  - Backend: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `cookie-parser`.
  - Database: Bảng `users` (`id`, `email`, `password`, `role`, `status`), bảng `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `is_revoked`).
