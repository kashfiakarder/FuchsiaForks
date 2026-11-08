/**
 * Date and time formatting.
 *
 * These deliberately do NOT resolve a named IANA timezone. Chrome and Node
 * disagree about `America/Edmonton` for late 2026 — the same instant renders
 * as 10:00 in one and 11:00 in the other — so anything that leans on the
 * platform's tz database will drift between runtimes and between browser
 * versions. For an app whose entire purpose is "be at this place at this
 * time", that is not an acceptable class of bug.
 *
 * Instead every timestamp is stored as a local wall-clock reading with its
 * offset attached (`2026-11-14T10:00:00-07:00`), and display reads the
 * wall-clock part verbatim. The offset is still there for a backend to
 * compute real instants with later; it simply is not used to re-derive what
 * the clock on the wall said.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

/**
 * Rebuilds the authored wall-clock reading as a UTC Date, so `Intl` can
 * supply weekday and month names without shifting anything.
 */
function wallClock(iso) {
  const m = ISO.exec(String(iso));
  if (!m) return new Date(iso);
  const [, y, mo, d, h = '0', mi = '0'] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
}

const fmt = (options) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options });

export const formatLongDate = (iso) =>
  fmt({ month: 'long', day: 'numeric', year: 'numeric' }).format(wallClock(iso));

export const formatWeekdayDate = (iso) =>
  fmt({ weekday: 'long', month: 'long', day: 'numeric' }).format(wallClock(iso));

export const formatShortDate = (iso) =>
  fmt({ weekday: 'short', month: 'short', day: 'numeric' }).format(wallClock(iso));

export const formatTime = (iso) =>
  fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).format(wallClock(iso));

export const formatTimeRange = (startIso, endIso) =>
  `${formatTime(startIso)} – ${formatTime(endIso)}`;

export const formatMonthAbbr = (iso) =>
  fmt({ month: 'short' }).format(wallClock(iso)).toUpperCase();

export const formatDayNumber = (iso) => fmt({ day: 'numeric' }).format(wallClock(iso));

export const formatReviewDate = (iso) =>
  fmt({ month: 'long', day: 'numeric', year: 'numeric' }).format(wallClock(iso));

/** "THURSDAY, NOVEMBER 12" — the divider between days in a chat thread. */
export const formatChatDay = (iso) =>
  fmt({ weekday: 'long', month: 'long', day: 'numeric' })
    .format(wallClock(iso))
    .toUpperCase();

export const isSameDay = (a, b) =>
  wallClock(a).toISOString().slice(0, 10) === wallClock(b).toISOString().slice(0, 10);

export const formatCount = (n) => new Intl.NumberFormat('en-US').format(n);

/**
 * The current time as a wall-clock-plus-offset string, matching the shape
 * of everything in the seed data. New reviews and messages use this so
 * they format through exactly the same path as authored content.
 */
export function nowLocalIso() {
  const now = new Date();
  const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
    `${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`
  );
}
