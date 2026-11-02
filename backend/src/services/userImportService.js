import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { mailModeOf } from '../utils/mailConfig.js';
import { sendAccountCreatedEmail } from './emailService.js';
import {
  BULK_IMPORT_MAX_ROWS,
  cellToString,
  decodeCsvBuffer,
  fileTypeOf,
  generateTempPassword,
  insertInChunks,
  parseCsv,
  planImport,
  recordsFromMatrix,
  buildImportSummary
} from '../utils/bulkImportRules.js';

/**
 * POST /users/bulk-import (docs/api/api-users.md mục 2.12): tạo nhiều tài khoản từ tệp .csv / .xlsx.
 * Quy tắc nằm ở utils/bulkImportRules.js (có unit test); file này chỉ nối với CSDL, exceljs và hàng đợi email.
 *
 *   - Đọc tệp, kiểm tra từng dòng, báo lỗi theo số dòng (không dừng cả tệp vì một dòng sai).
 *   - Mật khẩu tạm ngẫu nhiên (bcrypt như tạo tài khoản lẻ), must_change_password = true, email_verified = true.
 *   - Chèn theo lô 100 dòng, mỗi lô một giao dịch.
 *   - Email chứa mật khẩu tạm được đưa vào hàng đợi BullMQ ở nền (không làm chậm phản hồi); mật khẩu KHÔNG được ghi log.
 */

const BCRYPT_ROUNDS = 10; // như adminCreateUser
const SCAN_ROW_LIMIT = 5000; // số dòng tối đa quét trong tệp xlsx (tệp có định dạng kéo dài hàng triệu dòng trống vẫn đọc được)
const LOOKUP_CHUNK = 500;

/** Đọc sheet đầu tiên của tệp .xlsx thành ma trận chuỗi; chỉ số dòng khớp số dòng trong Excel (dòng 1 = chỉ số 0). */
const readXlsxMatrix = async (buffer) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new AppError('Không đọc được file Excel (.xlsx bị hỏng hoặc không đúng định dạng)', 400, 'Bad Request');
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  if (sheet.actualRowCount > SCAN_ROW_LIMIT) {
    throw new AppError(`Mỗi lần chỉ nhập tối đa ${BULK_IMPORT_MAX_ROWS} dòng. Hãy chia nhỏ file rồi nhập lại`, 422, 'Unprocessable Entity');
  }
  const matrix = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber > SCAN_ROW_LIMIT) return;
    matrix[rowNumber - 1] = Array.from(row.values.slice(1), (value) => cellToString(value));
  });
  return matrix;
};

const findExistingEmails = async (emails) => {
  const found = new Set();
  for (let i = 0; i < emails.length; i += LOOKUP_CHUNK) {
    const rows = await User.findAll({
      where: { email: { [Op.in]: emails.slice(i, i + LOOKUP_CHUNK) } },
      attributes: ['email'],
      raw: true
    });
    rows.forEach((row) => found.add(String(row.email).toLowerCase()));
  }
  return found;
};

const toUserRow = (row) => ({
  email: row.email,
  full_name: row.fullName,
  role: row.role,
  phone_number: row.phoneNumber || null,
  password_hash: row.passwordHash,
  is_active: true,
  email_verified: true,
  must_change_password: true
});

/** Gửi lần lượt ở nền; hàm gửi không bao giờ ném lỗi. Không chờ để phản hồi API trả về ngay. */
const queueAccountEmails = (users) => {
  (async () => {
    for (const user of users) {
      await sendAccountCreatedEmail({
        to: user.email,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tempPassword: user.tempPassword
      });
    }
  })().catch(() => {});
};

/**
 * @param {{ file: { originalname: string, buffer: Buffer }, defaultRole?: 'student'|'teacher' }} input
 */
export const bulkImportUsers = async ({ file, defaultRole = 'student' }) => {
  if (!file) throw new AppError('Thiếu tệp tải lên (trường "file")', 400, 'Bad Request');
  const type = fileTypeOf(file.originalname, file.buffer);
  if (!type) throw new AppError('Định dạng file không hợp lệ (chỉ nhận .xlsx hoặc .csv)', 400, 'Bad Request');

  const matrix = type === 'csv' ? parseCsv(decodeCsvBuffer(file.buffer)) : await readXlsxMatrix(file.buffer);
  const records = recordsFromMatrix(matrix);

  const existingEmails = await findExistingEmails([...new Set(records.map((r) => r.email.trim().toLowerCase()).filter(Boolean))]);
  const { valid, errors } = planImport(records, { defaultRole, existingEmails });

  // Băm tuần tự: bcryptjs nhường luồng giữa các vòng nên các API khác vẫn phục vụ được
  const prepared = [];
  for (const row of valid) {
    const tempPassword = generateTempPassword(randomInt);
    prepared.push({ ...row, tempPassword, passwordHash: await bcrypt.hash(tempPassword, BCRYPT_ROUNDS) });
  }

  const { created, failed } = await insertInChunks(prepared, {
    insertChunk: (chunk) => sequelize.transaction((transaction) => User.bulkCreate(chunk.map(toUserRow), { transaction, validate: true })),
    insertOne: (row) => User.create(toUserRow(row)),
    onError: (error) => console.error('⚠️ Lỗi khi lưu lô tài khoản nhập hàng loạt:', error.message)
  });

  queueAccountEmails(created);

  const mail = mailModeOf(process.env);
  return buildImportSummary({
    totalRows: records.length,
    createdCount: created.length,
    errors: [...errors, ...failed],
    emailsQueued: created.length,
    emailMode: `${mail.useQueue ? 'queue' : 'direct'}_${mail.transport}`
  });
};

export default { bulkImportUsers };
