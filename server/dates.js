/**
 * Calendar-day helpers. A day is a 'YYYY-MM-DD' string, so days compare and
 * sort as plain text. Pure functions only.
 */

/** The local calendar day of a moment in time. */
export function isoDay(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The day `count` days after `day` (negative goes back). */
export function addDays(day, count) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

/** How many days `to` is after `from`. */
export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

/**
 * The first day after `after` that falls on `dayOfMonth`. Days go up to 28,
 * so every month has one.
 * @param {string} after 'YYYY-MM-DD'
 * @param {number} dayOfMonth 1–28
 */
export function nextMonthly(after, dayOfMonth) {
  const [year, month, day] = after.split('-').map(Number)
  // `month` is 1-based: month - 1 is this month, month is the next one.
  const monthIndex = dayOfMonth > day ? month - 1 : month
  return new Date(Date.UTC(year, monthIndex, dayOfMonth)).toISOString().slice(0, 10)
}
