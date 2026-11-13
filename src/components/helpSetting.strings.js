/** All text about the "when to ask for help" setting, in one place for translation. */
export default {
  every: 'Help me with every transfer',
  overLabel: 'Ask for help when a transfer is over',
  amount: (threshold) => `${threshold} EUR`,

  /** The chosen setting as one line, the way the owner reads it. */
  summary: (helpMode, threshold) =>
    helpMode === 'EVERY'
      ? 'You get help with every transfer.'
      : `You get help when a transfer is over ${threshold} EUR.`,

  /** The same, the way the invited helper reads it. */
  summaryForHelper: (helpMode, threshold) =>
    helpMode === 'EVERY'
      ? 'She wants help with every transfer.'
      : `She wants help when a transfer is over ${threshold} EUR.`,
}

/** Amounts (EUR) offered as thresholds. The server accepts exactly these. */
export const THRESHOLDS = [50, 100, 200]
