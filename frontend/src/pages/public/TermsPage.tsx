import { useSeo } from '@/lib/seo';
import { site, fullAddress } from '@/config/site';
import { Section, SectionTitle } from '@/components/ui/Section';
import { Alert } from '@/components/ui/Feedback';
import { LegalBody } from './LegalBody';

export function TermsPage() {
  useSeo({
    title: 'Uvjeti korištenja',
    description: 'Uvjeti korištenja stranice i online rezervacije termina.',
    path: '/uvjeti',
    noIndex: true,
  });

  return (
    <Section tone="white" labelledBy="naslov-uvjeti">
      <SectionTitle id="naslov-uvjeti"
        level={1}>Uvjeti korištenja</SectionTitle>

      <Alert tone="warning" title="Zamjenski tekst: mora ga pregledati pravni stručnjak" className="mt-6">
        Predložak, ne pravno mišljenje. Klijent ga mora prilagoditi svojem poslovanju i dati
        na pregled pravnom stručnjaku prije objave.
      </Alert>

      <LegalBody>
        <h2>Pružatelj usluge</h2>
        <p>
          {site.legalName}, {fullAddress}, OIB {site.oib}.
        </p>

        <h2>Rezervacija termina</h2>
        <p>
          Rezervacijom termina zauzimate mjesto u rasporedu servisa. Rezervacija je
          obvezujuća za servis tek nakon što je potvrdi; do tada je u statusu „na čekanju".
          Servis zadržava pravo predložiti drugi termin ako nastupe okolnosti koje sprječavaju
          rad.
        </p>

        <h2>Otkazivanje i nedolazak</h2>
        <p>
          Termin možete otkazati kroz korisnički račun najkasnije dva sata prije početka. Za
          kasnija otkazivanja javite se telefonom. Ponovljeni nedolazak bez otkazivanja može
          rezultirati odbijanjem budućih online rezervacija.
        </p>

        <h2>Cijene</h2>
        <p>
          Cijene u cjeniku su informativne i odnose se na standardne dimenzije i osobna
          vozila. Konačna cijena dogovara se prije izvođenja radova. Rezervacija artikla ne
          predstavlja kupoprodajni ugovor niti obvezu plaćanja unaprijed.
        </p>

        <h2>Rezervacija artikala</h2>
        <p>
          Rezervacijom artikla zadržavamo količinu za vas. Ako artikl ne preuzmete u
          dogovorenom roku, rezervacija se može poništiti i količina vratiti u prodaju.
        </p>

        <h2>Odgovornost</h2>
        <p>
          <em>TODO(klijent): uskladiti s uvjetima jamstva i osiguranja servisa.</em>
        </p>

        <h2>Izmjene uvjeta</h2>
        <p>
          Uvjeti se mogu mijenjati. Izmijenjeni uvjeti vrijede od trenutka objave na ovoj
          stranici.
        </p>
      </LegalBody>
    </Section>
  );
}
