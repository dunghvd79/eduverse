# EduVerse — Hệ thống Quản lý Khóa học Trực tuyến

> **Đồ án Liên ngành — Năm 4, Kỳ 1 (2026)**

## Giới thiệu

EduVerse là hệ thống quản lý khóa học và hỗ trợ dạy/học trực tuyến, được xây dựng cho các đơn vị đào tạo quy mô vừa và nhỏ. Hệ thống tích hợp AI để hỗ trợ giảng viên xây dựng nội dung học tập.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 18 + Vite (JavaScript `.jsx`), Tailwind CSS + shadcn/ui, TanStack Query + Zustand |
| Backend | Express.js (Node.js 20, ES Modules: `import/export`), Joi Validation, Socket.IO |
| Database & Cache | PostgreSQL 16 + Sequelize ORM, Redis 7 (`ioredis`) |
| File Storage | AWS S3 (Presigned URLs) |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| Email | Nodemailer + Gmail SMTP |
| DevOps | Docker + Docker Compose |

## Cấu trúc Dự án

```
eduverse/
├── docs/               # Tài liệu thiết kế (Docs-as-Code)
│   ├── requirements/   # Phân tích yêu cầu
│   ├── use-cases/      # Use case diagrams & specifications
│   ├── architecture/   # Kiến trúc hệ thống
│   ├── database/       # ERD & schema
│   ├── api/            # API specifications
│   ├── ui/             # Wireframes & mockups
│   ├── sequences/      # Sequence diagrams
│   └── project/        # Quản lý dự án & biên bản họp
├── backend/            # Express.js (Node.js ES Modules) backend
├── frontend/           # React + Vite (.jsx) frontend
└── assets/             # Tài nguyên (logo, hình ảnh, diagrams)
```

## Cài đặt & Chạy

> _Sẽ cập nhật khi bắt đầu code._

## Thành viên nhóm

| MSSV | Họ và Tên | Vai trò |
|---|---|---|
| | | |

## License

Dự án phục vụ mục đích học tập.
