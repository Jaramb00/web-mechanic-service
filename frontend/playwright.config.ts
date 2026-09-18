import { defineConfig, devices } from '@playwright/test';

/**
 * E2E testovi traže da backend radi na :8080 s `demo` profilom (seed podaci) i
 * da je frontend dostupan na :5173. Frontend Playwright podiže sam ako već ne
 * radi; backend se podiže odvojeno jer mu treba baza (vidi README).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // termini i zaliha su zajednički resurs; paralelno bi se sudarali
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'hr-HR',
    timezoneId: 'Europe/Zagreb',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      // Mobilni smoke test pripada isključivo mobilnom projektu.
      testIgnore: /responsive\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Okolina ima predinstaliran Chromium starijeg builda od onoga koji
        // @playwright/test očekuje, pa se putanja zadaje eksplicitno.
        launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
      },
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
