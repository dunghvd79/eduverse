# EduVerse Frontend (React + Vite) — build ra file tĩnh rồi phục vụ bằng Nginx (ADR-006, ADR-005)

# ---- Giai đoạn 1: build ----
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Giai đoạn 2: Nginx phục vụ file tĩnh + chuyển tiếp /api tới backend ----
FROM nginx:1.27

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
