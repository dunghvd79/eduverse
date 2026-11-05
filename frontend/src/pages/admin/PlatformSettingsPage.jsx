import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, RefreshCw, Save } from 'lucide-react';
import { PortalHeader, Button, Card, SectionTitle, Badge, LoadError } from '../../components/portal/PortalUI';
import settingsService, {
  SERVICE_LABEL, SERVICE_STATUS, UPLOAD_PURPOSE_LABEL, LIMIT_SCOPE_LABEL, ANNOUNCEMENT_TONE
} from '../../services/settingsService';
import { formatDateTime } from '../../services/quizService';
import { confirmModal } from '../../components/common/ConfirmModal';
import { toast } from '../../components/common/Toast';

const MESSAGE_MAX = 300;

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days ? `${days} ngày ${hours} giờ` : hours ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
};

const windowText = (minutes) => (minutes >= 60 ? `${minutes / 60} giờ` : `${minutes} phút`);

const UpdatedNote = ({ meta }) => (
  <small className="block text-xs text-slate-500">
    {meta?.updatedAt ? `Đổi lần cuối ${formatDateTime(meta.updatedAt)}${meta.updatedBy ? ` bởi ${meta.updatedBy}` : ''}` : 'Đang dùng giá trị mặc định'}
  </small>
);

export default function PlatformSettingsPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await settingsService.getAdmin();
      setData(result);
      setForm(result.settings);
    } catch (err) {
      setError(err?.message || 'Không thể tải cài đặt hệ thống.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Chỉ gửi những khóa đã đổi
  const patch = useMemo(() => {
    if (!data || !form) return {};
    const changes = {};
    if (form.allowSelfRegistration !== data.settings.allowSelfRegistration) changes.allowSelfRegistration = form.allowSelfRegistration;
    if (JSON.stringify(form.announcement) !== JSON.stringify(data.settings.announcement)) changes.announcement = form.announcement;
    return changes;
  }, [data, form]);
  const dirty = Object.keys(patch).length > 0;

  const setAnnouncement = (changes) => setForm((prev) => ({ ...prev, announcement: { ...prev.announcement, ...changes } }));

  const save = async () => {
    if (form.announcement.enabled && !form.announcement.message.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo trước khi bật hiển thị.');
      return;
    }
    if (patch.allowSelfRegistration === false) {
      const ok = await confirmModal({
        title: 'Tạm ngừng nhận đăng ký?',
        message: 'Học viên mới sẽ không tự tạo được tài khoản cho tới khi bạn bật lại.',
        subtext: 'Tài khoản đã có vẫn đăng nhập bình thường. Admin vẫn tạo tài khoản được ở trang Người dùng.',
        confirmText: 'Tạm ngừng đăng ký',
        cancelText: 'Giữ nguyên',
        type: 'warning'
      });
      if (!ok) return;
    }
    try {
      setSaving(true);
      await settingsService.update(patch);
      toast.success('Đã lưu cài đặt. Thay đổi được ghi vào Nhật ký hệ thống.');
      await load();
    } catch (err) {
      toast.error(err?.errors?.[0] || err?.message || 'Không thể lưu cài đặt.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <><PortalHeader title="Cài đặt hệ thống" /><LoadError message={error} onRetry={load} /></>;
  if (!data || !form) return <div className="p-10 text-center text-slate-500">Đang tải cài đặt hệ thống...</div>;

  const { status, policies, settingsMeta } = data;
  const [, previewCls] = ANNOUNCEMENT_TONE[form.announcement.tone] || ANNOUNCEMENT_TONE.info;

  return (
    <>
      <PortalHeader
        title="Cài đặt hệ thống"
        desc="Tình trạng các dịch vụ, chính sách vận hành đang áp dụng và các cài đặt nghiệp vụ Admin được đổi."
        actions={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Làm mới</Button>}
      />

      {/* A. Tình trạng hệ thống */}
      <Card>
        <SectionTitle
          title="Tình trạng hệ thống"
          action={<small className="text-xs text-slate-500">Kiểm tra lúc {formatDateTime(status.checkedAt)}</small>}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {status.services.map((service) => {
            const [label, tone] = SERVICE_STATUS[service.status] || [service.status, 'gray'];
            return (
              <div key={service.key} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm">{SERVICE_LABEL[service.key] || service.key}</b>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <p className="mt-1.5 mb-0 text-xs text-slate-500 break-words">{service.detail || '—'}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 mb-0 text-xs text-slate-500">
          Phiên bản {status.app.version || '—'} · Môi trường <b>{status.app.environment}</b> · Node.js {status.app.nodeVersion} · Đã chạy liên tục {formatUptime(status.uptimeSeconds)}
        </p>
      </Card>

      {/* C. Cài đặt nghiệp vụ (sửa được) */}
      <Card>
        <SectionTitle
          title="Cài đặt nghiệp vụ"
          action={<Button onClick={save} disabled={!dirty || saving}><Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>}
        />
        <div className="space-y-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.allowSelfRegistration}
              onChange={(e) => setForm((prev) => ({ ...prev, allowSelfRegistration: e.target.checked }))}
            />
            <span>
              <b className="block text-sm">Cho phép học viên tự đăng ký tài khoản</b>
              <small className="block text-xs text-slate-500">
                Tắt khi muốn tạm ngừng nhận học viên mới: trang Đăng ký hiện thông báo và API đăng ký trả lỗi 403. Tài khoản đã có không bị ảnh hưởng.
              </small>
              <UpdatedNote meta={settingsMeta.allowSelfRegistration} />
            </span>
          </label>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4" checked={form.announcement.enabled} onChange={(e) => setAnnouncement({ enabled: e.target.checked })} />
              <span>
                <b className="block text-sm">Hiển thị thông báo toàn hệ thống</b>
                <small className="block text-xs text-slate-500">Dải thông báo ở đầu mọi trang (trang công khai và 4 cổng). Dùng để báo lịch bảo trì, nghỉ lễ...</small>
                <UpdatedNote meta={settingsMeta.announcement} />
              </span>
            </label>
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="field !mb-0">
                <span>Nội dung ({form.announcement.message.length}/{MESSAGE_MAX})</span>
                <textarea
                  rows="2"
                  maxLength={MESSAGE_MAX}
                  value={form.announcement.message}
                  onChange={(e) => setAnnouncement({ message: e.target.value })}
                  placeholder="VD: Hệ thống bảo trì từ 22:00 đến 23:00 ngày 05/11/2026, vui lòng lưu bài trước thời gian này."
                />
              </label>
              <label className="field !mb-0">
                <span>Kiểu</span>
                <select value={form.announcement.tone} onChange={(e) => setAnnouncement({ tone: e.target.value })}>
                  {Object.entries(ANNOUNCEMENT_TONE).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            {form.announcement.message.trim() && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${previewCls}`}>
                <small className="block text-xs opacity-80">Xem trước{form.announcement.enabled ? '' : ' (đang tắt, người dùng chưa thấy)'}</small>
                <b>{ANNOUNCEMENT_TONE[form.announcement.tone]?.[0]}:</b> {form.announcement.message.trim()}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* B. Chính sách vận hành (chỉ xem) */}
      <Card>
        <SectionTitle title="Chính sách vận hành (chỉ xem)" />
        <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 mt-0">
          <KeyRound size={15} className="mt-0.5 flex-none" />
          <span>
            Các giá trị dưới đây và khóa bí mật (S3, SMTP, JWT, Gemini) được quản lý bằng biến môi trường / mã nguồn, không hiển thị và không sửa trên web.
            Muốn đổi: sửa <code>backend/.env</code> (hoặc mã nguồn ở cột "Nguồn") rồi khởi động lại backend.
          </span>
        </p>

        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold mb-2">Phiên đăng nhập &amp; bảo mật</h3>
            <div className="table-wrap"><table className="!min-w-0">
              <thead><tr><th>Chính sách</th><th>Giá trị</th><th>Nguồn</th></tr></thead>
              <tbody>{policies.session.map((p) => <tr key={p.label}><td>{p.label}</td><td><b>{p.value}</b></td><td><code>{p.source}</code></td></tr>)}</tbody>
            </table></div>

            <h3 className="text-sm font-bold mt-5 mb-2">Giới hạn tải tệp</h3>
            <div className="table-wrap"><table className="!min-w-0">
              <thead><tr><th>Loại tệp</th><th>Tối đa</th><th>Định dạng</th></tr></thead>
              <tbody>{policies.uploads.map((u) => (
                <tr key={u.purpose}>
                  <td>{UPLOAD_PURPOSE_LABEL[u.purpose] || u.purpose}{u.maxSizeMbLimit && <small className="block text-xs text-slate-500">GV đặt theo từng đề, tối đa {u.maxSizeMbLimit}MB</small>}</td>
                  <td><b>{u.maxSizeMb}MB</b></td>
                  <td>{u.extensions.join(', ')}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Giới hạn tần suất (chống spam, dò mật khẩu)</h3>
            <div className="table-wrap"><table className="!min-w-0">
              <thead><tr><th>Hành động</th><th>Giới hạn</th></tr></thead>
              <tbody>{policies.rateLimits.map((r) => (
                <tr key={r.label}><td>{r.label}</td><td><b>{r.max} lần / {windowText(r.windowMinutes)}</b> <small className="text-xs text-slate-500">{LIMIT_SCOPE_LABEL[r.scope] || ''}</small></td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </div>
      </Card>
    </>
  );
}
