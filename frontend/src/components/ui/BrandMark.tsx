import { cn } from '@/lib/cn';

/**
 * ZNAK MARKE.
 *
 * Guma gledana s boka, i žuti luk svjetla koji joj hvata gornji brid — isti
 * potez koji nosi cijeli sustav („rub svjetla" iz theme.css), sveden na znak.
 * Nije crtani lik nego amblem: čitljiv na 20 px u kartici preglednika jednako
 * kao na 200 px u zaglavlju.
 *
 * Tijelo znaka je `currentColor`, pa se boji iz konteksta — bijelo na tamnoj
 * plohi, mornarsko na svijetloj — bez ijedne varijante komponente. Jedina
 * fiksna boja je žuti luk, jer je on potpis i mora ostati žut svugdje.
 */
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('h-10 w-10 shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Plašt gume */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.25" />
      {/* Naplatak */}
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="2.25" />
      {/* Tri prečke — taman toliko da se pročita kotač, a ne meta */}
      <path
        d="M12 5.9v2.4M7 14.85l2.1-1.2M17 14.85l-2.1-1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Luk svjetla: pada s gornje lijeve strane, kao radna lampa */}
      <path
        d="M2 12A10 10 0 0 1 14.59 2.34"
        stroke="var(--color-volt-500)"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
