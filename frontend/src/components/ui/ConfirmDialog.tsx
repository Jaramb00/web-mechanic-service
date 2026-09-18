import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { AlertTriangle } from './Icon';

/**
 * Potvrda destruktivne radnje.
 *
 * Koristi izvorni `<dialog>`: on sam rješava zarobljavanje fokusa, Escape i
 * inertnost pozadine — što su ručne implementacije redovito promaše.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Potvrdi',
  cancelLabel = 'Odustani',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCancel();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-sign border-2 border-ink-950 bg-white p-0 backdrop:bg-ink-950/60"
    >
      <div className="flex gap-3 border-b-2 border-ink-950 bg-work-500 px-5 py-4">
        <AlertTriangle size={22} className="mt-0.5 shrink-0 text-ink-950" />
        <h2 id="confirm-title" className="text-lg font-bold text-ink-950">
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">
        <p className="text-[0.9375rem] text-ink-700">{description}</p>
        {children}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200 bg-ink-50 px-5 py-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? 'danger' : 'secondary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
