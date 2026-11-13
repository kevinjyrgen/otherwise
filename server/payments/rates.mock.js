/**
 * MOCK exchange rates and fees. These numbers are made up for the demo and are
 * only used when the Wise sandbox is not configured.
 */

/** The owner's account currency. Every transfer is sent from it. */
export const SOURCE_CURRENCY = 'EUR'

/** MOCK: how much of each currency one EUR buys. */
export const MOCK_RATES = Object.freeze({
  EUR: 1,
  GBP: 0.85,
  USD: 1.08,
  SEK: 11.3,
  PLN: 4.3,
})

/** Rounds money to cents. */
export const round2 = (value) => Math.round(value * 100) / 100

/**
 * MOCK quote. The fee is added on top of the amount, so
 * total = amount + fee and the recipient gets amount × rate.
 * @param {number} sourceAmount amount in EUR
 * @param {string} targetCurrency key of MOCK_RATES
 */
export function mockQuote(sourceAmount, targetCurrency) {
  const rate = MOCK_RATES[targetCurrency]
  const sameCurrency = targetCurrency === SOURCE_CURRENCY
  const fee = sameCurrency ? 0.35 : round2(0.3 + sourceAmount * 0.005)
  return {
    sourceAmount,
    sourceCurrency: SOURCE_CURRENCY,
    targetCurrency,
    rate,
    fee,
    targetAmount: round2(sourceAmount * rate),
    total: round2(sourceAmount + fee),
    // 0 = today, 1 = next working day.
    arrivalDays: sameCurrency ? 0 : 1,
    mock: true,
  }
}
