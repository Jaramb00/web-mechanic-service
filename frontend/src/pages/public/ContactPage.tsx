import { useSeo } from '@/lib/seo';
import { site, fullAddress } from '@/config/site';
import { trimSeconds, weekdayName } from '@/lib/format';
import { useWorkingHours } from '@/features/public/queries';
import { Section, SectionTitle } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { Alert, Skeleton } from '@/components/ui/Feedback';
import { MapPin, Phone } from '@/components/ui/Icon';

export function ContactPage() {
  useSeo({
    title: 'Kontakt',
    description: `Kontakt: ${site.contact.phone}, ${fullAddress}. Radno vrijeme i upute za dolazak.`,
    path: '/kontakt',
  });

  const { data: hours, isLoading } = useWorkingHours();

  return (
    <Section tone="white" labelledBy="naslov-kontakt">
      <SectionTitle
        id="naslov-kontakt"
        level={1}
        description="Za termin ne treba poziv — rezervirajte online. Za sve ostalo javite se telefonom ili e-mailom."
      >
        Kontakt
      </SectionTitle>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sign border-2 border-ink-950 bg-white">
          <h2 className="border-b-2 border-ink-950 bg-ink-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-ink-700">
            Podaci za kontakt
          </h2>
          <dl className="divide-y divide-ink-100">
            <div className="flex items-start gap-3 px-4 py-4">
              <Phone size={20} className="mt-0.5 shrink-0 text-signal-700" />
              <div>
                <dt className="text-sm font-semibold text-ink-500">Telefon</dt>
                <dd className="text-lg font-bold">
                  <a href={site.contact.phoneHref} className="text-ink-950 no-underline hover:underline">
                    {site.contact.phone}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-4">
              <MapPin size={20} className="mt-0.5 shrink-0 text-signal-700" />
              <div>
                <dt className="text-sm font-semibold text-ink-500">Adresa</dt>
                <dd className="font-bold text-ink-950">{fullAddress}</dd>
                <dd className="mt-1 text-[0.9375rem] text-ink-700">{site.address.directions}</dd>
              </div>
            </div>
            <div className="px-4 py-4">
              <dt className="text-sm font-semibold text-ink-500">E-mail</dt>
              <dd className="font-bold">
                <a href={`mailto:${site.contact.email}`} className="text-signal-700">
                  {site.contact.email}
                </a>
              </dd>
            </div>
            <div className="px-4 py-4">
              <dt className="text-sm font-semibold text-ink-500">Tvrtka</dt>
              <dd className="text-ink-950">
                {site.legalName} · OIB {site.oib}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-sign border-2 border-ink-950 bg-white">
          <h2 className="border-b-2 border-ink-950 bg-ink-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-ink-700">
            Radno vrijeme
          </h2>
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
                  <dd className={entry.closed ? 'text-ink-500' : 'font-bold tabular-nums text-ink-950'}>
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

      <Alert tone="info" className="mt-6">
        Obrazac za slanje poruke namjerno nije uključen u demo verziju: slanje e-maila nije
        implementirano, pa bi obrazac koji „radi" bio obmana. Za produkciju je to jedna od
        prvih stavki na popisu.
      </Alert>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin
        </ButtonLink>
        <ButtonLink to="/lokacija" variant="outline" size="lg">
          Karta
        </ButtonLink>
      </div>
    </Section>
  );
}
