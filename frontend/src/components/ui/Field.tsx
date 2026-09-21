import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Polja obrasca.
 *
 * Svako polje ima vidljivu oznaku (nikad samo placeholder), a poruka o grešci
 * vezana je uz polje kroz `aria-describedby`, pa je čitač ekrana pročita
 * zajedno s poljem.
 */
const CONTROL =
  'w-full min-h-11 rounded-plate border-2 bg-white px-3 text-[0.9375rem] text-asphalt-950 ' +
  'placeholder:text-asphalt-500 transition-colors duration-100 ' +
  'disabled:bg-asphalt-50 disabled:text-asphalt-500 disabled:cursor-not-allowed';

const CONTROL_OK = 'border-asphalt-300 hover:border-asphalt-500 focus:border-midnight-800';
const CONTROL_ERROR = 'border-stop-600 hover:border-stop-700 focus:border-stop-700';

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
        <select
          {...props}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'appearance-none pr-9', invalid ? CONTROL_ERROR : CONTROL_OK, className)}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235c6674' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.6rem center',
          }}
        >
          {children}
        </select>
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
