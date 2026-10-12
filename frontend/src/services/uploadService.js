import api from './api';

// MIME chuẩn theo phần mở rộng - phải khớp backend (uploadService.MIME_BY_EXTENSION).
// Không dùng file.type vì mỗi trình duyệt/hệ điều hành báo khác nhau (VD: zip trên Windows, rar thường rỗng),
// mà Content-Type khi PUT phải trùng 100% với lúc xin URL, nếu không S3 trả 403 SignatureDoesNotMatch.
const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar'
};

export const getFileExtension = (fileName = '') =>
  fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

export const uploadService = {
  /**
   * Upload tệp theo quy trình api-uploads.md: xin Presigned URL -> PUT thẳng lên S3.
   * Trả về { fileKey, publicUrl, isPublic } để gọi API nghiệp vụ lưu vào CSDL.
   */
  uploadFile: async (file, purpose, contextId) => {
    const contentType = MIME_BY_EXTENSION[getFileExtension(file.name)] || file.type;
    const presign = await api.post('/uploads/presigned-url', {
      purpose,
      fileName: file.name,
      fileSize: file.size,
      contentType,
      ...(contextId ? { contextId } : {})
    });
    const { uploadUrl, fileKey, publicUrl, isPublic } = presign.data;

    // Gọi fetch trực tiếp, KHÔNG qua axios `api` để không gửi kèm Authorization header lên S3
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file
    });
    if (!s3Response.ok) {
      throw new Error(`Tải tệp lên máy chủ lưu trữ thất bại (HTTP ${s3Response.status}).`);
    }

    return { fileKey, publicUrl, isPublic };
  }
};

export default uploadService;
