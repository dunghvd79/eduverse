import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Card, Table, Badge, Button } from '../../components/portal/PortalUI';
import classService from '../../services/classService';
import assignmentService from '../../services/assignmentService';
import { formatDateTime, formatScore } from '../../services/quizService';
import { timeLeft } from '../../utils/datetime';
import { toast } from '../../components/common/Toast';

/**
 * Trạng thái bài tập với học viên
 */
export const assignmentStatus = (item) => {
  const mine = item.mySubmission;
  if (mine?.status === 'resubmission_requested') return ['Cần nộp lại', 'red'];
  if (mine?.status === 'graded') return [`Đã chấm: ${formatScore(mine.grade)}`, 'green'];
  if (mine) return [mine.isLate ? 'Đã nộp muộn' : 'Đã nộp', 'blue'];
  if (item.isClosed) return ['Quá hạn — chưa nộp', 'red'];
  if (!item.isOpen) return ['Chưa mở', 'gray'];
  if (item.isLatePeriod) return ['Quá hạn — còn nộp muộn', 'orange'];
  return ['Chưa nộp', 'purple'];
};

/**
 * Bảng bài tập của một lớp (dùng ở trang này và trang chi tiết lớp)
 */
export function StudentAssignmentTable({ classId, items }) {
  const navigate = useNavigate();
  if (!items.length) return <p className="text-sm text-slate-500">Lớp chưa được giao bài tập nào.</p>;
  return (
    <Table
      headers={['Bài tập', 'Hạn nộp', 'Trạng thái', '']}
      rows={items.map(item => {
        const [label, tone] = assignmentStatus(item);
        return [
          <div><b>{item.title}</b><div className="text-xs text-slate-500">{item.lessonTitle} · {item.allowedFileTypes} · tối đa {item.maxFileSizeMb}MB</div></div>,
          <div className="text-xs whitespace-nowrap">{formatDateTime(item.deadline)}{!item.mySubmission && item.isOpen && <div className={item.isLatePeriod ? 'text-red-600' : 'text-slate-500'}>{timeLeft(item.deadline)}</div>}</div>,
          <Badge tone={tone}>{label}</Badge>,
          <Button variant="ghost" onClick={() => navigate(`/student/classes/${classId}/assignments/${item.id}`)}>
            {item.canSubmit && (!item.mySubmission || item.mySubmission.status === 'resubmission_requested') ? 'Nộp bài' : 'Xem'}
          </Button>
        ];
      })}
    />
  );
}

export default function StudentAssignmentsPage() {
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const classes = await classService.myClasses();
        const lists = await Promise.all(classes.map(cls => assignmentService.classAssignments(cls.id).then(d => d.items || []).catch(() => [])));
        setGroups(classes.map((cls, i) => ({ cls, items: lists[i] })));
      } catch (error) {
        toast.error(error?.message || 'Không thể tải bài tập.');
        setGroups([]);
      }
    })();
  }, []);

  const todo = useMemo(
    () => (groups || []).reduce((sum, g) => sum + g.items.filter(i => i.canSubmit && (!i.mySubmission || i.mySubmission.status === 'resubmission_requested')).length, 0),
    [groups]
  );

  return (
    <>
      <PortalHeader eyebrow="ASSIGNMENTS" title="Bài tập" desc={groups ? `${todo} bài tập đang chờ bạn nộp.` : 'Bài tập nộp file của các lớp bạn đang học.'} />
      {!groups ? (
        <div className="p-10 text-center text-slate-500">Đang tải bài tập...</div>
      ) : groups.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <FileText className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-500">Bạn chưa tham gia lớp học nào.</p>
          </div>
        </Card>
      ) : groups.map(({ cls, items }) => (
        <Card key={cls.id}>
          <h2 className="font-bold mb-1">{cls.course?.title}</h2>
          <p className="text-sm text-slate-500 mb-3">{cls.name}</p>
          <StudentAssignmentTable classId={cls.id} items={items} />
        </Card>
      ))}
    </>
  );
}
