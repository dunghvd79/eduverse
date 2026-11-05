/**
 * Hàm thuần dựng nội dung thông báo trong chuông khi giảng viên/Quản trị viên thêm học viên vào lớp bằng email
 * (BR-022, UC-CLASS-003, docs/api/api-notifications.md mục 3). Không đụng CSDL nên có unit test:
 * tests/unit/classAddedRules.test.js. Phần ghi vào bảng notifications nằm ở notificationService.notifyClassMemberAdded.
 */

export const CLASS_ADDED_TYPE = 'class_member_added';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * @param {{ classId: string, className: string, courseTitle?: string, addedByName?: string }} input
 * @returns {{ type: string, title: string, message: string, link: string }}
 */
export const buildClassAddedNotice = ({ classId, className, courseTitle, addedByName }) => {
  const name = clean(className) || 'lớp học';
  const course = clean(courseTitle);
  const by = clean(addedByName) || 'Giảng viên';
  return {
    type: CLASS_ADDED_TYPE,
    title: `Bạn đã được thêm vào lớp: ${name}`,
    message: `${by} đã thêm bạn vào lớp "${name}"${course ? ` của khóa học "${course}"` : ''}. Bấm để xem lớp.`,
    link: `/student/classes/${classId}`
  };
};
