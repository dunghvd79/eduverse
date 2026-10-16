import React, { useEffect, useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  BookOpen,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge } from '../../components/portal/PortalUI';
import QuizFormModal from '../../components/quiz/QuizFormModal';
import quizService, { formatScore } from '../../services/quizService';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

const COURSE_STATUS = {
  draft: ['Khóa nháp', 'gray'],
  rejected: ['Khóa bị từ chối', 'red'],
  pending: ['Khóa chờ duyệt', 'orange'],
  published: ['Khóa đã duyệt', 'green']
};

export default function TeacherQuizzesPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [quizData, courseData] = await Promise.all([
        quizService.list({ limit: 100 }),
        courseService.list({ mine: true, limit: 100 })
      ]);
      setQuizzes(quizData.items || []);
      setCourses(courseData.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải dữ liệu bài kiểm tra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Bộ lọc tổng hợp (Tìm kiếm + Khóa học + Trạng thái)
  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      // 1. Lọc theo Khóa học
      if (selectedCourse && quiz.course?.id !== selectedCourse) {
        return false;
      }

      // 2. Lọc theo Trạng thái công khai của đề
      if (selectedStatus === 'published' && !quiz.isPublished) return false;
      if (selectedStatus === 'draft' && quiz.isPublished) return false;

      // 3. Lọc theo từ khóa tìm kiếm
      if (keyword) {
        const matchTitle = quiz.title?.toLowerCase().includes(keyword);
        const matchCourse = quiz.course?.title?.toLowerCase().includes(keyword);
        const matchChapter = quiz.chapter?.title?.toLowerCase().includes(keyword);
        const matchLesson = quiz.lessonTitle?.toLowerCase().includes(keyword);
        if (!matchTitle && !matchCourse && !matchChapter && !matchLesson) {
          return false;
        }
      }

      return true;
    });
  }, [quizzes, search, selectedCourse, selectedStatus]);

  return (
    <>
      <PortalHeader
        title="Quản lý bài kiểm tra"
        desc="Soạn đề trắc nghiệm, quản lý đề thi theo từng Khóa học & Chương mục, sinh câu hỏi bằng AI và theo dõi kết quả."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
            </Button>
            <Button variant="secondary" onClick={() => navigate('/teacher/quizzes/ai-generator')}>
              <Sparkles size={15} /> Sinh bằng AI
            </Button>
            <Button onClick={() => setShowCreate(true)} className="!bg-[#1168bd] !text-white shadow-xs">
              <Plus size={16} /> Tạo bài kiểm tra
            </Button>
          </>
        }
      />

      {/* Thanh Điều Khiển & Bộ Lọc Nâng Cao (Khóa học · Trạng thái · Tìm kiếm) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc theo Khóa học */}
          <div className="flex items-center gap-1.5">
            <BookOpen size={15} className="text-slate-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#1168bd] shadow-2xs"
            >
              <option value="">— Tất cả khóa học ({courses.length}) —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái công khai */}
          <div className="flex items-center gap-1.5">
            <Filter size={15} className="text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#1168bd] shadow-2xs"
            >
              <option value="all">Tất cả trạng thái đề</option>
              <option value="published">Đã công khai</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>

        {/* Ô tìm kiếm & Thống kê số lượng */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap hidden sm:inline">
            Hiển thị <b>{visible.length}</b> / {quizzes.length} đề thi
          </span>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 h-9 w-full md:w-64 shadow-2xs focus-within:border-[#1168bd]">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên đề, chương, khóa học..."
              className="flex-1 min-w-0 text-xs text-slate-700 outline-none"
            />
          </label>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Đang tải danh sách bài kiểm tra...</div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 text-slate-300" size={40} />
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy bài kiểm tra phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {quizzes.length
                ? 'Thử thay đổi bộ lọc khóa học hoặc từ khóa tìm kiếm để hiển thị đề thi.'
                : 'Chưa có bài kiểm tra nào. Bạn có thể thêm bài học loại Quiz trong Đề cương khóa học hoặc bấm "Tạo bài kiểm tra" ngay tại đây.'}
            </p>
          </div>
        ) : (
          <Table
            headers={[
              'Bài kiểm tra',
              'Khóa học & Chương mục',
              'Số câu',
              'Thời gian',
              'Lượt làm',
              'Điểm đạt',
              'Trạng thái đề',
              'Thao tác'
            ]}
            rows={visible.map((quiz) => {
              const [courseLabel, courseTone] = COURSE_STATUS[quiz.course?.status] || ['', 'gray'];
              return [
                /* Cột 1: Tên đề thi & Bài học liên kết */
                <div key="title" className="min-w-0 max-w-xs">
                  <span
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
                    className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 hover:text-[#1168bd] cursor-pointer transition-colors"
                    title={quiz.title}
                  >
                    {quiz.title}
                  </span>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    Bài: {quiz.lessonTitle || 'Chưa liên kết bài học'}
                  </div>
                </div>,

                /* Cột 2: Khóa học & Chương (Breadcrumb phân cấp rõ ràng) */
                <div key="course" className="min-w-0 max-w-xs space-y-1">
                  <div className="font-semibold text-slate-800 text-xs line-clamp-1 flex items-center gap-1.5" title={quiz.course?.title}>
                    <BookOpen size={12} className="text-[#1168bd] shrink-0" />
                    <span>{quiz.course?.title || <span className="text-slate-400">Chưa gắn khóa học</span>}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 line-clamp-1" title={quiz.chapter?.title}>
                    <Layers size={11} className="text-slate-400 shrink-0" />
                    <span>
                      {quiz.chapter
                        ? `Chương ${quiz.chapter.orderIndex ? quiz.chapter.orderIndex + ': ' : ''}${quiz.chapter.title}`
                        : 'Chưa phân chương'}
                    </span>
                  </div>

                  <div>
                    <Badge tone={courseTone}>{courseLabel}</Badge>
                  </div>
                </div>,

                /* Cột 3: Câu hỏi */
                <span key="questions" className="font-bold text-slate-800 text-xs whitespace-nowrap">
                  {quiz.totalQuestions || 0} câu
                </span>,

                /* Cột 4: Thời gian */
                <span key="duration" className="text-xs text-slate-600 whitespace-nowrap">
                  {quiz.durationMinutes} phút
                </span>,

                /* Cột 5: Lượt làm */
                <span key="attempts" className="text-xs text-slate-600 whitespace-nowrap">
                  {quiz.maxAttempts} lần
                </span>,

                /* Cột 6: Điểm đạt */
                <span key="score" className="text-xs font-bold text-[#1168bd] whitespace-nowrap">
                  {formatScore(quiz.passScore)}/10
                </span>,

                /* Cột 7: Trạng thái đề */
                <Badge key="status" tone={quiz.isPublished ? 'green' : 'gray'}>
                  {quiz.isPublished ? 'Công khai' : 'Bản nháp'}
                </Badge>,

                /* Cột 8: Thao tác */
                <div key="actions" className="flex items-center gap-1.5 whitespace-nowrap">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
                    className="!text-xs !font-bold !text-[#1168bd] hover:!bg-blue-50"
                  >
                    <Edit3 size={13} /> Soạn đề
                  </Button>
                </div>
              ];
            })}
          />
        )}
      </Card>

      {showCreate && (
        <QuizFormModal
          onClose={() => setShowCreate(false)}
          onSaved={(quiz) => {
            setShowCreate(false);
            navigate(`/teacher/quizzes/${quiz.id}`);
          }}
        />
      )}
    </>
  );
}
