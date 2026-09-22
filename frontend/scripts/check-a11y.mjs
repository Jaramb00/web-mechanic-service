/**
 * Provjera pristupačnosti (axe-core) po stvarnim rutama aplikacije.
 *
 * Zašto skripta, a ne ručni pregled: kontrast, nazivi polja, redoslijed
 * naslova i uloge elemenata su stvari koje se pri svakoj izmjeni dizajna tiho
 * pokvare. Ručni pregled to uhvati jednom; skripta svaki put.
 *
 * Pokriva i PORTALE, ne samo javne stranice — tablice, obrasci i dijalozi su
 * upravo mjesta gdje pristupačnost najčešće padne, a njih vidi samo prijavljen
 * korisnik.
 *
 * POKRETANJE
 *   npm run dev            # u drugom terminalu
 *   npm run check:a11y
 *
 * Provjerava se WCAG 2.1 razina A i AA. Nalaz „incomplete" (axe ne može sam
 * odlučiti) se ispisuje odvojeno i ne ruši provjeru — te slučajeve treba
 * pogledati okom.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const PUBLIC_ROUTES = [
  '/', '/usluge', '/cjenik', '/hotel-za-gume', '/ponuda-guma', '/o-nama',
  '/kontakt', '/lokacija', '/cesta-pitanja', '/rezervacija', '/prijava',
  '/registracija', '/privatnost', '/uvjeti',
];

/** Portali se gledaju kao uloga koja ih stvarno koristi. */
const PORTALS = [
  { email: 'admin@demo.local', routes: ['/admin', '/admin/termini', '/admin/usluge', '/admin/korisnici', '/admin/radno-vrijeme', '/skladiste', '/skladiste/promet', '/radionica'] },
  { email: 'ivan@demo.local', routes: ['/moj-racun', '/moj-racun/termini', '/moj-racun/vozila', '/moj-racun/rezervacije', '/obavijesti'] },
];

const browser = await chromium.launch({ executablePath: EXECUTABLE });
const violations = new Map();
const incomplete = new Map();
let checked = 0;

async function scan(page, route) {
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  checked += 1;
  for (const v of result.violations) {
    if (!violations.has(v.id)) violations.set(v.id, { ...v, routes: new Set() });
    violations.get(v.id).routes.add(route);
  }
  for (const v of result.incomplete) {
    if (!incomplete.has(v.id)) incomplete.set(v.id, { help: v.help, routes: new Set() });
    incomplete.get(v.id).routes.add(route);
  }
}

async function newPage(context) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('vulkanizer.cookie-consent', 'rejected'); } catch { /* privatni način */ }
  });
  return page;
}

const publicContext = await browser.newContext({ locale: 'hr-HR' });
const publicPage = await newPage(publicContext);
for (const route of PUBLIC_ROUTES) {
  await publicPage.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await scan(publicPage, route);
}
await publicContext.close();

for (const { email, routes } of PORTALS) {
  const context = await browser.newContext({ locale: 'hr-HR' });
  const page = await newPage(context);
  await page.goto(`${BASE}/prijava`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', 'Demo1234!');
  await page.click('button[type=submit]');
  await page.waitForURL((url) => !url.pathname.includes('/prijava'), { timeout: 15000 });
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await scan(page, route);
  }
  await context.close();
}

await browser.close();

console.log(`Provjereno ekrana: ${checked} (WCAG 2.1 A i AA)\n`);

if (incomplete.size) {
  console.log('Za pogledati okom (axe ne može sam odlučiti):');
  for (const [id, v] of incomplete) {
    console.log(`  ${id} — ${v.help} (${v.routes.size} ekrana)`);
  }
  console.log('');
}

if (!violations.size) {
  console.log('Bez nalaza.');
  process.exit(0);
}

console.log(`NALAZA: ${violations.size}\n`);
for (const [id, v] of violations) {
  console.log(`[${v.impact}] ${id} — ${v.help}`);
  console.log(`  rute: ${[...v.routes].join(', ')}`);
  console.log(`  primjer: ${v.nodes[0]?.target?.join(' ')}`);
  console.log(`  ${v.helpUrl}\n`);
}
process.exit(1);
