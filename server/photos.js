/**
 * Bill photos. The owner sends one with her request so she does not have to
 * type anything; it is stored as a file and only ever read back through a
 * transfer the reader is part of.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { RuleError } from './errors.js'
import { UPLOAD_DIR } from './store.js'

/** Largest photo we keep. The app shrinks photos before sending, so this is generous. */
const MAX_BYTES = 4 * 1024 * 1024

/** Accepted image types: file extension and the bytes every such file starts with. */
const TYPES = {
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
}

const notAPhoto = () => new RuleError(400, 'This does not look like a photo. Please try again.')

/**
 * Checks and stores a photo.
 * @param {string} dataUrl 'data:image/jpeg;base64,…' as the browser produces it
 * @returns {string} the stored file's name
 */
export function savePhoto(dataUrl) {
  const match = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''))
  const type = match && TYPES[match[1]]
  if (!type) throw notAPhoto()

  const bytes = Buffer.from(match[2], 'base64')
  if (bytes.length > MAX_BYTES) throw new RuleError(413, 'This photo is too big. Please try again.')
  // The content must really be the image type it claims to be.
  if (!type.magic.every((byte, index) => bytes[index] === byte)) throw notAPhoto()

  const name = `${randomUUID()}.${type.ext}`
  mkdirSync(UPLOAD_DIR, { recursive: true })
  writeFileSync(join(UPLOAD_DIR, name), bytes)
  return name
}

/**
 * Full path of a stored photo.
 * @param {string} name as returned by savePhoto()
 * @throws {RuleError} 404 if the file is gone
 */
export function photoPath(name) {
  const path = join(UPLOAD_DIR, name)
  if (!existsSync(path)) throw new RuleError(404, 'Photo not found.')
  return path
}
