import api from './api';

export const SERVICE_LABEL = {
  database: 'Cơ sở dữ liệu',
  storage: 'Lưu trữ tệp',
  ai: 'AI sinh câu hỏi (Gemini)',
  email: 'Gửi email',
  queue: 'Hàng đợi email (Redis)'
};

// Trạng thái dịch vụ -> [nhãn, màu Badge]
export const SERVICE_STATUS = {
  ok: ['Hoạt động tốt', 'green'],
  configured: ['Đã cấu hình', 'green'],
  degraded: ['Phản hồi chậm', 'orange'],
  local_storage: ['Lưu cục bộ', 'orange'],
  dev_console: ['Chế độ dev', 'orange'],
  not_configured: ['Chưa cấu hình', 'gray'],
  down: ['Mất kết nối', 'red']
};

export const UPLOAD_PURPOSE_LABEL = {
  avatar: 'Ảnh đại diện',
  course_thumbnail: 'Ảnh bìa khóa học',
  lesson_material: 'Tài liệu bài học',
  assignment_submission: 'Bài nộp bài tập (mặc định)'
};

export const LIMIT_SCOPE_LABEL = { email: 'mỗi email', user: 'mỗi người dùng', ip: 'mỗi IP' };

export const ANNOUNCEMENT_TONE = {
  info: ['Thông tin', 'bg-blue-50 text-blue-800 border-blue-200'],
  warning: ['Lưu ý', 'bg-amber-50 text-amber-800 border-amber-200'],
  danger: ['Khẩn', 'bg-red-50 text-red-800 border-red-200']
};

// Cài đặt công khai dùng ở nhiều chỗ (dải thông báo, trang đăng ký): gộp các lần gọi trong 60 giây
let publicCache = null;

export const settingsService = {
  getPublic: async ({ fresh = false } = {}) => {
    if (!fresh && publicCache && publicCache.expiresAt > Date.now()) return publicCache.promise;
    const promise = api.get('/settings/public').then((res) => res.data);
    publicCache = { promise, expiresAt: Date.now() + 60 * 1000 };
    promise.catch(() => { publicCache = null; });
    return promise;
  },
  getAdmin: async () => (await api.get('/settings')).data,
  update: async (payload) => {
    const data = (await api.patch('/settings', payload)).data;
    publicCache = null; // Admin vừa đổi -> lần đọc sau lấy giá trị mới
    return data;
  }
};

export default settingsService;
