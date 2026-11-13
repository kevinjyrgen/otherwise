/** All text of the owner's "Helper" page, in one place for translation. */
export default {
  title: 'Your helper',

  // No helper yet
  noneText:
    'A helper is someone you trust, like a family member. They fill in a transfer for you. You always check it and send the money yourself.',
  add: 'Add a helper',

  status: { INVITED: 'Invited', ACTIVE: 'Active', DECLINED: 'Declined' },
  statusText: {
    INVITED: (name) => `Waiting for ${name} to answer. We will tell you.`,
    ACTIVE: (name) => `${name} can prepare transfers for you. Only you can send them.`,
    DECLINED: (name) => `${name} said no. You can ask someone else.`,
  },

  settingTitle: 'When you get help',
  changeSetting: 'Change this',
  keepSetting: 'Keep it as it is',

  cancelInvite: 'Take back the invite',
  askSomeoneElse: 'Ask someone else',
  change: 'Change helper',
  remove: 'Remove helper',

  // Confirmation before removing or changing
  removeQuestion: (name) => `Remove ${name} as your helper?`,
  changeQuestion: (name) => `Remove ${name} and choose someone else?`,
  removeText: (name) =>
    `${name} will be told. Transfers ${name} has not finished will be cancelled. No money is sent.`,
  yesRemove: 'Yes, remove',
  yesChange: 'Yes, choose someone else',
  no: (name) => `No, keep ${name}`,
}
