import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, FileUp, PlayCircle, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Badge, Card, Progress } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { learnUrl } from '../../services/classService';
import LessonMaterialsPanel from '../../components/course/LessonMaterialsPanel';
import LessonDiscussion from '../../components/discussion/LessonDiscussion';
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
  // Trạng thái hoàn thành lấy từ đề cương theo lớp (GET /lessons/:id không trả tiến độ)
  const isCompleted = !!flatLessons[currentIndex]?.isCompleted;
  const quizId = flatLessons[currentIndex]?.quizId;
  const assignmentId = flatLessons[currentIndex]?.assignmentId;
  const isAssignmentScheduled = flatLessons[currentIndex]?.isAssignmentScheduled;
  const lessonUrl = (id) => learnUrl(courseId, id, classId);

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

        <div className="flex flex-wrap gap-2">
          {classId && (
            <Button variant="secondary" onClick={() => navigate(`/student/classes/${classId}`)}>
              <ArrowLeft size={16}/> Về lớp học
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={!previous}
            onClick={() => previous && navigate(lessonUrl(previous.id))}
          >
            <ChevronLeft size={16}/> Bài trước
          </Button>
          <Button
            disabled={!next}
            onClick={() => next && navigate(lessonUrl(next.id))}
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
                <Link
                  key={item.id}
                  to={lessonUrl(item.id)}
                  className={`lesson-item ${item.id === lessonId ? 'active' : ''}`}
                >
                  <span className="lesson-check">{item.isCompleted ? '✓' : ''}</span>
                  <span className="truncate">{item.title}</span>
                </Link>
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

          {lesson.lessonType === 'quiz' && (
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <ClipboardCheck size={22} className="text-purple-600" />
                <div className="flex-1 min-w-0">
                  <b>Bài kiểm tra trắc nghiệm</b>
                  <p className="text-sm text-slate-500">{quizId ? 'Đạt điểm yêu cầu, bài học được tính hoàn thành tự động.' : 'Giảng viên chưa soạn đề cho bài học này.'}</p>
                </div>
                {quizId && classId && (
                  <Button onClick={() => navigate(`/student/quizzes/${quizId}/take?classId=${classId}`)}>Làm bài kiểm tra</Button>
                )}
              </div>
            </Card>
          )}

          {lesson.lessonType === 'assignment' && (
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <FileUp size={22} className="text-primary" />
                <div className="flex-1 min-w-0">
                  <b>Bài tập nộp file</b>
                  <p className="text-sm text-slate-500">
                    {!assignmentId 
                      ? 'Giảng viên chưa soạn đề cho bài học này.' 
                      : isAssignmentScheduled 
                        ? 'Nộp bài xong, bài học được tính hoàn thành tự động.' 
                        : 'Giảng viên chưa lên lịch / chưa giao bài tập này cho lớp học.'}
                  </p>
                </div>
                {assignmentId && classId && (
                  isAssignmentScheduled ? (
                    <Button onClick={() => navigate(`/student/classes/${classId}/assignments/${assignmentId}`)}>
                      Xem đề & nộp bài
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled title="Giảng viên chưa lên lịch hạn nộp cho lớp này">
                      Chưa giao cho lớp
                    </Button>
                  )
                )}
              </div>
            </Card>
          )}

          <div className="flex flex-wrap justify-between items-center gap-2">
            {isCompleted ? (
              <>
                <span className="text-sm font-semibold text-emerald-600">✓ Đã hoàn thành bài học này</span>
                <Button variant="secondary" onClick={() => setProgress(false)} disabled={updating || !classId}>
                  <RotateCcw size={15}/> Bỏ đánh dấu hoàn thành
                </Button>
              </>
            ) : (
              <Button onClick={() => setProgress(true)} disabled={updating || !classId}>
                <CheckCircle2 size={17}/> {updating ? 'Đang lưu...' : 'Đánh dấu đã hoàn thành'}
              </Button>
            )}
          </div>
          {!classId && (
            <p className="text-sm text-slate-500">Vào bài học từ trang lớp học để hệ thống ghi nhận tiến độ.</p>
          )}

          <Card>
            <LessonMaterialsPanel lessonId={lessonId} />
          </Card>

          {classId && (
            <Card>
              <LessonDiscussion key={`${classId}:${lessonId}`} classId={classId} lessonId={lessonId} />
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
