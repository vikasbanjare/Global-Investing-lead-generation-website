// US regular session: Mon–Fri, 9:30–16:00 New York time.
// ponytail: US market holidays are not excluded; add an NYSE holiday list before launch.
const OPEN = 9 * 60 + 30;
const CLOSE = 16 * 60;

function nyParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}

export function formatWait(m) {
  if (m >= 1440) return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m % 60}m`;
}

export function marketStatus(date = new Date()) {
  const { weekday, minutes } = nyParts(date);
  const weekdayOpen = (d) => d >= 1 && d <= 5;
  if (weekdayOpen(weekday) && minutes >= OPEN && minutes < CLOSE) {
    return { open: true, minutesLeft: CLOSE - minutes, text: `US market open, closes in ${formatWait(CLOSE - minutes)}.` };
  }
  for (let d = 0; d < 8; d++) {
    const day = (weekday + d) % 7;
    if (!weekdayOpen(day)) continue;
    if (d === 0 && minutes >= OPEN) continue;
    const wait = d * 1440 - minutes + OPEN;
    return { open: false, minutesLeft: wait, text: `US market opens in ${formatWait(wait)}.` };
  }
  return { open: false, minutesLeft: 0, text: '' };
}

export function cityTime(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date);
}

// US regular session expressed in India time (IST, UTC+5:30, no DST), aware of US daylight saving.
// Returns minutes after IST midnight; close may exceed 1440 (it ends after midnight IST).
export function usSessionInIST(date = new Date()) {
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })
    .formatToParts(date).find((p) => p.type === 'timeZoneName').value; // e.g. "GMT-4"
  const nyOffset = Number(tz.replace('GMT', '') || 0) * 60;              // -240 (EDT) or -300 (EST)
  const shift = 330 - nyOffset;                                          // IST minus NY, in minutes
  return { open: OPEN + shift, close: CLOSE + shift };
}

export function istClock(min) {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')}\u00a0${h < 12 ? 'am' : 'pm'}`; // nbsp keeps time and am/pm together
}

// Reference prices (USD) for the page's illustrations: the ticker's starting points and the fraction examples.
// ponytail: fixed, illustrative; replace with a quotes API (needs a market-data provider key) before launch.
export const REF_PRICES = { AAPL: 232.1, NVDA: 181.4, GOOGL: 196.2, AMZN: 224.6, TSLA: 318.9, META: 702.3, NFLX: 1185, V: 342.5, AVGO: 298.7, MA: 571.2, KO: 69.8, SBUX: 92.4, MCD: 301.6, GS: 712.8, AXP: 305.1, BAC: 47.9 };
