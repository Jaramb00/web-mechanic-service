import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSeo } from '@/lib/seo';
import { api } from '@/lib/api';
import { addDays, formatDate, formatPrice, formatSlotLabel, formatWeekdayShort, toIsoDate } from '@/lib/format';
import {
  useAvailability,
  useNextSlot,
  useServices,
  useWorkingHours,
  errorMessage,
} from '@/features/public/queries';
import { useAuth } from '@/features/auth/useAuth';
import type { AppointmentView, VehicleView } from '@/lib/types';
import { Section } from '@/components/ui/Section';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField, TextAreaField } from '@/components/ui/Field';
import { SlotBoard, SlotLegend } from '@/components/SlotBoard';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ArrowRight, Calendar, Car, Check, Clock, Wrench } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/** Odabir preživi preusmjeravanje na prijavu. */
const DRAFT_KEY = 'vulkanizer.booking-draft';

type Draft = { serviceId: number | null; date: string; slot: string | null; note: string };

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* privatni način rada — odabir se jednostavno ne pamti */
  }
}

export function BookingPage() {
  useSeo({
    title: 'Rezervacija termina',
    description:
      'Odaberite uslugu, dan i slobodan termin. Vidite točno koliko je mjesta slobodno i rezervirajte bez poziva.',
    path: '/rezervacija',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: services, isLoading: servicesLoading, isError: servicesError, refetch } = useServices();

  const restored = useMemo(readDraft, []);
  const [serviceId, setServiceId] = useState<number | null>(restored?.serviceId ?? null);
  const [date, setDate] = useState<string>(restored?.date ?? toIsoDate(new Date()));
  const [slot, setSlot] = useState<string | null>(restored?.slot ?? null);
  const [note, setNote] = useState<string>(restored?.note ?? '');
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<AppointmentView | null>(null);
  const [dateTouched, setDateTouched] = useState(restored?.date !== undefined);

  // U sezoni je današnji dan redovito pun, pa bi se čarobnjak otvarao na praznom
  // stanju. Ako korisnik još nije sam birao dan, kreće se od prvog dana na kojem
  // stvarno ima slobodnog termina.
  const { data: nextSlot } = useNextSlot();
  useEffect(() => {
    if (!dateTouched && nextSlot) {
      setDate(toIsoDate(new Date(nextSlot.startAt)));
    }
  }, [nextSlot, dateTouched]);

  // Prva aktivna usluga je razuman početak; korisnik je mijenja jednim klikom.
  useEffect(() => {
    if (serviceId === null && services && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  useEffect(() => {
    writeDraft({ serviceId, date, slot, note });
  }, [serviceId, date, slot, note]);

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['me', 'vehicles'],
    queryFn: () => api.get<VehicleView[]>('/api/me/vehicles'),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (vehicleId === null && vehicles && vehicles.length > 0) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicles, vehicleId]);

  const availability = useAvailability(date, serviceId);
  const selectedService = services?.find((entry) => entry.id === serviceId) ?? null;

  const booking = useMutation({
    mutationFn: () =>
      api.post<AppointmentView>('/api/appointments', {
        serviceId,
        vehicleId,
        startAt: slot,
        customerNote: note.trim() === '' ? null : note.trim(),
        website: '',
      }),
    onSuccess: (appointment) => {
      setConfirmed(appointment);
      sessionStorage.removeItem(DRAFT_KEY);
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'appointments'] });
    },
  });

  if (confirmed) {
    return <BookingConfirmation appointment={confirmed} onNew={() => {
      setConfirmed(null);
      setSlot(null);
      setNote('');
    }} />;
  }

  return (
    <Section tone="deep" labelledBy="naslov-rezervacija">
      <h1
        id="naslov-rezervacija"
        className="plate-title text-2xl font-extrabold text-white sm:text-4xl"
      >
        Rezervacija termina
      </h1>
      <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-relaxed text-asphalt-200">
        Odaberite uslugu i dan, pa uzmite termin koji vam odgovara. Prijava je potrebna tek
        na kraju — odabir se neće izgubiti.
      </p>

      <div className="mt-8 space-y-5">
        <Step number={1} title="Usluga" icon={<Wrench size={20} />}>
          {servicesLoading ? (
            <Skeleton className="h-11 w-full max-w-md" />
          ) : servicesError ? (
            <ErrorState message="Popis usluga se nije učitao." onRetry={() => void refetch()} />
          ) : (
            <div className="max-w-md">
              <SelectField
                label="Koju uslugu trebate?"
                value={serviceId ?? ''}
                onChange={(event) => {
                  setServiceId(Number(event.target.value));
                  setSlot(null);
                }}
              >
                {services?.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — {formatPrice(service.price)} ({service.durationMinutes} min)
                  </option>
                ))}
              </SelectField>
            </div>
          )}
        </Step>

        <Step number={2} title="Dan" icon={<Calendar size={20} />}>
          <DayPicker
            selected={date}
            onSelect={(next) => {
              setDateTouched(true);
              setDate(next);
              setSlot(null);
            }}
          />
        </Step>

        <Step number={3} title="Termin" icon={<Clock size={20} />}>
          {availability.isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
              {Array.from({ length: 10 }, (_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : availability.isError ? (
            <ErrorState
              message={errorMessage(availability.error)}
              onRetry={() => void availability.refetch()}
            />
          ) : availability.data?.closed ? (
            <Alert tone="info" title="Nema termina za taj dan">
              {availability.data.note ?? 'Servis taj dan ne radi.'}
            </Alert>
          ) : availability.data && availability.data.slots.length === 0 ? (
            <Alert tone="info" title="Za taj dan više nema termina">
              Probajte neki od sljedećih dana.
            </Alert>
          ) : (
            <>
              <SlotBoard
                slots={availability.data?.slots ?? []}
                selected={slot}
                onSelect={setSlot}
                label={`Slobodni termini za ${formatDate(date)}`}
              />
              <div className="mt-5 border-t border-asphalt-200 pt-4">
                <SlotLegend />
              </div>
            </>
          )}
        </Step>

        <Step number={4} title="Vozilo i napomena" icon={<Car size={20} />}>
          {!user ? (
            <Alert tone="info" title="Za dovršetak je potrebna prijava">
              <p>
                Vaš odabir je sačuvan. Nakon prijave vraćate se ovdje i samo potvrdite termin.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink to="/prijava" size="sm">
                  Prijava
                </ButtonLink>
                <ButtonLink to="/registracija" variant="outline" size="sm">
                  Otvori račun
                </ButtonLink>
              </div>
            </Alert>
          ) : vehiclesLoading ? (
            <Skeleton className="h-11 w-full max-w-md" />
          ) : (vehicles?.length ?? 0) === 0 ? (
            <EmptyState
              title="Još nemate upisano vozilo"
              description="Da bismo znali što servisiramo, upišite vozilo u svom računu. Traje manje od minute."
              action={
                <ButtonLink to="/moj-racun/vozila">
                  Dodaj vozilo
                  <ArrowRight size={18} />
                </ButtonLink>
              }
            />
          ) : (
            <div className="max-w-md space-y-4">
              <SelectField
                label="Vozilo"
                value={vehicleId ?? ''}
                onChange={(event) => setVehicleId(Number(event.target.value))}
              >
                {vehicles?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.registration})
                  </option>
                ))}
              </SelectField>

              <TextAreaField
                label="Napomena za servis"
                hint={'Neobavezno. Npr. „vibracije pri 100 km/h” ili „ostavljam ljetne na čuvanje”.'}
                value={note}
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          )}
        </Step>
      </div>

      <div className="edge-light mt-8 rounded-control bg-white p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-asphalt-950">Sažetak</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <SummaryRow term="Usluga" value={selectedService?.name ?? '—'} />
          <SummaryRow
            term="Cijena"
            value={selectedService ? formatPrice(selectedService.price) : '—'}
          />
          <SummaryRow term="Termin" value={slot ? formatSlotLabel(slot) : 'nije odabran'} />
          <SummaryRow
            term="Vozilo"
            value={
              vehicles?.find((vehicle) => vehicle.id === vehicleId)
                ? `${vehicles.find((v) => v.id === vehicleId)!.make} ${vehicles.find((v) => v.id === vehicleId)!.model}`
                : '—'
            }
          />
        </dl>

        {booking.isError ? (
          <Alert tone="error" title="Rezervacija nije uspjela" className="mt-5">
            {errorMessage(booking.error)}
          </Alert>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            disabled={!user || !slot || !vehicleId || !serviceId}
            loading={booking.isPending}
            onClick={() => booking.mutate()}
          >
            Potvrdi rezervaciju
            <ArrowRight size={20} />
          </Button>
          {!user ? (
            <Button variant="outline" size="lg" onClick={() => navigate('/prijava')}>
              Prijavi se
            </Button>
          ) : null}
        </div>

        {!slot ? (
          <p className="mt-3 text-sm text-asphalt-500">Odaberite termin da biste mogli potvrditi.</p>
        ) : null}
      </div>
    </Section>
  );
}

function Step({
  number,
  title,
  icon,
  children,
}: {
  number: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-control bg-white">
      {/* Zaglavlje koraka je plava ploha s uvučenom bijelom konturom — isti
          potpisni detalj kao na naslovnici, samo u gušćem registru. */}
      <h2 className="edge-light on-midnight flex items-center gap-3 bg-midnight-800 px-4 py-3.5 sm:px-5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-plate bg-volt-500 text-sm font-extrabold tabular-nums text-asphalt-950"
        >
          {number}
        </span>
        <span className="text-midnight-100">{icon}</span>
        <span className="text-[1.0625rem] font-extrabold text-white">{title}</span>
      </h2>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SummaryRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-asphalt-100 pb-2">
      <dt className="text-sm font-semibold text-asphalt-500">{term}</dt>
      <dd className="text-right font-bold text-asphalt-950">{value}</dd>
    </div>
  );
}

/**
 * Traka od 14 dana — dovoljno za sezonu, a stane na mobitel bez kalendara.
 *
 * Neradni dani nose istu šrafuru kao zauzeti termini i izlaze iz reda za fokus:
 * dan na koji se ne može doći ne smije izgledati kao da se može odabrati.
 */
function DayPicker({ selected, onSelect }: { selected: string; onSelect: (date: string) => void }) {
  const { data: workingHours } = useWorkingHours();

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => toIsoDate(addDays(today, index)));
  }, []);

  function isClosed(date: string): boolean {
    if (!workingHours) return false;
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const dayOfWeek = weekday === 0 ? 7 : weekday;
    return workingHours.find((entry) => entry.dayOfWeek === dayOfWeek)?.closed ?? false;
  }

  return (
    // `relative` je nužan: apsolutno pozicionirane sr-only oznake unutar trake
    // inače šire scrollable područje cijele stranice (isti uzrok kao kod tablica).
    <div
      className="relative flex gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Odabir dana"
    >
      {days.map((day, index) => {
        const isSelected = day === selected;
        const closed = isClosed(day);
        const iso = new Date(`${day}T12:00:00`).toISOString();
        const label = index === 0 ? 'danas' : formatWeekdayShort(iso);

        if (closed) {
          return (
            <div
              key={day}
              aria-hidden="true"
              className="hatched flex min-h-16 min-w-16 shrink-0 flex-col items-center justify-center rounded-plate border-2 border-asphalt-200 bg-asphalt-50 px-2 text-asphalt-300"
            >
              <span className="text-xs font-bold uppercase">{label}</span>
              <span className="text-lg font-extrabold tabular-nums line-through decoration-2">
                {new Date(`${day}T12:00:00`).getDate()}.
              </span>
            </div>
          );
        }

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={isSelected}
            className={cn(
              'flex min-h-16 min-w-16 shrink-0 flex-col items-center justify-center rounded-plate border-2 px-2 transition-colors duration-100',
              isSelected
                ? 'border-asphalt-950 bg-volt-500 text-asphalt-950'
                : 'border-asphalt-300 bg-white text-asphalt-900 hover:border-midnight-800 hover:bg-midnight-50',
            )}
          >
            <span className="text-xs font-bold uppercase">{label}</span>
            <span className="text-lg font-extrabold tabular-nums">
              {new Date(`${day}T12:00:00`).getDate()}.
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BookingConfirmation({
  appointment,
  onNew,
}: {
  appointment: AppointmentView;
  onNew: () => void;
}) {
  return (
    <Section tone="deep">
      <div className="mx-auto max-w-[60ch]">
        <div className="edge-light rounded-control bg-white">
          <div className="flex items-center gap-3 border-b-2 border-go-600 bg-go-50 px-5 py-4">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-go-600 text-white"
            >
              <Check size={22} />
            </span>
            <h1 className="text-xl font-extrabold text-go-700">Termin je rezerviran</h1>
          </div>

          <dl className="divide-y divide-asphalt-100">
            <ConfirmRow term="Termin" value={formatSlotLabel(appointment.startAt)} />
            <ConfirmRow term="Usluga" value={appointment.serviceName ?? '—'} />
            <ConfirmRow term="Vozilo" value={appointment.vehicleLabel ?? '—'} />
            <ConfirmRow term="Radno mjesto" value={appointment.bayName ?? '—'} />
          </dl>

          <div className="border-t border-asphalt-200 bg-asphalt-50 px-5 py-4 text-[0.9375rem] text-asphalt-700">
            Termin je zaprimljen i čeka potvrdu servisa. O promjeni statusa obavijestit ćemo
            vas u vašem računu.
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/moj-racun/termini">Moji termini</ButtonLink>
          <Button variant="outline" onClick={onNew}>
            Rezerviraj još jedan
          </Button>
          <Link to="/" className="self-center font-semibold text-white underline">
            Na naslovnicu
          </Link>
        </div>
      </div>
    </Section>
  );
}

function ConfirmRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3">
      <dt className="text-sm font-semibold text-asphalt-500">{term}</dt>
      <dd className="text-right font-bold text-asphalt-950">{value}</dd>
    </div>
  );
}
