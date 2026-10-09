# 🧪 Kế Hoạch Kiểm Thử Thủ Công — Sprint 3 (Khóa học, Danh mục, Khóa chỉnh sửa) & Hồi quy Auth

> **Ngày lập:** 09/10/2026
> **Phạm vi:** Module Danh mục khóa học, khóa chỉnh sửa khi `pending`/`published`, nối API 7 trang khóa học, các lỗi đã sửa trong Sprint 3, hồi quy các bản vá Auth.
> **Cách dùng:** Mở file bằng Markdown Preview (`Ctrl + Shift + V` trong VS Code), tick `[x]` vào các bước đã đạt. Bước lỗi thì ghi chú vào cột/ô **Ghi chú** ở cuối mỗi phần.

---

## 0. Chuẩn Bị

- [ ] Backend đang chạy: trong thư mục `backend/` chạy `npm run dev`
- [ ] Frontend đang chạy: `http://localhost:5173`
- [ ] Mở DevTools (`F12`) → tab **Network** để xem mã lỗi (403, 409…) khi cần
- [ ] Migration Danh mục đã chạy trên DB (đã chạy trên Neon dev ngày 09/10/2026; nếu dùng DB riêng: `npm run db:migrate:categories` trong `backend/`)

**Tài khoản seed** — mật khẩu chung `EduVerse@2026`:

| Vai trò | Email | Ghi chú |
|---|---|---|
| Admin | `admin@eduverse.com` | |
| Quản lý đào tạo | `manager@eduverse.com` | |
| Giảng viên | `teacher.an@eduverse.com` | Chủ khóa mẫu (published) |
| Giảng viên | `teacher.binh@eduverse.com` | Chưa có khóa nào |
| Học viên | `student.dung@eduverse.com` | **Đã ghi danh** lớp của khóa mẫu |
| Học viên | `student.hoa@eduverse.com` | Dùng để kiểm tra trường hợp **chưa ghi danh** |

> ⚠️ **Rate limit:** sai mật khẩu 5 lần cho cùng một email sẽ bị khóa 5 phút. Bị chặn thì khởi động lại backend (bộ đếm lưu trên bộ nhớ).

---

## A. Quản Lý Danh Mục — đăng nhập `manager@eduverse.com`, vào `/manager/categories`

- [ ] **A1.** Mở trang → thấy 5 danh mục: *Lập trình (1 khóa học)*, *Cơ sở dữ liệu*, *Khoa học dữ liệu*, *Thiết kế & UI/UX*, *Ngoại ngữ*
- [ ] **A2.** Bấm **Thêm danh mục** → nhập "Kỹ năng mềm" → **Tạo** → danh mục xuất hiện cuối danh sách, form chuyển sang chế độ sửa, slug hiển thị `ky-nang-mem`
- [ ] **A3.** Tạo thêm danh mục tên "kỹ năng MỀM" → báo lỗi **tên đã tồn tại**
- [ ] **A4.** Bấm vào "Kỹ năng mềm" → đổi tên "Kỹ năng sống" → **Lưu** → slug đổi thành `ky-nang-song`
- [ ] **A5.** Bấm badge **Hiển thị** của "Kỹ năng sống" → badge chuyển thành **Đang ẩn**
- [ ] **A6.** Bấm ↑ / ↓ vài lần → **F5** → thứ tự vẫn giữ nguyên
- [ ] **A7.** Chọn "Lập trình" → **Xóa** → báo lỗi không xóa được vì đang có khóa học, gợi ý ẩn danh mục
- [ ] **A8.** Chọn "Kỹ năng sống" → **Xóa** → xóa thành công *(nếu muốn test B2 thì để lại, xóa sau)*

**Ghi chú lỗi phần A:**

```

```

---

## B. Catalog Công Khai — đăng xuất hoặc mở cửa sổ ẩn danh, vào `/courses`

- [ ] **B1.** Trang tải bình thường, **không lỗi 500** (lỗi cũ do Express 5 `req.query`), thấy các nút lọc danh mục
- [ ] **B2.** Danh mục **đang ẩn** không xuất hiện trong các nút lọc
- [ ] **B3.** Bấm **Lập trình** → URL có `?category=lap-trinh`, chỉ hiện khóa thuộc danh mục này
- [ ] **B4.** Bấm **Ngoại ngữ** → hiện "Không tìm thấy khóa học phù hợp"
- [ ] **B5.** Bấm vào khóa mẫu → trang chi tiết có badge **Lập trình** → bấm badge quay về Catalog đã lọc

**Ghi chú lỗi phần B:**

```

```

---

## C. Giảng Viên Soạn Khóa Học — đăng nhập `teacher.an@eduverse.com`, vào `/teacher/courses`

- [ ] **C1.** Chỉ thấy khóa **của chính mình**; bảng có cột **Danh mục**; có tab **Từ chối**
- [ ] **C2.** **Tạo khóa mới** "Khóa Test UI", chọn danh mục **Cơ sở dữ liệu** → tự chuyển sang trang soạn đề cương; header ghi "Bản nháp · Cơ sở dữ liệu"
- [ ] **C3.** Thêm 1 chương → thêm 1 bài loại **Lý thuyết** có nội dung dài → tạo thành công
- [ ] **C4.** 🔴 **Kiểm tra lỗi mất nội dung:** bấm sang bài khác (hoặc F5) → quay lại bài vừa tạo → **chỉ sửa tiêu đề** → **Lưu** → F5 → **nội dung bài vẫn còn nguyên**
- [ ] **C5.** Quay lại danh sách → bấm ⚙ ở "Khóa Test UI" → đổi danh mục sang **Lập trình** → cột Danh mục cập nhật
- [ ] **C6.** Bấm **Gửi duyệt** → trạng thái "Chờ duyệt"; nút ⚙ / Gửi duyệt / Xóa biến mất; nút "Soạn" đổi thành **"Xem"**
- [ ] **C7.** Bấm **Xem** → banner vàng "đang chờ duyệt"; không còn nút thêm chương / thêm bài / lưu / xóa; ô nhập bị khóa
- [ ] **C8.** Đăng nhập `teacher.binh@eduverse.com` → `/teacher/courses` → **không** thấy khóa của teacher.an (kể cả khóa mẫu đã published)

**Ghi chú lỗi phần C:**

```

```

---

## D. Quản Lý Duyệt Khóa — đăng nhập `manager@eduverse.com`, vào `/manager/approvals`

- [ ] **D1.** Tab **Chờ duyệt** có "Khóa Test UI", cột Danh mục = **Lập trình**
- [ ] **D2.** **Xem** → **Từ chối** với lý do "Cần thêm bài" → khóa chuyển sang Từ chối
- [ ] **D3.** Đăng nhập teacher.an → khóa ở tab **Từ chối**, hiện lý do; khóa **sửa được trở lại** → thêm 1 bài → **Gửi duyệt** lần nữa
- [ ] **D4.** Đăng nhập manager → **Duyệt** → khóa chuyển sang Đã duyệt
- [ ] **D5.** Đăng nhập teacher.an → mở khóa → banner "đã công khai, chỉ xem"; không còn nút Xóa
- [ ] **D6.** Đăng xuất → `/courses?category=lap-trinh` → thấy "Khóa Test UI"

**Ghi chú lỗi phần D:**

```

```

---

## E. Học Viên & Quyền Xem Nội Dung Bài

- [ ] **E1.** Đăng nhập `student.dung@eduverse.com` (đã ghi danh) → mở bài học từ lớp → xem được nội dung / video; bấm **Hoàn thành** thành công
- [ ] **E2.** Đăng nhập `student.hoa@eduverse.com` (chưa ghi danh) → mở URL bài học của khóa mẫu → bị chặn: "Bạn chưa ghi danh vào lớp học chứa bài học này"
- [ ] **E3.** Khách mở trang chi tiết khóa mẫu → thấy đề cương (tên chương, tên bài); trong tab Network, response `/curriculum` **không có `videoUrl`**

**Ghi chú lỗi phần E:**

```

```

---

## F. Hồi Quy Auth — các bản vá trước vẫn hoạt động

- [ ] **F1.** Đăng nhập bất kỳ → **F5** → vẫn giữ phiên đăng nhập
- [ ] **F2.** Đăng xuất → **F5** → **không** bị đăng nhập lại
- [ ] **F3.** Chưa đăng nhập → vào `/admin/users` → bị chuyển về trang đăng nhập
- [ ] **F4.** Đăng nhập student → vào `/teacher/courses` → bị chuyển về `/student/dashboard`
- [ ] **F5.** Đăng nhập `admin@eduverse.com` → `/admin/users` → tạo tài khoản giảng viên mới, ghi lại mật khẩu tạm → đăng xuất → đăng nhập tài khoản mới → bị chuyển ngay về **Hồ sơ** với banner vàng yêu cầu đổi mật khẩu; bấm sang trang khác cũng bị đưa về Hồ sơ
- [ ] **F6.** Đổi mật khẩu ở Hồ sơ → thành công, dùng hệ thống bình thường, **không bị đăng xuất**
- [ ] **F7.** Mở 2 tab cùng tài khoản → F5 cả hai gần như cùng lúc → cả hai tab vẫn giữ phiên đăng nhập

**Ghi chú lỗi phần F:**

```

```

---

## G. Dọn Dẹp Sau Khi Test

- [ ] Đăng nhập admin → xóa "Khóa Test UI" (admin xóa được khóa đã duyệt; khóa bị xóa mềm)
- [ ] Xóa danh mục test còn sót (nếu còn "Kỹ năng sống")
- [ ] Tài khoản giảng viên tạo ở F5: giữ lại hoặc khóa

> Lưu ý: danh mục "Lập trình" sẽ vẫn đếm cả khóa đã xóa mềm khi thử xóa danh mục — đây là thiết kế có chủ ý để không làm hỏng dữ liệu cũ.

---

## Tổng Kết

| Phần | Số bước | Đạt | Lỗi |
|---|:---:|:---:|:---:|
| A. Quản lý danh mục | 8 | | |
| B. Catalog công khai | 5 | | |
| C. Giảng viên soạn khóa | 8 | | |
| D. Quản lý duyệt khóa | 6 | | |
| E. Học viên & quyền xem | 3 | | |
| F. Hồi quy Auth | 7 | | |
| **Tổng** | **37** | | |

**Người test:** ____________ &nbsp;&nbsp; **Ngày test:** ____/____/2026
