import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createEmailService, QUEUE_NAME } from '../../src/services/emailService.js';

// Dịch vụ gửi email với bản giả của bullmq và nodemailer (không cần Redis/SMTP thật)

const makeEnv = (extra = {}) => ({ CLIENT_URL: 'http://localhost:8080', ...extra });

const makeLogger = () => {
  const lines = { log: [], warn: [] };
  return {
    lines,
    log: (...args) => lines.log.push(args.join(' ')),
    warn: (...args) => lines.warn.push(args.join(' '))
  };
};

/** Bản giả của bullmq + nodemailer; ghi lại mọi lời gọi. */
const makeLibs = ({ addImpl, sendMailImpl, missing = [], redisStatus = 'ready', redisExport = 'default' } = {}) => {
  const calls = { redis: [], queues: [], workers: [], transports: [], sent: [], added: [], closed: [] };

  class Redis {
    constructor(options) {
      this.options = options;
      this.status = redisStatus;
      this.handlers = {};
      calls.redis.push(this);
    }
    on(event, handler) { this.handlers[event] = handler; }
    async quit() { calls.closed.push('redis'); }
    disconnect() { calls.closed.push('redis-disconnect'); }
  }

  class Queue {
    constructor(name, options) {
      this.name = name;
      this.options = options;
      this.handlers = {};
      calls.queues.push(this);
    }
    on(event, handler) { this.handlers[event] = handler; }
    async add(name, data) {
      if (addImpl) return addImpl(name, data);
      calls.added.push({ name, data });
      return { id: String(calls.added.length) };
    }
    async close() { calls.closed.push('queue'); }
  }

  class Worker {
    constructor(name, processor, options) {
      this.name = name;
      this.processor = processor;
      this.options = options;
      this.handlers = {};
      calls.workers.push(this);
    }
    on(event, handler) { this.handlers[event] = handler; }
    async close() { calls.closed.push('worker'); }
  }

  const nodemailer = {
    default: {
      createTransport: (options) => {
        const transport = {
          options,
          sendMail: async (mail) => {
            if (sendMailImpl) return sendMailImpl(mail);
            calls.sent.push(mail);
            return { messageId: 'x' };
          },
          close: () => calls.closed.push('transport')
        };
        calls.transports.push(transport);
        return transport;
      }
    }
  };

  const load = async (name) => {
    if (missing.includes(name)) throw new Error(`Cannot find package '${name}'`);
    if (name === 'bullmq') return { Queue, Worker };
    if (name === 'ioredis') return redisExport === 'named' ? { Redis } : { default: Redis };
    if (name === 'nodemailer') return nodemailer;
    throw new Error(`module lạ: ${name}`);
  };

  return { load, calls };
};

const OTP_ARGS = { to: 'a@x.com', fullName: 'An', otp: '123456', ttlMinutes: 10 };
const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('chế độ log (không cấu hình gì)', () => {
  test('in email ra log, không nạp bullmq/nodemailer', async () => {
    const logger = makeLogger();
    const { load } = makeLibs({ missing: ['bullmq', 'ioredis', 'nodemailer'] });
    const service = createEmailService({ env: makeEnv(), load, logger });

    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    assert.equal(logger.lines.warn.length, 0);
    assert.match(logger.lines.log.join('\n'), /EMAIL → LOG/);
    assert.match(logger.lines.log.join('\n'), /a@x\.com/);
    assert.match(logger.lines.log.join('\n'), /123456/);
  });

  test('link đặt lại mật khẩu có trong log để dev lấy được', async () => {
    const logger = makeLogger();
    const service = createEmailService({ env: makeEnv(), load: makeLibs().load, logger });
    await service.sendPasswordResetEmail({ to: 'a@x.com', fullName: 'An', token: 'tok123' });
    await tick();
    assert.match(logger.lines.log.join('\n'), /http:\/\/localhost:8080\/reset-password\?token=tok123/);
  });

  test('startWorker không làm gì khi chưa có Redis', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env: makeEnv(), load, logger: makeLogger() });
    assert.equal(await service.startWorker(), null);
    assert.equal(calls.workers.length, 0);
  });
});

describe('chỉ SMTP (gửi trực tiếp)', () => {
  const env = makeEnv({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'me@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop' });

  test('gửi qua nodemailer với người gửi và tùy chọn đúng', async () => {
    const { load, calls } = makeLibs();
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });

    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();

    assert.equal(calls.transports.length, 1);
    assert.equal(calls.transports[0].options.host, 'smtp.gmail.com');
    assert.deepEqual(calls.transports[0].options.auth, { user: 'me@gmail.com', pass: 'abcdefghijklmnop' });
    assert.equal(calls.sent.length, 1);
    assert.equal(calls.sent[0].from, 'EduVerse <me@gmail.com>');
    assert.equal(calls.sent[0].to, 'a@x.com');
    assert.equal(calls.sent[0].subject, 'EduVerse: mã xác thực 123456');
    assert.match(calls.sent[0].html, /123456/);
    assert.match(logger.lines.log.join('\n'), /Đã gửi email/);
  });

  test('dùng lại một transporter cho nhiều email', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.sendOtpEmail(OTP_ARGS);
    await service.sendOtpEmail({ ...OTP_ARGS, resend: true });
    await tick();
    await tick();
    assert.equal(calls.transports.length, 1);
    assert.equal(calls.sent.length, 2);
    assert.equal(calls.sent[1].subject, 'EduVerse: mã xác thực mới 123456');
  });

  test('SMTP lỗi chỉ ghi cảnh báo, sendEmail không ném lỗi', async () => {
    const { load } = makeLibs({ sendMailImpl: async () => { throw new Error('535 Bad credentials'); } });
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });

    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.match(logger.lines.warn.join('\n'), /535 Bad credentials/);
    assert.match(logger.lines.warn.join('\n'), /a@x\.com/);
  });

  test('chưa cài nodemailer: chỉ cảnh báo, API không bị ảnh hưởng', async () => {
    const { load } = makeLibs({ missing: ['nodemailer'] });
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });
    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.match(logger.lines.warn.join('\n'), /nodemailer/);
  });
});

describe('hàng đợi BullMQ (có REDIS_URL)', () => {
  const env = makeEnv({ REDIS_URL: 'redis://redis:6379', SMTP_HOST: 'smtp.gmail.com' });

  test('đưa email vào hàng đợi "email" với tùy chọn thử lại, không gửi ngay', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });

    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'queued');
    assert.equal(calls.sent.length, 0);
    assert.equal(calls.transports.length, 0);

    assert.equal(calls.queues.length, 1);
    const queue = calls.queues[0];
    assert.equal(queue.name, QUEUE_NAME);
    assert.equal(queue.name, 'email');
    assert.equal(queue.options.connection, calls.redis[0]);
    assert.deepEqual(calls.redis[0].options, { host: 'redis', port: 6379, maxRetriesPerRequest: null });
    assert.equal(queue.options.defaultJobOptions.attempts, 5);
    assert.deepEqual(queue.options.defaultJobOptions.backoff, { type: 'exponential', delay: 5000 });
    assert.equal(queue.options.defaultJobOptions.removeOnComplete, true);

    assert.equal(calls.added.length, 1);
    assert.equal(calls.added[0].name, 'otp');
    assert.equal(calls.added[0].data.to, 'a@x.com');
    assert.equal(calls.added[0].data.subject, 'EduVerse: mã xác thực 123456');
  });

  test('dùng lại một Queue cho nhiều email; email đặt lại mật khẩu có kind riêng', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.sendOtpEmail(OTP_ARGS);
    await service.sendPasswordResetEmail({ to: 'b@x.com', fullName: 'B', token: 't' });
    assert.equal(calls.queues.length, 1);
    assert.deepEqual(calls.added.map((job) => job.name), ['otp', 'password-reset']);
  });

  test('Redis lỗi khi thêm job: chuyển sang gửi trực tiếp, vẫn không ném lỗi', async () => {
    const { load, calls } = makeLibs({ addImpl: async () => { throw new Error('ECONNREFUSED'); } });
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });

    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.match(logger.lines.warn.join('\n'), /ECONNREFUSED/);
    assert.equal(calls.sent.length, 1);
  });

  test('chưa cài bullmq: chuyển sang gửi trực tiếp', async () => {
    const { load, calls } = makeLibs({ missing: ['bullmq'] });
    const service = createEmailService({ env, load, logger: makeLogger() });
    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.equal(calls.sent.length, 1);
  });

  test('REDIS_URL sai định dạng cũng không làm hỏng API', async () => {
    const { load, calls } = makeLibs();
    const logger = makeLogger();
    const service = createEmailService({ env: makeEnv({ REDIS_URL: 'http://sai', SMTP_HOST: 'h' }), load, logger });
    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.match(logger.lines.warn.join('\n'), /redis:\/\//);
    assert.equal(calls.sent.length, 1);
  });

  test('Redis treo: hết 3 giây thì gửi trực tiếp thay vì làm API chờ mãi', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { load, calls } = makeLibs({ addImpl: () => new Promise(() => {}) });
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });

    const pending = service.sendOtpEmail(OTP_ARGS);
    await tick();
    t.mock.timers.tick(3000);
    assert.equal(await pending, 'direct');
    t.mock.timers.reset();
    await tick();
    await tick();
    assert.match(logger.lines.warn.join('\n'), /Redis không phản hồi/);
    assert.equal(calls.sent.length, 1);
  });

  test('Queue và Worker dùng chung một client ioredis (BullMQ 6 không tự nạp ioredis trong ESM)', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.startWorker();
    await service.sendOtpEmail(OTP_ARGS);
    assert.equal(calls.redis.length, 1);
    assert.equal(calls.queues[0].options.connection, calls.redis[0]);
    assert.equal(calls.workers[0].options.connection, calls.redis[0]);
  });

  test('nhận cả kiểu export { Redis } của ioredis', async () => {
    const { load, calls } = makeLibs({ redisExport: 'named' });
    const service = createEmailService({ env, load, logger: makeLogger() });
    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'queued');
    assert.equal(calls.redis.length, 1);
  });

  test('chưa cài ioredis: chuyển sang gửi trực tiếp', async () => {
    const { load, calls } = makeLibs({ missing: ['ioredis'] });
    const service = createEmailService({ env, load, logger: makeLogger() });
    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.equal(calls.queues.length, 0);
    assert.equal(calls.sent.length, 1);
  });

  test('Redis chưa sẵn sàng: không thêm job (tránh gửi trùng khi Redis sống lại), gửi trực tiếp', async () => {
    const { load, calls } = makeLibs({ redisStatus: 'connecting' });
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });
    assert.equal(await service.sendOtpEmail(OTP_ARGS), 'direct');
    await tick();
    await tick();
    assert.equal(calls.added.length, 0);
    assert.equal(calls.sent.length, 1);
    assert.match(logger.lines.warn.join('\n'), /Redis chưa sẵn sàng/);
  });

  test('lỗi Redis lặp lại chỉ ghi log một lần mỗi 60 giây', async () => {
    const { load, calls } = makeLibs();
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });
    await service.sendOtpEmail(OTP_ARGS);
    const handler = calls.redis[0].handlers.error;
    for (let i = 0; i < 20; i += 1) handler(new Error('ECONNREFUSED'));
    assert.equal(logger.lines.warn.filter((line) => /ECONNREFUSED/.test(line)).length, 1);
    handler(new Error('ETIMEDOUT'));
    assert.equal(logger.lines.warn.filter((line) => /ETIMEDOUT/.test(line)).length, 1);
  });
});

describe('worker', () => {
  const env = makeEnv({ REDIS_URL: 'redis://:pw@redis:6379', SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'me@gmail.com', SMTP_PASS: 'pw' });

  test('xử lý job bằng cách gửi SMTP, đúng hàng đợi và kết nối', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.startWorker();

    assert.equal(calls.workers.length, 1);
    const worker = calls.workers[0];
    assert.equal(worker.name, 'email');
    assert.equal(worker.options.connection, calls.redis[0]);
    assert.equal(calls.redis[0].options.password, 'pw');
    assert.equal(calls.redis[0].options.maxRetriesPerRequest, null);
    assert.equal(worker.options.concurrency, 5);

    await worker.processor({ data: { to: 'a@x.com', subject: 'S', text: 'T', html: '<p>H</p>' } });
    assert.equal(calls.sent.length, 1);
    assert.equal(calls.sent[0].to, 'a@x.com');
    assert.equal(calls.sent[0].from, 'EduVerse <me@gmail.com>');
  });

  test('lỗi gửi trong worker được ném lên để BullMQ thử lại', async () => {
    const { load, calls } = makeLibs({ sendMailImpl: async () => { throw new Error('timeout'); } });
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.startWorker();
    await assert.rejects(() => calls.workers[0].processor({ data: { to: 'a@x.com', subject: 'S', text: 'T' } }), /timeout/);
  });

  test('ghi cảnh báo khi job thất bại và khi worker lỗi kết nối', async () => {
    const { load, calls } = makeLibs();
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });
    await service.startWorker();
    const worker = calls.workers[0];
    worker.handlers.failed({ data: { subject: 'S' }, attemptsMade: 2 }, new Error('boom'));
    worker.handlers.error(new Error('redis down'));
    assert.match(logger.lines.warn.join('\n'), /boom/);
    assert.match(logger.lines.warn.join('\n'), /2\/5/);
    assert.match(logger.lines.warn.join('\n'), /redis down/);
  });

  test('lỗi worker lặp lại không làm tràn log', async () => {
    const { load, calls } = makeLibs();
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });
    await service.startWorker();
    for (let i = 0; i < 50; i += 1) calls.workers[0].handlers.error(new Error('loi lap'));
    assert.equal(logger.lines.warn.filter((line) => /loi lap/.test(line)).length, 1);
  });

  test('gọi startWorker hai lần chỉ tạo một worker', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.startWorker();
    await service.startWorker();
    assert.equal(calls.workers.length, 1);
  });

  test('không khởi động được worker (thiếu bullmq) thì chỉ cảnh báo, server vẫn chạy', async () => {
    const { load } = makeLibs({ missing: ['bullmq'] });
    const logger = makeLogger();
    const service = createEmailService({ env, load, logger });
    assert.equal(await service.startWorker(), null);
    assert.match(logger.lines.warn.join('\n'), /worker email/);
  });

  test('close đóng worker, hàng đợi và transporter; gọi lại an toàn', async () => {
    const { load, calls } = makeLibs();
    const service = createEmailService({ env, load, logger: makeLogger() });
    await service.startWorker();
    await service.sendOtpEmail(OTP_ARGS);
    await service.deliver({ to: 'a@x.com', subject: 'S', text: 'T', html: 'H' });
    await service.close();
    assert.deepEqual([...calls.closed].sort(), ['queue', 'redis', 'transport', 'worker']);
    await service.close();
  });
});

describe('không bao giờ ném lỗi', () => {
  test('dữ liệu đầu vào bất thường vẫn không làm hỏng lời gọi', async () => {
    const logger = makeLogger();
    const service = createEmailService({ env: makeEnv(), load: makeLibs().load, logger });
    assert.equal(await service.sendOtpEmail({ to: 'a@x.com', otp: '1' }), 'direct');
    assert.equal(await service.sendOtpEmail(null), 'failed');
    assert.match(logger.lines.warn.join('\n'), /Không dựng được email/);
    assert.equal(await service.sendPasswordResetEmail(null), 'failed');
  });
});
