#!/usr/bin/env bash
#
# Diže cijeli demo jednom naredbom: baza → backend → frontend.
#
# Namijenjeno prezentaciji i lokalnom razvoju. Namjerno NE koristi Docker, jer
# je ovo put koji je stvarno pokretan i provjeravan.
#
#   ./scripts/start-dev.sh            # pokreni
#   ./scripts/start-dev.sh --reset    # prvo vrati demo podatke na početno stanje
#
# Ctrl+C gasi i backend i frontend.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/.dev-logs"

DB_NAME="${POSTGRES_DB:-vulkanizer}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKEND_PORT="${SERVER_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

RESET=false
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=true ;;
    -h|--help)
      sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "Nepoznat argument: $arg (dozvoljeno: --reset, --help)" >&2
      exit 2 ;;
  esac
done

say()  { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
fail() { printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# --- 1. Preduvjeti ---------------------------------------------------------
say "Provjeravam preduvjete"
for cmd in java mvn node npm psql; do
  command -v "$cmd" >/dev/null 2>&1 || fail "Nedostaje '$cmd'. Potrebno: Java 21+, Maven 3.9+, Node 22+, PostgreSQL klijent."
done

# Verziju vadimo iz navodnika (version "21.0.10"), a ne iz prvog retka: kad je
# postavljen JAVA_TOOL_OPTIONS ili _JAVA_OPTIONS, JVM prvo ispiše redak
# "Picked up …" i parsiranje prvog retka javi pogrešnu verziju.
JAVA_MAJOR="$(java -version 2>&1 | grep -Eo '"[0-9]+' | head -1 | tr -d '"')"
if [ -z "$JAVA_MAJOR" ]; then
  echo "  Upozorenje: ne mogu pročitati verziju Jave — nastavljam, Maven će javiti ako je prestara."
elif [ "$JAVA_MAJOR" -lt 21 ]; then
  fail "Java $JAVA_MAJOR je prestara — potrebna je 21 ili novija."
fi

NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [ -z "$NODE_MAJOR" ]; then
  echo "  Upozorenje: ne mogu pročitati verziju Nodea — nastavljam."
elif [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node $NODE_MAJOR je prestar — potreban je 20 ili noviji (preporuka 22)."
fi

# --- 2. Baza ---------------------------------------------------------------
say "Provjeravam PostgreSQL na ${DB_HOST}:${DB_PORT}"
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; then
  # Na Debianu/Ubuntuu klaster znamo pokrenuti sami; drugdje korisnik zna bolje od nas.
  if command -v pg_ctlcluster >/dev/null 2>&1; then
    echo "  Poslužitelj ne radi — pokrećem lokalni klaster…"
    pg_ctlcluster 16 main start 2>/dev/null || true
  fi
  pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null || fail \
"PostgreSQL ne odgovara na ${DB_HOST}:${DB_PORT}.
  macOS (Homebrew):  brew services start postgresql@16
  Debian/Ubuntu:     sudo pg_ctlcluster 16 main start
  Windows:           pokrenite servis 'postgresql-x64-16'"
fi

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
psql_root() { psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

if [ "$RESET" = true ]; then
  say "Resetiram demo podatke"
  "$ROOT/scripts/reset-demo.sh" >/dev/null
  echo "  Baza '${DB_NAME}' je ponovno stvorena — Flyway će je popuniti pri dizanju."
elif ! psql_root -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  say "Stvaram bazu '${DB_NAME}'"
  psql_root -c "CREATE DATABASE ${DB_NAME};"
else
  echo "  Baza '${DB_NAME}' postoji."
fi

# --- 3. Ovisnosti frontenda ------------------------------------------------
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  say "Instaliram ovisnosti frontenda (prvi put traje minutu-dvije)"
  (cd "$ROOT/frontend" && npm install)
fi

# --- 4. Pokretanje ---------------------------------------------------------
mkdir -p "$LOG_DIR"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  printf '\n\033[1m▸ Gasim…\033[0m\n'
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

say "Dižem backend (profil demo) na portu ${BACKEND_PORT}"
echo "  Log: ${LOG_DIR}/backend.log"
(
  cd "$ROOT/backend"
  SPRING_PROFILES_ACTIVE=demo \
  POSTGRES_DB="$DB_NAME" POSTGRES_USER="$DB_USER" \
  POSTGRES_HOST="$DB_HOST" POSTGRES_PORT="$DB_PORT" \
  POSTGRES_PASSWORD="$PGPASSWORD" \
  mvn -q spring-boot:run
) > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

printf '  Čekam da se digne '
for _ in $(seq 1 120); do
  if curl -sf -m 2 "http://localhost:${BACKEND_PORT}/actuator/health" >/dev/null 2>&1; then
    printf ' spreman.\n'
    break
  fi
  kill -0 "$BACKEND_PID" 2>/dev/null || {
    printf '\n'
    tail -30 "$LOG_DIR/backend.log" >&2
    fail "Backend se ugasio pri pokretanju. Cijeli log: ${LOG_DIR}/backend.log"
  }
  printf '.'
  sleep 2
done

curl -sf -m 2 "http://localhost:${BACKEND_PORT}/actuator/health" >/dev/null 2>&1 || {
  tail -30 "$LOG_DIR/backend.log" >&2
  fail "Backend se nije digao u 4 minute. Cijeli log: ${LOG_DIR}/backend.log"
}

say "Dižem frontend na portu ${FRONTEND_PORT}"
echo "  Log: ${LOG_DIR}/frontend.log"
(cd "$ROOT/frontend" && npm run dev -- --port "$FRONTEND_PORT") > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

printf '  Čekam da se digne '
for _ in $(seq 1 60); do
  if curl -sf -m 2 -o /dev/null "http://localhost:${FRONTEND_PORT}/"; then
    printf ' spreman.\n'
    break
  fi
  kill -0 "$FRONTEND_PID" 2>/dev/null || {
    printf '\n'
    tail -30 "$LOG_DIR/frontend.log" >&2
    fail "Frontend se ugasio pri pokretanju. Cijeli log: ${LOG_DIR}/frontend.log"
  }
  printf '.'
  sleep 1
done

cat <<INFO

────────────────────────────────────────────────────────────
  Aplikacija:  http://localhost:${FRONTEND_PORT}
  Swagger UI:  http://localhost:${BACKEND_PORT}/swagger-ui.html

  Demo korisnici — lozinka za sve: Demo1234!
    admin@demo.local       administrator
    majstor@demo.local     majstor
    skladiste@demo.local   skladištar
    ivan@demo.local        kupac

  Ctrl+C gasi backend i frontend.
────────────────────────────────────────────────────────────

INFO

wait
