/** All text of the owner's "Recipients" page, in one place for translation. */
export default {
  title: 'People you saved',
  text: 'You have paid these people before. To pay them again you only choose the amount.',
  emptyTitle: 'Nobody saved yet',
  emptyText:
    'After money was sent to someone, you can save them with one tap. Next time you do not have to type their account number.',
  pay: 'Send money',
  remove: 'Remove',

  // Confirmation before removing
  removeQuestion: (name) => `Remove ${name} from your saved people?`,
  removeText: 'No money is sent or stopped. You can save them again after the next transfer.',
  yesRemove: 'Yes, remove',
  no: (name) => `No, keep ${name}`,
}
