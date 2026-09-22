# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 21/09/2026  
> **Người cập nhật:** dunghvd79  
> **Giai đoạn hiện tại:** Phase 0 — Thiết Kế Hệ Thống (Use Case & ERD)

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
Dự án đã hoàn thành giai đoạn thu thập yêu cầu, chốt tech stack, thống nhất quy tắc nghiệp vụ, tạo khung thư mục chuẩn `Docs-as-Code` và khởi tạo git repository.

## 2. Các Việc Đã Hoàn Thành ✅
- [x] Phân tích đặc tả bài toán từ tài liệu thầy gửi (`ĐẶC TẢ SƠ BỘ YÊU CẦU HỆ THỐNG.docx`).
- [x] Chốt tên dự án: **EduVerse** (`eduverse`).
- [x] Chốt Tech stack: NestJS + React/Vite + PostgreSQL/TypeORM + Tailwind/shadcn + AWS S3 + Gemini API + Docker.
- [x] Chốt mô hình phân quyền: 4 role (`student`, `teacher`, `training_manager`, `admin`) — mỗi user 1 role.
- [x] Khởi tạo repo Git, kết nối remote và push lên GitHub (`https://github.com/dunghvd79/eduverse`).
- [x] Thiết lập hệ thống lưu ngữ cảnh tự động cho AI (`AGENTS.md`, `state.md`, `context-local.md`).
- [x] **Vẽ Use Case Diagram Tổng quan hệ thống (Level-0 Package Diagram)** chuẩn doanh nghiệp, xóa bỏ hiện tượng đè dây (`docs/use-cases/use-case-diagram.md`).
- [x] **Biên soạn Bộ Quy chuẩn thiết kế Use Case chuẩn Doanh nghiệp** (`docs/use-cases/use-case-guidelines.md`).
- [x] **Hoàn thành trọn bộ 4 Actor Use Case:**
  - `docs/use-cases/actor-student.md` (Học viên)
  - `docs/use-cases/actor-teacher.md` (Giảng viên)
  - `docs/use-cases/actor-manager.md` (Quản lý Đào tạo)
  - `docs/use-cases/actor-admin.md` (Quản trị viên)

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay ⏳
1. **Chuyển sang thiết kế Cơ sở dữ liệu (ERD Diagram & Database Schema).**
2. **Thiết kế Kiến trúc Chi tiết & Đặc tả API (OpenAPI/Swagger).**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/`.
