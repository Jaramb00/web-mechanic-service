import { useSeo } from '@/lib/seo';
import { formatPrice } from '@/lib/format';
import { useServices } from '@/features/public/queries';
import { Section, SectionTitle } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ArrowRight } from '@/components/ui/Icon';
import { Picture } from '@/components/ui/Picture';

const STEPS = [
  {
    title: 'Dolazite na zamjenu guma',
    body: 'Rezervirate termin kao i inače. Recite da želite ostaviti komplet na čuvanje — ili upišite u napomenu pri rezervaciji.',
  },
  {
    title: 'Gume peremo i pregledavamo',
    body: 'Prije spremanja peremo svaku gumu i izmjerimo dubinu profila. Ako je komplet pri kraju vijeka, reći ćemo vam na vrijeme, prije sljedeće sezone.',
  },
  {
    title: 'Spremamo ih na vaše ime',
    body: 'Komplet dobiva oznaku s vašim imenom i registracijom vozila i odlazi u zatvoreni prostor, složen po pravilima struke.',
  },
  {
    title: 'Sljedeću sezonu su spremne',
    body: 'Kad dođete na zamjenu, gume su već izvađene i čekaju. Ne nosite ih, ne čekate i ne tražite mjesto u prtljažniku.',
  },
];

export function TireStoragePage() {
  useSeo({
    title: 'Hotel za gume',
    description:
      'Sezonsko čuvanje guma: pranje, pregled dubine profila, označavanje na vaše ime i skladištenje u zatvorenom prostoru.',
    path: '/hotel-za-gume',
  });

  const { data: services } = useServices();
  const storage = services?.find((service) => service.name.toLowerCase().includes('hotel'));

  return (
    <>
      <Section tone="midnight" labelledBy="naslov-hotel">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div>
            <SectionTitle
              id="naslov-hotel"
              level={1}
              invert
              description="Komplet guma zauzima pola balkona, a u vlažnom podrumu propada brže nego na cesti. Kod nas stoji tamo gdje mu je mjesto."
            >
              Hotel za gume
            </SectionTitle>

            {storage ? (
              <p className="edge-light-dark mt-8 inline-block rounded-control bg-volt-500 px-5 py-3 text-xl font-extrabold tabular-nums text-asphalt-950">
                {formatPrice(storage.price)} po sezoni
              </p>
            ) : null}
          </div>

          <Picture
            name="hotel-za-gume"
            alt="Složeni kompleti guma u zatvorenom skladištu servisa"
            sizes="(min-width: 1024px) 480px, 100vw"
            className="edge-light overflow-hidden rounded-card"
          />
        </div>
      </Section>

      <Section reveal tone="white" labelledBy="naslov-kako">
        <SectionTitle id="naslov-kako">Kako to ide</SectionTitle>

        {/* Redoslijed nosi informaciju — korak 3 nema smisla prije koraka 1 — pa su
            koraci numerirani. */}
        <ol className="mt-8 space-y-px overflow-hidden rounded-card border border-asphalt-200 shadow-plate">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 bg-white px-4 py-5 sm:gap-6 sm:px-6">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-plate bg-midnight-800 text-lg font-extrabold tabular-nums text-white"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-[1.0625rem] font-bold text-asphalt-950">{step.title}</h3>
                <p className="mt-1.5 max-w-[68ch] leading-relaxed text-asphalt-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Alert tone="warning" title="Što treba znati" className="mt-8">
          Gume preuzimamo isključivo uz evidentiranje na vaše ime i vozilo. Rok čuvanja i
          uvjeti preuzimanja navedeni su u ugovoru koji potpisujete pri predaji kompleta.
        </Alert>

        <div className="mt-8">
          <ButtonLink to="/rezervacija" size="lg">
            Rezerviraj termin
            <ArrowRight size={20} />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
