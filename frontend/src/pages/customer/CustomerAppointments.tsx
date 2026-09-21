import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice, formatSlotLabel } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { AppointmentView, PageResponse } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AppointmentStatusBadge } from '@/components/ui/Status';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { Clock } from '@/components/ui/Icon';

export default function CustomerAppointments() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [toCancel, setToCancel] = useState<AppointmentView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['me', 'appointments', page],
    queryFn: () => api.get<PageResponse<AppointmentView>>(`/api/me/appointments?page=${page}&size=10`),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.post<AppointmentView>(`/api/me/appointments/${id}/cancel`),
    onSuccess: () => {
      setToCancel(null);
      setNotice('Termin je otkazan. Mjesto je oslobođeno za druge.');
      void queryClient.invalidateQueries({ queryKey: ['me', 'appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  return (
    <>
      <SectionHeader
        title="Moji termini"
        description="Svi termini, od najnovijeg prema starijima."
        action={<ButtonLink to="/rezervacija">Novi termin</ButtonLink>}
      />

      {notice ? (
        <Alert tone="success" className="mb-5">
          {notice}
        </Alert>
      ) : null}

      {cancel.isError ? (
        <Alert tone="error" title="Otkazivanje nije uspjelo" className="mb-5">
          {errorMessage(cancel.error)}
        </Alert>
      ) : null}

      {isLoading ? (
        <LoadingRows rows={4} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Clock size={40} />}
          title="Još nemate nijedan termin"
          description="Kad rezervirate termin, ovdje ćete vidjeti njegov status, vozilo i uslugu."
          action={<ButtonLink to="/rezervacija">Rezerviraj termin</ButtonLink>}
        />
      ) : (
        <>
          <ul className="space-y-4">
            {data?.content.map((appointment) => (
              <li key={appointment.id} className="rounded-control border-2 border-asphalt-950 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-asphalt-200 px-4 py-3">
                  <div>
                    <p className="text-lg font-extrabold tabular-nums text-asphalt-950">
                      {formatSlotLabel(appointment.startAt)}
                    </p>
                    <p className="mt-0.5 text-sm text-asphalt-500">
                      {appointment.serviceName} · {appointment.vehicleLabel}
                      {appointment.bayName ? ` · ${appointment.bayName}` : ''}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>

                {appointment.customerNote || appointment.mechanicNote || appointment.items.length > 0 ? (
                  <dl className="space-y-3 px-4 py-3 text-[0.9375rem]">
                    {appointment.customerNote ? (
                      <div>
                        <dt className="text-sm font-semibold text-asphalt-500">Vaša napomena</dt>
                        <dd className="text-asphalt-900">{appointment.customerNote}</dd>
                      </div>
                    ) : null}
                    {appointment.mechanicNote ? (
                      <div>
                        <dt className="text-sm font-semibold text-asphalt-500">Napomena servisa</dt>
                        <dd className="text-asphalt-900">{appointment.mechanicNote}</dd>
                      </div>
                    ) : null}
                    {appointment.items.length > 0 ? (
                      <div>
                        <dt className="text-sm font-semibold text-asphalt-500">Obavljeno i utrošeno</dt>
                        <dd>
                          <ul className="mt-1 divide-y divide-asphalt-100">
                            {appointment.items.map((item) => (
                              <li key={item.id} className="flex justify-between gap-4 py-1.5">
                                <span className="text-asphalt-900">
                                  {item.description}
                                  <span className="text-asphalt-500"> × {item.quantity}</span>
                                </span>
                                <span className="font-bold tabular-nums">
                                  {formatPrice(item.lineTotal)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 flex justify-between border-t-2 border-asphalt-950 pt-2 font-extrabold">
                            <span>Ukupno</span>
                            <span className="tabular-nums">{formatPrice(appointment.itemsTotal)}</span>
                          </p>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}

                {appointment.cancellable ? (
                  <div className="border-t border-asphalt-200 bg-asphalt-50 px-4 py-2.5">
                    <Button variant="ghost" size="sm" onClick={() => setToCancel(appointment)}>
                      Otkaži termin
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Pagination
              page={data!.page}
              totalPages={data!.totalPages}
              totalElements={data!.totalElements}
              onChange={setPage}
              label="termina"
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={toCancel !== null}
        title="Otkazati termin?"
        description={
          toCancel
            ? `Termin ${formatSlotLabel(toCancel.startAt)} bit će otkazan, a mjesto oslobođeno. Ovu radnju nije moguće poništiti.`
            : ''
        }
        confirmLabel="Da, otkaži"
        cancelLabel="Ne, zadrži"
        destructive
        loading={cancel.isPending}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id)}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
}
