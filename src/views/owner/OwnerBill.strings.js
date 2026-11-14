/** All text of the "pay a bill from a photo" screen, in one place for translation. */
export default {
  title: (helper) => `Ask ${helper} to pay a bill`,
  text: (helper) =>
    `Take a photo of the bill. ${helper} reads it and fills in the transfer for you. Nothing is sent until you have checked it and said yes.`,
  take: 'Take a photo of the bill',
  retake: 'Take another photo',
  // Demo aid: a made-up bill that ships with the prototype.
  sample: 'No bill at hand? Use a sample bill',
  reading: 'Getting the photo ready…',
  yourPhoto: 'Your photo',
  noteLabel: (helper) => `A note for ${helper} (if you like)`,
  notePlaceholder: 'For example: this is due on Friday',
  send: (helper) => `Send to ${helper}`,
  sending: 'Sending…',
  back: 'Go back',
}
