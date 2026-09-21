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
  signal: 'bg-midnight-800 text-white edge-light on-midnight',
  work: 'bg-volt-500 text-asphalt-950 edge-light-dark',
  white: 'bg-white text-asphalt-950 border border-asphalt-200',
  ink: 'bg-asphalt-950 text-white edge-light on-midnight',
  quiet: 'bg-asphalt-50 text-asphalt-950 border border-asphalt-200',
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
  return <Tag className={cn('rounded-control', TONES[tone], className)}>{children}</Tag>;
}
