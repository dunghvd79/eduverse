import Joi from 'joi';

/**
 * GET /notifications
 */
export const queryNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  unreadOnly: Joi.boolean().default(false)
});
