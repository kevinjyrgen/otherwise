/**
 * `npm run reset`: reseeds the JSON file. If the dev server is running it is
 * also told to reload, because it keeps its own copy in memory and would
 * otherwise write the old state back.
 */
import { reset } from './store.js'

const PORT = process.env.PORT || 3001

reset()
console.log('Database reseeded.')

try {
  await fetch(`http://localhost:${PORT}/api/dev/reset`, { method: 'POST' })
  console.log('Running server reloaded.')
} catch {
  console.log('Server is not running, nothing to reload.')
}
