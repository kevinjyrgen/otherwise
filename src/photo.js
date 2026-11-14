/** Longest side of a photo we send, in pixels. Enough to read a bill, small enough to send fast. */
const MAX_SIDE = 1600

/**
 * Shrinks a photo in the browser and turns it into a JPEG data URL, ready to
 * send to the server as JSON. A phone photo of several megabytes becomes a few
 * hundred kilobytes.
 * @param {Blob} file an image file, e.g. from <input type="file">
 * @returns {Promise<string>} 'data:image/jpeg;base64,…'
 * @throws {Error} if the file is not a picture the browser can read
 */
export async function shrinkPhoto(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((done, fail) => {
      const element = new Image()
      element.onload = () => done(element)
      element.onerror = () => fail(new Error('This does not look like a photo. Please try again.'))
      element.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    const context = canvas.getContext('2d')
    // JPEG has no transparency: put white behind a see-through picture.
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } finally {
    URL.revokeObjectURL(url)
  }
}
