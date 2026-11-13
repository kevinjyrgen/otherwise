/** All text of the "ask the helper" screen, in one place for translation. */
export default {
  title: (helper) => `Ask ${helper} to prepare it`,
  text: (helper) =>
    `${helper} will fill in who gets the money and how much. Nothing is sent until you have checked it and said yes.`,
  noteLabel: (helper) => `A note for ${helper} (if you like)`,
  notePlaceholder: 'For example: the rent for December',
  ask: (helper) => `Ask ${helper}`,
  back: 'Go back',
}
