import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel,
  previousLabel,
  nextLabel,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = new Set<number>([1, totalPages]);
  for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) {
    visiblePages.add(page);
  }

  const pageItems: (number | 'ellipsis')[] = [];
  let previousPage = 0;
  [...visiblePages].sort((a, b) => a - b).forEach((page) => {
    if (previousPage > 0 && page - previousPage > 1) pageItems.push('ellipsis');
    pageItems.push(page);
    previousPage = page;
  });

  const buttonClass = 'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label={ariaLabel} className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label={previousLabel}
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${buttonClass} text-muted-foreground hover:bg-muted hover:text-foreground`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageItems.map((item, index) => item === 'ellipsis' ? (
        <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-sm text-muted-foreground">…</span>
      ) : (
        <button
          key={item}
          type="button"
          aria-current={item === currentPage ? 'page' : undefined}
          aria-label={`${item}`}
          disabled={disabled}
          onClick={() => onPageChange(item)}
          className={`${buttonClass} ${
            item === currentPage
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        aria-label={nextLabel}
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${buttonClass} text-muted-foreground hover:bg-muted hover:text-foreground`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
