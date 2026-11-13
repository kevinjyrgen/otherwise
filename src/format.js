/** Display helpers shared by both roles. */

/** "1,240.50 EUR" */
export function formatMoney(amount, currency) {
  const number = Number(amount).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${number} ${currency}`
}

/** Groups an IBAN in fours so it is easier to compare: "EE38 2200 2210 …" */
export function formatIban(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}
