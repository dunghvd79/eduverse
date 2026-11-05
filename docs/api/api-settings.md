# ⚙️ Đặc Tả API: Module Cài Đặt Hệ Thống (Settings) — api-settings.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`api-audit-logs.md`](api-audit-logs.md), [`actor-admin.md`](../use-cases/actor-admin.md) (UC-ADMIN-007), [`schema.md`](../database/schema.md) mục 21  
> **Base Path:** `/api/v1/settings`  
> **Mục đích:** Trang Cài đặt hệ thống của Admin. *Bổ sung 30/10/2026.*

---

## 1. Phân Loại Cài Đặt

| Loại | Ví dụ | Quản lý ở đâu | Trên web |
|---|---|---|---|
| **Khóa bí mật** | Access Key S3, mật khẩu SMTP, `JWT_SECRET`, `GEMINI_API_KEY` | `backend/.env` (hoặc kho bí mật khi triển khai) | **Không hiển thị, không sửa.** Chỉ cho biết đã cấu hình hay chưa |
| **Cấu hình hạ tầng** | Thời hạn token, giới hạn tần suất, giới hạn tải tệp | Biến môi trường / mã nguồn, đổi rồi khởi động lại backend | **Chỉ xem** (mục 2.2, phần `policies`) |
| **Cài đặt nghiệp vụ** | Cho phép tự đăng ký, thông báo toàn hệ thống | Bảng `system_settings` | **Admin sửa được**, mỗi lần đổi ghi nhật ký `SETTING_CHANGED` |

Lý do: sửa khóa và hạ tầng trên web vừa dễ lộ (khóa hiện ra trình duyệt) vừa bỏ qua kiểm duyệt mã nguồn; cách làm này giống Moodle (Site administration) và Canvas (Account settings).

---

## 2. Danh Sách Endpoint

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/settings/public` | `[Public]` | Trạng thái mở đăng ký và thông báo toàn hệ thống (trang Đăng ký, dải thông báo) |
| `GET` | `/api/v1/settings` | `[Roles: admin]` | Tình trạng dịch vụ, chính sách vận hành (chỉ xem), cài đặt nghiệp vụ |
| `PATCH` | `/api/v1/settings` | `[Roles: admin]` | Đổi cài đặt nghiệp vụ |

### 2.1. `GET /api/v1/settings/public`
```json
{ "allowSelfRegistration": true, "announcement": { "message": "Hệ thống bảo trì từ 22:00 đến 23:00 ngày 05/11/2026.", "tone": "warning" } }
```
`announcement` là `null` khi đang tắt hoặc nội dung rỗng.

### 2.2. `GET /api/v1/settings` — phần `data`
```json
{
  "status": {
    "checkedAt": "2026-10-30T14:44:31.000Z",
    "uptimeSeconds": 3600,
    "services": [
      { "key": "database", "status": "ok", "latencyMs": 49, "detail": "PostgreSQL · phản hồi 49 ms" },
      { "key": "storage", "status": "local_storage", "detail": "Lưu cục bộ trên máy chủ (backend/uploads)" },
      { "key": "ai", "status": "configured", "detail": "Gemini · gemini-flash-latest → gemini-3.1-flash-lite → gemini-flash-lite-latest" },
      { "key": "email", "status": "dev_console", "detail": "Chưa cấu hình SMTP: ..." },
      { "key": "queue", "status": "not_configured", "detail": "Chưa có REDIS_URL: ..." }
    ],
    "app": { "version": "1.0.0", "environment": "development", "nodeVersion": "v20.17.0" }
  },
  "policies": {
    "session": [{ "label": "Thời hạn access token", "value": "15m", "source": "JWT_EXPIRES_IN" }],
    "rateLimits": [{ "label": "Đăng nhập sai", "scope": "email", "max": 5, "windowMinutes": 5, "source": "rateLimiter.js" }],
    "uploads": [{ "purpose": "avatar", "maxSizeMb": 2, "extensions": ["jpg", "jpeg", "png", "webp"], "source": "uploadService.js" }]
  },
  "settings": { "allowSelfRegistration": true, "announcement": { "enabled": false, "message": "", "tone": "info" } },
  "settingsMeta": { "allowSelfRegistration": { "label": "Cho phép học viên tự đăng ký", "updatedAt": null, "updatedBy": null } }
}
```
- `status.services[].status`: `ok` \| `degraded` \| `down` (CSDL), `configured` \| `local_storage` \| `dev_console` \| `not_configured`.
- `detail` chỉ chứa tên định danh không bí mật (tên bucket, host SMTP, tên model). **Không bao giờ** chứa khóa, mật khẩu, chuỗi kết nối CSDL.
- `policies` đọc trực tiếp từ giá trị đang chạy (`RATE_LIMIT_RULES` trong `rateLimiter.js`, `UPLOAD_PURPOSES` trong `uploadService.js`...), không chép tay.

### 2.3. `PATCH /api/v1/settings`
Chỉ gửi khóa muốn đổi; `announcement` được gộp từng trường với giá trị hiện tại.
```json
{ "allowSelfRegistration": false, "announcement": { "enabled": true, "message": "Nghỉ lễ 20/11, lớp học tạm dừng.", "tone": "info" } }
```
Response `data`: `{ "settings": { ...cài đặt sau khi lưu }, "changed": ["allowSelfRegistration", "announcement"] }`. Không có gì thay đổi thì `changed: []` và không ghi nhật ký.

| Trường | Kiểu | Ràng buộc |
|---|---|---|
| `allowSelfRegistration` | boolean | — |
| `announcement.enabled` | boolean | Bật thì `message` không được rỗng |
| `announcement.message` | chuỗi | Tối đa 300 ký tự |
| `announcement.tone` | `info` \| `warning` \| `danger` | — |

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Không có cài đặt nào để cập nhật / Nội dung thông báo tối đa 300 ký tự / Vui lòng nhập nội dung thông báo trước khi bật hiển thị | Body rỗng hoặc sai ràng buộc |
| `401` | `Unauthorized` | Chưa đăng nhập | Thiếu hoặc hết hạn Access Token |
| `403` | `Forbidden` | Bạn không có quyền truy cập | Không phải Admin |
| `503` | `Service Unavailable` | Không lưu được cài đặt. Kiểm tra đã chạy migration... | Chưa chạy `npm run db:migrate:settings` |

---

## 3. Tác Động Của Cài Đặt

- **`allowSelfRegistration = false`:** `POST /auth/register` trả `403 Forbidden` — *"Hệ thống đang tạm ngừng nhận đăng ký tài khoản mới..."*; trang `/auth/register` hiện thông báo thay cho form. Tài khoản đã có vẫn đăng nhập; Admin vẫn tạo tài khoản ở trang Người dùng.
- **`announcement.enabled = true`:** dải thông báo hiện ở đầu trang công khai và cả 4 cổng; người dùng ẩn được trong phiên, Admin đổi nội dung thì hiện lại.
- Backend lưu cài đặt trong bộ nhớ đệm 30 giây, Admin lưu thì xóa đệm ngay. Bảng chưa tạo (chưa chạy migration) thì dùng giá trị mặc định: mở đăng ký, không có thông báo.
