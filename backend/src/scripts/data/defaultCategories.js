/**
 * Danh mục khóa học mặc định (dùng chung cho migrateAndSeed.js và migration thêm bảng categories)
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Lập trình', slug: 'lap-trinh', description: 'Các khóa học về lập trình và phát triển phần mềm.', sort_order: 1 },
  { name: 'Cơ sở dữ liệu', slug: 'co-so-du-lieu', description: 'Thiết kế, truy vấn và quản trị cơ sở dữ liệu.', sort_order: 2 },
  { name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu', description: 'Phân tích dữ liệu, học máy và trí tuệ nhân tạo.', sort_order: 3 },
  { name: 'Thiết kế & UI/UX', slug: 'thiet-ke-ui-ux', description: 'Thiết kế giao diện và trải nghiệm người dùng.', sort_order: 4 },
  { name: 'Ngoại ngữ', slug: 'ngoai-ngu', description: 'Tiếng Anh và các ngoại ngữ khác.', sort_order: 5 }
];

// Khóa học mẫu trong seed được gán vào danh mục này
export const SAMPLE_COURSE_SLUG = 'lap-trinh-web-nodejs-express-react';
export const SAMPLE_COURSE_CATEGORY_SLUG = 'lap-trinh';

export default DEFAULT_CATEGORIES;
