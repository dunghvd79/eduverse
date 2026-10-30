import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Config, isS3Configured } from '../config/s3.js';
import { AppError } from '../utils/AppError.js';

export const UPLOAD_URL_EXPIRES_IN = 15 * 60;
export const DOWNLOAD_URL_EXPIRES_IN = 30 * 60;
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

const DOWNLOAD_SECRET = process.env.JWT_SECRET || 'eduverse_storage_secret';

export const getServerBaseUrl = () => {
  return (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');
};

/**
 * Đảm bảo đường dẫn tệp nằm an toàn trong thư mục uploads/, chống directory traversal (../)
 */
export const resolveLocalFilePath = (fileKey) => {
  const normalizedKey = path.normalize(fileKey).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.resolve(UPLOAD_ROOT, normalizedKey);
  if (!fullPath.startsWith(UPLOAD_ROOT)) {
    throw new AppError('Đường dẫn tệp không hợp lệ', 400, 'Bad Request');
  }
  return fullPath;
};

/**
 * Sinh chữ ký HMAC cho link tải tệp bảo mật ở chế độ local
 */
export const createDownloadSignature = (key) => {
  return crypto.createHmac('sha256', DOWNLOAD_SECRET).update(key).digest('hex');
};

export const verifyDownloadSignature = (key, sig) => {
  if (!sig || typeof sig !== 'string') return false;
  const expected = createDownloadSignature(key);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

/**
 * 1. Tạo Presigned PUT URL (S3) hoặc Local Upload URL (Local Storage)
 */
export const createUploadPutUrl = async ({ key, contentType, fileSize }) => {
  if (isS3Configured()) {
    const { bucket } = getS3Config();
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: fileSize });
    return getSignedUrl(getS3Client(), command, { expiresIn: UPLOAD_URL_EXPIRES_IN });
  }

  // Chế độ Local Storage fallback
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/api/v1/uploads/local-put?key=${encodeURIComponent(key)}`;
};

/**
 * 2. Lấy URL công khai cho avatar, thumbnail khóa học
 */
export const getPublicFileUrl = (key) => {
  if (isS3Configured()) {
    const { publicBaseUrl } = getS3Config();
    return `${publicBaseUrl}/${key}`;
  }

  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/uploads/${key}`;
};

/**
 * 3. Kiểm tra tệp đã tồn tại và lấy kích thước (thay thế HeadObject)
 */
export const checkObjectMetadata = async (key) => {
  if (isS3Configured()) {
    const { bucket } = getS3Config();
    try {
      return await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      const status = error.$metadata?.httpStatusCode;
      if (error.name === 'NotFound' || status === 404) return null;
      if (status === 403) {
        throw new AppError('Máy chủ lưu trữ S3 từ chối truy cập (kiểm tra credentials và quyền IAM)', 502, 'Bad Gateway');
      }
      throw error;
    }
  }

  // Chế độ Local Storage
  const fullPath = resolveLocalFilePath(key);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const stats = fs.statSync(fullPath);
  return {
    ContentLength: stats.size,
    LastModified: stats.mtime
  };
};

/**
 * 4. Xóa tệp lưu trữ
 */
export const deleteStorageObject = async (key) => {
  if (isS3Configured()) {
    const { bucket } = getS3Config();
    try {
      await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      console.error(`⚠️ Không xóa được tệp S3 "${key}":`, error.name, error.message);
    }
    return;
  }

  // Chế độ Local Storage
  try {
    const fullPath = resolveLocalFilePath(key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error(`⚠️ Không xóa được tệp cục bộ "${key}":`, error.message);
  }
};

/**
 * Suy ra key lưu trữ từ URL công khai do getPublicFileUrl tạo ra.
 * Trả về null nếu URL không thuộc kho lưu trữ hiện tại (ví dụ avatar preset hoặc ảnh ngoài).
 */
export const getKeyFromPublicUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const base = isS3Configured() ? getS3Config().publicBaseUrl : `${getServerBaseUrl()}/uploads`;
  const prefix = `${base}/`;
  if (!url.startsWith(prefix)) return null;
  try {
    return decodeURIComponent(url.slice(prefix.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
};

/**
 * Dọn ảnh công khai cũ (avatar, thumbnail) sau khi đã đổi sang ảnh mới (api-uploads.md, mục dọn dẹp rác).
 * Chỉ xóa khi key bắt đầu bằng `ownedPrefix` (ví dụ `public/avatars/<userId>_`) để không xóa nhầm tệp của người khác.
 * Không bao giờ ném lỗi: dọn thất bại thì chỉ ghi log, thao tác chính vẫn thành công.
 */
export const deleteReplacedPublicFile = async (oldUrl, newUrl, ownedPrefix) => {
  try {
    if (!oldUrl || oldUrl === newUrl) return;
    const key = getKeyFromPublicUrl(oldUrl);
    if (!key || !key.startsWith(ownedPrefix) || key.includes('..')) return;
    await deleteStorageObject(key);
  } catch (error) {
    console.warn('⚠️ Không dọn được tệp ảnh cũ:', error.message);
  }
};

/**
 * 5. Tạo link tải tệp riêng tư (Presigned GET URL hoặc Signed Local Download)
 */
export const createDownloadGetUrl = async (key, fileName) => {
  if (isS3Configured()) {
    const { bucket } = getS3Config();
    const disposition = `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
    return await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: disposition }),
      { expiresIn: DOWNLOAD_URL_EXPIRES_IN }
    );
  }

  // Chế độ Local Storage
  const baseUrl = getServerBaseUrl();
  const sig = createDownloadSignature(key);
  return `${baseUrl}/api/v1/uploads/local-download?key=${encodeURIComponent(key)}&filename=${encodeURIComponent(fileName)}&sig=${sig}`;
};

export default {
  isS3Configured,
  createUploadPutUrl,
  getPublicFileUrl,
  checkObjectMetadata,
  deleteStorageObject,
  getKeyFromPublicUrl,
  deleteReplacedPublicFile,
  createDownloadGetUrl,
  resolveLocalFilePath,
  verifyDownloadSignature
};
