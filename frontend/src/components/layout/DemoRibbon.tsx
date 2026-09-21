import { IS_DEMO } from '@/config/site';

/**
 * Traka koja jasno kaže da je ovo demo.
 *
 * Namjerno je na vrhu i vidljiva: klijent na prezentaciji mora u svakom
 * trenutku znati da su podaci izmišljeni, a ne se pitati jesu li stvarni.
 */
export function DemoRibbon() {
  if (!IS_DEMO) return null;
  return (
    <p className="border-b-2 border-asphalt-950 bg-volt-500 px-4 py-1.5 text-center text-xs font-bold text-asphalt-950">
      DEMO VERZIJA · svi podaci, cijene i kontakti su zamjenski i služe samo za prikaz
    </p>
  );
}
