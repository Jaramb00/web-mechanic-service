import { cn } from '@/lib/cn';
import { photos, type PhotoName } from '@/config/photos';

/**
 * Responzivna fotografija.
 *
 * Nudi AVIF pa WebP pa JPEG, i pušta preglednik da izabere prvi koji zna.
 * Redoslijed je bitan: `<source>` elementi se čitaju odozgo i uzima se prvi
 * podržani, pa AVIF mora biti prvi.
 *
 * Dimenzije dolaze iz manifesta koji generira `scripts/build-images.py`, a ne
 * iz ruke: `width`/`height` na `<img>` daju pregledniku omjer prije nego slika
 * stigne, pa raspored ne poskoči kad se učita. Zato je i naziv tipiziran —
 * krivo napisano ime mjesta je greška pri prevođenju, ne slomljena slika u
 * pregledniku.
 *
 * `alt` je obavezan da bi odluka bila svjesna. Za ukrasne slike proslijediti
 * prazan niz; čitač ekrana ih tada preskače umjesto da čita naziv datoteke.
 */
export function Picture({
  name,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
}: {
  name: PhotoName;
  alt: string;
  sizes: string;
  /**
   * Samo za sliku koja je u prvom ekranu. Isključuje odgodu učitavanja i traži
   * prednost pri dohvatu, jer je takva slika obično LCP element. Na slici
   * ispod preloma ista postavka šteti — otima propusnost onome što se vidi.
   */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const photo = photos[name];
  const srcSet = (extension: 'avif' | 'webp') =>
    photo.widths.map((width) => `/foto/${name}-${width}.${extension} ${width}w`).join(', ');

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={`/foto/${name}-${photo.fallbackWidth}.jpg`}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn('block h-auto w-full', imgClassName)}
      />
    </picture>
  );
}
