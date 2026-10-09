import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { sendError } from './utils/response.js';
import { AppError } from './utils/AppError.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // AppError -> errorMiddleware trả 403 thay vì 500
      callback(new AppError('CORS policy: Origin không được phép truy cập API', 403, 'Forbidden'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request loggers & parsers
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'EduVerse Backend API is healthy and running!',
    data: {
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1', courseRoutes);

// 404 cho route không tồn tại (trả JSON theo Envelope Pattern thay vì trang HTML mặc định của Express)
app.use((req, res) => {
  sendError(res, 404, 'Not Found', `Không tìm thấy API ${req.method} ${req.originalUrl}`);
});

// Centralized Error Handler (Envelope Pattern)
app.use(errorHandler);

export default app;
