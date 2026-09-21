import { useSeo } from '@/lib/seo';
import { site, fullAddress, googleMapsEmbedUrl, openStreetMapLink } from '@/config/site';
import { Section, SectionTitle } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';

export function LocationPage() {
  useSeo({
    title: 'Lokacija',
    description: `Kako doći do servisa: ${fullAddress}. ${site.address.directions}`,
    path: '/lokacija',
  });

  return (
    <Section tone="white" labelledBy="naslov-lokacija">
      <SectionTitle id="naslov-lokacija"
        level={1} description={site.address.directions}>
        Lokacija
      </SectionTitle>

      <Alert tone="warning" className="mt-6">
        Koordinate na karti su zamjenske i pokazuju centar grada. Klijent ih zamjenjuje
        stvarnima u <code className="font-bold">src/config/site.ts</code>.
      </Alert>

      <div className="mt-6 overflow-hidden rounded-control border-2 border-asphalt-950">
        {/* Karta se učitava lijeno: većini posjetitelja treba adresa, ne karta,
            a iframe inače blokira prvo iscrtavanje stranice. */}
        <iframe
          title={`Karta s lokacijom servisa — ${fullAddress}`}
          src={googleMapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[22rem] w-full border-0 sm:h-[28rem]"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-[1.0625rem] font-bold text-asphalt-950">{fullAddress}</p>
        <a
          href={openStreetMapLink}
          target="_blank"
          rel="noreferrer noopener"
          className="font-semibold text-midnight-800"
        >
          Otvori u karti
        </a>
      </div>

      <div className="mt-8">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin
        </ButtonLink>
      </div>
    </Section>
  );
}
