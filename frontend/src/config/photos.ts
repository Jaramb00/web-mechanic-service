/**
 * GENERIRANO — ne uređivati ručno.
 *
 * Nastaje iz `scripts/build-images.py`, koji čita originale iz
 * `public/foto/izvor/`. Dimenzije su stvarne dimenzije izvedenica, pa
 * `<Picture>` njima rezervira prostor i raspored ne poskoči.
 *
 * `placeholder: true` znači da originala nema i da je na tom mjestu
 * označena zamjenska ploča.
 */
export type PhotoName = keyof typeof photos;

export const photos = {
  'radionica-hero': {
    widths: [960, 1600, 2400],
    width: 2400,
    height: 1350,
    fallbackWidth: 1600,
    placeholder: true,
  },
  'hotel-za-gume': {
    widths: [480, 800, 1200],
    width: 1200,
    height: 900,
    fallbackWidth: 800,
    placeholder: true,
  },
  'o-nama': {
    widths: [480, 800, 1200],
    width: 1200,
    height: 800,
    fallbackWidth: 800,
    placeholder: true,
  },
  'zamjena-guma': {
    widths: [480, 800, 1200],
    width: 1200,
    height: 800,
    fallbackWidth: 800,
    placeholder: true,
  },
} as const;
