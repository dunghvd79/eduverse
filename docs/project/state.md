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
   - Định nghĩa trọn bộ **19 Sequelize Models** với ràng buộc khóa ngoại, UUID v4, indexes và xóa mềm (Soft Delete).
   - Chạy script đồng bộ và nạp dữ liệu mẫu (`migrateAndSeed.js`): Khởi tạo thành công toàn bộ 18 bảng, nạp 7 tài khoản người dùng 4 role (mật khẩu mặc định `EduVerse@2026`).
   - **Triển khai Hoàn Tất 100% Module Xác Thực (Authentication & Session - Sprint 2, Phần 1):** 10/10 endpoints theo chuẩn `docs/api/api-auth.md`, JWT kép, Rate limiter, kết nối trọn bộ 5/5 màn hình Auth.
   - **Triển khai Hoàn Tất 100% Module Quản Lý Người Dùng & Hồ Sơ Cá Nhân (Users & RBAC - Sprint 2, Phần 2):**
     - Đầy đủ các endpoints theo chuẩn `docs/api/api-users.md` (`GET/PATCH /users/me`, `PATCH /users/me/password`, `GET /users/:id/profile`, `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/status`, `POST /users/:id/reset-password`, `DELETE /users/:id`).
     - Tích hợp trang **Hồ sơ cá nhân đa vai trò** (`/student/profile`, `/teacher/profile`, `/manager/profile`, `/admin/profile`): xem/sửa họ tên, SĐT, bio, chọn nhanh preset avatar, đổi mật khẩu an toàn với tính năng thu hồi phiên thiết bị khác.
     - Tích hợp trang **Admin Console Quản lý người dùng** (`/admin/users`): bảng dữ liệu phân trang, lọc theo 4 vai trò, lọc trạng thái hoạt động/đã khóa, tìm kiếm linh hoạt, tạo tài khoản sinh mật khẩu tạm, khóa/mở khóa tài khoản kèm lý do vi phạm, đặt lại mật khẩu khẩn cấp và xóa mềm.
   - **Rà soát & vá bảo mật Module Auth (05/10/2026):** sửa 7 lỗi, kiểm thử tích hợp 16/16 kịch bản đạt (xem mục 2 và mục 4).
   - **Sprint 3:** đã bổ sung service/controller/routes cho Category, Course, Chapter, Lesson và Lesson Progress; mount API vào `app.js`; nối màn hình quản lý danh mục cùng các màn hình teacher/student/manager. Đã sửa luồng lấy giáo trình, phân quyền API đọc, kiểm tra enrollment cho tiến độ, và thao tác tạo/sửa bài học. Chưa xác nhận build/live API ở phiên hiện tại do sandbox Windows chặn chạy lệnh; backend vẫn cần `backend/.env` và DB để kiểm thử đầu-cuối.

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

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay Kế Tiếp ⏳
0. **Backlog bảo mật Auth còn lại (mức thấp–trung bình, chưa sửa):**
   - Đăng ký lại email chưa xác thực vẫn ghi đè mật khẩu → nên chỉ gửi lại OTP, đặt mật khẩu sau khi xác thực.
   - `loginLimiter` đếm cả lần đăng nhập thành công và chỉ theo IP → thêm `skipSuccessfulRequests`, key theo IP + email.
   - `verifyOtp` chưa kiểm tra `is_active`; `verify-otp`/`resend-otp` trả 404 làm lộ email tồn tại; login lộ thời gian phản hồi khi email không tồn tại.
   - Regex mật khẩu từ chối các ký tự `~ ' " / \` và dấu cách.
   - Rate limiter đang lưu in-memory (chưa dùng Redis như tài liệu tech-stack).
1. **Hoàn tất kiểm thử Sprint 3: Module Khóa học & Giáo trình (Courses, Chapters, Lessons - `api-courses.md`):**
   - Đã có API quản lý Course/Chapter/Lesson, trạng thái `draft`/`pending`/`published`/`rejected`, tìm kiếm/lọc và sắp xếp đề cương.
   - Đã có luồng Giảng viên gửi duyệt $\rightarrow$ Quản lý đào tạo phê duyệt/từ chối, kèm ghi nhận tiến độ bài học theo lớp/enrollment.
   - Đã nối các màn hình Soạn thảo đề cương (`/teacher/courses/:id/curriculum`), Duyệt khóa học (`/manager/approvals`) và Trình học tập (`/student/courses/:courseId/learn/:lessonId`).
   - Đã bổ sung CRUD danh mục và liên kết `category_id` với Course. Đã nối lại API presigned PUT hiện có với API CRUD tài liệu bài học, xác minh object trên S3, presigned GET URL và giao diện quản lý/xem tài liệu. Xóa tài liệu cần quyền IAM `s3:DeleteObject`; còn cần chạy build, syntax/test backend và kiểm thử đầu-cuối với DB/S3 trước khi commit/push.
2. **Triển khai Sprint 4: Module Lớp học & Thành viên (Classes, Enrollments - `api-classes.md`).**
3. **Triển khai Sprint 5: Module Trắc nghiệm & Đề thi (Quizzes, Gemini AI - `api-quizzes.md`).**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- **Biến môi trường:** mọi module cần `process.env` phải import `backend/src/config/env.js` (đã được import trong `server.js`, `config/database.js`, `utils/jwt.js`). Không dùng giá trị secret dự phòng.
- **Route mới cần mở khi `must_change_password = true`:** thêm vào `MUST_CHANGE_PASSWORD_ALLOWLIST` trong `middlewares/authMiddleware.js`.
- **Route guard frontend:** toàn bộ 4 portal đi qua `PortalLayout` (`components/portal/PortalUI.jsx`) — kiểm tra đăng nhập, role ↔ portal (`training_manager` → `/manager`), và bắt đổi mật khẩu tạm.
- **Refresh token chỉ dùng 1 lần:** frontend phải gọi qua `refreshAccessToken()` trong `stores/useAuthStore.js`, không tự gọi `axios.post('/auth/refresh-token')`.
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
