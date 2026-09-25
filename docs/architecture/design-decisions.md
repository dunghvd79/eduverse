# 📐 Architecture Decision Records (ADR) — EduVerse

> **Mục đích:** Ghi lại lý do đằng sau từng quyết định kiến trúc quan trọng.  
> **Cập nhật lần cuối:** 25/09/2026  
> **Format:** [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records)

---

## Mục lục

| ADR | Tiêu đề | Trạng thái |
|---|---|---|
| [ADR-001](#adr-001) | Chọn NestJS thay vì Express/Fastify | ✅ Chấp nhận |
| [ADR-002](#adr-002) | Chọn PostgreSQL thay vì MongoDB | ✅ Chấp nhận |
| [ADR-003](#adr-003) | Dùng JWT (Access + Refresh Token) thay vì Session | ✅ Chấp nhận |
| [ADR-004](#adr-004) | Dùng Modular Monolith thay vì Microservices | ✅ Chấp nhận |
| [ADR-005](#adr-005) | Chọn Vite + React thay vì Next.js | ✅ Chấp nhận |
| [ADR-006](#adr-006) | Dùng Docker Compose thay vì deploy thủ công | ✅ Chấp nhận |

---

## ADR-001

## Chọn NestJS thay vì Express/Fastify

**Ngày:** 21/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Nhóm cần một backend framework cho Node.js để xây dựng REST API phục vụ hệ thống LMS với 18+ entity, phân quyền RBAC, và nhiều module nghiệp vụ phức tạp. Dự án có 4–5 thành viên với kinh nghiệm hỗn hợp và timeline ~2 tháng.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **NestJS** | Modular architecture sẵn có, TypeScript first, Dependency Injection, Decorator-based, tài liệu phong phú, Guards/Pipes/Filters | Học ban đầu tốn thời gian hơn Express |
| **Express.js** | Rất đơn giản, nhẹ, quen thuộc | Không có cấu trúc cố định → code dễ hỗn loạn khi scale lên; thiếu DI, thiếu TypeScript native |
| **Fastify** | Nhanh hơn Express, TypeScript tốt | Ít tài liệu hơn NestJS, cộng đồng nhỏ hơn, team chưa quen |

### Quyết định

Chọn **NestJS**.

### Lý do

- **Cấu trúc Module rõ ràng:** Mỗi nghiệp vụ (auth, users, courses...) là 1 module độc lập → dễ phân công công việc trong nhóm, dễ maintain.
- **TypeScript native:** Giảm lỗi runtime, tích hợp tốt với TypeORM và Decorator pattern.
- **Built-in DI Container:** Quản lý dependency tự động, không cần cài thêm thư viện.
- **Guards & Pipes:** Xử lý Auth/RBAC và validation tập trung, không bị scatter khắp nơi.
- **Tài liệu chất lượng cao:** docs.nestjs.com đủ để team tự học trong project.

### Hệ quả

- Tốn 1–2 ngày để team làm quen với pattern của NestJS (Modules, Controllers, Services, Providers).
- Cần cài thêm `@nestjs/config`, `@nestjs/jwt`, `@nestjs/typeorm`, `@nestjs/websockets`.

---

## ADR-002

## Chọn PostgreSQL thay vì MongoDB

**Ngày:** 21/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

EduVerse có dữ liệu quan hệ phức tạp: User → Course → Chapter → Lesson → Document; User → Class → Enrollment; Quiz → Question → Answer. Cần một database phù hợp để lưu trữ và truy vấn hiệu quả.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **PostgreSQL** | ACID, JOIN phức tạp, JSONB, Foreign Key, miễn phí, enterprise-grade | Setup phức tạp hơn MongoDB |
| **MongoDB** | Schema-less, dễ setup ban đầu | JOIN kém (lookup), không phù hợp dữ liệu quan hệ nhiều tầng, transaction phức tạp hơn |
| **MySQL** | Phổ biến, miễn phí | Ít tính năng hơn PostgreSQL (thiếu JSONB, CTEs kém hơn) |

### Quyết định

Chọn **PostgreSQL 16**.

### Lý do

- **Dữ liệu có quan hệ rõ ràng nhiều tầng:** LMS điển hình là dữ liệu quan hệ — JOIN nhiều bảng là bắt buộc.
- **Foreign Key Constraints:** Đảm bảo tính toàn vẹn dữ liệu (không thể xóa Course khi còn Enrollment).
- **JSONB:** Lưu trữ linh hoạt cho các cấu hình không cố định (quiz options, metadata).
- **Enterprise-grade:** Được dùng trong hầu hết hệ thống LMS thực tế.
- **TypeORM native support:** Tích hợp hoàn hảo với entity decorators.

### Hệ quả

- Cần thiết kế ERD cẩn thận trước khi code (đã có `docs/database/schema.md`).
- Sử dụng TypeORM migrations để quản lý schema thay đổi.
- Chạy qua Docker để đồng nhất môi trường dev.

---

## ADR-003

## Dùng JWT (Access + Refresh Token) thay vì Session

**Ngày:** 21/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Hệ thống cần cơ chế xác thực cho 4 vai trò (Admin, Teacher, Student, Manager). Frontend là SPA (React) chạy riêng biệt với Backend (NestJS) — cần Auth stateless và phù hợp với REST API.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **JWT (Access + Refresh)** | Stateless, phù hợp SPA + REST API, không cần lưu session phía server, dễ scale | Phải xử lý Refresh Token rotation và blacklist |
| **Session + Cookie** | Đơn giản, dễ invalidate | Cần session store phía server (stateful), khó scale, không phù hợp SPA tách biệt |
| **OAuth2 / Social Login** | Tiện cho user, bảo mật cao | Phức tạp, phụ thuộc bên ngoài, quá mức cần thiết |

### Quyết định

Dùng **JWT với cặp Access Token + Refresh Token**.

### Chi tiết triển khai

```
Access Token:
  - Thời hạn: 15 phút
  - Lưu: Memory (biến JS) hoặc sessionStorage
  - Payload: { sub: userId, role, email, iat, exp }

Refresh Token:
  - Thời hạn: 7 ngày
  - Lưu: HttpOnly Cookie (bảo vệ XSS)
  - Rotation: Mỗi lần dùng, cấp token mới + blacklist token cũ
  - Blacklist: Redis (key: rt_blacklist:<hash>, TTL: 7d)
```

### Lý do

- **Stateless:** Backend không cần lưu session → dễ scale horizontal.
- **SPA-friendly:** React gọi API kèm header `Authorization: Bearer <token>`.
- **Tự động gia hạn:** Refresh Token tự cấp lại Access Token khi hết hạn.
- **Bảo mật:** Refresh Token trong HttpOnly Cookie + Blacklist Redis.

### Hệ quả

- Cần cài `@nestjs/jwt`, `passport-jwt`, `@nestjs/passport`.
- Cần Redis để lưu blacklist Refresh Token đã thu hồi.
- Endpoint `/auth/refresh` xử lý rotation logic.
- Phải xử lý edge case: concurrent requests khi token đang refresh.

---

## ADR-004

## Dùng Modular Monolith thay vì Microservices

**Ngày:** 21/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Nhóm 4–5 người, timeline ~2 tháng, cần deliver MVP. Cần quyết định kiến trúc deployment cho Backend.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Modular Monolith** | Deploy 1 service, debug đơn giản, không overhead network giữa service, phù hợp nhóm nhỏ | Khó scale từng phần độc lập khi lớn |
| **Microservices** | Scale từng service riêng, fault isolation | Cực kỳ phức tạp: service discovery, distributed tracing, inter-service communication, quản lý nhiều repo |
| **Serverless** | Không cần quản lý server | Vendor lock-in, cold start, khó debug local |

### Quyết định

Chọn **Modular Monolith** với NestJS modules.

### Lý do

- **"Monolith First":** Martin Fowler khuyến nghị bắt đầu với monolith rồi tách Microservices khi thực sự cần thiết.
- **Timeline:** 2 tháng không đủ để setup và debug Microservices đúng cách.
- **Team size:** 4–5 người không đủ để own nhiều service riêng biệt.
- **NestJS Module = Pre-microservice:** Mỗi NestJS module là một boundary rõ ràng, có thể tách thành microservice sau nếu cần.
- **Docker Compose:** Deploy toàn bộ monolith + DB + Redis bằng 1 file compose.

### Hệ quả

- Toàn bộ backend code nằm trong 1 NestJS app duy nhất.
- Module boundaries phải được tuân thủ nghiêm ngặt (không import chéo service trực tiếp).
- Khi scale sau này: tách module thành NestJS Microservice (thư viện `@nestjs/microservices`).

---

## ADR-005

## Chọn Vite + React thay vì Next.js

**Ngày:** 21/09/2026  
**Trạng thái:** ✅ Chấp nhận  
**Người quyết định:** Team EduVerse

### Bối cảnh

Frontend cần là SPA (Single Page Application) giao tiếp với NestJS REST API. Nhóm đã biết React/JSX cơ bản.

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Vite + React (SPA)** | Cực nhanh HMR, nhẹ, cấu hình đơn giản, team đã quen React | Không có SSR/SSG sẵn (không cần cho LMS nội bộ) |
| **Next.js** | SSR/SSG, SEO tốt, file-based routing | Chồng chéo vai trò với NestJS (đều xử lý routing/API), phức tạp hơn cần thiết, team phải học thêm |
| **Vue 3 + Vite** | Progressive, nhẹ | Team phải học mới hoàn toàn |

### Quyết định

Chọn **Vite + React 18** (SPA thuần).

### Lý do

- **Không cần SSR/SSG:** LMS nội bộ không ưu tiên SEO — không cần Next.js.
- **Tách biệt rõ ràng:** Frontend = UI + State only, Backend (NestJS) = API + Business Logic. Không bị overlap.
- **Dev speed:** Vite HMR cực nhanh (~50ms), tăng năng suất đáng kể so với CRA.
- **Team familiarity:** Không cần học thêm Next.js conventions (App Router, Server Components...).
- **Deploy đơn giản:** Build ra static files → serve bằng Nginx trong Docker.

### Hệ quả

- Frontend giao tiếp với Backend **hoàn toàn qua REST API** (không có API routes riêng).
- Routing: dùng `react-router-dom v6`.
- State Management: sẽ quyết định khi bắt đầu code (candidates: TanStack Query + Zustand).
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
  backend:    # NestJS app
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

_Cập nhật lần cuối: 25/09/2026_
