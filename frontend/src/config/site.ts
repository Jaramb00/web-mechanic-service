/**
 * PODACI O SERVISU — SVE VRIJEDNOSTI SU PLACEHOLDERI.
 *
 * ================== ZA KLIJENTA ==================
 * Ovo je jedino mjesto na kojem se mijenjaju podaci o servisu. Nakon zamjene
 * stvarnim podacima treba ponovno pokrenuti build. Ništa od ovoga nije
 * izmišljeno da djeluje uvjerljivo — sve je označeno kao demo upravo zato da
 * se ne zaboravi zamijeniti.
 * =================================================
 */

export const IS_DEMO = true;

export const site = {
  /** TODO(klijent): stvarni naziv servisa. */
  name: 'Vulkanizerski servis',
  legalName: 'Naziv obrta d.o.o.',
  /** TODO(klijent): OIB. */
  oib: '00000000000',

  tagline: 'Gume, balansiranje i hotel za gume',

  contact: {
    /** TODO(klijent): stvarni broj telefona. */
    phone: '+385 1 000 0000',
    phoneHref: 'tel:+38510000000',
    /** TODO(klijent): stvarni e-mail. */
    email: 'info@primjer-vulkanizer.hr',
  },

  address: {
    /** TODO(klijent): stvarna adresa. */
    street: 'Primjerska ulica 1',
    postalCode: '10000',
    city: 'Zagreb',
    country: 'Hrvatska',
    /** TODO(klijent): stvarne koordinate — trenutne pokazuju centar Zagreba. */
    lat: 45.815,
    lng: 15.9819,
    /** TODO(klijent): kratka uputa kako doći (npr. „iza benzinske postaje"). */
    directions: 'Ulaz iz dvorišta, parking ispred radionice.',
  },

  /** TODO(klijent): stvarni broj radnih mjesta u radionici. */
  bayCount: 3,

  /** Kanonski URL. TODO(klijent): stvarna domena. */
  url: 'https://www.primjer-vulkanizer.hr',
} as const;

export const googleMapsEmbedUrl =
  `https://www.openstreetmap.org/export/embed.html` +
  `?bbox=${site.address.lng - 0.006},${site.address.lat - 0.003},` +
  `${site.address.lng + 0.006},${site.address.lat + 0.003}` +
  `&layer=mapnik&marker=${site.address.lat},${site.address.lng}`;

export const openStreetMapLink =
  `https://www.openstreetmap.org/?mlat=${site.address.lat}&mlon=${site.address.lng}#map=17/${site.address.lat}/${site.address.lng}`;

export const fullAddress =
  `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
