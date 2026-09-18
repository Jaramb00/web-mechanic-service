import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Sekcija javne stranice. Ploha određuje ton, ne dekoracija. */
export function Section({
  tone = 'light',
  className,
  children,
  as: Tag = 'section',
  labelledBy,
}: {
  tone?: 'light' | 'white' | 'signal' | 'ink';
  className?: string;
  children: ReactNode;
  as?: 'section' | 'div';
  labelledBy?: string;
}) {
  const tones = {
    light: 'bg-ink-50 text-ink-950',
    white: 'bg-white text-ink-950',
    signal: 'on-signal bg-signal-700 text-white',
    ink: 'on-ink bg-ink-950 text-white',
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
          'text-balance font-extrabold tracking-tight',
          level === 1 ? 'text-2xl sm:text-4xl' : 'text-2xl sm:text-3xl',
          invert ? 'text-white' : 'text-ink-950',
        )}
      >
        {children}
      </Heading>
      {description ? (
        <p className={cn('mt-3 text-[1.0625rem] leading-relaxed', invert ? 'text-signal-100' : 'text-ink-700')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
