# Design

Vizualni sustav ovog projekta, zapisan iz **izgrađenog** sučelja — ne iz namjere.
Sve navedeno stvarno postoji u `frontend/src`.

## Svijet

**Hrvatsko prometno znakovlje, uzeto kao gramatika a ne kao ukras.**

Vozač te znakove čita svaki dan i zna ih pročitati u pokretu, po suncu i po kiši. Sustav
posuđuje njihova pravila: boja ima značenje, oblik ima značenje, ploha je ravna, a rub
ploče nosi uvučenu bijelu konturu.

Ono što taj izbor **isključuje**: tamni hero s fotografijom gume i narančastim gumbom,
rešetka jednakih kartica „ikona + naslov + tekst", gradijenti, staklo, meke sjene i
nadnaslovi iznad naslova.

---

## Boja

Definirana u `src/styles/theme.css`, blok `@theme`. **Jedino mjesto** koje klijent mijenja
da preuzme vlastiti brand — nijedna komponenta ne sadrži hardkodiranu boju.

Boja je **isključivo semantička**. Ništa ne dobiva boju zato što je lijepa.

| Uloga | Token | Vrijednost | Kad se koristi |
|---|---|---|---|
| Obavijest, orijentacija, identitet | `signal-700` | `#0b4c8c` | zaglavlje, informativne plohe, zaglavlja koraka |
| **Radnja koja se poduzima sada** | `work-500` | `#ffc400` | **samo** primarni gumb i odabrani termin |
| Zabrana, greška, destruktivna radnja | `stop-600` | `#b3121f` | poruke o greškama, potvrde brisanja |
| Slobodno, potvrđeno, uspjeh | `go-500/600` | `#1e8a4c` | slobodni termini, uspješne radnje |
| Asfalt (tekst, linije, podloge) | `ink-50…950` | `#f4f4f4 … #161616` | tipografija, rubovi, tamne podloge |

Asfaltna skala je **neutralno siva, bez plave ili tople primjese**. Plavo-crna podloga je
zadana paleta, ne materijal ovog svijeta.

**Strategija:** *Committed*. Signalna plava nosi cijele plohe od ruba do ruba (zaglavlje,
hero, sekcija „Hotel za gume", zaglavlja koraka rezervacije), a ne raspršene akcente.
Žuta zauzima malu površinu uz najveću uočljivost — kao znak radova na cesti.

Kontrast je provjeren na WCAG AA u svim stanjima, uključujući focus i disabled.

---

## Oblik

Oblik nosi značenje jednako kao boja — za korisnika koji ne razlikuje boje to je jedini
nositelj značenja.

| Oblik | Značenje | Gdje |
|---|---|---|
| Pravokutnik | obavještava | statusi `CONFIRMED`, `IN_PROGRESS`; poruke `info` |
| Trokut | upozorava | status `PENDING`; poruke `warning` |
| Krug | zabranjuje ili zatvara | statusi `CANCELLED`, `NO_SHOW`, `COMPLETED`; poruke `error`, `success` |

Implementacija: `src/lib/statusLabels.ts` (mapa), `src/components/ui/Status.tsx` (oznake),
`src/components/ui/Feedback.tsx` (poruke).

---

## Potpisni detalj: uvučena bijela kontura

```css
.keyline { box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.9); }
```

Kao na stvarnom znaku. Crta se kao **unutarnja sjena, ne kao border**, pa ne pomiče
raspored. Nosi je svaka plava ili tamna ploha: hero, zaglavlja koraka rezervacije, sažetak,
potvrda rezervacije.

Parnjak `.keyline-dark` radi isto na žutoj plohi.

---

## Šrafura zauzetog termina

```css
.hatched {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 4px,
                    var(--color-ink-200) 4px, var(--color-ink-200) 5px);
}
```

Zauzeti termin se **ne skriva** nego šrafira i precrtava, kao prekriženi znak. U sezoni je
vidljiva popunjenost dio poruke: posjetitelj mora vidjeti da mjesta nestaju.

Isti tretman nose i neradni dani u traci dana — dan na koji se ne može doći ne smije
izgledati kao da se može odabrati.

---

## Tipografija

**Archivo**, varijabilno pismo, jedna obitelj za cijelo sučelje.

- **Self-hostano** (`public/fonts/*.woff2`, 176 kB za oba podskupa). Razlog nije samo
  brzina: učitavanje pisma s tuđe domene šalje IP adresu posjetitelja trećoj strani, što je
  za stranicu s politikom privatnosti nepotreban rizik.
- Podskupovi `latin` i `latin-ext` s odvojenim `unicode-range` — hrvatski dijakritici se
  učitavaju samo kad zatrebaju.
- **Os širine se koristi**, ne samo deklarira: `.plate-title` zbija naslov na `87.5%`, kao
  naziv odredišta na znaku koji mora stati u ploču fiksne širine.
- **Tablične znamenke posvuda** (`font-variant-numeric: tabular-nums` na `body`, `input`,
  `select`, `textarea`, `button`). Dimenzije, cijene, vremena i količine moraju se dati
  usporediti pogledom niz stupac.

Mjera retka u tekstu za čitanje ograničena je na ~68 znakova (`LegalBody`, opisi sekcija).

---

## Komponente

| Komponenta | Uloga | Datoteka |
|---|---|---|
| `SlotBoard` | **potpisna interakcija** — tabla termina | `components/SlotBoard.tsx` |
| `Plate` | osnovna ploha (`signal` / `work` / `white` / `ink` / `quiet`) | `components/ui/Plate.tsx` |
| `Button` / `ButtonLink` | `primary` žuti, `secondary` plavi, `outline`, `ghost`, `danger` | `components/ui/Button.tsx` |
| `DataTable` | linirana tabla s tabličnim znamenkama | `components/ui/Table.tsx` |
| `Field` / `TextField` / `SelectField` | polja s vidljivom oznakom i vezanom greškom | `components/ui/Field.tsx` |
| `Alert` / `EmptyState` / `ErrorState` / `Skeleton` | stanja sučelja | `components/ui/Feedback.tsx` |
| `StatusBadge` | status s oblikom i bojom | `components/ui/Status.tsx` |
| `ConfirmDialog` | potvrda destruktivne radnje, izvorni `<dialog>` | `components/ui/ConfirmDialog.tsx` |
| Ikone | vlastiti set, mreža 24×24, jedan potez 1.75 | `components/ui/Icon.tsx` |

Ikone su **crtane**, ne emoji ni unicode znakovi, i dijele jednu debljinu poteza.

### Tabla termina

Slobodan termin je bijela pločica sa **zelenom gornjom linijom** (5 px). Zauzeti je
šrafiran i precrtan. Odabrani se prevrće u **žuto s crnim tekstom**.

Ista komponenta u dvije gustoće: `compact` na naslovnici (tri dana, samo za čitanje) i
`full` u trećem koraku rezervacije (odabirno).

Upravlja se i tipkovnicom, kao mreža: strelice pomiču fokus **samo po slobodnim
terminima** (roving tabindex), Home i End skaču na prvi i zadnji. Zauzeti termini ostaju
vidljivi, ali izvan reda za fokus.

---

## Raspored

- Kontejner javne stranice: `max-w-6xl`, portala `max-w-7xl`, bočni razmak 16 px.
- Razmak po skali od 4 px (Tailwind), `gap-px` za linirane skupine.
- Radijusi: `--radius-plate` 4 px, `--radius-sign` 8 px. Znakovi imaju male, dosljedne
  radijuse — ne mekane kartice.
- **Dubina:** samo dvije sjene (`--shadow-plate`, `--shadow-raised`), obje s pomakom **i**
  zamućenjem. Obojani halo bez pomaka je ukras i ne postoji u sustavu.
- Meta za dodir najmanje 44 px (`min-h-11` na gumbima i poljima).

---

## Motion

**120 ms, linearno.** Znakovi se ne njišu.

Jedina autorska gesta je **prevrtanje pločice termina**: promjena boje bez skaliranja,
oštro kao promjena znaka na cesti. Sve ostalo su prijelazi boje na hover i focus.

`prefers-reduced-motion: reduce` gasi sve prijelaze i animacije.

---

## Rubne površine preglednika

Dijelovi koje se lako zaboravi, a nose zadane vrijednosti koje ne pripadaju nijednom
sustavu — ovdje su tematizirani iz palete:

- označavanje teksta (`::selection`) — žuta podloga, crni tekst;
- kursor za unos (`caret-color`) i `accent-color` — signalno plava;
- klizač (`scrollbar-color` i `::-webkit-scrollbar`) — asfaltna skala;
- **focus prsten**: 3 px signalno plavi s odmakom 2 px, a na plavoj i tamnoj plohi žuti,
  jer plavi prsten na plavoj plohi ne bi bio vidljiv. Nikad se ne uklanja.

---

## Modovi površina

| Mod | Površine | Pravilo |
|---|---|---|
| **Persuade** | naslovnica, usluge, cjenik, hotel za gume, ponuda, kontakt, lokacija, o nama, FAQ | prvi ekran nosi činjenicu i jednu radnju |
| **Operate** | rezervacija, svi portali | skenabilnost i stanje ispred izražajnosti; svijet se nasljeđuje u gušćem registru |
| **Read** | privatnost, uvjeti, 404 | mjera retka i struktura ispred svega |

Rezervacija je *Operate*, ali nosi isti svijet: asfaltna podloga, bijele ploče na njoj,
plava zaglavlja koraka s uvučenom konturom.

---

## Što je svjesno izostavljeno

- **Tamna tema.** Znakovni sustav je fiksan par tinte i podloge; tamna varijanta nije
  njegova gramatika. Nije u opsegu demoa.
- **Fotografije.** Svijet je građen tako da mu ne trebaju — znak je hero. Klijent nema
  fotografije radionice, a izmišljati ih ne dolazi u obzir.
- **Animacije pri ulasku u vidno polje.** Ne nose informaciju i usporavaju prvi dojam.

---

## Za klijenta: kako preuzeti vlastiti brand

1. Zamijenite vrijednosti u `@theme` bloku u `src/styles/theme.css`. Sve ostalo se povuče
   samo.
2. Zamijenite pismo u istom bloku (`--font-sans`) i datoteke u `public/fonts/`.
3. Zamijenite podatke o servisu u `src/config/site.ts`.

Semantiku boja (plava = obavijest, žuta = radnja, crvena = zabrana, zelena = dopušteno)
vrijedi zadržati i s drugim tonovima — ona nosi značenje, ne samo izgled.
