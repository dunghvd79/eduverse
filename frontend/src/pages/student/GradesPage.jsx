import React, { useEffect, useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Card, Badge, Progress, Button } from '../../components/portal/PortalUI';
import classService from '../../services/classService';
import gradebookService, { ASSIGNMENT_STATE, RANKING_TONE, formulaText } from '../../services/gradebookService';
import { formatScore } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

const Component = ({ label, value, weight }) => (
  <div className="rounded-lg border border-slate-200 p-3">
    <small className="block text-slate-500">{label}{weight !== undefined && ` · ${Math.round(weight * 1000) / 10}%`}</small>
    <b className="text-xl">{value}</b>
  </div>
);

/**
 * Điểm số của học viên ở từng lớp, tính theo grading-policy.md
 */
function ClassGrades({ cls, data }) {
  const navigate = useNavigate();
  const me = data.me;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold">{cls.course?.title}</h2>
          <p className="text-sm text-slate-500">{cls.name}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold">{formatScore(me.finalScore)}<small className="text-base text-slate-500">/10</small></div>
          <Badge tone={RANKING_TONE[me.ranking]}>{me.ranking}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.weights.quiz !== undefined && <Component label="TB Bài kiểm tra" value={formatScore(me.quizAverage)} weight={data.weights.quiz} />}
        {data.weights.assignment !== undefined && <Component label="TB Bài tập" value={formatScore(me.assignmentAverage)} weight={data.weights.assignment} />}
        <Component label={`Tiến độ (${me.completedLessons}/${me.totalLessons} bài)`} value={`${me.progressPercentage}%`} weight={data.weights.progress} />
      </div>
      <Progress value={me.progressPercentage} />

      {(data.quizzes.length > 0 || data.assignments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {data.quizzes.length > 0 && (
            <div>
              <b className="text-sm">Bài kiểm tra (điểm cao nhất)</b>
              {data.quizzes.map((quiz, i) => {
                const score = me.quizScores[i];
                return (
                  <div key={quiz.id} className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-sm">
                    <span className="truncate">{quiz.title}</span>
                    <b className={score.attempted ? '' : 'text-slate-400'}>{score.attempted ? formatScore(score.score) : 'Chưa làm (0)'}</b>
                  </div>
                );
              })}
            </div>
          )}
          {data.assignments.length > 0 && (
            <div>
              <b className="text-sm">Bài tập</b>
              {data.assignments.map((assignment, i) => {
                const score = me.assignmentScores[i];
                const badge = ASSIGNMENT_STATE[score.state];
                return (
                  <div key={assignment.id} className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-sm">
                    <span className="truncate">{assignment.title}</span>
                    <span className="flex items-center gap-2">
                      {badge && <Badge tone={badge[1]}>{badge[0]}</Badge>}
                      <b>{formatScore(score.grade)}</b>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <p className="flex items-center gap-1.5 text-xs text-slate-500"><Info size={13} /> Tổng kết = {formulaText(data.weights)}</p>
        <Button variant="ghost" onClick={() => navigate(`/student/classes/${cls.id}`)}>Vào lớp học</Button>
      </div>
    </Card>
  );
}

export default function GradesPage() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const classes = await classService.myClasses();
        const grades = await Promise.all(classes.map(cls => gradebookService.myGrades(cls.id).catch(() => null)));
        setItems(classes.map((cls, i) => ({ cls, data: grades[i] })).filter(x => x.data));
      } catch (error) {
        toast.error(error?.message || 'Không thể tải điểm số.');
        setItems([]);
      }
    })();
  }, []);

  return (
    <>
      <PortalHeader eyebrow="ACADEMIC RECORD" title="Điểm số" desc="Điểm tổng kết từng lớp: Bài kiểm tra 40% · Bài tập 50% · Tiến độ học 10% (thang 10)." />
      {!items ? (
        <div className="p-10 text-center text-slate-500">Đang tính điểm...</div>
      ) : items.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <BarChart3 className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-500">Bạn chưa tham gia lớp học nào.</p>
          </div>
        </Card>
      ) : items.map(({ cls, data }) => <ClassGrades key={cls.id} cls={cls} data={data} />)}
    </>
  );
}
