import * as assignmentService from '../services/assignmentService.js';
import * as zipService from '../services/assignmentZipService.js';
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

const classId = (req) => req.params.classId;
const assignmentId = (req) => req.params.assignmentId;

// ==========================================
// 1. KHUNG BÀI TẬP
// ==========================================
export const getAssignments = handle(200, 'Lấy danh sách bài tập thành công', (req) => assignmentService.getAssignments(req.query, req.user));
export const getAssignment = handle(200, 'Lấy thông tin bài tập thành công', (req) => assignmentService.getAssignmentById(req.params.id, req.user));
export const createAssignment = handle(201, 'Tạo bài tập thành công', (req) => assignmentService.createAssignment(req.body, req.user));
export const updateAssignment = handle(200, 'Cập nhật bài tập thành công', (req) => assignmentService.updateAssignment(req.params.id, req.body, req.user));
export const deleteAssignment = handle(200, 'Xóa bài tập thành công', async (req) => { await assignmentService.deleteAssignment(req.params.id, req.user); });

// ==========================================
// 2. BÀI TẬP CỦA LỚP
// ==========================================
export const getClassAssignments = handle(200, 'Lấy danh sách bài tập của lớp thành công', (req) => assignmentService.getClassAssignments(classId(req), req.user));
export const getClassAssignment = handle(200, 'Lấy chi tiết bài tập lớp thành công', (req) => assignmentService.getClassAssignment(classId(req), assignmentId(req), req.user));
export const scheduleAssignment = handle(200, 'Thiết lập lịch bài tập thành công', (req) => assignmentService.scheduleAssignment(classId(req), assignmentId(req), req.body, req.user));

// ==========================================
// 3. NỘP BÀI
// ==========================================
export const createUploadUrl = handle(200, 'Khởi tạo URL tải tệp S3 thành công', (req) => assignmentService.createSubmissionUploadUrl(classId(req), assignmentId(req), req.user, req.body));
export const confirmSubmission = async (req, res, next) => {
  try {
    const data = await assignmentService.confirmSubmission(classId(req), assignmentId(req), req.user, req.body);
    return sendSuccess(res, 201, data.isLate ? 'Nộp bài tập thành công (Ghi nhận nộp muộn)!' : 'Nộp bài tập thành công!', data);
  } catch (error) {
    next(error);
  }
};
export const getMySubmission = handle(200, 'Lấy thông tin bài nộp thành công', (req) => assignmentService.getMySubmission(classId(req), assignmentId(req), req.user));

// ==========================================
// 4. CHẤM BÀI
// ==========================================
export const getSubmissions = handle(200, 'Lấy danh sách bài nộp thành công', (req) => assignmentService.getSubmissions(classId(req), assignmentId(req), req.user, req.query));
export const getSubmission = handle(200, 'Lấy chi tiết bài nộp thành công', (req) => assignmentService.getSubmissionDetail(req.params.id, req.user));
export const gradeSubmission = handle(200, 'Chấm điểm bài tập thành công', (req) => assignmentService.gradeSubmission(req.params.id, req.user, req.body));
export const requestResubmission = handle(200, 'Đã gửi yêu cầu nộp lại bài tập tới học viên', (req) => assignmentService.requestResubmission(req.params.id, req.user, req.body.reason));
export const bulkGrade = handle(200, 'Chấm điểm hàng loạt thành công', (req) => assignmentService.bulkGrade(classId(req), assignmentId(req), req.user, req.body.grades));

export const downloadAll = async (req, res, next) => {
  try {
    const { statusCode, data } = await zipService.requestDownloadAll(classId(req), assignmentId(req), req.user);
    return statusCode === 202
      ? sendSuccess(res, 202, 'Tác vụ nén file ZIP đang được xử lý trong nền', data)
      : sendSuccess(res, 200, 'Khởi tạo file nén bài nộp thành công', data);
  } catch (error) {
    next(error);
  }
};
export const downloadAllStatus = handle(200, 'Lấy tiến trình nén file thành công', (req) => zipService.getDownloadAllStatus(classId(req), assignmentId(req), req.user, req.query.jobId));
