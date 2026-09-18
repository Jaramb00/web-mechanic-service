/**
 * Analitika — pripremljena, namjerno neaktivna.
 *
 * DEMO: nijedna skripta treće strane se ne učitava dok posjetitelj ne pristane
 * na kolačiće I dok klijent ne upiše svoj mjerni ID. Dok je `VITE_ANALYTICS_ID`
 * prazan, `track` samo bilježi u konzolu u razvoju i ne radi ništa u produkciji.
 *
 * Ovo je svjesna odluka: lažna integracija koja "izgleda kao da mjeri" gora je
 * od jasno označenog mjesta na koje se prava integracija spoji.
 */

const MEASUREMENT_ID = import.meta.env.VITE_ANALYTICS_ID ?? '';
const CONSENT_KEY = 'vulkanizer.cookie-consent';

export type ConsentValue = 'accepted' | 'rejected';

export function readConsent(): ConsentValue | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : null;
  } catch {
    return null;
  }
}

export function storeConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* privatni način rada — pristanak se jednostavno ne pamti */
  }
}

export function analyticsEnabled(): boolean {
  return MEASUREMENT_ID !== '' && readConsent() === 'accepted';
}

/** Mjesto na koje se spaja stvarni alat kad ga klijent odabere. */
export function track(event: string, payload: Record<string, unknown> = {}): void {
  if (!analyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.debug('[analytics — neaktivno]', event, payload);
    }
    return;
  }
  // TODO(klijent): ovdje ide poziv odabranog alata (npr. gtag / Plausible).
}
