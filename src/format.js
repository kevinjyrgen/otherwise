/** Display helpers shared by both roles. */

/** "1,240.50 EUR" */
export function formatMoney(amount, currency) {
  const number = Number(amount).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${number} ${currency}`
}

/** "1st", "2nd", "3rd", "21st" */
export function ordinal(number) {
  const lastTwo = number % 100
  const suffix =
    lastTwo >= 11 && lastTwo <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][number % 10] ?? 'th')
  return `${number}${suffix}`
}

/** A 'YYYY-MM-DD' day as "1 December". */
export function formatDay(day) {
  // Noon, so no time zone can push it onto the day before or after.
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

/** Groups an IBAN in fours so it is easier to compare: "EE38 2200 2210 …" */
export function formatIban(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}
