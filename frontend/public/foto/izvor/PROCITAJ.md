# Originali fotografija

Ovdje idu **originalne fotografije u punoj rezoluciji**, pod nazivom mjesta na
stranici. Izvedenice (AVIF, WebP, JPEG) i manifest rade se iz njih:

```bash
pip install pillow fonttools brotli
python3 scripts/build-images.py
```

| Datoteka | Gdje se vidi | Omjer | Najmanja korisna širina |
|---|---|---|---|
| `radionica-hero.jpg` | Pozadina prvog ekrana | 16:9 | 2400 px |
| `hotel-za-gume.jpg` | Sekcija „Hotel za gume" | 4:3 | 1200 px |
| `o-nama.jpg` | Stranica „O nama" | 3:2 | 1200 px |
| `zamjena-guma.jpg` | Uvod stranice „Usluge" | 3:2 | 1200 px |

Podržani su `.jpg`, `.jpeg`, `.png` i `.webp`. Slika se obrezuje **iz sredine** na
traženi omjer, pa glavni sadržaj kadra treba biti u sredini.

Za hero vrijedi još jedno: zastor preko fotografije je najgušći lijevo, gdje stoji
naslov, a popušta udesno. Fotografija se zato stvarno vidi tek u desnoj trećini —
kadar neka ima sadržaj desno.

Ako datoteke nema, na tom mjestu se prikazuje označena zamjenska ploča i stranica
i dalje radi.

## Prije objave

- **Autorska prava.** Fotografije sa stocka traže licencu za komercijalnu uporabu.
  Provjeriti prije objave.
- **Osobe na slikama.** Fotografija s prepoznatljivom osobom poručuje da ta osoba
  radi u servisu. Koristiti snimke stvarne radionice i stvarnih zaposlenika, uz
  njihov pristanak.
