import { Button } from './Button';
import { ChevronLeft, ChevronRight } from './Icon';

/**
 * Paginacija umjesto beskonačnog popisa: liste artikala i termina rastu, a
 * dohvaćanje svega odjednom je i sporo i nepotrebno.
 */
export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
  label,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
  label: string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-ink-500">
        Ukupno {totalElements} {label}.
      </p>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Stranice rezultata">
      <p className="text-sm text-ink-500">
        Stranica <strong className="text-ink-900">{page + 1}</strong> od {totalPages} · ukupno{' '}
        {totalElements} {label}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          aria-label="Prethodna stranica"
        >
          <ChevronLeft size={16} />
          Prethodna
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Sljedeća stranica"
        >
          Sljedeća
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
