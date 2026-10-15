# 🧪 Kế Hoạch Kiểm Thử Thủ Công — Dashboard dữ liệu thật & Chỉnh giao diện

> **Ngày lập:** 13/10/2026
> **Phạm vi:** commit `d46c648` (chữ, độ tương phản, Việt hóa nhãn) và `c4ab264` (4 dashboard dùng dữ liệu thật — đặc tả [`api-dashboard.md`](../api/api-dashboard.md)).
> **Cách dùng:** Mở bằng Markdown Preview (`Ctrl + Shift + V`), tick `[x]` các bước đạt. Bước lỗi ghi vào ô **Ghi chú** cuối mỗi phần.

---

## 0. Chuẩn Bị

- [ ] Backend chạy ở `:5000` (`cd backend && npm run dev`), frontend ở `http://localhost:5173`
- [ ] Đã `git pull` nhánh `feature-dung` (có 2 commit trên)
- [ ] Mở DevTools (`F12`) → tab **Network** để xem request `dashboard/...` và mã lỗi

**Tài khoản seed** — mật khẩu chung `EduVerse@2026` (trang đăng nhập có nút chọn nhanh):

| Vai trò | Email |
|---|---|
| Học viên | `student.dung@eduverse.com` |
| Giảng viên | `teacher.an@eduverse.com` (chủ khóa mẫu, phụ trách lớp "Nhóm 01") |
| Giảng viên | `teacher.binh@eduverse.com` (chưa có khóa/lớp — kiểm tra trạng thái trống) |
| Quản lý đào tạo | `manager@eduverse.com` |
| Admin | `admin@eduverse.com` |

**Số liệu lúc lập tài liệu** (để đối chiếu nhanh, có thể đã đổi nếu nhóm thêm dữ liệu):

| Dashboard | Số liệu |
|---|---|
| Học viên Dũng | 1 lớp · Điểm TB 0 · Sắp đến hạn 0 · Đã đạt 0 · Việc cần làm: 1 bài kiểm tra |
| GV An | Câu tóm tắt: không có bài chờ chấm, 3 học viên trong 1 lớp · 5 khóa (2 xuất bản, 1 chờ duyệt, 2 nháp) |
| Quản lý | 1 chờ duyệt · 2 đã xuất bản · 1 lớp hoạt động · 3 học viên |
| Admin | 10 người dùng · 0 bị khóa · 0 chưa xác thực |

> ⚠️ **DB dev là Neon dùng chung.** Các bước ở phần C–E có tạo/sửa dữ liệu (nộp bài, chấm, khóa tài khoản, tạm dừng lớp). Làm xong nhớ hoàn tác theo **mục G**.

---

## A. Giao Diện Chung (commit `style(ui)`)

- [ ] **A1.** Mở bất kỳ trang portal nào → tiêu đề trang **đậm** rõ, tiêu đề các card ("Tiến độ học tập", "Việc cần làm"…) đậm hơn nội dung bên trong
- [ ] **A2.** Không còn dòng chữ nhỏ tiếng Anh phía trên tiêu đề ("STUDENT PORTAL", "QUIZZES", "COURSE MANAGEMENT"…) ở mọi trang
- [ ] **A3.** GV › **Khóa học**: tab và badge hiện **Đã xuất bản / Nháp / Chờ duyệt / Từ chối** (không còn Published/Draft)
- [ ] **A4.** Menu GV hiện **Tạo đề bằng AI**; menu Admin hiện **Nhật ký hệ thống**
- [ ] **A5.** Chữ phụ (thời gian, tiêu đề cột bảng, mô tả) đọc rõ, không còn xám nhạt; không còn chữ nhỏ hơn 12px ở bảng/badge
- [ ] **A6.** Trang chủ `/` và `/courses`: nút nổi **Từ điển** bên phải hiển thị gọn (icon + chữ không vỡ dòng), huy hiệu tròn "1M+", "3000+ đề thi" không tràn chữ
- [ ] **A7.** Thu cửa sổ về rộng ~390px (DevTools → Toggle device): dashboard không cuộn ngang, thẻ thống kê xếp 2 cột
- [ ] **A8.** Dashboard GV ở 3 cỡ màn hình (1920px, 1280px, 390px): tên lớp không bị cắt cụt ở 1280px, không cuộn ngang ở 390px

**Ghi chú:**

---

## B. Dashboard Học Viên — `student.dung@eduverse.com`, `/student/dashboard`

- [ ] **B1.** Trang tải xong không còn số giả (không còn "12.5h", "IELTS Intensive Reading", "+18%")
- [ ] **B2.** **Điểm trung bình** = điểm tổng kết ở trang **Điểm số** (`/student/grades`). Nếu học nhiều lớp: bằng trung bình cộng các lớp đang hoạt động
- [ ] **B3.** Khối **Tiến độ học tập**: mỗi lớp một dòng, % khớp với trang Điểm số / trang lớp học
- [ ] **B4.** Khối **Việc cần làm**: thấy bài kiểm tra "Kiểm tra kiến thức Node.js & Express.js" ghi *Không giới hạn thời gian* → bấm vào → mở đúng trang làm bài của lớp
- [ ] **B5.** Nút **Tiếp tục học** → mở trang chi tiết lớp. Học xong 1 bài (đánh dấu hoàn thành) rồi quay lại → % tiến độ tăng
- [ ] **B6.** Thẻ **Lớp học của tôi** → bấm mở đúng lớp; thẻ không có ảnh bìa hiện icon sách (không hiện chữ cắt cụt kiểu "LẬ")
- [ ] **B7.** Làm bài kiểm tra trên và **đạt** điểm qua → quay lại dashboard: **Bài kiểm tra đã đạt** +1, bài đó biến khỏi Việc cần làm
- [ ] **B8.** *(Nếu có tài khoản học viên chưa ghi danh lớp nào)* → dashboard hiện "Bạn chưa tham gia lớp học nào" + nút **Tham gia lớp bằng mã**, nút Tiếp tục học bị mờ, không bấm được

**Ghi chú:**

---

## C. Bài Tập: Luồng Học Viên ↔ Giảng Viên

> Cần 1 bài tập đã giao cho lớp "Nhóm 01". Nếu chưa có: đăng nhập `teacher.an` → tạo bài tập trong **Đề cương** của khóa mẫu (gắn vào một bài học) → **Lớp học › Nhóm 01 › tab Bài tập** → **Giao bài**, đặt **hạn nộp sau 3 ngày**.

- [ ] **C1.** Học viên Dũng: dashboard → bài tập xuất hiện trong **Việc cần làm** (ghi "Bài tập · Hạn …"), **Sắp đến hạn** tăng 1
- [ ] **C2.** Bấm bài tập → mở đúng trang chi tiết bài tập → nộp file → quay lại dashboard: bài tập biến khỏi Việc cần làm, Sắp đến hạn giảm 1
- [ ] **C3.** GV An: câu tóm tắt đầu trang đổi thành "Bạn có **1 bài nộp** đang chờ chấm ở **1 lớp**"; khối **Cần xử lý** có dòng "1 bài nộp: <tên bài tập>" → bấm **Chấm bài** → mở đúng trang chấm bài của lớp
- [ ] **C4.** Chấm điểm bài đó → quay lại dashboard GV: câu tóm tắt về "Không có bài nộp nào đang chờ chấm", Cần xử lý hiện "Đã xử lý xong"
- [ ] **C5.** Trên trang chấm, chọn **Yêu cầu nộp lại** → học viên Dũng: bài tập quay lại Việc cần làm với badge cam **Nộp lại**
- [ ] **C6.** Học viên nộp lại → GV: lại có 1 bài chờ chấm (nộp lại sau khi chấm cũng tính là cần chấm)
- [ ] **C7.** Khối **Lớp đang dạy** của GV: số học viên = 3; Tiến độ trung bình, Điểm trung bình và thanh phân bố xếp loại (Giỏi/Khá/Trung bình/Chưa đạt) khớp trang **Sổ điểm** của lớp; dòng phụ hiện trạng thái, mã lớp, số ngày còn lại; bấm vào dòng → mở trang lớp

**Ghi chú:**

---

## D. Dashboard Giảng Viên & Quản Lý — duyệt khóa

- [ ] **D1.** GV An: khối **Khóa học của tôi** — tổng số và 4 trạng thái (thanh màu + bảng số) khớp các tab ở trang Khóa học
- [ ] **D2.** GV Bình: câu tóm tắt "…Bạn chưa phụ trách lớp nào đang hoạt động", khối lớp hiện "Bạn chưa phụ trách lớp học nào" + nút **Mở lớp học**, Khóa học của tôi = 0 (không lỗi)
- [ ] **D3.** Quản lý: khối **Khóa học cần duyệt** khớp trang **Duyệt khóa học**; mỗi dòng có tên GV, thời gian gửi → bấm → mở trang review khóa đó
- [ ] **D4.** Quản lý **từ chối** một khóa (nhập lý do) → GV chủ khóa: câu tóm tắt thêm "1 khóa học bị từ chối cần sửa lại"; Cần xử lý có dòng "Bị từ chối: …" kèm lý do → bấm **Sửa lại** → mở đề cương khóa
- [ ] **D5.** Quản lý **duyệt** một khóa → dashboard quản lý: Khóa chờ duyệt −1, Khóa đã xuất bản +1, khóa xuất hiện đầu khối **Khóa học vừa được duyệt**
- [ ] **D6.** Quản lý › Lớp học → mở lớp "Nhóm 01" → sửa lớp, đổi trạng thái sang **Tạm dừng** → dashboard quản lý: Lớp theo trạng thái chuyển 1 sang *Tạm dừng*, Lớp đang hoạt động −1. Học viên Dũng: lớp biến khỏi dashboard (lớp tạm dừng không tính) nhưng vẫn thấy ở trang Điểm số. **Bật lại lớp ngay sau khi kiểm tra.**

**Ghi chú:**

---

## E. Dashboard Admin — `admin@eduverse.com`

- [ ] **E1.** **Tổng người dùng** và **Phân bổ người dùng** khớp số lượng ở trang **Người dùng** (lọc theo từng vai trò); tổng % = 100
- [ ] **E2.** Khóa 1 tài khoản học viên ở trang Người dùng → dashboard: **Tài khoản bị khóa** +1, tài khoản đó (nếu nằm trong 6 người mới nhất) hiện badge đỏ **Bị khóa**. **Mở khóa lại sau đó.**
- [ ] **E3.** **Tình trạng hệ thống**: Cơ sở dữ liệu = *Hoạt động · N ms* (chấm xanh); Lưu trữ tệp = *Chưa cấu hình* (chưa có bucket thật); Gemini AI = *Đã cấu hình*; Gửi email = *Chế độ dev (in ra console)*
- [ ] **E4.** Bấm **Làm mới** → thời gian "kiểm tra lúc …" cập nhật, số ms thay đổi
- [ ] **E5.** Không thấy giá trị key, tên bucket, chuỗi kết nối DB ở bất kỳ đâu (kể cả tab Network → Response)

**Ghi chú:**

---

## F. Lỗi & Phân Quyền

- [ ] **F1.** Đang ở dashboard bất kỳ, **tắt backend** (Ctrl + C) → F5 → hiện thông báo lỗi + nút **Thử lại** (không trắng trang) → bật lại backend → bấm **Thử lại** → dữ liệu hiện bình thường
- [ ] **F2.** Đăng nhập học viên, gõ URL `/admin/dashboard` → bị chuyển về `/student/dashboard`
- [ ] **F3.** Gọi API sai vai trò → `403`. Trong Git Bash:
  ```bash
  TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" \
    -d '{"email":"student.dung@eduverse.com","password":"EduVerse@2026"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
  curl -s http://localhost:5000/api/v1/dashboard/admin   -H "Authorization: Bearer $TOKEN"   # 403 "Bạn không có quyền..."
  curl -s http://localhost:5000/api/v1/dashboard/student -H "Authorization: Bearer $TOKEN"   # 200
  curl -s http://localhost:5000/api/v1/dashboard/student                                     # 401 (không có token)
  ```
- [ ] **F4.** Response của `/dashboard/student` **không** chứa: email giảng viên, mã lớp (`classCode`), câu hỏi/đáp án, `videoUrl`

**Ghi chú:**

---

## G. Dọn Dữ Liệu Sau Khi Test

- [ ] Bật lại lớp nếu đã tạm dừng (D6)
- [ ] Mở khóa tài khoản đã khóa (E2)
- [ ] Bài tập / bài nộp tạo thêm ở phần C: xóa hoặc báo nhóm biết là dữ liệu test
- [ ] Khóa đã duyệt/từ chối ở D4–D5: ghi lại để nhóm biết trạng thái đã thay đổi

---

## Kết Quả

| Phần | Đạt / Tổng | Người test | Ngày |
|---|---|---|---|
| A. Giao diện chung | /8 | | |
| B. Học viên | /8 | | |
| C. Bài tập HV ↔ GV | /7 | | |
| D. GV & Quản lý | /6 | | |
| E. Admin | /5 | | |
| F. Lỗi & phân quyền | /4 | | |
