import { existsSync } from 'node:fs';

/**
 * Putanja do Chromiuma za sve provjere koje voze preglednik
 * (e2e, check:a11y, check:site, shots).
 *
 * Postoji zato što okolina za razvoj u oblaku ima predinstaliran Chromium
 * starijeg builda od onoga koji `@playwright/test` očekuje, pa se Playwright
 * ne pokreće sam. Ranije je svaka od tih skripti čitala CHROMIUM_PATH, a
 * nitko tu varijablu nije postavljao — pa nijedna nije radila, tiho.
 */
const PREINSTALLED = '/opt/pw-browsers/chromium';

export function chromiumExecutable() {
  if (process.env.CHROMIUM_PATH) {
    return process.env.CHROMIUM_PATH;
  }
  // `undefined` znači "uzmi svoj". Na računalu gdje je `playwright install`
  // odrađen ova putanja ne postoji, pa ondje ništa ne treba postavljati.
  return existsSync(PREINSTALLED) ? PREINSTALLED : undefined;
}
