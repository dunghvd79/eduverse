import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Save, Send, Trash2, Video, ClipboardCheck, FileQuestion, Lock, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, Badge, Field } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import LessonMaterialsPanel from '../../components/course/LessonMaterialsPanel';
import QuizFormModal from '../../components/quiz/QuizFormModal';
import AssignmentFormModal from '../../components/assignment/AssignmentFormModal';
import assignmentService from '../../services/assignmentService';
import { toast } from '../../components/common/Toast';
import { confirmModal } from '../../components/common/ConfirmModal';
import CourseLandingEditor from '../../components/course/CourseLandingEditor';
import AutoTextarea from '../../components/common/AutoTextarea';
import { parseVideoUrl, VideoEmbed, VIDEO_URL_HINT } from '../../utils/video';


const TYPE_LABEL = {
  theory: 'Lý thuyết',
  video: 'Video',
  quiz: 'Quiz',
  assignment: 'Bài tập'
};

const STATUS_TEXT = {
  draft: 'Bản nháp',
  pending: 'Đang chờ duyệt',
  published: 'Đã công khai',
  rejected: 'Bị từ chối'
};

const EMPTY_LESSON = { title: '', lessonType: 'theory', contentText: '', videoUrl: '' };

// Ô nội dung có ý nghĩa khác nhau theo loại bài (học viên thấy ở trang học, ClassroomPage)
const CONTENT_COPY = {
  theory: { label: 'Nội dung bài học', placeholder: 'Nội dung học viên sẽ đọc. Xuống dòng để chia đoạn.', rows: 10 },
  video: { label: 'Mô tả video (tùy chọn)', placeholder: 'Tóm tắt nội dung video, mốc thời gian quan trọng, tài liệu cần chuẩn bị...', rows: 3 },
  quiz: { label: 'Hướng dẫn (tùy chọn)', placeholder: 'Lời dặn trước khi làm bài kiểm tra, hiện phía trên nút "Làm bài kiểm tra".', rows: 3 },
  assignment: { label: 'Hướng dẫn (tùy chọn)', placeholder: 'Lời dặn chung, hiện phía trên nút "Xem đề & nộp bài". Đề chi tiết soạn ở "Tạo đề bài tập".', rows: 3 }
};

// Kiểm tra giống createLessonSchema (backend) để báo lỗi ngay dưới từng ô
const validateLesson = ({ title, lessonType, videoUrl }) => {
  const errors = {};
  if (title.trim().length < 2) errors.title = 'Tiêu đề bài học phải có ít nhất 2 ký tự.';
  if (lessonType === 'video') {
    if (!videoUrl.trim()) errors.videoUrl = 'Bài học video cần có link video.';
    else if (!parseVideoUrl(videoUrl)) errors.videoUrl = 'Link video phải là YouTube hoặc Vimeo.';
  }
  return errors;
};

// Gửi lên: chỉ bài video mới giữ link video
const toLessonPayload = (form) => ({ ...form, title: form.title.trim(), videoUrl: form.lessonType === 'video' ? form.videoUrl.trim() : '' });

const FieldError = ({ message }) => (message ? <small className="mt-1 block text-xs font-medium text-red-600">{message}</small> : null);

/** Các ô của bài học, dùng chung cho form tạo mới và form sửa */
function LessonFields({ form, onChange, errors = {}, disabled = false, readOnly = false }) {
  const set = (key) => (e) => onChange(key, e.target.value);
  const copy = CONTENT_COPY[form.lessonType] || CONTENT_COPY.theory;
  return (
    <>
      <label className="field">
        <span>Tiêu đề bài học *</span>
        <input value={form.title} disabled={disabled} readOnly={readOnly} onChange={set('title')} placeholder="VD: Lập trình hướng đối tượng là gì?" className={errors.title ? '!border-red-400' : ''} />
        <FieldError message={errors.title} />
      </label>

      <label className="field">
        <span>Loại bài học</span>
        <select value={form.lessonType} disabled={disabled || readOnly} onChange={set('lessonType')}>
          {Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      {form.lessonType === 'video' && (
        <div className="field">
          <span>Link video *</span>
          <input value={form.videoUrl} disabled={disabled} readOnly={readOnly} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=..." aria-label="Link video" className={errors.videoUrl ? '!border-red-400' : ''} />
          {errors.videoUrl
            ? <FieldError message={errors.videoUrl} />
            : <small className="mt-1 block text-xs text-slate-500">{VIDEO_URL_HINT}</small>}
          {parseVideoUrl(form.videoUrl) && <VideoEmbed url={form.videoUrl} title="Xem trước video" className="mt-3 max-w-xl" />}
        </div>
      )}

      <label className="field">
        <span>{copy.label}</span>
        <AutoTextarea
          key={form.lessonType}
          minRows={copy.rows}
          value={form.contentText || ''}
          disabled={disabled}
          readOnly={readOnly}
          onChange={set('contentText')}
          placeholder={copy.placeholder}
        />
      </label>
    </>
  );
}

const TYPE_ICON = {
  theory: FileText,
  video: Video,
  quiz: ClipboardCheck,
  assignment: FileQuestion
};

export default function CourseCurriculumBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChapter, setNewChapter] = useState('');
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonChapterId, setLessonChapterId] = useState(null);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonErrors, setLessonErrors] = useState({});
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState(null); // null | 'create' | assignment
  const [view, setView] = useState('outline'); // 'outline' (đề cương) | 'landing' (trang giới thiệu)

  // Khóa đang chờ duyệt / đã công khai: backend chặn mọi thao tác sửa (409) -> giao diện chỉ đọc
  const isLocked = course?.status === 'pending' || course?.status === 'published';

  const load = async () => {
    try {
      setLoading(true);
      const [detail, curriculum] = await Promise.all([
        courseService.get(id),
        courseService.curriculum(id)
      ]);

      setCourse(detail);
      setChapters(curriculum.chapters || []);

      const firstLesson = (curriculum.chapters || []).flatMap(c => c.lessons || [])[0];
      setSelectedLessonId(firstLesson?.id || null);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải đề cương khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const selectedLesson = useMemo(
    () => chapters.flatMap(c => c.lessons || []).find(l => l.id === selectedLessonId) || null,
    [chapters, selectedLessonId]
  );

  // Đề cương (curriculum) chỉ có tiêu đề bài; nội dung đầy đủ phải tải qua GET /lessons/:id.
  // Nếu không, form sẽ trống và bấm Lưu sẽ ghi đè mất nội dung cũ.
  useEffect(() => {
    if (!selectedLessonId) return;
    let cancelled = false;

    const loadLesson = async () => {
      try {
        setLessonLoading(true);
        const detail = await courseService.getLesson(selectedLessonId);
        if (!cancelled) {
          setLessonForm({
            title: detail.title || '',
            lessonType: detail.lessonType || 'theory',
            contentText: detail.contentText || '',
            videoUrl: detail.videoUrl || ''
          });
        }
      } catch (error) {
        if (!cancelled) toast.error(error?.message || 'Không thể tải nội dung bài học.');
      } finally {
        if (!cancelled) setLessonLoading(false);
      }
    };

    loadLesson();
    return () => { cancelled = true; };
  }, [selectedLessonId]);

  const addChapter = async () => {
    if (!newChapter.trim()) {
      toast.error('Nhập tên chương.');
      return;
    }

    try {
      const data = await courseService.createChapter(id, { title: newChapter.trim() });
      setChapters(prev => [...prev, { ...data, lessons: [] }]);
      setNewChapter('');
      toast.success('Đã thêm chương.');
    } catch (error) {
      toast.error(error?.message || 'Không thể thêm chương.');
    }
  };

  const updateLessonField = (key, value) => {
    setLessonForm((prev) => ({ ...prev, [key]: value }));
    if (lessonErrors[key]) setLessonErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addLesson = async (chapterId) => {
    const errors = validateLesson(lessonForm);
    setLessonErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const data = await courseService.createLesson(chapterId, toLessonPayload(lessonForm));
      setChapters(prev => prev.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, lessons: [...(chapter.lessons || []), data] }
          : chapter
      ));
      setSelectedLessonId(data.id);
      setShowLessonForm(false);
      toast.success('Đã thêm bài học.');
    } catch (error) {
      toast.error(error?.message || 'Không thể thêm bài học.');
    }
  };

  const saveLesson = async () => {
    if (!selectedLesson || isLocked || lessonLoading) return;
    const errors = validateLesson(lessonForm);
    setLessonErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      const updated = await courseService.updateLesson(selectedLesson.id, toLessonPayload(lessonForm));
      setChapters(prev => prev.map(chapter => ({
        ...chapter,
        lessons: (chapter.lessons || []).map(lesson =>
          lesson.id === updated.id ? updated : lesson
        )
      })));
      toast.success('Đã lưu bài học.');
    } catch (error) {
      toast.error(error?.message || 'Không thể lưu bài học.');
    } finally {
      setSaving(false);
    }
  };

  const submitApproval = async () => {
    try {
      setSaving(true);
      await courseService.requestApproval(id);
      toast.success('Đã gửi khóa học tới quản lý đào tạo.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'Không thể gửi duyệt.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    const isPublished = course?.status === 'published';
    const ok = await confirmModal({
      title: isPublished ? 'Tạm dừng công khai khóa học?' : 'Rút yêu cầu phê duyệt?',
      message: isPublished
        ? `Chuyển khóa học "${course?.title}" về Bản nháp để chỉnh sửa?`
        : `Bạn có muốn rút lại yêu cầu phê duyệt khóa học "${course?.title}" và chuyển về Bản nháp?`,
      subtext: isPublished
        ? 'Khóa học sẽ tạm thời ẩn khỏi trang chủ đối với học viên mới cho đến khi bạn hoàn tất chỉnh sửa và gửi duyệt lại.'
        : 'Sau khi rút yêu cầu, bạn có thể tiếp tục bổ sung nội dung bài giảng, đề thi hoặc tài liệu.',
      confirmText: isPublished ? 'Chuyển về nháp' : 'Rút yêu cầu',
      cancelText: 'Giữ nguyên',
      type: 'warning'
    });

    if (!ok) return;

    try {
      setSaving(true);
      await courseService.unpublish(id);
      toast.success(isPublished ? 'Đã chuyển về bản nháp. Bây giờ bạn có thể chỉnh sửa nội dung.' : 'Đã rút yêu cầu duyệt.');
      await load();
    } catch (error) {
      toast.error(error?.message || 'Không thể chuyển khóa học về bản nháp.');
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async () => {
    if (!selectedLesson) return;

    const ok = await confirmModal({
      title: 'Xóa bài học?',
      message: `Bạn có chắc chắn muốn xóa bài học "${selectedLesson.title}"?`,
      subtext: 'Toàn bộ nội dung, tài liệu đính kèm và dữ liệu liên quan sẽ bị gỡ khỏi đề cương.',
      confirmText: 'Xóa bài học',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });

    if (!ok) return;

    try {
      await courseService.deleteLesson(selectedLesson.id);
      setSelectedLessonId(null);
      await load();
      toast.success('Đã xóa bài học.');
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa bài học.');
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Đang tải đề cương...</div>;
  }

  return (
    <>
      <PortalHeader
        title={course?.title || 'Đề cương khóa học'}
        desc={`Trạng thái: ${STATUS_TEXT[course?.status] || course?.status || 'Bản nháp'} · ${course?.category?.name || 'Chưa chọn danh mục'} · ${chapters.length} chương`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>Làm mới</Button>
            {isLocked && (
              <Button variant="secondary" onClick={handleUnpublish} disabled={saving}>
                <RotateCcw size={16} /> {course?.status === 'published' ? 'Chuyển về nháp để sửa' : 'Rút yêu cầu duyệt'}
              </Button>
            )}
            {!isLocked && view === 'outline' && (
              <Button variant="secondary" onClick={saveLesson} disabled={!selectedLesson || saving || lessonLoading}>
                <Save size={16} /> Lưu bài học
              </Button>
            )}
            {(course?.status === 'draft' || course?.status === 'rejected') && (
              <Button onClick={submitApproval} disabled={saving}>
                <Send size={16} /> Gửi duyệt
              </Button>
            )}
          </>
        }
      />

      {isLocked && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="flex items-center gap-2.5">
            <Lock size={18} className="flex-shrink-0 text-amber-600" />
            <span>
              {course.status === 'pending'
                ? 'Khóa học đang chờ Quản lý đào tạo duyệt nên tạm khóa chỉnh sửa. Bạn có thể rút lại yêu cầu để tiếp tục chỉnh sửa.'
                : 'Khóa học đã được công khai nên nội dung đã khóa để bảo toàn dữ liệu học viên.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleUnpublish}
            disabled={saving}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            {course.status === 'published' ? 'Chuyển về nháp để sửa' : 'Rút yêu cầu duyệt'}
          </button>
        </div>
      )}

      <div className="tabs-card">
        <button type="button" className={`tab ${view === 'outline' ? 'active' : ''}`} onClick={() => setView('outline')}>Đề cương</button>
        <button type="button" className={`tab ${view === 'landing' ? 'active' : ''}`} onClick={() => setView('landing')}>Trang giới thiệu</button>
      </div>

      {view === 'landing' ? (
        <CourseLandingEditor
          key={JSON.stringify([course?.shortDescription, course?.level, course?.learningOutcomes, course?.requirements])}
          course={course}
          locked={isLocked}
          onSaved={load}
        />
      ) : (
      <div className="builder-layout">
        <aside className="builder-tree">
          <div className="builder-head">
            <b>Nội dung khóa học</b>
          </div>

          {!isLocked && <div className="pb-3 border-b border-slate-200 space-y-2">
            <input
              value={newChapter}
              onChange={e => setNewChapter(e.target.value)}
              placeholder="Tên chương mới, VD: Tổng quan về OOP"
              aria-label="Tên chương mới"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && addChapter()}
            />
            <Button onClick={addChapter} className="w-full">
              <Plus size={15} /> Thêm chương
            </Button>
            <small className="block text-xs text-slate-500">Số thứ tự chương được đánh tự động, không cần gõ "Chương 1:".</small>
          </div>}

          {chapters.map((chapter, index) => {
            const lessonCount = (chapter.lessons || []).length;
            return (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3" key={chapter.id}>
              {/* Đầu chương: số thứ tự tự động + tên (tối đa 2 dòng, rê chuột xem đủ) + số bài trên dòng riêng */}
              <div className="flex items-start gap-2.5">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-[#eaf3ff] text-xs font-bold text-[#1168bd]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="text-sm font-semibold leading-snug text-slate-800 line-clamp-2" title={chapter.title}>{chapter.title}</b>
                  <small className="mt-0.5 block text-xs text-slate-500">{lessonCount ? `${lessonCount} bài học` : 'Chưa có bài học'}</small>
                </div>
              </div>

              <div className="chapter-lessons">
                {(chapter.lessons || []).map((lesson, lessonIndex) => {
                  const Icon = TYPE_ICON[lesson.lessonType] || FileText;
                  return (
                    <button
                      type="button"
                      key={lesson.id}
                      className={`lesson w-full ${selectedLessonId === lesson.id ? 'selected' : ''}`}
                      onClick={() => {
                        setShowLessonForm(false);
                        setLessonErrors({});
                        setSelectedLessonId(lesson.id);
                      }}
                    >
                      <span>{lessonIndex + 1}</span>
                      <span className="flex-1 min-w-0 truncate text-left">{lesson.title}</span>
                      <Icon size={14} className="flex-none" />
                    </button>
                  );
                })}

                {!isLocked && (
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white py-2 text-xs font-semibold text-[#1168bd] hover:border-[#1168bd] hover:bg-[#f5f9ff]"
                    onClick={() => {
                      setShowLessonForm(true);
                      setSelectedLessonId(null);
                      setLessonErrors({});
                      setLessonForm(EMPTY_LESSON);
                      setLessonChapterId(chapter.id);
                    }}
                  >
                    <Plus size={14} /> Thêm bài học
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </aside>

        <Card className="editor-card">
          {showLessonForm ? (
            <div className="space-y-4">
              <div className="editor-top">
                <div>
                  <Badge tone="blue">BÀI HỌC MỚI</Badge>
                  <h2>Tạo bài học</h2>
                </div>
              </div>

              <LessonFields form={lessonForm} onChange={updateLessonField} errors={lessonErrors} />

              <div className="editor-actions">
                <Button variant="secondary" onClick={() => setShowLessonForm(false)}>Hủy</Button>
                <Button onClick={() => addLesson(lessonChapterId)}>Tạo bài học</Button>
              </div>
            </div>
          ) : selectedLesson ? (
            <div className="space-y-4">
              <div className="editor-top">
                <div>
                  <Badge tone="blue">{TYPE_LABEL[selectedLesson.lessonType] || 'BÀI HỌC'}</Badge>
                  <h2>{selectedLesson.title}</h2>
                </div>
                {lessonLoading
                  ? <Badge tone="gray">Đang tải nội dung...</Badge>
                  : isLocked ? <Badge tone="orange">Chỉ xem</Badge> : null}
              </div>

              <LessonFields form={lessonForm} onChange={updateLessonField} errors={lessonErrors} disabled={lessonLoading} readOnly={isLocked} />

              {!isLocked && (
                <div className="flex items-center justify-between">
                  <Button variant="danger" onClick={deleteLesson}>
                    <Trash2 size={15} /> Xóa bài học
                  </Button>
                  <Button onClick={saveLesson} disabled={saving || lessonLoading}>
                    <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu bài học'}
                  </Button>
                </div>
              )}

              {selectedLesson.lessonType === 'quiz' && (
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <ClipboardCheck size={18} className="text-purple-600" />
                  <div className="flex-1 min-w-0">
                    <b>Bài kiểm tra trắc nghiệm</b>
                    <p className="text-sm text-slate-500">
                      {selectedLesson.quizId ? 'Bài học đã có đề thi.' : isLocked ? 'Bài học chưa có đề thi.' : 'Bài học loại Quiz cần một đề thi để học viên làm bài.'}
                    </p>
                  </div>
                  {selectedLesson.quizId ? (
                    <Button variant="secondary" onClick={() => navigate(`/teacher/quizzes/${selectedLesson.quizId}`)}>
                      {isLocked ? 'Xem đề thi' : 'Soạn đề thi'}
                    </Button>
                  ) : !isLocked && (
                    <Button onClick={() => setCreatingQuiz(true)}><Plus size={15} /> Tạo đề thi</Button>
                  )}
                </div>
              )}

              {selectedLesson.lessonType === 'assignment' && (
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <FileQuestion size={18} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <b>Bài tập nộp file</b>
                    <p className="text-sm text-slate-500">
                      {selectedLesson.assignmentId ? 'Bài học đã có đề bài tập. Giao bài & đặt hạn nộp trong trang Lớp học.' : isLocked ? 'Bài học chưa có đề bài tập.' : 'Bài học loại Bài tập cần đề bài để học viên nộp file.'}
                    </p>
                  </div>
                  {selectedLesson.assignmentId ? (
                    !isLocked && (
                      <Button variant="secondary" onClick={async () => {
                        try { setAssignmentModal(await assignmentService.get(selectedLesson.assignmentId)); }
                        catch (error) { toast.error(error?.message || 'Không thể tải bài tập.'); }
                      }}>Sửa đề bài tập</Button>
                    )
                  ) : !isLocked && (
                    <Button onClick={() => setAssignmentModal('create')}><Plus size={15} /> Tạo đề bài tập</Button>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <LessonMaterialsPanel lessonId={selectedLesson.id} editable={!isLocked} />
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] flex items-center justify-center text-center text-slate-500">
              <div>
                <FileText className="mx-auto mb-3" size={36} />
                <p>Chọn một bài học hoặc thêm bài học mới.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
      )}

      {assignmentModal && selectedLesson && (
        <AssignmentFormModal
          assignment={assignmentModal === 'create' ? null : assignmentModal}
          lesson={assignmentModal === 'create' ? { id: selectedLesson.id, title: selectedLesson.title } : null}
          onClose={() => setAssignmentModal(null)}
          onSaved={(saved) => {
            setAssignmentModal(null);
            // Cập nhật assignmentId trong cây đề cương để nút chuyển sang "Sửa đề bài tập"
            setChapters(prev => prev.map(chapter => ({
              ...chapter,
              lessons: (chapter.lessons || []).map(l => (l.id === saved.lessonId ? { ...l, assignmentId: saved.id } : l))
            })));
          }}
        />
      )}

      {creatingQuiz && selectedLesson && (
        <QuizFormModal
          lesson={{ id: selectedLesson.id, title: selectedLesson.title }}
          onClose={() => setCreatingQuiz(false)}
          onSaved={(quiz) => { setCreatingQuiz(false); navigate(`/teacher/quizzes/${quiz.id}`); }}
        />
      )}
    </>
  );
}
