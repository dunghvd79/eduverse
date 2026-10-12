import { S3Client } from '@aws-sdk/client-s3';
import './env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Cấu hình AWS S3 (api-uploads.md).
 * S3 là cấu hình TÙY CHỌN: server vẫn khởi động khi thiếu, chỉ các API upload/tài liệu trả 503.
 * Credentials do AWS SDK tự nạp theo credential provider chain:
 *   1. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY trong backend/.env (chạy local)
 *   2. IAM Role gắn vào EC2/ECS (khi deploy) - nên dùng trên production
 */
let client = null;

export const getS3Config = () => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;

  if (!region || !bucket) {
    throw new AppError(
      'Chức năng lưu trữ tệp chưa được cấu hình (thiếu AWS_REGION hoặc S3_BUCKET trong backend/.env)',
      503,
      'Service Unavailable'
    );
  }

  return {
    region,
    bucket,
    // CloudFront hoặc domain riêng cho thư mục public/ (không có dấu / ở cuối)
    publicBaseUrl: (process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/+$/, '')
  };
};

export const getS3Client = () => {
  if (!client) {
    const { region } = getS3Config();
    client = new S3Client({ region });
  }
  return client;
};

export default { getS3Config, getS3Client };
