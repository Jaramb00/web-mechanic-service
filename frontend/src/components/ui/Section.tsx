import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Sekcija javne stranice. Ploha određuje ton, ne dekoracija.
 */
export function Section({
  tone = 'light',
  className,
  children,
  as: Tag = 'section',
  labelledBy,
}: {
  tone?: 'light' | 'white' | 'midnight' | 'deep';
  className?: string;
  children: ReactNode;
  as?: 'section' | 'div';
  labelledBy?: string;
}) {
  const tones = {
    light: 'bg-asphalt-50 text-asphalt-950',
    white: 'bg-white text-asphalt-950',
    midnight: 'on-midnight bg-midnight-800 text-white',
    deep: 'on-midnight surface-dark bg-midnight-950 text-white',
  } as const;

  return (
    <Tag aria-labelledby={labelledBy} className={cn(tones[tone], className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">{children}</div>
    </Tag>
  );
}

/**
 * Naslov sekcije. Bez nadnaslova iznad njega — naslov nosi vlastitu težinu.
 *
 * Nosi displejni rez (teški kondenzirani kurzivni verzali) — tipografski
 * potpis sustava. Namjerno staje ovdje i ne ide dublje: u tekstu bi kosi
 * verzali ubili čitljivost, a hrvatski dijakritici bi se na malim veličinama
 * slijepili.
 *
 * `level` postoji zato što svaka stranica mora imati točno jedan H1: prva
 * sekcija stranice nosi H1, sve sljedeće H2. Bez toga čitači ekrana i tražilice
 * dobiju dokument bez glavnog naslova.
 */
export function SectionTitle({
  id,
  children,
  description,
  invert = false,
  level = 2,
}: {
  id: string;
  children: ReactNode;
  description?: ReactNode;
  invert?: boolean;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div className="max-w-[60ch]">
      <Heading
        id={id}
        className={cn(
          'display text-balance',
          level === 1 ? 'text-3xl sm:text-5xl' : 'text-[1.75rem] sm:text-4xl',
          invert ? 'text-white' : 'text-asphalt-950',
        )}
      >
        {children}
      </Heading>
      {description ? (
        <p className={cn('mt-3 text-[1.0625rem] leading-relaxed', invert ? 'text-midnight-100' : 'text-asphalt-700')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
