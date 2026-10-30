import { Router } from 'express';
import * as controller from '../controllers/discussionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery, validateIdParam } from '../middlewares/validateMiddleware.js';
import { discussionLimiter } from '../middlewares/rateLimiter.js';
import {
  discussionContentSchema,
  resolveDiscussionSchema,
  queryLessonDiscussionsSchema,
  queryClassDiscussionsSchema
} from '../validations/discussionValidation.js';

const router = Router();

// Router được mount tại /api/v1 (xem app.js) - đặc tả: docs/api/api-discussions.md
// Thứ tự middleware: xác thực -> params -> query/body -> giới hạn tần suất -> controller.
// Quyền chi tiết (học viên của lớp, giảng viên phụ trách, manager/admin, lớp chỉ đọc) kiểm tra trong discussionService.

// Danh sách câu hỏi của một bài học trong lớp | Role: học viên của lớp, GV phụ trách, manager, admin
router.get('/classes/:classId/lessons/:lessonId/discussions', authenticateToken, validateIdParam('classId', 'lessonId'), validateQuery(queryLessonDiscussionsSchema), controller.listLessonDiscussions);
// Đặt câu hỏi mới | Role: học viên của lớp, GV phụ trách
router.post('/classes/:classId/lessons/:lessonId/discussions', authenticateToken, validateIdParam('classId', 'lessonId'), validateBody(discussionContentSchema), discussionLimiter, controller.createQuestion);
// Tổng quan thảo luận cả lớp | Role: GV phụ trách, manager, admin
router.get('/classes/:classId/discussions', authenticateToken, validateIdParam('classId'), validateQuery(queryClassDiscussionsSchema), controller.listClassDiscussions);

// Trả lời một câu hỏi gốc | Role: học viên của lớp, GV phụ trách
router.post('/discussions/:id/replies', authenticateToken, validateIdParam(), validateBody(discussionContentSchema), discussionLimiter, controller.createReply);
// Đánh dấu / bỏ đánh dấu "đã giải đáp" ('/resolve' khai báo trước '/:id' chỉ để dễ đọc, khác method nên không xung đột) | Role: người hỏi, GV phụ trách, manager, admin
router.patch('/discussions/:id/resolve', authenticateToken, validateIdParam(), validateBody(resolveDiscussionSchema), controller.setResolved);
// Sửa nội dung bài của mình | Role: tác giả
router.patch('/discussions/:id', authenticateToken, validateIdParam(), validateBody(discussionContentSchema), controller.updateDiscussion);
// Xóa mềm bài thảo luận | Role: tác giả, GV phụ trách, manager, admin
router.delete('/discussions/:id', authenticateToken, validateIdParam(), controller.deleteDiscussion);

export default router;
