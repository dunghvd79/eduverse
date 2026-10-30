/**
 * Chữ viết tắt trên avatar: chữ đầu của từ đầu và từ cuối trong họ tên ("Hoàng Văn Dũng" -> "HD").
 * Bỏ học hàm/học vị viết tắt có dấu chấm ("ThS.", "PGS.TS."), phần trong ngoặc và ký tự không phải chữ/số,
 * nên "ThS. Nguyễn Văn An (trợ giảng)" -> "NA". Không còn chữ nào thì trả `fallback`.
 */
export const getInitials = (name, fallback = 'EV') => {
  const words = String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .filter((word) => !word.endsWith('.'))
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};
