import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tablica kao radionička tabla: tanke linije, gusti redci, tablične znamenke.
 *
 * Namjerno nije stog kartica — brojevi u stupcu moraju se dati usporediti
 * pogledom niz stupac, što kartice onemogućuju.
 */
export function DataTable({
  caption,
  head,
  children,
  className,
}: {
  caption: string;
  head: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    // `relative` nije ukras: sr-only oznake unutar zaglavlja su apsolutno
    // pozicionirane, pa bez pozicioniranog pretka šire scrollable područje cijele
    // stranice i stvaraju vodoravni prelijev na mobitelu.
    <div className={cn('relative overflow-x-auto rounded-sign border border-ink-200 bg-white', className)}>
      <table className="w-full border-collapse text-left text-[0.9375rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-ink-950 bg-ink-50">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
  className,
  scope = 'col',
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  scope?: 'col' | 'row';
}) {
  return (
    <th
      scope={scope}
      className={cn(
        'px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-700',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn('border-b border-ink-100 last:border-b-0 hover:bg-signal-50/60', className)}>
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = 'left',
  className,
  numeric = false,
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  numeric?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        numeric && 'font-semibold',
        className,
      )}
    >
      {children}
    </td>
  );
}
