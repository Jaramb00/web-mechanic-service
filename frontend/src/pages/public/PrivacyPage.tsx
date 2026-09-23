import { useSeo } from '@/lib/seo';
import { site, fullAddress } from '@/config/site';
import { Section, SectionTitle } from '@/components/ui/Section';
import { Alert } from '@/components/ui/Feedback';
import { LegalBody } from './LegalBody';

export function PrivacyPage() {
  useSeo({
    title: 'Politika privatnosti',
    description: 'Koje podatke prikupljamo, zašto ih prikupljamo i koja su vaša prava.',
    path: '/privatnost',
    noIndex: true,
  });

  return (
    <Section tone="white" labelledBy="naslov-privatnost">
      <SectionTitle id="naslov-privatnost"
        level={1}>Politika privatnosti</SectionTitle>

      <Alert tone="warning" title="Zamjenski tekst: mora ga pregledati pravni stručnjak" className="mt-6">
        Ovo je predložak, a ne pravno mišljenje. Prije objave ga mora pregledati i
        prilagoditi klijent odnosno osoba stručna za zaštitu podataka. Ne tvrdimo da je
        ovako napisan tekst usklađen s GDPR-om ni s hrvatskim propisima.
      </Alert>

      <LegalBody>
        <h2>Tko obrađuje vaše podatke</h2>
        <p>
          Voditelj obrade je {site.legalName}, {fullAddress}, OIB {site.oib}. Za pitanja o
          obradi podataka javite se na {site.contact.email}.
        </p>

        <h2>Koje podatke prikupljamo</h2>
        <ul>
          <li>
            <strong>Podaci računa:</strong> ime i prezime, e-mail adresa, broj telefona i
            lozinka (pohranjena isključivo kao kriptografski sažetak, nikad u čitljivom obliku).
          </li>
          <li>
            <strong>Podaci o vozilu:</strong> marka, model, godina, registracijska oznaka i
            dimenzija guma. Potrebni su da bismo znali što servisiramo.
          </li>
          <li>
            <strong>Podaci o terminima i rezervacijama:</strong> vrijeme termina, odabrana
            usluga, napomene i evidencija obavljenog rada.
          </li>
          <li>
            <strong>Tehnički podaci:</strong> kolačić prijave nužan za rad korisničkog
            računa.
          </li>
        </ul>

        <h2>Zašto ih obrađujemo</h2>
        <p>
          Podatke obrađujemo radi izvršenja usluge koju ste zatražili (rezervacija termina i
          servis vozila) te radi vođenja evidencije obavljenih radova. Bez njih uslugu ne
          možemo pružiti.
        </p>

        <h2>Kolačići</h2>
        <p>
          Koristimo kolačić nužan za prijavu u korisnički račun. Taj kolačić ne traži
          pristanak jer bez njega usluga ne radi. Kolačići za mjerenje posjećenosti
          postavljaju se isključivo ako na to pristanete, i možete pristanak povući
          brisanjem podataka stranice u pregledniku.
        </p>

        <h2>Koliko dugo čuvamo podatke</h2>
        <p>
          <em>TODO(klijent): upisati stvarne rokove čuvanja.</em> Rokovi ovise o poreznim i
          računovodstvenim propisima te o poslovnoj odluci servisa.
        </p>

        <h2>Kome ih prosljeđujemo</h2>
        <p>
          <em>TODO(klijent): navesti stvarne izvršitelje obrade</em>, primjerice pružatelja
          usluge poslužitelja. U ovoj demo verziji podaci se ne prosljeđuju nikome i ne
          napuštaju poslužitelj na kojem aplikacija radi.
        </p>

        <h2>Vaša prava</h2>
        <p>
          Imate pravo na pristup svojim podacima, ispravak netočnih podataka, brisanje,
          ograničenje obrade, prenosivost i prigovor. Zahtjev možete poslati na{' '}
          {site.contact.email}. Također imate pravo podnijeti pritužbu nadzornom tijelu
          (Agencija za zaštitu osobnih podataka).
        </p>
      </LegalBody>
    </Section>
  );
}
