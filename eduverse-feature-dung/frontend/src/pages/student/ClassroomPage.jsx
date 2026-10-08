import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, PlayCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Badge, Card, Progress } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

export default function ClassroomPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classId = params.get('classId');

  const [outline, setOutline] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [curriculum, detail] = await Promise.all([
        courseService.curriculum(courseId, classId),
        courseService.getLesson(lessonId)
      ]);
      setOutline(curriculum);
      setLesson(detail);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải bài học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId, lessonId, classId]);

  const flatLessons = useMemo(
    () => (outline?.chapters || []).flatMap(chapter => chapter.lessons || []),
    [outline]
  );

  const currentIndex = flatLessons.findIndex(item => item.id === lessonId);
  const previous = flatLessons[currentIndex - 1];
  const next = flatLessons[currentIndex + 1];

  const setProgress = async (isCompleted) => {
    if (!classId) {
      toast.info('Cần có classId để ghi nhận tiến độ của lớp.');
      return;
    }

    try {
      setUpdating(true);
      await courseService.updateProgress(classId, lessonId, isCompleted);
      toast.success(isCompleted ? 'Đã đánh dấu hoàn thành.' : 'Đã bỏ trạng thái hoàn thành.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'Không thể cập nhật tiến độ.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Đang tải bài học...</div>;
  }

  if (!lesson) return null;

  return (
    <>
      <div className="learning-top">
        <div>
          <span>{outline?.title || 'Khóa học'} / Bài học</span>
          <h1>{lesson.title}</h1>
          <div className="mt-2 max-w-xl">
            <Progress value={outline?.progressPercentage || 0} />
            <small className="text-slate-500">
              {outline?.completedLessons || 0}/{outline?.totalLessons || 0} bài hoàn thành · {outline?.progressPercentage || 0}%
            </small>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!previous}
            onClick={() => previous && navigate(`/student/courses/${courseId}/learn/${previous.id}${classId ? `?classId=${classId}` : ''}`)}
          >
            <ChevronLeft size={16}/> Bài trước
          </Button>
          <Button
            disabled={!next}
            onClick={() => next && navigate(`/student/courses/${courseId}/learn/${next.id}${classId ? `?classId=${classId}` : ''}`)}
          >
            Bài tiếp theo <ChevronRight size={16}/>
          </Button>
        </div>
      </div>

      <div className="learning-layout">
        <aside className="lesson-list">
          <b>Nội dung khóa học</b>
          {(outline?.chapters || []).map(chapter => (
            <div key={chapter.id}>
              <div className="px-2 py-3 font-semibold text-sm">{chapter.title}</div>
              {(chapter.lessons || []).map(item => (
                <a
                  key={item.id}
                  href={`/student/courses/${courseId}/learn/${item.id}${classId ? `?classId=${classId}` : ''}`}
                  className={`lesson-item ${item.id === lessonId ? 'active' : ''}`}
                >
                  <span className="lesson-check">{item.isCompleted ? '✓' : ''}</span>
                  <span className="truncate">{item.title}</span>
                </a>
              ))}
            </div>
          ))}
        </aside>

        <section className="space-y-4">
          {lesson.videoUrl ? (
            <div className="video-player">
              <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="play-circle">
                <PlayCircle size={58}/>
              </a>
              <div className="video-label">EDUVERSE · VIDEO LESSON</div>
            </div>
          ) : (
            <Card className="lesson-content">
              <Badge>{lesson.lessonType === 'theory' ? 'LÝ THUYẾT' : lesson.lessonType.toUpperCase()}</Badge>
              <h2>{lesson.title}</h2>
              <div className="whitespace-pre-wrap text-slate-700 leading-7">
                {lesson.contentText || 'Bài học chưa có nội dung.'}
              </div>
            </Card>
          )}

          {lesson.videoUrl && (
            <Card className="lesson-content">
              <Badge>VIDEO BÀI GIẢNG</Badge>
              <h2>{lesson.title}</h2>
              <p>{lesson.contentText || 'Xem video để hoàn thành bài học.'}</p>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <Button
              onClick={() => setProgress(true)}
              disabled={updating || !classId}
            >
              <CheckCircle2 size={17}/> {updating ? 'Đang lưu...' : 'Đánh dấu đã hoàn thành'}
            </Button>

            {lesson.isCompleted && (
              <span className="text-sm font-semibold text-emerald-600">
                ✓ Đã hoàn thành
              </span>
            )}
          </div>

          <Card>
            <div className="flex items-center gap-3">
              <FileText size={20}/>
              <div>
                <b>Tài liệu bài học</b>
                <p className="text-sm text-slate-500">Tài liệu đính kèm sẽ được kết nối ở phần Course Materials.</p>
              </div>
              <Download size={18} className="ml-auto text-slate-400"/>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
