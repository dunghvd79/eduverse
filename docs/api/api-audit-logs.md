# 🛡️ Đặc Tả API: Nhật Ký Hệ Thống & Cấu Hình Nền Tảng (Admin) — api-audit-logs.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md) (bảng `audit_logs`), [`actor-admin.md`](../use-cases/actor-admin.md) (UC-ADMIN-005, 006, 007), [`business-rules.md`](../requirements/business-rules.md) (BR-080 → BR-085)  
> **Base Path:** `/api/v1/admin`  
> **Mục đích:** Cho Quản trị viên tra cứu **ai đã làm gì, lúc nào, từ địa chỉ IP nào** (đăng nhập, quản lý tài khoản, duyệt khóa học), xuất nhật ký ra CSV, và xem cấu hình nền tảng đang chạy ở dạng chỉ đọc.

---

## 1. Danh Sách Endpoint

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/admin/audit-logs` | `[Roles: admin]` | Danh sách nhật ký (phân trang, mới nhất trước, lọc theo nhóm/hành động/kết quả/thời gian/từ khóa) |
| `GET` | `/api/v1/admin/audit-logs/actions` | `[Roles: admin]` | Danh mục nhóm và hành động (để dựng bộ lọc) |
| `GET` | `/api/v1/admin/audit-logs/export` | `[Roles: admin]` | Xuất CSV theo bộ lọc, tối đa 5.000 dòng mới nhất |
| `GET` | `/api/v1/admin/settings` | `[Roles: admin]` | Cấu hình nền tảng chỉ đọc + tình trạng dịch vụ |

Mọi endpoint trả `401` khi chưa đăng nhập và `403` với vai trò khác `admin`. Nhật ký **chỉ thêm**: không có API sửa hay xóa.

---

## 2. Đặc Tả Chi Tiết

### 2.1. Danh sách nhật ký

#### `GET /api/v1/admin/audit-logs`
* **Query Parameters** (tất cả tùy chọn; tham số lạ bị bỏ qua, tham số sai bị `400`):
  * `page` *(number, mặc định 1)*, `limit` *(number, mặc định 20, tối đa 100)*.
  * `category` *(`auth` | `user` | `course` | `system`)*: lọc theo nhóm hành động.
  * `action` *(string)*: một mã hành động trong mục 3. Khi có `action` thì bỏ qua `category`.
  * `result` *(`success` | `failed`)*.
  * `search` *(string, ≤ 255 ký tự)*: khớp một phần, không phân biệt hoa thường, trên email người thực hiện, mã đối tượng hoặc địa chỉ IP.
  * `from`, `to` *(ISO 8601, ví dụ `2026-10-01T00:00:00.000Z`)*: khoảng thời gian, gồm cả hai đầu mút; `to` phải sau hoặc bằng `from`. Giao diện đổi ngày đã chọn (giờ địa phương) thành đầu ngày / cuối ngày rồi gửi lên.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy nhật ký hệ thống thành công",
  "data": {
    "items": [
      {
        "id": "7b0f3c1e-5a52-4c5e-9f6a-2d1c8e4b9a10",
        "createdAt": "2026-11-01T03:15:42.120Z",
        "actor": { "id": "0c1d…", "email": "admin@eduverse.com", "role": "admin" },
        "action": "user.lock",
        "actionLabel": "Khóa tài khoản",
        "category": "user",
        "resourceType": "user",
        "resourceId": "5e2a…",
        "result": "success",
        "ip": "172.18.0.5",
        "userAgent": "Mozilla/5.0 …",
        "metadata": { "reason": "Vi phạm quy chế thi" }
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 134, "totalPages": 7, "hasNextPage": true, "hasPreviousPage": false }
  },
  "timestamp": "2026-11-01T03:16:00.000Z"
}
```

* `actor.email` và `actor.role` là **bản chép tại thời điểm thao tác**, nên vẫn đọc được khi tài khoản sau đó bị đổi vai trò hoặc xóa. `actor.id` là `null` với đăng nhập thất bại (chưa xác định được tài khoản) hoặc khi tài khoản bị xóa cứng.
* `metadata` là `null` hoặc một đối tượng nhỏ (xem mục 4). Hành động không có trong danh mục vẫn được trả: `actionLabel` bằng chính mã, `category` là `null`.

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tham số truy vấn không hợp lệ | `limit` > 100, `action`/`category`/`result` ngoài danh mục, `from`/`to` không phải ISO 8601, `to` < `from` |
| `401` | `Unauthorized` | Phiên làm việc không hợp lệ hoặc thiếu Token xác thực | Chưa đăng nhập |
| `403` | `Forbidden` | Bạn không có quyền thực hiện thao tác này | Không phải Admin |

---

### 2.2. Danh mục hành động

#### `GET /api/v1/admin/audit-logs/actions`
Trả `data = { categories: [{ key, label }], actions: [{ key, label, category }] }` — chính là bảng ở mục 3, dùng để dựng hai ô chọn "Nhóm" và "Hành động" trên giao diện.

---

### 2.3. Xuất CSV

#### `GET /api/v1/admin/audit-logs/export`
* **Query Parameters:** cùng bộ lọc như mục 2.1 (`category`, `action`, `result`, `search`, `from`, `to`), **không** có `page`/`limit`.
* **Phản hồi (`200 OK`, tệp, không bọc Envelope):**
  * `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="Nhat_Ky_He_Thong_20261101.csv"`.
  * `X-Export-Row-Count` (số dòng trong tệp) và `X-Export-Row-Limit` (trần 5.000 dòng).
  * UTF-8 **có BOM** (Excel đọc đúng tiếng Việt), xuống dòng CRLF. Cột: `Thời gian (UTC)`, `Người thực hiện`, `Vai trò`, `Hành động`, `Mã hành động`, `Loại đối tượng`, `Mã đối tượng`, `Kết quả`, `Địa chỉ IP`, `Chi tiết` (JSON).
  * Ô bắt đầu bằng `=`, `+`, `-`, `@` được thêm dấu nháy đơn phía trước để Excel không hiểu là công thức.
* Chỉ lấy **tối đa 5.000 dòng mới nhất** khớp bộ lọc; muốn nhiều hơn thì chia nhỏ theo khoảng thời gian.
* Bản thân việc xuất được ghi vào nhật ký (`audit.export`, kèm số dòng và bộ lọc).

---

### 2.4. Cấu hình nền tảng (chỉ đọc)

#### `GET /api/v1/admin/settings`
Giá trị thật nằm trong biến môi trường (`backend/.env` hoặc `docker-compose.yml`) và chỉ đổi được trên máy chủ rồi khởi động lại backend. API **không có** thao tác ghi.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy cấu hình nền tảng thành công",
  "data": {
    "environment": { "nodeEnv": "production", "nodeVersion": "v22.12.0" },
    "security": {
      "accessTokenTtl": "15m",
      "refreshTokenTtl": "7d",
      "passwordPolicy": "8–32 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
      "rateLimits": [ { "key": "login", "label": "Đăng nhập sai", "scope": "email", "max": 5, "windowMinutes": 5 } ]
    },
    "storage": {
      "provider": "local",
      "uploadUrlExpirySeconds": 900,
      "limits": [ { "purpose": "avatar", "maxSizeMb": 2, "extensions": ["jpg", "jpeg", "png", "webp"], "isPublic": true } ]
    },
    "email": { "mode": "queue_smtp", "useQueue": true, "transport": "smtp", "from": "EduVerse <noreply@example.com>", "smtpHost": "smtp.gmail.com" },
    "ai": { "configured": true, "model": "gemini-flash-latest", "fallbackModel": "gemini-flash-lite-latest" },
    "system": {
      "checkedAt": "2026-11-01T03:16:00.000Z",
      "uptimeSeconds": 5400,
      "services": [ { "key": "database", "status": "ok", "latencyMs": 12 }, { "key": "storage", "status": "local_storage" }, { "key": "ai", "status": "configured" }, { "key": "email", "status": "configured" } ]
    }
  },
  "timestamp": "2026-11-01T03:16:00.000Z"
}
```

* `storage.provider`: `s3` (có `AWS_REGION` và `S3_BUCKET`, khi đó có thêm `region`, `bucket`) hoặc `local` (thư mục `backend/uploads/`, xem [`api-uploads.md`](api-uploads.md) mục 6).
* `email.mode`: `queue_smtp` | `queue_log` | `direct_smtp` | `direct_log` (xem [`deployment.md`](../architecture/deployment.md) mục gửi email thật). `from` chính là địa chỉ người gửi hiện trong mọi email nên không phải bí mật.
* `security.rateLimits` lấy từ cùng một nguồn với middleware giới hạn tần suất (`utils/rateLimitRules.js`) nên luôn khớp thực tế; `scope` là `email`, `ip` hoặc `user`.
* `system.services` dùng chung cách kiểm tra với `GET /dashboard/admin`.
* **Không bao giờ trả:** `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `DATABASE_URL`, `REDIS_URL`, `SMTP_USER`/`SMTP_PASS`, khóa AWS, `GEMINI_API_KEY`.

---

## 3. Danh Mục Hành Động

| Mã hành động | Nhóm | Nhãn | Ghi khi |
|---|:---:|---|---|
| `auth.register` | `auth` | Đăng ký tài khoản | `POST /auth/register` thành công |
| `auth.verify_email` | `auth` | Kích hoạt email bằng OTP | `POST /auth/verify-otp` thành công |
| `auth.login` | `auth` | Đăng nhập | `POST /auth/login` thành công (`success`) hoặc bị từ chối `401`/`403` (`failed`, `metadata.reason`) |
| `auth.password_change` | `auth` | Đổi mật khẩu | `PATCH /auth/change-password` hoặc `PATCH /users/me/password` thành công |
| `auth.password_reset` | `auth` | Đặt lại mật khẩu qua email | `POST /auth/reset-password` thành công |
| `user.create` | `user` | Tạo tài khoản | Admin `POST /users` (`metadata`: email, role mới) |
| `user.bulk_import` | `user` | Nhập tài khoản hàng loạt | Admin `POST /users/bulk-import` (`metadata`: tên tệp, vai trò mặc định, số dòng, số tạo được, số bị bỏ qua) |
| `user.update` | `user` | Sửa thông tin / vai trò tài khoản | Admin `PATCH /users/:id` (`metadata`: tên các trường đã gửi, role sau khi sửa) |
| `user.lock` / `user.unlock` | `user` | Khóa / Mở khóa tài khoản | Admin `PATCH /users/:id/status` (`metadata.reason`) |
| `user.reset_password` | `user` | Đặt lại mật khẩu khẩn cấp | Admin `POST /users/:id/reset-password` |
| `user.delete` | `user` | Xóa tài khoản | Admin `DELETE /users/:id` |
| `course.publish_request` | `course` | Gửi duyệt khóa học | `POST /courses/:id/publish-request` |
| `course.approve` | `course` | Phê duyệt khóa học | `PATCH /courses/:id/approve` |
| `course.reject` | `course` | Từ chối khóa học | `PATCH /courses/:id/reject` (`metadata.reason`) |
| `course.unpublish` | `course` | Đưa khóa học về bản nháp | `PATCH /courses/:id/unpublish` |
| `course.delete` | `course` | Xóa khóa học | `DELETE /courses/:id` |
| `audit.export` | `system` | Xuất nhật ký hệ thống | `GET /admin/audit-logs/export` (`metadata`: số dòng, bộ lọc) |

Nhóm: `auth` = Xác thực, `user` = Người dùng, `course` = Khóa học, `system` = Hệ thống.

---

## 4. Quy Tắc Ghi Nhật Ký

- **Chỉ ghi thao tác đã thành công**, trừ đăng nhập: đăng nhập bị từ chối (sai mật khẩu, tài khoản bị khóa, chưa kích hoạt) được ghi với `result = failed` và email đã nhập. Yêu cầu bị chặn trước đó (dữ liệu không hợp lệ `400`, vượt giới hạn tần suất `429`, thiếu quyền `403` ở tầng route) **không** được ghi.
- **Không bao giờ lưu mật khẩu, token, OTP, mã băm.** Mọi khóa chứa `pass`, `token`, `otp`, `secret`, `hash`, `authoriz`, `cookie`, `credential` bị loại khỏi `metadata`; chuỗi tối đa 300 ký tự, mảng tối đa 20 phần tử, sâu tối đa 3 cấp, tổng tối đa 2.000 ký tự (vượt thì chỉ lưu `{ "truncated": true }`).
- **Ghi nhật ký không bao giờ làm hỏng thao tác chính**: lỗi khi ghi (CSDL chậm, bảng chưa tạo) chỉ in cảnh báo ra log backend (tối đa 1 lần/phút) và thao tác vẫn thành công. Vì vậy sau khi cập nhật code **phải chạy migration** (mục 5), nếu không nhật ký sẽ trống mà không báo lỗi trên giao diện.
- IP lấy từ `req.ip`; phía sau Nginx của Docker Compose đã đặt `TRUST_PROXY=1` nên là IP thật của người dùng.
- Dòng nhật ký được ghi **sau** khi thao tác thành công và **trước** khi trả phản hồi, nên tra cứu ngay sau thao tác sẽ thấy.
- Chưa có: tự xóa nhật ký cũ (retention), mức độ nghiêm trọng `INFO/WARNING/DANGER`, so sánh dữ liệu trước/sau (Diff JSON), cảnh báo brute-force, nhật ký cho thao tác lớp học, bài kiểm tra, bài tập.

---

## 5. Dữ Liệu & Triển Khai

- Bảng `audit_logs` (mục 21 của [`schema.md`](../database/schema.md)): `id`, `actor_id` (FK `users`, `ON DELETE SET NULL`), `actor_email`, `actor_role`, `action`, `resource_type`, `resource_id`, `result`, `ip`, `user_agent`, `metadata` (JSONB), `created_at`; index theo thời gian, theo (`action`, thời gian), (`actor_id`, thời gian), (`resource_type`, `resource_id`).
- Migration: `npm run db:migrate:audit-logs` (trong `backend/`, idempotent). Docker Compose với CSDL trống tự tạo bảng; CSDL đã có dữ liệu thì chạy `docker compose exec backend node src/scripts/migrations/20261101-audit-logs.js`. Neon dùng chung cần được chạy migration này.
- Mã nguồn: `utils/auditRules.js` (danh mục, làm sạch, CSV, điều kiện lọc — hàm thuần có unit test), `utils/auditRecorder.js`, `services/auditService.js`, `controllers/auditController.js`, `routes/adminRoutes.js`; cấu hình ở `utils/platformSettings.js`, `utils/rateLimitRules.js`, `services/settingsService.js`.
- Giao diện: `/admin/audit-logs` (bộ lọc, phân trang, xuất CSV) và `/admin/settings` (xem cấu hình, tình trạng dịch vụ).
