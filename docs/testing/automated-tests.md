# 🤖 Kiểm Thử Tự Động

> **Ngày lập:** 24/10/2026
> **Phạm vi:** backend (`backend/tests/`). Không cần cài thêm thư viện: dùng bộ chạy test có sẵn của Node.js (`node:test`, `node:assert`), cần Node 20 trở lên (Docker dùng Node 22).
> **Bổ sung cho** các kế hoạch kiểm thử thủ công cùng thư mục (`manual-test-*.md`), không thay thế chúng: giao diện React vẫn kiểm thủ công.

---

## 1. Hai Lớp Kiểm Thử

| Lớp | Thư mục | Cần hệ thống chạy? | Lệnh | Kiểm tra gì |
|---|---|---|---|---|
| **Unit test** | `backend/tests/unit/*.test.js` | Không (không cần CSDL, mạng) | `npm test` | Công thức tính điểm tổng kết, xếp loại, các trường hợp ngoại lệ E1–E3 của [`grading-policy.md`](../requirements/grading-policy.md) |
| **Kiểm thử API đầu-cuối** | `backend/tests/e2e/api.e2e.js` | **Có** (backend + CSDL có dữ liệu mẫu) | `npm run test:e2e` | Gọi API thật: đăng nhập 4 vai trò, phân quyền, phân trang, thông báo, bảng điểm lớp, thảo luận trong bài học |

Unit test không đụng dữ liệu. Kiểm thử API **chỉ đọc**, trừ nhóm *Thảo luận* có ghi vài bài thử rồi **tự xóa ngay** (và chỉ do giảng viên mẫu đăng nên không sinh thông báo), nên chạy lại bao nhiêu lần cũng không làm bẩn CSDL.

---

## 2. Cách Chạy

### 2.1. Unit test (chạy được ngay, không cần Docker)

```
cd backend
npm test
```

Kết quả mong đợi: `# pass 152`, `# fail 0`.

### 2.2. Kiểm thử API đầu-cuối

Bật hệ thống bằng Docker Compose (xem [`deployment.md`](../architecture/deployment.md)), đợi `backend` ở trạng thái `healthy` rồi:

```
cd backend
npm run test:e2e
```

Mặc định test gọi `http://localhost:8080` (cổng Nginx của Docker Compose). Đổi bằng biến môi trường:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:8080` | Địa chỉ hệ thống. Chạy `npm run dev` thì dùng `http://localhost:5000` |
| `E2E_PASSWORD` | `EduVerse@2026` | Mật khẩu chung của 4 tài khoản mẫu |

Ví dụ trên PowerShell khi chạy backend bằng `npm run dev`:

```
$env:E2E_BASE_URL = 'http://localhost:5000'
npm run test:e2e
```

> ⚠️ **Đừng chạy vào CSDL Neon dùng chung khi người khác đang thao tác.** Test chỉ đọc nhưng mỗi lần đăng nhập tạo thêm một phiên (Refresh Token) trong bảng `user_tokens`.
>
> Cần CSDL có dữ liệu mẫu (tài khoản `admin@`, `manager@`, `teacher.an@`, `student.dung@eduverse.com`). Docker Compose tự nạp khi CSDL trống.

Nếu hệ thống chưa bật, test dừng ngay với thông báo `Không kết nối được tới ...` thay vì hàng chục lỗi khó hiểu.

---

## 3. Nội Dung Kiểm Thử

### 3.1. Unit test (152 test)

#### Công thức điểm — `tests/unit/grading.test.js` (35 test)

Logic tính điểm nằm ở `backend/src/utils/grading.js` (hàm thuần, không import Sequelize). `gradebookService.js` dùng lại các hàm này nên **test kiểm đúng đoạn mã đang chạy thật**, không phải bản sao.

- Tỷ trọng gốc `Q 40% / A 50% / P 10%`; bỏ thành phần không có và chia lại tỷ trọng (E1): đủ 4 tổ hợp có/không có Quiz và Bài tập, tổng luôn bằng 1.
- Xếp loại ở các điểm biên: 8 → Giỏi, 7.99 → Khá, 6.5 → Khá, 6.49 → Trung bình, 5 → Trung bình, 4.99 → Chưa đạt.
- Trạng thái bài tập: chưa nộp, đã nộp chưa chấm = 0 (E2), nộp lại thì dùng điểm lần chấm gần nhất (E3), yêu cầu nộp lại; điểm `0` là đã chấm, không phải chưa chấm.
- Ví dụ trong chính sách tính điểm cho ra **6.87 – Khá**; điểm tối đa → 10 – Giỏi; toàn 0 → 0 – Chưa đạt; bài chưa làm vẫn nằm ở mẫu số khi tính trung bình.
- Chỉ làm tròn ở kết quả cuối (không làm tròn hai lần).
- Kiểm thử theo tính chất với dữ liệu ngẫu nhiên cố định (cùng hạt giống nên chạy lại ra cùng kết quả): điểm luôn trong `[0, 10]`, xếp loại khớp ngưỡng, tăng điểm thành phần không bao giờ làm giảm điểm tổng kết.

#### Thống kê lớp cho file Excel — `tests/unit/gradebookStats.test.js` (26 test)

Số liệu của hai sheet "Thống kê lớp" và "Tiến độ học" trong file `.xlsx` xuất bảng điểm do hàm thuần `backend/src/utils/gradebookStats.js` tính từ bảng điểm, nên kiểm thử được mà không cần CSDL hay thư viện Excel.

- Tổng quan: điểm trung bình / cao nhất / thấp nhất / trung vị (số lượng chẵn và lẻ), số học viên đạt (từ 5 điểm) và tỷ lệ đạt, tiến độ trung bình, số bài tập chờ chấm.
- Phân bố xếp loại và phân bố tiến độ học: mỗi học viên rơi vào đúng một mức, kiểm tra cả các điểm biên 50 / 80 / 100, tỷ lệ cộng lại xấp xỉ 100%.
- Từng bài kiểm tra: số người đã làm / chưa làm, điểm trung bình cả lớp (người chưa làm tính 0) khác điểm trung bình người đã làm, cao nhất / thấp nhất; điểm 0 nhưng đã làm vẫn tính là đã làm.
- Từng bài tập: đếm theo từng trạng thái (đã chấm, chờ chấm, nộp lại chờ chấm lại, yêu cầu nộp lại, chưa nộp), tỷ lệ nộp, điểm trung bình chỉ tính bài thật sự có điểm.
- Lớp chưa có học viên không gây chia cho 0; lớp không có Quiz hoặc Bài tập thì bỏ bảng tương ứng; mọi dòng có đúng số ô bằng số cột tiêu đề.

#### Quy tắc Thảo luận — `tests/unit/discussionRules.test.js` (28 test)

Quy tắc quyền và chuẩn hóa nội dung của module Thảo luận / Hỏi đáp ([`api-discussions.md`](../api/api-discussions.md), BR-070 → BR-078) nằm trong hàm thuần `backend/src/utils/discussionRules.js`, kiểm tra không cần CSDL:
- Nội dung hợp lệ là 1 đến 2000 ký tự sau khi bỏ khoảng trắng hai đầu.
- Học viên đang học và giảng viên phụ trách xem và ghi được; giảng viên lớp khác, học viên ngoài lớp không xem được; Quản lý và Admin xem và kiểm duyệt nhưng không đăng bài.
- Tác giả sửa bài của mình; giảng viên phụ trách, Quản lý, Admin xóa và đánh dấu "đã giải đáp" được; câu trả lời không đánh dấu được.
- Lớp `paused` hoặc `closed` là chỉ đọc với học viên, riêng giảng viên, Quản lý, Admin vẫn xóa và đánh dấu để kiểm duyệt.

#### Cấu hình và nội dung email — `tests/unit/mailConfig.test.js` (23 test), `tests/unit/emailTemplates.test.js` (14 test)

- Chọn chế độ gửi theo biến môi trường (4 tổ hợp `REDIS_URL` × `SMTP_HOST`; chuỗi rỗng do docker compose truyền vào coi như chưa cấu hình); tùy chọn SMTP (cổng 465 TLS, 587 STARTTLS, bỏ khoảng trắng trong mật khẩu ứng dụng Gmail, không gửi `auth` khi thiếu user/pass); người gửi `MAIL_FROM`; đọc `REDIS_URL` (mật khẩu, db, `rediss://`, từ chối giao thức khác).
- Nội dung email OTP và đặt lại mật khẩu: tiêu đề có mã, link ghép từ `CLIENT_URL` (bỏ `/` cuối, lấy giá trị đầu khi có nhiều, mã hóa token), tên người dùng và link bị escape để không chèn được HTML.

#### Dịch vụ gửi email — `tests/unit/emailService.test.js` (26 test)

Chạy với bản giả của `bullmq`, `ioredis` và `nodemailer` (không cần Redis hay SMTP thật): đúng 4 chế độ; job vào hàng đợi `email` với 5 lần thử lại, chờ tăng dần, xóa job khi xong; Queue và Worker dùng chung một client `ioredis`; Redis lỗi, chưa sẵn sàng, treo quá 3 giây, thiếu thư viện hoặc `REDIS_URL` sai thì chuyển sang gửi trực tiếp (không thêm job khi Redis chưa sẵn sàng để tránh gửi trùng); lỗi Redis/worker lặp lại chỉ ghi log một lần mỗi 60 giây; worker gửi SMTP và ném lỗi để BullMQ thử lại; đóng worker/hàng đợi/transporter an toàn; mọi hàm gửi không bao giờ ném lỗi, kể cả khi đầu vào sai. Phần chưa test tự động: nối Redis và SMTP thật (kiểm tay theo `deployment.md` mục 4.1).

### 3.2. Kiểm thử API — `tests/e2e/api.e2e.js` (51 kiểm tra)

| Nhóm | Ví dụ kiểm tra |
|---|---|
| Hệ thống | `/health` đúng Envelope; đường dẫn lạ trả `404` JSON; JSON sai cú pháp trả `400` (không phải `500`) |
| Xác thực | 4 vai trò đăng nhập được; không lộ mật khẩu; email lạ `401`; thiếu mật khẩu `400` kèm `errors`; Refresh Token nằm trong cookie `HttpOnly`, xoay vòng được, đăng xuất được |
| Phân quyền | Không token / token giả `401`; học viên vào `/users` `403`; giảng viên tạo danh mục `403`; dashboard sai vai trò `403`; ID sai định dạng `400` |
| Hồ sơ | `/users/me` của từng vai trò trả đúng tài khoản |
| Khóa học công khai | Phân trang đúng; khách và học viên **chỉ thấy khóa `published`** kể cả khi cố lọc `status=draft`; `limit` sai `400`; slug lạ `404` |
| Dashboard | Cả 4 dashboard trả `stats` |
| Thông báo | Cần đăng nhập; số chưa đọc là số nguyên không âm; `limit=51` bị chặn; đánh dấu thông báo không phải của mình `404` |
| Bảng điểm lớp | Với từng lớp của giảng viên mẫu: tỷ trọng cộng lại bằng 1, điểm trong `[0, 10]`, xếp loại khớp ngưỡng, **điểm tổng kết của từng học viên khớp công thức tính lại từ điểm thành phần**, thống kê tổng hợp khớp; học viên xem bảng điểm cả lớp `403`; Quản lý thấy cùng kết quả với giảng viên; xuất CSV trả tệp đính kèm; xuất `.xlsx` mở được và có đủ 4 sheet (Bảng điểm, Thống kê lớp, Tiến độ học, Quy tắc tính điểm) |
| Thảo luận | Cần đăng nhập; mã sai định dạng `400`; bài học khác khóa `404`; học viên xem được và `canPost = true`; Quản lý xem được nhưng đăng bài `403`; nội dung rỗng hoặc quá 2000 ký tự `400`; giảng viên đăng, trả lời, sửa, đánh dấu, xóa (xóa câu hỏi xóa luôn câu trả lời); học viên sửa/xóa/đánh dấu hộ `403`; tổng quan lớp cho giảng viên, học viên `403` |

Nếu giảng viên mẫu chưa có lớp nào, các kiểm tra bảng điểm được **bỏ qua** (hiện `skipped`), không báo lỗi. Tương tự, nhóm Thảo luận bỏ qua khi chưa có lớp đang hoạt động do giảng viên mẫu phụ trách mà học viên mẫu đang học.

---

## 4. Khi Một Test Lỗi

1. Đọc dòng `✖` và thông điệp `expected / actual` ngay bên dưới.
2. **Unit test lỗi sau khi sửa `utils/grading.js`:** công thức đã đổi. Nếu cố ý (chính sách tính điểm đổi) thì sửa [`grading-policy.md`](../requirements/grading-policy.md) trước, rồi cập nhật test cho khớp. Nếu không cố ý thì sửa lại mã.
3. **Kiểm thử API lỗi `401` khi đăng nhập:** CSDL không có dữ liệu mẫu hoặc đã đổi mật khẩu tài khoản mẫu (đặt `E2E_PASSWORD`). Bị khóa tạm vì đăng nhập sai quá 5 lần trong 5 phút thì đợi 5 phút (hoặc `docker compose restart backend`, vì bộ đếm lưu trong bộ nhớ).
4. **Kiểm thử API lỗi ở chỗ khác:** có thể là lỗi thật của backend. Tái hiện bằng trình duyệt hoặc Postman trước khi sửa test.

---

## 5. Thêm Test Mới

- **Unit test:** tạo `backend/tests/unit/<tên>.test.js` (đuôi `.test.js` để `npm test` tự tìm thấy). Chỉ import các hàm thuần (`utils/`); đừng import model Sequelize vì sẽ cần CSDL. Muốn test logic đang nằm lẫn trong service thì tách hàm thuần ra `utils/` như đã làm với `grading.js`.
- **Kiểm thử API:** thêm `describe`/`it` vào `tests/e2e/api.e2e.js`, dùng các hàm có sẵn `request`, `expectOk`, `expectFail`, `sessions.<vai trò>.token`. Giữ nguyên nguyên tắc **chỉ đọc**; test cần ghi dữ liệu phải tự dọn và ghi rõ trong tài liệu này.
- Không đặt đuôi `.test.js` cho file cần hệ thống đang chạy, để `npm test` luôn chạy được ở máy chưa bật Docker.

---

## 6. Chưa Làm

- Chưa có kiểm thử giao diện (React) tự động.
- Chưa có kiểm thử ghi dữ liệu (đăng ký, nộp bài, chấm bài...): các luồng này vẫn theo [kế hoạch thủ công](manual-test-sprint3.md).
- Chưa chạy tự động trên CI (GitHub Actions); thêm khi làm mục CI/CD của Phase 3.
