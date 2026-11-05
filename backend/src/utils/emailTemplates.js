/**
 * Hàm thuần dựng nội dung email (tiêu đề, bản chữ, bản HTML) cho mã OTP và link đặt lại mật khẩu.
 * Mọi dữ liệu người dùng đều được escape trước khi chèn vào HTML. Có unit test: tests/unit/emailTemplates.test.js.
 */

export const OTP_TTL_MINUTES = 10;
export const RESET_TTL_MINUTES = 15;

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);

/** Link đặt lại mật khẩu trỏ về frontend (CLIENT_URL; nếu có nhiều giá trị cách nhau dấu phẩy thì lấy giá trị đầu), token được mã hóa URL. */
export const buildResetLink = (clientUrl, token) => {
  const base = String(clientUrl || '').split(',')[0].trim().replace(/\/+$/, '') || 'http://localhost:5173';
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
};

/** Link trang đăng nhập trỏ về frontend (CLIENT_URL; nhiều giá trị cách nhau dấu phẩy thì lấy giá trị đầu). */
export const buildLoginLink = (clientUrl) => {
  const base = String(clientUrl || '').split(',')[0].trim().replace(/\/+$/, '') || 'http://localhost:5173';
  return `${base}/login`;
};

/** Link trang lớp học của học viên trỏ về frontend (CLIENT_URL; nhiều giá trị cách nhau dấu phẩy thì lấy giá trị đầu). */
export const buildClassLink = (clientUrl, classId) => {
  const base = String(clientUrl || '').split(',')[0].trim().replace(/\/+$/, '') || 'http://localhost:5173';
  return `${base}/student/classes/${encodeURIComponent(classId)}`;
};

const ROLE_LABELS = { student: 'Học viên', teacher: 'Giảng viên', training_manager: 'Quản lý đào tạo', admin: 'Quản trị viên' };

const greeting = (fullName) => (fullName && String(fullName).trim() ? `Chào ${String(fullName).trim()},` : 'Xin chào,');

const DEFAULT_FOOTER = 'Email này được gửi tự động từ EduVerse. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.';

const wrapHtml = (bodyHtml, footer = DEFAULT_FOOTER) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1c2430;max-width:520px">
${bodyHtml}
<p style="color:#6b7686;font-size:13px;margin-top:24px">${escapeHtml(footer)}</p>
</div>`;

/** Email mã OTP kích hoạt tài khoản. */
export const buildOtpEmail = ({ fullName, otp, ttlMinutes = OTP_TTL_MINUTES, resend = false }) => {
  const subject = resend ? `EduVerse: mã xác thực mới ${otp}` : `EduVerse: mã xác thực ${otp}`;
  const text = [
    greeting(fullName),
    '',
    `Mã xác thực để kích hoạt tài khoản EduVerse của bạn là: ${otp}`,
    `Mã có hiệu lực trong ${ttlMinutes} phút. Không chia sẻ mã này cho bất kỳ ai.`,
    '',
    'Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.'
  ].join('\n');
  const html = wrapHtml(
    `<p>${escapeHtml(greeting(fullName))}</p>
<p>Mã xác thực để kích hoạt tài khoản EduVerse của bạn là:</p>
<p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:12px 0">${escapeHtml(otp)}</p>
<p>Mã có hiệu lực trong ${ttlMinutes} phút. Không chia sẻ mã này cho bất kỳ ai.</p>`
  );
  return { subject, text, html };
};

/** Email link đặt lại mật khẩu. */
export const buildResetPasswordEmail = ({ fullName, link, ttlMinutes = RESET_TTL_MINUTES }) => {
  const subject = 'EduVerse: đặt lại mật khẩu';
  const text = [
    greeting(fullName),
    '',
    'Bạn vừa yêu cầu đặt lại mật khẩu tài khoản EduVerse. Mở liên kết sau để đặt mật khẩu mới:',
    link,
    '',
    `Liên kết có hiệu lực trong ${ttlMinutes} phút và chỉ dùng được một lần.`,
    'Nếu bạn không yêu cầu, hãy bỏ qua email này, mật khẩu của bạn không thay đổi.'
  ].join('\n');
  const html = wrapHtml(
    `<p>${escapeHtml(greeting(fullName))}</p>
<p>Bạn vừa yêu cầu đặt lại mật khẩu tài khoản EduVerse.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#0b5cad;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Đặt lại mật khẩu</a></p>
<p style="font-size:13px;color:#6b7686">Nếu nút không bấm được, sao chép liên kết này vào trình duyệt:<br>${escapeHtml(link)}</p>
<p>Liên kết có hiệu lực trong ${ttlMinutes} phút và chỉ dùng được một lần.</p>`
  );
  return { subject, text, html };
};

/** Email thông báo tài khoản do Quản trị viên tạo (có mật khẩu tạm; bắt buộc đổi mật khẩu ở lần đăng nhập đầu). */
export const buildAccountCreatedEmail = ({ fullName, email, tempPassword, role, loginUrl }) => {
  const roleLabel = ROLE_LABELS[role] || 'Người dùng';
  const subject = 'EduVerse: tài khoản của bạn đã được tạo';
  const text = [
    greeting(fullName),
    '',
    `Quản trị viên đã tạo tài khoản EduVerse cho bạn với vai trò ${roleLabel}.`,
    `Email đăng nhập: ${email}`,
    `Mật khẩu tạm thời: ${tempPassword}`,
    `Đăng nhập tại: ${loginUrl}`,
    '',
    'Bạn sẽ được yêu cầu đổi mật khẩu ngay ở lần đăng nhập đầu tiên. Không chia sẻ mật khẩu này cho bất kỳ ai.'
  ].join('\n');
  const html = wrapHtml(
    `<p>${escapeHtml(greeting(fullName))}</p>
<p>Quản trị viên đã tạo tài khoản EduVerse cho bạn với vai trò <b>${escapeHtml(roleLabel)}</b>.</p>
<p>Email đăng nhập: <b>${escapeHtml(email)}</b><br>Mật khẩu tạm thời: <b style="font-family:Consolas,monospace;font-size:17px;letter-spacing:1px">${escapeHtml(tempPassword)}</b></p>
<p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#0b5cad;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Đăng nhập EduVerse</a></p>
<p>Bạn sẽ được yêu cầu đổi mật khẩu ngay ở lần đăng nhập đầu tiên. Không chia sẻ mật khẩu này cho bất kỳ ai.</p>`,
    'Email này được gửi tự động từ EduVerse. Nếu bạn không nhận ra tài khoản này, hãy liên hệ quản trị viên.'
  );
  return { subject, text, html };
};

const oneLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/** Email báo học viên đã được giảng viên/Quản trị viên thêm vào một lớp (BR-022). */
export const buildClassAddedEmail = ({ fullName, className, courseTitle, teacherName, addedByName, classUrl }) => {
  const name = oneLine(className) || 'lớp học';
  const course = oneLine(courseTitle);
  const teacher = oneLine(teacherName);
  const by = oneLine(addedByName) || 'Giảng viên';
  // Tên lớp do người dùng nhập: gộp xuống một dòng và cắt ngắn để không phá tiêu đề thư
  const subject = `EduVerse: bạn đã được thêm vào lớp ${name.length > 100 ? `${name.slice(0, 99)}…` : name}`;
  const text = [
    greeting(fullName),
    '',
    `${by} đã thêm bạn vào lớp "${name}"${course ? ` của khóa học "${course}"` : ''}.`,
    ...(teacher ? [`Giảng viên phụ trách: ${teacher}`] : []),
    `Xem lớp tại: ${classUrl}`,
    '',
    'Nếu bạn không biết lớp học này, hãy liên hệ giảng viên hoặc quản trị viên.'
  ].join('\n');
  const html = wrapHtml(
    `<p>${escapeHtml(greeting(fullName))}</p>
<p>${escapeHtml(by)} đã thêm bạn vào lớp <b>${escapeHtml(name)}</b>${course ? ` của khóa học <b>${escapeHtml(course)}</b>` : ''}.</p>
${teacher ? `<p>Giảng viên phụ trách: ${escapeHtml(teacher)}</p>\n` : ''}<p><a href="${escapeHtml(classUrl)}" style="display:inline-block;background:#0b5cad;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Xem lớp học</a></p>
<p style="font-size:13px;color:#6b7686">Nếu nút không bấm được, sao chép liên kết này vào trình duyệt:<br>${escapeHtml(classUrl)}</p>
<p>Nếu bạn không biết lớp học này, hãy liên hệ giảng viên hoặc quản trị viên.</p>`,
    'Email này được gửi tự động từ EduVerse khi bạn được thêm vào một lớp học.'
  );
  return { subject, text, html };
};
