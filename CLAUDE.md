# CLAUDE.md — EduVerse

@AGENTS.md

> Thông tin dự án, tech stack, quy tắc nghiệp vụ nằm trong AGENTS.md (import ở trên).
> File này chỉ bổ sung cách làm việc với code. Trả lời người dùng bằng tiếng Việt.

## Bắt đầu phiên
- Chỉ đọc **mục 0** của `docs/project/state.md` (chốt phiên gần nhất); đọc phần còn lại khi task cần.
- Đọc `context-local.md` nếu có (ghi chú riêng máy, không commit).

## Lệnh thường dùng
| Việc | Lệnh (chạy trong thư mục tương ứng) |
|---|---|
| Backend dev (:5000, nodemon) | `cd backend && npm run dev` |
| Frontend dev (:5173, Vite) | `cd frontend && npm run dev` |
| Kiểm tra kết nối DB Neon | `cd backend && npm run db:test` |
| Migration | `cd backend && npm run db:migrate:<categories\|classes\|quizzes\|assignments>` |

- Dev server thường đã chạy sẵn ở :5000/:5173, kiểm tra trước khi khởi động thêm.
- DB dev là **Neon dùng chung**: migration/seed/script test chạy thẳng lên dữ liệu thật của nhóm. Hỏi trước khi chạy migration mới hoặc xóa dữ liệu; tài khoản test đặt dạng `sec-test-*@example.com` và tự dọn sau khi chạy.
- Chưa có test framework. Script test tạm đừng để trong scratchpad (sẽ mất): đặt trong `backend/src/scripts/` hoặc `docs/testing/`.
- Tài khoản seed (mật khẩu `EduVerse@2026`): `admin@`, `manager@`, `teacher.an@` (có lớp), `teacher.binh@` (trống), `student.dung@eduverse.com` — dùng để test thủ công/chụp màn hình, chỉ đọc thì không cần dọn.
- Kiểm tra UI: Python Playwright đã cài (skill `webapp-testing`); `npx vite build --outDir <thư mục tạm>` để kiểm tra build mà không đè `dist/`.

## Kiến trúc backend (`backend/src/`)
`routes → controllers → services → models`, validate bằng Joi trong `validations/`.
- Route mount tại `/api/v1/<resource>` (`app.js`); thứ tự middleware: `authenticateToken` → `authorizeRoles(...)` → `validateIdParam` → `validateQuery`/`validateBody` → controller.
- **Quyền chi tiết** (GV phụ trách lớp, học viên đã ghi danh, chủ khóa học) kiểm tra trong **service**, không chỉ ở route.
- Lỗi nghiệp vụ: `throw new AppError(message, statusCode, error?)` (message trước, status sau) (`utils/AppError.js`); response luôn qua `sendSuccess`/`sendError` (`utils/response.js`) theo `docs/api/api-conventions.md`.
- Thông báo lỗi/thành công cho người dùng viết tiếng Việt.

## Frontend (`frontend/src/`)
- Trang gọi API bằng `useEffect` + `useState` + `toast` (chưa dùng TanStack Query dù đã cài); service tự bóc envelope: `(await api.get(url)).data`.
- UI portal: `components/portal/PortalUI.jsx` (PortalHeader, Card, StatCard, Badge, Table, Progress, LoadError…) + class CSS `.portal-*` trong `index.css`. Formatter: `formatScore`/`formatDateTime` (quizService), `formatDate`/`CLASS_STATUS` (classService) — dùng lại, đừng viết mới.
- `tailwind.config.js` chỉ có breakpoint `md`/`lg`/`xl` (không có `sm`, `2xl`). Màu chữ phụ tối thiểu `slate-500`, chữ tối thiểu 12px.

## Bẫy đã gặp — kiểm tra mỗi khi viết API mới
1. **Express 5:** `req.query` là getter chỉ đọc — không gán `req.query = ...`; dùng `validateQuery` (đã xử lý bằng `defineProperty`).
2. **Lộ dữ liệu theo trạng thái/vai trò:** khóa `draft`/`pending` không được lộ nội dung qua API chương/bài; không trả `videoUrl`, đáp án quiz, file người khác cho học viên chưa ghi danh hoặc không có quyền.
3. Khóa `pending`/`published` bị khóa chỉnh sửa; danh sách "của tôi" phải lọc theo chủ sở hữu (`mine=true`).
4. Reorder (chương/bài/câu hỏi) phải nhận đủ phần tử, không thiếu không thừa.
5. Gemini hay trả 503: luôn đi qua `aiService` (có retry + model dự phòng), không gọi API trực tiếp.
6. **Không chép lại quy tắc nghiệp vụ:** điểm tổng kết dùng `computeGradebook`; "cần chấm" `needsGrading`, hạn nộp `windowOf` (assignmentService); lịch mở đề `availabilityOf`, hết giờ `isExpired` (quizAttemptService). Cần thì `export`, đừng viết lại.
7. Cột `DECIMAL` (`score`, `grade`, `pass_score`) và `COUNT` từ Postgres trả về **chuỗi**: luôn `Number()` trước khi so sánh/tính.

## Tài liệu (Docs-as-Code)
- Thêm/sửa endpoint ⇒ cập nhật `docs/api/api-<module>.md` cùng commit. Đổi schema ⇒ `docs/database/schema.md` + migration mới trong `backend/src/scripts/migrations/` + script `db:migrate:*`.
- Diagram chỉ dùng Mermaid (không `gitgraph`). Quy ước viết docs: `docs/project/docs-conventions.md`.
- Công thức điểm: `docs/requirements/grading-policy.md`; nghiệp vụ: `docs/requirements/business-rules.md`.

## Git
- Quy trình: `docs/project/git-workflow.md`. Làm trên nhánh `feature-<tên>`; `main` chỉ cập nhật qua Pull Request, không push thẳng, không `push --force`. Chỉ commit/push khi người dùng yêu cầu.
- Commit message dạng Conventional Commits: `feat(module): ...`, `fix(...)`, `docs(state): ...`.
- Dùng code của thành viên khác ⇒ thêm `Co-authored-by: <tên> <email>` (vd. khi lấy code của tuanmanh205; email lấy từ `git log`).
- Không bao giờ commit `.env` hoặc key; key chỉ nằm trong `backend/.env` (mẫu: `.env.example`).

## Kết thúc phiên
Khi người dùng chốt phiên: cập nhật mục 0 của `docs/project/state.md` (đã làm / việc người dùng cần tự làm / việc kỹ thuật tiếp theo) và ghi chú riêng vào `context-local.md`.
