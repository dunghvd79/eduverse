# 🌱 Dữ Liệu Khởi Tạo Mẫu (Seed Data Specification)

> **Mục đích:** Cung cấp bộ dữ liệu mẫu chuẩn nghiệp vụ để phục vụ viết Seed Script trong NestJS/TypeORM, kiểm thử API và demo đồ án.

---

## 1. Tài Khoản Người Dùng Mẫu (Default Users)

> Mật khẩu mặc định cho toàn bộ tài khoản thử nghiệm: `EduVerse@2026` (được băm bằng `bcrypt`, độ dài salt = 10).

| Email | Họ và Tên | Vai Trò (`role`) | Trạng Thái | Mô Tả |
|---|---|---|:---:|---|
| `admin@eduverse.com` | Quản Trị Viên Hệ Thống | `admin` | Active, Verified | Tài khoản Admin tối cao |
| `manager@eduverse.com` | Hoàng Minh Quản Lý | `training_manager` | Active, Verified | Quản lý đào tạo (duyệt khóa học) |
| `teacher.an@eduverse.com` | ThS. Nguyễn Văn An | `teacher` | Active, Verified | Giảng viên chính ngành CNTT |
| `teacher.binh@eduverse.com` | TS. Trần Thị Bình | `teacher` | Active, Verified | Giảng viên hướng dẫn đồ án |
| `student.dung@eduverse.com` | Hoàng Văn Dũng | `student` | Active, Verified | Học viên (MSSV: 2026001) |
| `student.hoa@eduverse.com` | Lê Thị Hoa | `student` | Active, Verified | Học viên (MSSV: 2026002) |
| `student.nam@eduverse.com` | Phạm Văn Nam | `student` | Active, Verified | Học viên (MSSV: 2026003) |

---

## 2. Khóa Học Mẫu (Sample Course)

- **Tiêu đề:** `Lập trình Ứng dụng Web Hiện đại với NestJS và React`
- **Slug:** `lap-trinh-web-nestjs-react`
- **Giảng viên chủ nhiệm:** `ThS. Nguyễn Văn An` (`teacher.an@eduverse.com`)
- **Giá tiền:** `0.00` VND
- **Trạng thái:** `published` (Đã được `manager@eduverse.com` phê duyệt)
- **Mô tả:** Khóa học toàn diện trang bị kỹ năng xây dựng hệ thống web chuẩn doanh nghiệp từ Backend NestJS (TypeScript, TypeORM, PostgreSQL) đến Frontend React (Vite, Tailwind CSS).

### Cấu Trúc Khung Nội Dung:
1. **Chương 1: Kiến trúc Backend & NestJS Căn bản**
   - *Bài 1.1 (Theory):* Tổng quan về NestJS, Modules, Controllers và Services.
   - *Bài 1.2 (Theory & Video):* Tích hợp PostgreSQL và TypeORM Entity.
   - *Bài 1.3 (Quiz):* Trắc nghiệm kiểm tra kiến thức NestJS & Dependency Injection (15 phút, 5 câu hỏi).
2. **Chương 2: Thiết kế RESTful API & Xác thực JWT**
   - *Bài 2.1 (Theory):* Cơ chế Guards, JWT Strategy và Refresh Token.
   - *Bài 2.2 (Assignment):* Bài tập lớn số 1: Xây dựng Module Authentication & RBAC (Hạn nộp: 7 ngày, nộp file zip).

---

## 3. Lớp Học Thực Tế (Sample Class Instance)

- **Tên lớp:** `Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)`
- **Mã tham gia lớp (`class_code`):** `EDU2026A`
- **Giảng viên phụ trách:** `ThS. Nguyễn Văn An`
- **Thời gian học:** `2026-09-20` đến `2026-11-30`
- **Trạng thái:** `active`
- **Danh sách Học viên ghi danh (`enrollments`):**
  1. `student.dung@eduverse.com` (Đã hoàn thành 2/4 bài học — Tiến độ 50%)
  2. `student.hoa@eduverse.com` (Đã làm Quiz 1: Đạt 9.0/10)
  3. `student.nam@eduverse.com` (Mới ghi danh)
