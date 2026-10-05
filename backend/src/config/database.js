import './env.js';
import { Sequelize } from 'sequelize';

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


