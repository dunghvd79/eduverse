import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserX, MailWarning, UserPlus, RefreshCw } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Table, Badge, LoadError } from '../../components/portal/PortalUI';
import { toast } from '../../components/common/Toast';
import dashboardService, { SERVICE_LABEL, SERVICE_STATUS, ROLE_LABEL } from '../../services/dashboardService';
import { formatDate } from '../../services/classService';
import { formatDateTime } from '../../services/quizService';

const formatUptime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
};

const userStatus = (user) => {
  if (!user.isActive) return <Badge tone="red">Bị khóa</Badge>;
  if (!user.emailVerified) return <Badge tone="orange">Chưa xác thực</Badge>;
  return <Badge tone="green">Hoạt động</Badge>;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await dashboardService.admin());
    } catch (err) {
      const message = err?.message || 'Không thể tải tổng quan hệ thống.';
      setError(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const header = (
    <PortalHeader
      title="Tổng quan hệ thống"
      desc="Giám sát người dùng và tình trạng các dịch vụ."
      actions={<Button variant="secondary" onClick={load}><RefreshCw size={15} /> Làm mới</Button>}
    />
  );

  if (error && !data) {
    return <>{header}<LoadError message={error} onRetry={load} /></>;
  }
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải tổng quan...</div></>;

  const { stats, roleDistribution, system, newestUsers } = data;
  return <>
    {header}
    <div className="stats-grid">
      <StatCard icon={Users} label="Tổng người dùng" value={stats.totalUsers} />
      <StatCard icon={UserX} label="Tài khoản bị khóa" value={stats.blockedUsers} />
      <StatCard icon={MailWarning} label="Chưa xác thực email" value={stats.unverifiedUsers} />
      <StatCard icon={UserPlus} label="Mới trong 7 ngày" value={stats.newUsersLast7Days} />
    </div>

    <div className="dashboard-grid">
      <Card>
        <SectionTitle title="Phân bổ người dùng" />
        {roleDistribution.map((item) => (
          <div className="role-bar" key={item.role}>
            <div><b>{ROLE_LABEL[item.role]}</b><span>{item.count} ({item.percentage}%)</span></div>
            <Progress value={item.percentage} />
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle title="Tình trạng hệ thống" />
        {system.services.map((service) => {
          const [label, tone] = SERVICE_STATUS[service.status] || [service.status, 'gray'];
          return (
            <div className="health-row" key={service.key}>
              <span><i className={`health-dot ${tone}`} />{SERVICE_LABEL[service.key] || service.key}</span>
              <b>{label}{Number.isFinite(service.latencyMs) ? ` · ${service.latencyMs} ms` : ''}</b>
            </div>
          );
        })}
        <p className="text-xs text-slate-500 mt-3">API đã chạy {formatUptime(system.uptimeSeconds)} · kiểm tra lúc {formatDateTime(system.checkedAt)}</p>
      </Card>
    </div>

    <Card>
      <SectionTitle title="Người dùng mới nhất" action={<Button variant="ghost" onClick={() => navigate('/admin/users')}>Quản lý người dùng</Button>} />
      <Table
        headers={['Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo']}
        rows={newestUsers.map((user) => [<b>{user.fullName}</b>, user.email, ROLE_LABEL[user.role], userStatus(user), formatDate(user.createdAt)])}
      />
    </Card>
  </>;
}
