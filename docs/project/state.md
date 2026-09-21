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
- [x] Thống nhất chiến lược: **Làm Use Case trước, sau đó mới đến ERD và API**.
- [x] Khởi tạo cấu trúc thư mục dự án và commit ban đầu vào branch `main`.
- [x] Thiết lập hệ thống lưu ngữ cảnh tự động cho AI (`AGENTS.md`, `state.md`, `context-local.md`).

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay ⏳
1. **Vẽ Use Case Diagram:**
   - Vẽ 1 sơ đồ tổng quan (Overview Diagram).
   - Vẽ 4 sơ đồ chi tiết theo từng Actor (Student, Teacher, Training Manager, Admin).
   - Sử dụng cú pháp Mermaid chuẩn trong file `docs/use-cases/use-case-diagram.md`.
2. **Viết Use Case Specifications:**
   - Viết đặc tả chi tiết cho ~13 Use Case cốt lõi/phức tạp nhất.
   - Viết mô tả ngắn cho ~17 Use Case đơn giản (CRUD).
3. **Phác thảo ERD từ các Use Case đã chốt.**

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/`.
