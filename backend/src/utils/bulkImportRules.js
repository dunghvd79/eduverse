import { AppError } from './AppError.js';

/**
 * Quy tắc thuần của "Nhập người dùng hàng loạt" (docs/api/api-users.md mục 2.12): đọc CSV, chuẩn hóa dòng dữ liệu,
 * kiểm tra từng dòng, phát hiện trùng email, sinh mật khẩu tạm, chèn theo lô.
 * Không import model/CSDL/thư viện ngoài nên chạy được trong `npm test`: tests/unit/bulkImportRules.test.js.
 */

export const BULK_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const BULK_IMPORT_MAX_ROWS = 300;
export const BULK_IMPORT_CHUNK_SIZE = 100;
export const BULK_IMPORT_DEFAULT_ROLES = ['student', 'teacher'];
export const BULK_IMPORT_ROLES = ['student', 'teacher', 'training_manager'];

const unprocessable = (message) => new AppError(message, 422, 'Unprocessable Entity');
const badRequest = (message) => new AppError(message, 400, 'Bad Request');

// ---------------------------------------------------------------- chuẩn hóa chuỗi / ô

const stripDiacritics = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** "Họ và tên" -> "hovaten"; "training_manager" -> "trainingmanager". Dùng để so tên cột và tên vai trò. */
export const normalizeKey = (text) => stripDiacritics(text ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Giá trị ô của exceljs (chuỗi, số, ngày, công thức, siêu liên kết, rich text) thành chuỗi đã bỏ khoảng trắng hai đầu. */
export const cellToString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part?.text ?? '').join('').trim();
    if ('result' in value && value.result !== undefined) return cellToString(value.result);
    if (typeof value.text === 'string') return value.text.trim();
    if (value.text && typeof value.text === 'object') return cellToString(value.text);
    if (typeof value.hyperlink === 'string') return value.hyperlink.replace(/^mailto:/i, '').trim();
    return '';
  }
  return String(value).trim();
};

// ---------------------------------------------------------------- CSV

/** Excel tiếng Việt thường lưu CSV bằng dấu chấm phẩy hoặc tab, nên đoán dấu phân cách theo dòng tiêu đề. */
export const detectDelimiter = (text) => {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (const ch of String(text)) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === '\n' || ch === '\r')) { if (Object.values(counts).some((n) => n > 0)) break; }
    else if (!inQuotes && ch in counts) counts[ch] += 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ',';
};

/** Bản CSV phải là UTF-8 (có hoặc không BOM). Excel "CSV (Comma delimited)" lưu ANSI sẽ làm hỏng tiếng Việt nên bị từ chối. */
export const decodeCsvBuffer = (buffer) => {
  if (buffer.includes(0)) throw badRequest('Định dạng file không hợp lệ: file CSV chứa dữ liệu nhị phân');
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw badRequest('File CSV phải được lưu bằng mã hóa UTF-8 (Excel: Lưu thành > CSV UTF-8) để không lỗi tiếng Việt');
  }
};

/** CSV theo RFC 4180: ô trong ngoặc kép có thể chứa dấu phân cách, xuống dòng và "" (ngoặc kép). Trả mảng các dòng, mỗi dòng là mảng ô. */
export const parseCsv = (text) => {
  let source = String(text ?? '');
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);
  const delimiter = detectDelimiter(source);
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  let touched = false; // dòng hiện tại đã có ký tự nào chưa (để không thêm dòng ảo ở cuối tệp)

  const endCell = () => { row.push(cell); cell = ''; };
  const endRow = () => { endCell(); rows.push(row); row = []; touched = false; };

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') { cell += '"'; i += 1; } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === '') { inQuotes = true; touched = true; continue; }
    if (ch === delimiter) { endCell(); touched = true; continue; }
    if (ch === '\r') { if (source[i + 1] === '\n') i += 1; endRow(); continue; }
    if (ch === '\n') { endRow(); continue; }
    cell += ch;
    touched = true;
  }
  if (inQuotes) throw badRequest('File CSV bị lỗi: có dấu ngoặc kép chưa được đóng');
  if (touched || cell !== '') endRow();
  return rows.map((r) => r.map((c) => c.trim()));
};

/** Loại tệp theo đuôi và nội dung. xlsx thật là ZIP (bắt đầu bằng "PK\x03\x04"). Trả 'csv' | 'xlsx' | null. */
export const fileTypeOf = (filename, buffer) => {
  const name = String(filename || '').toLowerCase();
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.xlsx')) {
    const isZip = buffer && buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    return isZip ? 'xlsx' : null;
  }
  return null;
};

// ---------------------------------------------------------------- cột và dòng dữ liệu

const COLUMN_ALIASES = {
  email: ['email', 'mail', 'emailaddress', 'diachiemail', 'thudientu'],
  fullName: ['fullname', 'hovaten', 'hoten', 'ten', 'name', 'tennguoidung'],
  phoneNumber: ['phonenumber', 'phone', 'sodienthoai', 'dienthoai', 'sdt', 'tel'],
  role: ['role', 'vaitro', 'phanquyen']
};
const COLUMN_BY_ALIAS = Object.fromEntries(
  Object.entries(COLUMN_ALIASES).flatMap(([column, aliases]) => aliases.map((alias) => [alias, column]))
);

const ROLE_BY_ALIAS = {
  student: 'student', hocvien: 'student', sinhvien: 'student',
  teacher: 'teacher', giangvien: 'teacher',
  trainingmanager: 'training_manager', manager: 'training_manager', quanlydaotao: 'training_manager', quanly: 'training_manager'
};

/** Vai trò trong file: để trống thì dùng vai trò mặc định; không nhận diện được trả null (không bao giờ nhận admin). */
export const normalizeRole = (value, defaultRole = 'student') => {
  const key = normalizeKey(value);
  if (!key) return defaultRole;
  return ROLE_BY_ALIAS[key] ?? null;
};

const PHONE_PATTERN = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/; // giống validations/userValidation.js

/** Bỏ khoảng trắng và dấu ngăn cách; khôi phục số 0 đầu mà Excel hay làm mất khi ô là số (981234567 -> 0981234567). */
export const normalizePhone = (value) => {
  let phone = String(value ?? '').replace(/[\s.\-()]/g, '');
  if (/^[35789]\d{8}$/.test(phone)) phone = `0${phone}`;
  else if (/^84[35789]\d{8}$/.test(phone)) phone = `+${phone}`;
  return phone;
};

const emptyFileError = () => unprocessable('File rỗng hoặc thiếu các cột tiêu đề bắt buộc (email, fullName)');

/**
 * Từ ma trận ô (dòng x cột) thành danh sách bản ghi { row, email, fullName, phoneNumber, role }.
 * `row` là số dòng trong tệp (dòng tiêu đề là dòng đầu tiên có dữ liệu, thường là 1). Bỏ qua dòng trống.
 * Ném 422 khi tệp rỗng, thiếu cột bắt buộc, hoặc quá nhiều dòng.
 */
export const recordsFromMatrix = (matrix, { maxRows = BULK_IMPORT_MAX_ROWS } = {}) => {
  const rows = Array.isArray(matrix) ? matrix : [];
  const headerIndex = rows.findIndex((r) => Array.isArray(r) && r.some((cell) => cellToString(cell) !== ''));
  if (headerIndex === -1) throw emptyFileError();

  const columns = {};
  rows[headerIndex].forEach((cell, index) => {
    const column = COLUMN_BY_ALIAS[normalizeKey(cellToString(cell))];
    if (column && columns[column] === undefined) columns[column] = index;
  });
  const missing = ['email', 'fullName'].filter((column) => columns[column] === undefined);
  if (missing.length > 0) {
    throw unprocessable(`File rỗng hoặc thiếu các cột tiêu đề bắt buộc: ${missing.join(', ')}`);
  }

  const records = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const cells = rows[i];
    if (!Array.isArray(cells)) continue;
    const get = (column) => (columns[column] === undefined ? '' : cellToString(cells[columns[column]]));
    const record = { row: i + 1, email: get('email'), fullName: get('fullName'), phoneNumber: get('phoneNumber'), role: get('role') };
    if (!record.email && !record.fullName && !record.phoneNumber && !record.role) continue;
    records.push(record);
  }
  if (records.length === 0) throw emptyFileError();
  if (records.length > maxRows) {
    throw unprocessable(`Mỗi lần chỉ nhập tối đa ${maxRows} dòng (file có ${records.length} dòng). Hãy chia nhỏ file rồi nhập lại`);
  }
  return records;
};

// ---------------------------------------------------------------- kiểm tra từng dòng

// Địa chỉ ASCII chuẩn: phần trước @ không bắt đầu/kết thúc bằng dấu chấm hay có hai dấu chấm liền nhau, tên miền có TLD chữ >= 2 ký tự
const LOCAL_PART = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*";
const DOMAIN = '(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,}';
const EMAIL_PATTERN = new RegExp(`^${LOCAL_PART}@${DOMAIN}$`);

// Giới hạn của chuẩn email: tổng tối đa 254 ký tự, phần trước @ tối đa 64 ký tự
export const isValidEmail = (value) => typeof value === 'string' && value.length <= 254 && value.indexOf('@') <= 64 && EMAIL_PATTERN.test(value);

/** Kết quả: { value: { row, email, fullName, phoneNumber, role } } hoặc { reason }. */
export const validateRecord = (record, defaultRole = 'student') => {
  const email = String(record.email ?? '').trim().toLowerCase();
  if (!email) return { reason: 'Thiếu địa chỉ email' };
  if (!isValidEmail(email)) return { reason: 'Địa chỉ email không đúng định dạng' };

  const fullName = String(record.fullName ?? '').replace(/\s+/g, ' ').trim();
  if (!fullName) return { reason: 'Thiếu họ và tên' };
  if (fullName.length < 2) return { reason: 'Họ và tên phải có ít nhất 2 ký tự' };
  if (fullName.length > 150) return { reason: 'Họ và tên không được vượt quá 150 ký tự' };

  const phoneNumber = normalizePhone(record.phoneNumber);
  if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
    return { reason: 'Số điện thoại không đúng định dạng (Ví dụ: 0987654321 hoặc +84987654321)' };
  }

  const role = normalizeRole(record.role, defaultRole);
  if (!role) return { reason: 'Vai trò không hợp lệ (chỉ nhận student, teacher, training_manager)' };

  return { value: { row: record.row, email, fullName, phoneNumber, role } };
};

/**
 * Chia bản ghi thành dòng hợp lệ và danh sách lỗi (theo thứ tự dòng).
 * `existingEmails` là Set email (viết thường) đã có trong CSDL.
 */
export const planImport = (records, { defaultRole = 'student', existingEmails = new Set() } = {}) => {
  const valid = [];
  const errors = [];
  const firstRowOf = new Map();
  for (const record of records) {
    const result = validateRecord(record, defaultRole);
    if (result.reason) {
      errors.push({ row: record.row, email: record.email, reason: result.reason });
      continue;
    }
    const { value } = result;
    if (firstRowOf.has(value.email)) {
      errors.push({ row: value.row, email: value.email, reason: `Địa chỉ email bị trùng trong file (đã có ở dòng ${firstRowOf.get(value.email)})` });
      continue;
    }
    firstRowOf.set(value.email, value.row);
    if (existingEmails.has(value.email)) {
      errors.push({ row: value.row, email: value.email, reason: 'Địa chỉ email đã tồn tại trong hệ thống' });
      continue;
    }
    valid.push(value);
  }
  return { valid, errors };
};

// ---------------------------------------------------------------- mật khẩu tạm

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '@#$%&*!?';

/**
 * Mật khẩu tạm 12 ký tự, luôn có chữ hoa, chữ thường, số và ký tự đặc biệt (đúng chính sách mật khẩu), bỏ ký tự dễ nhầm (0/O, 1/l/I).
 * `randomInt(max)` trả số nguyên ngẫu nhiên trong [0, max) (truyền `randomInt` của node:crypto; test truyền bản giả).
 */
export const generateTempPassword = (randomInt, length = 12) => {
  const pick = (set) => set[randomInt(set.length)];
  const all = UPPER + LOWER + DIGITS + SPECIAL;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

// ---------------------------------------------------------------- chèn theo lô

const DUPLICATE_REASON = 'Địa chỉ email đã tồn tại trong hệ thống';
const INVALID_REASON = 'Dữ liệu không đáp ứng ràng buộc của hệ thống';
const SYSTEM_REASON = 'Không lưu được do lỗi hệ thống, vui lòng thử lại';

/** Lý do dễ hiểu cho lỗi Sequelize có thể xử lý từng dòng; lỗi khác trả null. */
export const reasonOfInsertError = (error) => {
  if (error?.name === 'SequelizeUniqueConstraintError') return DUPLICATE_REASON;
  if (error?.name === 'SequelizeValidationError') return INVALID_REASON;
  return null;
};

/**
 * Chèn từng lô (mỗi lô một giao dịch do `insertChunk` đảm nhiệm). Lô nào lỗi do trùng email (tranh chấp hiếm gặp) hoặc dữ liệu
 * không hợp lệ thì thử lại từng dòng để các dòng tốt vẫn được tạo; lỗi hệ thống thì cả lô được báo lỗi.
 * Trả { created: [dòng đã tạo], failed: [{ row, email, reason }] }.
 */
export const insertInChunks = async (rows, { chunkSize = BULK_IMPORT_CHUNK_SIZE, insertChunk, insertOne, onError = () => {} }) => {
  const created = [];
  const failed = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    try {
      await insertChunk(chunk);
      created.push(...chunk);
      continue;
    } catch (error) {
      if (reasonOfInsertError(error) === null) {
        onError(error);
        chunk.forEach((row) => failed.push({ row: row.row, email: row.email, reason: SYSTEM_REASON }));
        continue;
      }
    }
    for (const row of chunk) {
      try {
        await insertOne(row);
        created.push(row);
      } catch (error) {
        const reason = reasonOfInsertError(error);
        if (reason === null) onError(error);
        failed.push({ row: row.row, email: row.email, reason: reason ?? SYSTEM_REASON });
      }
    }
  }
  return { created, failed };
};

/** Kết quả trả về cho API (api-users.md mục 2.12). */
export const buildImportSummary = ({ totalRows, createdCount, errors, emailsQueued = 0, emailMode = null }) => ({
  totalRows,
  successCount: createdCount,
  failureCount: errors.length,
  errors: [...errors].sort((a, b) => a.row - b.row),
  emailsQueued,
  emailMode
});
