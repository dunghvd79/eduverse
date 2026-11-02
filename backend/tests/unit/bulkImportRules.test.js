import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import {
  BULK_IMPORT_MAX_ROWS,
  normalizeKey,
  cellToString,
  detectDelimiter,
  decodeCsvBuffer,
  parseCsv,
  fileTypeOf,
  normalizeRole,
  normalizePhone,
  recordsFromMatrix,
  isValidEmail,
  validateRecord,
  planImport,
  generateTempPassword,
  reasonOfInsertError,
  insertInChunks,
  buildImportSummary
} from '../../src/utils/bulkImportRules.js';

// Quy tắc nhập người dùng hàng loạt (api-users.md mục 2.12)

// Cùng biểu thức với validations/userValidation.js
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:,.<>]{8,32}$/;
const rowsOf = (...lines) => lines.map((line) => line.split('|'));
const expectStatus = (fn, status) => assert.throws(fn, (error) => error.statusCode === status && error.isOperational === true, `mong đợi ${status}`);
const named = (name, extra = {}) => Object.assign(new Error(name), { name, ...extra });

describe('chuẩn hóa chuỗi và ô', () => {
  test('normalizeKey bỏ dấu tiếng Việt, ký tự lạ và viết hoa', () => {
    assert.equal(normalizeKey('Họ và tên'), 'hovaten');
    assert.equal(normalizeKey(' Số điện thoại '), 'sodienthoai');
    assert.equal(normalizeKey('training_manager'), 'trainingmanager');
    assert.equal(normalizeKey('Đào tạo'), 'daotao');
    assert.equal(normalizeKey(null), '');
  });

  test('cellToString: chuỗi, số, ngày, công thức, siêu liên kết, rich text', () => {
    assert.equal(cellToString('  a@x.vn '), 'a@x.vn');
    assert.equal(cellToString(981234567), '981234567');
    assert.equal(cellToString(null), '');
    assert.equal(cellToString(undefined), '');
    assert.equal(cellToString(Number.NaN), '');
    assert.equal(cellToString(true), 'TRUE');
    assert.equal(cellToString(new Date('2026-11-01T00:00:00Z')), '2026-11-01T00:00:00.000Z');
    assert.equal(cellToString({ text: 'a@x.vn', hyperlink: 'mailto:a@x.vn' }), 'a@x.vn');
    assert.equal(cellToString({ hyperlink: 'mailto:b@x.vn' }), 'b@x.vn');
    assert.equal(cellToString({ formula: 'A1&B1', result: 'An' }), 'An');
    assert.equal(cellToString({ richText: [{ text: 'Nguyễn ' }, { text: 'Văn A' }] }), 'Nguyễn Văn A');
    assert.equal(cellToString({ error: '#N/A' }), '');
  });
});

describe('đọc CSV', () => {
  test('dấu phân cách được đoán từ dòng đầu: phẩy, chấm phẩy, tab', () => {
    assert.equal(detectDelimiter('email,fullName\na,b'), ',');
    assert.equal(detectDelimiter('email;fullName\na;b'), ';');
    assert.equal(detectDelimiter('email\tfullName\na\tb'), '\t');
    assert.equal(detectDelimiter('chỉ một cột'), ',');
    assert.equal(detectDelimiter('"a,b";c\nx;y'), ';');
  });

  test('ô trong ngoặc kép chứa dấu phân cách, ngoặc kép đôi và xuống dòng', () => {
    const rows = parseCsv('email,fullName\r\na@x.vn,"Nguyễn, Văn ""A"""\r\nb@x.vn,"dòng 1\ndòng 2"\r\n');
    assert.deepEqual(rows, [['email', 'fullName'], ['a@x.vn', 'Nguyễn, Văn "A"'], ['b@x.vn', 'dòng 1\ndòng 2']]);
  });

  test('bỏ BOM, hỗ trợ CRLF, LF và CR, không thêm dòng ảo ở cuối tệp', () => {
    assert.deepEqual(parseCsv('﻿a,b\r\nc,d'), [['a', 'b'], ['c', 'd']]);
    assert.deepEqual(parseCsv('a,b\nc,d\n'), [['a', 'b'], ['c', 'd']]);
    assert.deepEqual(parseCsv('a,b\rc,d\r'), [['a', 'b'], ['c', 'd']]);
    assert.deepEqual(parseCsv(''), []);
  });

  test('dòng trống ở giữa vẫn chiếm một dòng để số dòng báo lỗi khớp tệp', () => {
    const rows = parseCsv('a,b\n\nc,d');
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[1], ['']);
  });

  test('ô cuối rỗng và khoảng trắng hai đầu được giữ đúng', () => {
    assert.deepEqual(parseCsv('a, b ,\nx,,'), [['a', 'b', ''], ['x', '', '']]);
  });

  test('dấu ngoặc kép chưa đóng là lỗi 400', () => {
    expectStatus(() => parseCsv('a,b\n"abc,d'), 400);
  });

  test('decodeCsvBuffer: nhận UTF-8, từ chối ANSI và nhị phân', () => {
    assert.equal(decodeCsvBuffer(Buffer.from('Nguyễn Văn A', 'utf8')), 'Nguyễn Văn A');
    expectStatus(() => decodeCsvBuffer(Buffer.from([0x4e, 0x67, 0x75, 0x79, 0xea, 0x6e])), 400); // "Nguyên" ANSI (0xEA)
    expectStatus(() => decodeCsvBuffer(Buffer.from([0x50, 0x4b, 0x00, 0x01])), 400);
  });

  test('fileTypeOf theo đuôi và nội dung', () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    assert.equal(fileTypeOf('DS.CSV', Buffer.from('a')), 'csv');
    assert.equal(fileTypeOf('ds.xlsx', zip), 'xlsx');
    assert.equal(fileTypeOf('ds.xlsx', Buffer.from('không phải zip')), null);
    assert.equal(fileTypeOf('ds.xls', zip), null);
    assert.equal(fileTypeOf('ds.csv.exe', Buffer.from('a')), null);
    assert.equal(fileTypeOf('', zip), null);
  });
});

describe('vai trò và số điện thoại', () => {
  test('normalizeRole: để trống dùng mặc định, nhận tên Việt/Anh, không bao giờ nhận admin', () => {
    assert.equal(normalizeRole('', 'teacher'), 'teacher');
    assert.equal(normalizeRole(undefined, 'student'), 'student');
    assert.equal(normalizeRole('Student'), 'student');
    assert.equal(normalizeRole('Giảng viên'), 'teacher');
    assert.equal(normalizeRole('training_manager'), 'training_manager');
    assert.equal(normalizeRole('Quản lý đào tạo'), 'training_manager');
    assert.equal(normalizeRole('admin'), null);
    assert.equal(normalizeRole('quản trị viên'), null);
    assert.equal(normalizeRole('xyz'), null);
  });

  test('normalizePhone: khôi phục số 0 đầu bị Excel làm mất, bỏ ngăn cách', () => {
    assert.equal(normalizePhone('981234567'), '0981234567');
    assert.equal(normalizePhone('0981 234 567'), '0981234567');
    assert.equal(normalizePhone('098.123.4567'), '0981234567');
    assert.equal(normalizePhone('84981234567'), '+84981234567');
    assert.equal(normalizePhone('+84981234567'), '+84981234567');
    assert.equal(normalizePhone(''), '');
    assert.equal(normalizePhone(null), '');
    assert.equal(normalizePhone('12345'), '12345');
  });
});

describe('recordsFromMatrix', () => {
  test('nhận tên cột tiếng Anh và tiếng Việt, không phân biệt hoa thường và dấu', () => {
    const a = recordsFromMatrix(rowsOf('email|fullName|phoneNumber|role', 'a@x.vn|An|0981234567|teacher'));
    const b = recordsFromMatrix(rowsOf('Email|Họ và tên|Số điện thoại|Vai trò', 'a@x.vn|An|0981234567|teacher'));
    assert.deepEqual(a, b);
    assert.deepEqual(a, [{ row: 2, email: 'a@x.vn', fullName: 'An', phoneNumber: '0981234567', role: 'teacher' }]);
  });

  test('cột có thể đứng bất kỳ thứ tự nào, cột thừa bị bỏ qua, cột tùy chọn có thể vắng', () => {
    const records = recordsFromMatrix(rowsOf('Ghi chú|fullName|email', 'x|Bình|b@x.vn'));
    assert.deepEqual(records, [{ row: 2, email: 'b@x.vn', fullName: 'Bình', phoneNumber: '', role: '' }]);
  });

  test('số dòng tính theo tệp: dòng trống đầu tệp và giữa tệp vẫn được đếm, dòng trống bị bỏ qua', () => {
    const matrix = [[''], ['email', 'fullName'], ['a@x.vn', 'An'], [''], [], ['b@x.vn', 'Bình']];
    assert.deepEqual(recordsFromMatrix(matrix).map((r) => r.row), [3, 6]);
  });

  test('422 khi tệp rỗng, chỉ có tiêu đề, hoặc thiếu cột bắt buộc', () => {
    expectStatus(() => recordsFromMatrix([]), 422);
    expectStatus(() => recordsFromMatrix(null), 422);
    expectStatus(() => recordsFromMatrix([[''], ['']]), 422);
    expectStatus(() => recordsFromMatrix(rowsOf('email|fullName')), 422);
    expectStatus(() => recordsFromMatrix(rowsOf('email|phone', 'a@x.vn|0981234567')), 422);
    expectStatus(() => recordsFromMatrix(rowsOf('fullName|role', 'An|student')), 422);
    assert.throws(() => recordsFromMatrix(rowsOf('email|role', 'a@x.vn|student')), /fullName/);
  });

  test(`422 khi quá ${BULK_IMPORT_MAX_ROWS} dòng, đúng ${BULK_IMPORT_MAX_ROWS} dòng thì được`, () => {
    const make = (n) => [['email', 'fullName'], ...Array.from({ length: n }, (_, i) => [`u${i}@x.vn`, `Người ${i}`])];
    assert.equal(recordsFromMatrix(make(BULK_IMPORT_MAX_ROWS)).length, BULK_IMPORT_MAX_ROWS);
    expectStatus(() => recordsFromMatrix(make(BULK_IMPORT_MAX_ROWS + 1)), 422);
  });
});

describe('kiểm tra từng dòng', () => {
  const rec = (over = {}) => ({ row: 2, email: 'An@Example.COM ', fullName: '  Nguyễn   Văn  An ', phoneNumber: '', role: '', ...over });

  test('dòng hợp lệ: email viết thường, tên gọn khoảng trắng, vai trò mặc định', () => {
    const { value, reason } = validateRecord(rec(), 'teacher');
    assert.equal(reason, undefined);
    assert.deepEqual(value, { row: 2, email: 'an@example.com', fullName: 'Nguyễn Văn An', phoneNumber: '', role: 'teacher' });
  });

  test('isValidEmail', () => {
    for (const ok of ['a@x.vn', 'sv2026001@eduverse.vn', 'a.b+c@sub.domain.edu.vn', "o'neil@x.com"]) assert.equal(isValidEmail(ok), true, ok);
    for (const bad of ['', 'abc', 'a@', '@x.vn', 'a@x', 'a b@x.vn', 'a@x..vn', '.a@x.vn', 'a.@x.vn', 'a..b@x.vn', 'a@-x.vn', 'a@x.v', 'a@@x.vn', `${'a'.repeat(250)}@x.vn`]) {
      assert.equal(isValidEmail(bad), false, bad);
    }
  });

  test('thông điệp lỗi theo từng trường', () => {
    assert.equal(validateRecord(rec({ email: '' })).reason, 'Thiếu địa chỉ email');
    assert.equal(validateRecord(rec({ email: 'invalid-email-format' })).reason, 'Địa chỉ email không đúng định dạng');
    assert.equal(validateRecord(rec({ fullName: '' })).reason, 'Thiếu họ và tên');
    assert.equal(validateRecord(rec({ fullName: 'A' })).reason, 'Họ và tên phải có ít nhất 2 ký tự');
    assert.equal(validateRecord(rec({ fullName: 'A'.repeat(151) })).reason, 'Họ và tên không được vượt quá 150 ký tự');
    assert.match(validateRecord(rec({ phoneNumber: '123' })).reason, /Số điện thoại không đúng định dạng/);
    assert.match(validateRecord(rec({ role: 'admin' })).reason, /Vai trò không hợp lệ/);
  });

  test('số điện thoại mất số 0 đầu được khôi phục, vai trò Việt được nhận', () => {
    const { value } = validateRecord(rec({ phoneNumber: '981234567', role: 'Giảng viên' }));
    assert.equal(value.phoneNumber, '0981234567');
    assert.equal(value.role, 'teacher');
  });
});

describe('planImport', () => {
  const r = (row, email, fullName = 'Người Dùng', extra = {}) => ({ row, email, fullName, phoneNumber: '', role: '', ...extra });

  test('tách dòng hợp lệ và lỗi, giữ số dòng và email gốc trong lỗi', () => {
    const { valid, errors } = planImport([r(2, 'a@x.vn'), r(3, 'invalid-email-format'), r(4, 'b@x.vn', 'B')], {});
    assert.deepEqual(valid.map((v) => v.row), [2]);
    assert.deepEqual(errors, [
      { row: 3, email: 'invalid-email-format', reason: 'Địa chỉ email không đúng định dạng' },
      { row: 4, email: 'b@x.vn', reason: 'Họ và tên phải có ít nhất 2 ký tự' }
    ]);
  });

  test('email trùng trong file (không phân biệt hoa thường): dòng sau bị loại, nêu dòng đầu', () => {
    const { valid, errors } = planImport([r(2, 'a@x.vn'), r(3, 'A@X.vn'), r(4, 'c@x.vn')], {});
    assert.deepEqual(valid.map((v) => v.row), [2, 4]);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].row, 3);
    assert.match(errors[0].reason, /trùng trong file.*dòng 2/);
  });

  test('email đã có trong hệ thống bị loại với đúng thông điệp của đặc tả', () => {
    const { valid, errors } = planImport([r(2, 'teacher1@eduverse.vn'), r(3, 'new@eduverse.vn')], { existingEmails: new Set(['teacher1@eduverse.vn']) });
    assert.deepEqual(valid.map((v) => v.email), ['new@eduverse.vn']);
    assert.deepEqual(errors, [{ row: 2, email: 'teacher1@eduverse.vn', reason: 'Địa chỉ email đã tồn tại trong hệ thống' }]);
  });

  test('dòng sai định dạng không "chiếm" email: dòng đúng sau đó vẫn được nhận', () => {
    const { valid, errors } = planImport([r(2, 'a@x.vn', 'A'), r(3, 'a@x.vn', 'An Bình')], {});
    assert.deepEqual(valid.map((v) => v.row), [3]);
    assert.equal(errors.length, 1);
  });

  test('vai trò mặc định áp dụng cho dòng không ghi vai trò, dòng có ghi giữ nguyên', () => {
    const { valid } = planImport([r(2, 'a@x.vn'), r(3, 'b@x.vn', 'Bình Minh', { role: 'training_manager' })], { defaultRole: 'teacher' });
    assert.deepEqual(valid.map((v) => v.role), ['teacher', 'training_manager']);
  });
});

describe('generateTempPassword', () => {
  test('luôn đúng chính sách mật khẩu và đủ 12 ký tự (3000 lần ngẫu nhiên thật)', () => {
    const seen = new Set();
    for (let i = 0; i < 3000; i += 1) {
      const password = generateTempPassword(randomInt);
      assert.equal(password.length, 12);
      assert.match(password, PASSWORD_POLICY, password);
      assert.doesNotMatch(password, /[0OIl1]/, `ký tự dễ nhầm trong ${password}`);
      seen.add(password);
    }
    assert.equal(seen.size, 3000);
  });

  test('ngay cả khi bộ sinh số luôn trả 0 vẫn đủ 4 loại ký tự', () => {
    assert.match(generateTempPassword(() => 0), PASSWORD_POLICY);
    assert.match(generateTempPassword((max) => max - 1), PASSWORD_POLICY);
  });

  test('độ dài tùy chọn', () => {
    assert.equal(generateTempPassword(randomInt, 16).length, 16);
  });
});

describe('insertInChunks', () => {
  const makeRows = (n) => Array.from({ length: n }, (_, i) => ({ row: i + 2, email: `u${i}@x.vn` }));

  test('chèn theo lô đúng kích thước, mỗi lô một lần gọi', async () => {
    const calls = [];
    const { created, failed } = await insertInChunks(makeRows(250), {
      chunkSize: 100,
      insertChunk: async (chunk) => { calls.push(chunk.length); },
      insertOne: async () => { throw new Error('không được gọi'); }
    });
    assert.deepEqual(calls, [100, 100, 50]);
    assert.equal(created.length, 250);
    assert.deepEqual(failed, []);
  });

  test('danh sách rỗng không gọi gì', async () => {
    let called = false;
    const result = await insertInChunks([], { insertChunk: async () => { called = true; }, insertOne: async () => { called = true; } });
    assert.equal(called, false);
    assert.deepEqual(result, { created: [], failed: [] });
  });

  test('lô lỗi trùng email: thử lại từng dòng, dòng tốt vẫn được tạo, dòng trùng báo lỗi', async () => {
    const one = [];
    const { created, failed } = await insertInChunks(makeRows(4), {
      chunkSize: 4,
      insertChunk: async () => { throw named('SequelizeUniqueConstraintError'); },
      insertOne: async (row) => {
        if (row.email === 'u2@x.vn') throw named('SequelizeUniqueConstraintError');
        one.push(row.email);
      }
    });
    assert.deepEqual(one, ['u0@x.vn', 'u1@x.vn', 'u3@x.vn']);
    assert.equal(created.length, 3);
    assert.deepEqual(failed, [{ row: 4, email: 'u2@x.vn', reason: 'Địa chỉ email đã tồn tại trong hệ thống' }]);
  });

  test('lỗi dữ liệu không hợp lệ cũng được xử lý từng dòng', async () => {
    const { created, failed } = await insertInChunks(makeRows(2), {
      chunkSize: 2,
      insertChunk: async () => { throw named('SequelizeValidationError'); },
      insertOne: async (row) => { if (row.row === 3) throw named('SequelizeValidationError'); }
    });
    assert.equal(created.length, 1);
    assert.equal(failed[0].reason, 'Dữ liệu không đáp ứng ràng buộc của hệ thống');
  });

  test('lỗi hệ thống: cả lô báo lỗi, các lô sau vẫn chạy, lỗi được ghi nhận qua onError', async () => {
    const logged = [];
    let call = 0;
    const { created, failed } = await insertInChunks(makeRows(5), {
      chunkSize: 2,
      insertChunk: async () => { call += 1; if (call === 2) throw new Error('mất kết nối'); },
      insertOne: async () => { throw new Error('không được gọi'); },
      onError: (error) => logged.push(error.message)
    });
    assert.equal(created.length, 3);
    assert.deepEqual(failed.map((f) => f.row), [4, 5]);
    assert.match(failed[0].reason, /lỗi hệ thống/);
    assert.deepEqual(logged, ['mất kết nối']);
  });

  test('reasonOfInsertError', () => {
    assert.match(reasonOfInsertError(named('SequelizeUniqueConstraintError')), /đã tồn tại/);
    assert.match(reasonOfInsertError(named('SequelizeValidationError')), /ràng buộc/);
    assert.equal(reasonOfInsertError(new Error('x')), null);
    assert.equal(reasonOfInsertError(null), null);
  });
});

describe('buildImportSummary', () => {
  test('đếm đúng và sắp lỗi theo số dòng', () => {
    const summary = buildImportSummary({
      totalRows: 5, createdCount: 3,
      errors: [{ row: 9, email: 'b', reason: 'x' }, { row: 3, email: 'a', reason: 'y' }],
      emailsQueued: 3, emailMode: 'queue_smtp'
    });
    assert.equal(summary.totalRows, 5);
    assert.equal(summary.successCount, 3);
    assert.equal(summary.failureCount, 2);
    assert.deepEqual(summary.errors.map((e) => e.row), [3, 9]);
    assert.equal(summary.emailsQueued, 3);
    assert.equal(summary.emailMode, 'queue_smtp');
  });

  test('không chứa mật khẩu hay mã băm dù đầu vào có', () => {
    const summary = buildImportSummary({ totalRows: 1, createdCount: 1, errors: [], emailsQueued: 1, emailMode: 'direct_log', tempPassword: 'Secret1!', passwordHash: 'h' });
    assert.doesNotMatch(JSON.stringify(summary), /Secret1|passwordHash|tempPassword/);
  });
});
