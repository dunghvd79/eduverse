import api from './api';

export const RANKING_TONE = { 'Giỏi': 'green', 'Khá': 'blue', 'Trung bình': 'orange', 'Chưa đạt': 'red' };
export const WEIGHT_LABEL = { quiz: 'Bài kiểm tra', assignment: 'Bài tập', progress: 'Tiến độ' };

export const ASSIGNMENT_STATE = {
  graded: null,
  ungraded: ['Chưa chấm', 'orange'],
  regrade_pending: ['Chờ chấm lại', 'orange'],
  resubmission_requested: ['Yêu cầu nộp lại', 'red'],
  missing: ['Chưa nộp', 'gray']
};

export const formulaText = (weights) =>
  Object.entries(weights).map(([k, w]) => `${Math.round(w * 1000) / 10}% ${WEIGHT_LABEL[k]}`).join(' + ');

// Lỗi khi tải file: axios trả Blob -> đọc ra JSON envelope để lấy message
const blobError = async (error) => {
  if (error instanceof Blob) {
    try { return JSON.parse(await error.text()); } catch { return { message: 'Không thể xuất bảng điểm.' }; }
  }
  return error;
};

export const gradebookService = {
  gradebook: async (classId) => (await api.get(`/classes/${classId}/gradebook`)).data,
  myGrades: async (classId) => (await api.get(`/classes/${classId}/my-grades`)).data,

  /**
   * Tải file bảng điểm (xlsx | csv) và lưu về máy
   */
  exportGrades: async (classId, format, fileBaseName) => {
    let blob;
    try {
      blob = await api.get(`/classes/${classId}/grades/export-excel`, { params: { format }, responseType: 'blob' });
    } catch (error) {
      throw await blobError(error);
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileBaseName}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export default gradebookService;
