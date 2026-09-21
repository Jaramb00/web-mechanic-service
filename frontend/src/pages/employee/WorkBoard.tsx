import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice, formatTime, toIsoDate, addDays, formatDate } from '@/lib/format';
import { errorMessage, useProducts, useServices } from '@/features/public/queries';
import type { AppointmentStatus, AppointmentView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { AppointmentStatusBadge } from '@/components/ui/Status';
import { appointmentStatusLabel } from '@/lib/statusLabels';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ArrowLeft, ArrowRight, Box, Clock, Phone } from '@/components/ui/Icon';

/** Prijelazi koje majstor smije napraviti. Poslužitelj ih provjerava ponovno. */
const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
};

export default function WorkBoard() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['work', 'day', date],
    queryFn: () => api.get<AppointmentView[]>(`/api/work/appointments/day?date=${date}`),
    refetchInterval: 60_000,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['work'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  }

  return (
    <>
      <SectionHeader
        title="Radni nalozi"
        description="Termini po danu. Status mijenjajte kako posao napreduje — stranka to vidi u svom računu."
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setDate(toIsoDate(addDays(new Date(`${date}T12:00:00`), -1)))}
        >
          <ArrowLeft size={18} />
          Prethodni dan
        </Button>
        <p className="min-w-44 text-center text-lg font-extrabold tabular-nums text-asphalt-950">
          {formatDate(`${date}T12:00:00`)}
        </p>
        <Button
          variant="outline"
          onClick={() => setDate(toIsoDate(addDays(new Date(`${date}T12:00:00`), 1)))}
        >
          Sljedeći dan
          <ArrowRight size={18} />
        </Button>
        <Button variant="ghost" onClick={() => setDate(toIsoDate(new Date()))}>
          Danas
        </Button>
      </div>

      {isLoading ? (
        <LoadingRows rows={4} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Clock size={40} />}
          title="Za ovaj dan nema termina"
          description="Prebacite se na drugi dan ili pričekajte nove rezervacije."
        />
      ) : (
        <ul className="space-y-4">
          {data?.map((appointment) => (
            <WorkCard
              key={appointment.id}
              appointment={appointment}
              onChanged={(message) => {
                setNotice(message);
                invalidate();
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function WorkCard({
  appointment,
  onChanged,
}: {
  appointment: AppointmentView;
  onChanged: (message: string) => void;
}) {
  const [note, setNote] = useState(appointment.mechanicNote ?? '');
  const [addingItem, setAddingItem] = useState(false);

  const changeStatus = useMutation({
    mutationFn: (status: AppointmentStatus) =>
      api.post<AppointmentView>(`/api/work/appointments/${appointment.id}/status`, { status }),
    onSuccess: (_result, status) =>
      onChanged(`Status termina promijenjen u „${appointmentStatusLabel(status)}".`),
  });

  const saveNote = useMutation({
    mutationFn: () =>
      api.put<AppointmentView>(`/api/work/appointments/${appointment.id}/note`, { note }),
    onSuccess: () => onChanged('Napomena je spremljena.'),
  });

  const transitions = NEXT_STATUS[appointment.status] ?? [];

  return (
    <li className="rounded-control border-2 border-asphalt-950 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-asphalt-950 bg-asphalt-50 px-4 py-3">
        <div>
          <p className="text-xl font-extrabold tabular-nums text-asphalt-950">
            {formatTime(appointment.startAt)}–{formatTime(appointment.endAt)}
            <span className="ml-3 text-base font-semibold text-asphalt-500">{appointment.bayName}</span>
          </p>
          <p className="mt-0.5 font-semibold text-asphalt-700">{appointment.serviceName}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
        <dl className="space-y-2.5 text-[0.9375rem]">
          <div>
            <dt className="text-sm font-semibold text-asphalt-500">Stranka</dt>
            <dd className="font-bold text-asphalt-950">{appointment.customerName ?? '—'}</dd>
            {appointment.customerPhone ? (
              <dd>
                <a
                  href={`tel:${appointment.customerPhone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-midnight-800"
                >
                  <Phone size={16} />
                  {appointment.customerPhone}
                </a>
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-sm font-semibold text-asphalt-500">Vozilo</dt>
            <dd className="font-bold text-asphalt-950">{appointment.vehicleLabel ?? '—'}</dd>
            {appointment.vehicleTireSize ? (
              <dd className="tabular-nums text-asphalt-700">Gume: {appointment.vehicleTireSize}</dd>
            ) : null}
          </div>
          {appointment.customerNote ? (
            <div>
              <dt className="text-sm font-semibold text-asphalt-500">Napomena stranke</dt>
              <dd className="text-asphalt-900">{appointment.customerNote}</dd>
            </div>
          ) : null}
        </dl>

        <div>
          <TextAreaField
            label="Servisna napomena"
            hint="Vidi je i stranka u svom računu."
            value={note}
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            disabled={note === (appointment.mechanicNote ?? '')}
            loading={saveNote.isPending}
            onClick={() => saveNote.mutate()}
          >
            Spremi napomenu
          </Button>
        </div>
      </div>

      <UsedItems appointment={appointment} onChanged={onChanged} open={addingItem} setOpen={setAddingItem} />

      {changeStatus.isError ? (
        <Alert tone="error" title="Promjena statusa nije uspjela" className="mx-4 mb-4">
          {errorMessage(changeStatus.error)}
        </Alert>
      ) : null}

      {transitions.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-asphalt-200 bg-asphalt-50 px-4 py-3">
          {transitions.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === 'CANCELLED' || status === 'NO_SHOW' ? 'ghost' : 'primary'}
              loading={changeStatus.isPending && changeStatus.variables === status}
              onClick={() => changeStatus.mutate(status)}
            >
              {appointmentStatusLabel(status)}
            </Button>
          ))}
        </div>
      ) : null}
    </li>
  );
}

/** Evidencija utroška. Cijene dolaze s poslužitelja — majstor bira samo što i koliko. */
function UsedItems({
  appointment,
  onChanged,
  open,
  setOpen,
}: {
  appointment: AppointmentView;
  onChanged: (message: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [kind, setKind] = useState<'product' | 'service'>('product');
  const [productId, setProductId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);

  const { data: products } = useProducts({ page: 0, size: 60 });
  const { data: services } = useServices();

  const addItem = useMutation({
    mutationFn: () =>
      api.post<AppointmentView>(`/api/work/appointments/${appointment.id}/items`, {
        productId: kind === 'product' ? productId : null,
        serviceId: kind === 'service' ? serviceId : null,
        quantity,
      }),
    onSuccess: () => {
      setOpen(false);
      setProductId('');
      setServiceId('');
      setQuantity(1);
      onChanged('Stavka je evidentirana i skinuta sa zalihe.');
    },
  });

  const removeItem = useMutation({
    mutationFn: (itemId: number) =>
      api.del<AppointmentView>(`/api/work/appointments/${appointment.id}/items/${itemId}`),
    onSuccess: () => onChanged('Stavka je stornirana, artikl je vraćen na zalihu.'),
  });

  return (
    <div className="border-t border-asphalt-200 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-asphalt-700">
          <Box size={16} />
          Utrošeno
        </h3>
        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Dodaj stavku
          </Button>
        ) : null}
      </div>

      {appointment.items.length > 0 ? (
        <ul className="mt-3 divide-y divide-asphalt-100">
          {appointment.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-[0.9375rem]">
              <span className="min-w-0 text-asphalt-900">
                {item.description}
                <span className="text-asphalt-500"> × {item.quantity}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-bold tabular-nums">{formatPrice(item.lineTotal)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={removeItem.isPending && removeItem.variables === item.id}
                  onClick={() => removeItem.mutate(item.id)}
                >
                  Storno
                </Button>
              </span>
            </li>
          ))}
          <li className="flex justify-between border-t-2 border-asphalt-950 py-2 font-extrabold">
            <span>Ukupno</span>
            <span className="tabular-nums">{formatPrice(appointment.itemsTotal)}</span>
          </li>
        </ul>
      ) : (
        <p className="mt-2 text-sm text-asphalt-500">Još nije evidentiran nikakav utrošak.</p>
      )}

      {open ? (
        <div className="mt-4 rounded-plate border-2 border-asphalt-300 bg-asphalt-50 p-4">
          {addItem.isError ? (
            <Alert tone="error" title="Stavka nije dodana" className="mb-3">
              {errorMessage(addItem.error)}
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Vrsta"
              value={kind}
              onChange={(event) => setKind(event.target.value as 'product' | 'service')}
            >
              <option value="product">Artikl sa skladišta</option>
              <option value="service">Dodatna usluga</option>
            </SelectField>

            {kind === 'product' ? (
              <SelectField
                label="Artikl"
                value={productId}
                onChange={(event) => setProductId(Number(event.target.value))}
              >
                <option value="">Odaberite artikl…</option>
                {products?.content.map((product) => (
                  <option key={product.id} value={product.id} disabled={product.availableQuantity <= 0}>
                    {product.name} ({product.availableQuantity} kom)
                  </option>
                ))}
              </SelectField>
            ) : (
              <SelectField
                label="Usluga"
                value={serviceId}
                onChange={(event) => setServiceId(Number(event.target.value))}
              >
                <option value="">Odaberite uslugu…</option>
                {services?.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </SelectField>
            )}

            <TextField
              label="Količina"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={kind === 'product' ? productId === '' : serviceId === ''}
              loading={addItem.isPending}
              onClick={() => addItem.mutate()}
            >
              Evidentiraj
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Odustani
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
