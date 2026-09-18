/** Spaja CSS klase i izbacuje prazne vrijednosti. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
