import { expect, test } from '@playwright/test';
import { dismissCookieBanner, login } from './helpers';

test.describe('portali osoblja', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieBanner(page);
  });

  test('administrator vidi pregled dana s rasporedom i niskom zalihom', async ({ page }) => {
    await login(page, 'admin@demo.local');

    await expect(page.getByRole('heading', { name: 'Pregled dana' })).toBeVisible();
    await expect(page.getByText('TERMINI DANAS')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Raspored za danas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Niska zaliha' })).toBeVisible();
  });

  test('majstor mijenja status termina', async ({ page }) => {
    await login(page, 'majstor@demo.local');
    await expect(page.getByRole('heading', { name: 'Radni nalozi' })).toBeVisible();

    // Test ne pretpostavlja u kojem su statusu današnji termini: raniji prolaz
    // testova ih je mogao pomaknuti. Uzima se prvi dopušteni prijelaz koji
    // sučelje nudi — time se provjerava mehanizam, a ne zatečeni podatak.
    const nextStep = page
      .getByRole('button', { name: /^(Potvrđen|U tijeku|Završen)$/ })
      .first();
    await expect(nextStep).toBeVisible();
    const label = (await nextStep.innerText()).trim();

    await nextStep.click();

    await expect(page.getByText(/Status termina promijenjen/)).toBeVisible();
    await expect(page.getByText(`Status termina promijenjen u „${label.toLowerCase()}".`)).toBeVisible();
  });

  test('skladištar vidi stanje i knjigu prometa', async ({ page }) => {
    await login(page, 'skladiste@demo.local');

    await expect(page.getByRole('heading', { name: 'Zaliha' })).toBeVisible();
    await expect(page.getByText('Rezervirano')).toBeVisible();

    await page.getByRole('link', { name: 'Promet', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Promet zalihe' })).toBeVisible();
    await expect(page.getByText('Početno stanje').first()).toBeVisible();
  });

  test('kupac ne može otvoriti administraciju', async ({ page }) => {
    await login(page, 'ivan@demo.local');
    await page.goto('/admin');

    // Klijentska zaštita vraća korisnika na njegov dio; backend bi ionako odbio.
    await expect(page).toHaveURL(/moj-racun/);
  });
});
