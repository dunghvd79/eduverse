import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, CheckCircle2, Save, Send, Upload, FileText, Pencil, Trash2, X } from 'lucide-react';
import { PortalHeader, Button, Card, Badge, Field } from '../../components/portal/PortalUI';
import { courseService } from '../../services/courseService';
import { courseMaterialService } from '../../services/courseMaterialService';

export default function CourseCurriculumBuilderPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [title, setTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [lessonType, setLessonType] = useState('theory');
  const [videoUrl, setVideoUrl] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('theory');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [materials, setMaterials] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editingMaterialTitle, setEditingMaterialTitle] = useState('');
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCurriculum = async ({ chapterId = selectedChapterId, lessonId = selectedLesson?.id } = {}) => {
    try {
      setLoading(true);
      const response = await courseService.getCourseCurriculum(id);
      const curriculum = response || { chapters: [] };
      setCourse({
        id: curriculum.courseId,
        title: curriculum.title,
        status: curriculum.status,
        rejectionReason: curriculum.rejectionReason
      });
      const chapterList = curriculum.chapters || [];
      setChapters(chapterList);
      const selectedChapter = chapterList.find((chapter) => chapter.id === chapterId) || chapterList[0];
      const selectedLessonData = selectedChapter?.lessons?.find((lesson) => lesson.id === lessonId)
        || selectedChapter?.lessons?.[0]
        || null;
      setSelectedChapterId(selectedChapter?.id || null);
      setSelectedLesson(selectedLessonData);
      setTitle(selectedLessonData?.title || '');
      setContentText(selectedLessonData?.contentText || '');
      setLessonType(selectedLessonData?.lessonType || 'theory');
      setVideoUrl(selectedLessonData?.videoUrl || '');
      setErrorMessage('');
    } catch (error) {
      console.error('Load curriculum failed:', error);
      setErrorMessage(error?.message || 'Không thể tải đề cương khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCurriculum({ chapterId: null, lessonId: null });
  }, [id]);

  useEffect(() => {
    let active = true;
    const loadMaterials = async () => {
      if (!selectedLesson?.id) {
        setMaterials([]);
        return;
      }
      setMaterials([]);
      setMaterialError('');
      try {
        const result = await courseMaterialService.getLessonMaterials(selectedLesson.id);
        if (active) setMaterials(result.items || []);
      } catch (error) {
        if (active) setMaterialError(error?.message || 'Không thể tải danh sách tài liệu.');
      }
    };
    loadMaterials();
    return () => { active = false; };
  }, [selectedLesson?.id]);

  const selectedChapter = useMemo(() =>
    chapters.find((chapter) => chapter.id === selectedChapterId) || chapters[0],
    [chapters, selectedChapterId]
  );

  const handleSelectLesson = (chapter, lesson) => {
    setSelectedChapterId(chapter.id);
    setSelectedLesson(lesson);
    setTitle(lesson.title);
    setContentText(lesson.contentText || '');
    setLessonType(lesson.lessonType || 'theory');
    setVideoUrl(lesson.videoUrl || '');
  };

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim() || !id) return;
    try {
      const created = await courseService.createChapter(id, { title: newChapterTitle.trim() });
      setNewChapterTitle('');
      await loadCurriculum({ chapterId: created.id, lessonId: null });
    } catch (error) {
      console.error('Create chapter failed:', error);
      setErrorMessage(error?.message || 'Không thể tạo chương học.');
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedChapterId || !newLessonTitle.trim()) return;
    try {
      const created = await courseService.createLesson(selectedChapterId, {
        title: newLessonTitle.trim(),
        lessonType: newLessonType,
        videoUrl: newVideoUrl.trim() || null,
        contentText: ''
      });
      setNewLessonTitle('');
      setNewLessonType('theory');
      setNewVideoUrl('');
      await loadCurriculum({ chapterId: selectedChapterId, lessonId: created.id });
    } catch (error) {
      console.error('Create lesson failed:', error);
      setErrorMessage(error?.message || 'Không thể tạo bài học.');
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    try {
      await courseService.updateLesson(selectedLesson.id, {
        title: title.trim(),
        contentText,
        lessonType,
        videoUrl: videoUrl.trim() || null
      });
      await loadCurriculum({ chapterId: selectedChapterId, lessonId: selectedLesson.id });
    } catch (error) {
      console.error('Save lesson failed:', error);
      setErrorMessage(error?.message || 'Không thể lưu bài học.');
    }
  };

  const handleUploadMaterial = async () => {
    if (!selectedLesson?.id || !selectedFile || !materialTitle.trim() || uploadingMaterial) return;
    const lessonId = selectedLesson.id;
    try {
      setUploadingMaterial(true);
      setMaterialError('');
      const material = await courseMaterialService.uploadLessonMaterial(
        lessonId,
        selectedFile,
        materialTitle
      );
      if (selectedLesson?.id === lessonId) {
        setMaterials((current) => [...current, material]);
      }
      setSelectedFile(null);
      setMaterialTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setMaterialError(error?.message || 'Không thể tải tài liệu lên.');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleSaveMaterialTitle = async (material) => {
    try {
      const updated = await courseMaterialService.updateLessonMaterial(
        selectedLesson.id,
        material.id,
        editingMaterialTitle
      );
      setMaterials((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingMaterialId(null);
      setMaterialError('');
    } catch (error) {
      setMaterialError(error?.message || 'Không thể cập nhật tên tài liệu.');
    }
  };

  const handleDeleteMaterial = async (material) => {
    if (!window.confirm(`Xóa "${material.title}" và tệp khỏi S3?`)) return;
    try {
      await courseMaterialService.deleteLessonMaterial(selectedLesson.id, material.id);
      setMaterials((current) => current.filter((item) => item.id !== material.id));
      setMaterialError('');
    } catch (error) {
      setMaterialError(error?.message || 'Không thể xóa tài liệu.');
    }
  };

  const handlePublishRequest = async () => {
    if (!id) return;
    try {
      await courseService.publishCourse(id);
      await loadCurriculum();
    } catch (error) {
      console.error('Publish request failed:', error);
      setErrorMessage(error?.message || 'Không thể gửi khóa học đi duyệt.');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#475569' }}>Đang tải đề cương khóa học...</div>;
  }
  if (errorMessage && !course) {
    return <div role="alert" style={{ padding: '2rem', color: '#b91c1c' }}>{errorMessage}</div>;
  }

  return (
    <>
      {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
      <PortalHeader
        eyebrow="CURRICULUM BUILDER"
        title={course?.title || 'Khóa học'}
        desc="Soạn thảo chương, bài học và tài liệu trước khi gửi duyệt."
        actions={
          <>
            <Button variant="secondary" onClick={handlePublishRequest} disabled={course?.status === 'pending' || course?.status === 'published'}>Gửi duyệt</Button>
            <Button onClick={handleSaveLesson} disabled={!selectedLesson}><Save size={16} /> Lưu bài học</Button>
          </>
        }
      />

      <div className="builder-layout">
        <aside className="builder-tree">
          <div className="builder-head">
            <b>Nội dung khóa học</b>
            <button type="button" className="ui-btn ghost" onClick={handleCreateChapter} title="Thêm chương">
              <Plus size={16} />
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Field
              label="Tên chương mới"
              placeholder="VD: Chương 5: React Router"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
            />
          </div>

          {(chapters || []).map((chapter) => (
            <div key={chapter.id} className={`chapter ${selectedChapterId === chapter.id ? 'selected' : ''}`}>
              <b>{chapter.title}</b>
              <small>{chapter.lessons?.length || 0} bài học</small>
              <div className="chapter-lessons">
                {(chapter.lessons || []).map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`lesson ${selectedLesson?.id === lesson.id ? 'selected' : ''}`}
                    onClick={() => handleSelectLesson(chapter, lesson)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>{lesson.orderIndex || 1}</span>
                    {lesson.title}
                    <CheckCircle2 size={14} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <Card className="editor-card">
          {selectedLesson ? (
            <>
              <div className="editor-top">
                <div>
                  <Badge tone="blue">BÀI {selectedLesson.orderIndex || 1}</Badge>
                  <h2>{selectedLesson.title}</h2>
                </div>
                <Badge tone="green">{course?.status || 'draft'}</Badge>
              </div>

              <Field
                label="Tiêu đề bài học"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label className="field">
                <span>Loại bài học</span>
                <select value={lessonType} onChange={(e) => setLessonType(e.target.value)}>
                  <option value="theory">Lý thuyết</option>
                  <option value="video">Video</option>
                  <option value="quiz">Trắc nghiệm</option>
                  <option value="assignment">Bài tập</option>
                </select>
              </label>

              {lessonType === 'video' && (
                <Field
                  label="Đường dẫn video"
                  type="url"
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              )}

              <label className="field">
                <span>Nội dung bài học</span>
                <textarea
                  rows="8"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Nội dung lý thuyết / bài giảng..."
                />
              </label>

              <section aria-label="Tài liệu bài học" style={{ marginTop: 24 }}>
                <h3>Tài liệu đính kèm</h3>
                {materialError && <div role="alert" style={{ color: '#b91c1c', marginBottom: 12 }}>{materialError}</div>}
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto', alignItems: 'end' }}>
                  <label className="field">
                    <span>Chọn tài liệu (PDF, Word, PowerPoint, ZIP — tối đa 50 MB)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setSelectedFile(file);
                        setMaterialTitle(file?.name || '');
                      }}
                    />
                  </label>
                  <Field
                    label="Tên hiển thị"
                    value={materialTitle}
                    onChange={(event) => setMaterialTitle(event.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleUploadMaterial}
                    disabled={!selectedFile || !materialTitle.trim() || uploadingMaterial}
                  >
                    <Upload size={16} /> {uploadingMaterial ? 'Đang tải...' : 'Tải lên'}
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {materials.map((material) => (
                    <div key={material.id} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                      <FileText size={18} />
                      {editingMaterialId === material.id ? (
                        <>
                          <input
                            aria-label="Tên tài liệu"
                            value={editingMaterialTitle}
                            onChange={(event) => setEditingMaterialTitle(event.target.value)}
                            style={{ flex: 1 }}
                          />
                          <Button variant="secondary" onClick={() => handleSaveMaterialTitle(material)}><Save size={15} /> Lưu</Button>
                          <Button variant="secondary" onClick={() => setEditingMaterialId(null)}><X size={15} /></Button>
                        </>
                      ) : (
                        <>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{material.title}</strong>
                            <small style={{ display: 'block', color: '#64748b' }}>
                              {material.fileName} · {material.fileType.toUpperCase()} · {(material.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </small>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingMaterialId(material.id);
                              setEditingMaterialTitle(material.title);
                            }}
                          >
                            <Pencil size={15} /> Đổi tên
                          </Button>
                          <Button variant="secondary" onClick={() => handleDeleteMaterial(material)}>
                            <Trash2 size={15} /> Xóa
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  {!materials.length && <small style={{ color: '#64748b' }}>Chưa có tài liệu đính kèm.</small>}
                </div>
              </section>

              <div className="editor-actions">
                <Field
                  label="Tên bài học mới"
                  placeholder="VD: Giới thiệu React Hooks"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                />
                <label className="field">
                  <span>Loại bài học mới</span>
                  <select value={newLessonType} onChange={(e) => setNewLessonType(e.target.value)}>
                    <option value="theory">Lý thuyết</option>
                    <option value="video">Video</option>
                    <option value="quiz">Trắc nghiệm</option>
                    <option value="assignment">Bài tập</option>
                  </select>
                </label>
                {newLessonType === 'video' && (
                  <Field
                    label="Đường dẫn video mới"
                    type="url"
                    placeholder="https://..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                  />
                )}
                <Button variant="secondary" onClick={handleCreateLesson} disabled={!selectedChapterId || !newLessonTitle.trim()}>Thêm bài mới</Button>
                <Button onClick={handleSaveLesson}><Send size={16} /> Lưu bài học</Button>
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', color: '#64748b' }}>
              {selectedChapter ? 'Chương này chưa có bài học. Nhập tên để thêm bài đầu tiên.' : 'Tạo chương học đầu tiên để bắt đầu soạn đề cương.'}
              {selectedChapter && (
                <div style={{ marginTop: 12 }}>
                  <Field
                    label="Tên bài học mới"
                    placeholder="VD: Giới thiệu React Hooks"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                  />
                  <label className="field">
                    <span>Loại bài học mới</span>
                    <select value={newLessonType} onChange={(e) => setNewLessonType(e.target.value)}>
                      <option value="theory">Lý thuyết</option>
                      <option value="video">Video</option>
                      <option value="quiz">Trắc nghiệm</option>
                      <option value="assignment">Bài tập</option>
                    </select>
                  </label>
                  {newLessonType === 'video' && (
                    <Field
                      label="Đường dẫn video mới"
                      type="url"
                      placeholder="https://..."
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                    />
                  )}
                  <Button variant="secondary" onClick={handleCreateLesson} disabled={!newLessonTitle.trim()}>Thêm bài học</Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
