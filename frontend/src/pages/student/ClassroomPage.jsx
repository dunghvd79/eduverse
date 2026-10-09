import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, PlayCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../components/portal/PortalUI';
import { courseService } from '../../services/courseService';
import { courseMaterialService } from '../../services/courseMaterialService';

export default function ClassroomPage() {
  const { courseId, lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const classId = searchParams.get('classId');
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialError, setMaterialError] = useState('');

  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const curriculum = await courseService.getCourseCurriculum(
          courseId,
          classId ? { classId } : {}
        );
        setCourse({
          id: curriculum.courseId,
          title: curriculum.title
        });
        const chapterList = curriculum.chapters || [];
        setChapters(chapterList);

        const flatLessons = chapterList.flatMap((chapter) => (chapter.lessons || []).map((lesson) => ({ ...lesson, chapterTitle: chapter.title })));
        const match = flatLessons.find((lesson) => lesson.id === lessonId) || flatLessons[0];
        setSelectedLesson(match || null);
      } catch (error) {
        console.error('Load classroom failed:', error);
        setErrorMessage(error?.message || 'Không thể tải nội dung khóa học.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) loadCurriculum();
  }, [courseId, lessonId, classId]);

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
        if (active) setMaterialError(error?.message || 'Không thể tải tài liệu bài học.');
      }
    };
    loadMaterials();
    return () => { active = false; };
  }, [selectedLesson?.id]);

  const lessonList = useMemo(() =>
    chapters.flatMap((chapter) => (chapter.lessons || []).map((lesson) => ({ ...lesson, chapterTitle: chapter.title }))),
    [chapters]
  );
  const selectedIndex = lessonList.findIndex((lesson) => lesson.id === selectedLesson?.id);

  const openLesson = (lesson) => {
    const classQuery = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    navigate(`/student/courses/${courseId}/learn/${lesson.id}${classQuery}`);
  };

  const handleMarkCompleted = async () => {
    if (!classId || !selectedLesson || savingProgress) return;
    try {
      setSavingProgress(true);
      await courseService.markLessonProgress(classId, selectedLesson.id, !selectedLesson.isCompleted);
      const isCompleted = !selectedLesson.isCompleted;
      setSelectedLesson((current) => ({ ...current, isCompleted }));
      setChapters((current) => current.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) =>
          lesson.id === selectedLesson.id ? { ...lesson, isCompleted } : lesson
        )
      })));
    } catch (error) {
      console.error('Update lesson progress failed:', error);
      setErrorMessage(error?.message || 'Không thể cập nhật tiến độ bài học.');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleOpenMaterial = async (material) => {
    try {
      setMaterialError('');
      const { downloadUrl } = await courseMaterialService.getDownloadUrl(selectedLesson.id, material.id);
      window.location.assign(downloadUrl);
    } catch (error) {
      setMaterialError(error?.message || 'Không thể mở tài liệu.');
    }
  };

  return (
    <>
      {loading ? (
        <div style={{ padding: '2rem', color: '#475569' }}>Đang tải bài học...</div>
      ) : errorMessage && !course ? (
        <div role="alert" style={{ padding: '2rem', color: '#b91c1c' }}>{errorMessage}</div>
      ) : (
        <>
          {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
          <div className="learning-top">
            <div>
              <span>Khóa học / {course?.title || 'Bài học'}</span>
              <h1>{selectedLesson?.title || 'Chưa có bài học'}</h1>
            </div>
            <div>
              <Button variant="secondary" disabled={selectedIndex <= 0} onClick={() => openLesson(lessonList[selectedIndex - 1])}>← Bài trước</Button>
              <Button disabled={selectedIndex < 0 || selectedIndex >= lessonList.length - 1} onClick={() => openLesson(lessonList[selectedIndex + 1])}>Bài tiếp theo →</Button>
            </div>
          </div>

          <div className="learning-layout">
            <aside className="lesson-list">
              <b>Nội dung khóa học</b>
              {lessonList.map((item) => (
                <div
                  key={item.id}
                  className={`lesson-item ${selectedLesson?.id === item.id ? 'active' : ''}`}
                  onClick={() => openLesson(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="lesson-check">{item.isCompleted ? <CheckCircle2 size={16} /> : selectedLesson?.id === item.id ? '▶' : '•'}</span>
                  {item.title}
                  <small>{item.chapterTitle}</small>
                </div>
              ))}
            </aside>

            <section>
              <div className="video-player">
                <div className="play-circle"><PlayCircle size={58} /></div>
                <div className="video-label">EDUVERSE · {selectedLesson?.lessonType || 'LESSON'}</div>
                {selectedLesson?.videoUrl && <a href={selectedLesson.videoUrl} target="_blank" rel="noreferrer">Mở video bài giảng</a>}
              </div>

              <Card className="lesson-content">
                <Badge>{(selectedLesson?.lessonType || 'video').toUpperCase()}</Badge>
                <h2>{selectedLesson?.title}</h2>
                <p>{selectedLesson?.contentText || 'Bài học này đang được cập nhật nội dung. Vui lòng quay lại sau.'}</p>

                {selectedLesson?.isCompleted !== undefined && classId && (
                  <Button variant={selectedLesson.isCompleted ? 'secondary' : 'primary'} onClick={handleMarkCompleted} disabled={savingProgress}>
                    {selectedLesson.isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                  </Button>
                )}
              </Card>
              <Card className="lesson-content" style={{ marginTop: 16 }}>
                <h2>Tài liệu bài học</h2>
                {materialError && <div role="alert" style={{ color: '#b91c1c', marginBottom: 12 }}>{materialError}</div>}
                {materials.length ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {materials.map((material) => (
                      <div key={material.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong>{material.title}</strong>
                          <small style={{ display: 'block', color: '#64748b' }}>
                            {material.fileName} · {material.fileType.toUpperCase()} · {(material.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </small>
                        </div>
                        <Button variant="secondary" onClick={() => handleOpenMaterial(material)}>Mở / tải xuống</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b' }}>Chưa có tài liệu đính kèm cho bài học này.</p>
                )}
              </Card>
            </section>
          </div>
        </>
      )}
    </>
  );
}
