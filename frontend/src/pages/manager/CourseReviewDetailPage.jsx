import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, SectionTitle, Badge } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';
import LessonMaterialsPanel from '../../components/course/LessonMaterialsPanel';

const LESSON_TYPE_LABEL = {
  theory: 'LÝ THUYẾT',
  video: 'VIDEO',
  quiz: 'BÀI KIỂM TRA',
  assignment: 'BÀI TẬP'
};

export default function CourseReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
    const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [detail, outline] = await Promise.all([
        courseService.get(id),
        courseService.curriculum(id)
      ]);
      setCourse(detail);
      setCurriculum(outline);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);
    useEffect(() => {
    if (!selectedLessonId) {
      setLesson(null);
      return;
    }

    let cancelled = false;
    setLessonLoading(true);
    courseService.getLesson(selectedLessonId)
      .then(data => { if (!cancelled) setLesson(data); })
      .catch(error => {
        if (!cancelled) {
          setLesson(null);
          toast.error(error?.message || 'Không thể tải nội dung bài học.');
        }
      })
      .finally(() => { if (!cancelled) setLessonLoading(false); });

    return () => { cancelled = true; };
  }, [selectedLessonId]);

  const approve = async () => {
    try {
      await courseService.approve(id);
      toast.success('Đã duyệt và xuất bản khóa học.');
      navigate('/manager/approvals');
    } catch (error) {
      toast.error(error?.message || 'Không thể duyệt khóa học.');
    }
  };

  const reject = async () => {
    if (reason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do từ chối ít nhất 5 ký tự.');
      return;
    }

    try {
      setRejecting(true);
      await courseService.reject(id, reason.trim());
      toast.success('Đã từ chối khóa học và lưu lý do.');
      navigate('/manager/approvals');
    } catch (error) {
      toast.error(error?.message || 'Không thể từ chối khóa học.');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Đang tải hồ sơ duyệt...</div>;
  }

  if (!course) return null;

  return (
    <>
      <PortalHeader
        title={`Duyệt khóa học: ${course.title}`}
        desc={`${course.owner?.fullName || 'Chưa xác định'} · ${course.category?.name || 'Chưa chọn danh mục'} · ${course.totalLessons || 0} bài học`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw size={16}/> Làm mới
            </Button>
            {course.status === 'pending' && (
              <>
                <Button variant="danger" onClick={reject} disabled={rejecting}>
                  <XCircle size={16}/> Từ chối
                </Button>
                <Button onClick={approve}>
                  <CheckCircle2 size={16}/> Duyệt & xuất bản
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="review-layout">
        <Card>
          <SectionTitle title="Thông tin khóa học" />
          <div className="review-course-head">
            <div className="course-cover c0">EDU</div>
            <div>
              <Badge tone={course.status === 'pending' ? 'orange' : course.status === 'published' ? 'green' : 'red'}>
                {course.status.toUpperCase()}
              </Badge>
              <h2>{course.title}</h2>
              <p>{course.owner?.fullName || '—'} · Danh mục: {course.category?.name || 'Chưa chọn'} · {course.totalChapters || 0} chương · {course.totalLessons || 0} bài học</p>
            </div>
          </div>

          <div className="review-section">
            <h3>Mô tả</h3>
            <p>{course.description || 'Chưa có mô tả.'}</p>
          </div>

          <div className="review-section">
            <h3>Đề cương</h3>
            {(curriculum?.chapters || []).map((chapter, index) => (
              <div className="outline-row" key={chapter.id}>
                <span>{index + 1}</span>
                <div className="flex-1">
                  <b>{chapter.title}</b>
                  <div className="flex flex-wrap gap-1.5 mt-2">
  {(chapter.lessons || []).length === 0 && (
    <span className="text-xs text-slate-500">Chưa có bài học</span>
  )}
  {(chapter.lessons || []).map(item => (
    <button
      key={item.id}
      type="button"
      onClick={() => setSelectedLessonId(item.id)}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        selectedLessonId === item.id
          ? 'border-primary bg-primary text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary'
      }`}
    >
      {item.title}
    </button>
  ))}
</div>
                </div>
                <small>{(chapter.lessons || []).length} bài</small>
                <CheckCircle2 size={18}/>
              </div>
            ))}
          </div>
                    <div className="review-section">
            <h3>Nội dung bài học</h3>
            {!selectedLessonId ? (
              <p className="text-sm text-slate-500">Chọn một bài học trong đề cương để xem nội dung.</p>
            ) : lessonLoading ? (
              <p className="text-sm text-slate-500">Đang tải nội dung bài học...</p>
            ) : lesson ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>{LESSON_TYPE_LABEL[lesson.lessonType] || String(lesson.lessonType).toUpperCase()}</Badge>
                  <b>{lesson.title}</b>
                </div>
                {lesson.videoUrl && (
                  <p className="text-sm break-all">
                    Video:{' '}
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">
                      {lesson.videoUrl}
                    </a>
                  </p>
                )}
                <div className="whitespace-pre-wrap text-slate-700 leading-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {lesson.contentText || 'Bài học chưa có nội dung.'}
                </div>
                <LessonMaterialsPanel lessonId={lesson.id} />
              </div>
            ) : null}
          </div>
        </Card>

        <aside>
          <Card>
            <SectionTitle title="Danh sách kiểm tra" />
            {[
              ['Mục tiêu khóa học rõ ràng', !!course.description],
              ['Có đề cương', (curriculum?.chapters || []).length > 0],
              ['Có bài học', (curriculum?.totalLessons || course.totalLessons || 0) > 0],
              ['Trạng thái hợp lệ để duyệt', course.status === 'pending']
            ].map(([label, ok]) => (
              <div className="check-row" key={label}>
                <CheckCircle2 size={18} className={ok ? 'text-emerald-600' : 'text-slate-300'} />
                <span>{label}</span>
              </div>
            ))}
          </Card>

          {course.status === 'pending' && (
            <Card>
              <SectionTitle title="Ghi chú từ chối" />
              <textarea
                rows="7"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Nhập lý do để giảng viên biết cần sửa gì..."
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
              />
              <Button variant="danger" className="mt-3 w-full" onClick={reject} disabled={rejecting}>
                {rejecting ? 'Đang xử lý...' : 'Từ chối khóa học'}
              </Button>
            </Card>
          )}

          {course.rejectionReason && (
            <Card>
              <SectionTitle title="Lý do từ chối trước đó" />
              <p className="text-sm text-red-700">{course.rejectionReason}</p>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
