# ✅ EduVerse — Quyết định Use Case (Trước khi bắt tay)

---

## Các quyết định đã chốt

| # | Quyết định | Lựa chọn |
|---|---|---|
| 1 | Tổ chức diagram | **Theo Actor** — mỗi actor 1 sơ đồ riêng |
| 2 | Overview diagram | **Có** — 1 sơ đồ tổng quan + N sơ đồ chi tiết |
| 3 | Phạm vi | **Chỉ MVP (Phase 1)** — 10 nhóm chức năng |
| 4 | Granularity | **Mức User Goal** — CRUD gộp thành "Quản lý X" |
| 5 | Quan hệ UC | **Có dùng «include» và «extend»** |
| 6 | Danh sách Actor | **4 người + 2 hệ thống**: Student, Teacher, Training Manager, Admin, Email Service, AI Service |
| 7 | Mức độ spec | **Chi tiết cho 10–15 UC cốt lõi**, UC đơn giản mô tả ngắn |
| 8 | Đánh mã | **Theo nhóm**: UC-AUTH-001, UC-COURSE-001, UC-QUIZ-001... |

---

## Danh sách Use Case dự kiến (sơ bộ)

### 🟢 Actor: Student (Học viên)

| Mã | Use Case | Spec chi tiết? |
|---|---|---|
| UC-AUTH-001 | Đăng ký tài khoản | ✅ |
| UC-AUTH-002 | Đăng nhập | ✅ |
| UC-AUTH-003 | Quên mật khẩu | ✅ |
| UC-AUTH-004 | Xác thực email | ⬜ ngắn |
| UC-USER-001 | Quản lý hồ sơ cá nhân | ⬜ ngắn |
| UC-CLASS-001 | Ghi danh vào lớp (bằng mã) | ✅ |
| UC-LESSON-001 | Truy cập bài học | ✅ |
| UC-DOC-001 | Xem/Tải tài liệu | ⬜ ngắn |
| UC-PROGRESS-001 | Đánh dấu hoàn thành bài học | ⬜ ngắn |
| UC-PROGRESS-002 | Xem tiến độ học tập | ⬜ ngắn |
| UC-QUIZ-001 | Làm bài kiểm tra | ✅ |
| UC-ASSIGN-001 | Nộp bài tập | ✅ |
| UC-GRADE-001 | Xem điểm và nhận xét | ⬜ ngắn |

### 🔵 Actor: Teacher (Giảng viên)

| Mã | Use Case | Spec chi tiết? |
|---|---|---|
| UC-COURSE-001 | Quản lý khóa học (CRUD) | ✅ |
| UC-COURSE-002 | Xuất bản khóa học | ⬜ ngắn |
| UC-CHAPTER-001 | Quản lý chương (CRUD + sắp xếp) | ⬜ ngắn |
| UC-LESSON-002 | Quản lý bài học (CRUD + sắp xếp) | ⬜ ngắn |
| UC-DOC-002 | Upload tài liệu | ⬜ ngắn |
| UC-CLASS-002 | Tạo lớp học từ khóa học | ✅ |
| UC-CLASS-003 | Mời/Thêm học viên vào lớp | ⬜ ngắn |
| UC-QUIZ-002 | Tạo bài kiểm tra | ✅ |
| UC-QUIZ-003 | Quản lý câu hỏi | ⬜ ngắn |
| UC-ASSIGN-002 | Giao bài tập | ✅ |
| UC-GRADE-002 | Chấm bài tập & phản hồi | ✅ |
| UC-PROGRESS-003 | Theo dõi tiến độ học viên | ⬜ ngắn |
| UC-AI-001 | Dùng AI sinh câu hỏi trắc nghiệm | ✅ |

### 🟠 Actor: Training Manager (Quản lý đào tạo)

| Mã | Use Case | Spec chi tiết? |
|---|---|---|
| UC-MGMT-001 | Xem tất cả khóa học/lớp học | ⬜ ngắn |
| UC-MGMT-002 | Phê duyệt khóa học | ✅ |
| UC-MGMT-003 | Phân công giảng viên | ⬜ ngắn |
| UC-MGMT-004 | Tạm dừng lớp học | ⬜ ngắn |

### 🔴 Actor: Admin (Quản trị viên)

| Mã | Use Case | Spec chi tiết? |
|---|---|---|
| UC-ADMIN-001 | Quản lý tài khoản (CRUD) | ⬜ ngắn |
| UC-ADMIN-002 | Tạo tài khoản giảng viên | ✅ |
| UC-ADMIN-003 | Gán/Thu hồi vai trò | ⬜ ngắn |
| UC-ADMIN-004 | Khóa/Mở khóa tài khoản | ⬜ ngắn |

---

## Tổng kết

| Mục | Số lượng |
|---|---|
| **Tổng Use Case** | ~30 UC |
| **Spec chi tiết** | ~13 UC (cốt lõi/phức tạp) |
| **Spec ngắn** | ~17 UC (CRUD đơn giản) |
| **Diagrams** | 1 Overview + 4 Actor diagrams |
| **Files tạo ra** | `use-case-diagram.md` + `uc-auth.md`, `uc-course.md`, `uc-class.md`... |

---

## Kế hoạch thực hiện

> [!IMPORTANT]
> Thứ tự thực hiện:

1. **Bước 1:** Vẽ **Use Case Diagram tổng quan (Overview)** — toàn cảnh hệ thống
2. **Bước 2:** Vẽ **4 Use Case Diagrams chi tiết** — 1 per actor
3. **Bước 3:** Viết **Use Case Specifications chi tiết** — 13 UC cốt lõi
4. **Bước 4:** Viết **Use Case Specifications ngắn** — 17 UC còn lại
5. **Bước 5:** Review & đối chiếu — đảm bảo không thiếu/thừa

Sau khi hoàn thành, ta sẽ chuyển sang **ERD mức khái niệm** (rút ra từ danh từ trong các use case).
