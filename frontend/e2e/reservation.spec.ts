import { expect, test } from '@playwright/test';
import { dismissCookieBanner, registerCustomer, uniqueEmail } from './helpers';

test.describe('rezervacija artikla', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieBanner(page);
  });

  test('kupac rezervira gumu i vidi je među svojim rezervacijama', async ({ page }) => {
    await registerCustomer(page, uniqueEmail('artikl'));

    await page.goto('/ponuda-guma');
    const firstAvailable = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Rezerviraj', disabled: false }) })
      .first();
    const productName = (await firstAvailable.getByRole('heading').innerText()).trim();

    await firstAvailable.getByRole('button', { name: 'Rezerviraj' }).click();

    await expect(page.getByRole('heading', { name: 'Rezervacija artikla' })).toBeVisible();
    await page.getByLabel('Količina').fill('2');
    await page.getByRole('button', { name: 'Rezerviraj' }).last().click();

    await expect(page.getByRole('heading', { name: 'Rezervacija je zaprimljena' })).toBeVisible();
    await page.getByRole('button', { name: 'Zatvori' }).click();

    await page.goto('/moj-racun/rezervacije');
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText('Na čekanju').first()).toBeVisible();
  });

  test('ne može se rezervirati više nego što je dostupno', async ({ page }) => {
    await registerCustomer(page, uniqueEmail('prekomjerno'));

    await page.goto('/ponuda-guma');
    const firstAvailable = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Rezerviraj', disabled: false }) })
      .first();
    await firstAvailable.getByRole('button', { name: 'Rezerviraj' }).click();

    await page.getByLabel('Količina').fill('99');

    await expect(page.getByText(/Dostupno je najviše/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rezerviraj' }).last()).toBeDisabled();
  });
});
