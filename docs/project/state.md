# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 09/10/2026  
> **Người cập nhật:** dunghvd79, Hoàng Ngọc Sơn & AI Assistant  
> **Giai đoạn hiện tại:** Phase 1 — Hoàn thành Sprint 2 + Đợt rà soát & vá bảo mật Module Auth; đang triển khai Sprint 3 (Courses/Chapters/Lessons)

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
1. Dự án đã **hoàn thành toàn diện 100% Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống** (Use Cases, ERD 18 bảng, Sequence Diagrams, 8/8 API Docs, C4 Architecture, Master Frontend Blueprint, Design System Tokens, Wireframes, Sitemap).
2. **Tiến độ Phase 1 (Frontend):** Hoàn thành **100% (37/37 Màn hình)** và **6 Master Layouts**, kiểm thử build 2062 modules không lỗi. Đã tích hợp Zustand Auth Store & Axios Interceptor.
3. **Tiến độ Phase 1 (Backend & Database):**
   - Khởi tạo kiến trúc mã nguồn Backend Express.js chuẩn ES Modules (`backend/`).
   - Kết nối thành công tới **Cloud Database Neon.tech (hạ tầng AWS Singapore)** qua giao thức mã hóa SSL.
   - Định nghĩa trọn bộ **18 Sequelize Models** với ràng buộc khóa ngoại, UUID v4, indexes và xóa mềm (Soft Delete).
   - Chạy script đồng bộ và nạp dữ liệu mẫu (`migrateAndSeed.js`): Khởi tạo thành công toàn bộ 18 bảng, nạp 7 tài khoản người dùng 4 role (mật khẩu mặc định `EduVerse@2026`).
   - **Triển khai Hoàn Tất 100% Module Xác Thực (Authentication & Session - Sprint 2, Phần 1):** 10/10 endpoints theo chuẩn `docs/api/api-auth.md`, JWT kép, Rate limiter, kết nối trọn bộ 5/5 màn hình Auth.
   - **Triển khai Hoàn Tất 100% Module Quản Lý Người Dùng & Hồ Sơ Cá Nhân (Users & RBAC - Sprint 2, Phần 2):**
     - Đầy đủ các endpoints theo chuẩn `docs/api/api-users.md` (`GET/PATCH /users/me`, `PATCH /users/me/password`, `GET /users/:id/profile`, `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/status`, `POST /users/:id/reset-password`, `DELETE /users/:id`).
     - Tích hợp trang **Hồ sơ cá nhân đa vai trò** (`/student/profile`, `/teacher/profile`, `/manager/profile`, `/admin/profile`): xem/sửa họ tên, SĐT, bio, chọn nhanh preset avatar, đổi mật khẩu an toàn với tính năng thu hồi phiên thiết bị khác.
     - Tích hợp trang **Admin Console Quản lý người dùng** (`/admin/users`): bảng dữ liệu phân trang, lọc theo 4 vai trò, lọc trạng thái hoạt động/đã khóa, tìm kiếm linh hoạt, tạo tài khoản sinh mật khẩu tạm, khóa/mở khóa tài khoản kèm lý do vi phạm, đặt lại mật khẩu khẩn cấp và xóa mềm.
   - **Rà soát & vá bảo mật Module Auth (05/10/2026):** sửa 7 lỗi, kiểm thử tích hợp 16/16 kịch bản đạt (xem mục 2 và mục 4).
   - **Gia cố Auth bổ sung (06–09/10/2026):** thêm rate limiter cho refresh/reset/change-password, kiểm tra `is_active` ở verify-otp/resend-otp/reset-password, refactor DRY validation & limiter; sửa lỗi xóa cookie làm đăng xuất nhiều tab và limiter đổi mật khẩu bị bỏ sót (kiểm thử 8/8 + hồi quy 16/16 đạt).
   - **Sprint 3 — Danh mục khóa học & Khóa chỉnh sửa (09/10/2026):** thêm module Categories (backend + trang quản lý + lọc Catalog), khóa sửa nội dung khi `pending`/`published`; sửa thêm lỗi trình soạn đề cương ghi đè mất nội dung bài, curriculum công khai lộ `videoUrl`, trang "Khóa học của tôi" hiển thị khóa của giảng viên khác. Test API 26/26 + hồi quy 25/25, 16/16, 8/8.
   - **Sprint 3 — Backend hoàn thành, Frontend đã nối API (09/10/2026):** 21 endpoint Courses/Chapters/Lessons/Lesson Progress theo `api-courses.md` (`courseController.js`, `courseRoutes.js` mount tại `/api/v1`, `lessonService.js`, `optionalAuthenticateToken`). Frontend `services/courseService.js` + 7 trang (catalog, chi tiết khóa học, khóa học của giảng viên, curriculum builder, hàng đợi duyệt, chi tiết duyệt, trình học). Code do **tuanmanh205** viết (commit `57f4686` trên `feature-ngocson`, nằm nhầm trong thư mục con `eduverse-feature-dung/`), được ghép thủ công sang `feature-dung` kèm review và sửa lỗi. Kiểm thử E2E API 25/25 đạt.

## 2. Các Việc Đã Hoàn Thành ✅
- [x] Toàn bộ Phase 0 (Use cases, ERD, Schema, Sequences, API Docs, Blueprint, Wireframes).
- [x] Toàn bộ 37 màn hình UI tĩnh Frontend (React 18 + Vite + Tailwind CSS).
- [x] Khởi tạo CSDL Neon.tech PostgreSQL (18 bảng, đồng bộ & seed 7 user).
- [x] Tách cấu trúc 18 Models Sequelize sạch sẽ kèm quan hệ 1:1, 1:N, M:N.
- [x] Backend Module Auth: 10 API chuẩn RESTful Envelope Pattern.
- [x] Frontend Auth Integration: Kết nối thành công 100% trọn bộ 5/5 màn hình Authentication vào API Backend thật.
- [x] **Backend Module Users & RBAC:** Trọn bộ API Hồ sơ cá nhân (`/users/me`), Quản trị người dùng toàn trường (`/users`), Khóa/Mở khóa có lý do, Đặt lại mật khẩu khẩn cấp và Xóa mềm.
- [x] **Frontend Profile Integration:** Kết nối thành công trang Hồ sơ cá nhân cho cả 4 Portal (`Student`, `Teacher`, `Manager`, `Admin`), tự động đồng bộ tức thì tên & avatar lên Topbar và Sidebar.
- [x] **Frontend Admin Console Integration:** Kết nối màn hình `/admin/users` với API thật, hỗ trợ lọc tab vai trò, lọc trạng thái, tìm kiếm, phân trang, và 4 popup tác vụ quản trị.
- [x] Kiểm thử tự động E2E luồng đăng nhập Admin, xem bảng người dùng, tạo tài khoản mới sinh mật khẩu tạm, và cập nhật hồ sơ cá nhân thành công 100%.
- [x] **Vá bảo mật Module Auth (05/10/2026):**
  - Chống dò OTP: thêm `verifyOtpLimiter` (5 lần sai / 15 phút / email); OTP sinh bằng `crypto.randomInt`.
  - Sửa lỗi trùng `token_hash` UNIQUE khiến đăng ký thất bại ngẫu nhiên: OTP băm kèm `user_id`, OTP cũ bị xóa hẳn mỗi lần gửi mã mới (không cần migration DB).
  - Đổi mật khẩu không còn đăng xuất chính phiên hiện tại: thu hồi phiên cũ rồi cấp cặp token mới; gộp `PATCH /auth/change-password` và `PATCH /users/me/password` về một hàm `authService.changePassword`.
  - Thực thi `must_change_password`: backend chặn API (403 `MUST_CHANGE_PASSWORD`), frontend tự chuyển về trang Hồ sơ.
  - Tiêu thụ token nguyên tử (refresh / OTP / reset) chống dùng lại token khi request song song; các luồng nhiều bước chạy trong transaction.
  - Bỏ secret JWT dự phòng ghi cứng; thêm `config/env.js` kiểm tra biến môi trường bắt buộc và dừng server nếu thiếu.
  - Sửa lỗi Logout không hoạt động (frontend gọi không kèm Access Token → 401, refresh token không bị thu hồi): logout giờ xác định phiên qua cookie.
  - Frontend: khôi phục phiên khi tải lại trang (`initializeAuth` gọi ở `App.jsx`), route guard trong `PortalLayout` (bắt đăng nhập, đúng portal theo role), refresh token single-flight + retry cho nhiều tab.
- [x] **Gia cố Auth bổ sung (06–09/10/2026):**
  - Rate limiter chuẩn hóa bằng factory `createLimiter`: login (5 lần sai / 5 phút / email, bỏ qua lần thành công), refresh-token (30/phút/IP), reset-password (5/15 phút/IP), change-password (5/15 phút/user).
  - Kiểm tra tài khoản bị khóa (`is_active`) ở verify-otp, resend-otp, reset-password. Reset mật khẩu thành công đồng thời bật `email_verified` và tắt `must_change_password`.
  - Refresh lỗi chỉ xóa cookie khi token thực sự chết (JWT sai, hết hạn, không tồn tại, tài khoản bị khóa). Token vừa bị request song song xoay vòng (`preserveCookie`) hoặc lỗi hệ thống 5xx thì **giữ cookie** — tránh xóa nhầm cookie mới hợp lệ khiến mọi tab bị đăng xuất.
  - `changePasswordLimiter` gắn cho cả `PATCH /users/me/password` (endpoint frontend đang dùng), đếm gộp với `PATCH /auth/change-password`.

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay Kế Tiếp ⏳
0. **Backlog bảo mật Auth còn lại (mức thấp–trung bình, chưa sửa):**
   - Đăng ký lại email chưa xác thực vẫn ghi đè mật khẩu → nên chỉ gửi lại OTP, đặt mật khẩu sau khi xác thực.
   - `loginLimiter` giờ chỉ tính theo email → một IP vẫn thử 1 mật khẩu trên nhiều email (password spraying). Nên thêm limiter rộng theo IP.
   - `verify-otp`/`resend-otp` trả 404 làm lộ email tồn tại; login lộ thời gian phản hồi khi email không tồn tại.
   - Regex mật khẩu từ chối các ký tự `~ ' " / \` và dấu cách.
   - Rate limiter đang lưu in-memory (chưa dùng Redis như tài liệu tech-stack).
1. **Hoàn thiện Sprint 3: Module Khóa học & Giáo trình (`api-courses.md`):**
   - [x] Backend 21 endpoint Courses/Chapters/Lessons/Lesson Progress + quy trình gửi duyệt → phê duyệt/từ chối.
   - [x] Nối API cho 7 trang frontend.
   - [ ] **Kiểm thử tay trên trình duyệt** 7 trang (chưa test UI, mới test API).
   - [x] **Khóa chỉnh sửa** khi khóa học `pending`/`published` (đã chốt 09/10/2026): mọi thao tác sửa khóa/chương/bài trả `409`; chỉ sửa ở `draft`/`rejected`. Admin vẫn xóa được khóa để kiểm duyệt. Trình soạn đề cương chuyển sang chế độ chỉ đọc.
   - [x] **Danh mục khóa học (Categories)** (đã chốt 09/10/2026): bảng `categories` (bảng thứ 19) + `courses.category_id`, 5 endpoint `/api/v1/categories`, trang `/manager/categories` nối API thật (thêm/sửa/ẩn-hiện/sắp xếp/xóa), lọc Catalog theo danh mục, giảng viên chọn danh mục khi tạo/sửa khóa. Migration `npm run db:migrate:categories` **đã chạy trên Neon dev**.
   - [ ] **Admin tự gửi duyệt và tự duyệt được khóa học của chính mình** (`approveCourse`/`rejectCourse` không chặn người duyệt là chủ khóa). Nhóm tạm giữ nguyên (09/10/2026); nếu cần kiểm tra chéo thì chặn trường hợp người duyệt = `owner_id`.
   - [ ] Luồng "mở lại để chỉnh sửa" khóa đã `published` (phiên bản mới → duyệt lại) — chưa có, cần chốt nghiệp vụ.
   - [ ] Trang **Chi tiết duyệt** (`/manager/approvals/:id/review`) mới chỉ hiện tiêu đề bài, Quản lý chưa xem được nội dung bài để duyệt.
   - [ ] Trang chủ (`HomePage`) vẫn dùng danh mục & khóa học giả (mock) — chưa nối API.
   - [ ] Tài liệu đính kèm bài học (`CourseMaterial`) — phụ thuộc module Uploads (S3).
2. **Triển khai Sprint 4: Module Lớp học & Thành viên (Classes, Enrollments - `api-classes.md`).**
3. **Triển khai Sprint 5: Module Trắc nghiệm & Đề thi (Quizzes, Gemini AI - `api-quizzes.md`).**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- **Migration CSDL:** không chạy `sequelize.sync({ alter: true })` trên DB chung để thêm bảng/cột mới; viết script idempotent trong `backend/src/scripts/migrations/` (mẫu: `20261009-add-categories.js`) và thêm lệnh vào `package.json`. Mỗi thành viên cần chạy `npm run db:migrate:categories` nếu dùng DB riêng.
- **Khóa chỉnh sửa khóa học:** dùng `assertCourseEditable(course)` (export từ `courseService.js`) cho mọi API thay đổi nội dung khóa/chương/bài mới thêm sau này.
- **Đề cương công khai không chứa nội dung bài:** trình soạn đề cương phải tải nội dung qua `GET /lessons/:id` trước khi cho sửa, nếu không sẽ ghi đè mất `contentText`.
- **Đồng bộ route ↔ spec (09/10/2026):** đã xóa 2 alias thừa `GET /users/me/profile` và `PUT /users/me/profile` (trùng `GET`/`PATCH /users/me`, không có trong spec, frontend không dùng); sửa `api-uploads.md` cập nhật avatar qua `PATCH /users/me`. `POST /users/bulk-import` có trong spec nhưng **chưa triển khai** (cần Redis/BullMQ + thư viện đọc Excel).
- **Xử lý lỗi chung:** `:id` sai định dạng UUID trả `400` "Mã định danh (ID) không hợp lệ" (bắt lỗi Postgres `22P02` trong `errorMiddleware.js`) thay vì `500`; route không tồn tại trả `404` dạng JSON (handler cuối `app.js`).
- **Rà soát backend (09/10/2026) — đã sửa 7 mục:** API danh sách bài công khai lộ `contentText`/`videoUrl`; chương/bài thuộc khóa đã xóa mềm gây `500` (nay `404`); thống kê hồ sơ giảng viên luôn bằng 0 (so sánh status viết hoa); sắp xếp chấp nhận ID trùng; thông báo xóa danh mục chưa rõ; CORS bị chặn trả `500` (nay `403`); Admin được gửi duyệt khóa học. Test 19/19 + hồi quy 108/108.
- **Validation Middleware dùng chung (`middlewares/validateMiddleware.js`):** mọi route phải validate đủ 3 nguồn đầu vào — `validateBody(schema)` cho `req.body`, `validateQuery(schema)` cho `req.query`, `validateIdParam(...names)` cho `:id`/`:courseId`… (UUID) hoặc `validateIdOrSlugParam()` cho route nhận cả slug. Thứ tự: xác thực → phân quyền → params → query/body → controller. Các file `validations/*.js` chỉ chứa Joi schema, không chứa middleware. Express 5: `req.query` là getter chỉ đọc nên `validateQuery` ghi đè bằng `Object.defineProperty`.
- **Quyền xem nội dung khóa học:** dùng `assertCourseVisible` (export từ `courseService.js`) cho mọi API đọc chương/bài. Nội dung đầy đủ bài học (`GET /lessons/:id`) chỉ cho chủ khóa, Quản lý, Admin, giảng viên dạy lớp của khóa, hoặc học viên đã ghi danh `active`.
- **Biến môi trường:** mọi module cần `process.env` phải import `backend/src/config/env.js` (đã được import trong `server.js`, `config/database.js`, `utils/jwt.js`). Không dùng giá trị secret dự phòng.
- **Route mới cần mở khi `must_change_password = true`:** thêm vào `MUST_CHANGE_PASSWORD_ALLOWLIST` trong `middlewares/authMiddleware.js`.
- **Route guard frontend:** toàn bộ 4 portal đi qua `PortalLayout` (`components/portal/PortalUI.jsx`) — kiểm tra đăng nhập, role ↔ portal (`training_manager` → `/manager`), và bắt đổi mật khẩu tạm.
- **Refresh token chỉ dùng 1 lần:** frontend phải gọi qua `refreshAccessToken()` trong `stores/useAuthStore.js`, không tự gọi `axios.post('/auth/refresh-token')`.
- **Xóa cookie refresh:** controller `refreshToken` chỉ gọi `clearRefreshCookie` khi lỗi `401` và không có cờ `preserveCookie`. Lỗi mới trong `refreshSession` mà không muốn xóa cookie thì đặt `err.preserveCookie = true`.
- **Nhánh Git:** `feature-dung` đã được merge vào `main` qua PR #7 (08/10/2026). Các commit sau đó trên `feature-dung` (từ `e677acc`) cần PR mới. Các nhánh `feature-ngocson`, `feature-anh`, `feature-manh` nên cập nhật từ `main` thường xuyên để tránh conflict lớn.
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
