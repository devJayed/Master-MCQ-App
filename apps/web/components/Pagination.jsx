'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZES = [10, 20, 30, 40, 50];

function pageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((item) => item > 0 && item <= totalPages).sort((a, b) => a - b);
  const items = [];

  sorted.forEach((item, index) => {
    if (index && item - sorted[index - 1] > 1) items.push(`ellipsis-${item}`);
    items.push(item);
  });

  return items;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  language = 'en',
  disabled = false,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const bn = language === 'bn';

  return (
    <nav
      className="flex flex-col gap-4 border-t border-base-300 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
      aria-label={bn ? 'পাতা নেভিগেশন' : 'Pagination'}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-base-content/65">
        <span aria-live="polite">
          {bn ? `${total}টির মধ্যে ${start}–${end} দেখানো হচ্ছে` : `Showing ${start}–${end} of ${total}`}
        </span>
        <label className="flex items-center gap-2">
          <span>{bn ? 'প্রতি পাতায়' : 'Rows per page'}</span>
          <select
            className="select select-bordered select-sm w-20"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            disabled={disabled}
            aria-label={bn ? 'প্রতি পাতায় ফলাফলের সংখ্যা' : 'Results per page'}
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm text-base-content/65 sm:hidden">
          {bn ? `পাতা ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
        </span>
        <div className="join" role="group" aria-label={bn ? 'পাতা বেছে নিন' : 'Choose a page'}>
          <button
            type="button"
            className="btn btn-sm join-item px-3"
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            aria-label={bn ? 'আগের পাতা' : 'Previous page'}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="hidden sm:contents">
            {pageItems(page, totalPages).map((item) =>
              typeof item === 'number' ? (
                <button
                  type="button"
                  key={item}
                  className={`btn btn-sm join-item min-w-10 ${item === page ? 'btn-primary' : ''}`}
                  onClick={() => onPageChange(item)}
                  disabled={disabled}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={bn ? `পাতা ${item}` : `Page ${item}`}
                >
                  {item}
                </button>
              ) : (
                <span key={item} className="btn btn-sm join-item pointer-events-none min-w-10 px-2" aria-hidden="true">…</span>
              )
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm join-item px-3"
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
            aria-label={bn ? 'পরের পাতা' : 'Next page'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
