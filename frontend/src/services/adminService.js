import api from './api';
import { SERVICE_LABEL, SERVICE_STATUS } from './dashboardService';

export { SERVICE_LABEL, SERVICE_STATUS };

export const RESULT_LABEL = { success: ['Thành công', 'green'], failed: ['Thất bại', 'red'] };

export const CATEGORY_TONE = { auth: 'blue', user: 'purple', course: 'orange', system: 'gray' };

export const EMAIL_MODE_LABEL = {
  queue_smtp: 'Hàng đợi BullMQ + SMTP (gửi email thật)',
  queue_log: 'Hàng đợi BullMQ, chỉ in email ra log',
  direct_smtp: 'Gửi SMTP trực tiếp (không hàng đợi)',
  direct_log: 'In email ra log của backend (chưa cấu hình SMTP)'
};

export const SCOPE_LABEL = { email: 'mỗi email', ip: 'mỗi địa chỉ IP', user: 'mỗi người dùng' };

export const PURPOSE_LABEL = {
  avatar: 'Ảnh đại diện',
  course_thumbnail: 'Ảnh bìa khóa học',
  lesson_material: 'Tài liệu bài học'
};

// Lỗi khi tải file: axios trả Blob -> đọc ra JSON envelope để lấy message
const blobError = async (error) => {
  if (error instanceof Blob) {
    try { return JSON.parse(await error.text()); } catch { return { message: 'Không thể xuất nhật ký hệ thống.' }; }
  }
  return error;
};

export const adminService = {
  auditActions: async () => (await api.get('/admin/audit-logs/actions')).data,
  auditLogs: async (params = {}) => (await api.get('/admin/audit-logs', { params })).data,
  settings: async () => (await api.get('/admin/settings')).data,

  /**
   * Tải CSV nhật ký theo bộ lọc hiện tại (tối đa 5.000 dòng mới nhất) và lưu về máy
   */
  exportAuditLogs: async (params = {}) => {
    let blob;
    try {
      blob = await api.get('/admin/audit-logs/export', { params, responseType: 'blob' });
    } catch (error) {
      throw await blobError(error);
    }
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nhat_Ky_He_Thong_${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export default adminService;
