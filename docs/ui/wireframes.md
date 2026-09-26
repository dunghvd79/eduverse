# 📐 Wireframes & Bố cục Giao diện — EduVerse

> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 26/09/2026  
> **Trạng thái:** ✅ Đã phê duyệt  
> **Công nghệ giao diện:** React 18 + Vite (JavaScript `.jsx`), Tailwind CSS, Radix UI / Lucide React Icons

---

## 1. Hệ thống Quy chuẩn Thiết kế (Design Foundations)

### 1.1. Grid & Breakpoints (Responsive)

Hệ thống tuân thủ nghiêm ngặt chuẩn responsive cho màn hình Web và Mobile:

| Kích thước | Tên Breakpoint | Độ rộng tối thiểu | Bố cục Layout chính |
|---|---|---|---|
| **Mobile** | `sm` | `< 768px` | 1 cột đơn, Sidebar thu gọn thành Bottom Nav hoặc Drawer menu (Hamburger). |
| **Tablet** | `md` | `768px – 1023px` | 2 cột linh hoạt, Sidebar dạng icon thu gọn (collapsed sidebar). |
| **Desktop** | `lg` / `xl` | `≥ 1024px` | Bố cục chuẩn Dashboard: Sidebar cố định (260px) + Header (64px) + Main Content (12 cột). |

### 1.2. Bảng màu & Kiểu chữ (Color Palette & Typography)

- **Màu chủ đạo (Primary):** Xanh công nghệ C4 `#1168bd` (Tailwind: `blue-600`), Hover `#0d5396` (`blue-700`).
- **Màu nền (Background):** Nền chính `#f8fafc` (`slate-50`), Khối Card `#ffffff` (`white`), Viền `#e2e8f0` (`slate-200`).
- **Màu trạng thái:**
  - Success: `#16a34a` (`green-600`) — Hoàn thành bài học, Đạt quiz, Phê duyệt.
  - Warning: `#eab308` (`yellow-500`) — Chờ duyệt (Pending), Sắp đến hạn nộp bài.
  - Danger: `#dc2626` (`red-600`) — Trễ hạn, Khóa tài khoản, Từ chối phê duyệt.
- **Phông chữ:** `Inter`, `Roboto`, sans-serif.

---

## 2. Wireframes Chi tiết Các Màn hình Cốt lõi

---

### WF-01: Public Landing Page & Khám phá Khóa học (`/`, `/courses`)

Màn hình đón tiếp người dùng với thanh tìm kiếm nổi bật, danh mục phân loại và lưới thẻ khóa học.

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
|  DANH MỤC NỔI BẬT:  [ Tất cả ]  [ Lập trình ]  [ Trí tuệ nhân tạo ]  [ Thiết kế ]      |
+-----------------------------------------------------------------------------------------+
|  KHÓA HỌC PHỔ BIẾN                                                                      |
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
|  [ Trang trước ]   [ 1 ]  [ 2 ]  [ 3 ]  ...  [ 10 ]   [ Trang sau ]                     |
+-----------------------------------------------------------------------------------------+
| Footer: EduVerse © 2026 - Đồ án Liên ngành Đại học | Điều khoản | Chính sách bảo mật    |
+-----------------------------------------------------------------------------------------+
```

---

### WF-02: Màn hình Xác thực & Kích hoạt OTP (`/auth/login`, `/auth/verify-email`)

Bố cục cân đối 2 nửa (Split Layout): Trái là hình ảnh minh họa thương hiệu, Phải là Form nhập liệu có validation tức thì.

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

Modal Xác thực OTP Email (/auth/verify-email):
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

### WF-03: Không gian Học tập của Học viên — Classroom Player (`/student/courses/:id/learn/:lessonId`)

Giao diện học tập tối ưu sự tập trung: Trái/Giữa là nội dung bài học, Phải là cây đề cương chương hồi với trạng thái đã hoàn thành.

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

### WF-04: Giao diện Làm bài Kiểm tra Trắc nghiệm (`/student/quizzes/:id/take`)

Giao diện khóa tập trung (Focus Mode): Đồng hồ đếm ngược gắn chặt trên đỉnh (Sticky Timer), ma trận câu hỏi hỗ trợ nhảy nhanh.

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

### WF-05: Màn hình Nộp Bài tập của Học viên (`/student/assignments/:id`)

Khu vực kéo thả nộp file bài làm kết nối trực tiếp S3 Presigned URL, hiển thị thời hạn và phản hồi của giảng viên.

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
| |       (Hỗ trợ .zip, .rar, .pdf - Tối đa 25MB)       | | trường hợp phân trang API."   |
| +-----------------------------------------------------+ | — ThS. Nguyễn Văn A           |
| [ Ghi chú cho giảng viên: Nhóm em đã bổ sung Swagger ]  |                               |
| [================== GỬI BÀI NỘP ==================]     |                               |
+---------------------------------------------------------+-------------------------------+
```

---

### WF-06: Trình Quản lý Đề cương Khóa học của Giảng viên (`/teacher/courses/:id/curriculum`)

Giao diện quản lý cấu trúc cây 3 cấp (Khóa học $\rightarrow$ Chương $\rightarrow$ Bài học) hỗ trợ kéo thả và xuất bản.

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

### WF-07: Tính năng AI Sinh Câu hỏi Trắc nghiệm Tự động (`/teacher/quizzes/ai-generator`)

Tích hợp Google Gemini API: Giảng viên chọn bài học $\rightarrow$ AI sinh trắc nghiệm $\rightarrow$ Giảng viên review và lưu.

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

### WF-08: Giao diện Chấm Bài tập của Giảng viên (`/teacher/assignments/:id/grade`)

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

### WF-09: Hàng đợi Phê duyệt Khóa học của Quản lý Đào tạo (`/manager/approvals`)

Màn hình kiểm soát chất lượng nội dung trước khi xuất bản ra toàn hệ thống.

```
+-----------------------------------------------------------------------------------------+
| [Manager Dashboard]   HÀNG ĐỢI PHÊ DUYỆT KHÓA HỌC (3 khóa chờ duyệt)                    |
+-----------------------------------------------------------------------------------------+
| Lọc: [ Tất cả danh mục ▼ ]   [ Sắp xếp: Mới nhất ▼ ]             [ 🔍 Tìm kiếm khóa... ]|
+-----------------------------------------------------------------------------------------+
| KHÓA HỌC                   | GIẢNG VIÊN         | NỘI DUNG         | NGÀY GỬI | THAO TÁC|
+----------------------------+--------------------+------------------+----------+---------+
| Lập trình Web Fullstack    | ThS. Nguyễn Văn A  | 4 Chương, 16 Bài | Hôm nay  | [ Duyệt]|
| Trí tuệ Nhân tạo Cơ bản    | TS. Lê Minh Đức    | 6 Chương, 24 Bài | 24/09    | [ Duyệt]|
| Thiết kế Đồ họa UI/UX      | GV. Phạm Hồng Nhung| 3 Chương, 12 Bài | 22/09    | [ Duyệt]|
+-----------------------------------------------------------------------------------------+

Modal Xem chi tiết & Phê duyệt (/manager/approvals/:id/review):
+-----------------------------------------------------------------------------------------+
| CHI TIẾT KIỂM DUYỆT: Khóa học "Lập trình Web Fullstack"                                 |
| Giảng viên: ThS. Nguyễn Văn A | Danh mục: Lập trình CNTT | Dự kiến: Miễn phí            |
+-----------------------------------------------------------------------------------------+
| • Mô tả khóa học: Đầy đủ, đạt tiêu chuẩn.                                               |
| • Kiểm tra giáo trình: Đầy đủ 4 chương, 16 bài học, 2 bài quiz, 1 bài tập lớn.          |
| • Kiểm tra bản quyền tài liệu: Hợp lệ.                                                  |
|                                                                                         |
| Lý do phản hồi (nếu từ chối):                                                           |
| [                                                                                    ]  |
|                                                                                         |
| [ ❌ TỪ CHỐI & YÊU CẦU SỬA ĐỔI ]                [ ✅ PHÊ DUYỆT & XUẤT BẢN KHÓA HỌC ]    |
+-----------------------------------------------------------------------------------------+
```

---

### WF-10: Bảng Quản trị Người dùng & Phân quyền Admin (`/admin/users`)

Màn hình back-office dành cho Admin tối ưu tìm kiếm, lọc theo 4 vai trò, tạo tài khoản giảng viên/quản lý và khóa tài khoản vi phạm.

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

1. **Loading State (Skeleton Screens):** Khi đang fetching dữ liệu API qua TanStack Query, hiển thị các khối màu xám nhấp nháy (`animate-pulse`) mô phỏng hình dạng thực tế của thẻ khóa học hoặc bảng dữ liệu, không dùng màn hình trắng trơn.
2. **Empty State:** Khi không có dữ liệu (ví dụ: Học viên chưa ghi danh khóa học nào, Giảng viên chưa có bài tập nào cần chấm), hiển thị hình ảnh minh họa nhẹ nhàng kèm nút kêu gọi hành động: *"Bạn chưa tham gia khóa học nào. [ Khám phá khóa học ngay ]"*.
3. **Error State (Alert Toast):** Sử dụng Toast notification (thư viện Sonner hoặc Radix Toast) hiển thị góc trên bên phải màn hình khi gặp lỗi (ví dụ: *"Mã lớp học không chính xác"*, *"File tải lên vượt quá giới hạn 25MB"*).
4. **Optimistic Updates:** Với các thao tác nhanh như bấm *"Đánh dấu đã hoàn thành bài học"*, UI cập nhật dấu tick xanh ngay lập tức trước khi server phản hồi để tạo trải nghiệm mượt mà không độ trễ.

---

_Bộ tài liệu Wireframes đã được phê duyệt làm cơ sở xây dựng mã nguồn giao diện React SPA tại thư mục `frontend/`._
