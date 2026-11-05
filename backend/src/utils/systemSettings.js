/**
 * Định nghĩa cài đặt nghiệp vụ Admin sửa được (docs/api/api-settings.md). Hàm thuần, unit test được.
 * Khóa API dùng camelCase, khóa lưu trong bảng system_settings dùng snake_case.
 */

export const ANNOUNCEMENT_TONES = ['info', 'warning', 'danger'];
export const ANNOUNCEMENT_MAX_LENGTH = 300;

export const SETTING_DEFINITIONS = {
  allowSelfRegistration: {
    key: 'allow_self_registration',
    label: 'Cho phép học viên tự đăng ký',
    defaultValue: true
  },
  announcement: {
    key: 'announcement',
    label: 'Thông báo toàn hệ thống',
    defaultValue: { enabled: false, message: '', tone: 'info' }
  }
};

/**
 * Gộp giá trị đã lưu với mặc định: { allowSelfRegistration, announcement }. Khóa lạ trong DB bị bỏ qua.
 */
export const resolveSettings = (storedByKey = {}) => Object.fromEntries(
  Object.entries(SETTING_DEFINITIONS).map(([name, def]) => {
    const stored = storedByKey[def.key];
    const value = stored === undefined
      ? def.defaultValue
      : (typeof def.defaultValue === 'object' ? { ...def.defaultValue, ...stored } : stored);
    return [name, value];
  })
);

/**
 * Phần công khai (không cần đăng nhập): trang đăng ký và dải thông báo trên đầu trang.
 * Thông báo đang tắt hoặc rỗng thì trả null.
 */
export const publicSettingsOf = (settings) => ({
  allowSelfRegistration: settings.allowSelfRegistration,
  announcement: settings.announcement.enabled && settings.announcement.message.trim()
    ? { message: settings.announcement.message.trim(), tone: settings.announcement.tone }
    : null
});

/**
 * Các khóa thực sự thay đổi giữa hai bộ cài đặt: [{ name, key, label, before, after }]
 */
export const diffSettings = (before, after) => Object.entries(SETTING_DEFINITIONS)
  .filter(([name]) => after[name] !== undefined && JSON.stringify(before[name]) !== JSON.stringify(after[name]))
  .map(([name, def]) => ({ name, key: def.key, label: def.label, before: before[name], after: after[name] }));
