import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime, formatPrice } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { PageResponse, ReservationStatus, ReservationView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Field';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { ReservationStatusBadge } from '@/components/ui/Status';
import { reservationStatusLabel } from '@/lib/statusLabels';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Box } from '@/components/ui/Icon';

const STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'FULFILLED', 'CANCELLED'];

export default function WarehouseReservations() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [toCancel, setToCancel] = useState<ReservationView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (status) params.set('status', status);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['staff', 'reservations', status, page],
    queryFn: () => api.get<PageResponse<ReservationView>>(`/api/staff/reservations?${params}`),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['staff', 'reservations'] });
    void queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  }

  const confirm = useMutation({
    mutationFn: (id: number) => api.post<ReservationView>(`/api/staff/reservations/${id}/confirm`),
    onSuccess: () => {
      setNotice('Rezervacija je potvrđena.');
      invalidate();
    },
  });

  const fulfill = useMutation({
    mutationFn: (id: number) => api.post<ReservationView>(`/api/staff/reservations/${id}/fulfill`),
    onSuccess: () => {
      setNotice('Roba je izdana i skinuta sa stanja.');
      invalidate();
    },
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.post<ReservationView>(`/api/staff/reservations/${id}/cancel`),
    onSuccess: () => {
      setNotice('Rezervacija je otkazana, roba je vraćena u prodaju.');
      setToCancel(null);
      invalidate();
    },
  });

  const anyError = confirm.error ?? fulfill.error ?? cancel.error;

  return (
    <>
      <SectionHeader
        title="Rezervacije artikala"
        description="Potvrda ne dira zalihu. Izdavanjem se roba skida sa stanja, otkazivanjem se vraća u prodaju."
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}
      {anyError ? (
        <Alert tone="error" title="Radnja nije izvršena" className="mb-5">
          {errorMessage(anyError)}
        </Alert>
      ) : null}

      <div className="mb-5 w-full sm:max-w-xs">
        <SelectField
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
        >
          <option value="">Svi statusi</option>
          {STATUSES.map((entry) => (
            <option key={entry} value={entry}>
              {reservationStatusLabel(entry)}
            </option>
          ))}
        </SelectField>
      </div>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState icon={<Box size={40} />} title="Nema rezervacija" description="Za zadani status nema zapisa." />
      ) : (
        <>
          <DataTable
            caption="Rezervacije artikala"
            head={
              <>
                <Th>Stranka</Th>
                <Th>Artikl</Th>
                <Th align="right">Količina</Th>
                <Th align="right">Ukupno</Th>
                <Th>Status</Th>
                <Th>Zatraženo</Th>
                <Th><span className="sr-only">Radnje</span></Th>
              </>
            }
          >
            {data?.content.map((reservation) => (
              <Tr key={reservation.id}>
                <Td className="font-semibold text-ink-950">{reservation.customerName ?? '—'}</Td>
                <Td>
                  <span className="text-ink-950">{reservation.productName}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-ink-500">
                    {reservation.productSku}
                  </span>
                  {reservation.pickupNote ? (
                    <span className="mt-1 block text-sm text-ink-500">{reservation.pickupNote}</span>
                  ) : null}
                </Td>
                <Td align="right" numeric>{reservation.quantity}</Td>
                <Td align="right" numeric>{formatPrice(reservation.total)}</Td>
                <Td><ReservationStatusBadge status={reservation.status} /></Td>
                <Td numeric className="whitespace-nowrap text-sm text-ink-500">
                  {formatDateTime(reservation.createdAt)}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    {reservation.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={confirm.isPending && confirm.variables === reservation.id}
                        onClick={() => confirm.mutate(reservation.id)}
                      >
                        Potvrdi
                      </Button>
                    ) : null}
                    {reservation.cancellable ? (
                      <>
                        <Button
                          size="sm"
                          loading={fulfill.isPending && fulfill.variables === reservation.id}
                          onClick={() => fulfill.mutate(reservation.id)}
                        >
                          Izdaj
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setToCancel(reservation)}>
                          Otkaži
                        </Button>
                      </>
                    ) : null}
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>

          <div className="mt-6">
            <Pagination
              page={data!.page}
              totalPages={data!.totalPages}
              totalElements={data!.totalElements}
              onChange={setPage}
              label="rezervacija"
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={toCancel !== null}
        title="Otkazati rezervaciju?"
        description={
          toCancel
            ? `${toCancel.quantity} kom artikla „${toCancel.productName}" bit će vraćeno u prodaju, a stranka gubi rezervaciju.`
            : ''
        }
        confirmLabel="Da, otkaži"
        destructive
        loading={cancel.isPending}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id)}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
}
