import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatSlotLabel } from '@/lib/format';
import { useAuth } from '@/features/auth/useAuth';
import { errorMessage } from '@/features/public/queries';
import type { AppointmentView, PageResponse, ReservationView, VehicleView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { ButtonLink } from '@/components/ui/Button';
import { AppointmentStatusBadge } from '@/components/ui/Status';
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ArrowRight, Car, Clock } from '@/components/ui/Icon';

export default function CustomerOverview() {
  const { user } = useAuth();

  const appointments = useQuery({
    queryKey: ['me', 'appointments', 0],
    queryFn: () => api.get<PageResponse<AppointmentView>>('/api/me/appointments?page=0&size=5'),
  });
  const vehicles = useQuery({
    queryKey: ['me', 'vehicles'],
    queryFn: () => api.get<VehicleView[]>('/api/me/vehicles'),
  });
  const reservations = useQuery({
    queryKey: ['me', 'reservations', 0],
    queryFn: () => api.get<PageResponse<ReservationView>>('/api/me/reservations?page=0&size=5'),
  });

  const upcoming = appointments.data?.content.filter(
    (appointment) => new Date(appointment.startAt) >= new Date() && appointment.status !== 'CANCELLED',
  );

  return (
    <>
      <SectionHeader
        title={`Dobrodošli, ${user?.fullName ?? ''}`}
        description="Ovdje su vaši nadolazeći termini, vozila i rezervacije."
        action={
          <ButtonLink to="/rezervacija">
            Novi termin
            <ArrowRight size={18} />
          </ButtonLink>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Nadolazeći termini" to="/moj-racun/termini">
            {appointments.isLoading ? (
              <LoadingRows rows={2} />
            ) : appointments.isError ? (
              <ErrorState
                message={errorMessage(appointments.error)}
                onRetry={() => void appointments.refetch()}
              />
            ) : (upcoming?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Clock size={36} />}
                title="Nemate zakazanih termina"
                description="Kad rezervirate termin, pojavit će se ovdje zajedno sa statusom."
                action={<ButtonLink to="/rezervacija">Rezerviraj termin</ButtonLink>}
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {upcoming!.map((appointment) => (
                  <li key={appointment.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold tabular-nums text-ink-950">
                        {formatSlotLabel(appointment.startAt)}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {appointment.serviceName} · {appointment.vehicleLabel}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Moja vozila" to="/moj-racun/vozila">
            {vehicles.isLoading ? (
              <LoadingRows rows={2} />
            ) : (vehicles.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Car size={36} />}
                title="Nema upisanih vozila"
                description="Vozilo je potrebno za rezervaciju termina."
                action={<ButtonLink to="/moj-racun/vozila">Dodaj vozilo</ButtonLink>}
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {vehicles.data?.map((vehicle) => (
                  <li key={vehicle.id} className="py-2.5">
                    <p className="font-bold text-ink-950">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm tabular-nums text-ink-500">
                      {vehicle.registration}
                      {vehicle.tireSize ? ` · ${vehicle.tireSize}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Rezervirani artikli" to="/moj-racun/rezervacije">
            {reservations.isLoading ? (
              <LoadingRows rows={2} />
            ) : (reservations.data?.content.length ?? 0) === 0 ? (
              <p className="py-2 text-[0.9375rem] text-ink-500">
                Nemate rezerviranih artikala.{' '}
                <Link to="/ponuda-guma" className="font-semibold text-signal-700">
                  Pogledajte ponudu
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {reservations.data?.content.slice(0, 4).map((reservation) => (
                  <li key={reservation.id} className="py-2.5">
                    <p className="font-bold text-ink-950">{reservation.productName}</p>
                    <p className="text-sm tabular-nums text-ink-500">{reservation.quantity} kom</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Panel({
  title,
  to,
  children,
}: {
  title: string;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sign border-2 border-ink-950 bg-white">
      <div className="flex items-center justify-between border-b-2 border-ink-950 bg-ink-50 px-4 py-2.5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-700">{title}</h2>
        <Link to={to} className="text-sm font-bold text-signal-700">
          Sve
        </Link>
      </div>
      <div className="px-4 py-2">{children}</div>
    </section>
  );
}
