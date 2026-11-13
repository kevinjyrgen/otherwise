/**
 * In-memory store with a JSON file behind it. Every change calls save(), so a
 * server restart keeps the demo state. `npm run reset` reseeds it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedData } from './seed.js'

const here = dirname(fileURLToPath(import.meta.url))

/** Path of the persistence file. Tests point DB_FILE somewhere else. */
export const DB_FILE = process.env.DB_FILE || resolve(here, 'data/db.json')

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
  if (existsSync(DB_FILE)) {
    replace(JSON.parse(readFileSync(DB_FILE, 'utf8')))
  } else {
    reset()
  }
}

/** Throws everything away and goes back to the seed data. */
export function reset() {
  replace(seedData())
  save()
}
