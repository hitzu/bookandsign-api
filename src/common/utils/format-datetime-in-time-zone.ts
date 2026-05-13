/**
 * Wall clock in `timeZone` for this instant, as `YYYY-MM-DDTHH:mm:ss`.
 * Prefer over `Date#toISOString()` when API consumers should see the same calendar
 * date as in the business timezone (UTC ISO can shift the day).
 */
export function formatDateTimeInTimeZone(date: Date, timeZone: string): string {
  return date
    .toLocaleString('sv-SE', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(' ', 'T');
}
