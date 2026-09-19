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

REPORTED=false
fail() { REPORTED=true; printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# Mreža sigurnosti. Uz `set -e` svaka neuhvaćena greška gasi skriptu bez poruke,
# a tihi izlaz je najgora moguća povratna informacija: korisnik ne zna ni je li
# nešto pošlo po zlu. Ako se to ipak dogodi, barem kažemo gdje.
on_error() {
  local code=$?
  [ "$REPORTED" = true ] && return 0
  printf '\n\033[31m✗ Skripta je neočekivano prekinuta (redak %s, izlazni kod %s).\033[0m\n' "$1" "$code" >&2
  printf '  Prijavite ovo s ispisom iznad.\n' >&2
  return 0
}
trap 'on_error $LINENO' ERR

# --- 1. Preduvjeti ---------------------------------------------------------
say "Provjeravam preduvjete"

# Maven NIJE preduvjet: projekt nosi Maven Wrapper, koji pri prvom pokretanju
# sam skine ispravnu verziju Mavena. Sustavski `mvn` koristimo samo ako wrapper
# iz nekog razloga nedostaje.
if [ -x "$ROOT/backend/mvnw" ]; then
  MVN="$ROOT/backend/mvnw"
elif command -v mvn >/dev/null 2>&1; then
  MVN="mvn"
else
  MVN=""
fi

# Sve što nedostaje prijavljujemo odjednom — inače korisnik instalira jedno po
# jedno i svaki put ponovno pokreće skriptu.
MISSING=""
for cmd in node npm psql; do
  command -v "$cmd" >/dev/null 2>&1 || MISSING="$MISSING $cmd"
done
[ -n "$MVN" ] || MISSING="$MISSING maven"

# Javu provjeravamo POKRETANJEM, ne postojanjem naredbe: macOS isporučuje
# /usr/bin/java kao stub koji postoji i kad nijedan JDK nije instaliran, pa
# `command -v java` prolazi, a `java -version` padne.
if ! java -version >/dev/null 2>&1; then
  MISSING="$MISSING java"
fi

if [ -n "$MISSING" ]; then
  # Nazivi paketa se razlikuju po sustavu, pa ih ne pogađamo — ispisujemo točnu naredbu.
  case "$(uname -s)" in
    Darwin)
      JAVA_CMD="brew install --cask temurin@21"
      NODE_CMD="brew install node"
      PG_CMD="brew install postgresql@16 && brew services start postgresql@16"
      MVN_CMD="brew install maven" ;;
    Linux)
      JAVA_CMD="sudo apt install openjdk-21-jdk"
      NODE_CMD="sudo apt install nodejs npm"
      PG_CMD="sudo apt install postgresql-16 postgresql-client-16"
      MVN_CMD="sudo apt install maven" ;;
    *)
      JAVA_CMD="instalirajte JDK 21"
      NODE_CMD="instalirajte Node 22"
      PG_CMD="instalirajte PostgreSQL 16"
      MVN_CMD="instalirajte Maven 3.9+" ;;
  esac
  HINTS=""
  for m in $MISSING; do
    case "$m" in
      java)     HINTS="$HINTS\n    $JAVA_CMD" ;;
      node)     HINTS="$HINTS\n    $NODE_CMD" ;;
      npm)      ;;   # dolazi uz node, ne prijavljujemo dvaput
      psql)     HINTS="$HINTS\n    $PG_CMD" ;;
      maven)    HINTS="$HINTS\n    $MVN_CMD   (ili vratite backend/mvnw iz repozitorija)" ;;
    esac
  done
  # shellcheck disable=SC2059
  fail "$(printf "Nedostaje:%s\n\n  Instalirajte s:%b\n" "$MISSING" "$HINTS")"
fi

# Verziju vadimo iz navodnika (version "21.0.10"), a ne iz prvog retka: kad je
# postavljen JAVA_TOOL_OPTIONS ili _JAVA_OPTIONS, JVM prvo ispiše redak
# "Picked up …" i parsiranje prvog retka javi pogrešnu verziju.
#
# `|| true` na kraju je nužan: uz `set -e` i `pipefail` cjevovod koji ništa ne
# nađe sruši skriptu BEZ IJEDNE PORUKE. Provjera verzije nikad ne smije biti
# tiši način da se odustane od posla.
JAVA_MAJOR="$(java -version 2>&1 | grep -Eo '"[0-9]+' | head -1 | tr -d '"' || true)"
if [ -z "$JAVA_MAJOR" ]; then
  echo "  Upozorenje: ne mogu pročitati verziju Jave — nastavljam, build će javiti ako je prestara."
elif [ "$JAVA_MAJOR" -lt 21 ]; then
  fail "Java $JAVA_MAJOR je prestara — potrebna je 21 ili novija.
  macOS:  brew install --cask temurin@21"
fi

NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)"
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

# Homebrew na macOS-u NE stvara ulogu 'postgres' — superkorisnik se zove kao
# korisnik sustava i nema lozinku. Zato probamo redom i uzmemo prvu koja spoji,
# umjesto da tvrdimo da PostgreSQL ne radi.
if [ -z "${POSTGRES_USER:-}" ]; then
  for candidate in postgres "$(id -un)"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$candidate" -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
      DB_USER="$candidate"
      break
    fi
  done
fi

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
  fail \
"Ne mogu se spojiti na PostgreSQL kao '${DB_USER}'.
  Postavite ispravne podatke i pokušajte ponovno, npr.:
    POSTGRES_USER=$(id -un) POSTGRES_PASSWORD='' ./scripts/start-dev.sh"
fi
echo "  Spojen kao '${DB_USER}'."

psql_root() { psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

if [ "$RESET" = true ]; then
  say "Resetiram demo podatke"
  POSTGRES_USER="$DB_USER" POSTGRES_DB="$DB_NAME" POSTGRES_HOST="$DB_HOST" \
  POSTGRES_PORT="$DB_PORT" "$ROOT/scripts/reset-demo.sh" >/dev/null
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
  "$MVN" -q spring-boot:run
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
