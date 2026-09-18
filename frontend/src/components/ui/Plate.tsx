import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Ploha — osnovni gradbeni element sustava.
 *
 * Nije kartica: nema meku sjenu ni zaobljene rubove kartica, nego uvučenu
 * konturu kao stvarni prometni znak. Sadržaj stranice slaže se od ploha, a ne
 * od rešetke jednakih kartica.
 */
type Tone = 'signal' | 'work' | 'white' | 'ink' | 'quiet';

const TONES: Record<Tone, string> = {
  signal: 'bg-signal-700 text-white keyline on-signal',
  work: 'bg-work-500 text-ink-950 keyline-dark',
  white: 'bg-white text-ink-950 border border-ink-200',
  ink: 'bg-ink-950 text-white keyline on-ink',
  quiet: 'bg-ink-50 text-ink-950 border border-ink-200',
};

export function Plate({
  tone = 'white',
  as: Tag = 'div',
  className,
  children,
}: {
  tone?: Tone;
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'li';
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn('rounded-sign', TONES[tone], className)}>{children}</Tag>;
}
