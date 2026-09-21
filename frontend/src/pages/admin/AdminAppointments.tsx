import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatTime, toIsoDate } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { AppointmentStatus, AppointmentView, PageResponse } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { AppointmentStatusBadge } from '@/components/ui/Status';
import { appointmentStatusLabel } from '@/lib/statusLabels';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { SelectField, TextField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Clock } from '@/components/ui/Icon';

const STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export default function AdminAppointments() {
  const [status, setStatus] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [page, setPage] = useState(0);

  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (status) params.set('status', status);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['work', 'appointments', status, from, to, page],
    queryFn: () => api.get<PageResponse<AppointmentView>>(`/api/work/appointments?${params}`),
  });

  return (
    <>
      <SectionHeader title="Termini" description="Svi termini uz filtar po statusu i razdoblju." />

      <form
        className="mb-5 grid gap-4 rounded-control border-2 border-asphalt-950 bg-white p-4 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(0);
        }}
      >
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
              {appointmentStatusLabel(entry)}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Od datuma"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => {
            setFrom(event.target.value);
            setPage(0);
          }}
        />
        <TextField
          label="Do datuma"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => {
            setTo(event.target.value);
            setPage(0);
          }}
        />

        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStatus('');
              setFrom('');
              setTo('');
              setPage(0);
            }}
          >
            Poništi filtre
          </Button>
        </div>
      </form>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Clock size={40} />}
          title="Nema termina za zadane uvjete"
          description="Promijenite filtre ili ih poništite da biste vidjeli sve termine."
        />
      ) : (
        <>
          <DataTable
            caption="Popis termina"
            head={
              <>
                <Th>Datum</Th>
                <Th>Vrijeme</Th>
                <Th>Stranka</Th>
                <Th>Vozilo</Th>
                <Th>Usluga</Th>
                <Th>Mjesto</Th>
                <Th>Status</Th>
              </>
            }
          >
            {data?.content.map((appointment) => (
              <Tr key={appointment.id}>
                <Td numeric className="whitespace-nowrap">{formatDate(appointment.startAt)}</Td>
                <Td numeric className="whitespace-nowrap">
                  {formatTime(appointment.startAt)}–{formatTime(appointment.endAt)}
                </Td>
                <Td className="font-semibold text-asphalt-950">{appointment.customerName ?? '—'}</Td>
                <Td className="text-asphalt-700">{appointment.vehicleLabel ?? '—'}</Td>
                <Td className="text-asphalt-700">{appointment.serviceName ?? '—'}</Td>
                <Td className="whitespace-nowrap text-asphalt-700">{appointment.bayName ?? '—'}</Td>
                <Td><AppointmentStatusBadge status={appointment.status} /></Td>
              </Tr>
            ))}
          </DataTable>

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

      <p className="mt-6 text-sm text-asphalt-500">
        Današnji raspored i promjena statusa nalaze se u{' '}
        <a href="/radionica" className="font-semibold text-midnight-800">
          radionici
        </a>
        . Prikazano razdoblje: {from ? formatDate(`${from}T00:00:00Z`) : 'od početka'} –{' '}
        {to ? formatDate(`${to}T00:00:00Z`) : toIsoDate(new Date())}.
      </p>
    </>
  );
}
