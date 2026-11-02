import { AppError } from './AppError.js';

/**
 * Đọc nội dung gửi lên dạng multipart/form-data mà không cần thư viện ngoài (multer, busboy).
 * Chỉ dùng cho các API tải tệp nhỏ (nhập người dùng hàng loạt, giới hạn 5MB): đọc toàn bộ body vào bộ nhớ
 * rồi tách các phần. Không dùng cho tệp lớn (dùng presigned URL, xem docs/api/api-uploads.md).
 * Là hàm thuần (chỉ phụ thuộc Buffer) nên có unit test: tests/unit/multipartParser.test.js.
 */

const MAX_PARTS = 20;
const MAX_HEADER_BYTES = 8192;
const DOUBLE_CRLF = Buffer.from('\r\n\r\n');

const bad = (message) => new AppError(message, 400, 'Bad Request');
const malformed = () => bad('Dữ liệu multipart/form-data gửi lên bị lỗi hoặc không đầy đủ');

export const isMultipart = (contentType) => /^multipart\/form-data\s*(;|$)/i.test(String(contentType || '').trim());

export const boundaryOf = (contentType) => {
  const match = /boundary=(?:"([^"]+)"|([^;,\s]+))/i.exec(String(contentType || ''));
  return match ? (match[1] || match[2]) : null;
};

/** Chỉ giữ tên tệp (bỏ đường dẫn), bỏ ký tự điều khiển, tối đa 255 ký tự. */
export const safeFileName = (name) => {
  const base = String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').split(/[\\/]/).pop().trim();
  return base.slice(0, 255);
};

const parsePartHeaders = (headerText) => {
  const headers = {};
  for (const line of headerText.split('\r\n')) {
    const index = line.indexOf(':');
    if (index > 0) headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
  }
  return headers;
};

const unescapeQuoted = (value) => value.replace(/\\(.)/g, '$1');

const parseDisposition = (value = '') => {
  const nameMatch = /;\s*name=(?:"((?:[^"\\]|\\.)*)"|([^;\s]+))/i.exec(value);
  const fileMatch = /;\s*filename=(?:"((?:[^"\\]|\\.)*)"|([^;\s]+))/i.exec(value);
  const fileStar = /;\s*filename\*=([^;\s]+)/i.exec(value);
  let filename = null;
  if (fileStar) {
    // RFC 5987: filename*=UTF-8''%E2%80%A6
    const encoded = fileStar[1].replace(/^[^']*'[^']*'/, '');
    try { filename = decodeURIComponent(encoded); } catch { filename = null; }
  }
  if (filename === null && fileMatch) filename = unescapeQuoted(fileMatch[1] ?? fileMatch[2] ?? '');
  return { name: nameMatch ? unescapeQuoted(nameMatch[1] ?? nameMatch[2] ?? '') : null, filename };
};

/**
 * Tách body multipart.
 * Trả về { fields: { tên: giá trị chuỗi }, files: [{ field, filename, contentType, data: Buffer }] }.
 * Ném AppError 400 khi sai định dạng.
 */
export const parseMultipart = (body, contentType) => {
  if (!isMultipart(contentType)) throw bad('Yêu cầu phải gửi dạng multipart/form-data');
  const boundary = boundaryOf(contentType);
  if (!boundary || boundary.length > 200) throw bad('Thiếu boundary của multipart/form-data');
  if (!Buffer.isBuffer(body) || body.length === 0) throw malformed();

  const delimiter = Buffer.from(`--${boundary}`);
  const nextDelimiter = Buffer.from(`\r\n--${boundary}`);
  let position = body.indexOf(delimiter);
  if (position === -1) throw malformed();

  const fields = {};
  const files = [];
  let partCount = 0;
  for (;;) {
    position += delimiter.length;
    if (body[position] === 0x2d && body[position + 1] === 0x2d) break; // "--" kết thúc
    if (body[position] !== 0x0d || body[position + 1] !== 0x0a) throw malformed();
    position += 2;

    const headerEnd = body.indexOf(DOUBLE_CRLF, position);
    if (headerEnd === -1 || headerEnd - position > MAX_HEADER_BYTES) throw malformed();
    const headers = parsePartHeaders(body.toString('utf8', position, headerEnd));
    const dataStart = headerEnd + DOUBLE_CRLF.length;
    const end = body.indexOf(nextDelimiter, dataStart);
    if (end === -1) throw malformed();

    partCount += 1;
    if (partCount > MAX_PARTS) throw bad('Dữ liệu gửi lên có quá nhiều phần');
    const { name, filename } = parseDisposition(headers['content-disposition']);
    if (name === null) throw malformed();
    const data = body.subarray(dataStart, end);
    if (filename !== null) {
      files.push({ field: name, filename: safeFileName(filename), contentType: headers['content-type'] || 'application/octet-stream', data });
    } else {
      fields[name] = data.toString('utf8');
    }
    position = end + 2; // trỏ vào đầu "--boundary" kế tiếp
  }
  return { fields, files };
};

/**
 * Gom toàn bộ luồng dữ liệu vào một Buffer, dừng và báo lỗi 400 ngay khi vượt maxBytes.
 * `stream` là bất kỳ thứ gì duyệt được bằng `for await` (req của Express, hoặc bản giả khi test).
 */
export const collectBody = async (stream, maxBytes, tooLargeMessage = 'Dung lượng dữ liệu gửi lên vượt quá giới hạn') => {
  const chunks = [];
  let total = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw bad(tooLargeMessage);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, total);
};
