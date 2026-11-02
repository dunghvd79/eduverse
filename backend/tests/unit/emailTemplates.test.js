import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  OTP_TTL_MINUTES,
  RESET_TTL_MINUTES,
  escapeHtml,
  buildResetLink,
  buildOtpEmail,
  buildResetPasswordEmail,
  buildLoginLink,
  buildAccountCreatedEmail
} from '../../src/utils/emailTemplates.js';

// Nội dung email OTP / đặt lại mật khẩu

describe('escapeHtml', () => {
  test('escape 5 ký tự nguy hiểm', () => {
    assert.equal(escapeHtml(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });

  test('null/undefined thành chuỗi rỗng, số thành chuỗi', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(123456), '123456');
  });
});

describe('buildResetLink', () => {
  test('ghép CLIENT_URL với đường dẫn reset-password', () => {
    assert.equal(buildResetLink('http://localhost:8080', 'abc'), 'http://localhost:8080/reset-password?token=abc');
  });

  test('bỏ dấu / ở cuối', () => {
    assert.equal(buildResetLink('https://eduverse.vn//', 'abc'), 'https://eduverse.vn/reset-password?token=abc');
  });

  test('CLIENT_URL nhiều giá trị (cho CORS) thì lấy giá trị đầu', () => {
    assert.equal(
      buildResetLink('http://localhost:8080, http://localhost:5173', 'abc'),
      'http://localhost:8080/reset-password?token=abc'
    );
  });

  test('thiếu CLIENT_URL thì dùng địa chỉ dev của Vite', () => {
    assert.equal(buildResetLink(undefined, 'abc'), 'http://localhost:5173/reset-password?token=abc');
    assert.equal(buildResetLink('', 'abc'), 'http://localhost:5173/reset-password?token=abc');
  });

  test('token được mã hóa URL', () => {
    assert.equal(buildResetLink('http://h', 'a b&c=d'), 'http://h/reset-password?token=a%20b%26c%3Dd');
  });
});

describe('buildOtpEmail', () => {
  test('tiêu đề có mã OTP để xem ngay ở danh sách thư', () => {
    const mail = buildOtpEmail({ fullName: 'Nguyễn Văn A', otp: '123456' });
    assert.equal(mail.subject, 'EduVerse: mã xác thực 123456');
    assert.match(mail.text, /123456/);
    assert.match(mail.text, /Chào Nguyễn Văn A,/);
    assert.match(mail.text, new RegExp(`${OTP_TTL_MINUTES} phút`));
    assert.match(mail.html, /123456/);
  });

  test('gửi lại: tiêu đề nói là mã mới', () => {
    assert.equal(buildOtpEmail({ fullName: 'A', otp: '654321', resend: true }).subject, 'EduVerse: mã xác thực mới 654321');
  });

  test('thời hạn tùy chỉnh được dùng', () => {
    assert.match(buildOtpEmail({ fullName: 'A', otp: '1', ttlMinutes: 5 }).text, /5 phút/);
  });

  test('thiếu tên thì chào chung, không in "undefined"', () => {
    const mail = buildOtpEmail({ otp: '111111' });
    assert.match(mail.text, /Xin chào,/);
    assert.doesNotMatch(mail.text + mail.html, /undefined|null/);
  });

  test('tên người dùng chứa HTML bị escape trong bản HTML, bản chữ giữ nguyên', () => {
    const mail = buildOtpEmail({ fullName: '<script>alert(1)</script>', otp: '123456' });
    assert.doesNotMatch(mail.html, /<script>/);
    assert.match(mail.html, /&lt;script&gt;/);
    assert.match(mail.text, /<script>/);
  });
});

describe('buildResetPasswordEmail', () => {
  const link = 'http://localhost:8080/reset-password?token=abc&x=1';

  test('chứa link ở cả bản chữ và bản HTML, tiêu đề cố định', () => {
    const mail = buildResetPasswordEmail({ fullName: 'B', link });
    assert.equal(mail.subject, 'EduVerse: đặt lại mật khẩu');
    assert.match(mail.text, /http:\/\/localhost:8080\/reset-password\?token=abc&x=1/);
    assert.match(mail.html, /href="http:\/\/localhost:8080\/reset-password\?token=abc&amp;x=1"/);
    assert.match(mail.text, new RegExp(`${RESET_TTL_MINUTES} phút`));
  });

  test('link độc hại không thoát được khỏi thuộc tính href', () => {
    const mail = buildResetPasswordEmail({ fullName: 'B', link: 'http://h/"><script>x</script>' });
    assert.doesNotMatch(mail.html, /<script>/);
  });
});

describe('buildLoginLink', () => {
  test('trỏ về trang đăng nhập của frontend, bỏ / cuối và lấy giá trị đầu khi có nhiều', () => {
    assert.equal(buildLoginLink('https://eduverse.vn/'), 'https://eduverse.vn/login');
    assert.equal(buildLoginLink('http://localhost:8080, http://localhost:5173'), 'http://localhost:8080/login');
    assert.equal(buildLoginLink(''), 'http://localhost:5173/login');
    assert.equal(buildLoginLink(undefined), 'http://localhost:5173/login');
  });
});

describe('buildAccountCreatedEmail', () => {
  const args = { fullName: 'Nguyễn Văn A', email: 'a@x.vn', tempPassword: 'Ab3$kLm9#Qz2', role: 'teacher', loginUrl: 'http://localhost:8080/login' };

  test('có email đăng nhập, mật khẩu tạm, vai trò, link đăng nhập và lời nhắc đổi mật khẩu', () => {
    const mail = buildAccountCreatedEmail(args);
    assert.equal(mail.subject, 'EduVerse: tài khoản của bạn đã được tạo');
    for (const part of ['Nguyễn Văn A', 'a@x.vn', 'Ab3$kLm9#Qz2', 'Giảng viên', 'http://localhost:8080/login', 'đổi mật khẩu']) {
      assert.ok(mail.text.includes(part), `bản chữ thiếu: ${part}`);
      assert.ok(mail.html.includes(part), `bản HTML thiếu: ${part}`);
    }
  });

  test('mật khẩu không xuất hiện trong tiêu đề (tiêu đề hay hiện ở thông báo màn hình khóa)', () => {
    assert.doesNotMatch(buildAccountCreatedEmail(args).subject, /Ab3/);
  });

  test('mọi dữ liệu người dùng đều bị escape trong HTML', () => {
    const mail = buildAccountCreatedEmail({ ...args, fullName: '<img src=x onerror=1>', email: 'a"b@x.vn', tempPassword: '<b>&', loginUrl: 'http://h/"><script>' });
    assert.doesNotMatch(mail.html, /<img|<script>|<b>&|"b@x/);
    assert.match(mail.html, /&lt;img src=x onerror=1&gt;/);
  });

  test('vai trò lạ vẫn dựng được email; chân thư riêng cho email tạo tài khoản', () => {
    const mail = buildAccountCreatedEmail({ ...args, role: 'khac' });
    assert.match(mail.text, /vai trò Người dùng/);
    assert.match(mail.html, /liên hệ quản trị viên/);
    assert.doesNotMatch(mail.html, /không thực hiện yêu cầu/);
  });

  test('email OTP vẫn giữ chân thư cũ', () => {
    assert.match(buildOtpEmail({ fullName: 'A', otp: '123456' }).html, /không thực hiện yêu cầu này/);
  });
});
