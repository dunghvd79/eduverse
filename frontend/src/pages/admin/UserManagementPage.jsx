import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  Copy,
  Check,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { PortalHeader, Button, Card, Badge } from '../../components/portal/PortalUI';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/useAuthStore';

export default function UserManagementPage() {
  const currentAdmin = useAuthStore((state) => state.user);

  // Filter & Pagination States
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Notification Toast
  const [toast, setToast] = useState({ type: '', message: '' });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    role: 'teacher',
    phoneNumber: '',
    password: ''
  });
  const [createdTempPassword, setCreatedTempPassword] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Lock / Unlock Modal
  const [lockModal, setLockModal] = useState({ isOpen: false, user: null, reason: '', isLocking: true });
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Reset Password Modal
  const [resetModal, setResetModal] = useState({ isOpen: false, user: null, newTempPassword: null });
  const [isResetting, setIsResetting] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy helper
  const [copied, setCopied] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setMeta((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: meta.page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await userService.getAdminUsers(params);
      if (res) {
        setUsers(res.items || []);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      showToast('error', err?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [meta.page, roleFilter, statusFilter, debouncedSearch]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const payload = {
        fullName: createUserForm.fullName.trim(),
        email: createUserForm.email.trim(),
        role: createUserForm.role,
        phoneNumber: createUserForm.phoneNumber.trim() || undefined,
        password: createUserForm.password ? createUserForm.password.trim() : undefined
      };

      const res = await userService.adminCreateUser(payload);
      setCreatedTempPassword(res.tempPassword);
      showToast('success', 'Đã khởi tạo tài khoản người dùng thành công!');
      fetchUsers();
    } catch (err) {
      showToast('error', err?.message || 'Khởi tạo tài khoản thất bại.');
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Handle Lock / Unlock
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!lockModal.user) return;

    if (lockModal.isLocking && !lockModal.reason.trim()) {
      showToast('error', 'Vui lòng cung cấp lý do khi khóa tài khoản.');
      return;
    }

    setIsSubmittingStatus(true);
    try {
      await userService.adminUpdateStatus(lockModal.user.id, {
        isActive: !lockModal.isLocking,
        reason: lockModal.isLocking ? lockModal.reason.trim() : null
      });

      showToast(
        'success',
        lockModal.isLocking ? 'Đã khóa tài khoản người dùng thành công.' : 'Đã mở khóa tài khoản thành công.'
      );
      setLockModal({ isOpen: false, user: null, reason: '', isLocking: true });
      fetchUsers();
    } catch (err) {
      showToast('error', err?.message || 'Thao tác cập nhật trạng thái thất bại.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // 3. Handle Reset Password
  const handleResetPassword = async () => {
    if (!resetModal.user) return;
    setIsResetting(true);
    try {
      const res = await userService.adminResetPassword(resetModal.user.id);
      setResetModal((prev) => ({ ...prev, newTempPassword: res.tempPassword }));
      showToast('success', 'Đã đặt lại mật khẩu khẩn cấp thành công!');
    } catch (err) {
      showToast('error', err?.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsResetting(false);
    }
  };

  // 4. Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    try {
      await userService.adminDeleteUser(deleteModal.user.id);
      showToast('success', 'Đã xóa mềm tài khoản người dùng khỏi hệ thống.');
      setDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      showToast('error', err?.message || 'Xóa tài khoản thất bại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge tone="purple">Admin</Badge>;
      case 'training_manager':
        return <Badge tone="orange">Quản lý</Badge>;
      case 'teacher':
        return <Badge tone="blue">Giảng viên</Badge>;
      default:
        return <Badge tone="green">Học viên</Badge>;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'EV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <PortalHeader
        eyebrow="QUẢN TRỊ TOÀN TRƯỜNG & RBAC"
        title="Quản lý Người Dùng"
        desc="Quản lý tài khoản, phân cấp vai trò hệ thống và giám sát quyền truy cập của cán bộ, giảng viên và sinh viên."
        actions={
          <Button onClick={() => { setShowCreateModal(true); setCreatedTempPassword(null); }}>
            <UserPlus size={17} /> Tạo tài khoản
          </Button>
        }
      />

      {/* Floating Toast Notification */}
      {toast.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filter-bar flex-wrap gap-3">
        <div className="tabs flex-wrap">
          <button
            type="button"
            className={`tab ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('all'); setMeta((m) => ({ ...m, page: 1 })); }}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`tab ${roleFilter === 'student' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('student'); setMeta((m) => ({ ...m, page: 1 })); }}
          >
            Học viên
          </button>
          <button
            type="button"
            className={`tab ${roleFilter === 'teacher' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('teacher'); setMeta((m) => ({ ...m, page: 1 })); }}
          >
            Giảng viên
          </button>
          <button
            type="button"
            className={`tab ${roleFilter === 'training_manager' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('training_manager'); setMeta((m) => ({ ...m, page: 1 })); }}
          >
            Quản lý đào tạo
          </button>
          <button
            type="button"
            className={`tab ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => { setRoleFilter('admin'); setMeta((m) => ({ ...m, page: 1 })); }}
          >
            Admin
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-600 outline-none focus:border-blue-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="blocked">Đã bị khóa</option>
          </select>

          {/* Search Box */}
          <div className="search-mini">
            <Search size={16} />
            <input
              placeholder="Tìm họ tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 p-0 border-0 bg-transparent cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            title="Làm mới danh sách"
            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Users Table Card */}
      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-primary" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="m-0 font-medium">Không tìm thấy người dùng nào phù hợp</p>
                    <small>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò.</small>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  const isBlocked = !u.isActive;

                  return (
                    <tr key={u.id} className={isBlocked ? 'bg-red-50/30' : ''}>
                      <td>
                        <div className="table-user">
                          <div className="avatar sm overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(u.fullName)
                            )}
                          </div>
                          <div>
                            <b className="text-slate-800 font-semibold">{u.fullName}</b>
                            {isSelf && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1.5">
                                Bạn
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600 font-mono text-xs">{u.email}</td>
                      <td className="text-slate-500">{u.phoneNumber || '—'}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {u.isActive ? (
                          <Badge tone="green">Hoạt động</Badge>
                        ) : (
                          <div className="inline-flex flex-col">
                            <Badge tone="red">Đã khóa</Badge>
                            {u.blockReason && (
                              <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={u.blockReason}>
                                {u.blockReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="text-slate-400 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Lock / Unlock Button */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() =>
                              setLockModal({
                                isOpen: true,
                                user: u,
                                reason: '',
                                isLocking: u.isActive
                              })
                            }
                            className={`p-1.5 rounded border-0 cursor-pointer transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed'
                                : u.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isSelf ? 'Không thể khóa chính mình' : u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>

                          {/* Emergency Reset Password */}
                          <button
                            type="button"
                            onClick={() => setResetModal({ isOpen: true, user: u, newTempPassword: null })}
                            className="p-1.5 rounded border-0 text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Đặt lại mật khẩu khẩn cấp"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Soft Delete User */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteModal({ isOpen: true, user: u })}
                            className={`p-1.5 rounded border-0 transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed'
                                : 'text-red-500 hover:bg-red-50 cursor-pointer'
                            }`}
                            title={isSelf ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Hiển thị <b>{users.length}</b> / <b>{meta.totalItems}</b> người dùng (Trang <b>{meta.page}</b> /{' '}
            <b>{meta.totalPages}</b>)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!meta.hasPreviousPage || loading}
              onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
              className="p-1.5 px-3 rounded border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <span className="px-2 font-bold text-slate-700">{meta.page}</span>
            <button
              type="button"
              disabled={!meta.hasNextPage || loading}
              onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
              className="p-1.5 px-3 rounded border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"
            >
              Tiếp <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Card>

      {/* =========================================
          MODAL 1: TẠO TÀI KHOẢN MỚI
      ========================================= */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal max-w-[500px]">
            <div className="modal-head">
              <h2>Tạo tài khoản mới</h2>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            {createdTempPassword ? (
              <div className="py-2">
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 size={20} className="flex-shrink-0" />
                  <div>
                    <b>Khởi tạo tài khoản thành công!</b>
                    <p className="text-xs m-0 mt-0.5">
                      Vui lòng sao chép mật khẩu tạm thời dưới đây để cung cấp cho người dùng:
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-sm mb-5">
                  <span className="font-bold text-blue-600">{createdTempPassword}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdTempPassword)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 px-2.5 py-1 bg-white rounded border border-slate-200 cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                <div className="modal-actions">
                  <Button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedTempPassword(null);
                      setCreateUserForm({ fullName: '', email: '', role: 'teacher', phoneNumber: '', password: '' });
                    }}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                <p className="text-xs text-slate-500 -mt-2 mb-4">
                  Cấp tài khoản cho Giảng viên, Quản lý đào tạo, Quản trị viên hoặc Học viên mới.
                </p>

                <label className="field">
                  <span>Họ và tên *</span>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: TS. Nguyễn Văn A"
                    value={createUserForm.fullName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Địa chỉ Email *</span>
                  <input
                    type="email"
                    required
                    placeholder="user@eduverse.vn"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  />
                </label>

                <div className="form-grid">
                  <label className="field">
                    <span>Vai trò phân quyền *</span>
                    <select
                      value={createUserForm.role}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                    >
                      <option value="teacher">Giảng viên (Teacher)</option>
                      <option value="training_manager">Quản lý đào tạo (Manager)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                      <option value="student">Học viên (Student)</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Số điện thoại (Tùy chọn)</span>
                    <input
                      type="text"
                      placeholder="0987654321"
                      value={createUserForm.phoneNumber}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, phoneNumber: e.target.value })}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Mật khẩu ban đầu (Để trống nếu muốn tự động sinh ngẫu nhiên)</span>
                  <input
                    type="password"
                    placeholder="Để trống sẽ tự sinh mật khẩu an toàn..."
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  />
                </label>

                <div className="modal-actions">
                  <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: KHÓA / MỞ KHÓA TÀI KHOẢN
      ========================================= */}
      {lockModal.isOpen && lockModal.user && (
        <div className="modal-backdrop">
          <div className="modal max-w-[460px]">
            <div className="modal-head">
              <h2>{lockModal.isLocking ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản'}</h2>
              <button onClick={() => setLockModal({ isOpen: false, user: null, reason: '', isLocking: true })}>×</button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              {lockModal.isLocking ? (
                <>
                  <p className="text-xs text-slate-500 -mt-2 mb-3">
                    Khi khóa tài khoản của <b>{lockModal.user.fullName}</b> ({lockModal.user.email}), người dùng này sẽ lập tức bị đăng xuất khỏi tất cả các thiết bị và không thể đăng nhập.
                  </p>
                  <label className="field">
                    <span>Lý do vi phạm / khóa tài khoản *</span>
                    <textarea
                      rows={3}
                      required
                      placeholder="Nhập lý do cụ thể (Ví dụ: Gian lận thi cử, phát tán nội dung spam...)"
                      value={lockModal.reason}
                      onChange={(e) => setLockModal({ ...lockModal, reason: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <p className="text-sm text-slate-600 my-4">
                  Bạn có chắc chắn muốn mở khóa tài khoản cho <b>{lockModal.user.fullName}</b> ({lockModal.user.email})? Người dùng sẽ có thể đăng nhập lại bình thường.
                </p>
              )}

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setLockModal({ isOpen: false, user: null, reason: '', isLocking: true })}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className={lockModal.isLocking ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {isSubmittingStatus
                    ? 'Đang xử lý...'
                    : lockModal.isLocking
                    ? 'Xác nhận khóa'
                    : 'Xác nhận mở khóa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: ĐẶT LẠI MẬT KHẨU KHẨN CẤP
      ========================================= */}
      {resetModal.isOpen && resetModal.user && (
        <div className="modal-backdrop">
          <div className="modal max-w-[460px]">
            <div className="modal-head">
              <h2>Đặt lại mật khẩu khẩn cấp</h2>
              <button onClick={() => setResetModal({ isOpen: false, user: null, newTempPassword: null })}>×</button>
            </div>

            {resetModal.newTempPassword ? (
              <div className="py-2">
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 size={20} className="flex-shrink-0" />
                  <div>
                    <b>Mật khẩu mới đã được tạo!</b>
                    <p className="text-xs m-0 mt-0.5">
                      Cung cấp mật khẩu tạm này cho người dùng để họ đăng nhập và đổi mật khẩu mới:
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-sm mb-5">
                  <span className="font-bold text-blue-600">{resetModal.newTempPassword}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(resetModal.newTempPassword)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 px-2.5 py-1 bg-white rounded border border-slate-200 cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>

                <div className="modal-actions">
                  <Button onClick={() => setResetModal({ isOpen: false, user: null, newTempPassword: null })}>
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-600 my-3 leading-relaxed">
                  Hệ thống sẽ sinh mật khẩu ngẫu nhiên mới cho tài khoản <b>{resetModal.user.fullName}</b> ({resetModal.user.email}) và thu hồi mọi phiên đăng nhập cũ của người dùng này.
                </p>

                <div className="modal-actions">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setResetModal({ isOpen: false, user: null, newTempPassword: null })}
                  >
                    Hủy
                  </Button>
                  <Button type="button" disabled={isResetting} onClick={handleResetPassword}>
                    {isResetting ? 'Đang tạo mật khẩu...' : 'Xác nhận đặt lại'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 4: XÁC NHẬN XÓA MỀM TÀI KHOẢN
      ========================================= */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="modal-backdrop">
          <div className="modal max-w-[460px]">
            <div className="modal-head">
              <h2>Xác nhận xóa tài khoản</h2>
              <button onClick={() => setDeleteModal({ isOpen: false, user: null })}>×</button>
            </div>

            <div className="py-2">
              <div className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <b>Hành động này sẽ xóa mềm tài khoản!</b>
                  <p className="text-xs m-0 mt-1 leading-relaxed">
                    Tài khoản <b>{deleteModal.user.fullName}</b> ({deleteModal.user.email}) sẽ bị vô hiệu hóa hoàn toàn khỏi danh sách đăng nhập. Toàn bộ lịch sử điểm số và bài thi của người dùng vẫn được bảo lưu an toàn trong CSDL.
                  </p>
                </div>
              </div>

              <div className="modal-actions">
                <Button variant="secondary" type="button" onClick={() => setDeleteModal({ isOpen: false, user: null })}>
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa tài khoản'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
