# 🗃️ Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)

> **Hệ thống:** EduVerse (LMS)  
> **Cơ sở dữ liệu:** PostgreSQL 16+  
> **Quy chuẩn:** Chuẩn 3NF (Third Normal Form), 100% Primary Key UUID, Single Source of Truth cho điểm số và tiến độ.

---

## 1. Sơ Đồ ERD Tổng Thể Hệ Thống

```mermaid
erDiagram
    %% ================= RELATIONSHIPS =================
    %% Users & Roles
    users ||--o{ user_tokens : "sở hữu mã xác thực"
    users ||--o{ courses : "soạn thảo (owner)"
    users ||--o{ classes : "phụ trách (giảng viên)"
    users ||--o{ enrollments : "tham gia (học viên)"
    users ||--o{ quiz_attempts : "thực hiện làm bài"
    users ||--o{ assignment_submissions : "nộp bài tập"
    users ||--o{ lesson_progress : "ghi nhận tiến độ"

    %% Course Structure
    courses ||--o{ chapters : "chứa các chương"
    courses ||--o{ classes : "tổ chức thành các lớp"
    chapters ||--o{ lessons : "chứa các bài học"
    lessons ||--o{ course_materials : "đính kèm tài liệu"
    lessons ||--o| quizzes : "chứa bài kiểm tra (1:1)"
    lessons ||--o| assignments : "chứa bài tập (1:1)"

    %% Class & Enrollments
    classes ||--o{ enrollments : "có danh sách học viên"
    classes ||--o{ class_quizzes : "cấu hình mở thi"
    classes ||--o{ class_assignments : "cấu hình hạn nộp"
    classes ||--o{ lesson_progress : "theo dõi tiến độ lớp"

    %% Quiz & Questions
    quizzes ||--o{ class_quizzes : "được gán vào lớp"
    quizzes ||--o{ questions : "chứa các câu hỏi"
    questions ||--o{ question_options : "có các đáp án lựa chọn"
    class_quizzes ||--o{ quiz_attempts : "có các lượt làm bài"
    quiz_attempts ||--o{ quiz_attempt_answers : "chi tiết câu trả lời"
    questions ||--o{ quiz_attempt_answers : "được trả lời trong"
    question_options ||--o{ quiz_attempt_answers : "lựa chọn đáp án"

    %% Assignments & Submissions
    assignments ||--o{ class_assignments : "được giao cho lớp"
    class_assignments ||--o{ assignment_submissions : "nhận các bài nộp"

    %% Progress
    lessons ||--o{ lesson_progress : "được hoàn thành trong"

    %% ================= ENTITY DEFINITIONS =================
    users {
        uuid id PK "Khóa chính tự sinh UUID"
        varchar email UK "Email đăng nhập duy nhất"
        varchar password_hash "Mật khẩu mã hóa bcrypt"
        varchar full_name "Họ và tên người dùng"
        varchar avatar_url "Link ảnh đại diện trên S3"
        varchar role "student | teacher | training_manager | admin"
        boolean is_active "Trạng thái kích hoạt tài khoản"
        boolean email_verified "Đã xác thực email hay chưa"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
        timestamptz deleted_at "Xóa mềm (Soft delete)"
    }

    user_tokens {
        uuid id PK "Khóa chính"
        uuid user_id FK "Người dùng sở hữu (users.id)"
        varchar token_hash UK "Chuỗi token băm SHA-256 duy nhất"
        varchar token_type "email_verification | password_reset"
        timestamptz expires_at "Thời hạn hiệu lực của mã"
        boolean is_used "Đã sử dụng hay chưa (default false)"
        timestamptz created_at "Thời gian tạo mã"
    }

    courses {
        uuid id PK "Khóa chính"
        uuid owner_id FK "Giảng viên tạo khóa học (users.id)"
        varchar title "Tên khóa học"
        varchar slug UK "Đường dẫn thân thiện duy nhất"
        text description "Mô tả khóa học"
        varchar thumbnail_url "Ảnh bìa khóa học trên S3"
        decimal price "Giá khóa học (default 0 để mở rộng)"
        varchar status "draft | pending | published | rejected | archived"
        uuid approved_by FK "Quản lý đào tạo phê duyệt (nullable)"
        timestamptz approved_at "Thời điểm phê duyệt"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
        timestamptz deleted_at "Xóa mềm"
    }

    chapters {
        uuid id PK "Khóa chính"
        uuid course_id FK "Thuộc khóa học nào"
        varchar title "Tên chương"
        int order_index "Thứ tự sắp xếp chương"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
    }

    lessons {
        uuid id PK "Khóa chính"
        uuid chapter_id FK "Thuộc chương nào"
        varchar title "Tiêu đề bài học"
        varchar lesson_type "theory | video | quiz | assignment"
        text content_text "Nội dung văn bản / markdown"
        varchar video_url "Link video bài giảng (nếu có)"
        int order_index "Thứ tự bài học trong chương"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
    }

    course_materials {
        uuid id PK "Khóa chính"
        uuid lesson_id FK "Thuộc bài học nào"
        varchar title "Tên tài liệu"
        varchar file_url "Đường dẫn file trên AWS S3"
        varchar file_type "pdf | zip | docx | pptx"
        bigint file_size "Dung lượng file tính bằng bytes"
        timestamptz created_at "Thời gian upload"
    }

    classes {
        uuid id PK "Khóa chính"
        uuid course_id FK "Mở từ khóa học nào"
        uuid teacher_id FK "Giảng viên phụ trách lớp (users.id)"
        varchar name "Tên lớp học (ví dụ: Lớp Java K2026-A)"
        varchar class_code UK "Mã tham gia lớp duy nhất (vd: JAVA01)"
        date start_date "Ngày bắt đầu học"
        date end_date "Ngày kết thúc học"
        varchar status "active | paused | closed"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
        timestamptz deleted_at "Xóa mềm"
    }

    enrollments {
        uuid id PK "Khóa chính"
        uuid class_id FK "Lớp học tham gia"
        uuid student_id FK "Học viên tham gia (users.id)"
        timestamptz enrolled_at "Thời điểm ghi danh vào lớp"
        varchar status "active | dropped | completed"
        timestamptz created_at "Thời gian tạo"
        timestamptz deleted_at "Xóa mềm"
    }

    quizzes {
        uuid id PK "Khóa chính"
        uuid lesson_id FK "Nằm trong bài học nào"
        varchar title "Tiêu đề bài kiểm tra"
        text description "Hướng dẫn làm bài"
        int duration_minutes "Thời gian làm bài tính bằng phút"
        int max_attempts "Số lần làm bài tối đa (mặc định 1)"
        decimal pass_score "Điểm đạt (thang 10, ví dụ: 5.0)"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
    }

    class_quizzes {
        uuid id PK "Khóa chính"
        uuid class_id FK "Lớp học áp dụng"
        uuid quiz_id FK "Bài kiểm tra áp dụng"
        timestamptz open_time "Thời điểm mở đề thi cho lớp"
        timestamptz close_time "Thời điểm đóng đề thi cho lớp"
        boolean is_active "Trạng thái bật/tắt làm bài"
    }

    questions {
        uuid id PK "Khóa chính"
        uuid quiz_id FK "Thuộc bài kiểm tra nào"
        text prompt "Nội dung câu hỏi"
        varchar question_type "multiple_choice | true_false"
        decimal points "Điểm số của câu hỏi này (vd: 1.0)"
        int order_index "Thứ tự hiển thị câu hỏi"
    }

    question_options {
        uuid id PK "Khóa chính"
        uuid question_id FK "Thuộc câu hỏi nào"
        text option_text "Nội dung đáp án (A, B, C, D...)"
        boolean is_correct "Đáp án đúng (true) hay sai (false)"
        int order_index "Thứ tự sắp xếp lựa chọn"
    }

    quiz_attempts {
        uuid id PK "Khóa chính"
        uuid class_quiz_id FK "Đợt thi của lớp"
        uuid student_id FK "Học viên làm bài (users.id)"
        int attempt_number "Lần thi thứ mấy (1, 2...)"
        timestamptz started_at "Thời điểm bắt đầu làm bài"
        timestamptz submitted_at "Thời điểm nộp bài"
        decimal score "Điểm số đạt được (thang 10)"
        varchar status "in_progress | completed | timed_out"
    }

    quiz_attempt_answers {
        uuid id PK "Khóa chính"
        uuid attempt_id FK "Thuộc lần thi nào (quiz_attempts.id)"
        uuid question_id FK "Câu hỏi nào"
        uuid selected_option_id FK "Đáp án học viên chọn (question_options.id)"
        boolean is_correct "Hệ thống tự đối chiếu: Đúng hay Sai"
    }

    assignments {
        uuid id PK "Khóa chính"
        uuid lesson_id FK "Thuộc bài học nào"
        varchar title "Tiêu đề bài tập"
        text instruction "Đề bài và hướng dẫn chi tiết"
        varchar allowed_file_types "Định dạng cho phép (pdf,zip,docx)"
        int max_file_size_mb "Dung lượng file tối đa (MB)"
        timestamptz created_at "Thời gian tạo"
        timestamptz updated_at "Thời gian sửa"
    }

    class_assignments {
        uuid id PK "Khóa chính"
        uuid class_id FK "Lớp học được giao bài"
        uuid assignment_id FK "Bài tập được giao"
        timestamptz open_time "Thời điểm bắt đầu nhận bài"
        timestamptz deadline "Hạn chót nộp bài (Deadline)"
        boolean allow_late_submission "Cho phép nộp muộn hay không"
    }

    assignment_submissions {
        uuid id PK "Khóa chính"
        uuid class_assignment_id FK "Bài tập lớp nào"
        uuid student_id FK "Học viên nộp bài (users.id)"
        varchar file_url "Link file bài làm trên AWS S3"
        varchar file_name "Tên file gốc khi học viên upload"
        bigint file_size "Dung lượng file thực tế"
        text student_note "Ghi chú của học viên khi nộp bài (nullable)"
        timestamptz submitted_at "Thời điểm nộp bài"
        varchar status "submitted | late_submitted | graded"
        decimal grade "Điểm số do giảng viên chấm (thang 10, nullable)"
        text feedback "Nhận xét, lời phê của giảng viên (nullable)"
        uuid graded_by FK "Giảng viên thực hiện chấm điểm (nullable)"
        timestamptz graded_at "Thời điểm chấm điểm"
    }

    lesson_progress {
        uuid id PK "Khóa chính"
        uuid class_id FK "Học trong lớp nào"
        uuid student_id FK "Học viên nào"
        uuid lesson_id FK "Bài học nào"
        boolean is_completed "Đã hoàn thành hay chưa"
        timestamptz completed_at "Thời điểm đánh dấu hoàn thành"
    }
```

---

## 2. Phân Tích Các Ràng Buộc Khóa Chính & Khóa Duy Nhất (Key Constraints)

| Bảng | Tên Constraint / Index | Cột ràng buộc & Điều kiện | Mục đích nghiệp vụ |
|---|---|---|---|
| `users` | `uq_users_email_active` | `UNIQUE(email) WHERE deleted_at IS NULL` | Email duy nhất cho user đang hoạt động (không xung đột khi xóa mềm) |
| `user_tokens` | `uq_user_tokens_hash` | `UNIQUE(token_hash)` | Mỗi token kích hoạt/reset mật khẩu là duy nhất |
| `courses` | `uq_courses_slug_active` | `UNIQUE(slug) WHERE deleted_at IS NULL` | Đường dẫn URL duy nhất cho khóa học đang tồn tại |
| `quizzes` | `uq_quizzes_lesson` | `UNIQUE(lesson_id)` | Mỗi bài học dạng quiz chỉ chứa duy nhất 1 đề thi trắc nghiệm (1:1) |
| `assignments` | `uq_assignments_lesson` | `UNIQUE(lesson_id)` | Mỗi bài học dạng assignment chỉ chứa duy nhất 1 bài tập (1:1) |
| `classes` | `uq_classes_code_active` | `UNIQUE(class_code) WHERE deleted_at IS NULL` | Mã tham gia lớp học là duy nhất toàn hệ thống |
| `enrollments` | `uq_enrollments_active` | `UNIQUE(class_id, student_id) WHERE deleted_at IS NULL` | Học viên không ghi danh trùng vào 1 lớp (cho phép ghi danh lại nếu từng hủy) |
| `class_quizzes` | `uq_class_quizzes_class_quiz` | `UNIQUE(class_id, quiz_id)` | Mỗi bài kiểm tra chỉ cấu hình lịch thi 1 lần cho 1 lớp |
| `class_assignments`| `uq_class_assignments_class_asg`| `UNIQUE(class_id, assignment_id)` | Mỗi bài tập chỉ gán deadline 1 lần cho 1 lớp |
| `quiz_attempts` | `uq_quiz_attempts_unique` | `UNIQUE(class_quiz_id, student_id, attempt_number)` | Đảm bảo tính toàn vẹn số lần thi của học viên |
| `quiz_attempt_answers`| `uq_attempt_answers_unique`| `UNIQUE(attempt_id, question_id)` | Chống trùng lặp câu trả lời cho cùng 1 câu hỏi trong 1 lần thi |
| `assignment_submissions`| `uq_assignment_submissions` | `UNIQUE(class_assignment_id, student_id)` | Mỗi học viên có 1 bản nộp chính thức cho mỗi bài tập |
| `lesson_progress` | `uq_lesson_progress_unique` | `UNIQUE(class_id, student_id, lesson_id)` | Mỗi bài học chỉ có 1 trạng thái hoàn thành duy nhất cho học viên trong lớp |

