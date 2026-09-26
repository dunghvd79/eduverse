# Hướng Dẫn Dành Cho AI Assistant (Agent Instructions)

> File này được nạp tự động cho AI trong mỗi phiên làm việc mới.

## 1. Thông Tin Dự Án
- **Tên sản phẩm:** EduVerse (LMS - Nền tảng quản lý khóa học & học trực tuyến)
- **Tên kỹ thuật:** `eduverse`
- **Mục tiêu:** Đồ án liên ngành (Năm 4, Kỳ 1 - 2026), thời gian ~2 tháng, nhóm 4–5 người.
- **Ngôn ngữ hệ thống:** Tiếng Việt hoàn toàn.
- **Nền tảng:** Web responsive (React + Vite, Tailwind CSS + shadcn/ui).

## 2. Tech Stack Cốt Lõi (Phiên bản v2.0)
- **Backend:** Express.js (Node.js 20, JavaScript ES Modules: `import/export`), Sequelize ORM v6, Joi v17, Redis 7 (`ioredis`).
- **Frontend:** React 18 (Vite, JavaScript thuần `.jsx`), Tailwind CSS, shadcn/ui, TanStack Query v5 + Zustand v4, Axios.
- **Services:** AWS S3 (Storage - Presigned URLs), Nodemailer + Gmail (SMTP), Google Gemini API (gemini-1.5-flash).
- **Real-time:** Socket.IO v4 (Phase 2).
- **DevOps:** Docker + Docker Compose.


## 3. Quy Tắc Nghiệp Vụ Bắt Buộc (Critical Business Rules)
1. **Vai trò:** Mỗi người dùng chỉ có **đúng 1 role** (`student`, `teacher`, `training_manager`, `admin`).
2. **Đăng ký:** Chỉ `student` được tự đăng ký tài khoản. Tài khoản `teacher` và các role khác do `admin` tạo.
3. **Khóa học:** Hiện tại miễn phí, nhưng entity `Course` phải có trường `price` (default 0) để mở rộng sau.
4. **Tài liệu dự án:** Quản lý theo chuẩn **Docs-as-Code** trong thư mục `docs/`. Mọi diagram dùng cú pháp **Mermaid**. Không dùng các kiểu diagram chưa phổ biến (như `gitgraph`).

## 4. QUY TRÌNH BẮT BUỘC KHI BẮT ĐẦU MỖI ĐOẠN CHAT MỚI
Khi người dùng mở một phiên làm việc mới, AI PHẢI:
1. Đọc file `docs/project/state.md` để nắm được tiến độ hiện tại, những việc vừa hoàn thành và việc tiếp theo cần làm.
2. Đọc `context-local.md` (nếu có) để biết các ghi chú riêng của phiên làm việc trước.
3. Chào người dùng và tóm tắt ngắn gọn: *"Tôi đã nắm được ngữ cảnh dự án EduVerse. Hiện tại chúng ta đang ở [Giai đoạn hiện tại] và chuẩn bị làm [Task tiếp theo]..."*
