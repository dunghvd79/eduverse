# 📋 Đặc Tả Cơ Sở Dữ Liệu Chi Tiết (Database Physical Schema)

> **Hệ quản trị CSDL:** PostgreSQL 16+  
> **ORM:** TypeORM (NestJS)  
> **Quy chuẩn:** Bảng số nhiều `snake_case`, PK `UUID v4`, Indexes tối ưu hóa tìm kiếm và liên kết khóa ngoại (FK Indexing).

---

## 1. Danh Mục Các Bảng Dữ Liệu (17 Bảng)

1. [`users`](#1-bảng-users-người-dùng)
2. [`user_tokens`](#2-bảng-user_tokens-mã-xác-thực--khôi-phục-mật-khẩu)
3. [`courses`](#3-bảng-courses-khóa-học)
4. [`chapters`](#4-bảng-chapters-chương-học)
5. [`lessons`](#5-bảng-lessons-bài-học)
6. [`course_materials`](#6-bảng-course_materials-tài-liệu-bài-học)
7. [`classes`](#7-bảng-classes-lớp-học)
8. [`enrollments`](#8-bảng-enrollments-ghi-danh-lớp-học)
9. [`quizzes`](#9-bảng-quizzes-bài-kiểm-tra-trắc-nghiệm)
10. [`class_quizzes`](#10-bảng-class_quizzes-lịch-mở-quiz-theo-lớp)
11. [`questions`](#11-bảng-questions-câu-hỏi-trắc-nghiệm)
12. [`question_options`](#12-bảng-question_options-đáp-án-lựa-chọn)
13. [`quiz_attempts`](#13-bảng-quiz_attempts-lượt-làm-bài-thi)
14. [`quiz_attempt_answers`](#14-bảng-quiz_attempt_answers-chi-tiết-câu-trả-lời)
15. [`assignments`](#15-bảng-assignments-bài-tập-nộp-file)
16. [`class_assignments`](#16-bảng-class_assignments-hạn-nộp-bài-tập-theo-lớp)
17. [`assignment_submissions`](#17-bảng-assignment_submissions-bài-làm-đã-nộp)
18. [`lesson_progress`](#18-bảng-lesson_progress-tiến-độ-học-tập)

---

## 2. Chi Tiết Từng Bảng

---

### 1. Bảng `users` (Người dùng)

Lưu trữ thông tin xác thực và hồ sơ của mọi người dùng trong hệ thống (Học viên, Giảng viên, Quản lý, Admin).

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `email` | `varchar(255)` | ❌ | | Email đăng nhập |
| `password_hash` | `varchar(255)` | ❌ | | Mật khẩu mã hóa bằng bcrypt |
| `full_name` | `varchar(150)` | ❌ | | Họ và tên hiển thị của người dùng |
| `avatar_url` | `varchar(500)` | ✔️ | `NULL` | Đường dẫn ảnh đại diện trên AWS S3 |
| `role` | `varchar(30)` | ❌ | `'student'` | `student`, `teacher`, `training_manager`, `admin` |
| `is_active` | `boolean` | ❌ | `true` | Cờ khóa tài khoản (`false`: bị khóa) |
| `email_verified`| `boolean` | ❌ | `false` | Trạng thái đã kích hoạt email |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo bản ghi |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm cập nhật cuối cùng |
| `deleted_at` | `timestamptz` | ✔️ | `NULL` | Hỗ trợ xóa mềm (Soft Delete) |

**Indexes & Constraints:**
- `uq_users_email_active` UNIQUE (`email`) WHERE `deleted_at IS NULL` *(Partial Unique Index — cho phép đăng ký lại nếu tài khoản cũ bị xóa mềm)*
- `idx_users_role` ON `users(role)`

---

### 2. Bảng `user_tokens` (Mã xác thực & Khôi phục mật khẩu)

Quản lý vòng đời của mã kích hoạt email (`email_verification`) và mã đặt lại mật khẩu (`password_reset`).

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `user_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` (`ON DELETE CASCADE`) |
| `token_hash` | `varchar(255)` | ❌ | | Mã token băm SHA-256 (bảo mật trong database) |
| `token_type` | `varchar(50)` | ❌ | | `email_verification`, `password_reset` |
| `expires_at` | `timestamptz` | ❌ | | Thời điểm hết hạn của token |
| `is_used` | `boolean` | ❌ | `false` | Đã sử dụng mã hay chưa |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm sinh mã |

**Indexes & Constraints:**
- `uq_user_tokens_hash` UNIQUE (`token_hash`)
- `idx_user_tokens_lookup` ON `user_tokens(token_hash, token_type, is_used)`


---

### 2. Bảng `courses` (Khóa học)

Khung nội dung đào tạo tổng thể do Giảng viên tạo và Quản lý phê duyệt.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `owner_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` (Chủ sở hữu khóa học) |
| `title` | `varchar(255)` | ❌ | | Tên khóa học |
| `slug` | `varchar(255)` | ❌ | | Đường dẫn thân thiện SEO (`UNIQUE`) |
| `description` | `text` | ✔️ | `NULL` | Mô tả chi tiết nội dung khóa học |
| `thumbnail_url` | `varchar(500)` | ✔️ | `NULL` | Ảnh bìa khóa học trên S3 |
| `price` | `decimal(10,2)`| ❌ | `0.00` | Giá khóa học (mặc định 0 để sẵn sàng mở rộng) |
| `status` | `varchar(30)` | ❌ | `'draft'` | `draft`, `pending`, `published`, `rejected`, `archived` |
| `approved_by` | `uuid` | ✔️ | `NULL` | Khóa ngoại $\rightarrow$ `users(id)` (Quản lý duyệt) |
| `approved_at` | `timestamptz` | ✔️ | `NULL` | Thời điểm phê duyệt |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm sửa |
| `deleted_at` | `timestamptz` | ✔️ | `NULL` | Xóa mềm |

**Indexes & Constraints:**
- `uq_courses_slug_active` UNIQUE (`slug`) WHERE `deleted_at IS NULL` *(Partial Unique Index)*
- `idx_courses_owner_id` ON `courses(owner_id)`
- `idx_courses_status` ON `courses(status)`


---

### 3. Bảng `chapters` (Chương học)

Các chương mục nhóm các bài học trong một khóa học.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `course_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `courses(id)` (`ON DELETE CASCADE`) |
| `title` | `varchar(255)` | ❌ | | Tiêu đề chương |
| `order_index` | `int` | ❌ | `0` | Thứ tự sắp xếp hiển thị trong khóa học |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm sửa |

**Indexes:**
- `idx_chapters_course_order` ON `chapters(course_id, order_index)`

---

### 4. Bảng `lessons` (Bài học)

Đơn vị học tập nhỏ nhất mà học viên cần hoàn thành.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `chapter_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `chapters(id)` (`ON DELETE CASCADE`) |
| `title` | `varchar(255)` | ❌ | | Tiêu đề bài học |
| `lesson_type` | `varchar(30)` | ❌ | `'theory'`| `theory`, `video`, `quiz`, `assignment` |
| `content_text` | `text` | ✔️ | `NULL` | Nội dung bài học (Rich text / Markdown) |
| `video_url` | `varchar(500)` | ✔️ | `NULL` | Link video bài giảng |
| `order_index` | `int` | ❌ | `0` | Thứ tự bài học trong chương |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm sửa |

**Indexes:**
- `idx_lessons_chapter_order` ON `lessons(chapter_id, order_index)`

---

### 5. Bảng `course_materials` (Tài liệu bài học)

Tài liệu đính kèm (Slide bài giảng, source code mẫu, sách PDF).

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `lesson_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `lessons(id)` (`ON DELETE CASCADE`) |
| `title` | `varchar(255)` | ❌ | | Tên tài liệu |
| `file_url` | `varchar(500)` | ❌ | | Đường dẫn lưu trữ an toàn trên AWS S3 |
| `file_type` | `varchar(50)` | ❌ | | Định dạng file (`pdf`, `zip`, `docx`, `pptx`) |
| `file_size` | `bigint` | ❌ | `0` | Kích thước file (bytes) |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tải lên |

---

### 6. Bảng `classes` (Lớp học)

Một lần tổ chức thực tế của khóa học, có Giảng viên phụ trách và Học viên tham gia.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `course_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `courses(id)` |
| `teacher_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` (Giảng viên đứng lớp) |
| `name` | `varchar(255)` | ❌ | | Tên lớp (vd: Lập trình Web - K2026A) |
| `class_code` | `varchar(20)` | ❌ | | Mã ghi danh lớp học duy nhất (`UNIQUE`) |
| `start_date` | `date` | ✔️ | `NULL` | Ngày khai giảng |
| `end_date` | `date` | ✔️ | `NULL` | Ngày kết thúc |
| `status` | `varchar(30)` | ❌ | `'active'` | `active` (đang học), `paused` (tạm dừng), `closed` (kết thúc) |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm sửa |
| `deleted_at` | `timestamptz` | ✔️ | `NULL` | Xóa mềm |

**Indexes & Constraints:**
- `uq_classes_code_active` UNIQUE (`class_code`) WHERE `deleted_at IS NULL` *(Partial Unique Index)*
- `idx_classes_teacher_id` ON `classes(teacher_id)`
- `idx_classes_course_id` ON `classes(course_id)`

---

### 8. Bảng `enrollments` (Ghi danh học viên)

Ghi nhận danh sách học viên tham gia vào một lớp học.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `class_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `classes(id)` |
| `student_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` |
| `enrolled_at` | `timestamptz` | ❌ | `now()` | Thời điểm tham gia lớp |
| `status` | `varchar(30)` | ❌ | `'active'` | `active`, `dropped`, `completed` |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `deleted_at` | `timestamptz` | ✔️ | `NULL` | Xóa mềm |

**Ràng buộc Unique & Indexes:**
- `uq_enrollments_active` UNIQUE (`class_id`, `student_id`) WHERE `deleted_at IS NULL` *(Partial Unique Index — cho phép ghi danh lại sau khi từng hủy lớp)*
- `idx_enrollments_student` ON `enrollments(student_id)`


---

### 9. Bảng `quizzes` (Bài kiểm tra trắc nghiệm)

Khung bài kiểm tra trắc nghiệm gắn với một bài học trong khóa học (Quan hệ 1:1 với bài học dạng quiz).

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `lesson_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `lessons(id)` (`ON DELETE CASCADE`) |
| `title` | `varchar(255)` | ❌ | | Tiêu đề bài kiểm tra |
| `description` | `text` | ✔️ | `NULL` | Hướng dẫn thi |
| `duration_minutes`| `int` | ❌ | `15` | Thời gian làm bài tính bằng phút |
| `max_attempts` | `int` | ❌ | `1` | Số lần tối đa được phép làm bài |
| `pass_score` | `decimal(4,2)` | ❌ | `5.00` | Điểm đạt yêu cầu (thang 10) |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm sửa |

**Ràng buộc Unique:**
- `uq_quizzes_lesson` UNIQUE (`lesson_id`) *(Mỗi bài học chỉ có tối đa 1 bài kiểm tra)*

---

### 10. Bảng `class_quizzes` (Lịch mở Quiz theo lớp)

Cấu hình thời gian mở và đóng đề thi cho từng lớp học cụ thể.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `class_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `classes(id)` |
| `quiz_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `quizzes(id)` |
| `open_time` | `timestamptz` | ✔️ | `NULL` | Thời điểm mở đề cho sinh viên làm |
| `close_time` | `timestamptz` | ✔️ | `NULL` | Hạn chót đóng đề thi |
| `is_active` | `boolean` | ❌ | `true` | Bật/tắt trạng thái làm bài |

**Ràng buộc Unique:**
- `uq_class_quizzes` UNIQUE (`class_id`, `quiz_id`)

---

### 11. Bảng `questions` (Câu hỏi)

Ngân hàng câu hỏi của đề thi trắc nghiệm.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `quiz_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `quizzes(id)` (`ON DELETE CASCADE`) |
| `prompt` | `text` | ❌ | | Nội dung câu hỏi |
| `question_type`| `varchar(30)` | ❌ | `'multiple_choice'` | `multiple_choice`, `true_false` |
| `points` | `decimal(4,2)` | ❌ | `1.00` | Điểm số của câu hỏi |
| `order_index` | `int` | ❌ | `0` | Thứ tự câu hỏi |

---

### 12. Bảng `question_options` (Đáp án lựa chọn)

Các phương án trả lời cho từng câu hỏi (A, B, C, D hoặc Đúng/Sai).

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `question_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `questions(id)` (`ON DELETE CASCADE`) |
| `option_text` | `text` | ❌ | | Nội dung đáp án |
| `is_correct` | `boolean` | ❌ | `false` | `true`: là đáp án chính xác |
| `order_index` | `int` | ❌ | `0` | Thứ tự đáp án (A=0, B=1...) |

---

### 13. Bảng `quiz_attempts` (Lượt làm bài kiểm tra)

Ghi nhận các lần thực hiện bài kiểm tra của học viên và điểm số đạt được.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `class_quiz_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `class_quizzes(id)` |
| `student_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` |
| `attempt_number`| `int` | ❌ | `1` | Lần thi thứ mấy (1, 2...) |
| `started_at` | `timestamptz` | ❌ | `now()` | Thời điểm bắt đầu tính giờ |
| `submitted_at` | `timestamptz` | ✔️ | `NULL` | Thời điểm nộp bài |
| `score` | `decimal(4,2)` | ✔️ | `NULL` | Điểm đạt được (thang 10, tự chấm) |
| `status` | `varchar(30)` | ❌ | `'in_progress'` | `in_progress`, `completed`, `timed_out` |

**Ràng buộc Unique:**
- `uq_quiz_attempts` UNIQUE (`class_quiz_id`, `student_id`, `attempt_number`)

---

### 14. Bảng `quiz_attempt_answers` (Chi tiết câu trả lời)

Lưu câu trả lời cụ thể của học viên cho từng câu hỏi trong mỗi lần thi.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `attempt_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `quiz_attempts(id)` (`ON DELETE CASCADE`) |
| `question_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `questions(id)` |
| `selected_option_id`| `uuid` | ✔️ | `NULL` | Khóa ngoại $\rightarrow$ `question_options(id)` |
| `is_correct` | `boolean` | ❌ | `false` | Hệ thống tự đối chiếu và ghi nhận |

**Ràng buộc Unique:**
- `uq_attempt_answers_unique` UNIQUE (`attempt_id`, `question_id`) *(Mỗi câu hỏi chỉ có 1 câu trả lời trong cùng 1 lần thi)*

---

### 15. Bảng `assignments` (Bài tập nộp file)

Khung bài tập lớn/bài tập về nhà yêu cầu nộp file đính kèm (Quan hệ 1:1 với bài học dạng assignment).

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `lesson_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `lessons(id)` (`ON DELETE CASCADE`) |
| `title` | `varchar(255)` | ❌ | | Tiêu đề bài tập |
| `instruction` | `text` | ❌ | | Đề bài và hướng dẫn chi tiết |
| `allowed_file_types`| `varchar(255)`| ❌ | `'pdf,zip,docx'`| Định dạng file được phép nộp |
| `max_file_size_mb` | `int` | ❌ | `25` | Dung lượng file tối đa (MB) |
| `created_at` | `timestamptz` | ❌ | `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | ❌ | `now()` | Thời điểm sửa |

**Ràng buộc Unique:**
- `uq_assignments_lesson` UNIQUE (`lesson_id`) *(Mỗi bài học chỉ có tối đa 1 bài tập nộp file)*

---

### 16. Bảng `class_assignments` (Hạn nộp bài tập theo lớp)

Cấu hình thời gian bắt đầu nhận bài và Deadline của bài tập theo từng lớp.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `class_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `classes(id)` |
| `assignment_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `assignments(id)` |
| `open_time` | `timestamptz` | ✔️ | `NULL` | Thời điểm bắt đầu nhận bài |
| `deadline` | `timestamptz` | ❌ | | Hạn chót nộp bài (Deadline) |
| `allow_late_submission`| `boolean`| ❌ | `true` | Cho phép nộp muộn sau deadline hay không |

**Ràng buộc Unique:**
- `uq_class_assignments` UNIQUE (`class_id`, `assignment_id`)

---

### 17. Bảng `assignment_submissions` (Bài làm đã nộp)

Lưu file bài làm học viên upload lên AWS S3 và điểm chấm kèm nhận xét của Giảng viên.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `class_assignment_id`| `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `class_assignments(id)` |
| `student_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` |
| `file_url` | `varchar(500)` | ❌ | | Đường dẫn file trên AWS S3 |
| `file_name` | `varchar(255)` | ❌ | | Tên file gốc lúc tải lên |
| `file_size` | `bigint` | ❌ | | Dung lượng file (bytes) |
| `student_note` | `text` | ✔️ | `NULL` | Lời nhắn / Ghi chú của học viên khi nộp bài |
| `submitted_at` | `timestamptz` | ❌ | `now()` | Thời điểm nộp bài |
| `status` | `varchar(30)` | ❌ | `'submitted'` | `submitted`, `late_submitted`, `graded` |
| `grade` | `decimal(4,2)` | ✔️ | `NULL` | Điểm do Giảng viên chấm (thang 10) |
| `feedback` | `text` | ✔️ | `NULL` | Lời phê, góp ý chi tiết của Giảng viên |
| `graded_by` | `uuid` | ✔️ | `NULL` | Khóa ngoại $\rightarrow$ `users(id)` (Giảng viên chấm) |
| `graded_at` | `timestamptz` | ✔️ | `NULL` | Thời điểm chấm bài |

**Ràng buộc Unique:**
- `uq_assignment_submissions` UNIQUE (`class_assignment_id`, `student_id`) *(Mỗi học viên có 1 bản nộp chính thức)*

---

### 18. Bảng `lesson_progress` (Tiến độ bài học)

Ghi nhận trạng thái hoàn thành bài học của học viên trong lớp để tính toán tỷ lệ % hoàn thành toàn khóa học.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Mô Tả |
|---|---|:---:|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | Khóa chính (PK) |
| `class_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `classes(id)` |
| `student_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `users(id)` |
| `lesson_id` | `uuid` | ❌ | | Khóa ngoại $\rightarrow$ `lessons(id)` |
| `is_completed`| `boolean` | ❌ | `true` | Đã hoàn thành bài học |
| `completed_at`| `timestamptz` | ❌ | `now()` | Thời điểm hoàn thành |

**Ràng buộc Unique:**
- `uq_lesson_progress` UNIQUE (`class_id`, `student_id`, `lesson_id`)

