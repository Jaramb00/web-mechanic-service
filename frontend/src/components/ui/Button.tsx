import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * Gumbi slijede semantiku znakovlja:
 *  - `primary` je radno žut, jer znak radova znači „ovdje se nešto poduzima".
 *    Na stranici postoji najviše jedan takav gumb po ekranu.
 *  - `secondary` je signalno plav — obavijest, sporedan put.
 *  - `danger` je zabranski crven i traži potvrdu prije izvršenja.
 *
 * Visina je najmanje 44 px: korisnik često stoji uz auto i tapka palcem.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-work-500 text-ink-950 hover:bg-work-400 active:bg-work-600 border-2 border-ink-950 font-bold',
  secondary:
    'bg-signal-700 text-white hover:bg-signal-600 active:bg-signal-800 border-2 border-signal-700 font-semibold',
  outline:
    'bg-white text-signal-800 border-2 border-signal-700 hover:bg-signal-50 active:bg-signal-100 font-semibold',
  ghost:
    'bg-transparent text-ink-900 border-2 border-transparent hover:bg-ink-100 active:bg-ink-200 font-semibold',
  danger:
    'bg-stop-600 text-white hover:bg-stop-500 active:bg-stop-700 border-2 border-stop-700 font-semibold',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-[0.9375rem] gap-2',
  lg: 'min-h-14 px-6 text-lg gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-plate transition-colors duration-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-inherit ' +
  'whitespace-nowrap select-none';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: CommonProps & { to: string } & Omit<React.ComponentProps<typeof Link>, 'to' | 'className'>) {
  return (
    <Link
      to={to}
      {...props}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', 'no-underline', className)}
    >
      {children}
    </Link>
  );
}

/** Vrti se samo dok traje radnja; `prefers-reduced-motion` je gasi. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
