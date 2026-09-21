import { useSeo } from '@/lib/seo';
import { site, fullAddress } from '@/config/site';
import { Section, SectionTitle } from '@/components/ui/Section';
import { Alert } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';

export function AboutPage() {
  useSeo({
    title: 'O nama',
    description: `${site.name} — vulkanizerski servis u gradu ${site.address.city}. Zamjena guma, balansiranje, popravci i hotel za gume.`,
    path: '/o-nama',
  });

  return (
    <Section tone="white" labelledBy="naslov-o-nama">
      <SectionTitle id="naslov-o-nama"
        level={1}>O nama</SectionTitle>

      {/* NAMJERNO: ovdje NEMA izmišljenih godina iskustva, broja zadovoljnih
          stranaka ni certifikata. Takvi podaci su tvrdnje o stvarnoj tvrtki i
          smije ih napisati samo klijent. */}
      <Alert tone="warning" title="Ovaj tekst mora napisati klijent" className="mt-6">
        Sadržaj ispod je zamjenski i namjerno ne sadrži nikakve tvrdnje o iskustvu, broju
        stranaka ni certifikatima — takve podatke ne izmišljamo. Klijent ovdje upisuje
        stvarnu priču servisa.
      </Alert>

      <div className="mt-8 max-w-[68ch] space-y-5 text-[1.0625rem] leading-relaxed text-asphalt-700">
        <p>
          <strong className="text-asphalt-950">{site.name}</strong> je vulkanizerski servis na
          adresi {fullAddress}. Radimo na osobnim vozilima: sezonska zamjena guma,
          montaža i demontaža, balansiranje, popravak i krpanje guma te sezonsko čuvanje
          kompleta.
        </p>
        <p>
          Radionica ima {site.bayCount} radna mjesta, što znači da u istom terminu možemo
          primiti više vozila. Zbog toga sustav rezervacija prikazuje koliko je mjesta u
          pojedinom terminu još slobodno, umjesto samo „slobodno / zauzeto".
        </p>
        <p>
          U sezoni zamjene guma termini se popune brzo. Online rezervacija postoji upravo
          zato da ne morate zvati i čekati: vidite stanje i uzmete termin koji vam odgovara.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/rezervacija">Rezerviraj termin</ButtonLink>
        <ButtonLink to="/kontakt" variant="outline">
          Kontakt
        </ButtonLink>
      </div>
    </Section>
  );
}
