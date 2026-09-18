/** Hrvatsko oblikovanje datuma, vremena i iznosa. Jedno mjesto za sve prikaze. */

const LOCALE = 'hr-HR';
const TIME_ZONE = 'Europe/Zagreb';

export const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return money.format(value);
}

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const weekdayShortFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  timeZone: TIME_ZONE,
});

const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'numeric',
  timeZone: TIME_ZONE,
});

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDayMonth(iso: string): string {
  return dayMonthFormatter.format(new Date(iso));
}

export function formatWeekdayShort(iso: string): string {
  return weekdayShortFormatter.format(new Date(iso)).replace('.', '');
}

/**
 * „sub 19. 09. u 08:00" — oblik kakav se čita naglas.
 *
 * Hrvatski numerički format datuma već završava točkom, pa se ovdje ne dodaje
 * još jedna.
 */
export function formatSlotLabel(iso: string): string {
  return `${formatWeekdayShort(iso)} ${formatDayMonth(iso)} u ${formatTime(iso)}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/** Datum u obliku koji backend očekuje kao query parametar (YYYY-MM-DD). */
export function toIsoDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const WEEKDAYS = ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'];

export function weekdayName(dayOfWeek: number): string {
  return WEEKDAYS[dayOfWeek - 1] ?? '';
}

/** „08:00" iz „08:00:00" — backend šalje sekunde koje nikoga ne zanimaju. */
export function trimSeconds(time: string | null): string {
  return time ? time.slice(0, 5) : '';
}

export function formatQuantity(value: number, unit = 'kom'): string {
  return `${value} ${unit}`;
}
