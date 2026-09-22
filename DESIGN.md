# Design

Vizualni sustav ovog projekta, zapisan iz **izgrađenog** sučelja — ne iz namjere.
Sve navedeno stvarno postoji u `frontend/src`.

## Svijet

**Radionica noću.** Duboka tamna ploha, jedno oštro žuto svjetlo, guma kao materijal.
Motorsport grafika, ne korporativni SaaS.

Paleta nije izabrana nego **izmjerena**: žuta `#FFED00` i mornarska `#13233F` očitane su
iz tiska koji je dao klijent. Bijela podloga nosi 73% te grafike, pa je i ovdje stranica
svijetla, a tamne plohe su događaj — hero, zaglavlje, podnožje, „Hotel za gume".

Ono što taj izbor **isključuje**: šarene gradijente, staklo, rešetku jednakih kartica
„ikona + naslov + tekst", nadnaslove iznad naslova, i bilo koju boju koja ne nosi značenje.

> Prethodni sustav bio je „prometno znakovlje" — ravne plohe, uvučena bijela kontura,
> debeli crni rubovi. Zamijenjen je u cijelosti. Jedino što je preživjelo je **semantika
> oblika** kod statusa, i to namjerno: opisana je niže.

---

## Boja

Definirana u `src/styles/theme.css`, blok `@theme`. **Jedino mjesto** koje klijent mijenja
da preuzme vlastiti brand — nijedna komponenta ne sadrži hardkodiranu boju, što je
provjerljivo s `grep -rn '#[0-9a-fA-F]\{6\}' frontend/src --include=*.tsx`.

| Uloga | Token | Vrijednost | Gdje |
|---|---|---|---|
| Potpis brenda, radnja, aktivno stanje | `volt-500` | `#FFED00` | primarni gumb, aktivna navigacija, luk svjetla, naglasci na tamnom |
| Dubina, autoritet | `midnight-800` | `#13233F` | plohe sekcija, sekundarni gumb |
| Najdublja ploha | `midnight-950` | `#070C18` | hero, zaglavlje portala, podnožje |
| Tekst, linije, svijetle podloge | `asphalt-50…950` | `#F6F7F9 … #0B0E13` | tipografija, rubovi, podloga stranice |
| Greška, zabrana | `stop-600` | `#B3111F` | poruke o greškama, destruktivne radnje |
| Slobodno, potvrđeno | `go-500/600` | `#12904A` | slobodni termini, uspjeh |

Asfaltna skala nosi **hladnu, plavkastu primjesu** — pripada istom svijetu kao midnight.

**Strategija:** *Committed*. Mornarska nosi cijele plohe od ruba do ruba. Žuta zauzima
malu površinu uz najveću uočljivost.

### Zabranjene kombinacije

Izračunate, ne procijenjene (`scripts/build-og-image.py` čita iste tokene):

| Kombinacija | Kontrast | Umjesto toga |
|---|---|---|
| `volt-500` kao tekst na bijelom | **1.21:1** | `volt-700` (6.16:1) |
| Bijeli tekst na `volt-500` plohi | **1.21:1** | `asphalt-950` (15.98:1) |
| `stop-600` / `go-600` na tamnoj plohi | **2.25 / 2.60:1** | `stop-300` / `go-300` (7.77 / 8.76:1) |

Zato `volt-700`, `stop-300` i `go-300` postoje — nisu ukras ljestvice nego nadomjestak.
Žuta smije biti **ploha s tamnim tekstom**, veliki grafički element, ili tekst na
mornarskom. Nikad tekst na svijetlom.

---

## Tipografija

Archivo, self-hostan iz `public/fonts`, bez third-party CDN-a. Razlog nije samo brzina:
učitavanje pisma s tuđe domene šalje IP adresu posjetitelja trećoj strani, što je za
stranicu s hrvatskom politikom privatnosti nepotreban rizik.

Archivo je varijabilan **i po težini (100–900) i po širini (62–125%)**, pa se teški
kondenzirani verzali dobivaju iz datoteke koja je ionako učitana.

| Uloga | Postavka | Klasa |
|---|---|---|
| Displejni naslov | italic, `wght 800`, `wdth 75%`, verzali, `ls -0.02em` | `.display` |
| Naslov ploče | uspravno, `wdth 87.5%`, `ls -0.015em` | `.plate-title` |
| Tekst | `wght 400`, `wdth 100%` | zadano |

`.display` nosi naslove sekcija, hero, naziv u zaglavlju i podnožju — i **staje tamo**.
U tekstu bi kosi verzali ubili čitljivost, a hrvatski dijakritici bi se na malim
veličinama slijepili.

Kurziv je zaseban rez (`Archivo Display`), svjesno sužen na znakove koji se u naslovima
stvarno pojavljuju: ASCII + `ČčĆćĐđŠšŽž` + interpunkcija. **62 kB umjesto 195 kB.** Ako
naslov ikad zatreba znak izvan tog skupa, preglednik pada na uspravni rez — vidljivo, ali
ne slomljeno.

Brojke su svugdje tablične (`font-variant-numeric: tabular-nums`): dimenzije, cijene,
vremena i količine moraju se dati usporediti pogledom niz stupac.

---

## Oblik

Gustoća podataka traži mirnoću, pa radijus raste s površinom, a ne svugdje jednako.

| Token | Vrijednost | Gdje |
|---|---|---|
| `radius-plate` | `0.25rem` | sitni znakovi: ćelije termina, brojevi koraka, kosturi učitavanja |
| `radius-control` | `0.625rem` | gumbi, polja, poruke |
| `radius-card` | `1rem` | kartice, tablice, hero, prazna stanja |
| `radius-pill` | `999px` | statusne oznake, navigacija |

### Semantika oblika kod statusa

Jedino preneseno iz starog sustava, jer nije ukras nego **pristupačnost**: za korisnika
koji ne razlikuje boje oblik je jedini nositelj značenja.

| Oblik | Značenje | Gdje |
|---|---|---|
| Pravokutnik | obavještava | `CONFIRMED`, `IN_PROGRESS`; poruke `info` |
| Trokut | upozorava | `PENDING`; poruke `warning` |
| Krug | zabranjuje ili zatvara | `CANCELLED`, `NO_SHOW`, `COMPLETED`; poruke `error`, `success` |

Implementacija: `src/lib/statusLabels.ts`, `src/components/ui/Status.tsx`,
`src/components/ui/Feedback.tsx`. Sama oznaka je pilula; značenje nosi znak unutra, ne obris.

---

## Potpisni detalj: rub svjetla

```css
.edge-light {
  box-shadow:
    inset 0 1px 0 rgb(255 237 0 / 0.22),
    inset 0 0 0 1px rgb(255 255 255 / 0.07);
}
```

Svjetlo u radionici pada odozgo i hvata gornji brid plohe. Crta se kao **unutarnja sjena,
ne kao border**, pa ne pomiče raspored. Parnjak `.edge-light-dark` radi isto na žutoj plohi.

Isti potez je **znak marke** (`BrandMark.tsx`): guma s boka i žuti luk koji joj hvata
gornji lijevi brid. Tijelo je `currentColor` pa se boji iz konteksta — bijelo na tamnom,
mornarsko na svijetlom — bez ijedne varijante komponente. Ista geometrija ponavlja se na
tri mjesta i **mijenja se na sva tri zajedno**: `BrandMark.tsx`, `public/favicon.svg`,
`scripts/build-og-image.py`.

---

## Gradijenti

Tri, i ne više.

| Klasa | Što radi | Gdje |
|---|---|---|
| `.spotlight` | radna lampa: žuto gore lijevo, dubina dolje desno | hero |
| `.surface-dark` | 4% bjeline na vrhu, da tamna ploha ne bude mrtva | tamne kartice, sekundarni gumb |
| `.volt-face` | lice primarnog gumba, `volt-400 → volt-600` | **samo** primarni gumb |

Akcentni gradijent ostaje unutar žute obitelji. Prijelaz u narančastu uveo bi četvrtu boju
i razbio pravilo da sustav nose tri.

---

## Pokret

Jedna krivulja: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` — brz start, mekano slijetanje.
Ona **nadjačava** Tailwindov `ease-out`, pa je dovoljno napisati `ease-out`.

- **Podizanje plohe:** `.lift` diže plohu 2 px i pojačava sjenu; nosi je kartica artikla u
  katalogu, jedina prava interaktivna kartica u sustavu. Gumb ima vlastiti, manji pomak od
  1 px jer često stoji uz polje za unos, gdje veći pomak izgleda kao da raspored poskakuje.
  Nikad skaliranje — tekst bi se zamutio, a susjedne plohe pomaknule.
- **Ulaz u kadar:** `.reveal` / `.reveal-in` preko `useReveal` (`src/lib/reveal.ts`).
  IntersectionObserver i dvije CSS klase umjesto ~30 kB animacijske biblioteke.

`reveal` je **opcija sekcije, ne zadano ponašanje**: alat koji netko gleda cijeli radni
dan ne smije se otkrivati pri svakom scrollu. Uključen je samo na marketinškim
stranicama, i nikad na prvoj sekciji — ona je već u kadru pa bi samo zatreperila.

Jedini ozbiljan kvar animacije je da sadržaj **ostane nevidljiv**. Tri puta koja to
sprječavaju pokriva `src/lib/reveal.test.tsx`: nema IntersectionObservera → odmah vidljivo;
`prefers-reduced-motion` → odmah vidljivo, promatrač se ne pokreće; ušlo u kadar →
otkriveno i **prestaje se pratiti**, jer ponovno skrivanje pri scrollu prema gore smeta
čitanju.

---

## Ilustracije

`src/components/ui/EmptyArt.tsx` — četiri crteža praznih stanja (termini, vozila, zaliha,
obavijesti), pisani u SVG-u, ne generirani kao slike:

- boje dolaze iz `currentColor` i volt tokena, pa prate temu umjesto da su zamrznute u pikselima;
- ~1 kB po komadu umjesto ~150 kB, bez mrežnog zahtjeva i bez skoka rasporeda;
- oštri na svakoj gustoći piksela.

Svi su `aria-hidden`: poruku nose naslov i opis ispod. `EmptyState` uz `illustration`
prima i `icon` — za mjesta gdje bi crtež bio prevelik (uži stupci, dijalozi).

Gume su crtane kao **valjci** (bočni plašt + gornja elipsa), s ispunom i redom crtanja
odozdo prema gore. Bez toga se donje vide kroz gornje i stog se čita kao hrpa tanjura.

---

## Fotografije

Cjevovod: originali u `frontend/public/foto/izvor/`, izvedenice i manifest radi
`scripts/build-images.py`.

```bash
pip install pillow fonttools brotli
python3 scripts/build-images.py
```

Svako mjesto dobiva **AVIF i WebP u tri širine** i jedan JPEG kao zadnju zamjenu.
Razlika nije kozmetička: hero je 19 kB u AVIF-u i 163 kB u JPEG-u. `<Picture>` nudi
formate tim redom i pušta preglednik da uzme prvi koji zna.

Skripta u `src/config/photos.ts` upisuje **stvarne dimenzije** izvedenica. One idu u
`width`/`height` na `<img>`, pa preglednik rezervira prostor prije nego slika stigne —
izmjereni CLS na početnoj je **0,0012**. Naziv mjesta je tipiziran, pa je pogrešno
ime greška pri prevođenju, a ne slomljena slika u pregledniku.

**Prednost dohvata nosi samo hero.** On je u prvom ekranu i gotovo sigurno LCP element,
pa ide `eager` uz `fetchpriority="high"`. Sve ostalo je `lazy` — ista postavka na slici
ispod preloma otima propusnost onome što se vidi.

### Zamjenske ploče

Ako originala nema, skripta ne puca nego nacrta označenu ploču u bojama teme, s natpisom
i nazivom datoteke koju treba spremiti. Prazno mjesto se previdi; ploča s natpisom
„ZAMJENSKA FOTOGRAFIJA" se ne previdi. Manifest takvo mjesto nosi kao `placeholder: true`.

### Zastor u herou

```css
.hero-scrim { /* 0.95 -> 0.88 -> 0.58 alfe, ulijevo najgušće */ }
```

Zastor je najgušći lijevo, gdje stoji tekst, i popušta udesno da se fotografija vidi.
U zoni teksta alfa nikad ne pada ispod 0,78, pa je **čitljivost zajamčena bez obzira na
to koliko je fotografija svijetla** — provjereno i računski i mjerenjem piksela u
pregledniku: najgori slučaj na zamjenskoj ploči je bijeli naslov **9,04:1**.

Posljedica koju treba znati: fotografija se stvarno vidi tek u desnoj trećini heroa.
Kadar zato treba imati sadržaj desno, a ne u sredini.

---

## Slika za dijeljenje linka

`og:image` mora biti **raster**: Facebook, WhatsApp, Viber, LinkedIn ni X ne prikazuju SVG.
Isto vrijedi za `apple-touch-icon`, koji iOS ne prihvaća kao SVG.

Zato `scripts/build-og-image.py`, a ne ručno nacrtana slika: naziv servisa je podatak koji
klijent mijenja, pa slika mora moći nastati ponovno. Skripta čita naziv iz `site.ts` i
boje iz `theme.css`.

```bash
pip install pillow fonttools brotli
python3 scripts/build-og-image.py
```

**Pokrenuti je nakon svake promjene naziva servisa ili tokena boje.**

---

## Šrafura zauzetog termina

```css
.hatched {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 4px,
                    var(--color-asphalt-200) 4px, var(--color-asphalt-200) 5px);
}
```

Zauzeti termin se **ne skriva** nego šrafira i precrtava. U sezoni je vidljiva popunjenost
dio poruke: posjetitelj mora vidjeti da mjesta nestaju. Isti tretman nose neradni dani u
traci dana — dan na koji se ne može doći ne smije izgledati kao da se može odabrati.

---

## Podaci o klijentu

Naziv servisa je stvaran. **Sve ostalo je placeholder** s `TODO(klijent)` oznakom u
`src/config/site.ts`: OIB, adresa, telefon, e-mail, koordinate, broj radnih mjesta, domena.
Ne izmišljati ih.

Pravne stranice su placeholder tekst s vidljivom oznakom da ih mora pregledati pravnik —
ne tvrditi pravnu usklađenost.
