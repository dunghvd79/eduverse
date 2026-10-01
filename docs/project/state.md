# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 01/10/2026  
> **Người cập nhật:** dunghvd79, Hoàng Ngọc Sơn & AI Assistant  
> **Giai đoạn hiện tại:** Phase 1 — Đã hoàn thành 100% (37/37) Màn hình Frontend & 6 Master Layouts

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
1. Dự án đã **hoàn thành toàn diện 100% Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống** (Use Cases, ERD 18 bảng, Sequence Diagrams, 8/8 API Docs, C4 Architecture, Master Frontend Blueprint, Design System Tokens, Wireframes, Sitemap).
2. **Tiến độ Phase 1 (Frontend):**
   - Đã hoàn thành **toàn diện 100% (37/37 Màn hình)** và **trọn bộ 6 Master Layouts** chuẩn Responsive Desktop/Tablet/Mobile:
     - **Phân hệ 1: Public Pages (SCR-01 -> SCR-04):** Landing Page, Khám phá khóa học, Chi tiết khóa học, Trang lỗi 404.
     - **Phân hệ 2: Authentication (SCR-05 -> SCR-09):** Đăng nhập, Đăng ký, Xác thực OTP, Quên MK, Đặt lại MK.
     - **Phân hệ 3: Student Portal (SCR-10 -> SCR-18):** Dashboard, Khóa học của tôi, Chi tiết lớp học, Trình học Video Player, Làm bài Quiz trắc nghiệm, Kết quả Quiz, Nộp bài tập S3, Bảng điểm, Hồ sơ cá nhân.
     - **Phân hệ 4: Teacher Portal (SCR-19 -> SCR-28):** Dashboard, Quản lý khóa học, Soạn thảo đề cương, Lớp học & Thành viên, Đề kiểm tra, Bộ tạo đề thi tự động bằng Gemini AI, Quản lý bài tập, Giao diện chấm bài split-pane, Sổ điểm lớp học.
     - **Phân hệ 5: Training Manager Portal (SCR-29 -> SCR-33):** Dashboard đào tạo, Hàng đợi phê duyệt, Chi tiết kiểm duyệt khóa học, Quản lý cây danh mục, Báo cáo & Thống kê đào tạo.
     - **Phân hệ 6: Admin Console (SCR-34 -> SCR-37):** Dashboard hệ thống, Quản lý người dùng & RBAC, Nhật ký Audit Logs, Cấu hình nền tảng.
   - Hoàn thành rà soát quét lỗi AST toàn diện (xử lý triệt để các lỗi thiếu import icon trên các trang Portal).
   - Đã hợp nhất (merge) toàn bộ code từ nhánh `feature-ngocson` vào `feature-dung`, giải quyết xung đột `AppRoutes.jsx`, kiểm thử build `npm run build` xuất sắc đạt **2001/2001 modules, 0 lỗi**.
   - Đã đẩy code mới nhất lên remote tại `origin/feature-dung`.

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
- [x] **Triển khai Toàn Bộ Mã Nguồn Frontend (Phase 1 — Hoàn thành 100% 37/37 Màn hình & 6 Master Layouts):**
  - [x] Khởi tạo dự án `frontend/` (React 18 + Vite 5 + Tailwind CSS v3.4.17 + Lucide Icons + React Router DOM v6).
  - [x] Tích hợp 100% Design Tokens từ `design-system.md` vào `tailwind.config.js` và `index.css`.
  - [x] Triển khai và tích hợp đầy đủ 6 Master Layouts: `PublicLayout`, `AuthLayout`, `StudentLayout`, `TeacherLayout`, `ManagerLayout`, `AdminLayout`.
  - [x] Triển khai trọn bộ 37 Màn hình độc lập (SCR-01 đến SCR-37) khớp 1:1 với lộ trình `frontend-blueprint.md`.
  - [x] Hợp nhất thành công toàn bộ mã nguồn nhánh `feature-ngocson` vào `feature-dung`, giải quyết conflict `AppRoutes.jsx`, fix toàn bộ lỗi import icon Lucide.
  - [x] Kiểm thử build đạt 2001/2001 modules thành công (0 warning, 0 error), đẩy lên `origin/feature-dung`.

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay ⏳
1. **Hợp nhất mã nguồn Frontend vào `main`:**
   - Mở Pull Request đưa `feature-dung` vào `main` để làm baseline vững chắc cho toàn bộ dự án.
2. **Khởi tạo và Triển khai Mã Nguồn Backend (`backend/`):**
   - Thiết lập cấu trúc mã nguồn Express.js chuẩn 6-layers (Config, Models, Services, Controllers, Routes, Middlewares).
   - Kết nối PostgreSQL với Sequelize ORM, khởi tạo Database Migrations theo đúng ERD 18 bảng.
   - Cấu hình Middleware bảo mật tập trung (CORS, Helmet, Rate Limit, Error Handler, Cookie Parser).
   - Triển khai Module Xác thực (Auth Service): Đăng ký, Đăng nhập JWT qua Cookie HttpOnly + Access Token RAM, Refresh Token Rotation, Gửi mã OTP kích hoạt qua Email.

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
