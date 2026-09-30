# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 30/09/2026  
> **Người cập nhật:** dunghvd79, Hoàng Ngọc Sơn & AI Assistant  
> **Giai đoạn hiện tại:** Phase 1 — Triển Khai Mã Nguồn (Đã hoàn thành 9/37 Màn hình Frontend: Phân hệ Public & Auth)

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
1. Dự án đã **hoàn thành toàn diện 100% Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống** (Use Cases, ERD 18 bảng, Sequence Diagrams, 8/8 API Docs, C4 Architecture, Master Frontend Blueprint, Design System Tokens, Wireframes, Sitemap).
2. **Tiến độ Phase 1 (Frontend):**
   - Đã khởi tạo hoàn chỉnh dự án `frontend/` (React 18 + Vite 5 + Tailwind CSS v3.4.17 với 100% tokens từ `design-system.md`).
   - Đã triển khai xong **9/37 màn hình frontend** thuộc 2 phân hệ cốt lõi:
     - **Phân hệ 1: Public Pages (SCR-01 -> SCR-04):** Trang chủ, Danh mục khóa học, Chi tiết khóa học, Trang 404.
     - **Phân hệ 2: Authentication (SCR-05 -> SCR-09):** Đăng nhập, Đăng ký, Xác thực OTP, Quên mật khẩu, Đặt lại mật khẩu.
   - Nhóm đã phối hợp làm việc đa nhánh (Git workflow) thành công: Hợp nhất (merge) code từ nhánh `origin/feature-ngocson` vào `feature-dung`, giải quyết xung đột (conflict resolution), cấu hình routing chuẩn xác trong `AppRoutes.jsx`.
   - Build kiểm thử `npm run build` đạt 100/100 modules thành công, 0 lỗi.
   - Toàn bộ mã nguồn đã được đẩy lên GitHub remote tại nhánh `feature-dung`, và đã khởi tạo **Pull Request #1** (`feature-dung` -> `main`) để tuân thủ chính sách bảo vệ nhánh (Branch Protection Rule).

## 2. Các Việc Đã Hoàn Thành ✅
- [x] Phân tích đặc tả bài toán từ tài liệu thầy gửi (`ĐẶC TẢ SƠ BỘ YÊU CẦU HỆ THỐNG.docx`).
- [x] Chốt tên dự án: **EduVerse** (`eduverse`).
- [x] Chốt Tech stack: Express.js + React/Vite (JavaScript ES Modules) + PostgreSQL/Sequelize + Tailwind/Radix UI/Sonner + AWS S3 + Gemini API + Docker.
- [x] Chốt mô hình phân quyền: 4 role (`student`, `teacher`, `training_manager`, `admin`) — mỗi user 1 role.
- [x] Khởi tạo repo Git, kết nối remote và push lên GitHub (`https://github.com/dunghvd79/eduverse`).
- [x] Thiết lập hệ thống lưu ngữ cảnh tự động cho AI (`AGENTS.md`, `state.md`, `context-local.md`).
- [x] **Trọn bộ Phân tích & Đặc tả Use Case chuẩn Enterprise:**
  - `docs/use-cases/use-case-diagram.md`: Biểu đồ tổng quan hệ thống (Level-0 Package Diagram).
  - `docs/use-cases/use-case-guidelines.md`: Bộ quy chuẩn thiết kế Use Case theo chuẩn OMG UML 2.5 & Alistair Cockburn.
  - `docs/use-cases/use-case-decisions.md`: Quyết định mô hình phân quyền, phân cấp kiến trúc.
  - `docs/use-cases/actor-student.md`: Đặc tả chi tiết hành vi và kịch bản cho Học viên.
  - `docs/use-cases/actor-teacher.md`: Đặc tả chi tiết hành vi và kịch bản cho Giảng viên (bao gồm quản lý đề thi, câu hỏi hàng loạt, sinh đề AI).
  - `docs/use-cases/actor-manager.md`: Đặc tả chi tiết cho Quản lý đào tạo (phê duyệt khóa học).
  - `docs/use-cases/actor-admin.md`: Đặc tả chi tiết cho Quản trị viên (quản trị hệ thống, cấp tài khoản).
- [x] **Trọn bộ Thiết kế Cơ sở Dữ liệu (Database Design):**
  - `docs/database/database-decisions.md`: Quyết định PK UUID v4, Soft Delete, Audit Fields, Naming Conventions.
  - `docs/database/erd.md`: Sơ đồ ERD 15 thực thể chuẩn 3NF, phân tách mối quan hệ rõ ràng.
  - `docs/database/schema.md`: Đặc tả chi tiết từng bảng, kiểu dữ liệu PostgreSQL, Constraints, Indexes.
  - `docs/database/seed-data.md`: Dữ liệu mẫu (Users mặc định, Khóa học mẫu, Lớp học mẫu).
- [x] **Hệ thống Sơ đồ Tuần tự Nghiệp vụ Cốt lõi (Sequence Diagrams — Đã đồng bộ 100% Express.js & Sequelize):**
  - `docs/sequences/seq-template.md`: Mẫu chuẩn thiết kế 6 layers với Express Controller, Service, Sequelize Models, Joi validation.
  - `docs/sequences/seq-auth-001.md`: Đăng ký tài khoản học viên & xác thực Email kích hoạt.
  - `docs/sequences/seq-auth-002.md`: Đăng nhập hệ thống & cấp phát JWT qua Cookie HttpOnly + Zustand RAM.
  - `docs/sequences/seq-quiz-001.md`: Làm bài kiểm tra trắc nghiệm & Tự động chấm điểm.
  - `docs/sequences/seq-assign-001.md`: Học viên nộp bài tập file S3 qua Presigned URL.
  - `docs/sequences/seq-ai-001.md`: Giảng viên dùng Google Gemini AI tự động sinh câu hỏi trắc nghiệm.
- [x] **Đặc tả API (API Specifications - Hoàn thành 8/8 tài liệu, 101 Endpoints):**
  - [x] `docs/api/api-conventions.md`: Quy chuẩn RESTful Envelope Pattern, Error codes, Phân trang, Cookie chính sách.
  - [x] `docs/api/api-auth.md`: Xác thực, JWT, Refresh Token, Đổi/Quên mật khẩu.
  - [x] `docs/api/api-users.md`: 12 Endpoints hoàn chỉnh.
  - [x] `docs/api/api-courses.md`: 21 Endpoints hoàn chỉnh.
  - [x] `docs/api/api-classes.md`: 13 Endpoints hoàn chỉnh.
  - [x] `docs/api/api-quizzes.md`: 20 Endpoints hoàn chỉnh.
  - [x] `docs/api/api-assignments.md`: 18 Endpoints hoàn chỉnh.
  - [x] `docs/api/api-uploads.md`: 7 Endpoints hoàn chỉnh.
- [x] **Nhóm tài liệu Kiến trúc Hệ thống (Architecture Docs — Hoàn thành 3/3):**
  - [x] `docs/architecture/system-architecture.md`: Sơ đồ C4 Level 1 & Level 2, cấu hình Docker Compose.
  - [x] `docs/architecture/tech-stack.md`: Bảng quyết định kỹ thuật Express.js + React JavaScript, Sequelize, Redis, Socket.IO.
  - [x] `docs/architecture/design-decisions.md`: 9 ADR chi tiết.
- [x] **Bộ ba Tài liệu Đặc tả UI/UX Chuẩn Enterprise (Đã hoàn thiện & nghiệm thu 26/09/2026):**
  - [x] `docs/ui/frontend-blueprint.md`: Master Frontend Blueprint (Prompt-ready) — Khóa 37 Màn hình (SCR-01 đến SCR-37), 6 Master Layout Shells, State Management (Zustand + React Query v5), Axios Instance & Interceptors, Toaster (Sonner), Bảo mật Whitelist S3 (Max 25MB, loại bỏ `.rar`), Quiz Integrity.
  - [x] `docs/ui/design-system.md`: Design Tokens là Single Source of Truth — Khóa bảng màu `#1168bd` (Primary), `#0c2d48` (Secondary), `#0ea5e9` (Tertiary), Semantic Status (Success `#10b981`, Warning `#f59e0b`, Error `#ba1a1a`), Phông chữ `Inter`, Utility `.tabular-number`, Skeleton Shimmer Gradient (loại bỏ animate-pulse), Tích hợp 100% Tokens vào `tailwind.config.js` (kèm `screens` và `maxWidth.app = 1600px`).
  - [x] `docs/ui/wireframes.md`: Bố cục chi tiết 13 màn hình cốt lõi (WF-01 đến WF-13) khớp tham chiếu Blueprint, chuẩn responsive Mobile-first (Base styles, `md`, `lg`, `xl`), tách biệt 1 route = 1 screen (WF-11 SCR-30, WF-12 SCR-31, WF-13 SCR-35), cơ chế Optimistic Updates có Rollback khi mutation lỗi.
  - [x] `docs/ui/sitemap.md`: Sơ đồ phân cấp luồng trang người dùng.
- [x] **Triển khai Mã Nguồn Frontend (Phase 1 — Đã xong 9/37 Màn hình & Layout Shells):**
  - [x] Khởi tạo dự án `frontend/` (React 18 + Vite 5 + Tailwind CSS v3.4.17 + Lucide Icons + React Router DOM v6).
  - [x] Tích hợp 100% Design Tokens từ `design-system.md` vào `tailwind.config.js` và `index.css`.
  - [x] Triển khai **SCR-01** (`HomePage.jsx`) theo đúng thiết kế thẩm mỹ hiện đại, phân rã thành các components: `Header.jsx`, `Footer.jsx`, `PublicLayout.jsx`, `CourseCard.jsx`, `FloatingWidgets.jsx`, `Toast.jsx`.
  - [x] Tích hợp và Hợp nhất thành công mã nguồn từ nhánh `feature-ngocson`:
    - **SCR-02**: `CourseCatalogPage.jsx` (`/courses`) — Danh mục khóa học, phân loại, tìm kiếm, filter.
    - **SCR-03**: `CourseDetailPage.jsx` (`/courses/:id`) — Trang chi tiết khóa học, lộ trình bài giảng, giảng viên.
    - **SCR-04**: `NotFoundPage.jsx` (`*`) — Màn hình lỗi 404 thân thiện người dùng.
    - **SCR-05**: `LoginPage.jsx` (`/login`) — Đăng nhập hệ thống.
    - **SCR-06**: `RegisterPage.jsx` (`/register`) — Đăng ký tài khoản học viên.
    - **SCR-07**: `VerifyOtpPage.jsx` (`/verify-otp`) — Xác thực OTP kích hoạt.
    - **SCR-08**: `ForgotPasswordPage.jsx` (`/forgot-password`) — Quên mật khẩu.
    - **SCR-09**: `ResetPasswordPage.jsx` (`/reset-password`) — Đặt lại mật khẩu.
    - `AuthLayout.jsx` — Khung Layout đồng bộ cho toàn bộ phân hệ Auth.
  - [x] Tích hợp bộ điều hướng trung tâm `AppRoutes.jsx`, giải quyết xung đột merge commit `ec45fb4`.
  - [x] Build kiểm thử `npm run build` không lỗi, đẩy lên `origin/feature-dung` và tạo Pull Request #1.

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay ⏳
1. **Hoàn tất Pull Request #1 vào nhánh `main`:**
   - Review và chấp thuận (Approval) từ đồng đội trên GitHub để thỏa mãn Branch Protection Rule.
   - Hợp nhất PR #1 vào nhánh `main` để làm baseline chuẩn cho toàn team.
2. **Triển khai Phân hệ 3: Học viên (Student Portal — SCR-10 đến SCR-18):**
   - **SCR-10**: Bảng điều khiển Học viên / Khóa học của tôi (`/student/courses`)
   - **SCR-11**: Không gian Lớp học & Trình phát bài học (`/classroom/:classId/learn`) — Player video, outline bài học
   - **SCR-12 & SCR-13**: Giao diện Làm bài kiểm tra & Kết quả (`/classroom/:classId/quizzes/:quizId`)
   - **SCR-14 & SCR-15**: Giao diện Nộp bài tập & Chi tiết chấm điểm (`/classroom/:classId/assignments/:assignId`)
   - **SCR-16 & SCR-17**: Diễn đàn Lớp học (Q&A) & Trung tâm thông báo
   - **SCR-18**: Hồ sơ cá nhân Học viên (`/student/profile`)
3. **Khởi tạo mã nguồn Backend (`backend/`):**
   - Setup Express.js (ES Modules), Sequelize ORM kết nối PostgreSQL.
   - Cấu hình Middleware tập trung (CORS, Helmet, Rate Limit, Error Handler, Cookie Parser).
   - Triển khai Module Auth Service & JWT Refresh Token.

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
