# Vulkanizerski servis — demo web aplikacija

Demo (MVP prototip) poslovnog sustava za **jedan** vulkanizerski servis: javna web
stranica s online rezervacijom termina, korisnički portal te portali za majstora,
skladište i administratora.

> **Ovo je demo.** Svi podaci — naziv servisa, adresa, telefon, OIB, cijene, artikli i
> korisnici — **izmišljeni su i označeni kao zamjenski**. Prije bilo kakve javne upotrebe
> moraju se zamijeniti stvarnima. Pravne stranice su predlošci koje mora pregledati pravni
> stručnjak. Vidi [docs/OPEN-QUESTIONS.md](docs/OPEN-QUESTIONS.md).

---

## Sadržaj

- [Što demo pokazuje](#što-demo-pokazuje)
- [Brzo pokretanje](#brzo-pokretanje)
- [Demo pristupni podaci](#demo-pristupni-podaci)
- [Razvoj bez Dockera](#razvoj-bez-dockera)
- [Testovi](#testovi)
- [Arhitektura ukratko](#arhitektura-ukratko)
- [Konfiguracija](#konfiguracija)
- [Dokumentacija](#dokumentacija)

---

## Što demo pokazuje

**Javna stranica** — naslovnica koja u prvom ekranu pokazuje *stvarni prvi slobodan termin*
dohvaćen s API-ja, cjenik, usluge, hotel za gume, ponuda guma i dijelova, kontakt, lokacija,
česta pitanja, pravne stranice i vlastita stranica 404.

**Rezervacija termina** — odabir usluge, dana i termina, pa vozila i napomene. Prijava se
traži tek na kraju i odabir se ne gubi. Zauzeti termini se **prikazuju šrafirani**, ne
skrivaju: u sezoni je vidljiva popunjenost dio poruke.

**Korisnički portal** — vozila, termini sa statusom i poviješću, rezervacije artikala,
obavijesti.

**Portal majstora** — radni nalozi po danu, promjena statusa, servisna napomena,
evidencija utrošenih artikala (koja odmah skida robu sa zalihe).

**Skladište** — stanje zalihe s raspoloživom količinom, zaprimanje, izdavanje i korekcija,
te **knjiga prometa** u kojoj svaka promjena ima trag.

**Administracija** — pregled dana, svi termini, usluge i cjenik, korisnici i uloge,
radno vrijeme.

Potpun popis: [docs/IMPLEMENTED.md](docs/IMPLEMENTED.md).

---

## Brzo pokretanje

### Jednom naredbom (preporučeno za demo)

Potrebno: **Java 21+**, **Node 22+**, **PostgreSQL 16+**.
Maven ne treba instalirati — projekt nosi Maven Wrapper (`backend/mvnw`), koji pri prvom
pokretanju sam skine ispravnu verziju.

```bash
./scripts/start-dev.sh
```

Skripta provjeri preduvjete, pokrene PostgreSQL ako ne radi, stvori bazu ako je nema,
instalira ovisnosti frontenda pri prvom pokretanju, pa digne backend i frontend i pričeka
da oba stvarno odgovore. Na kraju ispiše adresu i demo login podatke. `Ctrl+C` gasi oboje.

Prije prezentacije klijentu, da demo podaci budu na početnom stanju:

```bash
./scripts/start-dev.sh --reset
```

Logovi su u `.dev-logs/` (nisu u Gitu).

### Docker Compose

```bash
cp .env.example .env
# Otvorite .env i postavite barem POSTGRES_USER, POSTGRES_PASSWORD i JWT_SECRET.
# JWT_SECRET generirajte s:  openssl rand -base64 48

docker compose up --build
```

Aplikacija: <http://localhost:8080> · Swagger: <http://localhost:8080/swagger-ui.html>

> **Napomena o provjeri:** `docker-compose.yml` i Dockerfile-ovi provjereni su samo
> sintaktički (`docker compose config`). Nisu pokrenuti, jer razvojno okruženje u kojem je
> demo izrađen nema Docker daemon. Backend, frontend i svi testovi jesu pokretani i
> provjereni izravno, protiv stvarnog PostgreSQL-a.

### Ručno (bez Dockera)

Potrebno: **Java 21+**, **Node 22+**, **PostgreSQL 16+** (Maven dolazi kroz `./mvnw`).

```bash
# 1. Baza
createdb vulkanizer

# 2. Backend — Flyway sam odradi shemu i demo podatke
cd backend
POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_DB=vulkanizer \
SPRING_PROFILES_ACTIVE=demo \
JWT_SECRET=$(openssl rand -base64 48) \
./mvnw spring-boot:run

# 3. Frontend (u drugom terminalu)
cd frontend
npm install
npm run dev
```

Aplikacija: <http://localhost:5173> (Vite posreduje `/api` na backend, pa frontend i API
dijele origin i cookie s tokenom radi bez CORS-a — isto kao u produkciji iza nginxa.)

### Reset demo podataka

Prije prezentacije ili E2E testova:

```bash
./scripts/reset-demo.sh
# pa ponovno pokrenite backend s profilom `demo`
```

Seed namjerno **nije** idempotentan: čist reset je pošteniji i brži od pokušaja
„dopuni ako nedostaje", koji uvijek ostavi neki zaostali zapis.

---

## Demo pristupni podaci

Lozinka za **sve** demo račune: `Demo1234!`

| Uloga | E-mail | Što vidi |
|---|---|---|
| Administrator | `admin@demo.local` | sve — pregled dana, termini, usluge, korisnici, radno vrijeme, skladište |
| Majstor | `majstor@demo.local` | radne naloge, statuse, napomene, evidenciju utroška |
| Skladištar | `skladiste@demo.local` | zalihu, promet, rezervacije artikala |
| Kupac | `ivan@demo.local` | svoja vozila, termine i rezervacije |
| Kupac | `ana@demo.local` | isto |
| Kupac | `marko@demo.local` | isto |
| Kupac | `petra@demo.local` | isto |
| Kupac | `tomislav@demo.local` | isto |

Ti su podaci vidljivi i na stranici za prijavu dok je `IS_DEMO` uključen
(`frontend/src/config/site.ts`). **U produkciji se `IS_DEMO` gasi i blok nestaje.**

> Lozinka `Demo1234!` postoji isključivo za demonstraciju i ne smije se koristiti nigdje
> drugdje. Hash u seed migraciji je BCrypt generiran samo za tu svrhu.

---

## Razvoj bez Dockera

```bash
# Backend
cd backend
./mvnw spring-boot:run       # pokretanje
./mvnw verify                # testovi (traži PostgreSQL, vidi niže)

# Frontend
cd frontend
npm run dev                  # razvojni poslužitelj
npm run build                # produkcijski build
npm run lint                 # ESLint
npm run typecheck            # TypeScript
npm run test                 # jedinični testovi (Vitest)
npm run e2e                  # E2E testovi (Playwright) — traži pokrenut backend
npm run check:site           # poveznice, meta podaci, H1, alt tekstovi
```

---

## Testovi

### Backend — 44 integracijska testa

Rade protiv **stvarnog PostgreSQL-a**, ne in-memory baze: ključna jamstva sustava
(`EXCLUDE` constraint nad `tstzrange`, uvjetni `UPDATE`-ovi nad zalihom) oslanjaju se na
PostgreSQL semantiku, pa bi in-memory baza davala lažno zeleno.

```bash
createdb vulkanizer_test
cd backend && ./mvnw verify
```

Pokriveno je ono što stvarno može poći po zlu:

- **paralelni booking** istog termina — prolazi točno onoliko rezervacija koliko ima
  radnih mjesta, ostale dobiju 409, i nijedno radno mjesto nema dva termina u isto vrijeme;
- **otkazivanje oslobađa termin** — isti slot je nakon otkazivanja ponovno dostupan;
- **paralelne rezervacije artikla** — nikad se ne rezervira više nego što je raspoloživo,
  a stanje svakog artikla odgovara zbroju knjige prometa;
- **IDOR** — korisnik A traži vozilo, termin ili rezervaciju korisnika B i dobiva **404**
  (ne 403, da se ne otkrije ni postojanje zapisa);
- **eskalacija ovlasti** — registracija s podmetnutim poljem `role` pada s 400;
- **rate limit** na prijavi; **CSRF** na mutirajućim zahtjevima;
- **granice modula** (ArchUnit) — nijedan JPA entitet ne izlazi iz svog modula.

Testovi kreću od prazne baze pri svakom pokretanju, pa su ponovljivi.

### Frontend — 24 jedinična + 12 E2E testa

```bash
cd frontend
npm run test                                  # Vitest
npm run e2e                                   # Playwright (backend mora raditi)
```

E2E pokriva registraciju → dodavanje vozila → rezervaciju → otkazivanje, rezervaciju
artikla i odbijanje prekomjerne količine, portale osoblja te mobilni prikaz (bez
vodoravnog prelijeva, dohvatljiv CTA, izbornik).

---

## Arhitektura ukratko

```
frontend/  React 19 + TypeScript + Vite + Tailwind 4 + TanStack Query
backend/   Spring Boot 3.5 + Spring Security 6 + JPA + Flyway + PostgreSQL 16
```

Backend je **modularni monolit**: `auth`, `users`, `vehicles`, `appointments`, `catalog`,
`inventory`, `reservations`, `notifications`, `admin`. Svaki modul izlaže jedno javno
sučelje (`XxxFacade`); entiteti i repozitoriji su package-private i ne izlaze iz modula.

Tri odluke koje objašnjavaju većinu koda:

1. **Dvostruka rezervacija sprječava se u bazi**, PostgreSQL `EXCLUDE` constraintom nad
   `(bay_id, tstzrange(start_at, end_at))`, parcijalnim po aktivnim statusima. Ne postoji
   aplikacijsko zaključavanje koje bi se moglo zaboraviti.
2. **Zaliha se mijenja isključivo uvjetnim `UPDATE`-om** uz `CHECK` constraint
   `reserved_quantity <= physical_quantity`. Svaka promjena ostavlja zapis u
   `stock_movements`.
3. **Zaštita tuđih podataka je u upitu, ne u provjeri** — `findByIdAndCustomerId(...)`
   umjesto `findById(...)` + naknadnog `if`. Upit ne može „zakazati otvoreno".

Detaljno: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Konfiguracija

Sve se postavlja kroz varijable okoline; predložak je [`.env.example`](.env.example).
**U kodu nema nijedne tajne** i `.env` je u `.gitignore`.

| Varijabla | Obavezna | Opis |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | da | pristup bazi |
| `JWT_SECRET` | da (prod) | potpisni ključ, min. 32 znaka; aplikacija se bez njega ne diže u `prod` profilu |
| `SPRING_PROFILES_ACTIVE` | ne | `demo` (sa seed podacima) ili `prod` |
| `COOKIE_SECURE` | ne | **mora biti `true` u produkciji** |
| `CORS_ALLOWED_ORIGINS` | ne | potreban samo ako frontend nije na istom originu |
| `VITE_ANALYTICS_ID` | ne | prazno = mjerenje posjeta isključeno |

Podaci o servisu (naziv, adresa, telefon, OIB, koordinate) nisu u varijablama okoline nego
u [`frontend/src/config/site.ts`](frontend/src/config/site.ts), jer se ugrađuju u build.
To je **jedino mjesto** koje klijent mijenja.

---

## Dokumentacija

| Dokument | Sadržaj |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | moduli, ER model, ključne odluke i zašto su takve |
| [docs/SECURITY.md](docs/SECURITY.md) | svih 20 sigurnosnih zahtjeva: što je implementirano, što pripremljeno, što nije i zašto |
| [docs/IMPLEMENTED.md](docs/IMPLEMENTED.md) | popis implementiranih funkcionalnosti |
| [docs/OPEN-QUESTIONS.md](docs/OPEN-QUESTIONS.md) | pitanja za klijenta i popis budućih funkcionalnosti |
| [PRODUCT.md](PRODUCT.md) | proizvodni kontekst: tko je korisnik, u kojoj situaciji, što sustav mora omogućiti |
| [DESIGN.md](DESIGN.md) | vizualni sustav: tokeni, komponente, pravila |
