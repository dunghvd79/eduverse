import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Edit3,
  Settings2,
  Search,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  FileWarning,
  Eye,
  MoreVertical,
  Layers,
  ChevronRight,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Tag,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Field } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import categoryService from '../../services/categoryService';
import { toast } from '../../components/common/Toast';
import { confirmModal } from '../../components/common/ConfirmModal';
import uploadService, { checkImageFile } from '../../services/uploadService';
import { useUrlSearch } from '../../utils/useUrlSearch';

const EMPTY_FORM = { title: '', description: '', price: '0', categoryId: '' };
const isEditable = (course) => course.status === 'draft' || course.status === 'rejected';
const isDeletable = (course) => course.status !== 'published';

const STATUS_CONFIG = {
  published: {
    label: 'Đã xuất bản',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
    accent: 'bg-emerald-500'
  },
  pending: {
    label: 'Chờ duyệt',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20',
    dot: 'bg-amber-500',
    icon: Clock,
    accent: 'bg-amber-500'
  },
  draft: {
    label: 'Nháp',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-400/20',
    dot: 'bg-slate-400',
    icon: Edit3,
    accent: 'bg-slate-400'
  },
  rejected: {
    label: 'Từ chối',
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    dot: 'bg-rose-500',
    icon: FileWarning,
    accent: 'bg-rose-500'
  }
};

const formatPrice = (price) => {
  const num = Number(price);
  if (!num || num <= 0) return 'Miễn phí';
  return num.toLocaleString('vi-VN') + ' đ';
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

/** Dải thẻ thống kê mini có thể click để lọc nhanh */
function QuickFilterCard({ icon: Icon, title, count, subtitle, active, onClick, tone }) {
  const tones = {
    emerald: {
      bar: 'bg-emerald-500',
      iconWrap: 'bg-emerald-50 text-emerald-600',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20'
    },
    amber: {
      bar: 'bg-amber-500',
      iconWrap: 'bg-amber-50 text-amber-600',
      activeRing: 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/20'
    },
    slate: {
      bar: 'bg-slate-400',
      iconWrap: 'bg-slate-100 text-slate-600',
      activeRing: 'ring-2 ring-slate-500 border-slate-400 bg-slate-50/20'
    },
    rose: {
      bar: 'bg-rose-500',
      iconWrap: 'bg-rose-50 text-rose-600',
      activeRing: 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/20'
    }
  };

  const theme = tones[tone] || tones.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border text-left p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
        active
          ? `${theme.activeRing} shadow-sm`
          : 'border-slate-200/80 bg-white hover:border-slate-300'
      }`}
    >
      <div className={`absolute top-0 inset-x-0 h-1 ${theme.bar}`} />
      <div className="flex items-center justify-between gap-2">
        <div className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${theme.iconWrap}`}>
          <Icon size={16} />
        </div>
        <span className="text-2xl font-black tabular-nums text-slate-900">{count}</span>
      </div>
      <div className="mt-2.5">
        <p className="m-0 text-sm font-bold text-slate-800">{title}</p>
        <p className="m-0 mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
    </button>
  );
}

/** Menu 3 chấm thao tác */
function ActionMenu({ course, onEdit, onDelete, onUnpublish, isOpen, onToggle, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        title="Tác vụ khác"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full z-50 mb-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              onEdit(course);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Settings2 size={14} className="text-slate-500" /> Sửa thông tin
          </button>

          {course.status === 'published' && onUnpublish && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                onUnpublish(course);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className="text-amber-600" /> Tạm dừng để sửa
            </button>
          )}

          {course.status === 'pending' && onUnpublish && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                onUnpublish(course);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className="text-amber-600" /> Rút yêu cầu duyệt
            </button>
          )}

          {isDeletable(course) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                onDelete(course);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 size={14} className="text-rose-500" /> Xóa khóa học
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  useUrlSearch(setSearch);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const thumbnailInputRef = useRef(null);
  const thumbnailPreview = useMemo(() => (thumbnailFile ? URL.createObjectURL(thumbnailFile) : null), [thumbnailFile]);
  useEffect(() => () => { if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); }, [thumbnailPreview]);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.list({ limit: 100, mine: true });
      setCourses(data.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    categoryService
      .list()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  const counts = useMemo(
    () => ({
      all: courses.length,
      published: courses.filter((c) => c.status === 'published').length,
      draft: courses.filter((c) => c.status === 'draft').length,
      pending: courses.filter((c) => c.status === 'pending').length,
      rejected: courses.filter((c) => c.status === 'rejected').length
    }),
    [courses]
  );

  // Lọc và Sắp xếp danh sách
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Lọc theo trạng thái
    if (status) {
      result = result.filter((c) => c.status === status);
    }

    // Lọc theo danh mục
    if (selectedCategory) {
      result = result.filter((c) => c.category?.id === selectedCategory);
    }

    // Lọc theo từ khóa tìm kiếm
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.name?.toLowerCase().includes(q)
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      if (sortBy === 'updated_desc') {
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      }
      if (sortBy === 'updated_asc') {
        return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '', 'vi');
      }
      if (sortBy === 'lessons_desc') {
        return (b.totalLessons || 0) - (a.totalLessons || 0);
      }
      return 0;
    });

    return result;
  }, [courses, status, selectedCategory, search, sortBy]);

  const openCreate = () => {
    setEditingCourse(null);
    setThumbnailFile(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setThumbnailFile(null);
    setForm({
      title: course.title || '',
      description: course.description || '',
      price: String(Number(course.price) || 0),
      categoryId: course.category?.id || ''
    });
    setShowForm(true);
  };

  const pickThumbnail = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // cho phép chọn lại đúng tệp vừa chọn
    if (!file) return;
    const invalid = checkImageFile(file, 5);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setThumbnailFile(file);
  };

  // Tải ảnh bìa (nếu có chọn) rồi gắn vào khóa học. Lỗi ảnh không làm mất việc đã lưu khóa học.
  const saveThumbnail = async (courseId) => {
    if (!thumbnailFile) return;
    try {
      const { publicUrl } = await uploadService.uploadFile(thumbnailFile, 'course_thumbnail', courseId);
      await courseService.update(courseId, { thumbnailUrl: publicUrl });
    } catch (error) {
      toast.error(`Đã lưu khóa học nhưng chưa tải được ảnh bìa: ${error?.message || 'lỗi không xác định'}`);
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 5) {
      toast.error('Tên khóa học phải có ít nhất 5 ký tự.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        categoryId: form.categoryId || null
      };

      if (editingCourse) {
        await courseService.update(editingCourse.id, payload);
        await saveThumbnail(editingCourse.id);
        toast.success('Đã cập nhật thông tin khóa học.');
        setShowForm(false);
        await loadCourses();
        return;
      }

      const data = await courseService.create(payload);
      await saveThumbnail(data.id);
      toast.success('Tạo khóa học thành công.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadCourses();
      navigate(`/teacher/courses/${data.id}/curriculum`);
    } catch (error) {
      toast.error(error?.message || (editingCourse ? 'Không thể cập nhật khóa học.' : 'Không thể tạo khóa học.'));
    } finally {
      setSaving(false);
    }
  };

  const requestApproval = async (course) => {
    try {
      await courseService.requestApproval(course.id);
      toast.success('Đã gửi khóa học tới Quản lý đào tạo.');
      loadCourses();
    } catch (error) {
      toast.error(error?.message || 'Không thể gửi duyệt.');
    }
  };

  const unpublishCourse = async (course) => {
    const isPublished = course.status === 'published';
    const ok = await confirmModal({
      title: isPublished ? 'Tạm dừng công khai khóa học?' : 'Rút yêu cầu phê duyệt?',
      message: isPublished
        ? `Chuyển khóa học "${course.title}" về Bản nháp để chỉnh sửa?`
        : `Bạn có muốn rút lại yêu cầu phê duyệt khóa học "${course.title}" và chuyển về Bản nháp?`,
      subtext: isPublished
        ? 'Khóa học sẽ tạm thời ẩn khỏi trang chủ đối với học viên mới cho đến khi bạn hoàn tất chỉnh sửa và gửi duyệt lại.'
        : 'Sau khi rút yêu cầu, bạn có thể tiếp tục bổ sung tài liệu, bài học hoặc đề thi.',
      confirmText: isPublished ? 'Chuyển về nháp' : 'Rút yêu cầu',
      cancelText: 'Giữ nguyên',
      type: 'warning'
    });

    if (!ok) return;

    try {
      await courseService.unpublish(course.id);
      toast.success(isPublished ? 'Đã chuyển về bản nháp. Bây giờ bạn có thể chỉnh sửa nội dung.' : 'Đã rút yêu cầu duyệt.');
      loadCourses();
    } catch (error) {
      toast.error(error?.message || 'Không thể chuyển khóa học về bản nháp.');
    }
  };

  const deleteCourse = async (course) => {
    const ok = await confirmModal({
      title: 'Xác nhận xóa khóa học?',
      message: `Bạn có chắc chắn muốn xóa khóa học "${course.title}"?`,
      subtext: 'Khóa học sẽ được đưa vào thùng rác và không còn hiển thị trong danh sách giảng dạy.',
      confirmText: 'Xóa khóa học',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });

    if (!ok) return;

    try {
      await courseService.remove(course.id);
      toast.success('Đã xóa khóa học.');
      loadCourses();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa khóa học.');
    }
  };

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Header Trang & Tác vụ nhanh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Khóa học của tôi
          </h1>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Tạo, quản lý cấu trúc bài giảng và theo dõi quy trình kiểm duyệt chất lượng đào tạo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" onClick={loadCourses} disabled={loading} title="Tải lại danh sách">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
          </Button>
          <Button
            onClick={openCreate}
            className="!bg-[#1168bd] !text-white shadow-sm hover:opacity-95"
          >
            <Plus size={16} /> Tạo khóa mới
          </Button>
        </div>
      </div>

      {/* 2. Dải 4 Thẻ Thống Kê Mini Lọc Nhanh (Click to Filter) */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <QuickFilterCard
          icon={CheckCircle2}
          title="Đã xuất bản"
          count={counts.published}
          subtitle="Sẵn sàng mở lớp học"
          tone="emerald"
          active={status === 'published'}
          onClick={() => setStatus(status === 'published' ? '' : 'published')}
        />
        <QuickFilterCard
          icon={Clock}
          title="Chờ duyệt"
          count={counts.pending}
          subtitle="Đang chờ xét duyệt"
          tone="amber"
          active={status === 'pending'}
          onClick={() => setStatus(status === 'pending' ? '' : 'pending')}
        />
        <QuickFilterCard
          icon={Edit3}
          title="Bản nháp"
          count={counts.draft}
          subtitle="Đang soạn giáo trình"
          tone="slate"
          active={status === 'draft'}
          onClick={() => setStatus(status === 'draft' ? '' : 'draft')}
        />
        <QuickFilterCard
          icon={FileWarning}
          title="Bị từ chối"
          count={counts.rejected}
          subtitle="Cần cập nhật lại"
          tone="rose"
          active={status === 'rejected'}
          onClick={() => setStatus(status === 'rejected' ? '' : 'rejected')}
        />
      </div>

      {/* 3. Thanh Điều Khiển Hợp Nhất (Tabs & Search/Filter Toolbar) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-4">
        {/* Hàng Tabs trạng thái */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              ['', `Tất cả (${counts.all})`],
              ['published', `Đã xuất bản (${counts.published})`],
              ['pending', `Chờ duyệt (${counts.pending})`],
              ['draft', `Nháp (${counts.draft})`],
              ['rejected', `Từ chối (${counts.rejected})`]
            ].map(([val, label]) => (
              <button
                key={val || 'all'}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  status === val
                    ? 'bg-[#1168bd] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
                onClick={() => setStatus(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Nút chuyển đổi View Mode (Grid vs List) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#1168bd] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ lưới"
            >
              <LayoutGrid size={14} /> Lưới
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#1168bd] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng danh sách bảng"
            >
              <List size={14} /> Danh sách
            </button>
          </div>
        </div>

        {/* Hàng Search Box & Dropdown Bộ Lọc */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên khóa học hoặc nội dung..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#1168bd] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bộ lọc danh mục & Sắp xếp */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#1168bd]"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#1168bd]"
            >
              <option value="updated_desc">Mới cập nhật</option>
              <option value="updated_asc">Cũ nhất</option>
              <option value="title_asc">Tên A → Z</option>
              <option value="lessons_desc">Nhiều bài học nhất</option>
            </select>

            {(search || selectedCategory || status) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setStatus('');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline px-1 py-1"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Nội dung Danh sách (Grid Mode hoặc List Mode) */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#1168bd]" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Đang tải danh sách khóa học...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-400">
            <BookOpen size={24} />
          </div>
          <h3 className="m-0 text-base font-bold text-slate-900">Không tìm thấy khóa học nào</h3>
          <p className="m-0 mt-1 text-xs text-slate-500">
            {search || selectedCategory || status
              ? 'Không có khóa học nào khớp với điều kiện tìm kiếm và bộ lọc của bạn.'
              : 'Bạn chưa tạo khóa học nào. Hãy bắt đầu xây dựng khóa học đầu tiên!'}
          </p>
          <div className="mt-5">
            <Button onClick={openCreate} className="!bg-[#1168bd] !text-white">
              <Plus size={16} /> Tạo khóa học mới ngay
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* CHẾ ĐỘ 1: THẺ LƯỚI TRỰC QUAN (GRID CARDS) */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const st = STATUS_CONFIG[course.status] || STATUS_CONFIG.draft;
            const StatusIcon = st.icon;

            return (
              <div
                key={course.id}
                className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                {/* Ảnh bìa Course Banner (16:9) */}
                <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-800 to-slate-950">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-xs">
                        <BookOpen size={22} />
                      </div>
                      <span className="text-xs font-bold text-white/90 uppercase tracking-widest line-clamp-1">
                        {course.category?.name || 'Khóa học'}
                      </span>
                    </div>
                  )}

                  {/* Badges trên ảnh */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                      {course.category?.name || 'Chưa phân loại'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${
                        course.status === 'published'
                          ? 'bg-emerald-500/90 text-white'
                          : course.status === 'pending'
                          ? 'bg-amber-500/90 text-white'
                          : course.status === 'rejected'
                          ? 'bg-rose-500/90 text-white'
                          : 'bg-slate-700/90 text-white'
                      }`}
                    >
                      <StatusIcon size={12} />
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Thân thẻ nội dung */}
                <div className="flex flex-1 flex-col p-5">
                  <h3
                    onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}
                    className="m-0 cursor-pointer text-base font-bold leading-snug text-slate-900 transition-colors line-clamp-2 hover:text-[#1168bd]"
                    title={course.title}
                  >
                    {course.title}
                  </h3>

                  <p className="m-0 mt-2 flex-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {course.description || 'Chưa có mô tả tóm tắt cho khóa học này.'}
                  </p>

                  {/* Cảnh báo lý do từ chối (nếu có) */}
                  {course.rejectionReason && (
                    <div className="mt-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200/70 text-xs text-rose-700">
                      <div className="flex items-center gap-1.5 font-bold">
                        <FileWarning size={13} /> Lý do từ chối duyệt:
                      </div>
                      <p className="m-0 mt-1 text-[11px] leading-relaxed">{course.rejectionReason}</p>
                    </div>
                  )}

                  {/* Metadata Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Layers size={13} className="text-slate-400" />
                      {course.totalLessons || 0} bài học
                    </span>
                    <span className="font-bold text-[#1168bd]">{formatPrice(course.price)}</span>
                    <span className="text-[11px] text-slate-400">Cập nhật: {formatDate(course.updatedAt)}</span>
                  </div>

                  {/* Footer Thao tác */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex flex-1 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1168bd] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        <Edit3 size={13} /> {isEditable(course) ? 'Soạn giáo trình' : 'Xem đề cương'}
                      </button>

                      {isEditable(course) && (
                        <button
                          type="button"
                          onClick={() => requestApproval(course)}
                          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1168bd] hover:border-[#1168bd] cursor-pointer"
                          title="Gửi kiểm duyệt"
                        >
                          <Send size={13} /> Gửi duyệt
                        </button>
                      )}
                    </div>

                    {/* Menu 3 chấm tác vụ phụ */}
                    <ActionMenu
                      course={course}
                      onEdit={openEdit}
                      onDelete={deleteCourse}
                      onUnpublish={unpublishCourse}
                      isOpen={menuOpenId === course.id}
                      onToggle={() => setMenuOpenId(menuOpenId === course.id ? null : course.id)}
                      onClose={() => setMenuOpenId(null)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CHẾ ĐỘ 2: BẢNG DANH SÁCH CHUYÊN NGHIỆP (RICH TABLE VIEW) */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600">
                  <th className="py-3.5 pl-6 pr-4 font-bold uppercase tracking-wider text-[11px]">Khóa học</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">Danh mục</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px] text-center">Bài học</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">Học phí</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">Cập nhật</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[11px]">Trạng thái</th>
                  <th className="py-3.5 pl-4 pr-6 font-bold uppercase tracking-wider text-[11px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((course) => {
                  const st = STATUS_CONFIG[course.status] || STATUS_CONFIG.draft;
                  const StatusIcon = st.icon;

                  return (
                    <tr key={course.id} className="transition-colors hover:bg-slate-50/60">
                      {/* Cột Khóa học (Thumbnail + Tên) */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-18 flex-none overflow-hidden rounded-lg bg-slate-800 border border-slate-200">
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-white/70">
                                <BookOpen size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-md">
                            <span
                              onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}
                              className="cursor-pointer font-bold text-slate-900 transition-colors line-clamp-1 hover:text-[#1168bd]"
                              title={course.title}
                            >
                              {course.title}
                            </span>
                            {course.rejectionReason && (
                              <p className="m-0 mt-0.5 text-[11px] text-rose-600 line-clamp-1">
                                ⚠ Lý do từ chối: {course.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột Danh mục */}
                      <td className="px-4 py-4 text-slate-600 font-medium whitespace-nowrap">
                        {course.category?.name || <span className="text-slate-400">Chưa chọn</span>}
                      </td>

                      {/* Cột Số bài học */}
                      <td className="px-4 py-4 text-center font-bold text-slate-800 whitespace-nowrap">
                        {course.totalLessons || 0}
                      </td>

                      {/* Cột Học phí */}
                      <td className="px-4 py-4 font-bold text-[#1168bd] whitespace-nowrap">
                        {formatPrice(course.price)}
                      </td>

                      {/* Cột Cập nhật */}
                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(course.updatedAt)}
                      </td>

                      {/* Cột Trạng thái */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Cột Thao tác */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#1168bd] hover:bg-[#1168bd] hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 size={13} /> {isEditable(course) ? 'Soạn' : 'Xem'}
                          </button>

                          {isEditable(course) && (
                            <button
                              type="button"
                              onClick={() => requestApproval(course)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#1168bd] transition-colors cursor-pointer"
                              title="Gửi kiểm duyệt"
                            >
                              <Send size={13} /> Gửi duyệt
                            </button>
                          )}

                          <ActionMenu
                            course={course}
                            onEdit={openEdit}
                            onDelete={deleteCourse}
                            onUnpublish={unpublishCourse}
                            isOpen={menuOpenId === course.id}
                            onToggle={() => setMenuOpenId(menuOpenId === course.id ? null : course.id)}
                            onClose={() => setMenuOpenId(null)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal Tạo / Chỉnh sửa thông tin khóa học */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <form
            onSubmit={submitForm}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="m-0 text-lg font-bold text-slate-900">
                  {editingCourse ? 'Sửa thông tin khóa học' : 'Tạo khóa học mới'}
                </h2>
                <p className="m-0 mt-0.5 text-xs text-slate-500">
                  {editingCourse ? 'Cập nhật tiêu đề, mô tả và danh mục đào tạo.' : 'Khởi tạo thông tin cơ bản trước khi soạn giáo trình.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field
                label="Tên khóa học *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: [Toán 12] Tổng ôn ma trận đề thi 2026..."
                required
              />

              <Field
                label="Mô tả khóa học"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mục tiêu đầu ra, lộ trình học và nội dung chính của khóa học..."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Danh mục đào tạo">
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#1168bd]"
                  >
                    <option value="">— Chưa chọn danh mục —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    {editingCourse?.category && !categories.some((c) => c.id === editingCourse.category.id) && (
                      <option value={editingCourse.category.id}>{editingCourse.category.name} (đang ẩn)</option>
                    )}
                  </select>
                </Field>

                <Field
                  label="Học phí niêm yết (VNĐ)"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0 (Miễn phí)"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">Ảnh bìa khóa học</span>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {thumbnailPreview || editingCourse?.thumbnailUrl ? (
                      <img src={thumbnailPreview || editingCourse.thumbnailUrl} alt="Ảnh bìa khóa học" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-slate-300"><BookOpen size={22} /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={pickThumbnail}
                    />
                    <Button type="button" variant="secondary" onClick={() => thumbnailInputRef.current?.click()}>
                      Chọn ảnh từ máy
                    </Button>
                    <p className="m-0 mt-1 truncate text-xs text-slate-500">
                      {thumbnailFile ? thumbnailFile.name : 'JPG, PNG hoặc WEBP, tối đa 5MB.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={saving} className="!bg-[#1168bd] !text-white">
                {saving ? 'Đang lưu...' : editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học & Soạn đề cương'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
