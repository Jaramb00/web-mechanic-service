# Arhitektura

## Pregled

```
┌─────────────────────────────────────────────────────────────┐
│  Preglednik                                                  │
│  React 19 + TypeScript + Vite + Tailwind 4 + TanStack Query  │
└───────────────────────────┬─────────────────────────────────┘
                            │  /api/*  (isti origin: nginx u produkciji,
                            │           Vite proxy u razvoju)
┌───────────────────────────▼─────────────────────────────────┐
│  Spring Boot 3.5 — modularni monolit                         │
│  controller → facade/service → repository → entity           │
└───────────────────────────┬─────────────────────────────────┘
                            │  JDBC
┌───────────────────────────▼─────────────────────────────────┐
│  PostgreSQL 16 + Flyway migracije                            │
│  EXCLUDE constraint · CHECK constrainti · knjiga prometa     │
└──────────────────────────────────────────────────────────────┘
```

Frontend i API **dijele origin**. To nije detalj nego odluka: cookie s tokenom tada radi
bez CORS-a i bez `SameSite=None`, a razvoj se ponaša jednako kao produkcija, pa se problemi
s kolačićima ne pojave tek nakon deploya.

---

## Moduli

`hr.demo.vulkanizer`:

| Modul | Odgovornost | Javno sučelje |
|---|---|---|
| `auth` | prijava, registracija, JWT, CSRF, rate limit | `AppPrincipal`, `JwtService` |
| `users` | korisnici, uloge, lozinke | `UserFacade` |
| `vehicles` | vozila kupaca | `VehicleFacade` |
| `catalog` | usluge i cjenik | `ServiceCatalogFacade` |
| `appointments` | dostupnost, booking, statusi, radni nalozi, radno vrijeme | `AppointmentFacade`, `AvailabilityService` |
| `inventory` | artikli, zaliha, knjiga prometa | `InventoryFacade` |
| `reservations` | rezervacije artikala | `ReservationService` |
| `notifications` | obavijesti unutar aplikacije | `NotificationService` |
| `admin` | dashboard, upravljanje korisnicima | (nema — najviši sloj) |
| `common` | greške, paginacija, revizijski trag | `AuditService`, `PageResponse` |

### Dva pravila granica

**1. Modul izlaže jedno javno sučelje.** `XxxFacadeImpl`, svi `@Entity` razredi i svi
repozitoriji su **package-private**. Entitet ne može izaći iz modula ni slučajno — to ne
jamči disciplina nego prevodilac.

**2. Moduli razmjenjuju ID-jeve i view recorde, nikad entitete.** `Appointment` drži
`vehicleId`, a ne `@ManyToOne Vehicle`. Strani ključ u bazi i dalje čuva integritet.

Nema cikličkih ovisnosti: `appointments → inventory` je dopušteno, pa `inventory` nikad ne
importa `appointments` — umjesto toga prima `StockRef(type, id)`, nestrukturiranu referencu
na razlog promjene. `admin` ovisi o svima; o `admin` nitko. `notifications` se veže
isključivo na događaje (`@TransactionalEventListener`), pa ga domena ne mora poznavati.

Pravila provjerava `ModuleBoundaryTest` (ArchUnit, ~60 redaka). **Spring Modulith je
svjesno izostavljen**: za devet paketa i demo opseg donosi okvir i nametnutu strukturu
paketa, a ArchUnit daje isto jamstvo.

---

## ER model

```
roles ──< user_roles >── users ──< vehicles
                           │            │
                           │            └──< appointments >── services
                           │                    │      │
                           │                    │      └── service_bays
                           │                    └──< appointment_items >── products
                           ├──< product_reservations >── products ──> product_categories
                           │              │                 │
                           │              └─────────────────┴──< stock_movements
                           ├──< notifications
                           └──< audit_logs
                        working_hours
```

Sve tablice imaju `id`, `created_at`, `updated_at`. Shema je u
`backend/src/main/resources/db/migration/V1__baseline.sql`, demo podaci u
`db/demo/V900__demo_seed.sql`.

---

## Tri odluke koje objašnjavaju većinu koda

### 1. Dvostruka rezervacija sprječava se u bazi

```sql
CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    bay_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
) WHERE (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'))
```

**Zašto tako, a ne brojačem slobodnih mjesta:** kapacitet je modeliran kao N redaka u
`service_bays`, pa se preklapanje sprječava po konkretnom radnom mjestu. Rješenje je
deklarativno točno pod `READ COMMITTED` — nema aplikacijskog zaključavanja koje bi se
moglo zaboraviti, nema retry petlje, nema prozora između provjere i upisa.

**Otkazivanje oslobađa termin besplatno:** `CANCELLED` i `NO_SHOW` ispadaju iz parcijalnog
predikata, pa `UPDATE` statusa sam po sebi oslobađa mjesto.

**Ostaje ispravno kad se uvedu fleksibilna trajanja** po usluzi — a to je bio izričit
zahtjev proširivosti.

Cijena te odluke: kad constraint odbije upis, PostgreSQL prekida cijelu transakciju, pa se
u istoj transakciji ne može „pokušati sljedeće radno mjesto". Zato svaki pokušaj ima
vlastitu transakciju (`BookingAttempt`, `REQUIRES_NEW`), a `AppointmentBookingService.book`
namjerno **nije** transakcijski — on je koordinator.

Pravila slotova (radno vrijeme, mreža termina, horizont rezervacije) izolirana su u
`AvailabilityService`, pa se kasnije mogu zamijeniti fleksibilnijima bez diranja bookinga.
Popis slobodnih termina je **prijedlog, ne rezervacija** — između prikaza i potvrde netko
drugi može uzeti isti termin, i to je uredno obrađeno (409 s porukom).

### 2. Zaliha se mijenja samo uvjetnim UPDATE-om

```sql
UPDATE products
   SET reserved_quantity = reserved_quantity + :qty
 WHERE id = :id AND active = true
   AND physical_quantity - reserved_quantity >= :qty
```

Promijenjeno 0 redaka znači odbijanje. Uvjet i izmjena ocjenjuju se zajedno, pod redčanim
lokotom baze — nema prozora u kojem bi dvije paralelne rezervacije obje prošle.

`@Version` (optimistično zaključavanje) bi natjecanje pretvorio u vidljive 409-ice i retry
petlju; pesimistični lokot bi radio, ali traži više koda za isto jamstvo.

Mreža sigurnosti je `CHECK (reserved_quantity <= physical_quantity)`: uvjetni `UPDATE` je
ergonomski put, a `CHECK` je dokaz.

**Stanje je izvor istine, knjiga prometa je revizijski trag.** Izvođenje stanja iz zbroja
prometa značilo bi `SUM()` pri svakom čitanju i problem konkurentnosti koji se ne može
izraziti constraintom. Invarijanta *stanje = zbroj knjige prometa* provjerena je testom nad
cijelom bazom, pa svaki budući put koji bi promijenio količinu bez zapisa odmah pada.

Zapisi u `stock_movements` se nikad ne mijenjaju ni brišu — greška se ispravlja **novim**
zapisom (storno stavke naloga bilježi se kao `ADJUSTMENT`, ne kao nova nabava).

### 3. Zaštita tuđih podataka je u upitu

```java
Optional<Appointment> findByIdAndCustomerId(Long id, Long customerId);
```

IDOR je greška u **upitu**, ne u **provjeri**. `findById(id)` + naknadni `if` točan je dok
netko ne doda endpoint i zaboravi `if`; upit koji nosi vlasnika ne može zakazati otvoreno.

Tuđi zapis daje **404, ne 403** — 403 bi potvrdio da zapis postoji.

`@PreAuthorize` pokriva samo uloge, i to na **service sloju**, ne na kontroleru.

---

## Rukovanje greškama

Jedan `@RestControllerAdvice` pretvara domenske iznimke u RFC 7807 `ProblemDetail`:

| Iznimka | HTTP | Kad |
|---|---|---|
| `NotFoundException` | 404 | ne postoji — ili postoji, ali nije korisnikovo |
| `ConflictException` | 409 | sukob sa stanjem (zauzet termin, nedovoljna zaliha) |
| `BusinessRuleException` | 422 | prekršeno poslovno pravilo |
| `MethodArgumentNotValidException` | 400 | uz mapu `fields` po polju |
| `HttpMessageNotReadableException` | 400 | nepoznato polje u payloadu |

Klijent nikad ne dobiva stack trace, SQL ni interne nazive tablica. Neočekivane greške se
loguju s punim kontekstom, a korisniku ide generička poruka.

---

## Frontend

`TanStack Query` drži stanje poslužitelja; nema globalnog store-a jer gotovo sve stanje i
jest stanje poslužitelja. Portali se učitavaju lijeno — posjetitelj javne stranice ne
preuzima njihov kod.

**Prijavljenost se ne čita iz `localStorage`** nego s `/api/auth/me`: token je u HttpOnly
cookieju koji JavaScript ne vidi, pa je poslužitelj jedini izvor istine. Ta ruta vraća
**204** za anonimnog posjetitelja — odsutnost sesije je činjenica, ne greška, pa javna
stranica ne proizvodi 401 u konzoli pri svakom učitavanju.

Odjava briše cijelu predmemoriju upita: bez toga bi sljedeći korisnik na istom pregledniku
nakratko vidio tuđe podatke.

Vizualni sustav opisan je u [`DESIGN.md`](../DESIGN.md).
