import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from './Icon';

/**
 * Polja obrasca.
 *
 * Svako polje ima vidljivu oznaku (nikad samo placeholder), a poruka o grešci
 * vezana je uz polje kroz `aria-describedby`, pa je čitač ekrana pročita
 * zajedno s poljem.
 */
/**
 * Rub je tanak (1 px) umjesto dvostrukog: obrazac s osam polja u okvirima od
 * 2 px izgleda kao rešetka, a ne kao niz pitanja. Stanje se čita iz boje ruba
 * i mekog prstena na fokusu.
 */
const CONTROL =
  'w-full min-h-11 rounded-control border bg-white px-3.5 text-[0.9375rem] text-asphalt-950 ' +
  'placeholder:text-asphalt-500 transition-[border-color,box-shadow] duration-150 ease-out ' +
  'disabled:bg-asphalt-50 disabled:text-asphalt-500 disabled:cursor-not-allowed';

const CONTROL_OK =
  'border-asphalt-400 hover:border-asphalt-500 focus:border-midnight-800 focus:shadow-plate';
const CONTROL_ERROR =
  'border-stop-500 hover:border-stop-600 focus:border-stop-600 focus:shadow-plate';

type FieldShellProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

export function Field({ label, error, hint, required, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-asphalt-900">
        {label}
        {required ? (
          <span className="ml-1 text-stop-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-asphalt-500">
          {hint}
        </p>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-stop-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          {...props}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, invalid ? CONTROL_ERROR : CONTROL_OK, className)}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  children,
  className,
  ...props
}: { label: string; error?: string; hint?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {({ id, describedBy, invalid }) => (
        /* Strelica je stvarna ikona, a ne slika u pozadini. Prije je bila
           data-URI s upisanom bojom `%235c6674` — hardkodiranom, a k tome
           nevidljivom za provjeru koja traži `#rrggbb`, jer je bila
           URL-kodirana. Ovako boju nosi `currentColor` i prati tokene. */
        <span className="relative block">
          <select
            {...props}
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(CONTROL, 'appearance-none pr-10', invalid ? CONTROL_ERROR : CONTROL_OK, className)}
          >
            {children}
          </select>
          <ChevronDown
            size={20}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-asphalt-500"
          />
        </span>
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: { label: string; error?: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {({ id, describedBy, invalid }) => (
        <textarea
          {...props}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'min-h-24 resize-y py-2.5', invalid ? CONTROL_ERROR : CONTROL_OK, className)}
        />
      )}
    </Field>
  );
}

/**
 * Skriveno polje-mamac za botove. Vidljivo je čitačima ekrana kao polje koje
 * treba ostaviti prazno, a ljudima nije vidljivo. Backend odbija zahtjev ako
 * je popunjeno.
 */
export function HoneypotField({ register }: { register: Record<string, unknown> }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
      <label>
        Ovo polje ostavite prazno
        <input type="text" tabIndex={-1} autoComplete="off" {...register} />
      </label>
    </div>
  );
}
