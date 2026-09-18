# Implementirane funkcionalnosti

Popis onoga što u demou **stvarno radi**. Sve navedeno može se demonstrirati klijentu
uživo, s podacima koji dolaze iz baze, a ne iz izmišljenog prikaza.

---

## Javna web stranica

| Stranica | Ruta | Napomena |
|---|---|---|
| Naslovnica | `/` | u prvom ekranu prikazuje **stvarni prvi slobodan termin** s API-ja |
| Usluge | `/usluge` | iz baze, s trajanjem i cijenom |
| Cjenik | `/cjenik` | tablični prikaz svih aktivnih usluga |
| Hotel za gume | `/hotel-za-gume` | vlastita stranica s objašnjenjem postupka |
| Ponuda guma i dijelova | `/ponuda-guma` | pretraga, filtar po kategoriji, paginacija |
| O nama | `/o-nama` | tekst koji mora napisati klijent, jasno označeno |
| Kontakt | `/kontakt` | podaci i radno vrijeme iz baze |
| Lokacija | `/lokacija` | karta (OpenStreetMap, lijeno učitana) |
| Česta pitanja | `/cesta-pitanja` | sedam pitanja, izvorni `<details>` elementi |
| Rezervacija | `/rezervacija` | čarobnjak u četiri koraka |
| Privatnost / Uvjeti | `/privatnost`, `/uvjeti` | predlošci s vidljivom oznakom |
| 404 | bilo koja nepoznata ruta | vlastita stranica u jeziku sustava |

Uz to: `robots.txt`, `sitemap.xml`, favicon, Open Graph slika, pristanak na kolačiće,
responzivan dizajn, semantični HTML, po jedan `H1` na stranici, canonical i meta podaci po
ruti.

## Rezervacija termina

- odabir usluge (trajanje određuje koliko termin zauzima u rasporedu);
- traka od 14 dana; stranica se otvara na **prvom danu na kojem stvarno ima mjesta**;
- **tabla termina**: slobodni termini su bijele pločice sa zelenom gornjom linijom, zauzeti
  su šrafirani i vidljivi, odabrani se prevrće u žuto; upravlja se i tipkovnicom;
- vozilo i napomena;
- prijava se traži tek na kraju, **odabir preživi preusmjeravanje**;
- potvrda s prikazom termina, usluge, vozila i radnog mjesta;
- otkazivanje kroz korisnički portal, do dva sata prije termina.

Dvostruka rezervacija je nemoguća — sprječava je `EXCLUDE` constraint u bazi, a ne
aplikacijska provjera.

## Korisnički portal

- pregled s nadolazećim terminima, vozilima i rezervacijama;
- **vozila**: dodavanje, brisanje, jedinstvena registracija, validacija VIN-a;
- **termini**: status, napomena servisa, utrošene stavke s iznosom, otkazivanje;
- **rezervacije artikala**: status, količina, iznos, otkazivanje;
- **obavijesti**: broj nepročitanih u zaglavlju, označavanje pročitanim;
- izmjena profila i lozinke.

## Portal majstora

- radni nalozi po danu, s navigacijom kroz dane;
- podaci o stranci (ime, telefon kao poziv), vozilu i dimenziji guma;
- **promjena statusa** uz dopuštene prijelaze (PENDING → CONFIRMED → IN_PROGRESS →
  COMPLETED, uz CANCELLED i NO_SHOW);
- servisna napomena koju vidi i stranka;
- **evidencija utroška**: artikl sa skladišta ili dodatna usluga. Artikl se u istoj
  transakciji skida sa zalihe; storno ga vraća uz zapis korekcije. Cijene dolaze s
  poslužitelja — majstor bira samo što i koliko.

## Skladište

- stanje s fizičkom, rezerviranom i **raspoloživom** količinom (`fizičko − rezervirano`);
- označavanje artikala ispod minimalne zalihe;
- pretraga i filtar po kategoriji, paginacija;
- **zaprimanje**, **izdavanje** i **korekcija na stvarno stanje** (uz obavezan razlog);
- **knjiga prometa**: kronološki popis svih promjena s vrstom, iznosom promjene i
  napomenom. Zapisi se ne mijenjaju i ne brišu;
- rezervacije artikala: potvrda, izdavanje, otkazivanje.

## Administracija

- **pregled dana**: termini danas, na čekanju, završeni, niska zaliha, aktivne rezervacije,
  broj kupaca — uz raspored dana i popis artikala ispod minimuma;
- svi termini s filtrom po statusu i razdoblju;
- **usluge i cjenik**: dodavanje, izmjena, deaktivacija (usluga se ne briše zbog povijesnih
  termina);
- **korisnici**: pretraga, izmjena uloga, aktivacija i deaktivacija. Sustav ne dopušta
  gubitak zadnjeg administratora;
- **radno vrijeme** po danima — izmjena odmah utječe na ponuđene termine.

## Inventory

- artikl: šifra, naziv, proizvođač, kategorija, opis, dimenzija gume, prodajna i nabavna
  cijena, fizička / rezervirana / minimalna količina, aktivnost;
- kategorije: gume, autodijelovi, ventili, potrošni materijal, ostalo;
- vrste prometa: `INITIAL_STOCK`, `PURCHASE`, `RESERVATION`, `RELEASE`, `SERVICE_USAGE`,
  `ADJUSTMENT`;
- rezervacija provjerava raspoloživost i **ne može prodati ispod nule** — ni pod paralelnim
  opterećenjem;
- revizijski trag (`audit_logs`) za promjene zalihe.

## Autentikacija i uloge

- registracija, prijava, odjava, izmjena profila i lozinke;
- četiri uloge: `CUSTOMER`, `EMPLOYEE`, `WAREHOUSE_WORKER`, `ADMIN`;
- JWT u HttpOnly cookieju, CSRF, BCrypt, rate limit, honeypot;
- autorizacija na service sloju; tuđi zapis vraća 404.

## API

REST API dokumentiran kroz OpenAPI/Swagger na `/swagger-ui.html`, s opisima na hrvatskom.

---

## Što je provjereno

| Provjera | Rezultat |
|---|---|
| Backend integracijski testovi | **44 prolaze** (protiv stvarnog PostgreSQL-a, ponovljivo) |
| Frontend jedinični testovi | **24 prolaze** |
| E2E testovi (Playwright) | **12 prolaze** (desktop + mobitel) |
| Poveznice i meta podaci | 14 ruta, 14 poveznica, **bez nalaza** |
| Vodoravni prelijev na mobitelu | **0 px** na 24 kombinacije stranica/viewporta |
| Greške u konzoli preglednika | **0** |
| `npm audit` | **0 ranjivosti** |
| ESLint / TypeScript | **bez grešaka i upozorenja** |
| Docker Compose | samo **sintaktička** provjera (`docker compose config`) — vidi README |
