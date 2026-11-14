import { useEffect, useState } from 'react'
import { apiImage, USER_ID } from '../api.js'
import { useLive } from '../live.js'
import t from './billPhoto.strings.js'

/**
 * The photo of a bill the owner sent with her request. Tapping it shows it
 * full screen, so small print such as an account number can be read.
 *
 * Give it either `transferId` (the photo is fetched from the server as the
 * person using this window) or `src` (a photo that has not been sent yet).
 * @param {{transferId?: string, src?: string, big?: boolean}} props `big` is the owner's text size
 */
export default function BillPhoto({ transferId, src, big = false }) {
  const { role } = useLive()
  const [loaded, setLoaded] = useState(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!transferId) return
    let url = null
    let gone = false
    apiImage(USER_ID[role], `/${role}/transfers/${transferId}/photo`)
      .then((objectUrl) => {
        url = objectUrl
        if (gone) URL.revokeObjectURL(url)
        else setLoaded(url)
      })
      .catch(() => setFailed(true))
    return () => {
      gone = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [transferId, role])

  // Escape closes the full-screen view.
  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const picture = src ?? loaded
  const hint = big ? 'text-lg' : 'text-sm'
  if (failed) return <p className={`${hint} text-red-300`}>{t.failed}</p>
  if (!picture) return <p className={`${hint} text-white/60`}>{t.loading}</p>

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full overflow-hidden rounded-2xl bg-white">
        <img src={picture} alt={t.alt} className="mx-auto max-h-80 w-full object-contain" />
      </button>
      <p className={`mt-2 text-white/60 ${hint}`}>{t.enlarge}</p>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={t.alt} className="fixed inset-0 z-30 flex flex-col bg-black/95 p-4">
          <div className="min-h-0 flex-1 overflow-auto" onClick={() => setOpen(false)}>
            <img src={picture} alt={t.alt} className="mx-auto min-h-full w-full max-w-3xl object-contain" />
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(false)}
            className={`mx-auto mt-4 min-h-14 w-full max-w-[430px] shrink-0 rounded-full bg-bright-green font-bold text-forest-green ${big ? 'text-xl' : 'text-base'}`}
          >
            {t.close}
          </button>
        </div>
      )}
    </>
  )
}
