# Kế hoạch Dự án — EduVerse

> Tài liệu theo dõi tiến độ tổng thể của dự án.  
> Cập nhật trạng thái sau mỗi buổi họp nhóm.

---

## Thông tin chung

| Mục | Chi tiết |
|---|---|
| **Tên dự án** | EduVerse |
| **Thời gian** | ~2 tháng (09/2026 – 11/2026) |
| **Số thành viên** | 4–5 người |
| **Repository** | [github.com/dunghvd79/eduverse](https://github.com/dunghvd79/eduverse) |

---

## Tiến độ tổng thể

### Phase 0: Thiết kế (Tuần 1–2)

- [x] Phân tích yêu cầu từ đề bài
- [x] Chốt tech stack (Express.js + React/Vite JavaScript + PostgreSQL/Sequelize + AWS S3 + Gemini AI)
- [x] Chốt quy tắc nghiệp vụ & mô hình phân quyền RBAC 4 vai trò
- [x] Tạo cấu trúc thư mục dự án theo chuẩn Docs-as-Code
- [x] Thiết lập Git repository & kết nối GitHub remote
- [x] Vẽ Use Case Diagram (Tổng quan Level-0 Package + Chi tiết 4 Actor)
- [x] Viết Use Case Specifications (Đặc tả kịch bản chuẩn OMG UML 2.5 & Alistair Cockburn)
- [x] Thiết kế ERD (Entity Relationship Diagram) & Schema vật lý chi tiết 18 bảng CSDL
- [x] Thiết kế Hệ thống Sơ đồ Tuần tự (Sequence Diagrams — 6 luồng nghiệp vụ cốt lõi)
- [x] Thiết kế Trọn bộ Đặc tả API (API Specifications — 8/8 tài liệu, 101 Endpoints chuẩn RESTful)
- [x] Quy ước tài liệu & cấu trúc Docs-as-Code (`docs-conventions.md`)
- [ ] Phác thảo UI Wireframes & Sitemap

### Phase 1: MVP Development (Tuần 3–7)

- [ ] Sprint 1: Khởi tạo Project & Cài đặt môi trường (Express.js Backend + React Vite Frontend + Docker)
- [ ] Sprint 2: Module Auth + Quản lý Người dùng (Users & RBAC)
- [ ] Sprint 3: Module Khóa học + Chương học + Bài học (Courses, Chapters, Lessons)
- [ ] Sprint 4: Module Lớp học + Ghi danh + Upload tài liệu đa phương tiện (Classes, Enrollments, Uploads)
- [ ] Sprint 5: Module Bài kiểm tra trắc nghiệm + Gemini AI sinh đề thi (Quizzes, Gemini AI)
- [ ] Sprint 6: Module Bài tập nộp file + Chấm điểm + Thống kê tiến độ (Assignments, Grading, Progress)

### Phase 2: Tính năng bổ sung (Tuần 8 — Nâng cao)

- [ ] Thông báo hệ thống & Email tự động qua BullMQ Worker
- [ ] Thảo luận / Hỏi đáp trong bài học
- [ ] Xuất báo cáo điểm & thống kê lớp học ra file Excel nâng cao

### Phase 3: Hoàn thiện & Demo

- [ ] Testing & Bug fixes (Unit Tests, E2E Tests)
- [ ] Viết báo cáo đồ án liên ngành
- [ ] Triển khai Deployment (Docker Compose / Cloud Hosting) & Chuẩn bị Demo

---

## Phân công (cập nhật sau khi họp nhóm)

| Thành viên | Vai trò | Module phụ trách |
|---|---|---|
| _Tên 1_ | _Backend Lead_ | _Auth, Users_ |
| _Tên 2_ | _Backend_ | _Course, Class, Quiz_ |
| _Tên 3_ | _Frontend Lead_ | _Layout, Auth pages_ |
| _Tên 4_ | _Frontend_ | _Course, Lesson pages_ |
| _Tên 5_ | _Fullstack_ | _Upload, AI, Integration_ |

---

## Lịch sử cập nhật

| Ngày | Nội dung |
|---|---|
| 21/09/2026 | Khởi tạo dự án, chốt tech stack, tạo cấu trúc thư mục |
| 24/09/2026 | Hoàn thành 100% Phase 0: Use Cases, CSDL Schema 18 bảng, 6 Sequence Diagrams, trọn bộ 8/8 tài liệu API Specs (101 Endpoints) |

---

_Cập nhật lần cuối: 24/09/2026_
