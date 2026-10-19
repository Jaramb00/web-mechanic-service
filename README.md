# Tyre Service — demo web application

🇭🇷 [Hrvatska verzija](README.hr.md)

A demo (MVP prototype) of a business system for **a single** tyre service: a public
website with online appointment booking, a customer portal, and portals for the mechanic,
the warehouse and the administrator.

> **This is a demo.** All data — the shop name, address, phone, tax ID, prices, items and
> users — is **made up and marked as placeholder**. It must be replaced with real data before
> any public use. The legal pages are templates that must be reviewed by a legal
> professional. See [docs/OPEN-QUESTIONS.md](docs/OPEN-QUESTIONS.md).

---

## Contents

- [What the demo shows](#what-the-demo-shows)
- [Quick start](#quick-start)
- [Demo login details](#demo-login-details)
- [Development without Docker](#development-without-docker)
- [Tests](#tests)
- [Architecture in brief](#architecture-in-brief)
- [Configuration](#configuration)
- [Documentation](#documentation)

---

## What the demo shows

**Public website** — a homepage whose first screen shows the *actual next free slot*
fetched from the API, price list, services, tyre storage, tyres and parts on offer,
contact, location, FAQ, legal pages and a custom 404 page.

**Appointment booking** — choose a service, day and time slot, then the vehicle and a note.
Sign-in is requested only at the end, and the selection is not lost. Taken slots are
**shown hatched**, not hidden: during the season, visible demand is part of the message.

**Customer portal** — vehicles, appointments with status and history, item reservations,
notifications.

**Mechanic portal** — work orders by day, status changes, service notes, recording parts
used (which immediately deducts them from stock).

**Warehouse** — stock levels with available quantity, receiving, issuing and adjustments,
plus a **stock movement ledger** where every change leaves a trace.

**Administration** — daily overview, all appointments, services and prices, users and
roles, opening hours.

Full list: [docs/IMPLEMENTED.md](docs/IMPLEMENTED.md).

---

## Quick start

### One command (recommended for a demo)

Requirements: **Java 21+**, **Node 22+**, **PostgreSQL 16+**.
Maven does not need to be installed — the project ships the Maven Wrapper (`backend/mvnw`),
which downloads the correct version on first run.

```bash
./scripts/start-dev.sh
```

The script checks prerequisites, starts PostgreSQL if it isn't running, creates the database
if it doesn't exist, installs frontend dependencies on first run, then starts the backend
and frontend and waits until both actually respond. At the end it prints the URL and the
demo login details. `Ctrl+C` stops both.

Before presenting to a client, to reset the demo data to its initial state:

```bash
./scripts/start-dev.sh --reset
```

Logs are in `.dev-logs/` (not in Git).

### Docker Compose

```bash
cp .env.example .env
# Open .env and set at least POSTGRES_USER, POSTGRES_PASSWORD and JWT_SECRET.
# Generate JWT_SECRET with:  openssl rand -base64 48

docker compose up --build
```

App: <http://localhost:8080> · Swagger: <http://localhost:8080/swagger-ui.html>

> **Note on verification:** `docker-compose.yml` and the Dockerfiles have only been checked
> syntactically (`docker compose config`). They have not been run, because the development
> environment the demo was built in has no Docker daemon. The backend, frontend and all
> tests have been run and verified directly, against a real PostgreSQL.

### Manually (without Docker)

Requirements: **Java 21+**, **Node 22+**, **PostgreSQL 16+** (Maven comes via `./mvnw`).

```bash
# 1. Database
createdb vulkanizer

# 2. Backend — Flyway sets up the schema and demo data by itself
cd backend
POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres POSTGRES_DB=vulkanizer \
SPRING_PROFILES_ACTIVE=demo \
JWT_SECRET=$(openssl rand -base64 48) \
./mvnw spring-boot:run

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

App: <http://localhost:5173> (Vite proxies `/api` to the backend, so the frontend and the
API share an origin and the token cookie works without CORS — the same as in production
behind nginx.)

### Resetting demo data

Before a presentation or E2E tests:

```bash
./scripts/reset-demo.sh
# then restart the backend with the `demo` profile
```

The seed is intentionally **not** idempotent: a clean reset is more honest and faster than
trying to "fill in what's missing", which always leaves some stray record behind.

---

## Demo login details

Password for **all** demo accounts: `Demo1234!`

| Role | E-mail | What they see |
|---|---|---|
| Administrator | `admin@demo.local` | everything — daily overview, appointments, services, users, opening hours, warehouse |
| Mechanic | `majstor@demo.local` | work orders, statuses, notes, parts used |
| Warehouse | `skladiste@demo.local` | stock, movements, item reservations |
| Customer | `ivan@demo.local` | their own vehicles, appointments and reservations |
| Customer | `ana@demo.local` | same |
| Customer | `marko@demo.local` | same |
| Customer | `petra@demo.local` | same |
| Customer | `tomislav@demo.local` | same |

These details are also shown on the sign-in page while `IS_DEMO` is enabled
(`frontend/src/config/site.ts`). **In production `IS_DEMO` is switched off and the block disappears.**

> The password `Demo1234!` exists solely for demonstration and must not be used anywhere
> else. The hash in the seed migration is a BCrypt hash generated only for this purpose.

---

## Development without Docker

```bash
# Backend
cd backend
./mvnw spring-boot:run       # run
./mvnw verify                # tests (needs PostgreSQL, see below)

# Frontend
cd frontend
npm run dev                  # development server
npm run build                # production build
npm run lint                 # ESLint
npm run typecheck            # TypeScript
npm run test                 # unit tests (Vitest)
npm run e2e                  # E2E tests (Playwright) — needs the backend running
npm run check:site           # links, metadata, H1, alt texts
npm run check:a11y           # axe-core across 27 screens, WCAG 2.1 A and AA
npm run shots -- /kontakt    # screenshots into frontend/.shots/
```

The screenshot script accepts several routes at once, a login (`--kao admin@demo.local`) and
a mobile view (`--mobilno`). Useful when the app can't be opened in a browser — on a headless
server or in a cloud development environment.

---

## Tests

### Backend — 44 integration tests

They run against **real PostgreSQL**, not an in-memory database: the system's key guarantees
(an `EXCLUDE` constraint over `tstzrange`, conditional `UPDATE`s on stock) rely on
PostgreSQL semantics, so an in-memory database would give false greens.

```bash
createdb vulkanizer_test
cd backend && ./mvnw verify
```

What is covered is what can actually go wrong:

- **concurrent booking** of the same slot — exactly as many bookings succeed as there are
  bays, the rest get 409, and no bay ever has two appointments at the same time;
- **cancelling frees the slot** — the same slot is available again after cancellation;
- **concurrent item reservations** — never more is reserved than is available, and every
  item's stock matches the sum of the movement ledger;
- **IDOR** — user A requests user B's vehicle, appointment or reservation and gets **404**
  (not 403, so the record's existence isn't revealed either);
- **privilege escalation** — registering with an injected `role` field fails with 400;
- **rate limit** on sign-in; **CSRF** on mutating requests;
- **module boundaries** (ArchUnit) — no JPA entity leaves its module.

Tests start from an empty database on every run, so they are repeatable.

### Frontend — 24 unit + 12 E2E tests

```bash
cd frontend
npm run test                                  # Vitest
npm run e2e                                   # Playwright (backend must be running)
```

E2E covers sign-up → adding a vehicle → booking → cancelling, item reservation and rejection
of an excessive quantity, the staff portals, and the mobile view (no horizontal overflow,
reachable CTA, menu).

---

## Architecture in brief

```
frontend/  React 19 + TypeScript + Vite + Tailwind 4 + TanStack Query
backend/   Spring Boot 3.5 + Spring Security 6 + JPA + Flyway + PostgreSQL 16
```

The backend is a **modular monolith**: `auth`, `users`, `vehicles`, `appointments`, `catalog`,
`inventory`, `reservations`, `notifications`, `admin`. Each module exposes one public
interface (`XxxFacade`); entities and repositories are package-private and never leave
their module.

Three decisions explain most of the code:

1. **Double booking is prevented in the database**, by a PostgreSQL `EXCLUDE` constraint over
   `(bay_id, tstzrange(start_at, end_at))`, partial on active statuses. There is no
   application-level locking that could be forgotten.
2. **Stock changes only through a conditional `UPDATE`** together with a `CHECK` constraint
   `reserved_quantity <= physical_quantity`. Every change leaves a record in
   `stock_movements`.
3. **Protecting other users' data is in the query, not in a check** —
   `findByIdAndCustomerId(...)` instead of `findById(...)` followed by an `if`. A query
   can't "forget" to check.

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Configuration

Everything is set through environment variables; the template is [`.env.example`](.env.example).
**There are no secrets in the code** and `.env` is in `.gitignore`.

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | yes | database access |
| `JWT_SECRET` | yes (prod) | signing key, min. 32 characters; the app won't start without it in the `prod` profile |
| `SPRING_PROFILES_ACTIVE` | no | `demo` (with seed data) or `prod` |
| `COOKIE_SECURE` | no | **must be `true` in production** |
| `CORS_ALLOWED_ORIGINS` | no | needed only if the frontend is not on the same origin |
| `MAIL_ENABLED` | no | `false` (default) = the notification is written to the log instead of being sent |
| `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SHOP_RECIPIENT` | yes, if `MAIL_ENABLED=true` | the app won't start without any of them |
| `VITE_ANALYTICS_ID` | no | empty = visit analytics disabled |

### E-mail notification about a new booking

When a customer books a slot, the shop receives an e-mail with the slot, service, customer,
phone and vehicle. **No confirmation is sent to the customer** — we have no verification that
the address they entered is really theirs, and sending to unverified addresses is a path to
spam lists. Prerequisites are listed in [docs/OPEN-QUESTIONS.md](docs/OPEN-QUESTIONS.md).

By default sending is **disabled** and the message is written to the log, so the content can
be checked without sending a single e-mail. To actually send via Gmail:

1. Enable two-factor sign-in on the Google account (an App Password doesn't exist without it).
2. Generate an app password at <https://myaccount.google.com/apppasswords> —
   you get 16 characters in four groups.
3. Set the variables and run:

```bash
export MAIL_ENABLED=true
export MAIL_USERNAME=address@gmail.com
export MAIL_PASSWORD='xxxx xxxx xxxx xxxx'   # App Password, NOT the account password
export MAIL_FROM=address@gmail.com           # Gmail requires it to match MAIL_USERNAME
export MAIL_SHOP_RECIPIENT=shop@example.com
./scripts/start-dev.sh
```

If the message doesn't arrive, the reason is in the backend log: `535` means a wrong App
Password, `Connection timed out` means the network blocks port 587. The first message may end
up in "Promotions" or spam — mark it once as "not spam".

Gmail is the choice for the demo (zero sign-up, ~500 messages a day). For production with
your own domain, a transactional provider (Resend, Brevo, Postmark) is the way to go for
deliverability — only `SmtpMailSender` changes, the rest of the code doesn't know which route
a message takes.

Shop details (name, address, phone, tax ID, coordinates) are not in environment variables but
in [`frontend/src/config/site.ts`](frontend/src/config/site.ts), because they are baked into
the build. That is the **only place** the client changes.

---

## Documentation

| Document | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | modules, ER model, key decisions and why they were made |
| [docs/SECURITY.md](docs/SECURITY.md) | all 20 security requirements: what is implemented, what is prepared, what isn't and why |
| [docs/IMPLEMENTED.md](docs/IMPLEMENTED.md) | list of implemented features |
| [docs/OPEN-QUESTIONS.md](docs/OPEN-QUESTIONS.md) | questions for the client and a list of future features |
| [PRODUCT.md](PRODUCT.md) | product context: who the user is, in what situation, what the system must enable |
| [DESIGN.md](DESIGN.md) | visual system: tokens, components, rules |
