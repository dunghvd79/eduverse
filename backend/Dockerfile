# EduVerse Backend (Express 5 + Sequelize) — dùng bởi docker-compose.yml ở thư mục gốc
FROM node:22-slim

WORKDIR /app

# Cài thư viện trước để Docker cache lại khi mã nguồn thay đổi nhưng package*.json không đổi
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Thư mục lưu tệp khi chưa cấu hình S3 (Local Storage fallback); docker-compose gắn volume vào đây
RUN mkdir -p uploads && chown -R node:node /app

# 1000 là user "node" của image node; dùng số để Docker không phải tra /etc/passwd lúc khởi động container
USER 1000:1000

EXPOSE 5000

# Chờ CSDL -> tự khởi tạo CSDL trống -> chạy API (xem src/scripts/dockerStart.js)
CMD ["node", "src/scripts/dockerStart.js"]
