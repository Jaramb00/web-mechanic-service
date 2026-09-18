#!/usr/bin/env bash
#
# Vraća demo bazu na početno stanje: briše sve i ponovno odradi migracije sa
# seed podacima.
#
# Seed namjerno NIJE idempotentan — čisti reset je pošteniji i brži od
# pokušaja "dopuni ako nedostaje", koji uvijek ostavi neki zaostali zapis.
#
# Koristi se prije prezentacije klijentu i prije E2E testova.
set -euo pipefail

DB_NAME="${POSTGRES_DB:-vulkanizer}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "Brišem i ponovno stvaram bazu '${DB_NAME}' na ${DB_HOST}:${DB_PORT}…"

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q \
  -c "DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE);" \
  -c "CREATE DATABASE ${DB_NAME};"

echo "Gotovo. Pokrenite backend s profilom 'demo' — Flyway će odraditi shemu i seed:"
echo
echo "    cd backend && SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run"
echo
echo "Demo korisnici (lozinka za sve: Demo1234!):"
echo "    admin@demo.local      administrator"
echo "    majstor@demo.local    majstor"
echo "    skladiste@demo.local  skladištar"
echo "    ivan@demo.local       kupac"
