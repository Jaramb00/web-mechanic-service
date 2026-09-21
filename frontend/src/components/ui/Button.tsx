import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * Gumbi nose semantiku boje:
 *  - `primary` je volt — potpis brenda i jedina radnja koja se poduzima sada.
 *    Na stranici postoji najviše jedan takav gumb po ekranu. Jedini nosi
 *    akcentni gradijent u cijelom sustavu.
 *  - `secondary` je mornarski — sporedan put, ali i dalje odluka.
 *  - `danger` je zabranski crven i traži potvrdu prije izvršenja.
 *
 * Tekst na volt plohi je UVIJEK asphalt-950. Bijelo na žutom ima kontrast
 * 1.2:1 i nečitljivo je — zato ta kombinacija ovdje ne postoji.
 *
 * Visina je najmanje 44 px: korisnik često stoji uz auto i tapka palcem.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary:
    'volt-face volt-face-hover text-asphalt-950 font-bold shadow-plate ' +
    'hover:shadow-raised active:shadow-none',
  secondary:
    'surface-dark bg-midnight-800 text-white font-semibold shadow-plate ' +
    'hover:bg-midnight-700 hover:shadow-raised active:bg-midnight-900 active:shadow-none',
  outline:
    'bg-white text-midnight-900 border border-asphalt-200 font-semibold shadow-plate ' +
    'hover:border-midnight-500 hover:bg-midnight-50 hover:shadow-raised active:bg-midnight-100 active:shadow-none',
  ghost:
    'bg-transparent text-asphalt-700 font-semibold ' +
    'hover:bg-asphalt-100 hover:text-asphalt-950 active:bg-asphalt-200',
  danger:
    'bg-stop-600 text-white font-semibold shadow-plate ' +
    'hover:bg-stop-500 hover:shadow-raised active:bg-stop-700 active:shadow-none',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 text-sm gap-1.5',
  md: 'min-h-11 px-5 text-[0.9375rem] gap-2',
  lg: 'min-h-14 px-7 text-lg gap-2.5',
};

/**
 * Pomak na hover je 1 px, ne 2 kao kod kartica: gumb se često nalazi uz rub
 * polja za unos, pa veći pomak izgleda kao da raspored poskakuje.
 *
 * `disabled` gasi i pomak i sjenu — onemogućen gumb koji se diže na hover
 * poručuje da je kliktljiv.
 */
const BASE =
  'inline-flex items-center justify-center rounded-control select-none whitespace-nowrap ' +
  'transition-[background-color,background-image,border-color,box-shadow,transform,color] ' +
  'duration-150 ease-out ' +
  'hover:-translate-y-px active:translate-y-0 ' +
  'disabled:cursor-not-allowed disabled:opacity-55 ' +
  'disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:shadow-none';

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
