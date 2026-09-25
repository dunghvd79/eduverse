# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 25/09/2026  
> **Người cập nhật:** dunghvd79 & AI Assistant  
> **Giai đoạn hiện tại:** Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống (Architecture Docs)

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
Dự án đã hoàn thành toàn bộ giai đoạn phân tích nghiệp vụ (Use Case), thiết kế CSDL (ERD & Schema vật lý 18 bảng), các biểu đồ tuần tự nghiệp vụ cốt lõi (Sequence Diagrams), đã **hoàn thành 100% trọn bộ 8/8 tài liệu Đặc tả API (API Specifications — 101 Endpoints)**, và đã **hoàn thành 3/3 tài liệu Kiến trúc Hệ thống (Architecture Docs)**. Đã sẵn sàng nghiệm thu Phase 0 và bước vào triển khai code Phase 1 (NestJS + React).

## 2. Các Việc Đã Hoàn Thành ✅
- [x] Phân tích đặc tả bài toán từ tài liệu thầy gửi (`ĐẶC TẢ SƠ BỘ YÊU CẦU HỆ THỐNG.docx`).
- [x] Chốt tên dự án: **EduVerse** (`eduverse`).
- [x] Chốt Tech stack: NestJS + React/Vite + PostgreSQL/TypeORM + Tailwind/shadcn + AWS S3 + Gemini API + Docker.
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
  - `docs/database/schema.md`: Đặc tả chi tiết từng bảng, kiểu dữ liệu PostgreSQL, Constraints, Indexes (đã đồng bộ các cột `is_published`, `show_answers_after_submit`, `explanation`, `deleted_at`).
  - `docs/database/seed-data.md`: Dữ liệu mẫu (Users mặc định, Khóa học mẫu, Lớp học mẫu).
- [x] **Hệ thống Sơ đồ Tuần tự Nghiệp vụ Cốt lõi (Sequence Diagrams):**
  - `docs/sequences/seq-template.md`: Mẫu chuẩn thiết kế Sequence Diagram cho toàn dự án.
  - `docs/sequences/seq-auth-001.md`: Đăng ký tài khoản học viên & xác thực Email kích hoạt.
  - `docs/sequences/seq-auth-002.md`: Đăng nhập hệ thống & cấp phát JWT qua Cookie HttpOnly an toàn.
  - `docs/sequences/seq-quiz-001.md`: Làm bài kiểm tra trắc nghiệm & Tự động chấm điểm (Server Time Authority, Anti-cheat).
  - `docs/sequences/seq-assign-001.md`: Học viên nộp bài tập file S3 & Giảng viên chấm điểm phản hồi.
  - `docs/sequences/seq-ai-001.md`: Giảng viên dùng Google Gemini AI tự động sinh câu hỏi trắc nghiệm từ bài giảng.
- [x] **Đặc tả API (API Specifications - Đã hoàn thành 8/8 tài liệu):**
  - [x] `docs/api/api-conventions.md`: Quy chuẩn RESTful, Envelope Pattern (`success`, `data`, `meta`), Error codes, Phân trang, CORS, Cookie chính sách.
  - [x] `docs/api/api-auth.md`: Xác thực, JWT, Refresh Token, Đổi/Quên mật khẩu.
  - [x] `docs/api/api-users.md`: 12 Endpoints hoàn chỉnh (Hồ sơ cá nhân `/users/me`, Cập nhật avatar/họ tên/SĐT/bio, Đổi mật khẩu thu hồi phiên khác, Hồ sơ công khai GV `/users/:id/profile`, Admin CRUD người dùng, Phân quyền RBAC, Khóa/mở khóa tài khoản, Đặt lại mật khẩu khẩn cấp, Xóa mềm, Bulk Import Excel qua BullMQ).
  - [x] `docs/api/api-courses.md`: 21 Endpoints hoàn chỉnh (Khóa học, Chương, Bài học, Bộ đôi Batch Reorder kéo thả đề cương, Quy trình Phê duyệt của QLĐT, Đánh dấu hoàn thành bài học `lesson_progress`).
  - [x] `docs/api/api-classes.md`: 13 Endpoints hoàn chỉnh (Lớp học, Class Code ngẫu nhiên, Ghi danh học viên, Quản lý thành viên, Báo cáo tiến độ lớp `GET /classes/:id/progress`, Xuất bảng điểm Excel `GET /classes/:id/grades/export-excel`).
  - [x] `docs/api/api-quizzes.md`: 20 Endpoints hoàn chỉnh (Quản lý đề thi, Ngân hàng câu hỏi, Bộ tứ Batch CRUD: Bulk Insert / Reorder / Update / Delete, 2 Endpoint tích hợp Gemini AI, Bắt đầu thi với Server Authority, Nộp bài chấm tự động thang 10).
  - [x] `docs/api/api-assignments.md`: 18 Endpoints hoàn chỉnh (Khung bài tập, Cấu hình lịch nộp theo lớp, Presigned URL S3 Direct Upload, Cơ chế nộp lại Resubmission & Yêu cầu nộp lại từ GV, Chấm đơn lẻ & Bulk Grade, Tải trọn gói ZIP cả lớp qua BullMQ Async Job, Kích hoạt tiến độ học tập).
  - [x] `docs/api/api-uploads.md`: 7 Endpoints hoàn chỉnh (Presigned PUT URL tập trung, phân loại Public/Private, quản lý CRUD tài liệu đính kèm `course_materials`, phát luồng video S3 HTTP Range/Embed ngoài, chính sách dọn dẹp rác S3).

- [x] **Nhóm tài liệu Kiến trúc Hệ thống (Architecture Docs — Đã hoàn thành 3/3):**
  - [x] `docs/architecture/system-architecture.md`: Sơ đồ C4 Level 1 (System Context) & Level 2 (Container), 5 luồng kết nối, cấu hình Docker Compose.
  - [x] `docs/architecture/tech-stack.md`: Bảng quyết định kỹ thuật đầy đủ (có cột Version), bổ sung Redis, WebSocket.
  - [x] `docs/architecture/design-decisions.md`: 6 ADR (Architecture Decision Records) chi tiết: NestJS, PostgreSQL, JWT, Monolith, Vite+React, Docker Compose.

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay ⏳
1. **Thiết kế UI Wireframes & Page Inventory (nhóm `docs/ui/`).**
2. **Nghiệm thu toàn diện Phase 0.**
3. **Chuyển sang Phase 1: Khởi tạo Project & Cài đặt môi trường (NestJS & React).**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema và API Spec.
