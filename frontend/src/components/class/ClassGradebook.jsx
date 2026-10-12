import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Info, Search, Trophy, Users } from 'lucide-react';
import { Button, Card, Badge, StatCard } from '../portal/PortalUI';
import gradebookService, { ASSIGNMENT_STATE, RANKING_TONE, formulaText } from '../../services/gradebookService';
import { formatScore } from '../../services/quizService';
import { toast } from '../common/Toast';

const RANKINGS = ['Giỏi', 'Khá', 'Trung bình', 'Chưa đạt'];
const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

/**
 * Bảng điểm cả lớp (grading-policy.md): ma trận điểm Quiz / Bài tập / Tiến độ, tổng kết, xếp loại, xuất Excel/CSV.
 * Dùng trong tab "Bảng điểm" của trang lớp (GV phụ trách, Quản lý, Admin).
 */
export default function ClassGradebook({ cls }) {
  const [book, setBook] = useState(null);
  const [search, setSearch] = useState('');
  const [ranking, setRanking] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    gradebookService.gradebook(cls.id)
      .then(setBook)
      .catch(error => toast.error(error?.message || 'Không thể tải bảng điểm.'));
  }, [cls.id]);

  const rows = useMemo(() => {
    if (!book) return [];
    const key = search.trim().toLowerCase();
    return book.rows.filter(r =>
      (!ranking || r.ranking === ranking) &&
      (!key || r.student.fullName.toLowerCase().includes(key) || r.student.email.toLowerCase().includes(key)));
  }, [book, search, ranking]);

  const exportFile = async (format) => {
    try {
      setExporting(format);
      await gradebookService.exportGrades(cls.id, format, `Bang_Diem_Lop_${cls.classCode || 'lop'}_${today()}`);
    } catch (error) {
      toast.error(error?.message || 'Không thể xuất bảng điểm.');
    } finally {
      setExporting('');
    }
  };

  if (!book) return <Card><div className="p-6 text-center text-slate-500">Đang tính bảng điểm...</div></Card>;

  const { summary } = book;

  return (
    <>
      <div className="stats-grid">
        <StatCard icon={BarChart3} label="Điểm TB lớp" value={formatScore(summary.averageFinalScore)} sub={`${summary.totalStudents} học viên`} />
        <StatCard icon={Trophy} label="Giỏi / Khá" value={`${summary.distribution['Giỏi']} / ${summary.distribution['Khá']}`} />
        <StatCard icon={Users} label="Trung bình / Chưa đạt" value={`${summary.distribution['Trung bình']} / ${summary.distribution['Chưa đạt']}`} />
        <StatCard icon={FileSpreadsheet} label="Bài tập chưa chấm" value={summary.ungradedCount} sub={summary.ungradedCount ? 'Đang tạm tính 0 điểm' : 'Đã chấm hết'} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Info size={15} className="flex-shrink-0" />
            <span>Tổng kết = {formulaText(book.weights)} · Quiz lấy điểm cao nhất · chưa làm/chưa nộp = 0</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => exportFile('csv')} disabled={!!exporting}><Download size={15} /> {exporting === 'csv' ? 'Đang xuất...' : 'CSV'}</Button>
            <Button onClick={() => exportFile('xlsx')} disabled={!!exporting}><FileSpreadsheet size={15} /> {exporting === 'xlsx' ? 'Đang xuất...' : 'Xuất Excel'}</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="tabs flex-wrap">
            {[['', 'Tất cả'], ...RANKINGS.map(r => [r, r])].map(([value, label]) => (
              <button key={value || 'all'} className={`tab ${ranking === value ? 'active' : ''}`} onClick={() => setRanking(value)}>
                {label}{value && ` (${summary.distribution[value]})`}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-56">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm học viên..." className="flex-1 min-w-0 text-sm outline-none" />
          </label>
        </div>

        {book.rows.length === 0 ? (
          <p className="p-6 text-center text-slate-500">Lớp chưa có học viên.</p>
        ) : (
          <div className="table-wrap">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10">Học viên</th>
                  <th>Tiến độ</th>
                  {book.quizzes.map(q => <th key={q.id} title={q.title} className="max-w-[120px] truncate">Quiz: {q.title}</th>)}
                  {book.quizzes.length > 0 && <th>TB Quiz</th>}
                  {book.assignments.map(a => <th key={a.id} title={a.title} className="max-w-[120px] truncate">BT: {a.title}</th>)}
                  {book.assignments.length > 0 && <th>TB Bài tập</th>}
                  <th>Tổng kết</th>
                  <th>Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.student.id}>
                    <td className="sticky left-0 bg-white z-10">
                      <b className="block whitespace-nowrap">{row.student.fullName}</b>
                      <small className="text-slate-500">{row.student.email}</small>
                    </td>
                    <td className="whitespace-nowrap">{row.progressPercentage}%<small className="block text-slate-400">{row.completedLessons}/{row.totalLessons} bài</small></td>
                    {row.quizScores.map(q => (
                      <td key={q.quizId} className={q.attempted ? '' : 'text-slate-400'} title={q.attempted ? 'Điểm cao nhất' : 'Chưa làm'}>{q.attempted ? formatScore(q.score) : '0 *'}</td>
                    ))}
                    {book.quizzes.length > 0 && <td><b>{formatScore(row.quizAverage)}</b></td>}
                    {row.assignmentScores.map(a => {
                      const badge = ASSIGNMENT_STATE[a.state];
                      return (
                        <td key={a.assignmentId}>
                          {formatScore(a.grade)}
                          {badge && <span className={`block text-[10px] font-semibold ${badge[1] === 'red' ? 'text-red-600' : badge[1] === 'gray' ? 'text-slate-400' : 'text-amber-600'}`}>{badge[0]}</span>}
                        </td>
                      );
                    })}
                    {book.assignments.length > 0 && <td><b>{formatScore(row.assignmentAverage)}</b></td>}
                    <td><b className="text-base">{formatScore(row.finalScore)}</b></td>
                    <td><Badge tone={RANKING_TONE[row.ranking]}>{row.ranking}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">* Chưa làm bài kiểm tra tính 0 điểm. Bài tập "Chưa chấm" đang tạm tính 0 cho tới khi giảng viên chấm.</p>
      </Card>
    </>
  );
}
