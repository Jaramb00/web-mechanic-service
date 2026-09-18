import type { Page } from '@playwright/test';

export const DEMO_PASSWORD = 'Demo1234!';

/** Svaki test radi sa svojim korisnikom, pa se testovi ne sudaraju oko podataka. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@e2e.local`;
}

export function uniquePlate(): string {
  const digits = String(Math.floor(Math.random() * 9000) + 1000);
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `ZG${digits}${letters}`;
}

/** Banner kolačića bi inače prekrivao gumbe pri dnu ekrana. */
export async function dismissCookieBanner(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('vulkanizer.cookie-consent', 'rejected');
    } catch {
      /* privatni način rada */
    }
  });
}

export async function login(page: Page, email: string, password = DEMO_PASSWORD): Promise<void> {
  await page.goto('/prijava');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Lozinka').fill(password);
  await page.getByRole('button', { name: 'Prijavi se' }).click();
  await page.waitForURL((url) => !url.pathname.includes('prijava'));
}

export async function registerCustomer(page: Page, email: string): Promise<void> {
  await page.goto('/registracija');
  await page.getByLabel('Ime i prezime').fill('E2E Kupac');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Lozinka').fill('Lozinka123');
  await page.getByRole('button', { name: 'Otvori račun' }).click();
  await page.waitForURL('**/moj-racun');
}
