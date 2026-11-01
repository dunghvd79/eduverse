import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, ScrollText, X } from 'lucide-react';
import { PortalHeader, Button, Card, Badge, LoadError } from '../../components/portal/PortalUI';
import { toast } from '../../components/common/Toast';
import adminService, { RESULT_LABEL, CATEGORY_TONE } from '../../services/adminService';
import { ROLE_LABEL } from '../../services/dashboardService';
import { formatDateTime } from '../../services/quizService';

const PAGE_SIZE = 20;
const SELECT_CLASS = 'text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 outline-none focus:border-blue-400';
const DATE_CLASS = 'text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 outline-none focus:border-blue-400';

// Ngày chọn trên giao diện (giờ địa phương) -> thời điểm ISO gửi lên server
const startOfDay = (value) => (value ? new Date(`${value}T00:00:00`).toISOString() : undefined);
const endOfDay = (value) => (value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined);

const detailText = (metadata) => {
  if (!metadata) return '';
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(' · ');
};

export default function AuditLogsPage() {
  const [catalog, setCatalog] = useState({ categories: [], actions: [] });
  const [filters, setFilters] = useState({ category: '', action: '', result: '', from: '', to: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminService.auditActions().then(setCatalog).catch(() => { /* bộ lọc hành động chỉ mất danh sách, bảng vẫn dùng được */ });
  }, []);

  // Gõ xong 350ms mới tìm, tránh gọi API mỗi phím
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchTerm.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const query = useMemo(() => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.action) params.action = filters.action;
    if (filters.result) params.result = filters.result;
    if (search) params.search = search;
    if (filters.from) params.from = startOfDay(filters.from);
    if (filters.to) params.to = endOfDay(filters.to);
    return params;
  }, [filters, search]);

  const dateRangeInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);

  const load = useCallback(async () => {
    if (dateRangeInvalid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await adminService.auditLogs({ ...query, page, limit: PAGE_SIZE }));
    } catch (err) {
      const message = err?.message || 'Không thể tải nhật ký hệ thống.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [query, page, dateRangeInvalid]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === 'category' ? { action: '' } : {}) }));
    setPage(1);
  };

  const visibleActions = catalog.actions.filter((a) => !filters.category || a.category === filters.category);

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminService.exportAuditLogs(query);
      toast.success('Đã tải tệp CSV (tối đa 5.000 dòng mới nhất theo bộ lọc hiện tại).');
      load();
    } catch (err) {
      toast.error(err?.message || 'Không thể xuất nhật ký hệ thống.');
    } finally {
      setExporting(false);
    }
  };

  const header = (
    <PortalHeader
      title="Nhật ký hệ thống"
      desc="Lịch sử đăng nhập và các thao tác nhạy cảm (quản lý tài khoản, duyệt khóa học). Chỉ thêm, không sửa hay xóa."
      actions={
        <>
          <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới</Button>
          <Button variant="secondary" onClick={handleExport} disabled={exporting || dateRangeInvalid}><Download size={16} /> {exporting ? 'Đang xuất...' : 'Xuất CSV'}</Button>
        </>
      }
    />
  );

  const items = data?.items || [];
  const meta = data?.meta;

  return (
    <>
      {header}
      <div className="filter-bar flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select aria-label="Nhóm hành động" className={SELECT_CLASS} value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">Tất cả nhóm</option>
            {catalog.categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select aria-label="Hành động" className={SELECT_CLASS} value={filters.action} onChange={(e) => setFilter('action', e.target.value)}>
            <option value="">Tất cả hành động</option>
            {visibleActions.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
          <select aria-label="Kết quả" className={SELECT_CLASS} value={filters.result} onChange={(e) => setFilter('result', e.target.value)}>
            <option value="">Mọi kết quả</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Từ <input type="date" className={DATE_CLASS} value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter('from', e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            Đến <input type="date" className={DATE_CLASS} value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} />
          </label>
        </div>
        <div className="search-mini">
          <Search size={16} />
          <input placeholder="Tìm email, mã đối tượng, IP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <button type="button" aria-label="Xóa từ khóa" onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-600 p-0 border-0 bg-transparent cursor-pointer"><X size={14} /></button>
          )}
        </div>
      </div>

      {dateRangeInvalid && <p className="text-xs text-red-600 mb-3">Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.</p>}

      {error && !data ? (
        <LoadError message={error} onRetry={load} />
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>Địa chỉ IP</th>
                  <th>Kết quả</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500">Đang tải nhật ký...</td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <ScrollText size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="m-0 font-medium">Không có bản ghi nào phù hợp</p>
                      <small>Hãy nới bộ lọc hoặc khoảng thời gian.</small>
                    </td>
                  </tr>
                ) : items.map((log) => {
                  const [resultLabel, resultTone] = RESULT_LABEL[log.result] || [log.result, 'gray'];
                  const detail = detailText(log.metadata);
                  return (
                    <tr key={log.id}>
                      <td className="text-xs text-slate-600 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td>
                        <div className="font-mono text-xs text-slate-700 break-all">{log.actor.email || '—'}</div>
                        {log.actor.role && <small className="text-slate-500">{ROLE_LABEL[log.actor.role] || log.actor.role}</small>}
                      </td>
                      <td>
                        <Badge tone={CATEGORY_TONE[log.category] || 'gray'}>{log.actionLabel}</Badge>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">{log.action}</div>
                      </td>
                      <td className="text-xs text-slate-600">
                        {log.resourceType ? <><b>{log.resourceType}</b>{log.resourceId && <div className="font-mono text-[11px] text-slate-500 break-all">{log.resourceId}</div>}</> : '—'}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{log.ip || '—'}</td>
                      <td><Badge tone={resultTone}>{resultLabel}</Badge></td>
                      <td className="text-xs text-slate-600 max-w-[260px]">
                        {detail ? <span title={detail} className="line-clamp-2 break-words">{detail}</span> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div>Hiển thị <b>{items.length}</b> / <b>{meta.totalItems}</b> bản ghi (Trang <b>{meta.page}</b> / <b>{meta.totalPages}</b>)</div>
              <div className="flex items-center gap-1.5">
                <button type="button" disabled={!meta.hasPreviousPage || loading} onClick={() => setPage((p) => p - 1)} className="p-1.5 px-3 rounded border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"><ChevronLeft size={14} /> Trước</button>
                <span className="px-2 font-bold text-slate-700">{meta.page}</span>
                <button type="button" disabled={!meta.hasNextPage || loading} onClick={() => setPage((p) => p + 1)} className="p-1.5 px-3 rounded border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1">Tiếp <ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
