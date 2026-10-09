import { S3Client } from '@aws-sdk/client-s3';
import './env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Cấu hình AWS S3.
 * Credentials được SDK tự lấy theo thứ tự chuẩn của AWS:
 *   1. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY trong backend/.env (khi chạy local)
 *   2. IAM Role gắn vào EC2/ECS/Lambda (khi deploy) - nên dùng cách này trên production
 * Vì vậy KHÔNG đọc hay truyền key thủ công ở đây.
 */
let client = null;

export const getS3Config = () => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;

  if (!region || !bucket) {
    throw new AppError(
      'Chưa cấu hình AWS S3 (thiếu AWS_REGION hoặc S3_BUCKET trong backend/.env)',
      500,
      'Internal Server Error'
    );
  }

  return {
    region,
    bucket,
    // Nếu dùng CloudFront hoặc domain riêng, đặt S3_PUBLIC_BASE_URL (không có dấu / cuối)
    publicBaseUrl: (process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, ''),
    uploadUrlExpiresIn: Number(process.env.S3_UPLOAD_URL_EXPIRES_IN) || 300
  };
};

export const getS3Client = () => {
  if (!client) {
    const { region } = getS3Config();
    client = new S3Client({ region });
  }
  return client;
};
