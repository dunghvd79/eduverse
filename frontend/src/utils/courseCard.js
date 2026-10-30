// Chuyển một khóa học từ API sang dữ liệu mà CourseCard cần
export const toCardCourse = (course) => ({
  id: course.id,
  slug: course.slug,
  title: course.title,
  thumbnail: course.thumbnailUrl,
  lessonCount: `${course.totalLessons || 0} bài học`,
  instructor: course.owner?.fullName || 'Đội ngũ Giảng viên EduVerse',
  price: Number(course.price) === 0 ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')}đ`,
  originalPrice: null,
  rating: '—',
  reviewCount: '0',
  badge: course.category?.name || null,
  badgeType: 'brand'
});