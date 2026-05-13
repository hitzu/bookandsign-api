import { formatDateTimeInTimeZone } from './format-datetime-in-time-zone';

describe('formatDateTimeInTimeZone', () => {
  it('should format wall time in the zone so the calendar day matches that region', () => {
    const instant = new Date('2026-05-17T02:00:00.000Z');
    expect(formatDateTimeInTimeZone(instant, 'America/Mexico_City')).toBe('2026-05-16T20:00:00');
  });
});
