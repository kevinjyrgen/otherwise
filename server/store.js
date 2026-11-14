/**
 * In-memory store with a JSON file behind it. Every change calls save(), so a
 * server restart keeps the demo state. `npm run reset` reseeds it.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedData } from './seed.js'

const here = dirname(fileURLToPath(import.meta.url))

/** Path of the persistence file. Tests point DB_FILE somewhere else. */
export const DB_FILE = process.env.DB_FILE || resolve(here, 'data/db.json')

/**
 * Folder for the bill photos owners send. It sits next to the database file
 * and is named after it, so tests get their own.
 */
export const UPLOAD_DIR = resolve(dirname(DB_FILE), `${basename(DB_FILE, '.json')}-uploads`)

/** The live database. Mutate it in place, then call save(). */
export const db = {}

/** Replaces the contents of `db` without changing the object identity. */
function replace(data) {
  Object.keys(db).forEach((key) => delete db[key])
  Object.assign(db, data)
}

/** Writes the current state to disk. */
export function save() {
  mkdirSync(dirname(DB_FILE), { recursive: true })
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

/** Loads the state from disk, or seeds it on first run. */
export function load() {
  const data = existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : null
  // A file from before helper links or regular payments existed cannot be used: start fresh.
  if (data?.links && data.recipients && data.schedules && data.clock) {
    replace(data)
  } else {
    reset()
  }
}

/**
 * Throws everything away, bill photos included, and goes back to the seed data.
 * @param {{withHelper?: boolean}} [options] see seedData()
 */
export function reset(options) {
  // The photos belong to the transfers that are thrown away.
  rmSync(UPLOAD_DIR, { recursive: true, force: true })
  replace(seedData(options))
  save()
}
