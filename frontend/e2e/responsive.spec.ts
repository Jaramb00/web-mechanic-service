import { expect, test } from '@playwright/test';
import { dismissCookieBanner } from './helpers';

/**
 * Mobilni smoke test. Ne provjerava izgled nego da se stranicom može koristiti
 * na uskom ekranu: bez vodoravnog skrolanja i s dohvatljivom navigacijom.
 */
test.describe('mobilni prikaz', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieBanner(page);
  });

  test('javne stranice nemaju vodoravni prelijev', async ({ page }) => {
    for (const path of ['/', '/cjenik', '/rezervacija', '/ponuda-guma', '/kontakt']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `vodoravni prelijev na ${path}`).toBeLessThanOrEqual(2);
    }
  });

  test('izbornik se otvara i vodi na odabranu stranicu', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Otvori izbornik' }).click();
    const menu = page.getByRole('navigation', { name: 'Izbornik' });
    await expect(menu).toBeVisible();

    await menu.getByRole('link', { name: 'Cjenik' }).click();
    await expect(page.getByRole('heading', { name: 'Cjenik', level: 1 })).toBeVisible();
  });

  test('glavni poziv na akciju dohvatljiv je palcem', async ({ page }) => {
    await page.goto('/');

    const cta = page.getByRole('link', { name: /Rezerviraj termin/ }).first();
    await expect(cta).toBeVisible();

    const box = await cta.boundingBox();
    expect(box!.height, 'meta za dodir mora biti barem 44 px').toBeGreaterThanOrEqual(44);
  });
});
