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

Podržani su `.jpg`, `.jpeg`, `.png` i `.webp`.

Rez po visini ide **iz sredine**, osim za hero, koji reže odozdo (`focus="top"` u
`scripts/build-images.py`) jer je lice u gornjoj trećini kadra i sredina bi ga odrezala.

Širine koje original ne nosi **otpadaju** — skripta ne napuhuje sliku, nego javi koje
su otpale. Ako je original između dvije stepenice ljestvice, dodaje se i njegova
izvorna širina, da prikaz ne bude širi od onoga što je stvarno snimljeno.

Za hero vrijedi još jedno: zastor preko fotografije je najgušći lijevo, gdje stoji
naslov, a popušta udesno. Fotografija se zato stvarno vidi tek u desnoj trećini —
kadar neka ima sadržaj desno.

Ako datoteke nema, na tom mjestu se prikazuje označena zamjenska ploča i stranica
i dalje radi.

## Stanje

| Datoteka | Izvor | Rezolucija | Napomena |
|---|---|---|---|
| `radionica-hero.jpg` | generirana (ChatGPT) | 1536×1024 | za oštar hero treba 2400 px |
| `hotel-za-gume.jpg` | stvarna fotografija skladišta | 1024×681 | |
| `zamjena-guma.jpg` | izrez iz generirane mreže | 627×418 | prikaz ograničen na 560 px zbog rezolucije |
| `o-nama.jpg` | izrez iz generirane mreže | 627×418 | isto |

## Prije objave

- **Osobe na slikama.** Lik na fotografijama je generiran, ne stvarna osoba, pa ne
  postoji pitanje pristanka. I dalje vrijedi da stranica stvarnog obrta time poručuje
  „ovo je naš majstor" — prije objave zamijeniti snimkama stvarne radionice i
  stvarnih zaposlenika.
- **Autorska prava.** Ako se ikad ubaci fotografija sa stocka, treba licenca za
  komercijalnu uporabu.
- **Rezolucija.** Tri od četiri izvora su ispod tražene širine. Skripta to javi pri
  svakom pokretanju; za oštru sliku na modernim ekranima treba veći original.
