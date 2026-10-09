import Joi from 'joi';
import { sendError } from '../utils/response.js';

/**
 * Validation Middleware dùng chung cho mọi module.
 * Một request có 3 nguồn dữ liệu đầu vào, mỗi nguồn có một middleware riêng:
 *   - req.body   -> validateBody(schema)
 *   - req.query  -> validateQuery(schema)
 *   - req.params -> validateParams(schema) / validateIdParam(...names)
 * Dữ liệu sai bị chặn bằng 400 ngay tại tầng route, không đi xuống controller/service/database.
 */

const JOI_OPTIONS = { abortEarly: false, stripUnknown: true };

const toErrorDetails = (error) => error.details.map((detail) => detail.message);

/**
 * Validate req.body. Dữ liệu sau khi validate (đã trim, ép kiểu, bỏ trường lạ) được ghi đè lại vào req.body.
 */
export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body ?? {}, JOI_OPTIONS);
  if (error) {
    return sendError(res, 400, 'Bad Request', 'Dữ liệu gửi lên không hợp lệ', toErrorDetails(error));
  }
  req.body = value;
  next();
};

/**
 * Validate req.query.
 * Express 5: req.query là getter chỉ đọc -> ghi đè bằng defineProperty thay vì gán `req.query = ...`.
 * Lưu ý: tham số lặp lại (?search=a&search=b) sẽ thành mảng và bị Joi.string() chặn bằng 400.
 */
export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query ?? {}, JOI_OPTIONS);
  if (error) {
    return sendError(res, 400, 'Bad Request', 'Tham số truy vấn không hợp lệ', toErrorDetails(error));
  }
  Object.defineProperty(req, 'query', { value, writable: true, configurable: true, enumerable: true });
  next();
};

/**
 * Validate req.params (tham số trên đường dẫn, VD: /users/:id).
 * Không dùng stripUnknown để không làm mất params của router cha.
 */
export const validateParams = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.params ?? {}, { abortEarly: false, allowUnknown: true });
  if (error) {
    return sendError(res, 400, 'Bad Request', 'Tham số đường dẫn không hợp lệ', toErrorDetails(error));
  }
  next();
};

/**
 * Schema UUID cho một tham số đường dẫn
 */
export const uuidParam = (name) =>
  Joi.string().uuid().required().messages({
    'string.guid': `Mã định danh "${name}" không hợp lệ (phải là UUID)`,
    'any.required': `Thiếu tham số "${name}"`
  });

/**
 * Schema cho tham số chấp nhận UUID hoặc slug (VD: GET /courses/:id nhận cả id lẫn slug)
 */
export const uuidOrSlugParam = (name) =>
  Joi.alternatives()
    .try(Joi.string().uuid(), Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(255))
    .required()
    .messages({
      'alternatives.match': `Tham số "${name}" phải là UUID hoặc slug hợp lệ`,
      'any.required': `Thiếu tham số "${name}"`
    });

/**
 * Kiểm tra các tham số đường dẫn là UUID. Mặc định kiểm tra ':id'.
 * VD: validateIdParam()                      -> kiểm tra :id
 *     validateIdParam('classId', 'lessonId') -> kiểm tra :classId và :lessonId
 */
export const validateIdParam = (...names) => {
  const paramNames = names.length > 0 ? names : ['id'];
  const schema = Joi.object(Object.fromEntries(paramNames.map((name) => [name, uuidParam(name)])));
  return validateParams(schema);
};

/**
 * Kiểm tra tham số đường dẫn là UUID hoặc slug (mặc định ':id').
 * Dùng cho route tra cứu được bằng cả hai, VD: GET /courses/:id
 */
export const validateIdOrSlugParam = (name = 'id') =>
  validateParams(Joi.object({ [name]: uuidOrSlugParam(name) }));

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateIdParam,
  validateIdOrSlugParam,
  uuidParam,
  uuidOrSlugParam
};
