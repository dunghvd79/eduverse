import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Progress, Card, Badge, Field } from '../../components/portal/PortalUI';
import classService, { CLASS_STATUS, formatDate, formatRelativeTime, learnUrl } from '../../services/classService';
import { toast } from '../../components/common/Toast';

const allLessonsDone = (cls) => cls.progress?.totalLessons > 0 && cls.progress.completedLessons >= cls.progress.totalLessons;
// Hoàn thành = lớp đã kết thúc, hoặc học hết bài và không còn bài tập/bài kiểm tra phải làm (việc đã lỡ hạn không chặn)
const isCompleted = (cls) => cls.status === 'closed' || (allLessonsDone(cls) && !cls.todo?.todoCount);

// API đã xếp theo học gần nhất (chưa học thì theo ghi danh mới nhất)
const SORTS = {
  recent: ['Học gần nhất', null],
  enrolled: ['Ghi danh mới nhất', (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)],
  title: ['Tên khóa học A–Z', (a, b) => (a.course?.title || '').localeCompare(b.course?.title || '', 'vi')]
};

// Nút chính trên thẻ: học tiếp đúng bài đang dở; học hết bài nhưng còn việc thì vào trang lớp để làm
const primaryActionOf = (cls, classUrl) => {
  if (isCompleted(cls)) return ['Xem lại', classUrl];
  if (allLessonsDone(cls)) return ['Làm bài', classUrl];
  if (!cls.progress?.nextLessonId) return ['Vào lớp', classUrl];
  return [cls.progress.completedLessons > 0 ? 'Tiếp tục' : 'Bắt đầu học', learnUrl(cls.course.id, cls.progress.nextLessonId, cls.id)];
};

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [showEnroll, setShowEnroll] = useState(false);
  const [code, setCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      // Khóa học đang chỉnh sửa (chưa công khai) không mở được bài -> ẩn khỏi trang này (vẫn xem điểm ở trang Điểm số)
      setClasses((await classService.myClasses()).filter(cls => cls.course?.status === 'published'));
    } catch (error) {
      toast.error(error?.message || 'Không thể tải lớp học của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: classes.length,
    learning: classes.filter(cls => !isCompleted(cls)).length,
    completed: classes.filter(isCompleted).length
  }), [classes]);

  const visible = useMemo(() => {
    const key = search.trim().toLowerCase();
    const list = classes.filter(cls =>
      (tab === 'all' || (tab === 'completed' ? isCompleted(cls) : !isCompleted(cls))) &&
      (!key || cls.name.toLowerCase().includes(key) || cls.course?.title?.toLowerCase().includes(key))
    );
    const compare = SORTS[sort][1];
    return compare ? [...list].sort(compare) : list;
  }, [classes, tab, search, sort]);

  const enroll = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    try {
      setEnrolling(true);
      const data = await classService.enroll(code.trim());
      toast.success(`Đã tham gia lớp "${data.className}".`);
      setShowEnroll(false);
      setCode('');
      navigate(`/student/classes/${data.classId}`);
    } catch (error) {
      toast.error(error?.message || 'Không thể tham gia lớp.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <>
      <PortalHeader
        title="Khóa học của tôi"
        desc="Các lớp học bạn đã tham gia và tiến độ hiện tại."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowEnroll(true)}><Plus size={17} /> Nhập mã lớp</Button>
            <Button onClick={() => navigate('/courses')}>Khám phá khóa học</Button>
          </>
        }
      />

      <div className="filter-bar flex-wrap gap-3">
        <div className="tabs">
          {[['all', 'Tất cả', counts.all], ['learning', 'Đang học', counts.learning], ['completed', 'Hoàn thành', counts.completed]].map(([value, label, count]) => (
            <button key={value} className={`tab ${tab === value ? 'active' : ''}`} onClick={() => setTab(value)}>{label} <b>{count}</b></button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select value={sort} onChange={e => setSort(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm bg-white" aria-label="Sắp xếp">
            {Object.entries(SORTS).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 flex-1 md:flex-none md:w-64">
            <Search size={15} className="text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khóa học..." className="flex-1 min-w-0 text-sm outline-none" />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500">Đang tải lớp học...</div>
      ) : visible.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-500" size={32} />
            {classes.length === 0 ? (
              <>
                <p className="text-slate-600 font-semibold">Bạn chưa tham gia lớp học nào.</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Nhập mã lớp do giảng viên cung cấp để bắt đầu học.</p>
                <Button onClick={() => setShowEnroll(true)}><Plus size={16} /> Nhập mã lớp</Button>
              </>
            ) : (
              <p className="text-slate-500">Không có lớp học phù hợp.</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="course-list">
          {visible.map((cls, index) => {
            const done = isCompleted(cls);
            const percent = cls.progress?.progressPercentage || 0;
            const [statusLabel, statusTone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
            const classUrl = `/student/classes/${cls.id}`;
            const [actionLabel, actionUrl] = primaryActionOf(cls, classUrl);
            const { todoCount = 0, dueSoonCount = 0, nextDeadline = null } = cls.todo || {};
            return (
              <Card key={cls.id} className="course-row !flex-col !items-stretch md:!flex-row md:!items-center">
                {/* Mobile: ảnh bìa nằm trên, rộng hết thẻ. Ảnh bìa và tên khóa cùng mở trang lớp như nút "Tiếp tục" */}
                <Link to={classUrl} tabIndex={-1} aria-hidden="true" className="block flex-none w-full md:w-auto">
                  {cls.course?.thumbnailUrl
                    ? <img src={cls.course.thumbnailUrl} alt="" className="course-cover object-cover !w-full md:!w-[145px]" />
                    : <div className={`course-cover c${index % 3} !w-full md:!w-[145px]`}>EDU</div>}
                </Link>
                <div className="course-info min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {done
                      ? <Badge tone="gray">Hoàn thành</Badge>
                      : <Badge tone={allLessonsDone(cls) ? 'blue' : 'green'}>{allLessonsDone(cls) ? 'Đã học hết bài' : 'Đang học'}</Badge>}
                    {cls.status !== 'active' && <Badge tone={statusTone}>{statusLabel}</Badge>}
                    {dueSoonCount > 0
                      ? <Badge tone="orange">{dueSoonCount} việc sắp đến hạn{nextDeadline ? ` · gần nhất ${formatDate(nextDeadline)}` : ''}</Badge>
                      : todoCount > 0 && <Badge tone="blue">{todoCount} việc cần làm</Badge>}
                  </div>
                  <h3><Link to={classUrl} className="hover:text-primary hover:underline">{cls.course?.title}</Link></h3>
                  <p className="text-sm text-slate-500">{cls.name} · Giảng viên: {cls.teacher?.fullName || '—'}</p>
                  <Progress value={percent} />
                  <small>
                    {cls.progress?.completedLessons || 0}/{cls.progress?.totalLessons || 0} bài · {percent}% hoàn thành
                    {' · '}{cls.progress?.lastActiveAt ? `Học lần cuối ${formatRelativeTime(cls.progress.lastActiveAt)}` : 'Chưa bắt đầu học'}
                  </small>
                </div>
                <div className="self-end md:self-auto">
                  <Button variant="ghost" onClick={() => navigate(actionUrl)}>{actionLabel}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showEnroll && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={enroll}>
            <div className="modal-head">
              <h2>Nhập mã lớp học</h2>
              <button type="button" onClick={() => setShowEnroll(false)} aria-label="Đóng">×</button>
            </div>
            <p className="text-sm text-slate-600 mb-3">Nhập mã lớp do giảng viên cung cấp để tham gia lớp.</p>
            <Field
              label="Mã lớp"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="VD: EDU2026A"
              maxLength={20}
              autoFocus
            />
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowEnroll(false)}>Hủy</Button>
              <Button type="submit" disabled={enrolling || !code.trim()}>{enrolling ? 'Đang tham gia...' : 'Tham gia lớp'}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
