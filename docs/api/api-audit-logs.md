# 📜 Đặc Tả API: Module Nhật Ký Hệ Thống (Audit Logs) — api-audit-logs.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`actor-admin.md`](../use-cases/actor-admin.md) (UC-ADMIN-005, UC-ADMIN-006), [`schema.md`](../database/schema.md) mục 20  
> **Base Path:** `/api/v1/audit-logs`  
> **Mục đích:** Ghi lại ai đã làm gì, lúc nào, từ IP nào với các thao tác nhạy cảm, để Admin giám sát và truy vết sự cố. *Bổ sung 30/10/2026.*

---

## 1. Danh Sách Endpoint

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/audit-logs` | `[Roles: admin]` | Danh sách nhật ký (mới nhất trước), có lọc, kèm số liệu 24 giờ qua |
| `GET` | `/api/v1/audit-logs/export` | `[Roles: admin]` | Tải CSV theo cùng bộ lọc, tối đa 10.000 dòng mới nhất (UC-ADMIN-006) |

**Quy tắc chung:**
- Nhật ký **chỉ thêm, không sửa, không xóa**: không có API sửa/xóa (điều kiện sau của UC-ADMIN-005).
- Nhật ký do hệ thống tự ghi trong các service nghiệp vụ (mục 3). Ghi nhật ký lỗi **không làm hỏng thao tác chính**, chỉ in log `[audit]` ở backend.
- Lưu kèm email và vai trò của người thực hiện tại thời điểm đó: xóa tài khoản thì `actor.id` thành `null` nhưng vẫn biết ai đã làm.
- IP lấy từ `req.ip` (đặt `TRUST_PROXY` khi chạy sau Nginx, xem `app.js`); IPv4 dạng `::ffff:1.2.3.4` được rút gọn thành `1.2.3.4`.
- Không bao giờ lưu mật khẩu, token hay mã OTP vào `metadata`.

---

## 2. Đặc Tả Chi Tiết

### 2.1. `GET /api/v1/audit-logs`

**Query (đều tùy chọn):**

| Tham số | Kiểu | Ý nghĩa |
|---|---|---|
| `page`, `limit` | số | Mặc định 1 và 20, `limit` tối đa 100 |
| `search` | chuỗi ≤ 100 | Tìm (không phân biệt hoa thường) trong email người thực hiện, mã hành động, tên đối tượng, IP |
| `category` | `auth` \| `user` \| `course` \| `class` \| `grade` \| `system` | Nhóm hành động |
| `severity` | `info` \| `warning` \| `danger` | Mức độ |
| `status` | `success` \| `failure` | Kết quả |
| `action` | mã trong mục 3 | Một hành động cụ thể |
| `from`, `to` | `YYYY-MM-DD` | Khoảng ngày; `to` tính trọn ngày đó, phải ≥ `from` |

#### Response Thành Công (`200 OK`) — phần `data`:
```json
{
  "items": [
    {
      "id": "6a1f…",
      "createdAt": "2026-10-30T14:26:28.512Z",
      "actor": { "id": "b58a…", "email": "admin@eduverse.com", "role": "admin", "fullName": "Quản Trị Viên Hệ Thống" },
      "action": "USER_ROLE_CHANGED",
      "actionLabel": "Đổi vai trò",
      "category": "user",
      "categoryLabel": "Quản trị người dùng",
      "severity": "warning",
      "status": "success",
      "target": { "type": "user", "id": "11a5…", "label": "giangvien.moi@eduverse.com" },
      "ipAddress": "203.113.10.5",
      "userAgent": "Mozilla/5.0 …",
      "metadata": {
        "before": { "fullName": "Nguyễn Văn A", "phoneNumber": null, "role": "student" },
        "after": { "fullName": "Nguyễn Văn A", "phoneNumber": null, "role": "teacher" }
      }
    }
  ],
  "summary": { "last24h": 42, "failedLogins24h": 3, "danger24h": 0 },
  "filters": {
    "categories": [{ "value": "auth", "label": "Xác thực" }],
    "actions": [{ "value": "LOGIN_FAILED", "label": "Đăng nhập thất bại", "category": "auth" }]
  },
  "meta": { "page": 1, "limit": 20, "totalItems": 42, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false }
}
```

### 2.2. `GET /api/v1/audit-logs/export`
* **Query:** `format=csv` (mặc định, hiện chỉ hỗ trợ CSV) và các bộ lọc giống mục 2.1 (trừ `page`, `limit`).
* **Response:** file `nhat-ky-he-thong-YYYY-MM-DD.csv` (UTF-8 có BOM để Excel đọc đúng tiếng Việt), mới nhất trước. Header `X-Export-Truncated: true` khi kết quả bị cắt ở 10.000 dòng.
* Ô bắt đầu bằng `=`, `+`, `-`, `@` được thêm dấu `'` phía trước để chống chèn công thức (CSV injection).

#### Các lỗi thường gặp (cả hai endpoint):
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tham số truy vấn không hợp lệ | Sai giá trị `category`/`severity`/`status`/`action`, ngày sai định dạng hoặc `to` < `from` |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn không có quyền truy cập | Không phải Admin |

---

## 3. Danh Mục Hành Động Được Ghi

| Nhóm | Mã hành động | Mức độ | Ghi khi | `metadata` |
|---|---|:---:|---|---|
| Xác thực | `LOGIN_SUCCESS` | info | Đăng nhập thành công | — |
| | `LOGIN_FAILED` | warning / **danger** | Đăng nhập thất bại (kết quả `failure`) | `reason`: `unknown_email` \| `wrong_password` \| `account_blocked` \| `email_unverified` |
| | `PASSWORD_CHANGED` | info | Người dùng tự đổi mật khẩu | — |
| | `PASSWORD_RESET` | warning | Đặt lại mật khẩu qua link email | — |
| Quản trị người dùng | `USER_CREATED` | info | Admin tạo tài khoản | `role` |
| | `USER_UPDATED` | info | Admin sửa tên / số điện thoại | `before`, `after` |
| | `USER_ROLE_CHANGED` | warning | Admin đổi vai trò | `before`, `after` |
| | `USER_BLOCKED` / `USER_UNBLOCKED` | warning / info | Admin khóa / mở khóa | `reason` (khi khóa) |
| | `USER_PASSWORD_RESET` | warning | Admin cấp lại mật khẩu tạm | — |
| | `USER_DELETED` | **danger** | Admin xóa tài khoản | `role` |
| Kiểm duyệt khóa học | `COURSE_APPROVED` / `COURSE_REJECTED` | info | Quản lý duyệt / từ chối | `reason` (khi từ chối) |
| | `COURSE_UNPUBLISHED` | warning | Đưa khóa về bản nháp | `before`, `after` |
| | `COURSE_DELETED` | warning | Xóa khóa học | `status`, `ownerId` |
| Lớp học | `CLASS_DELETED` | warning | Xóa lớp học | `courseId`, `teacherId`, `status` |
| Điểm số | `GRADE_MODIFIED` | warning | **Sửa** điểm bài tập đã chấm (chấm lần đầu không ghi), kể cả chấm hàng loạt | `before`, `after`, `studentId`, `classId`, `assignmentId` |
| Cài đặt hệ thống | `SETTING_CHANGED` | warning | Admin đổi một cài đặt nghiệp vụ (mỗi khóa một dòng, `api-settings.md`) | `before`, `after` |

**Phát hiện dò mật khẩu (luồng phụ UC-ADMIN-005):** từ lần `LOGIN_FAILED` thứ **10 trong 5 phút của cùng một IP**, dòng nhật ký được gắn `severity: danger` (tô đỏ trên trang). Giới hạn đăng nhập (`loginLimiter`) chặn theo từng email sau 5 lần sai, nên cảnh báo này bắt được kiểu thử nhiều email từ một IP. Nút "Khóa tạm thời IP" chưa làm.

Thứ tự ghi: với thao tác có transaction (chấm điểm), nhật ký được ghi **sau khi commit** để không ghi nhận một thay đổi đã bị hoàn tác.
