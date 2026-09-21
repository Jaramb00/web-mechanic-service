import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { Check } from '@/components/ui/Icon';
import type { ProductView, ReservationView } from '@/lib/types';

/**
 * Rezervacija artikla.
 *
 * Količina se provjerava i na poslužitelju: čak i ako netko pošalje veći broj
 * od dostupnog, backend odbija zahtjev. Provjera ovdje postoji da korisnik ne
 * čeka odgovor za nešto što se odmah vidi.
 */
export function ReserveDialog({
  product,
  onClose,
}: {
  product: ProductView | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<ReservationView | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (product && !dialog.open) {
      setQuantity(1);
      setNote('');
      setDone(null);
      dialog.showModal();
    }
    if (!product && dialog.open) dialog.close();
  }, [product]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const reserve = useMutation({
    mutationFn: () =>
      api.post<ReservationView>('/api/me/reservations', {
        productId: product?.id,
        quantity,
        appointmentId: null,
        pickupNote: note.trim() === '' ? null : note.trim(),
      }),
    onSuccess: (reservation) => {
      setDone(reservation);
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'reservations'] });
    },
  });

  const max = product?.availableQuantity ?? 0;
  const tooMany = quantity > max;

  return (
    <dialog
      ref={ref}
      aria-labelledby="rezervacija-naslov"
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-card border border-asphalt-200 shadow-plate bg-white p-0 backdrop:bg-asphalt-950/60"
    >
      {product ? (
        <>
          <div className="border-b-2 border-asphalt-950 bg-midnight-800 px-5 py-4">
            <h2 id="rezervacija-naslov" className="text-lg font-extrabold text-white">
              {done ? 'Rezervacija je zaprimljena' : 'Rezervacija artikla'}
            </h2>
            <p className="mt-0.5 text-sm text-midnight-100">{product.name}</p>
          </div>

          {done ? (
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-go-600 text-white">
                  <Check size={20} />
                </span>
                <p className="text-[0.9375rem] text-asphalt-700">
                  Rezervirali ste <strong className="text-asphalt-950">{done.quantity} kom</strong> ·
                  ukupno <strong className="text-asphalt-950">{formatPrice(done.total)}</strong>.
                  Roba je odvojena za vas i čeka preuzimanje u servisu.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-5 py-5">
              <div className="flex items-baseline justify-between border-b border-asphalt-200 pb-3">
                <span className="text-sm font-semibold text-asphalt-500">Cijena po komadu</span>
                <span className="text-lg font-extrabold tabular-nums">
                  {formatPrice(product.salePrice)}
                </span>
              </div>

              <TextField
                label="Količina"
                type="number"
                min={1}
                max={max}
                value={quantity}
                error={tooMany ? `Dostupno je najviše ${max} kom.` : undefined}
                hint={`Dostupno: ${max} kom`}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              />

              <TextAreaField
                label="Napomena"
                hint="Neobavezno. Npr. kad planirate doći po robu."
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
              />

              <div className="flex items-baseline justify-between border-t-2 border-asphalt-950 pt-3">
                <span className="font-bold text-asphalt-950">Ukupno</span>
                <span className="text-xl font-extrabold tabular-nums">
                  {formatPrice(product.salePrice * quantity)}
                </span>
              </div>

              {reserve.isError ? (
                <Alert tone="error" title="Rezervacija nije uspjela">
                  {errorMessage(reserve.error)}
                </Alert>
              ) : null}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-asphalt-200 bg-asphalt-50 px-5 py-3">
            <Button variant="ghost" onClick={onClose}>
              {done ? 'Zatvori' : 'Odustani'}
            </Button>
            {done ? null : (
              <Button
                disabled={tooMany || max === 0}
                loading={reserve.isPending}
                onClick={() => reserve.mutate()}
              >
                Rezerviraj
              </Button>
            )}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
