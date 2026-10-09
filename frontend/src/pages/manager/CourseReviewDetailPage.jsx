import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PortalHeader, Button, Card, SectionTitle, Badge, Field } from '../../components/portal/PortalUI';
import { courseService } from '../../services/courseService';

export default function CourseReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState({ chapters: [] });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCourseReview = async () => {
      if (!id) {
        setErrorMessage('Không tìm thấy mã khóa học cần duyệt.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMessage('');
        const [detailRes, curriculumRes] = await Promise.all([
          courseService.getCourseById(id),
          courseService.getCourseCurriculum(id)
        ]);
        setCourse(detailRes || null);
        setCurriculum(curriculumRes || { chapters: [] });
      } catch (error) {
        console.error('Load course review failed:', error);
        setErrorMessage(error?.message || 'Không thể tải thông tin khóa học. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    loadCourseReview();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setErrorMessage('');
      await courseService.approveCourse(id);
      alert('Khóa học đã được phê duyệt thành công');
      navigate('/manager/approvals');
    } catch (error) {
      console.error('Approve course failed:', error);
      setErrorMessage(error?.message || 'Không thể phê duyệt khóa học. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 5) {
      setErrorMessage('Lý do từ chối phải có ít nhất 5 ký tự.');
      return;
    }
    try {
      setActionLoading(true);
      setErrorMessage('');
      await courseService.rejectCourse(id, reason.trim());
      alert('Khóa học đã được từ chối');
      navigate('/manager/approvals');
    } catch (error) {
      console.error('Reject course failed:', error);
      setErrorMessage(error?.message || 'Không thể từ chối khóa học. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <div style={{ padding: '2rem', color: '#475569' }}>Đang tải chi tiết khóa học...</div>
      ) : errorMessage && !course ? (
        <div role="alert" style={{ padding: '2rem', color: '#b91c1c' }}>{errorMessage}</div>
      ) : (
        <>
          <PortalHeader
            eyebrow="COURSE REVIEW"
            title={`Duyệt khóa học: ${course?.title || 'Khóa học'}`}
            desc="Kiểm tra nội dung trước khi xuất bản."
            actions={
              <>
                <Button variant="danger" onClick={handleReject} disabled={actionLoading}>Từ chối</Button>
                <Button onClick={handleApprove} disabled={actionLoading}>Duyệt & xuất bản</Button>
              </>
            }
          />

          {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}

          <div className="review-layout">
            <Card>
              <SectionTitle title="Thông tin khóa học" />
              <div className="review-course-head">
                <div className="course-cover c0">{(course?.title || 'EDU').slice(0, 4).toUpperCase()}</div>
                <div>
                  <Badge tone="orange">PENDING APPROVAL</Badge>
                  <h2>{course?.title}</h2>
                  <p>{course?.owner?.fullName || 'Giảng viên'} · {course?.totalLessons || 0} bài học · {curriculum?.chapters?.length || 0} chương</p>
                </div>
              </div>

              <div className="review-section">
                <h3>Mô tả</h3>
                <p>{course?.description || 'Chưa có mô tả chi tiết cho khóa học này.'}</p>
              </div>

              <div className="review-section">
                <h3>Đề cương</h3>
                {(curriculum?.chapters || []).map((chapter, index) => (
                  <div key={chapter.id} className="outline-row">
                    <span>{index + 1}</span>
                    <b>{chapter.title}</b>
                    <small>{chapter.lessons?.length || 0} bài</small>
                    <CheckCircle2 />
                  </div>
                ))}
              </div>
            </Card>

            <aside>
              <Card>
                <SectionTitle title="Checklist" />
                {[
                  'Mục tiêu khóa học rõ ràng',
                  'Đề cương đầy đủ',
                  'Video/tài liệu hợp lệ',
                  'Bài kiểm tra có đáp án',
                  'Không có nội dung vi phạm'
                ].map((item) => (
                  <div key={item} className="check-row">
                    <CheckCircle2 size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </Card>

              <Card>
                <SectionTitle title="Ghi chú duyệt" />
                <Field
                  label="Nhận xét"
                  placeholder="Nhập nhận xét cho giảng viên..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Card>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
