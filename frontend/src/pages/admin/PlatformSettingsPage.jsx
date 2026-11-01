import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { PortalHeader, Button, Card, SectionTitle, Table, Badge, LoadError } from '../../components/portal/PortalUI';
import { toast } from '../../components/common/Toast';
import adminService, {
  SERVICE_LABEL, SERVICE_STATUS, EMAIL_MODE_LABEL, SCOPE_LABEL, PURPOSE_LABEL
} from '../../services/adminService';
import { formatDateTime } from '../../services/quizService';

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} ngày ${hours} giờ`;
  return hours ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
};

const windowText = (minutes) => (minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} giờ` : `${minutes} phút`);

const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0 text-sm">
    <span className="text-slate-500">{label}</span>
    <b className="text-right text-slate-800 break-words min-w-0">{children}</b>
  </div>
);

export default function PlatformSettingsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminService.settings());
    } catch (err) {
      const message = err?.message || 'Không thể tải cấu hình hệ thống.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const header = (
    <PortalHeader
      title="Cấu hình nền tảng"
      desc="Xem cấu hình đang chạy và tình trạng các dịch vụ. Trang này chỉ để xem."
      actions={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới</Button>}
    />
  );

  if (error && !data) return <>{header}<LoadError message={error} onRetry={load} /></>;
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải cấu hình...</div></>;

  const { environment, security, storage, email, ai, system } = data;
  return (
    <>
      {header}
      <div className="security-note mb-4 flex items-start gap-2 text-sm text-slate-600">
        <ShieldCheck size={17} className="mt-0.5 shrink-0" />
        <span>Giá trị được đọc từ biến môi trường (<code>backend/.env</code> hoặc <code>docker-compose.yml</code>). Muốn đổi, sửa tệp đó trên máy chủ rồi khởi động lại backend. Khóa bí mật, mật khẩu và chuỗi kết nối không bao giờ hiển thị ở đây.</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Tình trạng dịch vụ" />
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

        <Card>
          <SectionTitle title="Môi trường chạy" />
          <Row label="Chế độ (NODE_ENV)">{environment.nodeEnv}</Row>
          <Row label="Phiên bản Node.js">{environment.nodeVersion || '—'}</Row>
          <Row label="Thời hạn Access Token">{security.accessTokenTtl}</Row>
          <Row label="Thời hạn Refresh Token">{security.refreshTokenTtl}</Row>
          <Row label="Chính sách mật khẩu">{security.passwordPolicy}</Row>
        </Card>

        <Card>
          <SectionTitle title="Lưu trữ tệp" />
          <Row label="Nơi lưu">
            {storage.provider === 's3' ? <Badge tone="green">AWS S3</Badge> : <Badge tone="orange">Thư mục cục bộ (dev/demo)</Badge>}
          </Row>
          {storage.provider === 's3' && <Row label="Region">{storage.region}</Row>}
          {storage.provider === 's3' && <Row label="Bucket">{storage.bucket}</Row>}
          <Row label="Liên kết tải lên có hiệu lực">{storage.uploadUrlExpirySeconds ? `${Math.round(storage.uploadUrlExpirySeconds / 60)} phút` : '—'}</Row>
          <div className="mt-3">
            <Table
              headers={['Loại tệp', 'Tối đa', 'Định dạng', 'Truy cập']}
              rows={storage.limits.map((l) => [
                PURPOSE_LABEL[l.purpose] || l.purpose,
                `${l.maxSizeMb} MB`,
                l.extensions.join(', '),
                l.isPublic ? 'Công khai' : 'Riêng tư'
              ])}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle title="Email và AI" />
          <Row label="Cách gửi email">{EMAIL_MODE_LABEL[email.mode] || email.mode}</Row>
          {email.smtpHost && <Row label="Máy chủ SMTP">{email.smtpHost}</Row>}
          {email.from && <Row label="Người gửi">{email.from}</Row>}
          <Row label="Gemini AI">{ai.configured ? <Badge tone="green">Đã cấu hình</Badge> : <Badge tone="gray">Chưa cấu hình</Badge>}</Row>
          {ai.configured && <Row label="Model chính">{ai.model}</Row>}
          {ai.configured && <Row label="Model dự phòng">{ai.fallbackModel || 'Không dùng'}</Row>}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Giới hạn tần suất (Rate Limit)" />
        <Table
          headers={['Thao tác', 'Tối đa', 'Trong', 'Tính theo']}
          rows={security.rateLimits.map((r) => [r.label, `${r.max} lần`, windowText(r.windowMinutes), SCOPE_LABEL[r.scope] || r.scope])}
        />
        <p className="text-xs text-slate-500 mt-3">Bộ đếm lưu trong bộ nhớ của backend nên được đặt lại khi khởi động lại. Vượt giới hạn, API trả 429.</p>
      </Card>
    </>
  );
}
