---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

## Scope and mode

`frontend/src` — cijeli frontend jednog vulkanizerskog servisa. Javne rute
(Home, Usluge, Cjenik, Hotel za gume, O nama, Kontakt, Lokacija, FAQ, Rezervacija,
Privatnost, Uvjeti, 404) su **Persuade**. Portali (kupac, admin, majstor, skladište)
su **Operate** i nasljeđuju isti svijet u gušćem registru.

## Audience and job

Privatni vozač u Hrvatskoj, najčešće na mobitelu, u sezonskoj navali ili s
probušenom gumom. Posao: doći do konkretnog slobodnog termina bez telefonskog
poziva, ili do broja telefona i adrese u tri sekunde. Osoblje servisa: majstor na
tabletu, skladištar i vlasnik na računalu.

## Direction contract

THESIS: Ova stranica ne uvjerava da je servis dobar — ona pokazuje kad ima mjesta.
Odbija se kategorijski zadan raspored: tamni hero s fotografijom gume, naslov
„Vaš pouzdan partner", tri kartice usluga i traka recenzija. Umjesto dojma se
nudi činjenica, i to ona zbog koje je posjetitelj došao: prvi slobodan termin.

OWN-WORLD: Sustav hrvatskog prometnog znakovlja, uzet kao gramatika a ne kao ukras.
Boja je isključivo semantička: signalno plava = obavijest i orijentacija (nosi cijele
plohe, 30–60% javne površine, od ruba do ruba), radno žuta = radnja koja se poduzima
sada (jedina boja primarnog gumba), zabranska crvena = greška i destruktivna radnja,
dopusna zelena = slobodno i potvrđeno. Ništa ne dobiva boju zbog ljepote. Oblik nosi
značenje kao na cesti: pravokutnik obavještava, trokut upozorava, krug zabranjuje —
i to je sustav statusnih oznaka. Plohe su ravne: bez gradijenata, bez mekih sjena.
Potpisni detalj je **unutarnja bijela kontura** uvučena od ruba svake plohe, kao na
stvarnom znaku. Pismo: Archivo (varijabilno, os širine), jedna obitelj, tablične
znamenke posvuda gdje stoje dimenzije, cijene, vremena i količine.
RAISE (donacija odbijenog smjera „Radionička tabla"): disciplina table — cjenik i sve
tablice u portalima grade se kao gusto linirane table s tabličnim znamenkama, a ne kao
stog kartica sa sjenama. Preuzeta je gustoća i hrabrost mreže, ne izgled table.

STORY: Posjetitelj u prvom ekranu shvati da ovaj servis ima slobodnih termina i kada;
povjeruje da je rezervacija stvarna jer vidi konkretan datum i sat, a ne obećanje; i
učini jedno od dvoje — rezervira termin ili nazove. Sve ostalo (cjenik, hotel za gume,
lokacija) služi tome da odluku ne odgodi.

FIRST VIEWPORT: Na asfaltno tamnoj podlozi sjedi jedna plava informativna ploha preko
pune širine, s uvučenom bijelom konturom. U njoj, složeno kao odredište na
autocestovnom znaku: naziv servisa (placeholder) i ispod njega, u tabličnim
znamenkama u veličini naslova, **stvarni prvi slobodan termin dohvaćen s API-ja**
(„sri 24. 9. u 8:30"). Desno od njega, na mobitelu ispod, žuta ploha „Rezerviraj
termin" s crnim tekstom i strelicom. Ispod plohe, u jednom retku i bez ukrasa:
telefon kao poziv, adresa i današnje radno vrijeme. Bez fotografije — znak je hero.

FORM: Prometno znakovlje, kandidat 1 od 7 na mojoj listi po rezonanci (korisnikov
izbor; dodijeljeni indeks bio je 4 — „Radionička tabla", čija je disciplina table
donirana gore). Seed key: 72ce263a. Roll je prošao degradirano — egress policy
blokira roll servis, pa nije bilo challengera ni quality-bar ploča.

SIGNATURE INTERACTION: **Tabla termina.** Slobodni termini su bijele pločice sa
zelenom gornjom linijom; zauzeti su prigušeni i dijagonalno šrafirani — vide se, ne
skrivaju se, jer je vidljiva popunjenost dio poruke u sezoni. Odabrani termin
prevrće se u žuto s crnim tekstom. Ista komponenta stoji malena na naslovnici
(sljedeća tri dana, samo za čitanje) i velika u 4. koraku rezervacije. Upravlja se
i tipkovnicom, kao mreža.

MOTION GRAMMAR: 120 ms, linearno — znakovi se ne njišu. Jedina iznimka je prevrtanje
pločice termina: promjena boje bez skaliranja, oštro kao promjena znaka.
`prefers-reduced-motion: reduce` gasi sve prijelaze.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Constraints

- Sav vidljivi tekst na hrvatskom; kod, API polja i baza na engleskom.
- Podaci o klijentu su placeholderi u `src/config/site.ts`, jasno označeni. Ništa se
  ne izmišlja: nema recenzija, nema brojki, nema certifikata.
- WCAG AA na svim stanjima, meta za dodir ≥ 44 px, puna navigacija tipkovnicom.
- Samo svijetla tema. Znakovni sustav je fiksan par tinta/podloga; tamna varijanta
  nije njegova gramatika i nije u opsegu demoa.

## Unresolved

- Stvarni naziv, adresa, telefon, OIB i koordinate servisa — čeka klijenta.
- Fotografije radionice — nema ih; svijet je namjerno građen tako da mu ne trebaju.
