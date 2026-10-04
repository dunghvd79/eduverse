# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 04/10/2026  
> **Người cập nhật:** dunghvd79, Hoàng Ngọc Sơn & AI Assistant  
> **Giai đoạn hiện tại:** Phase 1 — Đã xong 100% Frontend (37 màn hình) & Hoàn thành Module Authentication (Backend 10/10 API + Nối Frontend Login Form)

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
1. Dự án đã **hoàn thành toàn diện 100% Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống** (Use Cases, ERD 18 bảng, Sequence Diagrams, 8/8 API Docs, C4 Architecture, Master Frontend Blueprint, Design System Tokens, Wireframes, Sitemap).
2. **Tiến độ Phase 1 (Frontend):** Hoàn thành **100% (37/37 Màn hình)** và **6 Master Layouts**, kiểm thử build 2061 modules không lỗi. Đã tích hợp Zustand Auth Store & Axios Interceptor.
3. **Tiến độ Phase 1 (Backend & Database):**
   - Khởi tạo kiến trúc mã nguồn Backend Express.js chuẩn ES Modules (`backend/`).
   - Kết nối thành công tới **Cloud Database Neon.tech (hạ tầng AWS Singapore)** qua giao thức mã hóa SSL.
   - Định nghĩa trọn bộ **18 Sequelize Models** với ràng buộc khóa ngoại, UUID v4, indexes và xóa mềm (Soft Delete).
   - Chạy script đồng bộ và nạp dữ liệu mẫu (`migrateAndSeed.js`): Khởi tạo thành công toàn bộ 18 bảng, nạp 7 tài khoản người dùng 4 role (mật khẩu mặc định `EduVerse@2026`).
   - **Triển khai Hoàn Tất 100% Module Xác Thực & Phân Quyền (Authentication & Session):**
     - Đầy đủ 10/10 endpoints theo chuẩn `docs/api/api-auth.md` (`register`, `verify-otp`, `resend-otp`, `login`, `refresh-token`, `logout`, `forgot-password`, `reset-password`, `change-password`, `me`).
     - Cơ chế bảo mật JWT kép: 15-phút Access Token (RAM/Memory) + 7-ngày Refresh Token (HttpOnly Cookie, Token Rotation).
     - Quản lý vòng đời token tập trung qua bảng `user_tokens` (băm SHA-256 an toàn).
     - Middleware chống Brute-Force Rate Limiting (`express-rate-limit`) và Middleware xác thực Joi (`joi`).
     - Nối thành công Form Đăng nhập Frontend ([`LoginPage.jsx`](file:///e:/2026%20Year/Kì_1_Năm_4/Do_An_Lien_Nganh/eduverse/frontend/src/pages/auth/LoginPage.jsx)) vào API Backend, tích hợp Widget chọn nhanh 4 tài khoản mẫu, kiểm thử điều hướng theo Role (Admin, Teacher, Manager, Student) thành công 100%.

## 2. Các Việc Đã Hoàn Thành ✅
- [x] Toàn bộ Phase 0 (Use cases, ERD, Schema, Sequences, API Docs, Blueprint, Wireframes).
- [x] Toàn bộ 37 màn hình UI tĩnh Frontend (React 18 + Vite + Tailwind CSS).
- [x] Khởi tạo CSDL Neon.tech PostgreSQL (18 bảng, đồng bộ & seed 7 user).
- [x] Tách cấu trúc 18 Models Sequelize sạch sẽ kèm quan hệ 1:1, 1:N, M:N.
- [x] Backend Module Auth: 10 API chuẩn RESTful Envelope Pattern.
- [x] Frontend Auth Integration: Kết nối thành công 100% trọn bộ 5/5 màn hình Authentication vào API Backend thật:
  - `LoginPage.jsx`: Đăng nhập, widget chọn nhanh 4 role, phân quyền điều hướng đúng Dashboard theo vai trò.
  - `RegisterPage.jsx`: Đăng ký tài khoản học viên, kiểm tra độ mạnh mật khẩu, kết nối API sinh OTP.
  - `VerifyOtpPage.jsx`: Nhập mã OTP 6 số (hỗ trợ paste nhanh, đếm ngược gửi lại mã), kích hoạt tài khoản và tự động cấp phiên đăng nhập.
  - `ForgotPasswordPage.jsx`: Nhập email gửi yêu cầu cấp mã token reset mật khẩu.
  - `ResetPasswordPage.jsx`: Nhập token và mật khẩu mới để đặt lại mật khẩu thành công.
- [x] Bổ sung tính năng tiện ích UI: Icon hình con mắt (Show/Hide password toggle) trên tất cả các form nhập mật khẩu.
- [x] Tối ưu môi trường Dev & CSDL: Cấu hình chuẩn `sslmode=verify-full` kết nối an toàn Neon PostgreSQL và xử lý bắt lỗi cổng 5000 ổn định.

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay Kế Tiếp ⏳
1. **Triển khai Module Khóa học & Giáo trình (Course Management - `api-courses.md`):**
   - API Quản lý Khóa học (CRUD Course, danh mục category, tìm kiếm/lọc).
   - API Quản lý Chương học (Chapters) & Bài học (Lessons: Video, Lý thuyết).
   - Quy trình Giảng viên gửi duyệt $\rightarrow$ Quản lý đào tạo phê duyệt/từ chối.
2. **Triển khai Module Lớp học & Thành viên (Classes & Enrollments - `api-classes.md`):**
   - Mở lớp học theo khóa học, sinh mã ghi danh `class_code`, học viên tham gia lớp.
3. **Triển khai Module Trắc nghiệm & Đề thi (Quizzes - `api-quizzes.md`):**
   - Ngân hàng câu hỏi, tạo đề, lên lịch mở thi theo lớp, học viên làm bài & hệ thống tự động chấm điểm.

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
