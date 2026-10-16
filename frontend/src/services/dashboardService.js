import api from './api';

// Đặc tả: docs/api/api-dashboard.md - mỗi vai trò một endpoint
export const SERVICE_LABEL = {
  database: 'Cơ sở dữ liệu (PostgreSQL)',
  storage: 'Lưu trữ tệp (S3)',
  ai: 'Gemini AI',
  email: 'Gửi email'
};

// [nhãn, màu chấm trạng thái]
export const SERVICE_STATUS = {
  ok: ['Hoạt động', 'green'],
  degraded: ['Phản hồi chậm', 'orange'],
  down: ['Mất kết nối', 'red'],
  configured: ['Đã cấu hình', 'blue'],
  not_configured: ['Chưa cấu hình', 'gray'],
  dev_console: ['Chế độ dev (in ra console)', 'orange']
};

export const ROLE_LABEL = {
  student: 'Học viên',
  teacher: 'Giảng viên',
  training_manager: 'Quản lý đào tạo',
  admin: 'Quản trị viên'
};

export const dashboardService = {
  student: async () => (await api.get('/dashboard/student')).data,
  teacher: async () => (await api.get('/dashboard/teacher')).data,
  manager: async () => (await api.get('/dashboard/manager')).data,
  admin: async () => (await api.get('/dashboard/admin')).data
};

export default dashboardService;
