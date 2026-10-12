import ExcelJS from 'exceljs';
import { getClassGradebook } from './gradebookService.js';
import { sanitizeFileName } from './uploadService.js';

/**
 * GET /classes/:id/grades/export-excel?format=xlsx|csv (api-classes.md 2.13, UC-GRADE-003)
 * Cột theo đặc tả: STT, Mã học viên, Họ và tên, Email, Tiến độ (%), điểm từng Quiz, điểm từng Bài tập,
 * Điểm TB Quizzes, Điểm TB Assignments, Điểm tổng kết, Xếp loại (+ Ghi chú "Chưa chấm" theo grading-policy E2).
 */
const WEIGHT_LABEL = { quiz: 'Bài kiểm tra', assignment: 'Bài tập', progress: 'Tiến độ học' };

const pct = (w) => `${Math.round(w * 1000) / 10}%`;

const stamp = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');

const buildTable = (book) => {
  const headers = [
    'STT', 'Mã học viên', 'Họ và tên', 'Email', 'Tiến độ học tập (%)',
    ...book.quizzes.map((q) => `Quiz: ${q.title}`),
    ...book.assignments.map((a) => `Bài tập: ${a.title}`),
    ...(book.quizzes.length ? ['Điểm TB Quizzes'] : []),
    ...(book.assignments.length ? ['Điểm TB Assignments'] : []),
    'Điểm Tổng kết (Thang 10)', 'Xếp loại', 'Ghi chú'
  ];
  const rows = book.rows.map((r) => [
    r.index,
    r.student.id,
    r.student.fullName,
    r.student.email,
    r.progressPercentage,
    ...r.quizScores.map((q) => q.score),
    ...r.assignmentScores.map((a) => a.grade),
    ...(book.quizzes.length ? [r.quizAverage] : []),
    ...(book.assignments.length ? [r.assignmentAverage] : []),
    r.finalScore,
    r.ranking,
    r.notes.join('; ')
  ]);
  return { headers, rows };
};

const formulaText = (book) => {
  const parts = Object.entries(book.weights).map(([k, w]) => `${pct(w)} ${WEIGHT_LABEL[k]}`).join(' + ');
  return `Điểm tổng kết = ${parts}`;
};

const toXlsx = async (book) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduVerse';
  workbook.created = book.generatedAt;

  const { headers, rows } = buildTable(book);
  const sheet = workbook.addWorksheet('Bảng điểm', { views: [{ state: 'frozen', xSplit: 3, ySplit: 4 }] });
  sheet.addRow([`BẢNG ĐIỂM LỚP: ${book.class.name} (${book.class.classCode})`]).font = { bold: true, size: 14 };
  sheet.addRow([`Khóa học: ${book.class.course.title} · Xuất lúc: ${book.generatedAt.toLocaleString('vi-VN')}`]);
  sheet.addRow([formulaText(book)]).font = { italic: true };
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', wrapText: true };
  headerRow.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1168BD' } }; });
  rows.forEach((values) => sheet.addRow(values));

  // Định dạng số & độ rộng cột
  headers.forEach((header, i) => {
    const column = sheet.getColumn(i + 1);
    column.width = i === 0 ? 6 : i === 1 ? 38 : i === 2 ? 24 : i === 3 ? 28 : header === 'Ghi chú' ? 40 : Math.min(22, Math.max(12, header.length * 0.6));
    if (i >= 4 && !['Xếp loại', 'Ghi chú'].includes(header)) column.numFmt = '0.00';
  });

  // Sheet quy tắc tính điểm
  const rules = workbook.addWorksheet('Quy tắc tính điểm');
  [
    ['Quy tắc tính điểm (docs/requirements/grading-policy.md)'],
    [formulaText(book)],
    ['Bài kiểm tra: lấy điểm cao nhất mỗi bài; chưa làm = 0'],
    ['Bài tập: chưa nộp = 0; đã nộp chưa chấm tạm tính 0 (ghi chú "Chưa chấm"); nộp lại dùng điểm lần chấm gần nhất'],
    ['Tiến độ: % bài học hoàn thành / 10'],
    ['Thiếu Quiz hoặc Bài tập: bỏ thành phần đó, chia lại tỷ trọng theo tỷ lệ'],
    ['Xếp loại: Giỏi ≥ 8 · Khá ≥ 6.5 · Trung bình ≥ 5 · Chưa đạt < 5']
  ].forEach((row) => rules.addRow(row));
  rules.getRow(1).font = { bold: true };
  rules.getColumn(1).width = 110;

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (book) => {
  const { headers, rows } = buildTable(book);
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
  // BOM để Excel mở đúng tiếng Việt UTF-8
  return Buffer.from(`﻿${lines.join('\r\n')}\r\n`, 'utf8');
};

export const exportGrades = async (classId, user, format = 'xlsx') => {
  const book = await getClassGradebook(classId, user);
  const base = `Bang_Diem_Lop_${sanitizeFileName(book.class.classCode || book.class.name)}_${stamp(book.generatedAt)}`;
  if (format === 'csv') {
    return { buffer: toCsv(book), fileName: `${base}.csv`, contentType: 'text/csv; charset=utf-8' };
  }
  return {
    buffer: await toXlsx(book),
    fileName: `${base}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
};

export default { exportGrades };
