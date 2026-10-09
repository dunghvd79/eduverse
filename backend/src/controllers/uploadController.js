import * as uploadService from '../services/uploadService.js';
import { sendSuccess } from '../utils/response.js';

export const createPresignedUpload = async (req, res, next) => {
  try {
    const data = await uploadService.createPresignedUpload(req.body, req.user);
    return sendSuccess(res, 201, 'Tạo đường dẫn upload thành công', data);
  } catch (error) {
    next(error);
  }
};

export default { createPresignedUpload };
