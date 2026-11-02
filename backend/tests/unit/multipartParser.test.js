import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isMultipart, boundaryOf, safeFileName, parseMultipart, collectBody } from '../../src/utils/multipartParser.js';

// Đọc multipart/form-data không cần thư viện (nhập người dùng hàng loạt)

const BOUNDARY = '----WebKitFormBoundaryABC123';
const CT = `multipart/form-data; boundary=${BOUNDARY}`;

/** Dựng body multipart như trình duyệt: mỗi phần { name, filename?, type?, data } */
const build = (parts, boundary = BOUNDARY) => {
  const chunks = [];
  for (const part of parts) {
    let head = `--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"`;
    if (part.filename !== undefined) head += `; filename="${part.filename}"`;
    head += '\r\n';
    if (part.type) head += `Content-Type: ${part.type}\r\n`;
    chunks.push(Buffer.from(`${head}\r\n`), Buffer.isBuffer(part.data) ? part.data : Buffer.from(part.data), Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
};

const expectBadRequest = (fn) => assert.throws(fn, (error) => error.statusCode === 400 && error.isOperational === true);

describe('nhận diện multipart', () => {
  test('isMultipart chỉ nhận multipart/form-data', () => {
    assert.equal(isMultipart(CT), true);
    assert.equal(isMultipart('Multipart/Form-Data; boundary=x'), true);
    assert.equal(isMultipart('application/json'), false);
    assert.equal(isMultipart('multipart/form-datax; boundary=x'), false);
    assert.equal(isMultipart(undefined), false);
  });

  test('boundaryOf lấy boundary có hoặc không có ngoặc kép', () => {
    assert.equal(boundaryOf(CT), BOUNDARY);
    assert.equal(boundaryOf('multipart/form-data; boundary="a b-c"'), 'a b-c');
    assert.equal(boundaryOf('multipart/form-data; boundary=abc; charset=utf-8'), 'abc');
    assert.equal(boundaryOf('multipart/form-data'), null);
  });

  test('safeFileName bỏ đường dẫn, ký tự điều khiển và cắt ở 255 ký tự', () => {
    assert.equal(safeFileName('C:\\Users\\a\\ds.csv'), 'ds.csv');
    assert.equal(safeFileName('../../etc/passwd'), 'passwd');
    assert.equal(safeFileName('a\u0000b\nc.csv'), 'abc.csv');
    assert.equal(safeFileName('x'.repeat(400)).length, 255);
    assert.equal(safeFileName(null), '');
  });
});

describe('parseMultipart', () => {
  test('một tệp và một trường chữ', () => {
    const body = build([
      { name: 'file', filename: 'ds.csv', type: 'text/csv', data: 'email,fullName\r\na@x.vn,An' },
      { name: 'defaultRole', data: 'teacher' }
    ]);
    const { fields, files } = parseMultipart(body, CT);
    assert.deepEqual(fields, { defaultRole: 'teacher' });
    assert.equal(files.length, 1);
    assert.equal(files[0].field, 'file');
    assert.equal(files[0].filename, 'ds.csv');
    assert.equal(files[0].contentType, 'text/csv');
    assert.equal(files[0].data.toString(), 'email,fullName\r\na@x.vn,An');
  });

  test('dữ liệu nhị phân chứa 0x00, CRLF và chuỗi "--" vẫn nguyên vẹn', () => {
    const data = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x0d, 0x0a, 0x2d, 0x2d, 0xff, 0x0d, 0x0a, 0x0d, 0x0a, 0x00]);
    const { files } = parseMultipart(build([{ name: 'file', filename: 'a.xlsx', data }]), CT);
    assert.ok(files[0].data.equals(data));
  });

  test('tệp rỗng vẫn là một tệp có data rỗng', () => {
    const { files } = parseMultipart(build([{ name: 'file', filename: 'rong.csv', data: '' }]), CT);
    assert.equal(files.length, 1);
    assert.equal(files[0].data.length, 0);
  });

  test('tên tệp tiếng Việt và boundary có ngoặc kép', () => {
    const ct = 'multipart/form-data; boundary="abc def"';
    const body = build([{ name: 'file', filename: 'Danh sách sinh viên.csv', data: 'x' }], 'abc def');
    assert.equal(parseMultipart(body, ct).files[0].filename, 'Danh sách sinh viên.csv');
  });

  test('filename* (RFC 5987) được ưu tiên', () => {
    const body = Buffer.from(
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="x.csv"; filename*=UTF-8''Sinh%20vi%C3%AAn.csv\r\n\r\nabc\r\n--${BOUNDARY}--\r\n`
    );
    assert.equal(parseMultipart(body, CT).files[0].filename, 'Sinh viên.csv');
  });

  test('bỏ qua phần mở đầu (preamble) trước boundary đầu tiên', () => {
    const body = Buffer.concat([Buffer.from('lời mở đầu\r\n'), build([{ name: 'a', data: '1' }])]);
    assert.deepEqual(parseMultipart(body, CT).fields, { a: '1' });
  });

  test('trường chữ chứa xuống dòng và ký tự tiếng Việt', () => {
    const { fields } = parseMultipart(build([{ name: 'note', data: 'dòng 1\r\ndòng 2' }]), CT);
    assert.equal(fields.note, 'dòng 1\r\ndòng 2');
  });

  test('sai định dạng đều là lỗi 400', () => {
    expectBadRequest(() => parseMultipart(Buffer.from('{}'), 'application/json'));
    expectBadRequest(() => parseMultipart(Buffer.from('x'), 'multipart/form-data'));
    expectBadRequest(() => parseMultipart(Buffer.alloc(0), CT));
    expectBadRequest(() => parseMultipart(Buffer.from('không có boundary nào'), CT));
    expectBadRequest(() => parseMultipart('chuỗi không phải Buffer', CT));
  });

  test('body bị cắt cụt hoặc thiếu Content-Disposition là lỗi 400', () => {
    const full = build([{ name: 'file', filename: 'a.csv', data: 'abcdef' }]);
    expectBadRequest(() => parseMultipart(full.subarray(0, full.length - 30), CT));
    expectBadRequest(() => parseMultipart(Buffer.from(`--${BOUNDARY}\r\nX-Khac: 1\r\n\r\nabc\r\n--${BOUNDARY}--\r\n`), CT));
  });

  test('quá nhiều phần bị từ chối', () => {
    const parts = Array.from({ length: 25 }, (_, i) => ({ name: `f${i}`, data: String(i) }));
    expectBadRequest(() => parseMultipart(build(parts), CT));
  });
});

describe('collectBody', () => {
  async function* chunks(...items) { for (const item of items) yield item; }

  test('gom các mảnh (Buffer hoặc Uint8Array) thành một Buffer', async () => {
    const body = await collectBody(chunks(Buffer.from('ab'), new Uint8Array([99]), Buffer.from('d')), 100);
    assert.equal(body.toString(), 'abcd');
  });

  test('vượt giới hạn thì báo 400 với thông điệp đã chọn và dừng đọc', async () => {
    let read = 0;
    async function* many() { for (let i = 0; i < 10; i += 1) { read += 1; yield Buffer.alloc(10); } }
    await assert.rejects(collectBody(many(), 25, 'quá lớn'), (error) => error.statusCode === 400 && error.message === 'quá lớn');
    assert.equal(read, 3);
  });

  test('luồng rỗng cho Buffer rỗng', async () => {
    assert.equal((await collectBody(chunks(), 10)).length, 0);
  });
});
