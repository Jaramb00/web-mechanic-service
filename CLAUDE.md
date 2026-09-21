# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Što je ovo

Demo/MVP za jedan vulkanizerski servis koji nema ERP. Cilj je prezentabilan prototip
na temelju kojeg klijent daje povratne informacije — **nije** gotov ERP. Single-tenant,
bez multitenancy. Ne dodavati slojeve koje demo ne treba.

**Jezik:** UI, komentari i commit poruke na hrvatskom. Kod, nazivi API polja i shema
baze na engleskom.

## Naredbe

```bash
./scripts/start-dev.sh              # digne bazu + backend + frontend, Ctrl+C gasi oboje
./scripts/start-dev.sh --reset      # isto, uz povratak demo podataka na početno stanje
```

Aplikacija na <http://localhost:5173>, Swagger na <http://localhost:8080/swagger-ui.html>.
Demo logini su u README-u; lozinka za sve je `Demo1234!`.

```bash
# Backend (iz backend/) — Maven se NE instalira, wrapper ga skine sam
./mvnw -q compile
./mvnw verify                       # cijeli set
./mvnw -Dtest=StaffAppointmentFilterTest test        # jedan razred
./mvnw -Dtest=BookingRulesTest#bookingCreatesPendingAppointment test   # jedan test

# Frontend (iz frontend/)
npm run typecheck                   # tsc -b --noEmit
npm run lint
npm run test                        # Vitest
npx vitest run src/lib/format.test.ts   # jedna datoteka
npm run e2e                         # Playwright
npm run check:site                  # provjera linkova i SEO meta tagova
```

Backend se uvijek pokreće s profilom `demo` lokalno. `JWT_SECRET` **nema default izvan
`demo` profila** — to je namjerno, da demo ključ ne završi u produkciji.

## Testovi traže pravi PostgreSQL

Nema Testcontainersa jer razvojna okolina nema Docker daemon. Testovi idu protiv
**stvarnog PostgreSQL-a**, na zasebnu bazu `vulkanizer_test` (`createdb vulkanizer_test`).
`TestFlywayConfig` radi `clean()` pa `migrate()` prije svakog pokretanja, pa su testovi
ponovljivi.

To je bitno za pisanje testova: H2 bi progutao upite koje PostgreSQL odbija, a upravo
su takvi upiti dvaput probili do korisnika. Test koji ne dira pravi PostgreSQL ne
dokazuje ništa o ovim invarijantama.

## Arhitektura

Modularni monolit, paketi po domeni pod `hr.demo.vulkanizer`: `auth users vehicles
appointments catalog inventory reservations notifications admin`, plus `common` i `config`.

**Granice modula su provjerene testom** (`arch/ModuleBoundaryTest`), ne dogovorom:

- `@Entity` klase i repozitoriji su **package-private**. Van modula ide isključivo
  `XxxFacade` i view recordi. Ako ArchUnit padne, ne popravljaj test — popravi vidljivost.
- `inventory` ne smije ovisiti o `appointments`, `reservations`, `admin` ni
  `notifications`. Prima `StockRef(type, id)` pa ne treba znati tko ga zove.
- O `admin` modulu nitko ne ovisi. `notifications` se veže samo na
  `@TransactionalEventListener` nakon commita.

## Invarijante koje su u bazi, ne u kodu

Ovo su odluke koje se ne vide iz jednog razreda i lako ih je nehotice zaobići.

**Dvostruka rezervacija termina** spriječena je `EXCLUDE` constraintom
(`appointments_no_overlap`, `tstzrange` + `btree_gist`), parcijalnim po aktivnim
statusima. Nema aplikacijske koordinacije, nema zaključavanja. Posljedice:
kapacitet od N radnih mjesta modelira se kao **N redaka u `service_bays`**, nikad kao
brojač; otkazani termin automatski oslobađa slot jer ispada iz parcijalnog predikata.
Booking servis pokušava redom po radnim mjestima i hvata konflikt — greška
`23P01` u logu tijekom rezervacije je constraint koji radi svoj posao, ne kvar.

**Prekoračenje zalihe** spriječeno je uvjetnim `UPDATE … WHERE physical - reserved >= :qty`
(jedna atomarna naredba, bez prozora između čitanja i pisanja) uz `CHECK
reserved_quantity <= physical_quantity` kao mrežu. `available_quantity` se **nikad ne
sprema** — računa se kao `physical - reserved`. `stock_movements` je revizijski trag;
invarijanta `SUM(delta_reserved) == reserved_quantity` je pod testom.

## Sigurnosni obrasci kojih se držati

- **IDOR:** vlasnik ide **u upit** (`findByIdAndCustomerId`), ne u naknadni `if`.
  Krivi vlasnik → prazno → **404**, ne 403 (da se ne otkriva postojanje zapisa).
  `@PreAuthorize` pokriva samo uloge; sigurnosna granica je service sloj.
- **Field tampering:** entitet se nikad ne veže na request body. Request DTO sadrži
  samo polja koja ta uloga smije postaviti (`RegisterRequest` nema `role`,
  `AppointmentCreateRequest` nema `status` ni `customerId`, cijene se snapshotiraju na
  serveru). `fail-on-unknown-properties: true` — višak polja je greška, ne tišina.
  Promjene statusa idu kroz namjerne endpointe (`POST /appointments/{id}/cancel`),
  nikad kroz PATCH s `status` poljem.
- **Auth:** JWT je u `HttpOnly` cookieju — frontend ga nikad ne dira. Uz to CSRF
  double-submit: backend postavlja čitljiv `XSRF-TOKEN`, klijent ga vraća u
  `X-XSRF-TOKEN`. U `lib/api.ts` je dovoljno `credentials: 'include'`.
- Javni odgovori su trimani: nabavna cijena, hash lozinke, tuđi e-mailovi i interne
  bilješke ne izlaze iz backenda.

## Zamka: nullable parametri u JPQL-u

**Nikad ne pisati `(:param IS NULL OR stupac = :param)`.** Hibernate imenovani parametar
veže dvaput, kao dva zasebna upitnika, pa samostalni `? IS NULL` ostane bez tipskog
konteksta i PostgreSQL odbije pripremiti izjavu:
`could not determine data type of parameter $N`.

Ovo je probilo do korisnika dvaput (pretraga artikala i korisnika, pa pregled termina).
Za neobavezne filtre koristiti **JPA Specification** — vidi `AppointmentSpecs`: gradi
samo uvjete koji su stvarno zadani, pa parametar bez vrijednosti nikad ne dođe do baze.

## Migracije i demo podaci

`V1__baseline.sql` je u `classpath:db/migration`. Demo seed `V900__demo_seed.sql` je u
`classpath:db/demo` i uključuje se **samo uz `demo` profil** (`spring.flyway.locations`).
Razmak V2–V899 ostaje za stvarne izmjene sheme.

Seed **nije idempotentan** i to je namjerno — reset je `scripts/reset-demo.sh`
(drop + create pa Flyway), ne „dopuni ako nedostaje". `clean-disabled=true` svugdje
osim u demo profilu.

Seed računa datume relativno prema trenutku migracije i namjerno popunjava sva radna
mjesta sljedećeg jutra, da se na tabli termina vidi zauzeto stanje.

## Frontend

React 19 + Vite + Tailwind 4 (CSS-first `@theme` u `src/styles/theme.css`), TanStack
Query, React Hook Form + Zod. Vizualni sustav je „prometno znakovlje" — pravila su u
`DESIGN.md`, tokeni u `theme.css`. Ne uvoditi boje ni radijuse mimo tokena.

Dev poslužitelj posreduje `/api` na `localhost:8080`, pa frontend i API dijele origin
i cookie radi bez CORS-a — isto kao u produkciji iza nginxa.

Podaci o klijentu (naziv, adresa, telefon, OIB, radno vrijeme) su **placeholderi** u
`src/config/site.ts`, označeni `TODO`. Ne izmišljati stvarne podatke o klijentu.
Pravne stranice su placeholder tekst s vidljivom oznakom da ih mora pregledati pravnik —
ne tvrditi pravnu usklađenost.

## Što nije provjereno

`docker-compose.yml` i Dockerfile-ovi validirani su samo sintaktički
(`docker compose config`). **Nikad nisu pokrenuti** — razvojna okolina nema Docker
daemon. Ne pisati i ne tvrditi da compose put radi.
