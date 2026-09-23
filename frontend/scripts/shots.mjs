/**
 * Snimanje ekrana aplikacije na zahtjev.
 *
 *   npm run shots -- /kontakt /cjenik
 *   npm run shots -- --kao admin@demo.local /admin/termini
 *   npm run shots -- --mobilno /
 *
 * Postoji zato što se u okolini za razvoj u oblaku aplikacija ne može otvoriti
 * u pregledniku (nema ulaznih portova), pa je snimka jedini način da se ekran
 * POKAŽE umjesto da se tvrdi da radi.
 *
 * Prijava ide kroz stvarni obrazac, ne kroz podmetnut kolačić: snima se ono što
 * korisnik doista vidi, uključujući i to da prijava radi.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { chromiumExecutable } from './browser.mjs';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const OUT = new URL('../.shots/', import.meta.url).pathname;
const PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234!';

const args = process.argv.slice(2);
let email = null;
let mobile = false;
const routes = [];

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--kao') {
    email = args[i + 1];
    i += 1;
  } else if (args[i] === '--mobilno') {
    mobile = true;
  } else {
    routes.push(args[i]);
  }
}

if (routes.length === 0) {
  console.error('Upotreba: npm run shots -- [--kao <e-mail>] [--mobilno] <ruta> [<ruta> …]');
  process.exit(2);
}

// Direktorij se NE briše: imena su determinirana po ruti i širini, pa ponovno
// pokretanje prepisuje svoje snimke, a ne odnosi tuđe iz prethodne naredbe.
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: chromiumExecutable() });
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'hr-HR',
  timezoneId: 'Europe/Zagreb',
});

// Banner kolačića bi inače prekrio dno svake snimke.
await context.addInitScript(() => {
  try {
    localStorage.setItem('vulkanizer.cookie-consent', 'rejected');
  } catch {
    /* privatni način rada */
  }
});

const page = await context.newPage();
const failures = [];

if (email) {
  await page.goto(`${BASE}/prijava`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Lozinka').fill(PASSWORD);
  await page.getByRole('button', { name: 'Prijavi se' }).click();
  await page.waitForURL((url) => !url.pathname.includes('prijava'), { timeout: 20_000 });
  console.log(`Prijavljen kao ${email}`);
}

for (const route of routes) {
  const name = (mobile ? 'mob' : 'desk') + (route === '/' ? '-naslovnica' : route.replaceAll('/', '-'));
  const file = `${OUT}${name}.png`;
  try {
    const response = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20_000 });
    // Podaci stižu tek nakon dohvata, pa mreža mora utihnuti prije snimke.
    await page.waitForTimeout(600);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  ${route} → ${file} (HTTP ${response?.status() ?? '?'})`);
  } catch (error) {
    failures.push(`${route}: ${error.message.split('\n')[0]}`);
    console.error(`  ${route} → NEUSPJEH: ${error.message.split('\n')[0]}`);
  }
}

await browser.close();

if (failures.length > 0) {
  console.error(`\nNeuspjelo snimanja: ${failures.length}`);
  process.exit(1);
}
