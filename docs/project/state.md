# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 04/10/2026  
> **Người cập nhật:** dunghvd79, Hoàng Ngọc Sơn & AI Assistant  
> **Giai đoạn hiện tại:** Phase 1 — Đã hoàn thành 100% Sprint 2 (Toàn diện Authentication + Module Quản lý Người dùng & Profile RBAC nối API thật 4 Portal)

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

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay Kế Tiếp ⏳
1. **Triển khai Sprint 3: Module Khóa học & Giáo trình (Courses, Chapters, Lessons - `api-courses.md`):**
   - API Quản lý Danh mục khóa học (Categories) & Khóa học (CRUD Course, thumbnail, tìm kiếm/lọc, trạng thái `DRAFT`, `PENDING`, `PUBLISHED`).
   - API Quản lý Chương học (Chapters) & Bài học (Lessons: Video URL, tài liệu đính kèm, lý thuyết).
   - Quy trình Giảng viên gửi duyệt $\rightarrow$ Quản lý đào tạo phê duyệt/từ chối.
   - Nối giao diện Soạn thảo đề cương (`/teacher/courses/:id/curriculum`), Duyệt khóa học (`/manager/approvals`), và Trình học tập (`/student/courses/:courseId/learn/:lessonId`).
2. **Triển khai Sprint 4: Module Lớp học & Thành viên (Classes, Enrollments - `api-classes.md`).**
3. **Triển khai Sprint 5: Module Trắc nghiệm & Đề thi (Quizzes, Gemini AI - `api-quizzes.md`).**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
