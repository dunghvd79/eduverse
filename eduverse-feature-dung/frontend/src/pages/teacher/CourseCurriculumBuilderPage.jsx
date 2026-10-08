import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Plus, Save, Send, Trash2, Video, ClipboardCheck, FileQuestion, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, Badge, Field } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

const TYPE_LABEL = {
  theory: 'Lý thuyết',
  video: 'Video',
  quiz: 'Quiz',
  assignment: 'Bài tập'
};

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
  const [lessonForm, setLessonForm] = useState({
    title: '',
    lessonType: 'theory',
    contentText: '',
    videoUrl: ''
  });

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

  useEffect(() => {
    if (selectedLesson) {
      setLessonForm({
        title: selectedLesson.title || '',
        lessonType: selectedLesson.lessonType || 'theory',
        contentText: selectedLesson.contentText || '',
        videoUrl: selectedLesson.videoUrl || ''
      });
    }
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

  const addLesson = async (chapterId) => {
    if (!lessonForm.title.trim()) {
      toast.error('Nhập tiêu đề bài học.');
      return;
    }

    try {
      const data = await courseService.createLesson(chapterId, lessonForm);
      setChapters(prev => prev.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, lessons: [...(chapter.lessons || []), data] }
          : chapter
      ));
      setSelectedLessonId(data.id);
      setShowLessonForm(false);
      setLessonForm({ title: '', lessonType: 'theory', contentText: '', videoUrl: '' });
      toast.success('Đã thêm bài học.');
    } catch (error) {
      toast.error(error?.message || 'Không thể thêm bài học.');
    }
  };

  const saveLesson = async () => {
    if (!selectedLesson) return;

    try {
      setSaving(true);
      const updated = await courseService.updateLesson(selectedLesson.id, lessonForm);
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

  const deleteLesson = async () => {
    if (!selectedLesson || !window.confirm('Xóa bài học này?')) return;

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
        eyebrow="CURRICULUM BUILDER"
        title={course?.title || 'Đề cương khóa học'}
        desc={`Trạng thái: ${course?.status || 'draft'} · ${chapters.length} chương`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>Làm mới</Button>
            <Button variant="secondary" onClick={saveLesson} disabled={!selectedLesson || saving}>
              <Save size={16} /> Lưu bài học
            </Button>
            {(course?.status === 'draft' || course?.status === 'rejected') && (
              <Button onClick={submitApproval} disabled={saving}>
                <Send size={16} /> Gửi duyệt
              </Button>
            )}
          </>
        }
      />

      <div className="builder-layout">
        <aside className="builder-tree">
          <div className="builder-head">
            <b>Nội dung khóa học</b>
          </div>

          <div className="p-3 border-b border-slate-200 space-y-2">
            <input
              value={newChapter}
              onChange={e => setNewChapter(e.target.value)}
              placeholder="Tên chương mới..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && addChapter()}
            />
            <Button onClick={addChapter} className="w-full">
              <Plus size={15} /> Thêm chương
            </Button>
          </div>

          {chapters.map((chapter, index) => (
            <div className="chapter" key={chapter.id}>
              <div className="flex items-start gap-2">
                <ChevronDown size={16} className="mt-1 text-slate-400" />
                <div className="min-w-0">
                  <b>{index + 1}. {chapter.title}</b>
                  <small>{(chapter.lessons || []).length} bài học</small>
                </div>
              </div>

              <div className="chapter-lessons">
                {(chapter.lessons || []).map((lesson, lessonIndex) => {
                  const Icon = TYPE_ICON[lesson.lessonType] || FileText;
                  return (
                    <button
                      type="button"
                      key={lesson.id}
                      className={`lesson ${selectedLessonId === lesson.id ? 'selected' : ''}`}
                      onClick={() => setSelectedLessonId(lesson.id)}
                    >
                      <span>{lessonIndex + 1}</span>
                      <Icon size={14} />
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="mt-2 flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-primary"
                  onClick={() => {
                    setShowLessonForm(true);
                    setSelectedLessonId(null);
                    setLessonForm({ title: '', lessonType: 'theory', contentText: '', videoUrl: '' });
                    setLessonChapterId(chapter.id);
                  }}
                >
                  <Plus size={14} /> Thêm bài học
                </button>
              </div>
            </div>
          ))}
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

              <Field
                label="Tiêu đề bài học"
                value={lessonForm.title}
                onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="VD: Nested Routes"
              />

              <label className="field">
                <span>Loại bài học</span>
                <select
                  value={lessonForm.lessonType}
                  onChange={e => setLessonForm({ ...lessonForm, lessonType: e.target.value })}
                >
                  {Object.entries(TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Nội dung</span>
                <textarea
                  rows="12"
                  value={lessonForm.contentText}
                  onChange={e => setLessonForm({ ...lessonForm, contentText: e.target.value })}
                  placeholder="Nhập nội dung Markdown..."
                />
              </label>

              {lessonForm.lessonType === 'video' && (
                <Field
                  label="Video URL"
                  value={lessonForm.videoUrl}
                  onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              )}

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
                <Badge tone="green">Đã tải từ API</Badge>
              </div>

              <Field
                label="Tiêu đề bài học"
                value={lessonForm.title}
                onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
              />

              <label className="field">
                <span>Loại bài học</span>
                <select
                  value={lessonForm.lessonType}
                  onChange={e => setLessonForm({ ...lessonForm, lessonType: e.target.value })}
                >
                  {Object.entries(TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Nội dung</span>
                <textarea
                  rows="12"
                  value={lessonForm.contentText}
                  onChange={e => setLessonForm({ ...lessonForm, contentText: e.target.value })}
                />
              </label>

              {lessonForm.lessonType === 'video' && (
                <Field
                  label="Video URL"
                  value={lessonForm.videoUrl}
                  onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              )}

              <div className="flex items-center justify-between">
                <Button variant="danger" onClick={deleteLesson}>
                  <Trash2 size={15} /> Xóa bài học
                </Button>
                <Button onClick={saveLesson} disabled={saving}>
                  <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu bài học'}
                </Button>
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
    </>
  );
}
