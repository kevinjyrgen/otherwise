import { useEffect, useState } from 'react'
import { api, USER_ID } from '../../api.js'
import Shell from '../../components/Shell.jsx'
import { useSocket } from '../../socket.js'
import t from './HelperHome.strings.js'

/** Helper's home screen. Empty for now: greeting and who she helps. */
export default function HelperHome() {
  const { connected } = useSocket(USER_ID.helper)
  const [me, setMe] = useState(null)

  useEffect(() => {
    api(USER_ID.helper, '/me').then(setMe).catch(console.error)
  }, [])

  return (
    <Shell connected={connected} connectionLabel={connected ? t.live : t.offline}>
      {me && (
        <>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight">{t.greeting(me.name)}</h1>
          <p className="mt-2 text-white/60">{t.helping(me.ownerName)}</p>
          <section className="mt-8 rounded-3xl bg-card p-6 text-white/60">{t.empty}</section>
        </>
      )}
    </Shell>
  )
}
