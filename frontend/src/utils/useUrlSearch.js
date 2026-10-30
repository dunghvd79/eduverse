import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Điền ô tìm kiếm của trang từ `?search=` trên URL (ô tìm kiếm ở thanh trên cùng chuyển tới trang kèm từ khóa).
 * Chạy lại khi đang đứng ở trang đó mà tìm từ khóa khác.
 */
export const useUrlSearch = (setSearch) => {
  const [params] = useSearchParams();
  const keyword = params.get('search');
  useEffect(() => {
    if (keyword !== null) setSearch(keyword);
  }, [keyword, setSearch]);
};
