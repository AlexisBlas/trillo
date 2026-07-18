import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../components/ui/utils';

export const ADMIN_PAGE_SIZE = 10;

export function useAdminPagination<T>(items: T[], resetKey?: string | number) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const start = (page - 1) * ADMIN_PAGE_SIZE;
  const pageItems = items.slice(start, start + ADMIN_PAGE_SIZE);
  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + ADMIN_PAGE_SIZE, total);

  return {
    page,
    setPage,
    pageCount,
    pageItems,
    total,
    pageSize: ADMIN_PAGE_SIZE,
    from,
    to,
  };
}

interface AdminTablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AdminTablePagination({
  page,
  pageCount,
  total,
  pageSize = ADMIN_PAGE_SIZE,
  from,
  to,
  onPageChange,
  className,
}: AdminTablePaginationProps) {
  if (total <= pageSize) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 py-3 border-t border-[#f0ede6] bg-[#fafaf8]',
        className
      )}
    >
      <p className="text-[12px] text-[#687588]">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="size-8 flex items-center justify-center rounded-[8px] border border-[#e5e0d5] bg-white text-[#374151] hover:border-[#2c4a1e] hover:text-[#2c4a1e] disabled:opacity-40 disabled:hover:border-[#e5e0d5] disabled:hover:text-[#374151] transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[72px] text-center text-[12px] font-bold text-[#374151] tabular-nums">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="size-8 flex items-center justify-center rounded-[8px] border border-[#e5e0d5] bg-white text-[#374151] hover:border-[#2c4a1e] hover:text-[#2c4a1e] disabled:opacity-40 disabled:hover:border-[#e5e0d5] disabled:hover:text-[#374151] transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
