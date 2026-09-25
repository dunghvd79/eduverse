# Hướng dẫn Đóng góp — EduVerse

> Đọc file này trước khi bắt đầu code hoặc viết tài liệu.

---

## 🚀 Bắt đầu nhanh (Onboarding)

### 1. Đọc các tài liệu sau theo thứ tự:

1. [`README.md`](../README.md) — Tổng quan dự án
2. [`docs/architecture/tech-stack.md`](architecture/tech-stack.md) — Tech stack & lý do lựa chọn
3. [`docs/requirements/business-rules.md`](requirements/business-rules.md) — Quy tắc nghiệp vụ phải tuân theo
4. [`docs/project/project-plan.md`](project/project-plan.md) — Tiến độ & phân công hiện tại
5. [`docs/project/git-workflow.md`](project/git-workflow.md) — Quy ước Git _(sẽ bổ sung)_
6. [`docs/project/coding-conventions.md`](project/coding-conventions.md) — Quy ước code _(sẽ bổ sung)_

### 2. Clone & Setup

```bash
git clone https://github.com/dunghvd79/eduverse.git
cd eduverse
# Chi tiết setup sẽ cập nhật khi bắt đầu code
```

---

## 📂 Cấu trúc Thư mục

```
eduverse/
├── docs/               # Tài liệu (Markdown + Mermaid)
│   ├── requirements/   # Yêu cầu & quy tắc nghiệp vụ
│   ├── use-cases/      # Use case diagrams & specs
│   ├── architecture/   # Kiến trúc & tech stack
│   ├── database/       # ERD & schema
│   ├── api/            # API specifications
│   ├── ui/             # Wireframes & mockups
│   ├── sequences/      # Sequence diagrams
│   └── project/        # Kế hoạch, biên bản họp, quy ước
├── backend/            # Express.js (Node 20, ES Modules)
├── frontend/           # React + Vite
└── assets/             # Hình ảnh, logo, diagrams
```

---

## 🔀 Quy ước Git

### Branch

| Loại | Format | Ví dụ |
|---|---|---|
| Tài liệu | `docs/<tên>` | `docs/erd`, `docs/use-cases` |
| Tính năng | `feature/<tên>` | `feature/auth`, `feature/quiz` |
| Sửa bug | `fix/<tên>` | `fix/login-error` |

### Commit Message

| Prefix | Dùng khi | Ví dụ |
|---|---|---|
| `docs:` | Thêm/sửa tài liệu | `docs: add ERD v1` |
| `feat:` | Thêm tính năng | `feat: implement login API` |
| `fix:` | Sửa bug | `fix: validate email format` |
| `refactor:` | Tái cấu trúc | `refactor: extract auth guard` |
| `chore:` | Config, tooling | `chore: add docker-compose` |

### Workflow

1. Tạo branch mới từ `main`
2. Code/viết tài liệu
3. Commit với message đúng format
4. Push và tạo Pull Request
5. Ít nhất 1 người review trước khi merge

---

## 📋 Quy ước Tài liệu

- **Format:** Markdown (.md) + Mermaid diagrams
- **Đặt tên file:** lowercase + dấu gạch ngang (`api-courses.md`)
- **Không dùng tiếng Việt có dấu** trong tên file
- **Tiền tố:** `uc-` (use case), `api-` (API), `seq-` (sequence)

---

## ❓ Có thắc mắc?

Liên hệ nhóm trưởng hoặc tạo Issue trên GitHub.
