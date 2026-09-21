/**
 * Provjera javne stranice prije objave: nema slomljenih internih poveznica i
 * svaka javna ruta ima naslov, opis, canonical i Open Graph podatke.
 *
 * Pokretanje:  npm run check:site        (traži pokrenut dev ili preview server)
 */
import { chromium } from '@playwright/test';

const BASE = process.env.CHECK_BASE_URL ?? 'http://localhost:5173';
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;

/** Rute koje su namijenjene tražilicama i posjetiteljima. */
const PUBLIC_ROUTES = [
  '/', '/usluge', '/cjenik', '/hotel-za-gume', '/ponuda-guma',
  '/o-nama', '/kontakt', '/lokacija', '/cesta-pitanja', '/rezervacija',
];
/** Rute koje moraju postojati, ali ne smiju biti indeksirane. */
const NOINDEX_ROUTES = ['/privatnost', '/uvjeti', '/prijava', '/registracija'];

const problems = [];
const visitedLinks = new Set();

const browser = await chromium.launch({ executablePath: EXECUTABLE });
const context = await browser.newContext({ locale: 'hr-HR' });
const page = await context.newPage();
await page.addInitScript(() => {
  try { localStorage.setItem('vulkanizer.cookie-consent', 'rejected'); } catch { /* ignore */ }
});

async function readMeta(route, { expectIndexable }) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(350);

  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
    h1Count: document.querySelectorAll('h1').length,
    imagesWithoutAlt: Array.from(document.querySelectorAll('img')).filter(
      (img) => !img.hasAttribute('alt'),
    ).length,
    links: Array.from(document.querySelectorAll('a[href^="/"]')).map((a) => a.getAttribute('href')),
  }));

  if (meta.title.length < 10) problems.push(`${route}: naslov je prekratak ili nedostaje`);
  if (meta.description.length < 40) problems.push(`${route}: meta description je prekratak ili nedostaje`);
  if (!meta.canonical.startsWith('http')) problems.push(`${route}: nedostaje canonical`);
  if (!meta.ogTitle || !meta.ogDescription) problems.push(`${route}: nepotpuni Open Graph podaci`);
  if (!meta.ogImage) problems.push(`${route}: nedostaje og:image`);
  if (meta.h1Count !== 1) problems.push(`${route}: ima ${meta.h1Count} H1 naslova, treba točno 1`);
  if (meta.imagesWithoutAlt > 0) problems.push(`${route}: ${meta.imagesWithoutAlt} slika bez alt teksta`);

  const indexable = !meta.robots.includes('noindex');
  if (expectIndexable && !indexable) problems.push(`${route}: javna ruta je označena noindex`);
  if (!expectIndexable && indexable) problems.push(`${route}: privatna ruta nije označena noindex`);

  meta.links.forEach((href) => visitedLinks.add(href.split('#')[0]));
}

for (const route of PUBLIC_ROUTES) await readMeta(route, { expectIndexable: true });
for (const route of NOINDEX_ROUTES) await readMeta(route, { expectIndexable: false });

// Svaka pronađena interna poveznica mora voditi na stvarnu stranicu, a ne na 404.
for (const href of [...visitedLinks].sort()) {
  await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  const isNotFound = await page.evaluate(() =>
    document.body.innerText.includes('Ovdje nema ničega'),
  );
  if (isNotFound) problems.push(`slomljena poveznica: ${href} vodi na stranicu 404`);
}

// Statičke datoteke koje tražilice očekuju.
for (const asset of ['/robots.txt', '/sitemap.xml', '/favicon.svg', '/og-image.png', '/apple-touch-icon.png']) {
  const response = await page.request.get(`${BASE}${asset}`);
  if (!response.ok()) problems.push(`${asset}: nedostupan (HTTP ${response.status()})`);
}

await browser.close();

console.log(`Provjereno ruta: ${PUBLIC_ROUTES.length + NOINDEX_ROUTES.length}, poveznica: ${visitedLinks.size}`);
if (problems.length === 0) {
  console.log('Bez nalaza.');
} else {
  console.log(`\nNalaza: ${problems.length}`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exitCode = 1;
}
