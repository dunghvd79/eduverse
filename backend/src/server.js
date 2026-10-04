import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🚀 Đang khởi động EduVerse Backend Server...');
  
  // Test DB connection before listening
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.error('❌ Không thể kết nối Database. Server dừng khởi động.');
    process.exit(1);
  }

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
}

startServer();
