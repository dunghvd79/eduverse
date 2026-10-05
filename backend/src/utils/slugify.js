import { Op } from 'sequelize';

/**
 * Convert Vietnamese string with accents to URL friendly slug
 * e.g., "Lập trình Web với React & Node.js" -> "lap-trinh-web-voi-react-nodejs"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate a unique slug for Course model
 */
export async function generateUniqueSlug(title, CourseModel, excludeId = null) {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = 'khoa-hoc';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await CourseModel.findOne({ where, paranoid: false });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export default { slugify, generateUniqueSlug };
