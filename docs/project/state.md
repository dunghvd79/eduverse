# 🧭 Trạng Thái Tiến Độ Dự Án (Project State)

> **Cập nhật lần cuối:** 14/10/2026  
> **Người cập nhật:** dunghvd79, Hoàng Ngọc Sơn & AI Assistant  
> **Giai đoạn hiện tại:** Phase 1 — ✅ Hoàn thành Sprint 6 (Bài tập & Bảng điểm), Tính năng Vòng đời khóa học (Unpublish to Draft), Custom Confirm Modal toàn hệ thống & Bộ điều phối Local Storage Fallback. Đã push remote `origin/feature-dung`.

---

## 0. Chốt Phiên Làm Việc Gần Nhất (14/10/2026) — đọc mục này trước

**Tình trạng Git:** nhánh `feature-dung`, đã commit và push thành công lên GitHub remote (`origin/feature-dung`) với commit `5de9354` & `e4b60a8`.

**Đã xong trong phiên 14/10/2026:**
1. **Nâng cấp Giao diện Trang chủ & Chân trang (`HomePage.jsx`, `Footer.jsx`):**
   - Section 4 thẻ công cụ: Thay thế toàn bộ thuật ngữ IT ngoại lai bằng tiếng Việt sư phạm chuẩn chỉ, căn chỉnh icon vector SVG và tiêu đề `h3` ngang hàng trên 1 dòng.
   - Footer: Đổi màu nền sang dải gradient xanh EduVerse (`#0b4887` - `#0e5aa5` - `#093a6e`), huy hiệu logo nền trắng nổi bật, tăng tương phản các liên kết.
2. **Cải tiến Quản lý Bài kiểm tra Giảng viên (`TeacherQuizzesPage.jsx`, `quizService.js`, `quizValidation.js`):**
   - Backend: Bổ sung liên kết `Chapter` (`title`, `order_index`) vào danh sách Quiz. Hỗ trợ lọc theo `isPublished`.
   - Frontend: Bổ sung bộ lọc Khóa học và Trạng thái xuất bản; hiển thị Breadcrumb Khóa học & Chương mục cho từng bài quiz trong bảng.
3. **Vòng đời Khóa học & Quyền biên tập (Unpublish / Revert to Draft):**
   - Mở quyền xóa mềm cho giảng viên với các khóa học ở trạng thái `draft`, `pending`, `rejected` (chỉ khóa khi `published`).
   - Sửa lỗi ActionMenu 3-dots bị che/khuất ngoài khung thẻ khóa học (`overflow-hidden` -> hiển thị popup hướng lên `bottom-full`).
   - Bổ sung API `PATCH /api/v1/courses/:id/unpublish` cho phép Giảng viên chuyển khóa học `published` hoặc `pending` về `draft` để chỉnh sửa học liệu, video, quiz.
   - Bổ sung nút tác vụ "Tạm dừng để sửa" / "Rút yêu cầu duyệt" trên Card, Table và trang Soạn đề cương (`CourseCurriculumBuilderPage.jsx`).
4. **Hệ thống Custom Confirm Modal cao cấp ([`ConfirmModal.jsx`](file:///e:/2026%20Year/K%C3%AC_1_N%C4%83m_4/Do_An_Lien_Nganh/eduverse/frontend/src/components/common/ConfirmModal.jsx)):**
   - Xóa bỏ triệt để 100% các hộp thoại `window.confirm` xấu xí mặc định của trình duyệt trên toàn bộ ứng dụng.
   - Xây dựng modal Promise-based với giao diện đẳng cấp, backdrop-blur, icon badge phân loại (`warning`, `danger`, `info`), hỗ trợ phím tắt `Enter`/`Esc`.
   - Áp dụng trên toàn hệ thống: Xóa khóa học, xóa bài tập, xóa câu hỏi quiz, nộp bài kiểm tra, nộp lại bài tập, xóa danh mục, xóa học viên khỏi lớp.
5. **Bộ điều phối lưu trữ tệp (Local Storage Fallback - [`storageService.js`](file:///e:/2026%20Year/K%C3%AC_1_N%C4%83m_4/Do_An_Lien_Nganh/eduverse/backend/src/services/storageService.js)):**
   - Khắc phục triệt để lỗi 503 ("Chức năng lưu trữ tệp chưa được cấu hình thiếu AWS_REGION hoặc S3_BUCKET").
   - Kiến trúc Hybrid thông minh: Tự động lưu trữ cục bộ vào `backend/uploads/` khi chạy local, và tự động dùng S3 khi có biến môi trường AWS.
   - Hỗ trợ tải lên PUT stream trực tiếp, kiểm tra metadata, tải về bảo mật bằng chữ ký HMAC và phục vụ ảnh tĩnh qua `/uploads`.
   - Cập nhật `.gitignore` bỏ qua `uploads/` và `backend/uploads/`.
6. **Căn chỉnh Tỷ lệ Hiển thị Desktop Chuẩn W3C (`index.css`):**
   - Bổ sung `@media (min-width: 1024px) { html { font-size: 90%; } }` giúp thu gọn tỷ lệ giao diện trên Laptop/Desktop về mức 90% cân đối, sắc nét, không vỡ layout/dropdown/tooltip/modal.
   - Giữ nguyên 100% trên Mobile/Tablet để bảo toàn kích thước chạm ngón tay và khả năng đọc.
7. **Sửa lỗi Tải Tài liệu Bài học (`materialService.js`, `LessonMaterialsPanel.jsx`):**
   - Khắc phục lỗi `ReferenceError: material is not defined` trong hàm `getDownloadUrl` ở backend khi học sinh bấm tải tệp đính kèm.
   - Nâng cấp cơ chế tải file frontend sang dùng thẻ `<a>` ẩn với thuộc tính `download`, tải file mượt mà trong nền không làm chuyển hướng trang.
8. **Đồng bộ Trạng thái Giao Bài tập theo Lớp (`courseService.js`, `ClassroomPage.jsx`):**
   - Backend: Bổ sung trường `isAssignmentScheduled` vào cấu trúc đề cương khi gọi kèm `classId`.
   - Frontend: Hiển thị đúng thông báo *"Giảng viên chưa lên lịch / chưa giao bài tập này cho lớp học"* và nút disabled *"Chưa giao cho lớp"* khi bài tập chưa được lên lịch hạn nộp, ngăn ngừa click nhầm gây lỗi 404.



**Migration đã chạy trên Neon dev** (ai dùng DB riêng phải tự chạy trong `backend/`): `db:migrate:categories`, `db:migrate:classes`, `db:migrate:quizzes`, `db:migrate:assignments`. Sau khi pull nhớ `npm install` (thư viện mới: `@aws-sdk/*`, `archiver`, `exceljs`).

---

## 1. Tóm Tắt Trạng Thái Hiện Tại
1. Dự án đã **hoàn thành toàn diện 100% Phase 0 — Đặc Tả Kiến Trúc & Thiết Kế Hệ Thống** (Use Cases, ERD 18 bảng, Sequence Diagrams, 8/8 API Docs, C4 Architecture, Master Frontend Blueprint, Design System Tokens, Wireframes, Sitemap).
2. **Tiến độ Phase 1 (Frontend):** Hoàn thành **100% (37/37 Màn hình)** và **6 Master Layouts**, kiểm thử build 2062 modules không lỗi. Đã tích hợp Zustand Auth Store & Axios Interceptor.
3. **Tiến độ Phase 1 (Backend & Database):**
   - Khởi tạo kiến trúc mã nguồn Backend Express.js chuẩn ES Modules (`backend/`).
   - Kết nối thành công tới **Cloud Database Neon.tech (hạ tầng AWS Singapore)** qua giao thức mã hóa SSL.
   - Định nghĩa trọn bộ **18 Sequelize Models** với ràng buộc khóa ngoại, UUID v4, indexes và xóa mềm (Soft Delete).
   - Chạy script đồng bộ và nạp dữ liệu mẫu (`migrateAndSeed.js`): Khởi tạo thành công toàn bộ 18 bảng, nạp 7 tài khoản người dùng 4 role (mật khẩu mặc định `EduVerse@2026`).
   - **Triển khai Hoàn Tất 100% Module Xác Thực (Authentication & Session - Sprint 2, Phần 1):** 10/10 endpoints theo chuẩn `docs/api/api-auth.md`, JWT kép, Rate limiter, kết nối trọn bộ 5/5 màn hình Auth.
   - **Triển khai Hoàn Tất 100% Module Quản Lý Người Dùng & Hồ Sơ Cá Nhân (Users & RBAC - Sprint 2, Phần 2):**
     - Đầy đủ các endpoints theo chuẩn `docs/api/api-users.md` (`GET/PATCH /users/me`, `PATCH /users/me/password`, `GET /users/:id/profile`, `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/status`, `POST /users/:id/reset-password`, `DELETE /users/:id`).
     - Tích hợp trang **Hồ sơ cá nhân đa vai trò** (`/student/profile`, `/teacher/profile`, `/manager/profile`, `/admin/profile`): xem/sửa họ tên, SĐT, bio, chọn nhanh preset avatar, đổi mật khẩu an toàn với tính năng thu hồi phiên thiết bị khác.
     - Tích hợp trang **Admin Console Quản lý người dùng** (`/admin/users`): bảng dữ liệu phân trang, lọc theo 4 vai trò, lọc trạng thái hoạt động/đã khóa, tìm kiếm linh hoạt, tạo tài khoản sinh mật khẩu tạm, khóa/mở khóa tài khoản kèm lý do vi phạm, đặt lại mật khẩu khẩn cấp và xóa mềm.
   - **Rà soát & vá bảo mật Module Auth (05/10/2026):** sửa 7 lỗi, kiểm thử tích hợp 16/16 kịch bản đạt (xem mục 2 và mục 4).
   - **Gia cố Auth bổ sung (06–09/10/2026):** thêm rate limiter cho refresh/reset/change-password, kiểm tra `is_active` ở verify-otp/resend-otp/reset-password, refactor DRY validation & limiter; sửa lỗi xóa cookie làm đăng xuất nhiều tab và limiter đổi mật khẩu bị bỏ sót (kiểm thử 8/8 + hồi quy 16/16 đạt).
   - **Sprint 3 — Danh mục khóa học & Khóa chỉnh sửa (09/10/2026):** thêm module Categories (backend + trang quản lý + lọc Catalog), khóa sửa nội dung khi `pending`/`published`; sửa thêm lỗi trình soạn đề cương ghi đè mất nội dung bài, curriculum công khai lộ `videoUrl`, trang "Khóa học của tôi" hiển thị khóa của giảng viên khác. Test API 26/26 + hồi quy 25/25, 16/16, 8/8.
   - **Sprint 3 — Backend hoàn thành, Frontend đã nối API (09/10/2026):** 21 endpoint Courses/Chapters/Lessons/Lesson Progress theo `api-courses.md` (`courseController.js`, `courseRoutes.js` mount tại `/api/v1`, `lessonService.js`, `optionalAuthenticateToken`). Frontend `services/courseService.js` + 7 trang (catalog, chi tiết khóa học, khóa học của giảng viên, curriculum builder, hàng đợi duyệt, chi tiết duyệt, trình học). Code do **tuanmanh205** viết (commit `57f4686` trên `feature-ngocson`, nằm nhầm trong thư mục con `eduverse-feature-dung/`), được ghép thủ công sang `feature-dung` kèm review và sửa lỗi. Kiểm thử E2E API 25/25 đạt.
   - **Sprint 3 — Upload S3 & Tài liệu bài học (12/10/2026):** `POST /uploads/presigned-url` (avatar, course_thumbnail, lesson_material) + 5 endpoint `/lessons/:lessonId/materials` theo `api-uploads.md`; component `LessonMaterialsPanel` gắn vào trang Soạn đề cương (thêm/đổi tên/xóa) và trang Học (tải về). Ý tưởng & phần lõi S3 lấy từ commit `6b91ead` của **tuanmanh205** (nhánh `tuanmanh205-sprint3-course-api`), viết lại theo đúng spec và kiến trúc hiện tại. Test API 56/56 (S3 giả lập). **Chưa test với bucket AWS thật.**
   - **Sprint 4 — Lớp học & Ghi danh (12/10/2026):** 12/13 endpoint `api-classes.md` (`classService.js`, `classRoutes.js` mount tại `/api/v1/classes`); migration partial unique index cho `classes.class_code` và `enrollments(class_id, student_id)`. Frontend: trang lớp học dùng chung cho Giảng viên (`/teacher/classes`), Quản lý (`/manager/classes`), Admin (`/admin/classes`) — mở lớp, sửa/xóa, đổi mã, thêm/xóa học viên, báo cáo tiến độ; Học viên: `Khóa học của tôi` (nhập mã lớp, tiến độ), trang lớp (đề cương + bạn học), trình học ghi nhận tiến độ theo lớp. Test API 73/73 + E2E giao diện trên Edge 21/21 (desktop + mobile 390px).
   - **Sprint 5 — Bài kiểm tra & Gemini AI (12/10/2026):** đủ 20/20 endpoint `api-quizzes.md` + 2 endpoint đề theo lớp (`GET/PUT /classes/:id/quizzes`). Backend: `quizService.js` (đề, câu hỏi), `quizAttemptService.js` (làm bài, tính giờ server, chấm điểm, xem lại, lịch theo lớp), `aiService.js` (Gemini REST + responseSchema). Migration `npm run db:migrate:quizzes` (đã chạy trên Neon dev). Frontend: GV — danh sách đề, trang soạn đề (câu hỏi + kết quả), sinh câu hỏi AI, xem bài làm, tab Bài kiểm tra trong lớp (đặt lịch mở/đóng), tạo đề từ trang Soạn đề cương; HV — trang Bài kiểm tra, làm bài có đồng hồ + lưu tạm localStorage + tự nộp khi hết giờ, trang kết quả. Test API 92/92 (Gemini giả lập) + E2E Edge 22/22. Đã test Gemini thật.

## 2. Các Việc Đã Hoàn Thành ✅
- [x] Toàn bộ Phase 0 (Use cases, ERD, Schema, Sequences, API Docs, Blueprint, Wireframes).
- [x] Toàn bộ 37 màn hình UI tĩnh Frontend (React 18 + Vite + Tailwind CSS).
- [x] Khởi tạo CSDL Neon.tech PostgreSQL (18 bảng, đồng bộ & seed 7 user).
- [x] Tách cấu trúc 18 Models Sequelize sạch sẽ kèm quan hệ 1:1, 1:N, M:N.
- [x] Backend Module Auth: 10 API chuẩn RESTful Envelope Pattern.
- [x] Frontend Auth Integration: Kết nối thành công 100% trọn bộ 5/5 màn hình Authentication vào API Backend thật.
- [x] **Backend Module Users & RBAC:** Trọn bộ API Hồ sơ cá nhân (`/users/me`), Quản trị người dùng toàn trường (`/users`), Khóa/Mở khóa có lý do, Đặt lại mật khẩu khẩn cấp và Xóa mềm.
- [x] **Frontend Profile Integration:** Kết nối thành công trang Hồ sơ cá nhân cho cả 4 Portal (`Student`, `Teacher`, `Manager`, `Admin`), tự động đồng bộ tức thì tên & avatar lên Topbar và Sidebar.
- [x] **Frontend Admin Console Integration:** Kết nối màn hình `/admin/users` với API thật, hỗ trợ lọc tab vai trò, lọc trạng thái, tìm kiếm, phân trang, và 4 popup tác vụ quản trị.
- [x] Kiểm thử tự động E2E luồng đăng nhập Admin, xem bảng người dùng, tạo tài khoản mới sinh mật khẩu tạm, và cập nhật hồ sơ cá nhân thành công 100%.
- [x] **Vá bảo mật Module Auth (05/10/2026):**
  - Chống dò OTP: thêm `verifyOtpLimiter` (5 lần sai / 15 phút / email); OTP sinh bằng `crypto.randomInt`.
  - Sửa lỗi trùng `token_hash` UNIQUE khiến đăng ký thất bại ngẫu nhiên: OTP băm kèm `user_id`, OTP cũ bị xóa hẳn mỗi lần gửi mã mới (không cần migration DB).
  - Đổi mật khẩu không còn đăng xuất chính phiên hiện tại: thu hồi phiên cũ rồi cấp cặp token mới; gộp `PATCH /auth/change-password` và `PATCH /users/me/password` về một hàm `authService.changePassword`.
  - Thực thi `must_change_password`: backend chặn API (403 `MUST_CHANGE_PASSWORD`), frontend tự chuyển về trang Hồ sơ.
  - Tiêu thụ token nguyên tử (refresh / OTP / reset) chống dùng lại token khi request song song; các luồng nhiều bước chạy trong transaction.
  - Bỏ secret JWT dự phòng ghi cứng; thêm `config/env.js` kiểm tra biến môi trường bắt buộc và dừng server nếu thiếu.
  - Sửa lỗi Logout không hoạt động (frontend gọi không kèm Access Token → 401, refresh token không bị thu hồi): logout giờ xác định phiên qua cookie.
  - Frontend: khôi phục phiên khi tải lại trang (`initializeAuth` gọi ở `App.jsx`), route guard trong `PortalLayout` (bắt đăng nhập, đúng portal theo role), refresh token single-flight + retry cho nhiều tab.
- [x] **Gia cố Auth bổ sung (06–09/10/2026):**
  - Rate limiter chuẩn hóa bằng factory `createLimiter`: login (5 lần sai / 5 phút / email, bỏ qua lần thành công), refresh-token (30/phút/IP), reset-password (5/15 phút/IP), change-password (5/15 phút/user).
  - Kiểm tra tài khoản bị khóa (`is_active`) ở verify-otp, resend-otp, reset-password. Reset mật khẩu thành công đồng thời bật `email_verified` và tắt `must_change_password`.
  - Refresh lỗi chỉ xóa cookie khi token thực sự chết (JWT sai, hết hạn, không tồn tại, tài khoản bị khóa). Token vừa bị request song song xoay vòng (`preserveCookie`) hoặc lỗi hệ thống 5xx thì **giữ cookie** — tránh xóa nhầm cookie mới hợp lệ khiến mọi tab bị đăng xuất.
  - `changePasswordLimiter` gắn cho cả `PATCH /users/me/password` (endpoint frontend đang dùng), đếm gộp với `PATCH /auth/change-password`.

## 3. Việc Đang Làm / Chuẩn Bị Làm Ngay Kế Tiếp ⏳
0. **Backlog bảo mật Auth còn lại (mức thấp–trung bình, chưa sửa):**
   - Đăng ký lại email chưa xác thực vẫn ghi đè mật khẩu → nên chỉ gửi lại OTP, đặt mật khẩu sau khi xác thực.
   - `loginLimiter` giờ chỉ tính theo email → một IP vẫn thử 1 mật khẩu trên nhiều email (password spraying). Nên thêm limiter rộng theo IP.
   - `verify-otp`/`resend-otp` trả 404 làm lộ email tồn tại; login lộ thời gian phản hồi khi email không tồn tại.
   - Regex mật khẩu từ chối các ký tự `~ ' " / \` và dấu cách.
   - Rate limiter đang lưu in-memory (chưa dùng Redis như tài liệu tech-stack).
1. **Hoàn thiện Sprint 3: Module Khóa học & Giáo trình (`api-courses.md`):**
   - [x] Backend 21 endpoint Courses/Chapters/Lessons/Lesson Progress + quy trình gửi duyệt → phê duyệt/từ chối.
   - [x] Nối API cho 7 trang frontend.
   - [ ] **Kiểm thử tay trên trình duyệt** 7 trang (chưa test UI, mới test API).
   - [x] **Khóa chỉnh sửa** khi khóa học `pending`/`published` (đã chốt 09/10/2026): mọi thao tác sửa khóa/chương/bài trả `409`; chỉ sửa ở `draft`/`rejected`. Admin vẫn xóa được khóa để kiểm duyệt. Trình soạn đề cương chuyển sang chế độ chỉ đọc.
   - [x] **Danh mục khóa học (Categories)** (đã chốt 09/10/2026): bảng `categories` (bảng thứ 19) + `courses.category_id`, 5 endpoint `/api/v1/categories`, trang `/manager/categories` nối API thật (thêm/sửa/ẩn-hiện/sắp xếp/xóa), lọc Catalog theo danh mục, giảng viên chọn danh mục khi tạo/sửa khóa. Migration `npm run db:migrate:categories` **đã chạy trên Neon dev**.
   - [ ] **Admin tự gửi duyệt và tự duyệt được khóa học của chính mình** (`approveCourse`/`rejectCourse` không chặn người duyệt là chủ khóa). Nhóm tạm giữ nguyên (09/10/2026); nếu cần kiểm tra chéo thì chặn trường hợp người duyệt = `owner_id`.
   - [ ] Luồng "mở lại để chỉnh sửa" khóa đã `published` (phiên bản mới → duyệt lại) — chưa có, cần chốt nghiệp vụ.
   - [x] Trang **Chi tiết duyệt** (`/manager/approvals/:id/review`) đã xem được nội dung từng bài và tài liệu đính kèm (14/10/2026).
   - [x] Admin có trang **Quản lý khóa học** (`/admin/courses`): xem mọi khóa, lọc theo trạng thái, tìm kiếm, xóa mềm khóa không dùng (15/10/2026).
   - [x] Trang chủ (`HomePage`): khóa học nổi bật nối API thật (14/10/2026); danh mục và thẻ môn học vẫn là nội dung tĩnh.
   - [x] Tài liệu đính kèm bài học (`CourseMaterial`) + Presigned upload S3 (12/10/2026).
   - [ ] **Cấu hình bucket AWS S3 thật** (bucket, CORS cho PUT/GET từ frontend, policy Public Read cho `public/*`, IAM `s3:PutObject/GetObject/DeleteObject/ListBucket`) rồi test upload thật trên trình duyệt.
   - [ ] `GET /lessons/:lessonId/video-stream-url` + mở purpose `lesson_video` (cần cho phép `videoUrl` nhận S3 key).
   - [x] Nối upload avatar (trang Hồ sơ, nút "Tải ảnh từ máy") và ảnh bìa khóa học (form tạo/sửa khóa học của Giảng viên) vào presigned-url (17/10/2026). Đổi hoặc gỡ ảnh thì tệp ảnh cũ được dọn tự động (18/10/2026).
   - [ ] Dọn tệp S3 khi xóa bài học/chương (avatar/thumbnail cũ đã được dọn khi đổi ảnh, 18/10/2026).
2. **Sprint 4: Lớp học & Thành viên** — ✅ xong (12/10/2026). Còn lại:
   - [x] `GET /classes/:id/grades/export-excel` — xong 13/10/2026 cùng Sprint 5 (`?format=xlsx` hoặc `csv`).
   - [x] Dashboard 4 vai trò dùng số liệu thật qua `GET /dashboard/{student,teacher,manager,admin}` (Dũng, 14/10/2026). Đã bỏ link demo `Đề cương` và `Chi tiết duyệt` trên menu (15/10/2026).
   - [x] Trang **Báo cáo** của Quản lý (`/manager/reports`) dùng số liệu thật, tính từ `GET /classes` + `GET /classes/:id/gradebook`: điểm TB, tiến độ, phân bố xếp loại, xếp hạng giảng viên theo điểm TB, xuất CSV. Đã bỏ chỉ số "giữ chân" và "điểm hài lòng" vì hệ thống chưa có dữ liệu (17/10/2026).
   - [x] Quản lý chọn giảng viên khi mở lớp chỉ từ danh sách chủ các khóa đã published (API `/users` chỉ dành cho Admin).
3. **Sprint 5: Bài kiểm tra** — ✅ xong (12/10/2026). Còn lại:
   - [x] Đã test Gemini thật (12/10/2026): sinh đúng 3 loại câu hỏi, đề tiếng Anh B1 ra dạng điền chỗ trống bằng tiếng Anh. **Key nằm trong `backend/.env` từng máy — mỗi thành viên tự tạo key ở aistudio.google.com/apikey, không commit, không dán vào nhóm chat.**
   - **Tình trạng AI (tạm dừng 12/10/2026, quay lại sau):** key Free level (gói Google AI Pro không áp dụng cho API — Paid tier phải bật "Configure billing" trên project Cloud). `.env` máy dunghvd79 đặt `GEMINI_MODEL=gemini-3.8-flash` (~12-25s/lần, hay bị `503 high demand`). Đã có: tự thử lại 2 lần + chuyển model dự phòng `GEMINI_FALLBACK_MODEL` (mặc định `gemini-flash-lite-latest`, ~2-3s). Tài liệu mẫu để demo: đoạn "Tiếng Anh cơ bản bậc B1" (≥100 từ).
   - [ ] (Khi quay lại) Cân nhắc: đổi model chính sang Flash-Lite cho nhanh/ổn định, hoặc bật Paid tier + Budget alert trước buổi bảo vệ; tùy chọn cho giảng viên chọn model trên giao diện (danh sách duyệt sẵn).
   - [ ] Lượt làm bỏ dở quá giờ hiện được chốt khi có người mở lại dữ liệu; chưa có Cron/BullMQ chốt chủ động.
   - [x] AGENTS.md, tech-stack, seq-ai-001, actor-admin đã cập nhật: model cấu hình qua `GEMINI_MODEL` (12/10/2026).
4. **Sprint 5: Bài tập** — ✅ xong (13/10/2026): đủ 18/18 endpoint `api-assignments.md`. Backend `assignmentService.js` (khung bài tập, giao bài theo lớp, nộp/nộp lại qua S3, chấm đơn lẻ/hàng loạt, yêu cầu nộp lại giữ điểm cũ theo E3), `assignmentZipService.js` (ZIP cả lớp, ≤50MB trả ngay, lớn hơn chạy nền). Migration `npm run db:migrate:assignments` (đã chạy trên Neon dev). Frontend: GV — trang Bài tập, tạo/sửa đề từ Soạn đề cương, tab Bài tập trong lớp (giao bài, lịch nộp, thống kê), trang Chấm bài (lọc, chấm nhanh trên bảng, modal chấm/yêu cầu nộp lại, tải ZIP); HV — trang Bài tập, trang nộp bài (đề, đếm ngược, nộp/nộp lại, điểm & nhận xét), tab Bài tập trong lớp, thẻ bài tập trong trình học. Test API 68/68 + E2E Edge 24/24 (S3 giả lập, nộp file thật qua trình duyệt). **Chưa test với bucket S3 thật.**
   - [x] Thông báo trong ứng dụng (in-app): bảng `notifications`, 4 API (`docs/api/api-notifications.md`), tự sinh khi giao bài, chấm điểm, yêu cầu nộp lại, gửi/duyệt/từ chối khóa học; chuông thông báo trên thanh trên cùng của cả 4 portal, cập nhật mỗi 30 giây (18/10/2026). Chưa làm: email, Socket.IO push, thông báo đề kiểm tra mới. Kiểm thử tay chuông thông báo và thông báo tự động (mục D, E của `docs/testing/manual-test-notifications-uploads.md`) đã đạt (xác nhận 21/10/2026).
   - [ ] Job nén ZIP lưu trong bộ nhớ (chưa có Redis/BullMQ).
5. **Sprint 5: Bảng điểm** — ✅ xong (13/10/2026): `gradebookService.js` tính điểm theo `grading-policy.md` (E1-E3), xuất `.xlsx` (4 sheet: Bảng điểm, Thống kê lớp, Tiến độ học, Quy tắc tính điểm; hai sheet giữa thêm 24/10/2026 — Phase 2 "Excel nâng cao") / `.csv` (`exceljs`); thêm `GET /classes/:id/gradebook` và `GET /classes/:id/my-grades`. Frontend: tab "Bảng điểm" trong trang lớp (GV/Quản lý/Admin, lọc xếp loại, xuất Excel/CSV), trang "Điểm số" của HV. Đã bỏ link demo "Sổ điểm" trên menu GV (link cũ `/teacher/classes/:id/gradebook` mở thẳng tab Bảng điểm). Test 25/25 (số liệu tính tay) + E2E Edge 11/11.
   - ✅ **Công thức điểm tổng kết đã chốt (12/10/2026):** Quiz 40% · Bài tập 50% · Tiến độ 10%; Quiz lấy điểm cao nhất; chưa làm/chưa nộp = 0; Giỏi ≥ 8 · Khá ≥ 6.5 · Trung bình ≥ 5 · Chưa đạt < 5. Chi tiết: `docs/requirements/grading-policy.md` (BR-034 → BR-037). Trường hợp đặc biệt cũng đã chốt: lớp không có Quiz/Bài tập → chia lại tỷ trọng; bài đã nộp chưa chấm → tạm 0 + ghi "Chưa chấm"; nộp lại → điểm lần chấm gần nhất (BR-038, BR-039).
6. **Phase 3: Triển khai & Demo** — Docker Compose (22/10/2026), hướng dẫn ở `docs/architecture/deployment.md`:
   - [x] `docker-compose.yml` (frontend Nginx + backend + PostgreSQL 16), `backend/Dockerfile`, `frontend/Dockerfile`, `.env.example`; backend tự tạo bảng + nạp dữ liệu mẫu khi CSDL trống (`backend/src/scripts/dockerStart.js`).
   - [x] **Chạy thử trên máy có Docker Desktop** (Windows): build và khởi động không lỗi, 22/10/2026. Image dùng bản Debian (`node:22-slim`, `nginx:1.27`) vì `node:20-alpine` báo `exec format error` trên máy test.
   - [x] **Kiểm thử tự động** (24/10/2026), hướng dẫn ở `docs/testing/automated-tests.md`: 89 unit test (công thức điểm tổng kết, thống kê lớp cho file Excel, quy tắc quyền của Thảo luận; `npm test` trong `backend/`, không cần CSDL) và 51 kiểm tra API chạy vào hệ thống đang bật (`npm run test:e2e`; chỉ đọc, trừ nhóm Thảo luận có ghi bài thử rồi tự xóa). Để test được, hàm tính điểm đã tách khỏi `gradebookService.js` sang `backend/src/utils/grading.js` (kết quả tính điểm không đổi: so sánh 500.000 mẫu ngẫu nhiên giữa mã cũ và mã mới, 0 chênh lệch).
   - [ ] Redis + BullMQ (Phase 2), HTTPS/cloud, CI/CD (chạy test tự động trên GitHub Actions), sao lưu CSDL.
7. **Phase 2: Tính năng bổ sung** (`docs/project/project-plan.md`), làm lần lượt theo thứ tự:
   - [x] **Xuất Excel nâng cao** (24/10/2026): file `.xlsx` bảng điểm thêm sheet "Thống kê lớp" (tổng quan, phân bố xếp loại, từng bài kiểm tra, từng bài tập, phân bố tiến độ) và "Tiến độ học" (mỗi học viên một dòng); số liệu tính ở `backend/src/utils/gradebookStats.js` (hàm thuần, có unit test). Không đổi API, không cần migration.
   - [x] **Thảo luận / Hỏi đáp trong bài học** (26/10/2026): đặc tả ở `docs/api/api-discussions.md` (BR-070 → BR-078, bảng `lesson_discussions` mục 19 của `schema.md`). Mỗi cuộc thảo luận thuộc một lớp + một bài học, một cấp trả lời, đánh dấu "đã giải đáp", xóa mềm, lớp tạm dừng/kết thúc chỉ đọc, thông báo cho giảng viên (có câu hỏi) và người hỏi (có trả lời). Học viên: khu Thảo luận cuối bài học; giảng viên/quản lý/admin: tab "Thảo luận" của lớp. **Cần chạy migration** `npm run db:migrate:discussions` (Docker đã có dữ liệu thì chạy `docker compose exec backend node src/scripts/migrations/20261025-lesson-discussions.js`; CSDL Neon dùng chung thì báo lead Dũng).
   - [ ] Email tự động qua BullMQ + Redis (hiện OTP và link đặt lại mật khẩu chỉ in ra log backend).

## 4. Ghi Chú Kỹ Thuật Quan Trọng
- **Migration CSDL:** không chạy `sequelize.sync({ alter: true })` trên DB chung để thêm bảng/cột mới; viết script idempotent trong `backend/src/scripts/migrations/` (mẫu: `20261009-add-categories.js`) và thêm lệnh vào `package.json`. Mỗi thành viên cần chạy `npm run db:migrate:categories` nếu dùng DB riêng.
- **Khóa chỉnh sửa khóa học:** dùng `assertCourseEditable(course)` (export từ `courseService.js`) cho mọi API thay đổi nội dung khóa/chương/bài mới thêm sau này.
- **Đề cương công khai không chứa nội dung bài:** trình soạn đề cương phải tải nội dung qua `GET /lessons/:id` trước khi cho sửa, nếu không sẽ ghi đè mất `contentText`.
- **Đồng bộ route ↔ spec (09/10/2026):** đã xóa 2 alias thừa `GET /users/me/profile` và `PUT /users/me/profile` (trùng `GET`/`PATCH /users/me`, không có trong spec, frontend không dùng); sửa `api-uploads.md` cập nhật avatar qua `PATCH /users/me`. `POST /users/bulk-import` có trong spec nhưng **chưa triển khai** (cần Redis/BullMQ + thư viện đọc Excel).
- **Xử lý lỗi chung:** `:id` sai định dạng UUID trả `400` "Mã định danh (ID) không hợp lệ" (bắt lỗi Postgres `22P02` trong `errorMiddleware.js`) thay vì `500`; route không tồn tại trả `404` dạng JSON (handler cuối `app.js`).
- **Rà soát backend (09/10/2026) — đã sửa 7 mục:** API danh sách bài công khai lộ `contentText`/`videoUrl`; chương/bài thuộc khóa đã xóa mềm gây `500` (nay `404`); thống kê hồ sơ giảng viên luôn bằng 0 (so sánh status viết hoa); sắp xếp chấp nhận ID trùng; thông báo xóa danh mục chưa rõ; CORS bị chặn trả `500` (nay `403`); Admin được gửi duyệt khóa học. Test 19/19 + hồi quy 108/108.
- **Validation Middleware dùng chung (`middlewares/validateMiddleware.js`):** mọi route phải validate đủ 3 nguồn đầu vào — `validateBody(schema)` cho `req.body`, `validateQuery(schema)` cho `req.query`, `validateIdParam(...names)` cho `:id`/`:courseId`… (UUID) hoặc `validateIdOrSlugParam()` cho route nhận cả slug. Thứ tự: xác thực → phân quyền → params → query/body → controller. Các file `validations/*.js` chỉ chứa Joi schema, không chứa middleware. Express 5: `req.query` là getter chỉ đọc nên `validateQuery` ghi đè bằng `Object.defineProperty`.
- **Quyền xem nội dung khóa học:** dùng `assertCourseVisible` (export từ `courseService.js`) cho mọi API đọc chương/bài. Nội dung đầy đủ bài học (`GET /lessons/:id`) chỉ cho chủ khóa, Quản lý, Admin, giảng viên dạy lớp của khóa, hoặc học viên đã ghi danh `active`.
- **Lớp học:** quyền theo lớp kiểm tra trong `classService.js` (`canManageClass` = GV phụ trách/Quản lý/Admin; thêm-xóa học viên & đổi mã chỉ GV phụ trách/Admin). Mã lớp chỉ trả cho người quản lý lớp. Học viên bị xóa khỏi lớp = `status: dropped` + xóa mềm, ghi danh lại được nhờ partial unique index — mỗi máy dùng DB riêng cần chạy `npm run db:migrate:classes`.
- **Bài kiểm tra:** đề thi là nội dung khóa học → mọi API sửa đề/câu hỏi phải qua `assertCanEditQuiz` (chủ khóa/Admin + `assertCourseEditable`). Không trả `isCorrect`/`explanation` cho học viên khi đang làm bài (`mapQuestion(q, { withAnswers: false })`). Thời gian làm bài tính trên server (`deadlineOf` + ân hạn 30s). Lượt làm thuộc `class_quizzes`, tự tạo khi học viên bắt đầu lần đầu. Mỗi máy dùng DB riêng cần chạy `npm run db:migrate:quizzes`.
- **Bài tập:** giao bài = tạo `class_assignments` qua `PUT .../schedule`; chấm/giao bài chỉ GV phụ trách lớp hoặc Admin (`assertClassGrader`). Yêu cầu nộp lại **giữ điểm cũ** (cột `resubmission_reason`), bài cần chấm xác định bằng `needsGrading` (chưa có điểm hoặc nộp sau lần chấm gần nhất). Mỗi máy dùng DB riêng cần chạy `npm run db:migrate:assignments`.
- **Upload S3 dùng chung:** backend `uploadService.createSignedPutUrl` / `isMimeAllowed`, frontend `uploadService.putToS3` / `contentTypeOf`.
- **Frontend gọi POST không body:** gửi `{}` chứ không gửi `null` — `express.json()` strict từ chối `null` (nay trả `400`).
- **Component `Button` (PortalUI):** không truyền `className` vì nó ghi đè class `ui-btn`; bọc bằng `div` nếu cần căn lề.
- **Tailwind:** dự án tự định nghĩa `screens` chỉ có `md`/`lg`/`xl` — **không có `sm:`**, viết `sm:` sẽ không có tác dụng.
- **AWS S3 (`config/s3.js`):** cấu hình tùy chọn — thiếu `AWS_REGION`/`S3_BUCKET` thì server vẫn chạy, API upload trả `503`. Xem `backend/.env.example`. Quyền sửa/xem tài liệu dùng lại `assertCanManageLesson` / `assertCanViewLessonContent` (export từ `lessonService.js`). Frontend upload qua `services/uploadService.js` (MIME chuẩn theo đuôi tệp, PUT bằng `fetch` không kèm Authorization).
- **Biến môi trường:** mọi module cần `process.env` phải import `backend/src/config/env.js` (đã được import trong `server.js`, `config/database.js`, `utils/jwt.js`). Không dùng giá trị secret dự phòng.
- **Route mới cần mở khi `must_change_password = true`:** thêm vào `MUST_CHANGE_PASSWORD_ALLOWLIST` trong `middlewares/authMiddleware.js`.
- **Route guard frontend:** toàn bộ 4 portal đi qua `PortalLayout` (`components/portal/PortalUI.jsx`) — kiểm tra đăng nhập, role ↔ portal (`training_manager` → `/manager`), và bắt đổi mật khẩu tạm.
- **Refresh token chỉ dùng 1 lần:** frontend phải gọi qua `refreshAccessToken()` trong `stores/useAuthStore.js`, không tự gọi `axios.post('/auth/refresh-token')`.
- **Xóa cookie refresh:** controller `refreshToken` chỉ gọi `clearRefreshCookie` khi lỗi `401` và không có cờ `preserveCookie`. Lỗi mới trong `refreshSession` mà không muốn xóa cookie thì đặt `err.preserveCookie = true`.
- **Quy trình Git:** xem `docs/project/git-workflow.md` (nhánh, commit, PR, migration, không commit secret).
- **Nhánh Git:** `feature-dung` đã được merge vào `main` qua PR #7 và PR #8; từ `2ce7fa9` đến `5a9ae2b` (10 commit, 13/10/2026) chưa vào `main`, chờ PR mới. Các commit Sprint 3 từ `2ce7fa9` trở đi trên `feature-dung` chưa vào `main`, cần PR mới. Nhánh `tuanmanh205-sprint3-course-api` viết song song Sprint 3 (bảng `course_categories`, còn lỗi lộ nội dung bài) — **không merge**, phần S3 đã được chuyển sang `feature-dung`. Các nhánh `feature-ngocson`, `feature-anh`, `feature-manh` nên cập nhật từ `main` thường xuyên để tránh conflict lớn.
- Toàn bộ diagram chỉ dùng các loại Mermaid phổ biến (`flowchart`, `sequenceDiagram`, `erDiagram`). Tránh dùng `gitgraph`.
- Tất cả tài liệu viết bằng Markdown trong `docs/` theo chuẩn Docs-as-Code.
- Đảm bảo 100% Traceability (tính truy vết) đồng bộ giữa Use Case, Sequence Diagram, Database Schema, API Spec, Design System và Frontend Blueprint.
