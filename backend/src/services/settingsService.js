import { buildPlatformSettings } from '../utils/platformSettings.js';
import { RATE_LIMIT_RULES } from '../utils/rateLimitRules.js';
import { UPLOAD_PURPOSES } from './uploadService.js';
import { UPLOAD_URL_EXPIRES_IN } from './storageService.js';
import { getSystemStatus } from './dashboardService.js';

/**
 * GET /admin/settings: cấu hình nền tảng chỉ đọc + tình trạng dịch vụ (cùng nguồn với dashboard Admin).
 * Giá trị thật nằm trong biến môi trường (backend/.env hoặc docker-compose.yml) và chỉ đổi được trên máy chủ.
 */
export const getPlatformSettings = async () => {
  const system = await getSystemStatus();
  return {
    ...buildPlatformSettings({
      env: process.env,
      rateLimits: RATE_LIMIT_RULES,
      uploadPurposes: UPLOAD_PURPOSES,
      nodeVersion: process.version,
      uploadUrlExpirySeconds: UPLOAD_URL_EXPIRES_IN
    }),
    system
  };
};

export default { getPlatformSettings };
