import { useSeo } from '@/lib/seo';
import { Section } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { site } from '@/config/site';

/**
 * Stranica 404 u jeziku sustava: znak zabrane prolaza, pa preusmjerenje.
 */
export function NotFoundPage() {
  useSeo({
    title: 'Stranica nije pronađena',
    description: 'Tražena stranica ne postoji.',
    path: '/404',
    noIndex: true,
  });

  return (
    <Section tone="white">
      <div className="mx-auto max-w-[52ch] text-center">
        <div
          aria-hidden="true"
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-stop-600 bg-white"
        >
          <span className="block h-[10px] w-16 rotate-[-45deg] bg-stop-600" />
        </div>

        <h1 className="mt-8 display text-4xl text-asphalt-950">
          Ovdje nema ničega
        </h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-asphalt-700">
          Stranica koju tražite ne postoji ili je premještena. Greška 404.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/">Na naslovnicu</ButtonLink>
          <ButtonLink to="/rezervacija" variant="outline">
            Rezerviraj termin
          </ButtonLink>
        </div>

        <p className="mt-8 text-[0.9375rem] text-asphalt-500">
          Ako ste ovdje završili s naše stranice, javite nam na{' '}
          <a href={site.contact.phoneHref} className="font-semibold text-midnight-800">
            {site.contact.phone}
          </a>
          .
        </p>
      </div>
    </Section>
  );
}
