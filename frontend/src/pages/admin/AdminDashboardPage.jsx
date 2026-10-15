import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Lock, RefreshCw, Users } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Badge } from '../../components/portal/PortalUI';
import api from '../../services/api';
import userService from '../../services/userService';
import courseService from '../../services/courseService';
import classService from '../../services/classService';
import { toast } from '../../components/common/Toast';

const ROLES = [
  ['student', 'Học viên'],
  ['teacher', 'Giảng viên'],
  ['training_manager', 'Quản lý đào tạo'],
  ['admin', 'Quản trị viên']
];

const COURSE_STATUSES = [
  ['draft', 'Bản nháp', 'gray'],
  ['pending', 'Chờ duyệt', 'orange'],
  ['published', 'Đã công khai', 'green'],
  ['rejected', 'Bị từ chối', 'red']
];

const EMPTY_STATS = { roles: {}, blocked: 0, courses: {}, classes: 0 };

const totalOf = (result) => result?.meta?.totalItems ?? 0;

const formatUptime = (seconds) => {
  const total = Math.floor(Number(seconds) || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [roleResults, blocked, courseResults, classes, healthInfo] = await Promise.all([
        Promise.all(ROLES.map(([role]) => userService.getAdminUsers({ role, limit: 1 }))),
        userService.getAdminUsers({ status: 'blocked', limit: 1 }),
        Promise.all(COURSE_STATUSES.map(([status]) => courseService.list({ status, limit: 1 }))),
        classService.list({ limit: 1 }),
        api.get('/health').then(res => res.data).catch(() => null)
      ]);
      setStats({
        roles: Object.fromEntries(ROLES.map(([role], index) => [role, totalOf(roleResults[index])])),
        blocked: totalOf(blocked),
        courses: Object.fromEntries(COURSE_STATUSES.map(([status], index) => [status, totalOf(courseResults[index])])),
        classes: totalOf(classes)
      });
      setHealth(healthInfo);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải số liệu hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalUsers = ROLES.reduce((sum, [role]) => sum + (stats.roles[role] || 0), 0);
  const totalCourses = COURSE_STATUSES.reduce((sum, [status]) => sum + (stats.courses[status] || 0), 0);
  const show = (value) => (loading ? '…' : value);

  return (
    <>
      <PortalHeader
        eyebrow="SYSTEM ADMIN"
        title="Tổng quan hệ thống"
        desc="Giám sát người dùng, khóa học, lớp học và tình trạng hệ thống."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Làm mới
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard icon={Users} label="Tổng người dùng" value={show(totalUsers)} />
        <StatCard icon={BookOpen} label="Tổng khóa học" value={show(totalCourses)} />
        <StatCard icon={GraduationCap} label="Tổng lớp học" value={show(stats.classes)} />
        <StatCard icon={Lock} label="Tài khoản bị khóa" value={show(stats.blocked)} />
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionTitle
            title="Phân bổ người dùng"
            action={<Button variant="ghost" onClick={() => navigate('/admin/users')}>Quản lý người dùng</Button>}
          />
          {ROLES.map(([role, label]) => {
            const count = stats.roles[role] || 0;
            return (
              <div className="role-bar" key={role}>
                <div><b>{label}</b><span>{show(count)}</span></div>
                <Progress value={totalUsers ? Math.round((count / totalUsers) * 100) : 0} />
              </div>
            );
          })}
        </Card>

        <Card>
          <SectionTitle
            title="Khóa học theo trạng thái"
            action={<Button variant="ghost" onClick={() => navigate('/admin/courses')}>Quản lý khóa học</Button>}
          />
          {COURSE_STATUSES.map(([status, label, tone]) => (
            <div className="health-row" key={status}>
              <span>{label}</span>
              <Badge tone={tone}>{show(stats.courses[status] || 0)}</Badge>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Trạng thái hệ thống" />
        <div className="health-row">
          <span><i className={`health-dot ${health ? 'green' : ''}`} />API Server</span>
          <b>{loading ? '…' : health ? 'Đang hoạt động' : 'Không phản hồi'}</b>
        </div>
        <div className="health-row">
          <span>Môi trường</span>
          <b>{loading ? '…' : health?.environment || '—'}</b>
        </div>
        <div className="health-row">
          <span>Thời gian hoạt động liên tục</span>
          <b>{loading ? '…' : health ? formatUptime(health.uptime) : '—'}</b>
        </div>
      </Card>
    </>
  );
}