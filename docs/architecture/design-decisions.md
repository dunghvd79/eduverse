# 📐 Architecture Decision Records (ADR) — EduVerse

> **Mục đích:** Ghi lại lý do đằng sau từng quyết định kiến trúc quan trọng.  
> **Cập nhật lần cuối:** 25/09/2026  
> **Format:** [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records)

---

## Mục lục

| ADR | Tiêu đề | Trạng thái |
|---|---|---|
| [ADR-001](#adr-001) | Chọn Express.js (JavaScript ES Modules) thay vì NestJS | ✅ Chấp nhận |
| [ADR-002](#adr-002) | Chọn PostgreSQL + Sequelize thay vì MongoDB | ✅ Chấp nhận |
| [ADR-003](#adr-003) | Dùng JWT (Access + Refresh Token) & Cơ chế Token 2 Lớp (DB + Redis) | ✅ Chấp nhận |
| [ADR-004](#adr-004) | Dùng Kiến trúc Phân tầng (Layered Monolith) thay vì Microservices | ✅ Chấp nhận |
| [ADR-005](#adr-005) | Chọn Vite + React (JavaScript) thay vì Next.js | ✅ Chấp nhận |
| [ADR-006](#adr-006) | Dùng Docker Compose thay vì deploy thủ công | ✅ Chấp nhận |
| [ADR-007](#adr-007) | Chọn AWS S3 thay vì Local Disk Storage | ✅ Chấp nhận |
| [ADR-008](#adr-008) | Chọn Google Gemini Flash cho tính năng AI sinh câu hỏi | ✅ Chấp nhận |
| [ADR-009](#adr-009) | Chiến lược Real-time: Polling (Phase 1) & Socket.IO (Phase 2) | ✅ Chấp nhận |

---

## ADR-001

## Chọn Express.js (JavaScript ES Modules) thay vì NestJS

**Ngày:** 21/09/2026 (Cập nhật: 25/09/2026)  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Nhóm cần một backend framework cho Node.js để xây dựng REST API phục vụ hệ thống LMS với 18+ entity, phân quyền RBAC và nhiều module nghiệp vụ. Dự án có 4–5 thành viên với timeline ~2 tháng. Cả nhóm đều đã quen thuộc với **JavaScript thuần** và Express.js. Việc học thêm TypeScript nghiêm ngặt, Decorators và Dependency Injection container của NestJS tiềm ẩn rủi ro lớn gây trễ tiến độ đồ án.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Express.js (JavaScript)** | Rất quen thuộc, nhẹ, tối đa linh hoạt, cộng đồng khổng lồ, cả nhóm code được ngay không cần học mới | Mặc định không áp đặt cấu trúc (cần tự thiết lập kiến trúc chuẩn) |
| **NestJS (TypeScript)** | Cấu trúc Module chặt chẽ, Dependency Injection | Bắt buộc TypeScript, boilerplate nhiều, học ban đầu tốn thời gian, rủi ro trễ deadline |
| **Fastify** | Hiệu năng cao | Ít tài liệu và plugin quen thuộc hơn Express |

### Quyết định

Chọn **Express.js 4.x** chạy trên **Node.js 20** với chuẩn **JavaScript hiện đại (ES Modules: `import/export`)**.

### Lý do

- **Tối ưu năng suất & tiến độ đồ án:** Toàn bộ thành viên bắt tay vào việc ngay lập tức, không tốn thời gian vượt qua rào cản học cú pháp TypeScript/NestJS.
- **Đồng bộ ngôn ngữ toàn diện:** Cả Frontend (React `.jsx`) và Backend (Express `.js`) đều sử dụng chung một chuẩn JavaScript ES6+, dễ dàng chia sẻ logic và hỗ trợ chéo trong nhóm.
- **Khắc phục nhược điểm cấu trúc:** Áp dụng nghiêm ngặt **Kiến trúc 3 lớp phân tầng (Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Models)** và thư viện **Joi** để chuẩn hóa routing, business logic, validation và error handling.
- **Hệ sinh thái phong phú:** Mọi thư viện (Sequelize, jsonwebtoken, ioredis, socket.io, multer, nodemailer) đều có tài liệu và ví dụ JavaScript dồi dào.

### Hệ quả

- Cấu hình `"type": "module"` trong `package.json` để sử dụng `import / export` native.
- Tự thiết lập cấu trúc thư mục 3 lớp và các middleware cốt lõi: `auth.middleware.js`, `role.middleware.js`, `validate.middleware.js`, `error.middleware.js`.
- Cần cài đặt: `express`, `sequelize`, `pg`, `pg-hstore`, `joi`, `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `cors`, `dotenv`, `ioredis`.

---

## ADR-002

## Chọn PostgreSQL + Sequelize thay vì MongoDB

**Ngày:** 21/09/2026 (Cập nhật: 25/09/2026)  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

EduVerse có dữ liệu quan hệ phức tạp: User $\rightarrow$ Course $\rightarrow$ Chapter $\rightarrow$ Lesson $\rightarrow$ Material; User $\rightarrow$ Class $\rightarrow$ Enrollment; Quiz $\rightarrow$ Question $\rightarrow$ Option $\rightarrow$ Attempt. Cần một hệ quản trị CSDL quan hệ vững chắc và một ORM phù hợp với JavaScript/Express.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **PostgreSQL + Sequelize** | ACID, JOIN phức tạp, JSONB, Foreign Key, Sequelize hỗ trợ Model/Association/Migration mạnh mẽ nhất trên JS | Cần thiết kế ERD và định nghĩa Model quan hệ cẩn thận |
| **MongoDB + Mongoose** | Schema-less, dễ setup ban đầu | Khả năng JOIN dữ liệu quan hệ nhiều tầng kém, không phù hợp nghiệp vụ LMS |
| **PostgreSQL + Prisma** | Schema-first, trực quan | Thường tối ưu hơn cho TypeScript, ít linh hoạt bằng Sequelize trong Express JS |

### Quyết định

Chọn **PostgreSQL 16** kết hợp với **Sequelize ORM v6**.

### Lý do

- **Tính toàn vẹn dữ liệu quan hệ:** Đảm bảo toàn vẹn dữ liệu qua Foreign Key constraints (không thể xóa Course khi đã có Enrollment).
- **Sequelize là ORM số 1 cho Express JS:** Định nghĩa Model, Hooks, Transactions, và Associations (`hasMany`, `belongsTo`, `belongsToMany`) cực kỳ tự nhiên trong JavaScript.
- **Hỗ trợ JSONB:** Lưu trữ linh hoạt các cấu trúc tùy biến (quiz options metadata).

### Hệ quả

- Thiết kế models trong `src/models/` và định nghĩa quan hệ tập trung tại `src/models/index.js`.
- Chạy PostgreSQL container qua Docker Compose để đồng nhất môi trường cho cả nhóm.

---

## ADR-003

## Dùng JWT (Access + Refresh Token) & Cơ chế Token 2 Lớp (DB + Redis)

**Ngày:** 21/09/2026 (Cập nhật: 25/09/2026)  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Hệ thống cần cơ chế xác thực cho 4 vai trò (`student`, `teacher`, `training_manager`, `admin`). Frontend là SPA (React) chạy riêng biệt với Backend (Express.js) — cần Auth stateless và phù hợp với REST API.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **JWT (Access + Refresh)** | Stateless, phù hợp SPA + REST API, không cần lưu session phía server, dễ scale | Phải xử lý Refresh Token rotation và blacklist |
| **Session + Cookie** | Đơn giản, dễ invalidate | Cần session store phía server (stateful), khó scale, không phù hợp SPA tách biệt |
| **OAuth2 / Social Login** | Tiện cho user, bảo mật cao | Phức tạp, phụ thuộc bên ngoài, quá mức cần thiết cho đồ án nội bộ |

### Quyết định

Dùng **JWT với cặp Access Token + Refresh Token**, kết hợp kiến trúc **2 lớp (PostgreSQL `user_tokens` + Redis Blacklist)**.

### Chi tiết triển khai

```
Access Token:
  - Thời hạn: 15 phút (ngắn hạn)
  - Lưu: Memory JavaScript (Frontend state) — không lưu LocalStorage để chống XSS
  - Payload: { sub: userId, role, email, iat, exp }

Refresh Token:
  - Thời hạn: 7 ngày (dài hạn)
  - Lưu: HttpOnly, Secure, SameSite=Strict Cookie (chống XSS & CSRF)
  - Quản lý phiên bền vững: Lưu bản ghi băm SHA-256 trong bảng PostgreSQL `user_tokens` qua Sequelize Model `UserToken`
  - Rotation (Xoay vòng): Mỗi lần gọi `/api/v1/auth/refresh-token`, đánh dấu token cũ `is_used = true` và cấp cặp token mới
  - Redis Fast Blacklist: Khi người dùng đăng xuất hoặc token bị xoay vòng, đẩy mã băm vào Redis
    (key: rt_blacklist:<hash>, TTL: 7d) để middleware `auth.middleware.js` kiểm tra tức thì với tốc độ O(1)
```

### Lý do

- **Stateless & Hiệu năng cao:** Access Token xử lý tức thì không truy vấn DB mỗi request.
- **An toàn tuyệt đối:** Cookie HttpOnly bảo vệ Refresh Token khỏi mã độc XSS; cơ chế Token Rotation ngăn chặn triệt để tấn công Replay Attack.
- **Tối ưu hạ tầng (2 lớp):** PostgreSQL đảm bảo dữ liệu phiên không bị mất khi restart server; Redis giúp kiểm tra danh sách đen tốc độ cao không nghẽn database.

### Hệ quả

- Cài đặt thư viện: `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `ioredis`.
- Xây dựng `auth.middleware.js` giải mã token và kiểm tra Redis blacklist trước khi cho phép request đi tiếp.
- Frontend (Axios Interceptors) tự động bắt mã lỗi `401` để gọi refresh token ngầm.

---

## ADR-004

## Dùng Kiến trúc Phân tầng (Layered Monolith) thay vì Microservices

**Ngày:** 21/09/2026 (Cập nhật: 25/09/2026)  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Nhóm 4–5 người, timeline ~2 tháng, cần deliver MVP. Cần quyết định kiến trúc triển khai cho Backend Express.js.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Layered Monolith (Express 3 lớp)** | Deploy 1 service, debug đơn giản, không overhead network giữa service, phù hợp nhóm nhỏ | Cần kỷ luật phân lớp để không viết code lộn xộn |
| **Microservices** | Scale từng service riêng, fault isolation | Cực kỳ phức tạp: service discovery, distributed tracing, inter-service communication, quản lý nhiều repo |
| **Serverless** | Không cần quản lý server | Vendor lock-in, cold start, khó debug local |

### Quyết định

Chọn **Layered Monolith** với Express.js theo mô hình 3 lớp phân tầng: `routes/` $\rightarrow$ `controllers/` $\rightarrow$ `services/` $\rightarrow$ `models/`.

### Lý do

- **"Monolith First":** Martin Fowler khuyến nghị bắt đầu với monolith.
- **Phù hợp timeline:** 2 tháng là vừa vặn để xây dựng và kiểm thử hoàn chỉnh 1 ứng dụng monolithic nguyên khối.
- **Dễ phân chia công việc:** Thành viên A phụ trách controller/service module khóa học, thành viên B phụ trách module bài thi trắc nghiệm...
- **Docker Compose:** Deploy toàn bộ monolith + DB + Redis bằng 1 file compose duy nhất.

### Hệ quả

- Toàn bộ backend code nằm trong 1 project Express duy nhất.
- Phải tuân thủ quy tắc phân lớp: Controller chỉ nhận/trả HTTP, Service xử lý business logic, Model chỉ thao tác CSDL.

---

## ADR-005

## Chọn Vite + React (JavaScript) thay vì Next.js

**Ngày:** 21/09/2026 (Cập nhật: 25/09/2026)  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Frontend cần là SPA (Single Page Application) giao tiếp với Express.js REST API. Nhóm chọn sử dụng **JavaScript thuần (`.jsx`, `.js`)** để đồng bộ với Backend và loại bỏ rào cản strict typing.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Vite + React (JavaScript .jsx)** | Cực nhanh HMR, nhẹ, cấu hình đơn giản, cả nhóm đều thành thạo JavaScript | Không có SSR/SSG sẵn (không cần thiết cho LMS nội bộ) |
| **React (TypeScript .tsx)** | Bắt lỗi type lúc compile | Cú pháp rườm rà hơn, thành viên chưa quen TS dễ gặp lỗi type cản trở tiến độ |
| **Next.js** | SSR/SSG, SEO tốt | Quá phức tạp cho LMS nội bộ, trùng lặp vai trò server với Express |

### Quyết định

Chọn **Vite + React 18 (JavaScript `.jsx` / `.js`)**.

### Lý do

- **Không cần SSR/SSG:** LMS quản lý nội bộ trường học không yêu cầu SEO công cộng — SPA là lựa chọn hoàn hảo.
- **Tách biệt rõ ràng:** Frontend = UI + State only, Backend (Express) = API + Business Logic.
- **Dev speed:** Vite HMR cực nhanh (~50ms), khởi động tức thì.
- **Đồng bộ ngôn ngữ:** Cả Frontend và Backend đều dùng JavaScript ES6+, thuận tiện tối đa cho cả nhóm.

### Hệ quả

- Frontend giao tiếp với Backend **hoàn toàn qua REST API** bằng Axios.
- Routing: dùng `react-router-dom v6`.
- State Management: Sử dụng **TanStack Query (React Query v5)** cho Server State/Cache và **Zustand** cho Client UI & Auth Store.
- Build output: static files → `nginx:alpine` Docker image.

---

## ADR-006

## Dùng Docker Compose thay vì deploy thủ công

**Ngày:** 21/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Dự án cần chạy được trên máy của tất cả thành viên nhóm và dễ dàng demo/chấm bài. Hệ thống có 4 services: Frontend, Backend, PostgreSQL, Redis.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Docker Compose** | 1 lệnh chạy toàn bộ stack, đồng nhất môi trường, dễ demo | Phải học Docker cơ bản |
| **Deploy thủ công** | Đơn giản nếu chỉ 1 người | "Works on my machine", khó setup trên máy khác, khó chấm bài |
| **Kubernetes** | Scale tốt, production-grade | Cực kỳ phức tạp, không cần thiết cho đồ án |
| **Cloud (Heroku/Railway)** | Không cần quản lý infra | Trả phí hoặc free tier hạn chế, cần internet khi demo |

### Quyết định

Chọn **Docker + Docker Compose v2**.

### Chi tiết triển khai

```yaml
# Các service trong docker-compose.yml
services:
  frontend:   # React build → Nginx serve
  backend:    # Express.js app
  postgres:   # PostgreSQL 16
  redis:      # Redis 7
```

### Lý do

- **"One command setup":** `docker compose up -d` → toàn bộ stack chạy ngay.
- **Môi trường đồng nhất:** Cùng version PostgreSQL, Redis trên mọi máy → không có lỗi "chạy được trên máy mình".
- **Offline-friendly:** Chạy local, không cần internet sau khi pull image.
- **Dễ chấm bài:** Giảng viên chỉ cần clone repo + `docker compose up`.
- **Industry standard:** Docker là kỹ năng thực tế, có giá trị học tập.

### Hệ quả

- Mỗi thành viên cần cài Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux).
- `.env` file không được commit lên Git — cần file `.env.example` làm template.
- Volumes để persist PostgreSQL data: `postgres-data:/var/lib/postgresql/data`.
- Health checks cần được cấu hình để backend chờ postgres sẵn sàng trước khi start.

---

## ADR-007

## Chọn AWS S3 thay vì Local Disk Storage

**Ngày:** 22/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

EduVerse cần lưu trữ nhiều loại file: avatar người dùng, tài liệu bài học (PDF, Word), và file nộp bài tập của học viên (ZIP, code, tài liệu). Cần cơ chế lưu trữ an toàn, tin cậy, không làm phình to container và hỗ trợ scale trong thực tế.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **AWS S3** | Tiêu chuẩn doanh nghiệp, mở rộng không giới hạn, hỗ trợ Presigned URL an toàn, tách biệt hoàn toàn khỏi server | Cần tạo tài khoản AWS, phụ thuộc kết nối Internet |
| **Local Disk Storage** | Đơn giản, miễn phí, không cần kết nối mạng | Dễ mất dữ liệu khi xóa container, phình to Docker image, backend phải gánh toàn bộ băng thông upload/download file lớn |
| **Cloudinary** | Tối ưu xử lý ảnh nhanh | Gói miễn phí giới hạn dung lượng, không phù hợp để lưu trữ file tài liệu văn bản / file nộp bài đa định dạng |

### Quyết định

Chọn **AWS S3** với cơ chế **Presigned URL** (thông qua AWS SDK v3 `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).

### Chi tiết triển khai

1. **Upload tài liệu / bài nộp:**
   - Frontend gửi metadata (tên file, dung lượng, MIME type) lên Express.js Backend (`POST /api/v1/uploads/presigned-url`).
   - Backend xác thực quyền hạn, sinh một **Presigned Upload URL** có thời hạn ngắn (15 phút).
   - Frontend thực hiện upload trực tiếp file nhị phân từ trình duyệt lên AWS S3 bằng HTTP `PUT`.
   - Sau khi upload xong, Frontend gửi xác nhận lên Backend để lưu `file_url` vào cơ sở dữ liệu.
2. **Download / Xem tài liệu:**
   - Với file tài liệu nội bộ, Backend sinh Presigned Download URL để đảm bảo chỉ học viên đã ghi danh vào lớp mới có quyền truy cập.

### Lý do

- **Giải phóng băng thông Backend:** Trình duyệt người dùng truyền tải file trực tiếp với AWS S3, server Express.js không phải gánh luồng upload/download dung lượng lớn.
- **Bảo mật tối đa:** Không để lộ AWS Access Key cho phía Client. Kiểm soát chặt chẽ quyền truy cập file qua thời hạn Presigned URL.
- **Chuẩn thực tế doanh nghiệp:** Tích lũy kinh nghiệm làm việc với Cloud Storage IaaS.

### Hệ quả

- Cần cài `@aws-sdk/client-s3` và `@aws-sdk/s3-request-presigner`.
- Cấu hình các biến môi trường: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`.
- Môi trường dev offline có thể mock bằng Presigned URL giả lập hoặc dùng LocalStack khi cần.

---

## ADR-008

## Chọn Google Gemini Flash cho tính năng AI sinh câu hỏi

**Ngày:** 23/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Giảng viên cần tính năng hỗ trợ sinh đề thi trắc nghiệm tự động (Phase 2): từ một đoạn văn bản tóm tắt hoặc nội dung bài giảng, AI tự động phân tích và tạo danh sách câu hỏi trắc nghiệm (Multiple Choice / True-False) kèm đáp án đúng và lời giải thích.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Google Gemini 1.5 Flash** | Free tier cực kỳ rộng rãi (15 requests/phút, 1 triệu token/ngày), tốc độ phản hồi cực nhanh, hỗ trợ tiếng Việt xuất sắc, JSON mode chuẩn xác | Phụ thuộc internet, rate limit 15 RPM nếu request ồ ạt |
| **OpenAI GPT-4o-mini** | Chất lượng câu hỏi rất tốt | Bắt buộc liên kết thẻ thanh toán quốc tế và trả phí ngay từ đầu |
| **Local LLM (Ollama / Llama 3)** | Hoạt động offline, hoàn toàn miễn phí | Đòi hỏi máy tính có card đồ họa GPU rời mạnh, khó triển khai đồng đều cho mọi thành viên và máy chấm bài |

### Quyết định

Chọn **Google Gemini API (`gemini-1.5-flash`)** qua thư viện `@google/generative-ai`.

### Chi tiết triển khai

- Sử dụng cơ chế Structured Outputs (`responseSchema` của Gemini) để ép model trả về dữ liệu chuẩn JSON theo cấu trúc câu hỏi, options, và đáp án.
- Tầng Backend validate kết quả JSON từ Gemini bằng thư viện `zod` trước khi import vào bảng `questions` và `question_options`.

### Lý do

- **Chi phí 0 VNĐ:** Gói miễn phí của Google Gemini 1.5 Flash hoàn toàn đáp ứng nhu cầu phát triển, kiểm thử và demo đồ án.
- **Tiếng Việt tự nhiên:** Khả năng hiểu ngữ cảnh văn bản và tạo câu hỏi bằng tiếng Việt có độ chính xác cao.
- **Tốc độ:** Model Flash có độ trễ cực thấp (< 2 giây cho một bộ 5–10 câu hỏi).

### Hệ quả

- Cần cài `@google/generative-ai`.
- Cấu hình biến môi trường `GEMINI_API_KEY`.
- Backend cần có cơ chế xử lý lỗi (Retry with exponential backoff) khi gặp giới hạn 15 RPM.

---

## ADR-009

## Chiến lược Real-time: Polling (Phase 1) & Socket.IO (Phase 2)

**Ngày:** 24/09/2026 (Cập nhật: 25/09/2026)  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Hệ thống LMS cần thông báo cho học viên khi có bài tập mới, có điểm kiểm tra, hoặc giảng viên cập nhật nội dung. Timeline toàn bộ đồ án là ~2 tháng cho 4–5 thành viên.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Triển khai Socket.IO ngay Phase 1** | Trải nghiệm người dùng tốt nhất, push thông báo tức thì | Tốn thời gian setup socket auth handshake, quản lý rooms/channels, xử lý reconnect |
| **Chỉ dùng HTTP Polling** | Rất đơn giản, không cần cấu hình thêm | Tốn băng thông server nếu poll liên tục, độ trễ nhận thông báo cao |
| **Chiến lược 2 giai đoạn (Staged Rollout)** | Đảm bảo đúng hạn MVP (Phase 1) mà kiến trúc vẫn sẵn sàng nâng cấp lên Socket.IO (Phase 2) | Cần tái cấu trúc nhẹ tầng client khi chuyển đổi |

### Quyết định

Chọn **Chiến lược 2 giai đoạn**:
- **Phase 1 (MVP - Tháng 1 & 2):** Sử dụng HTTP Polling thông qua TanStack Query (refetchInterval 30–60s) cho module thông báo và kiểm tra trạng thái nộp bài.
- **Phase 2 (Hoàn thiện - Tháng 2 & 3):** Triển khai **Socket.IO Server** (`socket.io` gắn vào HTTP server của Express) và `socket.io-client` ở React để push real-time các sự kiện: `notification.new`, `grade.updated`.

### Lý do

- **Quản trị rủi ro tiến độ:** Tránh sa đà vào xử lý hạ tầng kết nối socket trong giai đoạn đầu, dồn lực hoàn thiện các nghiệp vụ cốt lõi (Khóa học, Lớp học, Quiz, Bài tập).
- **Phân tách trách nhiệm:** Tầng socket được tổ chức riêng trong `src/sockets/` của Express, không làm ảnh hưởng đến các service HTTP API hiện tại.

### Hệ quả

- Phase 1 tập trung xây dựng REST API cho notification (`GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`).
- Phase 2 bổ sung package `socket.io` ở Backend Express và `socket.io-client` ở Frontend React.

---

_Cập nhật lần cuối: 25/09/2026_
