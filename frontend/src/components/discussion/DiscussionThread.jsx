import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Badge, Button } from '../portal/PortalUI';
import { toast } from '../common/Toast';
import { confirmModal } from '../common/ConfirmModal';
import discussionService, { MAX_CONTENT_LENGTH } from '../../services/discussionService';

const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();

export const formatDateTime = (value) => (value
  ? new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  : '');

const ROLE_BADGE = { teacher: ['Giảng viên', 'purple'], training_manager: ['Quản lý', 'orange'], admin: ['Admin', 'red'] };

const errorText = (error, fallback) => error?.errors?.[0] || error?.message || fallback;

/**
 * Ô nhập nội dung (câu hỏi, câu trả lời, sửa bài). Văn bản thuần, 1 - 2000 ký tự.
 */
export function ComposeBox({ placeholder, submitLabel, initialValue = '', onSubmit, onCancel, autoFocus = false, rows = 3 }) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const length = value.trim().length;
  const tooLong = value.length > MAX_CONTENT_LENGTH;
  const canSubmit = !busy && length > 0 && !tooLong;

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit(value.trim());
      setValue('');
    } catch (error) {
      toast.error(errorText(error, 'Không thể gửi nội dung.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="field">
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={MAX_CONTENT_LENGTH + 200}
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <small className={tooLong ? 'text-rose-600' : 'text-slate-500'}>{value.length}/{MAX_CONTENT_LENGTH} ký tự</small>
        <div className="flex gap-2">
          {onCancel && <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Hủy</Button>}
          <Button type="submit" disabled={!canSubmit}>{busy ? 'Đang gửi...' : submitLabel}</Button>
        </div>
      </div>
    </form>
  );
}

const AuthorLine = ({ author, createdAt, editedAt }) => {
  const [roleLabel, roleTone] = ROLE_BADGE[author?.role] || [];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="avatar sm">{initials(author?.fullName)}</div>
      <b className="text-sm">{author?.fullName || 'Người dùng đã xóa'}</b>
      {roleLabel && <Badge tone={roleTone}>{roleLabel}</Badge>}
      <small className="text-slate-500">{formatDateTime(createdAt)}{editedAt ? ' (đã chỉnh sửa)' : ''}</small>
    </div>
  );
};

/**
 * Một câu hỏi kèm các câu trả lời. Mọi thao tác xong đều gọi onChanged() để danh sách tải lại,
 * nên giao diện luôn khớp với dữ liệu và quyền (canEdit/canDelete/canResolve) do máy chủ tính.
 */
export default function DiscussionThread({ item, canReply, onChanged, lessonTitle }) {
  const [replying, setReplying] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (action, successMessage, failMessage) => {
    setBusy(true);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await onChanged();
    } catch (error) {
      toast.error(errorText(error, failMessage));
    } finally {
      setBusy(false);
    }
  };

  const toggleResolved = () => run(
    () => discussionService.resolve(item.id, !item.isResolved),
    item.isResolved ? 'Đã bỏ đánh dấu đã giải đáp.' : 'Đã đánh dấu đã giải đáp.',
    'Không thể cập nhật trạng thái.'
  );

  const remove = async (target, isQuestion) => {
    const ok = await confirmModal({
      title: isQuestion ? 'Xóa câu hỏi này?' : 'Xóa câu trả lời này?',
      message: isQuestion ? 'Câu hỏi và toàn bộ câu trả lời của nó sẽ bị xóa.' : 'Câu trả lời sẽ bị xóa.',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });
    if (!ok) return;
    await run(() => discussionService.remove(target.id), 'Đã xóa.', 'Không thể xóa bài thảo luận.');
  };

  const saveEdit = async (target, content) => {
    await discussionService.edit(target.id, content);
    setEditingId(null);
    toast.success('Đã lưu chỉnh sửa.');
    await onChanged();
  };

  const sendReply = async (content) => {
    await discussionService.reply(item.id, content);
    setReplying(false);
    toast.success('Đã gửi câu trả lời.');
    await onChanged();
  };

  const body = (target, isQuestion) => (editingId === target.id ? (
    <ComposeBox
      initialValue={target.content}
      submitLabel="Lưu"
      onSubmit={(content) => saveEdit(target, content)}
      onCancel={() => setEditingId(null)}
      autoFocus
    />
  ) : (
    <p className={`whitespace-pre-wrap break-words text-slate-700 leading-6 ${isQuestion ? '' : 'text-sm'}`}>{target.content}</p>
  ));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <AuthorLine author={item.author} createdAt={item.createdAt} editedAt={item.editedAt} />
        <div className="flex items-center gap-2">
          {lessonTitle && <Badge tone="gray">{lessonTitle}</Badge>}
          {item.isResolved && <Badge tone="green">Đã giải đáp</Badge>}
        </div>
      </div>

      {body(item, true)}

      {editingId !== item.id && (
        <div className="flex flex-wrap gap-1">
          {canReply && (
            <Button variant="ghost" onClick={() => setReplying((value) => !value)} disabled={busy}>
              <MessageSquare size={15} /> Trả lời
            </Button>
          )}
          {item.canResolve && (
            <Button variant="ghost" onClick={toggleResolved} disabled={busy}>
              {item.isResolved ? <><RotateCcw size={15} /> Bỏ đánh dấu</> : <><CheckCircle2 size={15} /> Đã giải đáp</>}
            </Button>
          )}
          {item.canEdit && <Button variant="ghost" onClick={() => setEditingId(item.id)} disabled={busy}><Pencil size={15} /> Sửa</Button>}
          {item.canDelete && <Button variant="ghost" onClick={() => remove(item, true)} disabled={busy}><Trash2 size={15} /> Xóa</Button>}
        </div>
      )}

      {item.replies?.length > 0 && (
        <div className="space-y-3 border-l-2 border-slate-100 pl-4">
          {item.replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <AuthorLine author={reply.author} createdAt={reply.createdAt} editedAt={reply.editedAt} />
              {body(reply, false)}
              {editingId !== reply.id && (reply.canEdit || reply.canDelete) && (
                <div className="flex gap-1">
                  {reply.canEdit && <Button variant="ghost" onClick={() => setEditingId(reply.id)} disabled={busy}><Pencil size={14} /> Sửa</Button>}
                  {reply.canDelete && <Button variant="ghost" onClick={() => remove(reply, false)} disabled={busy}><Trash2 size={14} /> Xóa</Button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {replying && canReply && (
        <div className="border-l-2 border-slate-100 pl-4">
          <ComposeBox
            placeholder="Viết câu trả lời..."
            submitLabel="Gửi trả lời"
            rows={2}
            onSubmit={sendReply}
            onCancel={() => setReplying(false)}
            autoFocus
          />
        </div>
      )}
    </article>
  );
}
