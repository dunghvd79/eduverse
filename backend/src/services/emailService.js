import {
  mailModeOf,
  smtpOptionsOf,
  mailFromOf,
  redisConnectionOf
} from '../utils/mailConfig.js';
import { buildOtpEmail, buildResetPasswordEmail, buildResetLink } from '../utils/emailTemplates.js';

/**
 * Gửi email tự động (OTP kích hoạt, link đặt lại mật khẩu) qua hàng đợi BullMQ + Redis và Nodemailer (SMTP).
 * Chọn chế độ theo biến môi trường, xem utils/mailConfig.js. Không cấu hình gì thì in email ra log như trước.
 *
 * Nguyên tắc: gửi email là phần phụ của nghiệp vụ, các hàm gửi KHÔNG BAO GIỜ ném lỗi và không làm chậm API
 * (đăng ký, gửi lại OTP, quên mật khẩu vẫn thành công dù Redis/SMTP lỗi; lỗi chỉ ghi log cảnh báo).
 * bullmq, ioredis và nodemailer chỉ được nạp khi thật sự cấu hình, nên chưa cài thư viện vẫn chạy được ở chế độ log.
 * BullMQ 6 không tự nạp ioredis trong ESM, nên ở đây tự tạo client ioredis rồi truyền vào Queue và Worker.
 */

export const QUEUE_NAME = 'email';
const ENQUEUE_TIMEOUT_MS = 3000;
const WARN_INTERVAL_MS = 60000;
const REDIS_QUIT_TIMEOUT_MS = 2000;

const withTimeout = (promise, ms, message) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(message)), ms);
  promise.then(
    (value) => { clearTimeout(timer); resolve(value); },
    (error) => { clearTimeout(timer); reject(error); }
  );
});

/**
 * Tạo dịch vụ email. Tham số để kiểm thử: env, load (nạp module động), logger.
 */
export const createEmailService = ({
  env = process.env,
  load = (name) => import(name),
  logger = console
} = {}) => {
  const mode = mailModeOf(env);
  let transporter = null;
  let redis = null;
  let queue = null;
  let worker = null;

  // Redis hoặc worker lỗi thường lặp lại liên tục; mỗi thông báo giống nhau chỉ ghi log 1 lần mỗi 60 giây
  const lastWarned = new Map();
  const warnThrottled = (message) => {
    const now = Date.now();
    if (now - (lastWarned.get(message) ?? -Infinity) < WARN_INTERVAL_MS) return;
    lastWarned.set(message, now);
    logger.warn(message);
  };

  const getTransporter = async () => {
    if (!transporter) {
      const nodemailer = await load('nodemailer');
      const lib = nodemailer.default ?? nodemailer;
      transporter = lib.createTransport(smtpOptionsOf(env));
    }
    return transporter;
  };

  /** Gửi thật qua SMTP, hoặc in ra log khi chưa cấu hình SMTP. Ném lỗi để BullMQ biết mà thử lại. */
  const deliver = async (message) => {
    if (mode.transport === 'smtp') {
      const smtp = await getTransporter();
      await smtp.sendMail({
        from: mailFromOf(env),
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      });
      logger.log(`📧 Đã gửi email "${message.subject}" tới ${message.to}`);
      return;
    }
    // Chế độ log: dành cho máy dev/demo chưa có SMTP, in cả nội dung để lấy OTP/link
    logger.log(`\n📨 [EMAIL → LOG] Tới: ${message.to}\nTiêu đề: ${message.subject}\n${message.text}\n`);
  };

  /** Một client ioredis dùng chung cho Queue và Worker (BullMQ tự nhân bản kết nối chặn cho Worker). */
  const getRedis = async () => {
    if (!redis) {
      const mod = await load('ioredis');
      const IORedis = mod.Redis ?? mod.default?.Redis ?? mod.default ?? mod;
      const client = new IORedis(redisConnectionOf(env.REDIS_URL));
      client.on('error', (error) => warnThrottled(`⚠️ Redis lỗi: ${error.message}`));
      redis = client;
    }
    return redis;
  };

  const getQueue = async () => {
    if (!mode.useQueue) return null;
    if (!queue) {
      const { Queue } = await load('bullmq');
      queue = new Queue(QUEUE_NAME, {
        connection: await getRedis(),
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          // Job chứa OTP/link nên xóa ngay khi xong; giữ job lỗi 1 giờ để tra cứu
          removeOnComplete: true,
          removeOnFail: { age: 3600 }
        }
      });
      queue.on('error', (error) => warnThrottled(`⚠️ Hàng đợi email lỗi: ${error.message}`));
    }
    return queue;
  };

  /**
   * Đưa email vào hàng đợi (nếu có Redis), hoặc gửi ngay trong nền. Không bao giờ ném lỗi.
   * Trả về 'queued' | 'direct' | 'failed'.
   */
  const sendEmail = async (message) => {
    try {
      const q = await getQueue();
      if (q) {
        // Chưa nối được Redis thì không thêm job: lệnh sẽ nằm chờ và có thể gửi trùng khi Redis sống lại
        if (redis.status !== 'ready') throw new Error('Redis chưa sẵn sàng');
        await withTimeout(q.add(message.kind || 'email', message), ENQUEUE_TIMEOUT_MS, 'Redis không phản hồi');
        return 'queued';
      }
    } catch (error) {
      logger.warn(`⚠️ Không đưa được email vào hàng đợi (${error.message}), chuyển sang gửi trực tiếp`);
    }
    // Không chờ kết quả để không làm chậm API; lỗi chỉ ghi log
    deliver(message).catch((error) => logger.warn(`⚠️ Gửi email tới ${message.to} thất bại: ${error.message}`));
    return 'direct';
  };

  /** Khởi động worker xử lý hàng đợi (gọi một lần khi server chạy). Không có Redis thì bỏ qua. */
  const startWorker = async () => {
    if (!mode.useQueue || worker) return worker;
    try {
      const { Worker } = await load('bullmq');
      worker = new Worker(QUEUE_NAME, (job) => deliver(job.data), {
        connection: await getRedis(),
        concurrency: 5
      });
      worker.on('failed', (job, error) => logger.warn(`⚠️ Email "${job?.data?.subject}" gửi lỗi (lần ${job?.attemptsMade}/5): ${error.message}`));
      worker.on('error', (error) => warnThrottled(`⚠️ Worker email lỗi: ${error.message}`));
      logger.log(`📬 Worker email đã chạy (hàng đợi BullMQ, ${mode.transport === 'smtp' ? 'gửi qua SMTP' : 'chưa có SMTP nên in ra log'})`);
    } catch (error) {
      logger.warn(`⚠️ Không khởi động được worker email: ${error.message}`);
      worker = null;
    }
    return worker;
  };

  const close = async () => {
    await Promise.allSettled([worker?.close(), queue?.close(), transporter?.close?.()]);
    // BullMQ không đóng client do ta truyền vào, nên tự đóng; Redis đang lỗi thì ngắt thẳng
    if (redis) {
      try {
        await withTimeout(Promise.resolve(redis.quit()), REDIS_QUIT_TIMEOUT_MS, 'Redis không phản hồi khi đóng');
      } catch {
        redis.disconnect();
      }
    }
    worker = null;
    queue = null;
    redis = null;
    transporter = null;
  };

  // Dựng nội dung nằm trong try để lỗi bất ngờ cũng không làm hỏng API đăng ký / quên mật khẩu
  const safely = async (build) => {
    try {
      return await sendEmail(build());
    } catch (error) {
      logger.warn(`⚠️ Không dựng được email: ${error.message}`);
      return 'failed';
    }
  };

  const sendOtpEmail = (args) =>
    safely(() => {
      const { to, fullName, otp, ttlMinutes, resend = false } = args;
      return { kind: 'otp', to, ...buildOtpEmail({ fullName, otp, ttlMinutes, resend }) };
    });

  const sendPasswordResetEmail = (args) =>
    safely(() => {
      const { to, fullName, token, ttlMinutes } = args;
      return {
        kind: 'password-reset',
        to,
        ...buildResetPasswordEmail({ fullName, link: buildResetLink(env.CLIENT_URL, token), ttlMinutes })
      };
    });

  return { mode, deliver, sendEmail, sendOtpEmail, sendPasswordResetEmail, startWorker, close };
};

const defaultService = createEmailService();

export const { sendEmail, sendOtpEmail, sendPasswordResetEmail, startWorker: startEmailWorker, close: closeEmail } = defaultService;
export default defaultService;
