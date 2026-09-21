import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { AppointmentStatus, ReservationStatus } from '@/lib/types';
import {
  APPOINTMENT_STATUS,
  RESERVATION_STATUS,
  type StatusShape as Shape,
  type StatusTone as Tone,
} from '@/lib/statusLabels';

/**
 * Statusne oznake zadržavaju semantiku oblika:
 *   pravokutnik = obavijest, trokut = upozorenje, krug = zabrana.
 *
 * Ovo je jedina stvar preuzeta iz starog znakovnog sustava, i to namjerno:
 * oblik je jedini nositelj značenja za korisnika koji ne razlikuje boje, pa
 * nije ukras nego pristupačnost. Sama oznaka je sada pilula umjesto ploče —
 * značenje i dalje nosi znak unutra, ne obris.
 */
const TONES: Record<Tone, string> = {
  midnight: 'bg-midnight-100 text-midnight-950 border-midnight-200',
  volt: 'bg-volt-100 text-asphalt-950 border-volt-600',
  go: 'bg-go-100 text-go-700 border-go-300',
  stop: 'bg-stop-100 text-stop-700 border-stop-300',
  neutral: 'bg-asphalt-100 text-asphalt-700 border-asphalt-200',
};

const MARK: Record<Tone, string> = {
  midnight: 'bg-midnight-800',
  volt: 'bg-volt-600',
  go: 'bg-go-600',
  stop: 'bg-stop-600',
  neutral: 'bg-asphalt-500',
};

function ShapeMark({ shape, tone }: { shape: Shape; tone: Tone }) {
  if (shape === 'triangle') {
    return (
      <span
        aria-hidden="true"
        className={cn('h-0 w-0 border-x-[5px] border-b-[9px] border-x-transparent')}
        style={{ borderBottomColor: 'currentColor' }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn('h-2.5 w-2.5', shape === 'circle' ? 'rounded-full' : 'rounded-[1px]', MARK[tone])}
    />
  );
}

export function StatusBadge({
  tone,
  shape,
  children,
  className,
}: {
  tone: Tone;
  shape: Shape;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        TONES[tone],
        className,
      )}
    >
      <ShapeMark shape={shape} tone={tone} />
      {children}
    </span>
  );
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = APPOINTMENT_STATUS[status];
  return (
    <StatusBadge tone={config.tone} shape={config.shape}>
      {config.label}
    </StatusBadge>
  );
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const config = RESERVATION_STATUS[status];
  return (
    <StatusBadge tone={config.tone} shape={config.shape}>
      {config.label}
    </StatusBadge>
  );
}
