import { cn } from '@/lib/cn';

/**
 * ZNAK MARKE — prema logu koji je dao klijent.
 *
 * Prsten s četiri proreza i žutim lukom u gornjem desnom kvadrantu. Geometrija
 * nije pogođena od oka nego **izmjerena iz PDF-a s logom**: polarni presjek
 * prstena dao je žuti raspon 353°–96°, proreze na 150°, 210°, 270° i 330°, i
 * debljinu prstena od 25 % vanjskog polumjera. Tim redom su i zapisani ispod.
 *
 * Tijelo je `currentColor`, pa se znak boji iz konteksta — bijelo na tamnoj
 * plohi, tamno na svijetloj — bez ijedne varijante komponente. Jedina fiksna
 * boja je žuti luk, jer je on potpis i mora ostati žut svugdje.
 *
 * Ista geometrija živi na tri mjesta i mijenja se na sva tri zajedno:
 * ovdje, u `public/favicon.svg` i u `scripts/build-og-image.py`.
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
      {/* Tamni dio prstena, izlomljen na pet segmenata s četiri proreza */}
      <path
        d="M20.68 13.07A8.75 8.75 0 0 1 16.77 19.34M15.97 19.80A8.75 8.75 0 0 1 8.03 19.80M7.23 19.34A8.75 8.75 0 0 1 3.26 12.31M3.26 11.54A8.75 8.75 0 0 1 7.36 4.58M8.03 4.20A8.75 8.75 0 0 1 10.93 3.32"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* Žuti luk: gornji desni kvadrant, 353°–96° */}
      <path
        d="M10.93 3.32A8.75 8.75 0 0 1 20.70 12.91"
        stroke="var(--color-volt-500)"
        strokeWidth="2.5"
      />
    </svg>
  );
}
