import { useSeo } from '@/lib/seo';
import { site } from '@/config/site';
import { Section, SectionTitle } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { ChevronDown } from '@/components/ui/Icon';

const FAQ = [
  {
    question: 'Moram li rezervirati termin ili mogu doći bez najave?',
    answer:
      'Možete doći i bez najave, ali u sezoni zamjene guma vjerojatno ćete čekati. S rezervacijom imate zagarantirano mjesto u točno određeno vrijeme.',
  },
  {
    question: 'Koliko traje zamjena kompletnog seta guma?',
    answer:
      'Za osobno vozilo obično oko sat vremena, uključujući demontažu, montažu i balansiranje sva četiri kotača. Točno trajanje po usluzi piše u cjeniku.',
  },
  {
    question: 'Mogu li otkazati termin?',
    answer:
      'Da, kroz svoj račun, najkasnije dva sata prije termina. Ako je kasnije, nazovite nas — dogovorit ćemo se.',
  },
  {
    question: 'Što je hotel za gume i je li mi isplativ?',
    answer:
      'To je sezonsko čuvanje vašeg kompleta guma kod nas. Isplativ je ako nemate suh i taman prostor za skladištenje ili vam je gnjavaža svaki put prevoziti gume.',
  },
  {
    question: 'Radite li na terenskim i dostavnim vozilima?',
    answer:
      'Radimo, ali cijena se za veće dimenzije i pojačane gume dogovara na licu mjesta. Nazovite prije dolaska da provjerimo imamo li odgovarajuću opremu.',
  },
  {
    question: 'Mogu li kod vas kupiti nove gume?',
    answer:
      'Da. Dostupne dimenzije i cijene vidite u ponudi na stranici, a artikl možete rezervirati online i preuzeti ga u servisu.',
  },
  {
    question: 'Prihvaćate li kartice?',
    answer:
      'Način plaćanja potvrđuje servis. Online plaćanje u ovoj verziji sustava nije implementirano — plaća se pri preuzimanju vozila.',
  },
];

export function FaqPage() {
  useSeo({
    title: 'Česta pitanja',
    description:
      'Odgovori na česta pitanja o rezervaciji termina, trajanju zamjene guma, otkazivanju i hotelu za gume.',
    path: '/cesta-pitanja',
  });

  return (
    <Section tone="white" labelledBy="naslov-faq">
      <SectionTitle
        id="naslov-faq"
        level={1}
        description={`Ako nema odgovora na vaše pitanje, nazovite nas na ${site.contact.phone}.`}
      >
        Česta pitanja
      </SectionTitle>

      <div className="mt-8 divide-y divide-asphalt-200 overflow-hidden rounded-card border border-asphalt-200 bg-white shadow-plate">
        {FAQ.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.0625rem] font-bold text-asphalt-950 marker:content-none hover:text-midnight-800">
              {item.question}
              <ChevronDown
                size={22}
                className="shrink-0 text-midnight-800 transition-transform duration-100 group-open:rotate-180"
              />
            </summary>
            <p className="max-w-[68ch] pb-5 leading-relaxed text-asphalt-700">{item.answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-8">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin
        </ButtonLink>
      </div>
    </Section>
  );
}
