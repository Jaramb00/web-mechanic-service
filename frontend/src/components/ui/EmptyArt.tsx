import { cn } from '@/lib/cn';

/**
 * ILUSTRACIJE PRAZNIH STANJA.
 *
 * Crtane u SVG-u, a ne generirane kao slike, i to iz tri razloga koja se ovdje
 * stvarno isplate:
 *  - boje dolaze iz `currentColor` i volt tokena, pa ilustracija prati temu
 *    umjesto da je zamrznuta u pikselima;
 *  - ~1 kB po komadu umjesto ~150 kB, bez mrežnog zahtjeva i bez skoka
 *    rasporeda dok se slika učitava;
 *  - oštre su na svakoj rezoluciji i gustoći piksela.
 *
 * Jezik je isti kao kod znaka marke: tanke linije, guma kao oblik, žuti potez
 * koji označava ono što nedostaje. Namjerno su suzdržane — prazno stanje je
 * usputna poruka, ne ilustracija koja traži pažnju.
 *
 * Sve su ukrasne: omotač u `EmptyState` nosi `aria-hidden`, a poruku nose
 * naslov i opis ispod.
 */
type Kind = 'appointments' | 'vehicles' | 'inventory' | 'notifications';

export function EmptyArt({ kind, className }: { kind: Kind; className?: string }) {
  const Art = ART[kind];
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className={cn('h-28 w-28 text-asphalt-300 sm:h-36 sm:w-36', className)}
      aria-hidden="true"
    >
      <Art />
    </svg>
  );
}

const VOLT = 'var(--color-volt-500)';

/** Tabla termina: tri zauzeta mjesta, jedno slobodno označeno žutim. */
function Appointments() {
  return (
    <>
      <rect x="22" y="34" width="116" height="94" rx="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 58h116" stroke="currentColor" strokeWidth="3" />
      <path d="M52 24v18M108 24v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Zauzeti termini — šrafirani, kao na tabli slobodnih mjesta */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={38 + i * 32}
          y={74}
          width="22"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      ))}
      {/* Jedno slobodno mjesto, i ono je ono što nedostaje */}
      <rect x="38" y="102" width="22" height="16" rx="3" fill={VOLT} />
      <rect x="70" y="102" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="102" y="102" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
    </>
  );
}

/** Kotač s plusom: nema upisanog vozila, dodaj ga. */
function Vehicles() {
  return (
    <>
      <circle cx="72" cy="80" r="42" stroke="currentColor" strokeWidth="3" />
      <circle cx="72" cy="80" r="14" stroke="currentColor" strokeWidth="3" />
      <path
        d="M72 46v14M45 97l12-7M99 97l-12-7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Luk svjetla — isti potez kao na znaku marke */}
      <path d="M30 80a42 42 0 0 1 22-36.8" stroke={VOLT} strokeWidth="4" strokeLinecap="round" />
      {/* Značka „dodaj" */}
      <circle cx="120" cy="116" r="18" fill={VOLT} />
      <path
        d="M120 108v16M112 116h16"
        stroke="var(--color-asphalt-950)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </>
  );
}

/**
 * Složene gume — prazna polica skladišta.
 *
 * Svaka guma je valjak (bočni plašt + gornja elipsa), a ne sama elipsa: bez
 * plašta i bez ispune stog se čita kao hrpa tanjura ili kao opruga. Crta se
 * odozdo prema gore, pa gornja guma zaklanja donju.
 */
function Inventory() {
  const RX = 44;
  const RY = 15;
  const HEIGHT = 20;
  const LEFT = 80 - RX;
  const RIGHT = 80 + RX;

  return (
    <>
      {[0, 1, 2].map((i) => {
        const cy = 98 - i * HEIGHT;
        return (
          <g key={i}>
            <path
              d={`M${LEFT} ${cy} L${LEFT} ${cy + HEIGHT} A${RX} ${RY} 0 0 0 ${RIGHT} ${cy + HEIGHT} L${RIGHT} ${cy} Z`}
              fill="var(--color-asphalt-50)"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <ellipse
              cx="80"
              cy={cy}
              rx={RX}
              ry={RY}
              fill="var(--color-asphalt-50)"
              stroke="currentColor"
              strokeWidth="3"
            />
            <ellipse
              cx="80"
              cy={cy}
              rx="16"
              ry="5.5"
              fill="var(--color-asphalt-100)"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          </g>
        );
      })}
      {/* Luk svjetla na gornjoj gumi — isti potez kao na znaku marke */}
      <path
        d={`M${LEFT} 58 A${RX} ${RY} 0 0 1 80 43`}
        stroke={VOLT}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </>
  );
}

/** Zvono bez ijedne obavijesti — žuta točka je prazna, ne puna. */
function Notifications() {
  return (
    <>
      <path
        d="M52 108V74a28 28 0 0 1 56 0v34l10 12H42l10-12Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M80 46v-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 130a12 12 0 0 0 24 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="110" cy="56" r="11" fill="var(--color-asphalt-50)" stroke={VOLT} strokeWidth="3.5" />
    </>
  );
}

const ART: Record<Kind, () => React.JSX.Element> = {
  appointments: Appointments,
  vehicles: Vehicles,
  inventory: Inventory,
  notifications: Notifications,
};
