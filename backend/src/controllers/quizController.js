import * as quizService from '../services/quizService.js';
import * as attemptService from '../services/quizAttemptService.js';
import * as aiService from '../services/aiService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Bọc handler: gọi service rồi trả envelope chuẩn, lỗi chuyển cho errorMiddleware
 */
const handle = (statusCode, message, run) => async (req, res, next) => {
  try {
    const data = await run(req);
    return sendSuccess(res, statusCode, message, data ?? null);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 1. ĐỀ THI
// ==========================================
export const getQuizzes = handle(200, 'Lấy danh sách bài kiểm tra thành công', (req) => quizService.getQuizzes(req.query, req.user));
export const getQuiz = handle(200, 'Lấy thông tin bài kiểm tra thành công', (req) => attemptService.getQuizById(req.params.id, req.user, req.query));
export const createQuiz = handle(201, 'Tạo bài kiểm tra thành công', (req) => quizService.createQuiz(req.body, req.user));
export const updateQuiz = handle(200, 'Cập nhật bài kiểm tra thành công', (req) => quizService.updateQuiz(req.params.id, req.body, req.user));
export const deleteQuiz = handle(200, 'Xóa bài kiểm tra thành công', async (req) => { await quizService.deleteQuiz(req.params.id, req.user); });

// ==========================================
// 2. CÂU HỎI
// ==========================================
export const getQuestions = handle(200, 'Lấy danh sách câu hỏi đề thi thành công', (req) => quizService.getQuestions(req.params.quizId, req.user));
export const createQuestion = handle(201, 'Thêm câu hỏi thành công', (req) => quizService.createQuestion(req.params.quizId, req.body, req.user));
export const bulkCreateQuestions = handle(201, 'Thêm hàng loạt câu hỏi thành công', (req) => quizService.bulkCreateQuestions(req.params.quizId, req.body.questions, req.user));
export const reorderQuestions = handle(200, 'Cập nhật thứ tự câu hỏi thành công', (req) => quizService.reorderQuestions(req.params.quizId, req.body.orders, req.user));
export const bulkUpdateQuestions = handle(200, 'Cập nhật hàng loạt câu hỏi thành công', (req) => quizService.bulkUpdateQuestions(req.params.quizId, req.body, req.user));
export const bulkDeleteQuestions = handle(200, 'Xóa hàng loạt câu hỏi thành công', (req) => quizService.bulkDeleteQuestions(req.params.quizId, req.body.questionIds, req.user));
export const updateQuestion = handle(200, 'Cập nhật câu hỏi thành công', (req) => quizService.updateQuestion(req.params.id, req.body, req.user));
export const deleteQuestion = handle(200, 'Xóa câu hỏi thành công', async (req) => { await quizService.deleteQuestion(req.params.id, req.user); });

// ==========================================
// 3. LÀM BÀI & KẾT QUẢ
// ==========================================
export const startAttempt = async (req, res, next) => {
  try {
    const { resumed, data } = await attemptService.startAttempt(req.params.id, req.user, req.query);
    return resumed
      ? sendSuccess(res, 200, 'Tiếp tục phiên làm bài đang dở', data)
      : sendSuccess(res, 201, 'Bắt đầu làm bài thi thành công', data);
  } catch (error) {
    next(error);
  }
};
export const submitAttempt = handle(200, 'Nộp bài và chấm điểm tự động thành công!', (req) => attemptService.submitAttempt(req.params.attemptId, req.user, req.body.answers));
export const getMyAttempts = handle(200, 'Lấy lịch sử làm bài thi thành công', (req) => attemptService.getMyAttempts(req.params.id, req.user, req.query));
export const getAttempt = handle(200, 'Lấy chi tiết bài làm thành công', (req) => attemptService.getAttemptDetail(req.params.attemptId, req.user));
export const getQuizAttempts = handle(200, 'Lấy danh sách kết quả bài thi thành công', (req) => attemptService.getQuizAttempts(req.params.id, req.user, req.query));

// ==========================================
// 4. ĐỀ THI THEO LỚP
// ==========================================
export const getClassQuizzes = handle(200, 'Lấy danh sách bài kiểm tra của lớp thành công', (req) => attemptService.getClassQuizzes(req.params.id, req.user));
export const updateClassQuiz = handle(200, 'Cập nhật lịch bài kiểm tra của lớp thành công', (req) => attemptService.updateClassQuiz(req.params.id, req.params.quizId, req.body, req.user));

// ==========================================
// 5. GEMINI AI
// ==========================================
export const generateQuestions = handle(200, 'AI sinh danh sách câu hỏi thành công', (req) => aiService.generateQuestions(req.body));
export const regenerateSingle = handle(200, 'AI sinh lại câu hỏi thay thế thành công', (req) => aiService.regenerateSingle(req.body));
