import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge } from '../../components/portal/PortalUI';
import QuizFormModal from '../../components/quiz/QuizFormModal';
import quizService, { formatScore } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

const COURSE_STATUS = { draft: ['Nháp', 'gray'], rejected: ['Bị từ chối', 'red'], pending: ['Chờ duyệt', 'orange'], published: ['Đã công khai', 'green'] };

export default function TeacherQuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await quizService.list({ limit: 100 });
      setQuizzes(data.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const keyword = search.trim().toLowerCase();
  const visible = quizzes.filter(q => !keyword || q.title.toLowerCase().includes(keyword) || q.course?.title?.toLowerCase().includes(keyword));

  return (
    <>
      <PortalHeader
        eyebrow="QUIZ MANAGEMENT"
        title="Bài kiểm tra"
        desc="Soạn đề trắc nghiệm cho các bài học loại Quiz, sinh câu hỏi bằng AI và xem kết quả của học viên."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Làm mới</Button>
            <Button variant="secondary" onClick={() => navigate('/teacher/quizzes/ai-generator')}><Sparkles size={16} /> Sinh bằng AI</Button>
            <Button onClick={() => setShowCreate(true)}><Plus size={17} /> Tạo bài kiểm tra</Button>
          </>
        }
      />

      <div className="filter-bar">
        <span className="text-sm text-slate-500">{quizzes.length} bài kiểm tra</span>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-64">
          <Search size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên đề, khóa học..." className="flex-1 min-w-0 text-sm outline-none" />
        </label>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải bài kiểm tra...</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-500">{quizzes.length ? 'Không có bài kiểm tra phù hợp.' : 'Chưa có bài kiểm tra nào. Thêm bài học loại "Quiz" trong đề cương rồi bấm "Tạo bài kiểm tra".'}</p>
          </div>
        ) : (
          <Table
            headers={['Bài kiểm tra', 'Khóa học', 'Câu hỏi', 'Thời gian', 'Lượt làm', 'Điểm đạt', 'Trạng thái', '']}
            rows={visible.map(quiz => {
              const [courseLabel, courseTone] = COURSE_STATUS[quiz.course?.status] || ['', 'gray'];
              return [
                <div><b>{quiz.title}</b><div className="text-xs text-slate-500">{quiz.lessonTitle}</div></div>,
                <div>{quiz.course?.title}<div><Badge tone={courseTone}>{courseLabel}</Badge></div></div>,
                quiz.totalQuestions,
                `${quiz.durationMinutes} phút`,
                quiz.maxAttempts,
                formatScore(quiz.passScore),
                <Badge tone={quiz.isPublished ? 'green' : 'gray'}>{quiz.isPublished ? 'Công khai' : 'Nháp'}</Badge>,
                <Button variant="ghost" onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}>Mở</Button>
              ];
            })}
          />
        )}
      </Card>

      {showCreate && (
        <QuizFormModal
          onClose={() => setShowCreate(false)}
          onSaved={(quiz) => { setShowCreate(false); navigate(`/teacher/quizzes/${quiz.id}`); }}
        />
      )}
    </>
  );
}
