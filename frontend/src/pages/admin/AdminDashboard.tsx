import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatPrice, formatTime } from '@/lib/format';
import { errorMessage } from '@/features/public/queries';
import type { DashboardSummary } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { AppointmentStatusBadge } from '@/components/ui/Status';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { EmptyState, ErrorState, LoadingRows, Skeleton } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import { AlertTriangle } from '@/components/ui/Icon';
import { EmptyArt } from '@/components/ui/EmptyArt';

export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<DashboardSummary>('/api/admin/dashboard'),
    refetchInterval: 60_000,
  });

  return (
    <>
      <SectionHeader
        title="Pregled dana"
        description="Stanje radionice danas. Osvježava se automatski svake minute."
        action={<ButtonLink to="/admin/termini" variant="outline">Svi termini</ButtonLink>}
      />

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          {/* Brojke stoje u jednoj traci, kao skupina instrumenata — ne kao
              rešetka jednakih kartica, koja bi sugerirala da su jednako važne. */}
          <div className="on-midnight grid grid-cols-2 gap-px overflow-hidden rounded-control bg-asphalt-900 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Termini danas" value={data?.appointmentsToday} loading={isLoading} />
            <Metric label="Na čekanju" value={data?.appointmentsPending} loading={isLoading} accent />
            <Metric label="Završeno danas" value={data?.completedToday} loading={isLoading} />
            <Metric label="Niska zaliha" value={data?.lowStockCount} loading={isLoading} warn />
            <Metric label="Aktivne rezervacije" value={data?.activeReservations} loading={isLoading} />
            <Metric label="Kupci" value={data?.customersCount} loading={isLoading} />
          </div>

          <section className="mt-6">
            <h2 className="mb-3 text-lg font-extrabold tracking-tight text-asphalt-950">
              Raspored za danas
            </h2>
            {isLoading ? (
              <LoadingRows rows={4} />
            ) : (data?.todaySchedule.length ?? 0) === 0 ? (
              <EmptyState illustration={<EmptyArt kind="appointments" />}
                title="Danas nema zakazanih termina"
                description="Kad stranke rezerviraju termin, raspored dana pojavit će se ovdje."
              />
            ) : (
              <DataTable
                caption="Termini zakazani za današnji dan"
                head={
                  <>
                    <Th>Vrijeme</Th>
                    <Th>Stranka</Th>
                    <Th>Vozilo</Th>
                    <Th>Usluga</Th>
                    <Th>Mjesto</Th>
                    <Th>Status</Th>
                  </>
                }
              >
                {data?.todaySchedule.map((appointment) => (
                  <Tr key={appointment.id}>
                    <Td numeric className="whitespace-nowrap">
                      {formatTime(appointment.startAt)}–{formatTime(appointment.endAt)}
                    </Td>
                    <Td>
                      <span className="font-semibold text-asphalt-950">
                        {appointment.customerName ?? '—'}
                      </span>
                      {appointment.customerPhone ? (
                        <a
                          href={`tel:${appointment.customerPhone.replace(/\s/g, '')}`}
                          className="mt-0.5 block text-sm tabular-nums text-midnight-800"
                        >
                          {appointment.customerPhone}
                        </a>
                      ) : null}
                    </Td>
                    <Td className="text-asphalt-700">{appointment.vehicleLabel ?? '—'}</Td>
                    <Td className="text-asphalt-700">{appointment.serviceName ?? '—'}</Td>
                    <Td className="whitespace-nowrap text-asphalt-700">{appointment.bayName ?? '—'}</Td>
                    <Td><AppointmentStatusBadge status={appointment.status} /></Td>
                  </Tr>
                ))}
              </DataTable>
            )}
          </section>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold tracking-tight text-asphalt-950">Niska zaliha</h2>
              <Link to="/skladiste" className="text-sm font-bold text-midnight-800">
                Otvori skladište
              </Link>
            </div>
            {isLoading ? (
              <LoadingRows rows={2} />
            ) : (data?.lowStockItems.length ?? 0) === 0 ? (
              <p className="rounded-control border-2 border-go-600 bg-go-50 px-4 py-3 font-semibold text-go-700">
                Svi artikli su iznad minimalne zalihe.
              </p>
            ) : (
              <DataTable
                caption="Artikli ispod minimalne zalihe"
                head={
                  <>
                    <Th>Artikl</Th>
                    <Th align="right">Dostupno</Th>
                    <Th align="right">Minimum</Th>
                    <Th align="right">Cijena</Th>
                  </>
                }
              >
                {data?.lowStockItems.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <span className="flex items-center gap-2 font-semibold text-asphalt-950">
                        <AlertTriangle size={16} className="shrink-0 text-volt-600" />
                        {product.name}
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums text-asphalt-500">{product.sku}</span>
                    </Td>
                    <Td align="right" numeric className="text-stop-600">
                      {product.availableQuantity}
                    </Td>
                    <Td align="right" numeric className="text-asphalt-500">{product.minQuantity}</Td>
                    <Td align="right" numeric>{formatPrice(product.salePrice)}</Td>
                  </Tr>
                ))}
              </DataTable>
            )}
          </section>
        </>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  loading,
  accent = false,
  warn = false,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-asphalt-950 px-4 py-3.5">
      <p className="text-xs font-bold uppercase tracking-wide text-asphalt-300">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-7 w-12 bg-asphalt-900" />
      ) : (
        <p
          className={
            'mt-0.5 text-2xl font-extrabold tabular-nums ' +
            (warn && (value ?? 0) > 0
              ? 'text-stop-500'
              : accent && (value ?? 0) > 0
                ? 'text-volt-500'
                : 'text-white')
          }
        >
          {value ?? 0}
        </p>
      )}
    </div>
  );
}
