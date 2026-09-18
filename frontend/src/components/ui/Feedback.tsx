import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AlertTriangle, Ban, Check, Info } from './Icon';
import { Button } from './Button';

/** Obavijest u tijeku stranice. Ton bira boju i ikonu po istoj semantici kao znakovi. */
type AlertTone = 'info' | 'warning' | 'error' | 'success';

const ALERT_TONES: Record<AlertTone, { wrap: string; icon: ReactNode; role: 'status' | 'alert' }> = {
  info: {
    wrap: 'bg-signal-50 border-signal-700 text-signal-900',
    icon: <Info size={20} />,
    role: 'status',
  },
  warning: {
    wrap: 'bg-work-100 border-work-600 text-ink-950',
    icon: <AlertTriangle size={20} />,
    role: 'status',
  },
  error: {
    wrap: 'bg-stop-50 border-stop-600 text-stop-700',
    icon: <Ban size={20} />,
    role: 'alert',
  },
  success: {
    wrap: 'bg-go-50 border-go-600 text-go-700',
    icon: <Check size={20} />,
    role: 'status',
  },
};

/**
 * Znak s ceste: oblik nosi značenje jednako kao boja.
 * Pravokutnik obavještava, trokut upozorava, krug zabranjuje ili potvrđuje.
 */
const ALERT_MARK: Record<AlertTone, string> = {
  info: 'rounded-[2px] bg-signal-700 text-white',
  warning: 'bg-work-500 text-ink-950 [clip-path:polygon(50%_0,100%_100%,0_100%)]',
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
      className={cn('flex gap-3 rounded-sign border-2 px-4 py-3', config.wrap, className)}
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

/** Prazno stanje nije greška — objašnjava zašto je prazno i nudi sljedeći korak. */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sign border-2 border-dashed border-ink-300 bg-white px-6 py-12 text-center">
      {icon ? <span className="text-ink-300">{icon}</span> : null}
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      <p className="max-w-prose text-[0.9375rem] text-ink-500">{description}</p>
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
      className={cn('animate-pulse rounded-plate bg-ink-100', className)}
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
