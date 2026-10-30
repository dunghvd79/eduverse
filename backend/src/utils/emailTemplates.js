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

const greeting = (fullName) => (fullName && String(fullName).trim() ? `Chào ${String(fullName).trim()},` : 'Xin chào,');

const wrapHtml = (bodyHtml) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1c2430;max-width:520px">
${bodyHtml}
<p style="color:#6b7686;font-size:13px;margin-top:24px">Email này được gửi tự động từ EduVerse. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
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
