import { describe, expect, it } from 'vitest';
import { formatPrice, formatSlotLabel, toIsoDate, trimSeconds, weekdayName } from './format';

describe('oblikovanje podataka', () => {
  it('cijenu prikazuje u eurima s dvije decimale', () => {
    expect(formatPrice(60)).toContain('60,00');
    expect(formatPrice(1234.5)).toContain('1.234,50');
  });

  it('nedostajuću cijenu prikazuje crticom umjesto praznine ili nule', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
  });

  it('termin ispisuje bez dvostruke točke', () => {
    const label = formatSlotLabel('2026-09-19T06:00:00Z');
    expect(label).not.toMatch(/\.\./);
    expect(label).toMatch(/^sub 19\. 09\. u \d{2}:\d{2}$/);
  });

  it('datum pretvara u oblik koji backend očekuje, u lokalnoj zoni', () => {
    // Ponoć po lokalnom vremenu ne smije "pobjeći" na prethodni dan.
    expect(toIsoDate(new Date(2026, 8, 19, 0, 30))).toBe('2026-09-19');
  });

  it('sa vremena skida sekunde koje nikoga ne zanimaju', () => {
    expect(trimSeconds('08:00:00')).toBe('08:00');
    expect(trimSeconds(null)).toBe('');
  });

  it('dane u tjednu imenuje na hrvatskom', () => {
    expect(weekdayName(1)).toBe('ponedjeljak');
    expect(weekdayName(7)).toBe('nedjelja');
  });
});
