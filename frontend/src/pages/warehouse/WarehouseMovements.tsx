import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { MovementType, PageResponse, StockMovementView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

import { EmptyArt } from '@/components/ui/EmptyArt';
import { cn } from '@/lib/cn';

const MOVEMENT_LABELS: Record<MovementType, string> = {
  INITIAL_STOCK: 'Početno stanje',
  PURCHASE: 'Primka',
  RESERVATION: 'Rezervacija',
  RELEASE: 'Oslobađanje',
  SERVICE_USAGE: 'Utrošak na servisu',
  ADJUSTMENT: 'Korekcija',
};

export default function WarehouseMovements() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['warehouse', 'movements', page],
    queryFn: () => api.get<PageResponse<StockMovementView>>(`/api/warehouse/movements?page=${page}&size=25`),
  });

  return (
    <>
      <SectionHeader
        title="Promet zalihe"
        description="Svaka promjena količine ima zapis. Zapisi se ne mijenjaju i ne brišu — greška se ispravlja novim zapisom."
      />

      {isLoading ? (
        <LoadingRows rows={8} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState illustration={<EmptyArt kind="inventory" />} title="Nema zapisa" description="Promet će se pojaviti nakon prve promjene zalihe." />
      ) : (
        <>
          <DataTable
            caption="Kronološki popis promjena zalihe"
            head={
              <>
                <Th>Vrijeme</Th>
                <Th>Artikl</Th>
                <Th>Vrsta</Th>
                <Th align="right">Fizički</Th>
                <Th align="right">Rezervirano</Th>
                <Th>Napomena</Th>
              </>
            }
          >
            {data?.content.map((movement) => (
              <Tr key={movement.id}>
                <Td numeric className="whitespace-nowrap text-sm text-asphalt-500">
                  {formatDateTime(movement.createdAt)}
                </Td>
                <Td>
                  <span className="font-semibold text-asphalt-950">{movement.productName ?? '—'}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-asphalt-500">{movement.productSku}</span>
                </Td>
                <Td className="whitespace-nowrap text-asphalt-700">
                  {MOVEMENT_LABELS[movement.movementType]}
                </Td>
                <Td align="right" numeric className={cn(deltaClass(movement.deltaPhysical))}>
                  {formatDelta(movement.deltaPhysical)}
                </Td>
                <Td align="right" numeric className={cn(deltaClass(movement.deltaReserved))}>
                  {formatDelta(movement.deltaReserved)}
                </Td>
                <Td className="max-w-[28ch] text-sm text-asphalt-500">{movement.note ?? '—'}</Td>
              </Tr>
            ))}
          </DataTable>

          <div className="mt-6">
            <Pagination
              page={data!.page}
              totalPages={data!.totalPages}
              totalElements={data!.totalElements}
              onChange={setPage}
              label="zapisa"
            />
          </div>
        </>
      )}
    </>
  );
}

function formatDelta(value: number): string {
  if (value === 0) return '—';
  return value > 0 ? `+${value}` : String(value);
}

function deltaClass(value: number): string {
  if (value === 0) return 'text-asphalt-300';
  return value > 0 ? 'text-go-600' : 'text-stop-600';
}
