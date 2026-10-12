// <input type="datetime-local"> dùng giờ địa phương, không có múi giờ -> chuyển qua lại với ISO (UTC)
export const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

/**
 * "còn 2 ngày 3 giờ" / "quá hạn 5 giờ"
 */
export const timeLeft = (deadline, now = Date.now()) => {
  const diff = new Date(deadline).getTime() - now;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const text = days ? `${days} ngày ${hours} giờ` : hours ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
  return diff >= 0 ? `còn ${text}` : `quá hạn ${text}`;
};
