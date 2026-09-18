import { expect, test } from '@playwright/test';
import { dismissCookieBanner, registerCustomer, uniqueEmail, uniquePlate } from './helpers';

test.describe('rezervacija termina', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieBanner(page);
  });

  test('od registracije do potvrđenog i otkazanog termina', async ({ page }) => {
    const email = uniqueEmail('booking');
    const plate = uniquePlate();

    await registerCustomer(page, email);

    // Vozilo je preduvjet za termin — bez njega servis ne zna što dolazi.
    await page.goto('/moj-racun/vozila');
    await page.getByRole('button', { name: 'Dodaj vozilo' }).first().click();
    await page.getByLabel('Marka').fill('Volkswagen');
    await page.getByLabel('Model').fill('Golf');
    await page.getByLabel('Registracija').fill(plate);
    await page.getByLabel('Dimenzija guma').fill('205/55 R16');
    await page.getByRole('button', { name: 'Spremi vozilo' }).click();
    await expect(page.getByText('Vozilo je dodano.')).toBeVisible();
    await expect(page.getByText(plate)).toBeVisible();

    await page.goto('/rezervacija');

    // Stranica se otvara na danu na kojem stvarno ima mjesta.
    const slots = page.getByRole('group', { name: /Slobodni termini/ }).getByRole('button');
    await expect(slots.first()).toBeVisible();
    // Gumb uz vrijeme nosi i opis za čitače ekrana, pa se uzima samo prvi redak.
    const chosen = (await slots.first().innerText()).trim().split('\n')[0];
    await slots.first().click();
    await expect(slots.first()).toHaveAttribute('aria-pressed', 'true');

    await page.getByLabel('Napomena za servis').fill('E2E test rezervacija.');
    await page.getByRole('button', { name: 'Potvrdi rezervaciju' }).click();

    await expect(page.getByRole('heading', { name: 'Termin je rezerviran' })).toBeVisible();
    // Potvrda mora pokazati točno onaj termin koji je korisnik odabrao.
    await expect(page.getByText(new RegExp(`u ${chosen}$`))).toBeVisible();

    // Termin mora biti vidljiv u korisnikovom pregledu i otkaziv.
    await page.goto('/moj-racun/termini');
    await expect(page.getByText('Na čekanju').first()).toBeVisible();

    await page.getByRole('button', { name: 'Otkaži termin' }).first().click();
    await page.getByRole('button', { name: 'Da, otkaži' }).click();
    await expect(page.getByText('Termin je otkazan. Mjesto je oslobođeno za druge.')).toBeVisible();
    await expect(page.getByText('Otkazan').first()).toBeVisible();
  });

  test('neprijavljeni posjetitelj vidi termine, ali ih ne može potvrditi', async ({ page }) => {
    await page.goto('/rezervacija');

    const slots = page.getByRole('group', { name: /Slobodni termini/ }).getByRole('button');
    await expect(slots.first()).toBeVisible();
    await slots.first().click();

    await expect(page.getByText('Za dovršetak je potrebna prijava')).toBeVisible();
    await expect(page.getByRole('button', { name: /Potvrdi rezervaciju/ })).toBeDisabled();
  });

  test('legenda objašnjava i zauzete termine, koji se prikazuju a ne skrivaju', async ({ page }) => {
    await page.goto('/rezervacija');

    // Šrafura sama po sebi nije samoobjašnjiva, pa legenda mora imenovati sva
    // tri stanja — uključujući zauzeto, koje se namjerno i dalje prikazuje.
    const legend = page.getByRole('list').filter({ hasText: 'Zauzeto' }).first();
    await expect(legend.getByText('Slobodno', { exact: true })).toBeVisible();
    await expect(legend.getByText('Zauzeto', { exact: true })).toBeVisible();
    await expect(legend.getByText('Vaš odabir', { exact: true })).toBeVisible();
  });
});
