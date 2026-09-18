import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { site, fullAddress } from '@/config/site';
import { useSeo } from '@/lib/seo';
import {
  addDays,
  formatDayMonth,
  formatPrice,
  formatSlotLabel,
  formatWeekdayShort,
  toIsoDate,
  trimSeconds,
  weekdayName,
} from '@/lib/format';
import { useAvailability, useNextSlot, useServices, useWorkingHours } from '@/features/public/queries';
import { Section, SectionTitle } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { SlotBoard, SlotLegend } from '@/components/SlotBoard';
import { Skeleton } from '@/components/ui/Feedback';
import { ArrowRight, Clock, MapPin, Phone } from '@/components/ui/Icon';

export function HomePage() {
  useSeo({
    title: 'Rezervirajte termin online',
    description:
      'Vulkanizerski servis: zamjena sezonskih guma, balansiranje, popravak gume i hotel za gume. Pogledajte slobodne termine i rezervirajte bez poziva.',
    path: '/',
  });

  return (
    <>
      <Hero />
      <ServicesOverview />
      <TireStorageTeaser />
      <SlotPreview />
      <VisitUs />
    </>
  );
}

/**
 * PRVI EKRAN.
 *
 * Nosi jednu činjenicu, ne dojam: kad servis ima prvo slobodno mjesto.
 * Podatak je stvaran i dolazi s API-ja — ako termina nema, to se kaže otvoreno
 * i ponudi telefon, umjesto da se prazno stanje sakrije.
 */
function Hero() {
  const { data: nextSlot, isLoading } = useNextSlot();

  return (
    <section className="on-ink bg-ink-950 text-white" aria-labelledby="naslov-pocetna">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:pt-14">
        <div className="keyline rounded-sign bg-signal-700 p-6 sm:p-10">
          <h1
            id="naslov-pocetna"
            className="plate-title text-balance text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[1.05] text-white"
          >
            {site.name}
          </h1>

          {/* Znak slaže odredište i radnju jedno uz drugo; slaganje jedno ispod
              drugog ostaje samo za uski ekran. */}
          <div className="mt-8 grid gap-6 border-t-2 border-signal-500 pt-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
            <div className="min-w-0">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-44 bg-signal-600" />
                  <Skeleton className="h-12 w-72 bg-signal-600" />
                </div>
              ) : nextSlot ? (
                <>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-work-400">
                    Prvi slobodan termin
                  </p>
                  <p className="plate-title mt-2 text-[clamp(1.75rem,5vw,3rem)] font-extrabold leading-none text-white">
                    {formatSlotLabel(nextSlot.startAt)}
                  </p>
                  <p className="mt-2 text-[0.9375rem] text-signal-100">
                    za uslugu „{nextSlot.serviceName}" · još {nextSlot.freeBays}{' '}
                    {nextSlot.freeBays === 1 ? 'slobodno mjesto' : 'slobodna mjesta'} u tom terminu
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-work-400">
                    Trenutno nema slobodnih termina
                  </p>
                  <p className="mt-2 max-w-[55ch] text-[1.0625rem] leading-relaxed text-signal-100">
                    U sezoni se popuni sve. Nazovite nas — često se oslobodi termin zbog otkazivanja.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:shrink-0">
              <ButtonLink to="/rezervacija" size="lg">
                Rezerviraj termin
                <ArrowRight size={20} />
              </ButtonLink>
              <a
                href={site.contact.phoneHref}
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-plate border-2 border-white px-6 text-lg font-bold text-white no-underline transition-colors duration-100 hover:bg-signal-600"
              >
                <Phone size={20} />
                {site.contact.phone}
              </a>
            </div>
          </div>
        </div>

        <FactStrip />
      </div>
    </section>
  );
}

/** Tri činjenice koje vozač traži prije svega ostalog. */
function FactStrip() {
  const { data: hours } = useWorkingHours();
  const today = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  }, []);
  const todayHours = hours?.find((entry) => entry.dayOfWeek === today);

  return (
    <dl className="mt-6 grid gap-px overflow-hidden rounded-sign bg-ink-900 sm:grid-cols-3">
      <Fact icon={<Clock size={18} />} term="Danas">
        {todayHours
          ? todayHours.closed
            ? 'Zatvoreno'
            : `${trimSeconds(todayHours.openTime)} – ${trimSeconds(todayHours.closeTime)}`
          : '—'}
      </Fact>
      <Fact icon={<MapPin size={18} />} term="Adresa">
        <Link to="/lokacija" className="text-white underline decoration-work-500 decoration-2">
          {fullAddress}
        </Link>
      </Fact>
      <Fact icon={<Phone size={18} />} term="Telefon">
        <a href={site.contact.phoneHref} className="text-white no-underline hover:underline">
          {site.contact.phone}
        </a>
      </Fact>
    </dl>
  );
}

function Fact({ icon, term, children }: { icon: React.ReactNode; term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-ink-950 px-4 py-4">
      <span className="mt-0.5 text-work-500">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-ink-300">{term}</dt>
        <dd className="mt-0.5 font-semibold text-white">{children}</dd>
      </div>
    </div>
  );
}

/**
 * Usluge se prikazuju kao linirana tabla, a ne kao rešetka jednakih kartica:
 * posjetitelj uspoređuje cijene i trajanja pogledom niz stupac.
 */
function ServicesOverview() {
  const { data: services, isLoading } = useServices();
  const shown = services?.slice(0, 6) ?? [];

  return (
    <Section tone="white" labelledBy="naslov-usluge">
      <SectionTitle
        id="naslov-usluge"
        description="Cijene su okvirne i ovise o dimenziji gume i stanju vozila. Točan iznos dogovaramo prije početka rada."
      >
        Što radimo
      </SectionTitle>

      <div className="mt-8 overflow-hidden rounded-sign border-2 border-ink-950">
        {isLoading ? (
          <div className="flex flex-col gap-px bg-ink-100">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-none" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {shown.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-white px-4 py-4 sm:px-5"
              >
                <span className="min-w-0 flex-1 text-[1.0625rem] font-bold text-ink-950">
                  {service.name}
                </span>
                <span className="text-sm tabular-nums text-ink-500">
                  {service.durationMinutes} min
                </span>
                <span className="w-28 text-right text-[1.0625rem] font-extrabold tabular-nums text-ink-950">
                  {formatPrice(service.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to="/usluge" variant="outline">
          Sve usluge i opisi
        </ButtonLink>
        <ButtonLink to="/cjenik" variant="ghost">
          Cijeli cjenik
          <ArrowRight size={18} />
        </ButtonLink>
      </div>
    </Section>
  );
}

function TireStorageTeaser() {
  return (
    <Section tone="signal" labelledBy="naslov-hotel">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <SectionTitle
            id="naslov-hotel"
            invert
            description="Ljetne gume preko zime, zimske preko ljeta. Ne nose se doma, ne zauzimaju balkon i ne propadaju u vlažnom podrumu."
          >
            Hotel za gume
          </SectionTitle>
          <div className="mt-6">
            <ButtonLink to="/hotel-za-gume">
              Kako to funkcionira
              <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>

        <ul className="keyline space-y-px rounded-sign bg-signal-800 p-1">
          {[
            'Gume peremo prije spremanja i pregledamo dubinu profila',
            'Čuvaju se u zatvorenom prostoru, složene po pravilima struke',
            'Označene su na vaše ime i vozilo, s registracijom',
            'Kad dođete na zamjenu, već su spremne — ne čekate',
          ].map((item) => (
            <li key={item} className="flex gap-3 bg-signal-700 px-4 py-3.5 text-[0.9375rem] text-white">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 bg-work-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/**
 * Tabla termina u maloj gustoći — ista komponenta kao u rezervaciji.
 *
 * Prikazuju se TRI dana, ne jedan: razlika između popunjenog i slobodnog dana
 * je ono što nestašicu čini čitljivom. Kreće se od prvog dana na kojem ima
 * mjesta, jer je u sezoni današnji dan redovito pun ili već prošao.
 */
function SlotPreview() {
  const { data: services } = useServices();
  const { data: nextSlot } = useNextSlot();

  const service =
    services?.find((entry) => entry.id === nextSlot?.serviceId) ?? services?.[0] ?? null;
  const firstDate = nextSlot ? new Date(nextSlot.startAt) : new Date();
  const days = [0, 1, 2].map((offset) => toIsoDate(addDays(firstDate, offset)));

  return (
    <Section tone="light" labelledBy="naslov-termini">
      <SectionTitle
        id="naslov-termini"
        description={
          service
            ? `Sljedeća tri dana za uslugu „${service.name}". Zauzeti termini se vide — u sezoni nestaju brzo.`
            : 'Slobodni termini u sljedeća tri dana.'
        }
      >
        Kad ima mjesta
      </SectionTitle>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {days.map((date) => (
          <DayColumn key={date} date={date} serviceId={service?.id ?? null} serviceName={service?.name ?? ''} />
        ))}
      </div>

      <div className="mt-6 rounded-sign border-2 border-ink-950 bg-white px-4 py-3">
        <SlotLegend />
      </div>

      <div className="mt-6">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin
          <ArrowRight size={20} />
        </ButtonLink>
      </div>
    </Section>
  );
}

/** Jedan dan na tabli termina. */
function DayColumn({
  date,
  serviceId,
  serviceName,
}: {
  date: string;
  serviceId: number | null;
  serviceName: string;
}) {
  const { data: day, isLoading } = useAvailability(date, serviceId);
  const isToday = date === toIsoDate(new Date());
  const freeCount = day?.slots.filter((slot) => slot.available).length ?? 0;

  return (
    <div className="rounded-sign border-2 border-ink-950 bg-white">
      <div className="flex items-baseline justify-between gap-2 border-b-2 border-ink-950 bg-ink-50 px-4 py-2.5">
        <h3 className="font-extrabold capitalize text-ink-950">
          {isToday ? 'danas' : `${formatWeekdayShort(`${date}T12:00:00`)} ${formatDayMonth(`${date}T12:00:00`)}`}
        </h3>
        {/* Zatvoreno i popunjeno nisu isto: zatvoreno je raspored, popunjeno je
            nestašica. Ista oznaka za oboje bi zavarala posjetitelja. */}
        <span
          className={
            'text-sm font-bold tabular-nums ' +
            (day?.closed ? 'text-ink-500' : freeCount > 0 ? 'text-go-600' : 'text-stop-600')
          }
        >
          {isLoading ? '' : day?.closed ? 'zatvoreno' : freeCount > 0 ? `${freeCount} slobodno` : 'popunjeno'}
        </span>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        ) : !day || day.closed || day.slots.length === 0 ? (
          <p className="px-1 py-3 text-[0.9375rem] text-ink-500">
            {day?.note ?? 'Za taj dan više nema termina.'}
          </p>
        ) : (
          <SlotBoard
            slots={day.slots}
            readOnly
            density="compact"
            label={`Termini za ${formatDayMonth(`${date}T12:00:00`)}, usluga ${serviceName}`}
          />
        )}
      </div>
    </div>
  );
}

function VisitUs() {
  const { data: hours, isLoading } = useWorkingHours();

  return (
    <Section tone="white" labelledBy="naslov-dolazak">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionTitle id="naslov-dolazak" description={site.address.directions}>
            Gdje smo i kad radimo
          </SectionTitle>
          <address className="mt-6 not-italic">
            <p className="text-[1.0625rem] font-bold text-ink-950">{fullAddress}</p>
            <p className="mt-2">
              <a href={site.contact.phoneHref} className="font-semibold text-signal-700">
                {site.contact.phone}
              </a>
            </p>
            <p className="mt-1">
              <a href={`mailto:${site.contact.email}`} className="font-semibold text-signal-700">
                {site.contact.email}
              </a>
            </p>
          </address>
          <div className="mt-6">
            <ButtonLink to="/lokacija" variant="outline">
              Karta i upute za dolazak
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-sign border-2 border-ink-950 bg-white">
          <h3 className="border-b-2 border-ink-950 bg-ink-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-ink-700">
            Radno vrijeme
          </h3>
          {isLoading ? (
            <div className="space-y-px p-1">
              {Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-10 rounded-none" />
              ))}
            </div>
          ) : (
            <dl className="divide-y divide-ink-100">
              {hours?.map((entry) => (
                <div key={entry.dayOfWeek} className="flex items-baseline justify-between px-4 py-2.5">
                  <dt className="font-semibold capitalize text-ink-900">{weekdayName(entry.dayOfWeek)}</dt>
                  <dd
                    className={
                      entry.closed
                        ? 'font-semibold text-ink-500'
                        : 'font-bold tabular-nums text-ink-950'
                    }
                  >
                    {entry.closed
                      ? 'Zatvoreno'
                      : `${trimSeconds(entry.openTime)} – ${trimSeconds(entry.closeTime)}`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </Section>
  );
}
