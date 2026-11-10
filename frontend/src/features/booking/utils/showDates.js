/**
 * Date helpers for booking. Shows run on Sri Lanka time (UTC+05:30, no DST),
 * so everything is computed in Colombo time regardless of the viewer's timezone.
 */
const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function parseYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function colomboToday(now = Date.now()) {
  return new Date(now + COLOMBO_OFFSET_MS).toISOString().slice(0, 10);
}

/** The next `days` dates starting from `today` ("YYYY-MM-DD"). */
export function buildDateOptions(today, days) {
  const start = parseYmd(today);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400000);
    const ymd = d.toISOString().slice(0, 10);
    return {
      value: ymd,
      weekday: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
      day: d.getUTCDate(),
      month: d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
      label: formatShowDate(ymd),
    };
  });
}

/** "2026-11-09" -> "Monday, 9 November 2026" */
export function formatShowDate(ymd) {
  if (!ymd) return '';
  return parseYmd(ymd).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "20:30" -> "8:30 PM" */
export function formatShowTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Is this show still on sale (starts more than `cutoffMinutes` from now)? */
export function isShowOnSale(ymd, hhmm, cutoffMinutes = 15, now = Date.now()) {
  const [y, mo, d] = ymd.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const startsAt = Date.UTC(y, mo - 1, d, h, mi) - COLOMBO_OFFSET_MS;
  return startsAt - cutoffMinutes * 60000 > now;
}

export function normaliseShowtimes(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).sort();
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean).sort();
  }
  return [];
}
