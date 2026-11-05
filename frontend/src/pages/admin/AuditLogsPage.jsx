import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, ChevronLeft, ChevronRight, Download, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { PortalHeader, Button, StatCard, Card, Badge, LoadError } from '../../components/portal/PortalUI';
import auditLogService, { SEVERITY, AUDIT_STATUS, LOGIN_FAIL_REASON } from '../../services/auditLogService';
import { ROLE_LABEL } from '../../services/dashboardService';
import { formatDateTime } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

const EMPTY_FILTERS = { search: '', category: '', severity: '', status: '', from: '', to: '' };
const selectCls = 'h-9 rounded-lg border border-slate-200 px-2 text-sm bg-white';

// Chi tiết một dòng: trước/sau (nếu có) và các trường còn lại trong metadata
function AuditDetail({ log }) {
  const { before, after, reason, ...rest } = log.metadata || {};
  const changedKeys = before && after && typeof before === 'object'
    ? Object.keys({ ...before, ...after }).filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    : null;
  return (
    <div className="grid gap-3 md:grid-cols-2 text-sm">
      <div className="space-y-1">
        <p><span className="text-slate-500">Mã hành động:</span> <code>{log.action}</code></p>
        {log.target && <p><span className="text-slate-500">Đối tượng:</span> {log.target.type} · <code className="break-all">{log.target.id}</code></p>}
        {reason && <p><span className="text-slate-500">Lý do:</span> {LOGIN_FAIL_REASON[reason] || reason}</p>}
        <p className="break-all"><span className="text-slate-500">Trình duyệt:</span> {log.userAgent || '—'}</p>
      </div>
      <div>
        {before !== undefined && after !== undefined && (
          <table className="!min-w-0">
            <thead><tr><th>Trường</th><th>Trước</th><th>Sau</th></tr></thead>
            <tbody>
              {(changedKeys || ['giá trị']).map((key) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td className="text-red-700">{String(changedKeys ? before[key] ?? '—' : before)}</td>
                  <td className="text-emerald-700">{String(changedKeys ? after[key] ?? '—' : after)}</td>
                </tr>
              ))}
              {changedKeys?.length === 0 && <tr><td colSpan="3" className="text-slate-500">Không có trường nào thay đổi.</td></tr>}
            </tbody>
          </table>
        )}
        {Object.keys(rest).length > 0 && (
          <pre className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap break-all">{JSON.stringify(rest, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Gõ tìm kiếm: chờ 400ms mới gọi API
  useEffect(() => {
    const timer = setTimeout(() => { setKeyword(filters.search.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const query = { ...filters, search: keyword };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(await auditLogService.list({ ...query, page, limit: 20 }));
    } catch (err) {
      setError(err?.message || 'Không thể tải nhật ký hệ thống.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, filters.category, filters.severity, filters.status, filters.from, filters.to, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
    if (key !== 'search') setPage(1);
  };

  const exportCsv = async () => {
    try {
      setExporting(true);
      await auditLogService.exportCsv(query);
      toast.success('Đã xuất nhật ký (tối đa 10.000 dòng mới nhất theo bộ lọc).');
    } catch (err) {
      toast.error(err?.message || 'Không thể xuất nhật ký.');
    } finally {
      setExporting(false);
    }
  };

  const hasFilter = Object.values(filters).some(Boolean);
  const items = data?.items || [];

  return (
    <>
      <PortalHeader
        title="Nhật ký hệ thống"
        desc="Ai đã làm gì, lúc nào, từ đâu: đăng nhập, quản trị tài khoản, kiểm duyệt khóa học, sửa điểm. Nhật ký chỉ đọc, không sửa hay xóa được."
        actions={<>
          <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Làm mới</Button>
          <Button onClick={exportCsv} disabled={exporting}><Download size={16} /> {exporting ? 'Đang xuất...' : 'Xuất CSV'}</Button>
        </>}
      />

      {data && (
        <div className="stats-grid !grid-cols-1 md:!grid-cols-3">
          <StatCard icon={Activity} label="Sự kiện 24 giờ qua" value={data.summary.last24h} />
          <StatCard icon={AlertTriangle} label="Đăng nhập thất bại 24 giờ qua" value={data.summary.failedLogins24h} />
          <StatCard icon={ShieldAlert} label="Cảnh báo nghiêm trọng 24 giờ qua" value={data.summary.danger24h}
            sub="Một IP đăng nhập sai từ 10 lần trong 5 phút, xóa tài khoản" />
        </div>
      )}

      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-72">
            <Search size={15} className="text-slate-500" />
            <input value={filters.search} onChange={setFilter('search')} placeholder="Tìm email, hành động, đối tượng, IP..." className="flex-1 min-w-0 text-sm outline-none" />
          </label>
          <select value={filters.category} onChange={setFilter('category')} className={selectCls} aria-label="Nhóm">
            <option value="">Tất cả nhóm</option>
            {(data?.filters.categories || []).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filters.severity} onChange={setFilter('severity')} className={selectCls} aria-label="Mức độ">
            <option value="">Mọi mức độ</option>
            {Object.entries(SEVERITY).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.status} onChange={setFilter('status')} className={selectCls} aria-label="Kết quả">
            <option value="">Mọi kết quả</option>
            {Object.entries(AUDIT_STATUS).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">Từ
            <input type="date" value={filters.from} onChange={setFilter('from')} className={selectCls} aria-label="Từ ngày" />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">đến
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={setFilter('to')} className={selectCls} aria-label="Đến ngày" />
          </label>
          {hasFilter && <Button variant="ghost" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}>Xóa bộ lọc</Button>}
        </div>
      </Card>

      {error ? <LoadError message={error} onRetry={load} /> : (
        <Card className="!p-0">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>IP</th><th>Kết quả</th></tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">Đang tải nhật ký...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">{hasFilter ? 'Không có nhật ký phù hợp bộ lọc.' : 'Chưa có nhật ký nào.'}</td></tr>
                ) : items.map((log) => {
                  const [severityLabel, severityTone] = SEVERITY[log.severity] || [log.severity, 'gray'];
                  const [statusLabel, statusTone] = AUDIT_STATUS[log.status] || [log.status, 'gray'];
                  const open = expanded === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr
                        className={`cursor-pointer hover:bg-slate-50 ${log.severity === 'danger' ? 'bg-red-50/60' : ''}`}
                        onClick={() => setExpanded(open ? null : log.id)}
                        aria-expanded={open}
                      >
                        <td className="whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td>
                          <b className="block">{log.actor.fullName || log.actor.email || 'Không xác định'}</b>
                          <small className="text-slate-500">{log.actor.fullName ? log.actor.email : ''}{log.actor.role ? `${log.actor.fullName ? ' · ' : ''}${ROLE_LABEL[log.actor.role] || log.actor.role}` : ''}</small>
                        </td>
                        <td>
                          <b className="block">{log.actionLabel}</b>
                          <span className="inline-flex gap-1 mt-1"><Badge tone="gray">{log.categoryLabel}</Badge>{log.severity !== 'info' && <Badge tone={severityTone}>{severityLabel}</Badge>}</span>
                        </td>
                        <td className="max-w-[260px] truncate" title={log.target?.label || ''}>{log.target?.label || '—'}</td>
                        <td className="whitespace-nowrap font-mono">{log.ipAddress || '—'}</td>
                        <td><Badge tone={statusTone}>{statusLabel}</Badge></td>
                      </tr>
                      {open && <tr><td colSpan="6" className="bg-slate-50/70"><AuditDetail log={log} /></td></tr>}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 p-3 border-t border-slate-100 text-sm text-slate-500">
              Trang {data.meta.page}/{data.meta.totalPages} · {data.meta.totalItems} dòng
              <Button variant="secondary" disabled={!data.meta.hasPreviousPage || loading} onClick={() => setPage((p) => p - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
              <Button variant="secondary" disabled={!data.meta.hasNextPage || loading} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
