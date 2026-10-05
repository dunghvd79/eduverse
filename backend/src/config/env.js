import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Nạp biến môi trường từ backend/.env và kiểm tra các biến bắt buộc.
 * Mọi module cần process.env phải import file này trước tiên để không phụ thuộc thứ tự import.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}. Kiểm tra file backend/.env`);
}

if (process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET và REFRESH_TOKEN_SECRET không được trùng nhau');
}

export default process.env;
