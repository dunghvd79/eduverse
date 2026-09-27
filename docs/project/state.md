# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 26/09/2026  
> **Người cập nhật:** dunghvd79 & AI Assistant  
> **Giai đoạn hiện tại:** Chuyển giao từ Phase 0 (Hoàn tất 100% Đặc tả Thiết kế) sang Phase 1 (Khởi tạo Project)

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
Dự án đã **hoàn thành toàn diện 100% Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống**. Bao gồm:
1. Phân tích nghiệp vụ (Use Cases 4 Actor).
2. Thiết kế CSDL (ERD & Physical Schema 18 bảng, Seed data).
3. Biểu đồ tuần tự nghiệp vụ cốt lõi (Sequence Diagrams).
4. Trọn bộ 8/8 tài liệu Đặc tả API (101 Endpoints).
5. 3/3 tài liệu Kiến trúc Hệ thống (System Architecture, Tech Stack, Design Decisions).
6. **Trọn bộ Bộ ba Đặc tả UI/UX Chuẩn Enterprise (Đã nghiệm thu & đồng bộ 100% Single Source of Truth)**: `frontend-blueprint.md`, `design-system.md`, `wireframes.md`, `sitemap.md`.

Hệ thống đã đạt độ chín muồi về mặt đặc tả kỹ thuật, không còn bất kỳ điểm xung đột hay mơ hồ nào giữa Backend và Frontend, sẵn sàng bước ngay vào **Phase 1: Khởi tạo dự án & Triển khai mã nguồn**.

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

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay (Kế hoạch Phase 1) ⏳
1. **Khởi tạo mã nguồn Frontend (`frontend/`):**
   - Setup dự án React 18 + Vite (JavaScript `.jsx`).
   - Cài đặt và cấu hình Tailwind CSS với 100% Design Tokens từ `design-system.md`.
   - Cài đặt các thư viện lõi: Lucide React Icons, Radix UI Primitives, Sonner Toast, React Router v6, Zustand, TanStack React Query v5, Axios, React Hook Form, Joi, DOMPurify.
   - Xây dựng hệ thống Common Components cơ sở (Button, Input, Modal, Toaster wrapper, Skeleton Shimmer).
2. **Khởi tạo mã nguồn Backend (`backend/`):**
   - Setup Express.js (ES Modules), Sequelize ORM, PostgreSQL connection, Redis client.
   - Cấu hình Middleware tập trung (CORS, Helmet, Rate Limit, Error Handler, Cookie Parser).
3. **Triển khai Nhóm Màn hình Public & Auth (SCR-01 đến SCR-08).**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
