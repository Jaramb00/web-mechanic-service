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
    widths: [960, 1536],
    width: 1536,
    height: 864,
    fallbackWidth: 1536,
    placeholder: false,
  },
  'hotel-za-gume': {
    widths: [480, 800, 1024],
    width: 1024,
    height: 768,
    fallbackWidth: 800,
    placeholder: false,
  },
  'o-nama': {
    widths: [480, 627],
    width: 627,
    height: 418,
    fallbackWidth: 627,
    placeholder: false,
  },
  'zamjena-guma': {
    widths: [480, 627],
    width: 627,
    height: 418,
    fallbackWidth: 627,
    placeholder: false,
  },
} as const;
