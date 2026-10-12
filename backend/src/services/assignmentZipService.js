import crypto from 'crypto';
import { PassThrough } from 'stream';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Config } from '../config/s3.js';
import { AppError } from '../utils/AppError.js';
import { getZipContext } from './assignmentService.js';
import { sanitizeFileName } from './uploadService.js';

/**
 * Tải trọn gói bài nộp cả lớp dạng ZIP (api-assignments.md 2.17-2.18).
 * Đặc tả dùng BullMQ/Redis; dự án chưa có Redis nên xử lý ngay trong tiến trình server:
 *   - Tổng dung lượng ≤ 50MB: nén đồng bộ, trả link luôn (200)
 *   - Lớn hơn: chạy nền, trả jobId (202), client hỏi tiến độ qua /download-all/status
 * Trạng thái job lưu trong bộ nhớ -> mất khi server khởi động lại (client chỉ cần gọi lại download-all).
 * ZIP được stream từ S3 -> archiver -> S3 multipart upload, không giữ toàn bộ file trong RAM.
 */
const SYNC_LIMIT_BYTES = 50 * 1024 * 1024;
const DOWNLOAD_URL_EXPIRES_IN = 30 * 60;
const JOB_TTL_MS = 60 * 60 * 1000;
const jobs = new Map();

const toMb = (bytes) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

// Xóa job cũ để Map không phình mãi
const pruneJobs = () => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
};

/**
 * Tên file trong ZIP: [HoTen]_[email]_[TenFileGoc]. Hệ thống chưa có MSSV nên dùng phần trước @ của email.
 */
const entryName = (submission, used) => {
  const student = submission.student;
  const base = `${sanitizeFileName(student?.full_name || 'HocVien').replace(/\.[^.]*$/, '')}_${(student?.email || submission.student_id).split('@')[0]}_${sanitizeFileName(submission.file_name)}`;
  let name = base;
  for (let i = 2; used.has(name); i++) name = `${i}_${base}`;
  used.add(name);
  return name;
};

/**
 * Nén toàn bộ bài nộp lên S3 (exports/...), trả presigned GET URL
 */
const buildZip = async ({ cls, assignment, submissions }, onProgress = () => {}) => {
  const { bucket } = getS3Config();
  const client = getS3Client();
  const zipKey = `private/exports/${cls.id}/${assignment.id}/${Date.now()}_bai-nop.zip`;

  const archive = archiver('zip', { zlib: { level: 6 } });
  const body = new PassThrough();
  archive.pipe(body);
  const upload = new Upload({ client, params: { Bucket: bucket, Key: zipKey, Body: body, ContentType: 'application/zip' } });
  const uploading = upload.done();
  const archiveError = new Promise((_, reject) => archive.on('error', reject));
  archiveError.catch(() => {}); // chỉ dùng trong Promise.race; tránh unhandled rejection khi lỗi xảy ra sau cùng

  const used = new Set();
  for (const [index, submission] of submissions.entries()) {
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: submission.file_url }));
    // Thêm từng file và đợi nén xong mới mở kết nối S3 tiếp theo
    const added = new Promise((resolve) => archive.once('entry', resolve));
    archive.append(object.Body, { name: entryName(submission, used) });
    await Promise.race([added, archiveError]);
    onProgress(Math.round(((index + 1) / submissions.length) * 95));
  }
  await archive.finalize();
  await Promise.race([uploading, archiveError]);

  const fileName = `Bai-nop_${sanitizeFileName(cls.name)}_${sanitizeFileName(assignment.title)}.zip`;
  const zipDownloadUrl = await getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: zipKey,
    ResponseContentDisposition: `attachment; filename="${fileName}"`
  }), { expiresIn: DOWNLOAD_URL_EXPIRES_IN });

  return { zipDownloadUrl, expiresInSeconds: DOWNLOAD_URL_EXPIRES_IN };
};

/**
 * GET /classes/:classId/assignments/:assignmentId/submissions/download-all
 */
export const requestDownloadAll = async (classId, assignmentId, user) => {
  const context = await getZipContext(classId, assignmentId, user);
  if (context.submissions.length === 0) {
    throw new AppError('Chưa có bài nộp nào để tải về', 400, 'Bad Request');
  }
  getS3Config(); // thiếu cấu hình S3 -> 503 ngay
  pruneJobs();

  const totalBytes = context.submissions.reduce((sum, s) => sum + Number(s.file_size), 0);
  const summary = { totalFiles: context.submissions.length, totalSizeMb: toMb(totalBytes) };

  if (totalBytes <= SYNC_LIMIT_BYTES) {
    const result = await buildZip(context);
    return { statusCode: 200, data: { status: 'ready', ...result, ...summary } };
  }

  const jobId = `job_zip_${crypto.randomUUID()}`;
  const job = { jobId, status: 'processing', progressPercent: 0, classId, assignmentId, userId: user.id, createdAt: Date.now(), ...summary };
  jobs.set(jobId, job);
  buildZip(context, (percent) => { job.progressPercent = percent; })
    .then((result) => Object.assign(job, { status: 'completed', progressPercent: 100, ...result }))
    .catch((error) => {
      console.error(`⚠️ Nén ZIP bài nộp thất bại (${jobId}):`, error.name, error.message);
      Object.assign(job, { status: 'failed', error: 'Nén file thất bại, vui lòng thử lại' });
    });

  return {
    statusCode: 202,
    data: {
      status: 'processing',
      jobId,
      ...summary,
      estimatedSeconds: Math.max(5, Math.round(summary.totalSizeMb / 5)),
      checkStatusUrl: `/api/v1/classes/${classId}/assignments/${assignmentId}/submissions/download-all/status?jobId=${jobId}`
    }
  };
};

/**
 * GET /classes/:classId/assignments/:assignmentId/submissions/download-all/status?jobId=
 */
export const getDownloadAllStatus = async (classId, assignmentId, user, jobId) => {
  await getZipContext(classId, assignmentId, user); // kiểm tra quyền
  const job = jobs.get(jobId);
  if (!job || job.classId !== classId || job.assignmentId !== assignmentId) {
    throw new AppError('Không tìm thấy tiến trình nén (có thể đã hết hạn), vui lòng tạo lại', 404, 'Not Found');
  }
  const { userId, createdAt, classId: _c, assignmentId: _a, ...publicJob } = job;
  return publicJob;
};

export default { requestDownloadAll, getDownloadAllStatus };
