# Quy tắc Nghiệp vụ — EduVerse

> Tài liệu này ghi lại **tất cả quy tắc nghiệp vụ** đã được thống nhất.  
> Mọi thành viên phải tuân theo khi thiết kế database, API và UI.

---

## 1. Quản lý Tài khoản & Phân quyền

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-001 | Mỗi user có **đúng 1 role** | Không hỗ trợ multi-role. Role lưu trực tiếp trong bảng `users` (không cần bảng trung gian) |
| BR-002 | **4 vai trò** trong hệ thống | `student`, `teacher`, `training_manager`, `admin` |
| BR-003 | Chỉ **Student** được tự đăng ký | Đăng ký qua form, mặc định role = `student` |
| BR-004 | Tài khoản Teacher do **Admin tạo** | Admin vào trang quản lý → tạo tài khoản → gán role `teacher` |
| BR-005 | Tài khoản Manager & Admin do **Admin tạo** | Tương tự Teacher |
| BR-006 | Email phải **xác thực** trước khi sử dụng | Gửi email chứa link/token xác thực sau khi đăng ký |
| BR-007 | Admin có thể **khóa/mở khóa** tài khoản | Tài khoản bị khóa không thể đăng nhập |
| BR-008 | Admin có thể **nhập tài khoản hàng loạt** từ file | File `.csv` hoặc `.xlsx`, tối đa 5MB và 300 dòng mỗi lần. Tạo được `student`, `teacher`, `training_manager`, **không tạo `admin`**. Dòng sai hoặc trùng email bị bỏ qua và báo theo số dòng, các dòng đúng vẫn được tạo |
| BR-009 | Tài khoản do Admin cấp có **mật khẩu tạm ngẫu nhiên** | Áp dụng khi tạo lẻ, đặt lại khẩn cấp và nhập hàng loạt: bắt buộc đổi mật khẩu ở lần đăng nhập đầu. Nhập hàng loạt gửi mật khẩu tạm qua email (hàng đợi), API không trả mật khẩu |

---

## 2. Quản lý Khóa học

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-010 | Khóa học có **4 trạng thái** đang dùng | `draft` (nháp), `pending` (chờ duyệt), `published` (đã xuất bản), `rejected` (bị từ chối kèm lý do, sửa rồi gửi duyệt lại). Từ `pending`/`published`/`rejected` có thể đưa về `draft` bằng `PATCH /courses/:id/unpublish`. `archived` được dành sẵn trong CSDL nhưng chưa triển khai |
| BR-011 | Khóa học cần **phê duyệt** trước khi public | Teacher xuất bản → Training Manager phê duyệt → mới hiển thị cho học viên |
| BR-012 | Khóa học hiện tại **miễn phí** | Nhưng DB có trường `price: decimal(10,2) DEFAULT 0` để mở rộng sau |
| BR-013 | Cấu trúc nội dung **3 cấp** | Khóa học → Chương (Chapter) → Bài học (Lesson) |
| BR-014 | Mỗi khóa học có **1 chủ sở hữu** (owner) | Là giảng viên tạo ra khóa học, có toàn quyền chỉnh sửa |

---

## 3. Quản lý Lớp học

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-020 | Lớp học là **1 lần tổ chức** của khóa học | 1 khóa học có thể tạo nhiều lớp, mỗi lớp có thời gian và danh sách học viên riêng |
| BR-021 | Mỗi lớp có **mã tham gia** (class code) | Học viên nhập mã để ghi danh vào lớp |
| BR-022 | Giảng viên có thể **mời trực tiếp** học viên | Thêm học viên vào lớp bằng email; học viên được báo ngay trong chuông và qua email, lỗi gửi thông báo hoặc email không làm hỏng việc thêm |

---

## 4. Bài kiểm tra & Bài tập

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-030 | Hỗ trợ **3 loại câu hỏi** | Một đáp án (`single_choice`), Nhiều đáp án (`multiple_choice` — phải chọn đúng và đủ), Đúng/Sai (`true_false`) |
| BR-031 | Bài kiểm tra **chấm tự động** | Hệ thống so sánh đáp án và tính điểm ngay |
| BR-032 | Bài tập nộp bằng **upload file** | Học viên upload file, giảng viên tải về chấm thủ công |
| BR-033 | Giảng viên nhập **điểm + nhận xét** cho bài tập | Chấm thủ công, có thể gửi phản hồi cho học viên |
| BR-034 | **Điểm tổng kết** = Quiz 40% + Bài tập 50% + Tiến độ 10% | Thang 10, làm tròn 2 chữ số. Chi tiết: [`grading-policy.md`](grading-policy.md) — chốt 12/10/2026 |
| BR-035 | Bài kiểm tra làm nhiều lần lấy **điểm cao nhất** | Lượt hết giờ (`timed_out`) tính 0 điểm |
| BR-036 | Bài kiểm tra chưa làm / bài tập chưa nộp tính **0 điểm** | Vẫn nằm trong mẫu số khi tính điểm trung bình thành phần |
| BR-037 | **Xếp loại**: Giỏi ≥ 8 · Khá ≥ 6.5 · Trung bình ≥ 5 · Chưa đạt < 5 | Dựa trên điểm tổng kết |
| BR-038 | Lớp **không có Quiz hoặc không có Bài tập** | Bỏ thành phần đó, chia lại tỷ trọng theo tỷ lệ các phần còn lại |
| BR-039 | Bài tập **đã nộp chưa chấm** tạm tính 0; **bị yêu cầu nộp lại** dùng điểm lần chấm gần nhất | File Excel ghi chú "Chưa chấm" để GV chấm trước khi chốt điểm |

---

## 5. Tiến độ Học tập

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-040 | Tiến độ tính theo **% bài học hoàn thành** | Số bài học đã đánh dấu hoàn thành / Tổng số bài học trong khóa |
| BR-041 | Học viên **tự đánh dấu** hoàn thành bài học | Nhấn nút "Hoàn thành" sau khi đọc/xem xong |

---

## 5b. Thảo luận / Hỏi đáp trong bài học

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-070 | Thảo luận thuộc về **một lớp + một bài học** | Hai lớp học cùng khóa học có khu thảo luận riêng. Chỉ học viên đang học (`active`) trong lớp, giảng viên phụ trách lớp, Quản lý đào tạo và Admin được xem |
| BR-071 | **Học viên và giảng viên phụ trách** được đăng câu hỏi và trả lời | Quản lý đào tạo và Admin chỉ xem và kiểm duyệt (xóa), không đăng bài |
| BR-072 | Chỉ **một cấp trả lời** | Câu trả lời gắn vào câu hỏi gốc, không trả lời lồng nhau |
| BR-073 | Nội dung là **văn bản thuần** 1–2000 ký tự | Không hỗ trợ HTML, Markdown, đính kèm tệp/ảnh ở Phase 2 |
| BR-074 | **Tác giả** được sửa bài của mình | Bài đã sửa hiện "(đã chỉnh sửa)". Không ai sửa hộ bài của người khác |
| BR-075 | **Tác giả, giảng viên phụ trách, Quản lý, Admin** được xóa | Xóa mềm; xóa câu hỏi gốc thì xóa luôn các câu trả lời |
| BR-076 | **Người đặt câu hỏi, giảng viên phụ trách, Quản lý, Admin** được đánh dấu "đã giải đáp" | Chỉ áp dụng cho câu hỏi gốc, bỏ đánh dấu được |
| BR-077 | Lớp **tạm dừng hoặc đã kết thúc** thì thảo luận **chỉ đọc** | Học viên không đăng, sửa, trả lời; giảng viên, Quản lý, Admin vẫn xóa được để kiểm duyệt |
| BR-078 | Học viên đặt câu hỏi → báo **giảng viên phụ trách**; có người trả lời → báo **người đặt câu hỏi** | Thông báo trong ứng dụng; không báo cho cả lớp |

---

## 6. Tính năng AI

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-050 | AI chỉ hỗ trợ **sinh câu hỏi trắc nghiệm** | Từ nội dung bài học, AI sinh câu hỏi + đáp án |
| BR-051 | Chỉ **giảng viên** được dùng AI | Học viên không có quyền sử dụng tính năng AI |
| BR-052 | Giảng viên phải **review và chỉnh sửa** trước khi dùng | AI chỉ gợi ý, giảng viên quyết định có dùng hay không |

---

## 7. Hệ thống

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-060 | Giao diện **tiếng Việt hoàn toàn** | Không hỗ trợ đa ngôn ngữ |
| BR-061 | Chỉ hỗ trợ **Web** (responsive) | Không có mobile app, nhưng giao diện responsive cho mobile browser |
| BR-062 | Không có **real-time** | Thông báo và thảo luận cập nhật khi refresh trang |

---

## 7b. Nhật ký hệ thống & Cấu hình nền tảng

| # | Quy tắc | Chi tiết |
|---|---|---|
| BR-080 | Chỉ **Admin** xem và xuất nhật ký, xem cấu hình nền tảng | Các vai trò khác nhận `403`; người chưa đăng nhập nhận `401` |
| BR-081 | Nhật ký **chỉ thêm** | Không có API hay giao diện sửa hoặc xóa dòng nhật ký. Người thực hiện được chép email và vai trò tại thời điểm thao tác nên vẫn đọc được khi tài khoản đổi vai trò hoặc bị xóa |
| BR-082 | Ghi các thao tác **nhạy cảm** | Đăng ký, kích hoạt email, đăng nhập (kể cả thất bại), đổi hoặc đặt lại mật khẩu, tạo / nhập hàng loạt / sửa / khóa / mở khóa / đặt lại mật khẩu / xóa tài khoản, gửi duyệt / duyệt / từ chối / đưa về nháp / xóa khóa học, xuất nhật ký. Chỉ ghi khi thao tác đã thành công, riêng đăng nhập bị từ chối ghi với kết quả `failed` |
| BR-083 | **Không lưu** mật khẩu, token, OTP, mã băm | Chi tiết (`metadata`) bị loại các khóa nhạy cảm và rút gọn độ dài; xuất CSV chặn chèn công thức Excel và chỉ lấy tối đa 5.000 dòng mới nhất |
| BR-084 | Lỗi khi ghi nhật ký **không làm hỏng** thao tác chính | Chỉ cảnh báo trong log backend; vì vậy phải chạy migration `db:migrate:audit-logs` sau khi cập nhật code |
| BR-085 | Cấu hình nền tảng **chỉ xem** | Giá trị nằm trong biến môi trường, đổi trên máy chủ rồi khởi động lại backend; giao diện không có nút lưu và không bao giờ hiển thị khóa bí mật, mật khẩu hay chuỗi kết nối |

---

_Cập nhật lần cuối: 02/11/2026_
