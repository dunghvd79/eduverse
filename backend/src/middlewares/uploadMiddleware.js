import { AppError } from '../utils/AppError.js';
import { isMultipart, parseMultipart, collectBody, safeFileName } from '../utils/multipartParser.js';

// Phần thừa của multipart (boundary, tiêu đề các phần, trường chữ) ngoài nội dung tệp
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * Nhận MỘT tệp nhỏ gửi lên dạng multipart/form-data, không cần multer.
 *   req.file   = { fieldname, originalname, mimetype, size, buffer } (hoặc undefined nếu không có tệp)
 *   req.body   = các trường chữ đi kèm (VD: defaultRole), để validateBody kiểm tra tiếp
 * Chỉ dùng cho tệp nhỏ (đọc cả vào bộ nhớ); tệp lớn dùng presigned URL (docs/api/api-uploads.md).
 * Lỗi: 400 khi không phải multipart, sai định dạng, hoặc tệp vượt maxFileBytes.
 */
export const receiveFile = ({ field = 'file', maxFileBytes, tooLargeMessage }) => async (req, res, next) => {
  try {
    const contentType = req.headers['content-type'];
    if (!isMultipart(contentType)) {
      throw new AppError(`Yêu cầu phải gửi dạng multipart/form-data kèm trường "${field}"`, 400, 'Bad Request');
    }
    const maxBody = maxFileBytes + MULTIPART_OVERHEAD_BYTES;
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > maxBody) throw new AppError(tooLargeMessage, 400, 'Bad Request');

    const body = await collectBody(req, maxBody, tooLargeMessage);
    const { fields, files } = parseMultipart(body, contentType);
    const file = files.find((item) => item.field === field);
    if (file) {
      if (file.data.length > maxFileBytes) throw new AppError(tooLargeMessage, 400, 'Bad Request');
      req.file = {
        fieldname: file.field,
        originalname: safeFileName(file.filename),
        mimetype: file.contentType,
        size: file.data.length,
        buffer: file.data
      };
    }
    req.body = fields;
    next();
  } catch (error) {
    next(error);
  }
};

export default { receiveFile };
