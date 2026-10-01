import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

export const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối Neon.tech PostgreSQL (AWS Singapore) thành công 100%!');
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL:', error.message);
    return false;
  }
};

// Run directly check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  testConnection().then((success) => {
    if (success) process.exit(0);
    else process.exit(1);
  });
}
