import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AlertTriangle, Ban, Check, Info } from './Icon';
import { Button } from './Button';

/** Obavijest u tijeku stranice. Ton bira boju i ikonu po istoj semantici kao znakovi. */
type AlertTone = 'info' | 'warning' | 'error' | 'success';

/**
 * Boja ruba je sva na lijevoj strani, ne po cijelom obodu: okvir u punoj boji
 * oko poruke natjecao bi se s primarnim gumbom za pažnju. Traka lijevo daje
 * isti signal tiše.
 */
const ALERT_TONES: Record<AlertTone, { wrap: string; icon: ReactNode; role: 'status' | 'alert' }> = {
  info: {
    wrap: 'bg-midnight-50 border-midnight-100 border-l-midnight-800 text-midnight-950',
    icon: <Info size={20} />,
    role: 'status',
  },
  warning: {
    wrap: 'bg-volt-100 border-volt-300 border-l-volt-600 text-asphalt-950',
    icon: <AlertTriangle size={20} />,
    role: 'status',
  },
  error: {
    wrap: 'bg-stop-50 border-stop-100 border-l-stop-600 text-stop-700',
    icon: <Ban size={20} />,
    role: 'alert',
  },
  success: {
    wrap: 'bg-go-50 border-go-100 border-l-go-600 text-go-700',
    icon: <Check size={20} />,
    role: 'status',
  },
};

/**
 * Znak s ceste: oblik nosi značenje jednako kao boja.
 * Pravokutnik obavještava, trokut upozorava, krug zabranjuje ili potvrđuje.
 */
const ALERT_MARK: Record<AlertTone, string> = {
  info: 'rounded-[2px] bg-midnight-800 text-white',
  warning: 'bg-volt-500 text-asphalt-950 [clip-path:polygon(50%_0,100%_100%,0_100%)]',
  error: 'rounded-full bg-stop-600 text-white',
  success: 'rounded-full bg-go-600 text-white',
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const config = ALERT_TONES[tone];
  return (
    <div
      role={config.role}
      className={cn('flex gap-3 rounded-control border border-l-4 px-4 py-3', config.wrap, className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center',
          ALERT_MARK[tone],
          tone === 'warning' && 'items-end pb-0.5',
        )}
      >
        {config.icon}
      </span>
      <div className="min-w-0 text-[0.9375rem]">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-0.5')}>{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Prazno stanje nije greška — objašnjava zašto je prazno i nudi sljedeći korak.
 *
 * `illustration` i `icon` se isključuju: ilustracija ima prednost, a ikona
 * ostaje za mjesta gdje bi crtež bio prevelik (uži stupci, dijalozi).
 * Ilustracija je uvijek `aria-hidden` jer je ukrasna — naslov i opis ispod nje
 * već nose cijelu poruku, pa bi je čitač ekrana inače pročitao dvaput.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  illustration,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-asphalt-200 bg-white px-6 py-12 text-center">
      {illustration ? (
        <span aria-hidden="true" className="mb-1 block">
          {illustration}
        </span>
      ) : icon ? (
        <span className="text-asphalt-500">{icon}</span>
      ) : null}
      <h3 className="text-lg font-bold text-asphalt-900">{title}</h3>
      <p className="max-w-prose text-[0.9375rem] text-asphalt-500">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Greška pri dohvaćanju podataka. Uvijek nudi ponovni pokušaj. */
export function ErrorState({
  title = 'Podaci se nisu učitali',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert tone="error" title={title}>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Pokušaj ponovno
        </Button>
      ) : null}
    </Alert>
  );
}

/** Kostur tijekom učitavanja — drži raspored mirnim umjesto da skače. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-plate bg-asphalt-100', className)}
    />
  );
}

export function LoadingRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="status" aria-live="polite">
      <span className="sr-only">Učitavanje…</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}
