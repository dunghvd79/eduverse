# 📐 Wireframes & Bố cục Giao diện — EduVerse

> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 26/09/2026  
> **Trạng thái:** ✅ Đã phê duyệt  
> **Công nghệ giao diện:** React 18 + Vite (JavaScript `.jsx`), Tailwind CSS, Radix UI Primitives, Lucide React Icons, Sonner Toast

---

## 1. Hệ thống Quy chuẩn Thiết kế (Design Foundations)

Tài liệu này kế thừa 100% các giá trị từ **Design System** (`docs/ui/design-system.md`) — đóng vai trò Single Source of Truth của toàn bộ dự án EduVerse.

### 1.1. Grid & Breakpoints (Responsive)

Hệ thống tuân thủ nghiêm ngặt chuẩn responsive cho màn hình Web và Mobile (theo triết lý mobile-first của Tailwind CSS):

| Kích thước | Tên Breakpoint Tailwind | Độ rộng màn hình | Bố cục Layout chính |
|---|---|---|---|
| **Mobile** | Base styles (mặc định) | `< 768px` | 1 cột đơn, Sidebar thu gọn thành Bottom Nav hoặc Drawer menu (Hamburger). Bảng dữ liệu có `overflow-x-auto`. |
| **Tablet** | `md` | `768px – 1023px` | 2 cột linh hoạt, Sidebar dạng icon thu gọn (collapsed sidebar). |
| **Desktop** | `lg` | `≥ 1024px` | Bố cục chuẩn Dashboard: Sidebar cố định (260px) + Header (64px) + Main Content (12 cột). |
| **Wide Desktop** | `xl` | `≥ 1280px` (max `1600px`) | Khung nội dung tối đa `max-w-app` (1600px), canh giữa màn hình `mx-auto`. |

### 1.2. Bảng màu & Kiểu chữ (Color Palette & Typography)

- **Màu chủ đạo (Primary):** Xanh công nghệ `#1168bd` (`primary`), Hover `#0e5aa5` (`primary-hover`), Active `#0b4782` (`primary-active`), Dark `#005096` (`primary-dark`).
- **Màu phụ (Secondary):** Xanh than `#0c2d48` (`secondary`), Light `#44617e` (`secondary-light`).
- **Màu điểm xuyết (Tertiary):** Xanh băng dịu `#0ea5e9` (`tertiary`), Dark `#00557a` (`tertiary-dark`).
- **Màu nền (Background & Surfaces):** Nền App Canvas `#f8f9ff` (`surface` / `background`), Khối Card `#ffffff` (`surface-container-lowest`), Nền phụ `#eff4ff` (`surface-container-low`), Viền `#c1c6d4` (`outline-variant`).
- **Màu trạng thái (Semantic Feedback):**
  - **Success:** `#10b981` (`success`) / Chữ & Icon: On-success `#065f46` — Hoàn thành bài học, Đạt quiz, Phê duyệt.
  - **Warning:** `#f59e0b` (`warning`) / Chữ & Icon: On-warning `#92400e` — Chờ duyệt (Pending), Sắp đến hạn nộp bài.
  - **Error / Danger:** `#ba1a1a` (`error`), Hover `#93000a` / Chữ & Icon: On-error `#ffffff` — Trễ hạn, Khóa tài khoản, Từ chối phê duyệt.
- **Phông chữ:** Duy nhất `Inter, sans-serif` trên toàn bộ hệ thống. Các trường đồng hồ đếm ngược, điểm số, bảng dữ liệu tài chính/thống kê áp dụng class utility `.tabular-number` (`font-variant-numeric: tabular-nums`).

---

## 2. Wireframes Chi tiết Các Màn hình Cốt lõi

Các wireframe dưới đây minh họa các màn hình cốt lõi trọng yếu của hệ thống; tên Route và Screen ID tham chiếu trực tiếp theo Master Screen Inventory trong Blueprint (SCR-01 → SCR-37).

---

### WF-01: Public Landing Page (SCR-01 — Route: `/`)

Màn hình trang chủ giới thiệu nền tảng, hero banner ấn tượng, các khối tính năng nổi bật, số liệu thống kê và danh mục khóa học tiêu biểu.

```
+-----------------------------------------------------------------------------------------+
| [Logo EduVerse]    Khám phá     Giới thiệu    Tính năng          [ Đăng nhập ] [ Đăng ký ]|
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|       🚀 NỀN TẢNG HỌC TẬP TRỰC TUYẾN THÔNG MINH CHO TƯƠNG LAI                           |
|       Nâng cao kỹ năng với hàng trăm khóa học chất lượng cao, bài kiểm tra AI           |
|                                                                                         |
|       [ 🔍 Tìm kiếm khóa học, giảng viên...               ] [ Khám phá ngay ]           |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
|  DANH MỤC NỔI BẬT:  [ Lập trình ]  [ Trí tuệ nhân tạo ]  [ Thiết kế ]  [ Kinh doanh ]   |
+-----------------------------------------------------------------------------------------+
|  KHÓA HỌC NỔI BẬT ĐƯỢC ĐỀ XUẤT                                                          |
|                                                                                         |
|  +--------------------+  +--------------------+  +--------------------+  +------------+ |
|  | [ Ảnh Thumbnail ]  |  | [ Ảnh Thumbnail ]  |  | [ Ảnh Thumbnail ]  |  | [ ... ]    | |
|  | Lập trình Web Full |  | Cấu trúc dữ liệu & |  | Học máy & Deep     |  |            | |
|  | ThS. Nguyễn Văn A  |  | TS. Trần Thị B     |  | ThS. Lê Văn C      |  |            | |
|  | ⭐ 4.9 (120 đánh giá) | ⭐ 4.8 (85 đánh giá) | ⭐ 5.0 (210 đánh giá)| |            | |
|  | [ Miễn phí ]       |  | [ Miễn phí ]       |  | [ Miễn phí ]       |  |            | |
|  | [ Xem chi tiết -> ]|  | [ Xem chi tiết -> ]|  | [ Xem chi tiết -> ]|  |            | |
|  +--------------------+  +--------------------+  +--------------------+  +------------+ |
|                                                                                         |
|  [ Xem tất cả khóa học tại Thư viện -> ]                                                |
+-----------------------------------------------------------------------------------------+
| Footer: EduVerse © 2026 - Đồ án Liên ngành Đại học | Điều khoản | Chính sách bảo mật    |
+-----------------------------------------------------------------------------------------+
```

---

### WF-02: Khám phá Danh mục Khóa học (SCR-02 — Route: `/courses`)

Màn hình tìm kiếm, lọc đa tiêu chí (danh mục, cấp độ, miễn phí/có phí, sắp xếp) kết hợp lưới hiển thị thẻ khóa học và phân trang.

```
+-----------------------------------------------------------------------------------------+
| [Logo EduVerse]    Khám phá     Giới thiệu    Tính năng          [ Đăng nhập ] [ Đăng ký ]|
+-----------------------------------------------------------------------------------------+
| BỘ LỌC TÌM KIẾM (Search & Filter)                                                       |
| [ 🔍 Tìm kiếm tên khóa học, giảng viên...           ] [ Sắp xếp: Phổ biến nhất ▼ ]      |
| Cấp độ: [ Tất cả ] [ Cơ bản ] [ Nâng cao ]   | Danh mục: [ Web ▼ ]  | Giá: [ Tất cả ▼ ]|
+-----------------------------------------------------------------------------------------+
| KẾT QUẢ KHÓA HỌC (Hiển thị 12 / 120 khóa học)                                           |
|                                                                                         |
| +--------------------+  +--------------------+  +--------------------+  +-------------+ |
| | [ Ảnh Thumbnail ]  |  | [ Ảnh Thumbnail ]  |  | [ Ảnh Thumbnail ]  |  | [ ... ]     | |
| | Lập trình Web Full |  | Cấu trúc dữ liệu   |  | Học máy & Deep     |  |             | |
| | ThS. Nguyễn Văn A  |  | TS. Trần Thị B     |  | ThS. Lê Văn C      |  |             | |
| | ⭐ 4.9 (120 reviews)|  | ⭐ 4.8 (85 reviews)|  | ⭐ 5.0 (210 rev)   |  |             | |
| | [ Xem chi tiết ]   |  | [ Xem chi tiết ]   |  | [ Xem chi tiết ]   |  |             | |
| +--------------------+  +--------------------+  +--------------------+  +-------------+ |
|                                                                                         |
| [ Trang trước ]   [ 1 ]  [ 2 ]  [ 3 ]  ...  [ 10 ]   [ Trang sau ]                      |
+-----------------------------------------------------------------------------------------+
```

---

### WF-03: Màn hình Đăng nhập Tài khoản (SCR-05 — Route: `/auth/login`)

Bố cục cân đối 2 nửa (Split Layout): Trái là hình ảnh thương hiệu và tuyên ngôn sản phẩm, Phải là Form nhập liệu có validation tức thì, nút hiển thị mật khẩu và tùy chọn ghi nhớ đăng nhập.

```
+---------------------------------------------------+-------------------------------------+
|                                                   |                                     |
|               [ Minh họa Đồ họa ]                 |            [ Logo EduVerse ]        |
|                                                   |                                     |
|           Chào mừng bạn đến với EduVerse          |           Đăng nhập tài khoản       |
|                                                   |   Nhập thông tin để tiếp tục học tập|
|        Trải nghiệm phương pháp học tập tương tác  |                                     |
|        với bài kiểm tra chấm điểm tự động và AI.  |   Email                               |
|                                                   |   [ sinhvien@eduverse.edu.vn        ]   |
|                                                   |                                     |
|                                                   |   Mật khẩu                              |
|                                                   |   [ ••••••••••••••••             👁️ ]   |
|                                                   |                                     |
|                                                   |   [ ] Ghi nhớ đăng nhập   [Quên MK?]|
|                                                   |                                     |
|                                                   |   [======== ĐĂNG NHẬP ========]     |
|                                                   |                                     |
|                                                   |   Chưa có tài khoản? [Đăng ký ngay] |
+---------------------------------------------------+-------------------------------------+
```

---

### WF-04: Màn hình Xác thực Tài khoản Email OTP (SCR-07 — Route: `/auth/verify-email`)

Màn hình chuyên biệt nhập 6 chữ số OTP với tự động chuyển ô (auto-focus next input), đồng hồ đếm ngược gửi lại mã và nút kích hoạt tài khoản.

```
+-----------------------------------------------------------------------------------------+
|                                  XÁC THỰC TÀI KHOẢN EMAIL                               |
|   Mã xác thực gồm 6 chữ số đã được gửi tới email: **u***@eduverse.edu.vn                |
|                                                                                         |
|             [  5  ]   [  8  ]   [  2  ]   [  1  ]   [  9  ]   [  4  ]                   |
|                                                                                         |
|                           Thời gian còn lại: 09:45                                      |
|                 Chưa nhận được mã? [ Gửi lại mã OTP (58s) ]                             |
|                                                                                         |
|                     [========= XÁC NHẬN KÍCH HOẠT =========]                            |
+-----------------------------------------------------------------------------------------+
```

---

### WF-05: Không gian Học tập của Học viên — Classroom Player (SCR-13 — Route: `/student/courses/:id/learn/:lessonId`)

Giao diện học tập tối ưu sự tập trung: Trái/Giữa là nội dung bài học (video stream hoặc markdown), Phải là cây đề cương chương hồi với trạng thái đã hoàn thành.

```
+-----------------------------------------------------------------------------------------+
| [<- Quay lại Khóa học]  Lập trình Web với React & Node.js       Tiến độ: [==== 65% ===] |
+---------------------------------------------------------+-------------------------------+
| BÀI HỌC: 3.2 - Xây dựng REST API với Express.js         | NỘI DUNG KHÓA HỌC (Curriculum)|
|                                                         +-------------------------------+
| +-----------------------------------------------------+ | 📁 Chương 1: Tổng quan        |
| |                                                     | |   ✓ 1.1 Cài đặt Node.js (15p) |
| |        [ KHUNG PHÁT VIDEO BÀI GIẢNG 1080P ]         | |   ✓ 1.2 Cấu trúc dự án (20p)  |
| |                      ▶ 08:45 / 24:30                | | 📁 Chương 2: Cơ sở dữ liệu    |
| |                                                     | |   ✓ 2.1 Cài đặt PostgreSQL    |
| +-----------------------------------------------------+ |   ✓ 2.2 Sequelize ORM Models  |
|                                                         | 📂 Chương 3: REST API Server  |
| 📝 Ghi chú bài giảng:                                   |   ✓ 3.1 Middleware Express    |
| • Express 4 sử dụng Router module hóa theo từng tính    |   ▶ 3.2 Xây dựng REST API (Đang)|
|   năng (authRouter, courseRouter).                      |   ○ 3.3 Joi Data Validation   |
| • Luôn dùng async/await kết hợp Error Middleware.       |   ○ 3.4 [Quiz] Trắc nghiệm C3 |
|                                                         | 📁 Chương 4: Bài tập tổng hợp |
| 📎 Tài liệu đính kèm:                                   |   ○ 4.1 [Bài tập] Nộp REST API|
| [📥 code_mau_chuong3.zip (2.4 MB)] [S3 Presigned Link]  |                               |
|                                                         |                               |
| +-----------------------------------------------------+ |                               |
| | [ < Bài trước ]  [ ✓ ĐÁNH DẤU ĐÃ HOÀN THÀNH ]  [ Bài tiếp theo > ]                   |
+---------------------------------------------------------+-------------------------------+
```

---

### WF-06: Giao diện Làm bài Kiểm tra Trắc nghiệm (SCR-14 — Route: `/student/quizzes/:id/take`)

Giao diện khóa tập trung (Focus Mode): Đồng hồ đếm ngược gắn chặt trên đỉnh (Sticky Timer), ma trận câu hỏi hỗ trợ nhảy nhanh, tự động lưu câu trả lời vào sessionStorage.

```
+-----------------------------------------------------------------------------------------+
| [Bài thi: Kiểm tra giữa kỳ Lập trình Web]             ⏱️ Thời gian còn lại: [ 24:18 ]   |
| Tổng số: 20 câu hỏi | Điểm đạt: 6.0/10                [ Nộp bài kiểm tra ]             |
+---------------------------------------------------------+-------------------------------+
| CÂU HỎI 8 / 20: (0.5 điểm)                              | BẢNG CÂU HỎI                  |
|                                                         +-------------------------------+
| Phương thức HTTP nào sau đây là Idempotent và thường    | [ 1✓] [ 2✓] [ 3✓] [ 4✓] [ 5✓] |
| được sử dụng để cập nhật toàn bộ một tài nguyên?        | [ 6✓] [ 7✓] [ 8▶] [ 9 ] [10 ] |
|                                                         | [11 ] [12 ] [13 ] [14 ] [15 ] |
| ( ) A. POST                                             | [16 ] [17 ] [18 ] [19 ] [20 ] |
| (•) B. PUT                                              |                               |
| ( ) C. PATCH                                            | Chú thích:                    |
| ( ) D. CONNECT                                          | • [✓] Đã chọn đáp án (7)      |
|                                                         | • [▶] Đang làm (Câu 8)        |
| [ Gắn cờ xem lại 🚩 ]                                   | • [ ] Chưa làm (12)           |
|                                                         |                               |
| [ < Câu trước ]                       [ Câu tiếp theo > ] | [===== NỘP BÀI THI =====]     |
+---------------------------------------------------------+-------------------------------+
```

---

### WF-07: Màn hình Nộp Bài tập của Học viên (SCR-16 — Route: `/student/assignments/:id`)

Khu vực kéo thả nộp file bài làm kết nối trực tiếp S3 Presigned URL, hiển thị thời hạn và phản hồi của giảng viên. Tuân thủ whitelist bảo mật tuyệt đối.

```
+-----------------------------------------------------------------------------------------+
| [<- Quay lại lớp học]   BÀI TẬP VỀ NHÀ: THIẾT KẾ RESTFUL API CHO EDUVERSE               |
+---------------------------------------------------------+-------------------------------+
| THÔNG TIN BÀI TẬP                                       | TRẠNG THÁI NỘP BÀI             |
|                                                         +-------------------------------+
| • Lớp học: D20-KTPM01                                   | Trạng thái:  [ ĐÃ NỘP BÀI ]   |
| • Giảng viên: ThS. Nguyễn Văn A                         | Điểm số:     [ 9.5 / 10 ]     |
| • Hạn nộp:    23:59 - 30/09/2026 (Còn 4 ngày)           | Thời gian:   28/09 14:20      |
|                                                         +-------------------------------+
| 📋 Yêu cầu đề bài:                                      | FILE ĐÃ NỘP:                  |
| 1. Xây dựng tối thiểu 5 endpoints RESTful chuẩn HTTP.   | 📄 [bt_nhom1_restapi.zip]     |
| 2. Có middleware xác thực JWT và kiểm tra role.         | Dung lượng: 4.8 MB (Amazon S3)|
| 3. Đính kèm file nén mã nguồn và ảnh chụp Postman test. | [ Tải về ]   [ Nộp lại file ] |
|                                                         +-------------------------------+
| 📤 Nộp bài tập mới:                                     | 💬 NHẬN XÉT CỦA GIẢNG VIÊN:   |
| +-----------------------------------------------------+ | "Bài làm rất xuất sắc, code   |
| |             ☁️ KÉO & THẢ FILE VÀO ĐÂY                | | chuẩn ES Modules, validation  |
| |         hoặc [ Chọn file từ máy tính ]              | | Joi chặt chẽ. Cần chú ý thêm  |
| | (Hỗ trợ .pdf, .docx, .zip, .png, .jpg, .webp        | | trường hợp phân trang API."   |
| |  Tối đa 25MB theo MAX_UPLOAD_SIZE)                  | | — ThS. Nguyễn Văn A           |
| +-----------------------------------------------------+ |                               |
| [ Ghi chú cho giảng viên: Nhóm em đã bổ sung Swagger ]  |                               |
| [================== GỬI BÀI NỘP ==================]     |                               |
+---------------------------------------------------------+-------------------------------+
```

---

### WF-08: Trình Quản lý Đề cương Khóa học của Giảng viên (SCR-21 — Route: `/teacher/courses/:id/curriculum`)

Giao diện quản lý cấu trúc cây 3 cấp (Khóa học $\rightarrow$ Chương $\rightarrow$ Bài học) hỗ trợ thêm, sửa, xóa bài học và xuất bản gửi duyệt.

```
+-----------------------------------------------------------------------------------------+
| [<- Khóa học]  Khóa: Lập trình Web Fullstack (Express & React)    Trạng thái: [ BẢN NHÁP ]|
| [ + Thêm Chương mới ]        [ Xem trước học viên ]       [ 🚀 GỬI DUYỆT KHÓA HỌC ]     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
| 📁 CHƯƠNG 1: TỔNG QUAN VÀ KHỞI TẠO MÔI TRƯỜNG                     [ Sửa ] [ Xóa ] [ ⇅ ] |
|   ├── 📄 Bài 1.1: Giới thiệu Node.js & NPM (Video 15p)            [ Sửa ] [ Xóa ] [ ⇅ ] |
|   ├── 📄 Bài 1.2: Cấu hình ESLint & Babel (Văn bản)               [ Sửa ] [ Xóa ] [ ⇅ ] |
|   └── [ + Thêm Bài học vào Chương 1 ]                                                   |
|                                                                                         |
| 📁 CHƯƠNG 2: XÂY DỰNG BACKEND EXPRESS.JS & SEQUELIZE              [ Sửa ] [ Xóa ] [ ⇅ ] |
|   ├── 📄 Bài 2.1: Kết nối PostgreSQL & Migration (Video 25p)      [ Sửa ] [ Xóa ] [ ⇅ ] |
|   ├── 📄 Bài 2.2: Thiết kế RESTful API chuẩn REST (Video 30p)     [ Sửa ] [ Xóa ] [ ⇅ ] |
|   ├── ❓ Bài 2.3: Bài kiểm tra trắc nghiệm CSDL (15 câu)          [ Sửa ] [ Xóa ] [ ⇅ ] |
|   └── [ + Thêm Bài học vào Chương 2 ]                                                   |
|                                                                                         |
| [ + Thêm Chương học mới ]                                                               |
+-----------------------------------------------------------------------------------------+
```

---

### WF-09: Bộ Sinh Câu hỏi Trắc nghiệm Tự động bằng AI (SCR-25 — Route: `/teacher/quizzes/ai-generator`)

Tích hợp Google Gemini API: Giảng viên chọn bài học $\rightarrow$ AI sinh trắc nghiệm tự động $\rightarrow$ Giảng viên review và lưu vào đề thi.

```
+-----------------------------------------------------------------------------------------+
| 🤖 BỘ SINH CÂU HỎI TRẮC NGHIỆM TỰ ĐỘNG BẰNG AI (GOOGLE GEMINI)                          |
+-----------------------------------------------------------------------------------------+
| BƯỚC 1: CẤU HÌNH THÔNG TIN ĐẦU VÀO                                                      |
| • Chọn Khóa học: [ Lập trình Web Fullstack                    ▼ ]                       |
| • Chọn Bài học:  [ Bài 2.2: Thiết kế RESTful API chuẩn REST   ▼ ]                       |
| • Số lượng câu:  [ 5 câu trắc nghiệm  ▼ ]    Độ khó: [ Trung bình   ▼ ]                 |
|                                                                                         |
| [ ✨ BẮT ĐẦU SINH CÂU HỎI VỚI GEMINI AI ]                                               |
+-----------------------------------------------------------------------------------------+
| BƯỚC 2: KẾT QUẢ AI SINH ĐỀ — GIẢNG VIÊN KIỂM DUYỆT & TINH CHỈNH                        |
|                                                                                         |
| +-------------------------------------------------------------------------------------+ |
| | CÂU HỎI 1: Mã trạng thái HTTP nào biểu thị tạo tài nguyên mới thành công?           | |
| | ( ) A. 200 OK                                                                       | |
| | (•) B. 201 Created   [✓ Đáp án đúng]                                                | |
| | ( ) C. 204 No Content                                                               | |
| | ( ) D. 400 Bad Request                                                              | |
| | 💡 Giải thích của AI: Mã 201 Created được dùng khi POST tạo thành công bản ghi mới.  | |
| |                                                [ ✏️ Chỉnh sửa ]  [ 🗑️ Bỏ câu này ]   | |
| +-------------------------------------------------------------------------------------+ |
| | CÂU HỎI 2: Thuộc tính nào trong JWT lưu trữ thời điểm hết hạn của token?            | |
| | (•) A. exp           [✓ Đáp án đúng]                                                | |
| | ( ) B. iat                                                                          | |
| | ( ) C. sub                                                                          | |
| |                                                [ ✏️ Chỉnh sửa ]  [ 🗑️ Bỏ câu này ]   | |
| +-------------------------------------------------------------------------------------+ |
|                                                                                         |
| [ 🔄 Sinh lại bằng AI ]           [ 💾 LƯU BỘ CÂU HỎI VÀO ĐỀ THI ]                      |
+-----------------------------------------------------------------------------------------+
```

---

### WF-10: Giao diện Chấm Bài tập của Giảng viên (SCR-27 — Route: `/teacher/assignments/:id/grade`)

Cột trái hiển thị danh sách sinh viên nộp bài; Cột phải mở tài liệu và form nhập điểm kèm lời phê trực quan.

```
+-----------------------------------------------------------------------------------------+
| [<- Quay lại Bài tập]  Chấm bài tập: Thiết kế RESTful API (Lớp D20-KTPM01)              |
| Đã nộp: 38/40 | Đã chấm: 25/38 | Còn lại: 13 bài cần chấm                               |
+----------------------------------+------------------------------------------------------+
| DANH SÁCH HỌC VIÊN NỘP BÀI       | CHI TIẾT BÀI LÀM CỦA: TRẦN VĂN AN (SV202601)        |
| [ 🔍 Tìm tên, mã SV...        ]  +------------------------------------------------------+
|                                  | • Thời gian nộp: 28/09/2026 15:30 (Đúng hạn)         |
| 🟢 Trần Văn An      [ Đã nộp ] ▶ | • File đính kèm: [ 📥 btap_tranvanan.zip (3.2 MB) ]  |
|    Chưa chấm                     |   (Lưu trữ an toàn trên AWS S3)                      |
| 🟢 Lê Thị Mai       [ Đã nộp ]   |                                                      |
|    Điểm: 9.0                     | 📝 Ghi chú của học viên:                             |
| 🔴 Hoàng Văn Bình   [ Chưa nộp ] | "Thưa thầy, em đã cấu hình đầy đủ test Postman."    |
| 🟢 Phạm Minh Đạt    [ Nộp trễ ]  +------------------------------------------------------+
|    Chưa chấm                     | FORM CHẤM ĐIỂM & NHẬN XÉT:                           |
|                                  | Điểm số (Thang điểm 10):                             |
|                                  | [  8.5  ] / 10                                       |
|                                  |                                                      |
|                                  | Lời phê & Nhận xét của Giảng viên:                   |
|                                  | +--------------------------------------------------+ |
|                                  | | Bài làm tốt, cấu trúc thư mục rõ ràng. Cần bổ sung| |
|                                  | | thêm xử lý catch error ở tầng controller.        | |
|                                  | +--------------------------------------------------+ |
|                                  |                                                      |
|                                  | [ Lưu nháp ]           [ 💾 CÔNG BỐ ĐIỂM & GỬI EMAIL]|
+----------------------------------+------------------------------------------------------+
```

---

### WF-11: Hàng đợi Phê duyệt Khóa học của Quản lý Đào tạo (SCR-30 — Route: `/manager/approvals`)

Màn hình kiểm soát chất lượng nội dung trước khi xuất bản ra toàn hệ thống với bộ lọc danh mục, trạng thái và bảng danh sách khóa học chờ duyệt.

```
+-----------------------------------------------------------------------------------------+
| [Manager Dashboard]   HÀNG ĐỢI PHÊ DUYỆT KHÓA HỌC (3 khóa chờ duyệt)                    |
+-----------------------------------------------------------------------------------------+
| Lọc: [ Tất cả danh mục ▼ ]   [ Sắp xếp: Mới nhất ▼ ]             [ 🔍 Tìm kiếm khóa... ]|
+-----------------------------------------------------------------------------------------+
| KHÓA HỌC                   | GIẢNG VIÊN         | NỘI DUNG         | NGÀY GỬI | THAO TÁC|
+----------------------------+--------------------+------------------+----------+---------+
| Lập trình Web Fullstack    | ThS. Nguyễn Văn A  | 4 Chương, 16 Bài | Hôm nay  | [Kiểm duyệt]|
| Trí tuệ Nhân tạo Cơ bản    | TS. Lê Minh Đức    | 6 Chương, 24 Bài | 24/09    | [Kiểm duyệt]|
| Thiết kế Đồ họa UI/UX      | GV. Phạm Hồng Nhung| 3 Chương, 12 Bài | 22/09    | [Kiểm duyệt]|
+-----------------------------------------------------------------------------------------+
| Hiển thị 1 - 3 trên 3 khóa chờ phê duyệt             [ < Trang trước ] [ 1 ] [ Trang sau > ]|
+-----------------------------------------------------------------------------------------+
```

---

### WF-12: Màn hình Xem Chi tiết & Kiểm duyệt Khóa học (SCR-31 — Route: `/manager/approvals/:id/review`)

Giao diện chuyên sâu cho phép Quản lý Đào tạo thẩm định chi tiết đề cương, nội dung video, bài kiểm tra, tài liệu đính kèm và ra quyết định phê duyệt hoặc từ chối kèm lý do phản hồi (sử dụng Radix UI Dialog hoặc Review Panel).

```
+-----------------------------------------------------------------------------------------+
| [<- Quay lại Hàng đợi]   CHI TIẾT KIỂM DUYỆT KHÓA HỌC: "LẬP TRÌNH WEB FULLSTACK"        |
| Giảng viên: ThS. Nguyễn Văn A | Danh mục: Lập trình CNTT | Dự kiến: Miễn phí            |
+-----------------------------------------------------------------------------------------+
| THÔNG TIN CHUNG & ĐỀ CƯƠNG                                                              |
| • Mô tả khóa học: Đầy đủ, đạt chuẩn khung chương trình đào tạo.                         |
| • Cấu trúc giáo trình: Đầy đủ 4 chương, 16 bài học, 2 bài quiz, 1 bài tập lớn.          |
| • Kiểm tra bản quyền tài liệu đính kèm: Hợp lệ (.zip, .pdf nguồn mở).                   |
|                                                                                         |
| DANH SÁCH BÀI HỌC CẦN REVIEW:                                                           |
| ├── [▶ Xem thử video 1.1] Giới thiệu Node.js & NPM (15p)  -> [✓ Đạt]                    |
| ├── [▶ Xem thử video 2.1] Kết nối CSDL PostgreSQL (25p)   -> [✓ Đạt]                    |
| └── [❓ Xem thử Quiz 2.3] Trắc nghiệm CSDL (15 câu)       -> [✓ Đạt]                    |
|                                                                                         |
| Ý kiến phản hồi / Ghi chú kiểm duyệt:                                                   |
| [ Khóa học đáp ứng đầy đủ yêu cầu chất lượng chuyên môn và sư phạm.                  ]  |
|                                                                                         |
| [ ❌ TỪ CHỐI & YÊU CẦU SỬA ĐỔI ]                [ ✅ PHÊ DUYỆT & XUẤT BẢN KHÓA HỌC ]    |
+-----------------------------------------------------------------------------------------+
```

---

### WF-13: Bảng Quản trị Người dùng & Phân quyền Admin (SCR-35 — Route: `/admin/users`)

Màn hình back-office dành cho Admin tối ưu tìm kiếm, lọc theo 4 vai trò, tạo tài khoản giảng viên/quản lý và khóa/mở khóa tài khoản vi phạm.

```
+-----------------------------------------------------------------------------------------+
| [Admin Console]    QUẢN LÝ NGƯỜI DÙNG & TÀI KHOẢN HỆ THỐNG                              |
| Tổng số: 1,420 tài khoản | 1,350 Học viên | 50 Giảng viên | 15 Quản lý | 5 Admin         |
+-----------------------------------------------------------------------------------------+
| [ 🔍 Nhập email, họ tên, SĐT...             ]  [ Role: Tất cả ▼ ]  [ Trạng thái: Tất cả▼]|
|                                                [ + TẠO TÀI KHOẢN GIẢNG VIÊN / QUẢN LÝ ] |
+-----------------------------------------------------------------------------------------+
| HỌ VÀ TÊN        | EMAIL                  | VAI TRÒ (ROLE)   | TRẠNG THÁI | THAO TÁC    |
+------------------+------------------------+------------------+------------+-------------+
| Nguyễn Văn A     | teacher.a@eduverse.vn  | [Giảng viên    ] | 🟢 Hoạt động| [Sửa] [Khóa]|
| Trần Thị B       | manager.b@eduverse.vn  | [Quản lý Đào tạo] | 🟢 Hoạt động| [Sửa] [Khóa]|
| Lê Văn Học       | hocvien.c@gmail.com    | [Học viên      ] | 🟢 Hoạt động| [Sửa] [Khóa]|
| Phạm Văn Vi Phạm | spammer@gmail.com      | [Học viên      ] | 🔴 ĐÃ KHÓA  | [Sửa] [Mở]  |
+-----------------------------------------------------------------------------------------+
| Hiển thị 1 - 10 trên tổng số 1,420 người dùng        [ < Trang trước ] [ 1 ] 2 3 [ Sau >]|
+-----------------------------------------------------------------------------------------+
```

---

## 3. Trạng thái Phản hồi Giao diện (UI States & Interactions)

Mọi màn hình trên Frontend EduVerse đều tuân thủ 4 trạng thái chuẩn trải nghiệm người dùng (UX):

1. **Loading State (Skeleton Screens):** Khi đang fetching dữ liệu API qua TanStack Query, hiển thị các khối Shimmer Gradient (sử dụng component `<Skeleton />` với class `skeleton-shimmer` / `animate-shimmer` theo Design System). Tuyệt đối không dùng nhấp nháy làm mờ đục `animate-pulse` hay để màn hình trắng trơn.
2. **Empty State:** Khi không có dữ liệu (ví dụ: Học viên chưa ghi danh khóa học nào, Giảng viên chưa có bài tập nào cần chấm), hiển thị hình ảnh minh họa nhẹ nhàng kèm nút kêu gọi hành động: *"Bạn chưa tham gia khóa học nào. [ Khám phá khóa học ngay ]"*.
3. **Error State (Alert Toast):** Sử dụng Toast notification chuẩn hóa qua component nội bộ `components/common/Toast` (triển khai bên dưới bằng thư viện `sonner`) hiển thị góc trên bên phải màn hình khi gặp lỗi (ví dụ: *"Mã lớp học không chính xác"*, *"File tải lên vượt quá giới hạn 25MB"*).
4. **Optimistic Updates & Rollback:** Với các thao tác tương tác nhanh như bấm *"Đánh dấu đã hoàn thành bài học"*, UI cập nhật dấu tick xanh ngay lập tức trước khi server phản hồi để tạo trải nghiệm mượt mà không độ trễ. **Quy tắc bắt buộc:** Nếu mutation thất bại (lỗi mạng hoặc server trả về mã lỗi 4xx/5xx), hệ thống lập tức rollback trạng thái UI về giá trị ban đầu và bắn thông báo `toast.error("Thao tác thất bại, vui lòng thử lại!")`.

---

_Bộ tài liệu Wireframes đã được chuẩn hóa và đồng bộ 100% với `docs/ui/design-system.md` và `docs/ui/frontend-blueprint.md`, làm cơ sở trực tiếp cho AI sinh mã nguồn React SPA tại thư mục `frontend/`._
