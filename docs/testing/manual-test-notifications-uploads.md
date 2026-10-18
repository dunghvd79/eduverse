# 🧪 Kế Hoạch Kiểm Thử Thủ Công — Thông báo, Upload ảnh, Báo cáo Quản lý

> **Ngày lập:** 18/10/2026
> **Phạm vi:** các commit trên nhánh `feature-manh`: trang **Báo cáo** của Quản lý (`7b72df2`), upload **avatar / ảnh bìa khóa học** (`a45ea6d`), **thông báo trong ứng dụng** (`eddf3c8` backend, `42dcf92` chuông giao diện) và dọn ảnh cũ khi đổi ảnh (`feat(uploads): delete old avatar and course thumbnail when replaced`). Đặc tả: [`api-notifications.md`](../api/api-notifications.md), [`api-uploads.md`](../api/api-uploads.md).
> **Cách dùng:** Mở bằng Markdown Preview (`Ctrl + Shift + V`), tick `[x]` các bước đạt. Bước lỗi ghi vào ô **Ghi chú** cuối mỗi phần.

---

## 0. Chuẩn Bị

- [ ] Đã `git pull` nhánh có các commit trên, `npm install` ở `backend/` và `frontend/` (không có thư viện mới)
- [ ] Đã chạy migration **một lần** trên DB đang dùng: `cd backend` → `npm run db:migrate:notifications` → thấy `✅ Bảng notifications đã sẵn sàng`
- [ ] Backend chạy ở `:5000` (`npm run dev`), frontend ở `http://localhost:5173`
- [ ] Mở DevTools (`F12`) → tab **Network** (lọc `notifications`) và tab **Console** (không được có lỗi đỏ khi thao tác)
- [ ] Biết backend đang lưu ảnh **trên máy** (thư mục `backend/uploads/`) hay **S3** (có `AWS_REGION`/`S3_BUCKET` trong `backend/.env`). Ở chế độ S3 bỏ qua các bước "kiểm tra thư mục" ở phần B, C

**Tài khoản seed** — mật khẩu chung `EduVerse@2026`:

| Vai trò | Email |
|---|---|
| Học viên | `student.dung@eduverse.com` |
| Giảng viên | `teacher.an@eduverse.com` (chủ khóa mẫu, phụ trách lớp "Nhóm 01") |
| Giảng viên | `teacher.binh@eduverse.com` (không liên quan khóa/lớp của An — dùng để kiểm tra không thấy thông báo của người khác) |
| Quản lý đào tạo | `manager@eduverse.com` |
| Admin | `admin@eduverse.com` |

> ⚠️ **DB dev là Neon dùng chung.** Các bước ở phần D–E tạo khóa/bài tập/bài nộp test và tạo thông báo thật. Làm xong nhớ dọn theo **mục G**.

---

## A. Trang Báo Cáo Của Quản Lý — `manager@eduverse.com`, `/manager/reports`

- [ ] **A1.** Trang tải xong, không còn số giả (không còn chỉ số "giữ chân", "điểm hài lòng")
- [ ] **A2.** 4 thẻ **Lớp học**, **Học viên**, **Điểm tổng kết TB**, **Học hết bài học** khớp với dữ liệu thật ở `/manager/classes` và tab **Bảng điểm** trong trang chi tiết lớp
- [ ] **A3.** Khối **Phân bố xếp loại học viên** có đủ 4 mức (Giỏi ≥ 8 · Khá ≥ 6.5 · Trung bình ≥ 5 · Chưa đạt < 5); tổng các mức bằng số ở thẻ **Học viên**
- [ ] **A4.** Bảng xếp hạng giảng viên sắp xếp theo điểm TB giảm dần
- [ ] **A5.** Tab trạng thái lớp (Tất cả / Đang hoạt động / Tạm dừng / Đã kết thúc) lọc đúng bảng lớp
- [ ] **A6.** Bấm tên lớp trong bảng → mở đúng `/manager/classes/:id`
- [ ] **A7.** Nút **Làm mới** tải lại số liệu, không lỗi Console
- [ ] **A8.** Nút **Xuất CSV** tải file; mở bằng Excel thấy tiếng Việt đúng dấu (không vỡ font), số cột khớp bảng lớp

**Ghi chú:**

---

## B. Upload Avatar — Trang Hồ Sơ (`/student/profile`, `/teacher/profile`…)

- [ ] **B1.** Có nút **Tải ảnh từ máy** phía trên các avatar mẫu
- [ ] **B2.** Chọn tệp `.gif` hoặc `.pdf` → báo đỏ *"Chỉ nhận ảnh JPG, PNG hoặc WEBP."*, không gửi request upload (Network không có `presigned-url`)
- [ ] **B3.** Chọn ảnh > 2MB → báo đỏ *"Ảnh không được vượt quá 2MB."*
- [ ] **B4.** Chọn ảnh JPG/PNG/WEBP hợp lệ (≤ 2MB) → báo thành công; avatar đổi ngay ở **trang Hồ sơ, thanh trên cùng và menu trái**
- [ ] **B5.** F5 (tải lại trang) và đăng xuất rồi đăng nhập lại → avatar mới vẫn còn
- [ ] **B6.** *(chế độ trên máy)* `Get-ChildItem backend\uploads\public\avatars` → có tệp dạng `<mã người dùng>_<số>.<đuôi>`
- [ ] **B7.** Tải ảnh thứ hai → thư mục ở B6 vẫn chỉ có tệp của **ảnh mới**; ảnh trước đã bị xóa
- [ ] **B8.** Chọn một avatar mẫu có sẵn → avatar đổi; tệp tải lên ở B7 bị xóa. Avatar mẫu (link ngoài) không gây lỗi ở cửa sổ backend

**Ghi chú:**

---

## C. Upload Ảnh Bìa Khóa Học — `teacher.an@eduverse.com`, `/teacher/courses`

- [ ] **C1.** Tạo khóa **nháp** mới (tên "Khóa Test ảnh bìa"): form có khối **Ảnh bìa khóa học**, chọn ảnh → thấy ảnh xem trước
- [ ] **C2.** Chọn ảnh > 5MB hoặc `.gif` → báo lỗi tương tự B2/B3 (giới hạn 5MB)
- [ ] **C3.** Lưu khóa → thẻ khóa học hiện ảnh bìa; tải lại trang vẫn còn
- [ ] **C4.** Sửa khóa, chọn ảnh bìa khác rồi lưu → thẻ đổi ảnh; *(chế độ trên máy)* `backend\uploads\public\thumbnails` chỉ còn tệp của ảnh mới
- [ ] **C5.** Gửi duyệt khóa (khóa chuyển `pending`), mở **Sửa thông tin**, chọn ảnh bìa khác rồi lưu → báo đỏ *"Khóa học đang chờ duyệt nên không thể chỉnh sửa…"*, ảnh bìa cũ giữ nguyên, nút lưu không bị treo

**Ghi chú:**

---

## D. Chuông Thông Báo (giao diện)

Đăng nhập bằng tài khoản có sẵn thông báo (làm sau phần E, hoặc làm E1 trước).

- [ ] **D1.** Thanh trên cùng ở **cả 4 portal** có chuông; không còn chấm đỏ giả cố định
- [ ] **D2.** Tài khoản chưa có thông báo: chuông không có số; bấm vào thấy *"Bạn chưa có thông báo nào."*
- [ ] **D3.** Tài khoản có thông báo chưa đọc: chuông hiện đúng **số**; tiêu đề danh sách ghi `Thông báo (N)`; thông báo chưa đọc có nền xanh nhạt và chấm xanh
- [ ] **D4.** Bấm một thông báo → danh sách đóng, chuyển đúng trang theo `link`; số trên chuông giảm 1; mở lại thấy thông báo đó hết chấm xanh
- [ ] **D5.** Bấm **Đánh dấu tất cả đã đọc** → số trên chuông biến mất, nút bị làm mờ
- [ ] **D6.** Bấm ra ngoài danh sách hoặc nhấn `Esc` → danh sách đóng
- [ ] **D7.** F5 → trạng thái đã đọc được giữ (số đếm đúng so với trước khi tải lại)
- [ ] **D8.** Tab Network: có request `GET /notifications/unread-count` lúc vào trang và lặp lại **khoảng 30 giây/lần**; không có request lặp liên tục
- [ ] **D9.** Thu cửa sổ về ~390px (DevTools → Toggle device): danh sách thông báo không tràn khỏi màn hình, không cuộn ngang
- [ ] **D10.** Tài khoản đang dùng **mật khẩu tạm** (Admin tạo tài khoản mới rồi đăng nhập thử): bị chuyển sang trang Hồ sơ, Network **không** có request `notifications`, Console không lỗi đỏ

**Ghi chú:**

---

## E. Thông Báo Sinh Tự Động (kèm kiểm tra không làm hỏng chức năng cũ)

> Mỗi bước phải xác nhận **cả hai điều**: (1) chức năng cũ vẫn chạy bình thường như trước, (2) người nhận thấy thông báo đúng nội dung. Chuông cập nhật tối đa sau 30 giây, hoặc F5 để thấy ngay.

### Bài tập — `teacher.an` ↔ `student.dung`

- [ ] **E1.** GV tạo bài tập mới ở `/teacher/assignments` ("Bài test thông báo"), vào lớp "Nhóm 01" → tab **Bài tập** → **Giao bài** (đặt hạn nộp). Giao bài thành công; HV Dũng thấy thông báo **"Bài tập mới: Bài test thông báo"** có hạn nộp dạng `23:59 31/10/2026`; bấm vào → mở đúng trang bài tập của lớp
- [ ] **E2.** GV **đổi hạn nộp** của bài vừa giao → lưu thành công; HV **không** nhận thêm thông báo mới
- [ ] **E3.** HV nộp bài (tệp nhỏ). GV vào trang chấm → **Chấm điểm** (ví dụ 8.5 điểm) → **Lưu điểm** thành công; HV thấy *"Giảng viên đã chấm bài "…" của bạn: 8.5/10."*; bấm vào → mở trang bài tập
- [ ] **E4.** GV **Yêu cầu nộp lại** kèm lý do → thành công; HV thấy *"Yêu cầu nộp lại bài tập"* có chứa lý do
- [ ] **E5.** *(nếu giao diện có chấm nhiều bài một lúc)* chấm hàng loạt 2 bài trở lên → mỗi HV có **một** thông báo riêng, không trùng
- [ ] **E6.** GV chấm lại bài đã chấm → HV nhận thêm một thông báo điểm mới

### Khóa học — `teacher.an` ↔ `manager`

- [ ] **E7.** GV tạo khóa test (1 chương, 1 bài học) → **Gửi duyệt** thành công; Quản lý thấy **"Khóa học mới chờ duyệt"**; bấm vào → mở đúng trang `/manager/approvals/:id/review` của khóa đó
- [ ] **E8.** Quản lý **Duyệt & xuất bản** → thành công; GV thấy **"Khóa học đã được duyệt"**; bấm vào → mở `/teacher/courses`
- [ ] **E9.** Làm lại E7 với một khóa test thứ hai, Quản lý **Từ chối** kèm lý do → GV thấy **"Khóa học bị từ chối"** có kèm lý do; bấm vào → mở trang soạn đề cương của khóa đó

### Riêng tư

- [ ] **E10.** `teacher.binh` (không liên quan) **không** thấy bất kỳ thông báo nào ở E1–E9
- [ ] **E11.** Quản lý **không** thấy thông báo gửi riêng cho HV hoặc GV (chỉ thấy `course_pending`)

**Ghi chú:**

---

## F. Lỗi & Phân Quyền (API, dán vào PowerShell)

    $base = "http://localhost:5000/api/v1"
    function Get-Token($email) {
      $body = @{ email = $email; password = "EduVerse@2026" } | ConvertTo-Json
      (Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $body).data.accessToken
    }
    function Call-Api($method, $path, $token) {
      try {
        $h = @{}
        if ($token) { $h.Authorization = "Bearer $token" }
        Invoke-RestMethod -Method $method -Uri "$base$path" -Headers $h | Out-Null
        "200 OK"
      } catch { "HTTP " + [int]$_.Exception.Response.StatusCode }
    }

- [ ] **F1.** `Call-Api Get "/notifications" $null` → **HTTP 401**
- [ ] **F2.** `$t = Get-Token "student.dung@eduverse.com"` rồi `Call-Api Get "/notifications?limit=100" $t` → **HTTP 400** (tối đa 50/trang)
- [ ] **F3.** `Call-Api Patch "/notifications/not-a-uuid/read" $t` → **HTTP 400**; `Call-Api Patch "/notifications/00000000-0000-4000-8000-000000000000/read" $t` → **HTTP 404**
- [ ] **F4.** Lấy `id` một thông báo của **HV Dũng** (tab Network, request `GET /notifications`), rồi đăng nhập `teacher.binh` và gọi `Call-Api Patch "/notifications/<id đó>/read" $tokenBinh` → **HTTP 404** (không đổi được thông báo của người khác)
- [ ] **F5.** Tắt backend (đóng cửa sổ `npm run dev`) khi đang mở portal: trang **không** trắng, chuông không làm hỏng giao diện; mở lại backend → chuông tự cập nhật sau ≤ 30 giây
- [ ] **F6.** *(tùy chọn)* Đổi tên tạm bảng `notifications` trong DB, rồi giao một bài tập / chấm điểm → thao tác chính **vẫn thành công**, chỉ có cảnh báo `⚠️ Không tạo được thông báo` ở cửa sổ backend. Nhớ đổi tên lại

**Ghi chú:**

---

## G. Dọn Dữ Liệu Sau Khi Test

- [ ] Xóa khóa test "Khóa Test ảnh bìa" và 2 khóa test ở E7–E9 (Admin có thể xóa ở `/admin/courses`)
- [ ] Bài tập "Bài test thông báo" và bài nộp tạo thêm: xóa hoặc báo nhóm biết là dữ liệu test
- [ ] Điểm đã chấm ở E3/E6: báo nhóm biết nếu đã làm thay đổi bảng điểm mẫu
- [ ] Đổi lại avatar về avatar mẫu ban đầu nếu cần
- [ ] Thông báo test còn lại có thể để nguyên (không ảnh hưởng chức năng); muốn dọn thì bấm **Đánh dấu tất cả đã đọc**

---

## Kết Quả

| Phần | Đạt / Tổng | Người test | Ngày |
|---|---|---|---|
| A. Báo cáo Quản lý | /8 | | |
| B. Upload avatar | /8 | | |
| C. Upload ảnh bìa khóa học | /5 | | |
| D. Chuông thông báo | /10 | | |
| E. Thông báo tự động | /11 | | |
| F. Lỗi & phân quyền | /6 | | |
