import Joi from 'joi';
import { ANNOUNCEMENT_TONES, ANNOUNCEMENT_MAX_LENGTH } from '../utils/systemSettings.js';

/**
 * PATCH /settings - chỉ gửi khóa muốn đổi
 */
export const updateSettingsSchema = Joi.object({
  allowSelfRegistration: Joi.boolean().messages({ 'boolean.base': 'allowSelfRegistration phải là true hoặc false' }),
  announcement: Joi.object({
    enabled: Joi.boolean(),
    message: Joi.string().trim().allow('').max(ANNOUNCEMENT_MAX_LENGTH)
      .messages({ 'string.max': `Nội dung thông báo tối đa ${ANNOUNCEMENT_MAX_LENGTH} ký tự` }),
    tone: Joi.string().valid(...ANNOUNCEMENT_TONES)
      .messages({ 'any.only': 'Kiểu thông báo phải là info, warning hoặc danger' })
  }).min(1)
}).min(1).messages({ 'object.min': 'Không có cài đặt nào để cập nhật' });
