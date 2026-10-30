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
- [x] Phác thảo UI Wireframes & Sitemap (sitemap.md, wireframes.md)

### Phase 1: MVP Development (Tuần 3–7)

- [x] Sprint 1: Khởi tạo Project & Cài đặt môi trường (Express.js Backend + React Vite Frontend + Docker)
- [x] Sprint 2: Module Auth + Quản lý Người dùng (Users & RBAC)
- [x] Sprint 3: Module Khóa học + Chương học + Bài học (Courses, Chapters, Lessons)
- [x] Sprint 4: Module Lớp học + Ghi danh + Upload tài liệu đa phương tiện (Classes, Enrollments, Uploads)
- [x] Sprint 5: Module Bài kiểm tra trắc nghiệm + Gemini AI sinh đề thi (Quizzes, Gemini AI)
- [x] Sprint 6: Module Bài tập nộp file + Chấm điểm + Thống kê tiến độ (Assignments, Grading, Progress)

### Phase 2: Tính năng bổ sung (Tuần 8 — Nâng cao)

- [x] Thông báo hệ thống (trong ứng dụng, 18/10/2026) & Email tự động qua BullMQ + Redis (27/10/2026)
- [x] Thảo luận / Hỏi đáp trong bài học (26/10/2026)
- [x] Xuất báo cáo điểm & thống kê lớp học ra file Excel nâng cao (24/10/2026)

### Phase 3: Hoàn thiện & Demo

- [x] Testing & Bug fixes — 152 unit test + 51 kiểm tra E2E (24–27/10/2026), xem `docs/testing/automated-tests.md`
- [ ] Viết báo cáo đồ án liên ngành
- [x] Triển khai bằng Docker Compose (22/10/2026), hướng dẫn ở `docs/architecture/deployment.md`
- [ ] Cloud hosting (HTTPS) & chuẩn bị Demo

---

## Phân công (cập nhật sau khi họp nhóm)

| Thành viên | Vai trò | Module phụ trách |
|---|---|---|
| Dũng (`dunghvd79`) | Trưởng nhóm, review & merge `main` | Nền tảng Auth/Users, Khóa học, Lớp học, Bài kiểm tra, Bài tập, Dashboard (nhánh `feature-dung`) |
| Mạnh (`tuanmanh205`) | Thành viên | Nhánh `feature-manh`: nối frontend–API, Excel nâng cao, Thảo luận, Email BullMQ + Redis, Docker Compose, kiểm thử tự động |
| Hoàng Ngọc Sơn | Thành viên | Nhánh `feature-ngocson` _(ghi rõ phần phụ trách sau buổi họp nhóm)_ |
| Anh | Thành viên | Nhánh `feature-anh` _(ghi rõ phần phụ trách sau buổi họp nhóm)_ |

_Bảng được tổng hợp từ lịch sử các nhánh; cập nhật lại sau khi họp nhóm._

---

## Lịch sử cập nhật

| Ngày | Nội dung |
|---|---|
| 21/09/2026 | Khởi tạo dự án, chốt tech stack, tạo cấu trúc thư mục |
| 24/09/2026 | Hoàn thành Use Cases, CSDL Schema 18 bảng, 6 Sequence Diagrams, trọn bộ 8/8 tài liệu API Specs (101 Endpoints) |
| 26/09/2026 | Hoàn thành trọn vẹn 100% Phase 0 Thiết kế: Cập nhật Tech Stack (Express.js/Sequelize), Sửa C4 Level 2 Container Diagram, Hoàn thiện tài liệu UI (sitemap.md & wireframes.md 10 màn hình cốt lõi) |
| 13/10/2026 | Hoàn thành Sprint 3–5 (Upload S3, Lớp học, Bài kiểm tra Gemini AI, Bài tập & Bảng điểm). Nâng cấp toàn diện Portal Giảng viên: Dashboard chỉ số KPI & Class Cards chuẩn Enterprise LMS, Quản lý Khóa học đa chế độ (Lưới 16:9 / Bảng dữ liệu) kèm bộ lọc tức thời; chuẩn hóa dữ liệu khóa học thật trên Database Neon.tech |
| 14/10/2026 | Hoàn thành Vòng đời khóa học (Unpublish to Draft), hệ thống Custom Confirm Modal toàn ứng dụng, Bộ điều phối Local Storage Fallback tự động khi chưa có AWS S3, cải tiến danh sách Quiz và chuẩn hóa giao diện Trang chủ & Footer |
| 24–27/10/2026 | Phase 3: Docker Compose + kiểm thử tự động (152 unit test, 51 kiểm tra E2E). Phase 2: Excel nâng cao, Thảo luận trong bài học, Email tự động BullMQ + Redis — hoàn thành trên nhánh `feature-manh` |
| 28/10/2026 | Rà soát tài liệu so với code thực tế và đồng bộ lại: API `unpublish`, `gradebook`, `my-grades`, lưu trữ cục bộ, sitemap, quy tắc nghiệp vụ, quy trình Git |

---

_Cập nhật lần cuối: 28/10/2026_

