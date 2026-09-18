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
 * Statusne oznake posuđuju semantiku oblika s ceste:
 *   pravokutnik = obavijest, trokut = upozorenje, krug = zabrana.
 * Oblik nosi značenje i za korisnike koji ne razlikuju boje.
 */
const TONES: Record<Tone, string> = {
  signal: 'bg-signal-100 text-signal-900 border-signal-700',
  work: 'bg-work-100 text-ink-950 border-work-600',
  go: 'bg-go-100 text-go-700 border-go-600',
  stop: 'bg-stop-100 text-stop-700 border-stop-600',
  neutral: 'bg-ink-100 text-ink-700 border-ink-300',
};

const MARK: Record<Tone, string> = {
  signal: 'bg-signal-700',
  work: 'bg-work-600',
  go: 'bg-go-600',
  stop: 'bg-stop-600',
  neutral: 'bg-ink-500',
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
        'inline-flex items-center gap-1.5 rounded-plate border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
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
