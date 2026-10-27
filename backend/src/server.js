import './config/env.js';
import app from './app.js';
import { testConnection } from './config/database.js';
import { startEmailWorker, closeEmail } from './services/emailService.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🚀 Đang khởi động EduVerse Backend Server...');
  
  // Test DB connection before listening
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.error('❌ Không thể kết nối Database. Server dừng khởi động.');
    process.exit(1);
  }

  // Worker gửi email (BullMQ + Redis); không có REDIS_URL thì bỏ qua
  await startEmailWorker();

  const server = app.listen(PORT, () => {
    console.log(`✨ EduVerse Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Cổng ${PORT} đang bị chiếm dụng bởi tiến trình khác! Vui lòng tắt tiến trình cũ.`);
    } else {
      console.error('❌ Lỗi khởi động Server:', err);
    }
    process.exit(1);
  });

  // Tắt êm khi Docker/hệ điều hành yêu cầu dừng: đóng cổng, đóng worker + kết nối Redis, rồi thoát
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n🛑 Nhận ${signal}, đang dừng server...`);
    setTimeout(() => process.exit(0), 8000).unref();
    server.close(() => {
      closeEmail().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
