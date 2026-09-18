# Sigurnost

Status svih 20 zahtjeva iz specifikacije. Tri kategorije:

- **Implementirano** — radi u ovoj verziji i pokriveno je testom ili se može provjeriti.
- **Pripremljeno** — mehanizam postoji, ali produkcija traži još jedan korak (naveden).
- **Nije primjenjivo** — s obrazloženjem zašto, bez izmišljanja zaštite koje nema.

> **Ovo nije sigurnosni certifikat.** Prije produkcije je potreban neovisan pregled i
> penetracijsko testiranje. Ovdje je opisano što je učinjeno, ne što je zajamčeno.

---

## 1. Hide API keys — ključevi nisu u kodu

**Implementirano.** U izvornom kodu nema nijedne tajne. Sve dolazi iz varijabli okoline
(`backend/src/main/resources/application.yml`), a `.env.example` sadrži samo placeholdere.

`JWT_SECRET` namjerno **nema default vrijednost** u osnovnoj konfiguraciji: aplikacija se u
`prod` profilu neće pokrenuti bez njega. Default postoji isključivo u `application-demo.yml`
i jasno je označen kao takav.

## 2. Purge Git secrets — tajne se ne commitaju

**Implementirano.** `.env`, `*.pem`, `*.key` i `*.p12` su u `.gitignore`. Repozitorij je
nov, pa u povijesti nema zaostalih tajni koje bi trebalo čistiti.

Jedina „lozinka" u repozitoriju je demo `Demo1234!` i njezin BCrypt hash u seed migraciji,
oboje eksplicitno označeno kao demo podatak koji se ne smije koristiti drugdje.

**Za produkciju:** uključiti skeniranje tajni u CI (npr. `gitleaks`) kao mrežu za slučaj
ljudske greške.

## 3. Use public DB key — pristup bazi

**Nije primjenjivo u ovom obliku.** Frontend **nikad** ne razgovara s bazom. Ne postoji
javni ključ baze niti bilo kakav podatak o bazi u klijentskom kodu; sve ide kroz backend.
U Docker Compose postavci baza nije izložena na host, nego samo unutar mreže compose-a.

## 4. Enable row-level security — zaštita na razini retka

**Namjerno riješeno u aplikaciji, ne u bazi.** Sustav je single-tenant i ima jednu
aplikaciju kao jedinog klijenta baze, pa bi PostgreSQL RLS udvostručio pravila bez dobitka.
Zaštita je u upitima vezanima uz prijavljenog korisnika (vidi točku 7) i pokrivena je
testovima.

**Za produkciju:** ako bazi ikad pristupi druga aplikacija ili alat za izvještavanje, RLS
postaje potreban jer aplikacijska pravila tada više nisu jedina vrata.

## 5. Encrypt sensitive data — zaštita osjetljivih podataka

**Djelomično implementirano.** Lozinke su BCrypt hashevi i nikad ne izlaze iz `users`
paketa — `UserView` nema polje za hash, pa ga se ne može slučajno serijalizirati.
U logovima nema lozinki, tokena ni osobnih podataka; rukovatelj greškama vraća poruke bez
SQL-a i internih naziva.

Ostali osobni podaci (ime, telefon, registracija vozila) čuvaju se u čitljivom obliku jer
ih aplikacija mora pretraživati i prikazivati.

**Za produkciju:** enkripcija diska na poslužitelju baze i TLS između aplikacije i baze.

## 6. Server-side authentication and authorization

**Implementirano.** Sva autorizacija je na poslužitelju. Klijentske provjere postoje samo
radi ugodnijeg sučelja; zaobilaženjem se ne dobiva ništa jer API i dalje vraća 403 ili 404.

Sigurnosna granica je **service sloj** (`@EnableMethodSecurity` + `@PreAuthorize`), ne
kontroler. Testovi `AccessControlTest` provjeravaju svaku ulogu na svakoj skupini ruta.

## 7. Lock record access — pristup samo vlastitim podacima

**Implementirano, i to je najvažnija odluka u sustavu.**

Vlasnik je dio **upita**, ne naknadna provjera:

```java
Optional<Appointment> findByIdAndCustomerId(Long id, Long customerId);
```

`findById(id)` + `if (!entity.getCustomerId().equals(me))` bio bi jednako točan danas, ali
zakaže onog dana kad netko doda endpoint i zaboravi `if`. Upit ne može zakazati otvoreno.

Tuđi zapis vraća **404, ne 403** — 403 bi potvrdio da zapis s tim ID-em postoji.
Pokriveno testovima za vozila, termine i rezervacije.

## 8. Block field tampering — zaštićene vrijednosti

**Implementirano, kroz dizajn DTO-ova.** Entitet se nikad ne veže na tijelo zahtjeva.
Request DTO sadrži isključivo polja koja ta uloga smije postaviti:

| DTO | Nema polje | Zašto |
|---|---|---|
| `RegisterRequest` | `role` | uloga je uvijek CUSTOMER, dodjeljuje je poslužitelj |
| `AppointmentCreateRequest` | `status`, `customerId`, `endAt`, `bayId` | status je uvijek PENDING, kupac je iz prijave, kraj se računa iz trajanja usluge, radno mjesto bira poslužitelj |
| `ReservationRequest` | `unitPrice`, `status` | cijena se snima iz šifrarnika |
| `AppointmentItemRequest` | cijena | uzima se s poslužitelja |
| `ProductRequest` | `physicalQuantity`, `reservedQuantity` | količina se mijenja samo skladišnim radnjama, uz trag |

Uz to je uključen `fail-on-unknown-properties`, pa payload s podmetnutim poljem pada s 400
umjesto da se polje tiho ignorira. Promjene statusa idu kroz namjerne endpointe
(`POST /appointments/{id}/cancel`), nikad kroz `PATCH` s poljem `status`.

Test: registracija s `{"role":"ADMIN"}` → 400; ista registracija bez tog polja → CUSTOMER.

## 9. Secure session cookies

**Implementirano.** Token je u cookieju s `HttpOnly` (JavaScript ga ne vidi, pa ga XSS ne
može ukrasti), `SameSite=Lax` i `Path=/`. `Secure` je uključen u `prod` profilu
(`COOKIE_SECURE=true`).

Budući da se koristi cookie, potreban je i CSRF: dvostruko slanje kroz čitljiv `XSRF-TOKEN`
cookie i zaglavlje `X-XSRF-TOKEN`. Zahtjev bez tokena vraća 403 (pokriveno testom).

Token **nikad nije u tijelu odgovora** — postoji test koji provjerava da odgovor na prijavu
ne sadrži JWT.

## 10. Hash passwords

**Implementirano.** BCrypt, cost 10 (`SecurityConfig.passwordEncoder`).

Prijava je otporna na mjerenje vremena: kad korisnik ne postoji, svejedno se odradi jedna
BCrypt provjera protiv lažnog hasha, pa trajanje odgovora ne odaje postoji li e-mail u bazi.
Poruka je identična za nepostojećeg korisnika i za krivu lozinku — pokriveno testom koji
uspoređuje oba odgovora znak po znak.

**Za produkciju:** razmotriti Argon2id i podizanje cost faktora prema stvarnom hardveru.

## 11. Rate limit login

**Implementirano.** Bucket4j, ograničenje po kombinaciji IP adrese i e-maila. Uspješna
prijava briše brojač da legitiman korisnik ne ostane zaključan.

**DEMO ograničenje:** brojači su u memoriji jedne instance. Iza više instanci ili nakon
restarta ograničenje se gubi.
**Za produkciju:** zajednički spremnik (Redis) i ograničenje na razini reverse proxyja.

## 12. Bot protection

**Djelomično — honeypot.** Javne forme (registracija, rezervacija) imaju polje skriveno
od ljudi, a botovi ga popunjavaju. Poslužitelj takav zahtjev odbija, i odgovor **ne imenuje
polje** — inače bi poruka botu točno rekla što izostaviti.

Ovo zaustavlja samo nevješte botove i to je svjesno rečeno, umjesto da se predstavlja kao
prava zaštita.
**Za produkciju:** CAPTCHA (hCaptcha ili Cloudflare Turnstile) na javnim formama.

## 13. Parameterize queries

**Implementirano.** Sav pristup bazi ide kroz Spring Data JPA s imenovanim parametrima.
Nema konkatenacije korisničkog unosa u SQL. Nekoliko nativnih upita (uvjetne izmjene
zalihe) također koristi isključivo `:parametre`.

## 14. Validate all input

**Implementirano na obje strane, s poslužiteljem kao mjerodavnim.** Backend koristi Bean
Validation na svim DTO-ovima; greške se vraćaju kao RFC 7807 `ProblemDetail` s mapom polja.
Frontend koristi Zod s istim pravilima — radi brze povratne informacije, ne radi sigurnosti.

Baza je zadnja crta: `CHECK` constrainti na cijenama, količinama, trajanjima i statusima
vrijede i kad bi aplikacijska provjera zakazala.

## 15. Escape/sanitize user content

**Implementirano kroz React.** React po zadanom escape-a sav tekst, a `dangerouslySetInnerHTML`
se u projektu ne koristi nigdje. Korisnički sadržaj (napomene) sprema se i prikazuje kao
čisti tekst.

## 16. Restrict file uploads

**Nije primjenjivo.** Demo nema upload datoteka — nema slike profila, dokumenata ni
privitaka, pa nema ni površine za napad.
**Za produkciju:** ako se doda (npr. fotografije oštećenja), potrebna je provjera tipa po
sadržaju a ne po ekstenziji, ograničenje veličine, skeniranje i posluživanje s odvojene
domene.

## 17. Trim API responses

**Implementirano.** Postoje dva odvojena prikaza artikla:

- `ProductView` (javno) — **bez** nabavne cijene, fizičkog i rezerviranog stanja;
- `ProductStockView` (skladište/admin) — puni podaci.

Podatak koji ne izađe iz backenda ne može procuriti. Slično, `AppointmentView` popunjava
ime i telefon stranke **samo za osoblje**. Test provjerava da javni odgovor ne sadrži
`purchasePrice`, `physicalQuantity` ni `reservedQuantity`.

Konfiguracija `default-property-inclusion: non_null` dodatno izbacuje prazna polja.

## 18. Security headers

**Implementirano na oba sloja.** Backend (`SecurityConfig`): HSTS, CSP, `X-Frame-Options:
DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
Nginx (`frontend/nginx.conf`) postavlja ista zaglavlja za HTML stranicu.

HSTS u nginxu je zakomentiran dok TLS nije na mjestu — uključen HSTS bez HTTPS-a samo
zaključa korisnike.

## 19. Force HTTPS

**Pripremljeno, nije uključeno u demou.** Demo radi na HTTP-u lokalno, pa bi prisilni
HTTPS onemogućio pokretanje. Pripremljeno je:

- `COOKIE_SECURE=true` u `prod` profilu;
- `server.forward-headers-strategy=framework` — aplikacija ispravno čita `X-Forwarded-Proto`
  iza reverse proxyja;
- HSTS zaglavlje već postavljeno, uz zakomentiranu nginx varijantu.

**Za produkciju:** TLS terminacija na reverse proxyju, preusmjeravanje HTTP → HTTPS,
i odkomentirati HSTS u `nginx.conf`.

## 20. Scan dependencies

**Djelomično implementirano.** `npm audit` prijavljuje **0 ranjivosti**; verzija Vitesta
podignuta je tijekom izrade upravo zbog jedne prijavljene ranjivosti. `npm audit` je dio CI
workflowa. Dependabot je konfiguriran za Maven, npm i GitHub Actions, s grupiranjem
nadogradnji.

Sve ovisnosti su aktualne stabilne verzije (Spring Boot 3.5.x, React 19, Vite 7,
Tailwind 4, PostgreSQL 16).

**Za produkciju:** OWASP Dependency-Check ili Snyk za Java stranu, koja `npm audit` ne
pokriva.

---

## Sažetak

| # | Zahtjev | Status |
|---|---|---|
| 1 | Ključevi nisu u kodu | ✅ implementirano |
| 2 | Tajne se ne commitaju | ✅ implementirano |
| 3 | Pristup bazi | ✅ frontend nema pristup bazi |
| 4 | Row-level security | ⚪ riješeno u aplikaciji, obrazloženo |
| 5 | Zaštita osjetljivih podataka | 🟡 djelomično, ostatak za produkciju |
| 6 | Autentikacija i autorizacija na poslužitelju | ✅ implementirano |
| 7 | Pristup samo vlastitim podacima | ✅ implementirano i testirano |
| 8 | Zabrana field tamperinga | ✅ implementirano i testirano |
| 9 | Sigurni cookieji | ✅ implementirano |
| 10 | Hashiranje lozinki | ✅ implementirano |
| 11 | Rate limit na prijavi | 🟡 radi, ali u memoriji jedne instance |
| 12 | Zaštita od botova | 🟡 honeypot; CAPTCHA za produkciju |
| 13 | Parametrizirani upiti | ✅ implementirano |
| 14 | Validacija unosa | ✅ implementirano na sva tri sloja |
| 15 | Escape korisničkog sadržaja | ✅ implementirano |
| 16 | Ograničenje uploada | ⚪ nema uploada |
| 17 | Trimanje odgovora | ✅ implementirano i testirano |
| 18 | Sigurnosna zaglavlja | ✅ implementirano |
| 19 | Prisilni HTTPS | 🟡 pripremljeno za produkciju |
| 20 | Skeniranje ovisnosti | 🟡 npm pokriven, Java strana za produkciju |
