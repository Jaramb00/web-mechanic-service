import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime, formatPrice } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { PageResponse, ReservationView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ReservationStatusBadge } from '@/components/ui/Status';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { Box } from '@/components/ui/Icon';

export default function CustomerReservations() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [toCancel, setToCancel] = useState<ReservationView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['me', 'reservations', page],
    queryFn: () => api.get<PageResponse<ReservationView>>(`/api/me/reservations?page=${page}&size=10`),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.post<ReservationView>(`/api/me/reservations/${id}/cancel`),
    onSuccess: () => {
      setToCancel(null);
      setNotice('Rezervacija je otkazana, roba je vraćena u prodaju.');
      void queryClient.invalidateQueries({ queryKey: ['me', 'reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return (
    <>
      <SectionHeader
        title="Rezervacije artikala"
        description="Rezervirana roba čeka vas u servisu. Ako odustanete, otkažite rezervaciju da je oslobodite drugima."
        action={<ButtonLink to="/ponuda-guma" variant="outline">Ponuda</ButtonLink>}
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}
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
          icon={<Box size={40} />}
          title="Nemate rezerviranih artikala"
          description="U ponudi možete provjeriti dostupne gume i dijelove te ih rezervirati za preuzimanje u servisu."
          action={<ButtonLink to="/ponuda-guma">Otvori ponudu</ButtonLink>}
        />
      ) : (
        <>
          <DataTable
            caption="Popis rezerviranih artikala"
            head={
              <>
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
                <Td>
                  <span className="font-bold text-ink-950">{reservation.productName}</span>
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
                <Td className="whitespace-nowrap text-sm tabular-nums text-ink-500">
                  {formatDateTime(reservation.createdAt)}
                </Td>
                <Td align="right">
                  {reservation.cancellable ? (
                    <Button variant="ghost" size="sm" onClick={() => setToCancel(reservation)}>
                      Otkaži
                    </Button>
                  ) : null}
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
            ? `${toCancel.quantity} kom artikla „${toCancel.productName}" bit će vraćeno u prodaju. Radnju nije moguće poništiti.`
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
