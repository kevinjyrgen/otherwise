/** All text of the owner's "say no" screen, in one place for translation. */
export default {
  title: 'Why do you want to say no?',
  text: (helper) => `No money will be sent. ${helper} will see your answer.`,
  reasons: {
    NOT_RECOGNISED: 'I do not recognise this',
    WRONG_DETAILS: 'Something looks wrong',
    CHANGED_MIND: 'I changed my mind',
  },
  back: 'Go back',
}
