import api from './api';

export const SEVERITY = {
  info: ['Thông tin', 'blue'],
  warning: ['Cảnh báo', 'orange'],
  danger: ['Nghiêm trọng', 'red']
};

export const AUDIT_STATUS = {
  success: ['Thành công', 'green'],
  failure: ['Thất bại', 'red']
};

// Lý do đăng nhập thất bại (metadata.reason) -> tiếng Việt
export const LOGIN_FAIL_REASON = {
  unknown_email: 'Email không tồn tại',
  wrong_password: 'Sai mật khẩu',
  account_blocked: 'Tài khoản đang bị khóa',
  email_unverified: 'Chưa xác thực email'
};

// Bỏ tham số rỗng để URL gọn và Joi không báo lỗi chuỗi rỗng
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// Lỗi khi tải file: axios trả Blob -> đọc ra JSON envelope để lấy message
const blobError = async (error) => {
  if (error instanceof Blob) {
    try { return JSON.parse(await error.text()); } catch { return { message: 'Không thể xuất nhật ký.' }; }
  }
  return error;
};

export const auditLogService = {
  list: async (params = {}) => (await api.get('/audit-logs', { params: clean(params) })).data,

  /**
   * Tải CSV theo bộ lọc hiện tại (UC-ADMIN-006), tối đa 10.000 dòng mới nhất
   */
  exportCsv: async (params = {}) => {
    let blob;
    try {
      blob = await api.get('/audit-logs/export', { params: clean({ ...params, format: 'csv' }), responseType: 'blob' });
    } catch (error) {
      throw await blobError(error);
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat-ky-he-thong-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export default auditLogService;
