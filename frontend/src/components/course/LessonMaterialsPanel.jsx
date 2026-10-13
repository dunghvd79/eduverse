import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Pencil, Save, Trash2, Upload, X } from 'lucide-react';
import { Button } from '../portal/PortalUI';
import materialService, { MATERIAL_EXTENSIONS, MATERIAL_MAX_SIZE } from '../../services/materialService';
import { getFileExtension } from '../../services/uploadService';
import { toast } from '../common/Toast';

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/**
 * Tài liệu đính kèm bài học (api-uploads.md).
 * - editable = true: giảng viên thêm / đổi tên / xóa (trang Soạn đề cương, khóa học draft/rejected)
 * - editable = false: chỉ xem và tải về (trang Học, hoặc khóa học đang bị khóa chỉnh sửa)
 */
export default function LessonMaterialsPanel({ lessonId, editable = false }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setMaterials([]);
        const data = await materialService.list(lessonId);
        if (!cancelled) setMaterials(data.items || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Không thể tải danh sách tài liệu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    setEditingId(null);
    return () => { cancelled = true; };
  }, [lessonId]);

  const resetUploadForm = () => {
    setFile(null);
    setTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const chooseFile = (selected) => {
    if (!selected) return resetUploadForm();

    if (!MATERIAL_EXTENSIONS.includes(getFileExtension(selected.name))) {
      toast.error(`Chỉ hỗ trợ tệp ${MATERIAL_EXTENSIONS.join(', ')}.`);
      return resetUploadForm();
    }
    if (selected.size > MATERIAL_MAX_SIZE) {
      toast.error('Tài liệu tối đa 50MB.');
      return resetUploadForm();
    }

    setFile(selected);
    setTitle(selected.name.replace(/\.[^.]+$/, ''));
  };

  const upload = async () => {
    if (!file || uploading) return;
    if (title.trim().length < 3) {
      toast.error('Tiêu đề tài liệu phải có ít nhất 3 ký tự.');
      return;
    }

    try {
      setUploading(true);
      const created = await materialService.upload(lessonId, file, title);
      setMaterials(prev => [...prev, created]);
      resetUploadForm();
      toast.success('Đã thêm tài liệu.');
    } catch (err) {
      toast.error(err?.message || 'Không thể tải tài liệu lên.');
    } finally {
      setUploading(false);
    }
  };

  const saveTitle = async (material) => {
    if (editingTitle.trim().length < 3) {
      toast.error('Tiêu đề tài liệu phải có ít nhất 3 ký tự.');
      return;
    }

    try {
      const updated = await materialService.rename(lessonId, material.id, editingTitle);
      setMaterials(prev => prev.map(item => (item.id === material.id ? { ...item, ...updated } : item)));
      setEditingId(null);
    } catch (err) {
      toast.error(err?.message || 'Không thể đổi tên tài liệu.');
    }
  };

  const remove = async (material) => {
    if (!window.confirm(`Xóa tài liệu "${material.title}"?`)) return;

    try {
      await materialService.remove(lessonId, material.id);
      setMaterials(prev => prev.filter(item => item.id !== material.id));
      toast.success('Đã xóa tài liệu.');
    } catch (err) {
      toast.error(err?.message || 'Không thể xóa tài liệu.');
    }
  };

  const download = async (material) => {
    try {
      const { downloadUrl } = await materialService.getDownloadUrl(lessonId, material.id);
      window.location.assign(downloadUrl);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải tài liệu.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-slate-500" />
        <b>Tài liệu bài học</b>
        {materials.length > 0 && <span className="text-xs text-slate-500">({materials.length})</span>}
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Đang tải tài liệu...</p>}

      {materials.map(material => (
        <div key={material.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <FileText size={18} className="flex-shrink-0 text-slate-500" />

          {editingId === material.id ? (
            <>
              <input
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTitle(material)}
                className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                autoFocus
              />
              <Button variant="secondary" onClick={() => saveTitle(material)} aria-label="Lưu tên tài liệu"><Save size={15} /></Button>
              <Button variant="secondary" onClick={() => setEditingId(null)} aria-label="Hủy đổi tên"><X size={15} /></Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{material.title}</div>
                <small className="text-slate-500">
                  {material.fileName} · {material.fileType.toUpperCase()} · {formatSize(material.fileSize)}
                </small>
              </div>
              <Button variant="secondary" onClick={() => download(material)} aria-label="Tải tài liệu"><Download size={15} /></Button>
              {editable && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => { setEditingId(material.id); setEditingTitle(material.title); }}
                    aria-label="Đổi tên tài liệu"
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button variant="secondary" onClick={() => remove(material)} aria-label="Xóa tài liệu"><Trash2 size={15} /></Button>
                </>
              )}
            </>
          )}
        </div>
      ))}

      {!loading && !error && materials.length === 0 && (
        <p className="text-sm text-slate-500">Bài học chưa có tài liệu đính kèm.</p>
      )}

      {editable && (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={MATERIAL_EXTENSIONS.map(ext => `.${ext}`).join(',')}
            onChange={e => chooseFile(e.target.files?.[0])}
            disabled={uploading}
            className="block w-full text-sm"
          />
          {file && (
            <div className="flex gap-2">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Tiêu đề hiển thị của tài liệu"
                className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                disabled={uploading}
              />
              <Button onClick={upload} disabled={uploading}>
                <Upload size={15} /> {uploading ? 'Đang tải lên...' : 'Tải lên'}
              </Button>
            </div>
          )}
          <small className="block text-slate-500">PDF, DOCX, PPTX, ZIP, RAR · tối đa 50MB</small>
        </div>
      )}
    </div>
  );
}
