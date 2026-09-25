# 🗃️ Quyết Định Thiết Kế Cơ Sở Dữ Liệu (Database Decisions)

> **Hệ quản trị CSDL:** PostgreSQL 16+  
> **ORM tương thích:** Sequelize v6 (Express.js)  
> **Áp dụng cho:** Hệ thống EduVerse (LMS)

---

## 1. Nguyên Tắc & Quy Chuẩn Thiết Kế

### 1.1. Khóa Chính (Primary Key)
- **Chuẩn hóa:** 100% các bảng sử dụng kiểu dữ liệu `UUID v4` làm khóa chính (`id uuid DEFAULT gen_random_uuid() PRIMARY KEY`).
- **Lý do:**
  - Ngăn chặn triệt để tấn công vét cạn (ID Enumeration / Insecure Direct Object References - IDOR) trên các URL như `/api/courses/1`, `/api/users/2`.
  - Che giấu quy mô kinh doanh thực tế của hệ thống.
  - Phù hợp với kiến trúc phân tán và microservices mở rộng sau này.

### 1.2. Chiến Lược Xóa Dữ Liệu (Soft Delete vs Hard Delete)
- **Xóa mềm (Soft Delete):** Áp dụng cho toàn bộ các thực thể nghiệp vụ cốt lõi:
  - `users`, `courses`, `chapters`, `lessons`, `classes`, `enrollments`, `quizzes`, `assignments`.
  - Cột nhận diện: `deleted_at timestamptz NULL`.
  - Trong Sequelize kích hoạt tùy chọn `paranoid: true` (tự động mapping sang cột `deleted_at`).
- **Xóa cứng (Hard Delete + Cascade):** Áp dụng cho các bảng dữ liệu phụ thuộc vòng đời cấp con (khi câu hỏi bị xóa thì các đáp án con trong `question_options` bị xóa theo `ON DELETE CASCADE`).

### 1.3. Quy Chuẩn Đặt Tên (Naming Conventions)
- **Tên bảng:** Viết thường, phân cách bằng dấu gạch dưới, dạng **danh từ số nhiều** (`snake_case` plural):
  - Ví dụ: `users`, `user_tokens`, `courses`, `chapters`, `lessons`, `classes`, `enrollments`, `quizzes`, `questions`, `question_options`, `quiz_attempts`, `quiz_attempt_answers`, `assignments`, `assignment_submissions`, `lesson_progress`, `course_materials`.
- **Tên cột:** Viết thường `snake_case` (ví dụ: `class_code`, `is_published`, `max_score`).
- **Khóa ngoại (Foreign Key):** Đặt theo quy tắc `[tên_thực_thể_số_ít]_id` (ví dụ: `course_id`, `student_id`, `class_id`, `quiz_id`).
- **Cột giám sát hệ thống (Audit Fields):** Mọi bảng đều bắt buộc có:
  - `created_at timestamptz DEFAULT now() NOT NULL`
  - `updated_at timestamptz DEFAULT now() NOT NULL`

### 1.4. Ràng Buộc Duy Nhất Khi Có Xóa Mềm (Partial Unique Indexes)
- **Vấn đề thực tế:** Nếu dùng ràng buộc `UNIQUE` thông thường, một bản ghi bị xóa mềm (`deleted_at IS NOT NULL`) vẫn chiếm giữ giá trị duy nhất, khiến người dùng không thể tạo lại cùng `email`, `slug`, hoặc `class_code`.
- **Giải pháp chuẩn Enterprise:** Sử dụng **Partial Unique Index** (Chỉ áp dụng tính duy nhất cho các bản ghi đang hoạt động `WHERE deleted_at IS NULL`):
  ```sql
  CREATE UNIQUE INDEX uq_users_email_active ON users(email) WHERE deleted_at IS NULL;
  CREATE UNIQUE INDEX uq_courses_slug_active ON courses(slug) WHERE deleted_at IS NULL;
  CREATE UNIQUE INDEX uq_classes_code_active ON classes(class_code) WHERE deleted_at IS NULL;
  CREATE UNIQUE INDEX uq_enrollments_active ON enrollments(class_id, student_id) WHERE deleted_at IS NULL;
  ```

---

## 2. Danh Sách 16 Bảng Dữ Liệu Trong Hệ Thống (MVP)

| Nhóm Phân Hệ | Tên Bảng | Ý Nghĩa Nghiệp Vụ |
|---|---|---|
| **1. Xác thực & Người dùng** | `users` | Lưu trữ toàn bộ tài khoản (Admin, Giảng viên, Học viên, Quản lý) |
| | `user_tokens` | Quản lý mã OTP/Token kích hoạt email & đặt lại mật khẩu |
| **2. Khóa học & Nội dung** | `courses` | Khóa học tổng thể (tiêu đề, mô tả, giá mở rộng, trạng thái phê duyệt) |
| | `chapters` | Các chương học trong khóa học |
| | `lessons` | Bài học chi tiết trong từng chương (theory, video, quiz, assignment) |
| | `course_materials` | Tài liệu đính kèm bài học (File PDF/Slide trên S3) |
| **3. Lớp học & Ghi danh** | `classes` | Một đợt mở cụ thể của khóa học (Class Code, thời gian học) |
| | `enrollments` | Học viên ghi danh vào lớp học |
| **4. Khảo sát & Đánh giá (Quiz)** | `quizzes` | Đề thi trắc nghiệm (thời gian làm bài, số lần thử, điểm đạt) — 1:1 với bài học |
| | `class_quizzes` | Cấu hình lịch mở/đóng và deadline của Quiz theo từng Lớp học |
| | `questions` | Ngân hàng câu hỏi của Quiz (MC 4 lựa chọn hoặc True/False) |
| | `question_options` | Các lựa chọn đáp án A/B/C/D kèm cờ đáp án đúng `is_correct` |
| | `quiz_attempts` | Lịch sử các lần làm bài thi của học viên (điểm số, thời gian nộp) |
| | `quiz_attempt_answers`| Chi tiết câu trả lời học viên đã chọn trong từng câu của lần thi |
| **5. Bài tập về nhà** | `assignments` | Bài tập yêu cầu nộp file — 1:1 với bài học |
| | `class_assignments` | Cấu hình deadline bài tập theo từng Lớp học cụ thể |
| | `assignment_submissions` | File bài tập học viên đã nộp lên S3, điểm chấm & lời phê của GV |
| **6. Tiến độ học tập** | `lesson_progress` | Ghi nhận học viên đã hoàn thành bài học nào (tính % khóa học) |

---

## 3. Kiến Trúc Điểm Số (Single Source of Truth)
- Điểm bài kiểm tra trắc nghiệm được tính và lưu tại `quiz_attempts.score`.
- Điểm bài tập nộp file được giảng viên chấm và lưu tại `assignment_submissions.grade`.
- **Bảng điểm lớp học (Gradebook):** Không tạo bảng lưu trữ độc lập để tránh sai lệch dữ liệu, mà được truy vấn tổng hợp động thông qua SQL View hoặc Service Query khi giảng viên/học viên yêu cầu hiển thị.

