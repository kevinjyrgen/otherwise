import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BillPhoto from '../../components/BillPhoto.jsx'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { useLive } from '../../live.js'
import { shrinkPhoto } from '../../photo.js'
import t from './OwnerBill.strings.js'

/** A made-up bill in /public, so the demo works without a real one. */
const SAMPLE_BILL = '/sample-bill.png'

/**
 * Step 1, the easy way: instead of explaining what to pay, the owner takes a
 * photo of the bill and sends it to her helper. She types nothing; the helper
 * reads the details off the photo, and the owner sees the same photo again
 * when she checks the prepared transfer.
 */
export default function OwnerBill() {
  const { me, send } = useLive()
  const navigate = useNavigate()
  const input = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // No active helper (e.g. she was just removed): nobody to send it to.
  if (!me.helperName) return <Navigate to="/owner/helper" replace />
  const helper = me.helperName.split(' ')[0]

  /** Runs one step and shows its error, if any. */
  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (problem) {
      setError(problem.message)
    }
    setBusy(false)
  }

  /** Shrinks the chosen picture so it sends quickly, and shows it. */
  const pickPhoto = (file) => run(async () => setPhoto(await shrinkPhoto(file)))

  const pickSample = () =>
    run(async () => {
      const response = await fetch(SAMPLE_BILL)
      setPhoto(await shrinkPhoto(await response.blob()))
    })

  const sendToHelper = () =>
    run(async () => {
      await send('/owner/transfers', { note, photo })
      navigate('/owner/guided')
    })

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title(helper)}</h1>
      {!photo && <p className="mt-4 text-xl text-white/70">{t.text(helper)}</p>}

      {/* On a phone this opens the camera; on a computer it opens the file chooser. */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files[0]
          // Cleared so choosing the same file again still counts as a change.
          event.target.value = ''
          if (file) pickPhoto(file)
        }}
      />

      {photo && (
        <>
          <section className="mt-6 rounded-3xl bg-card p-5">
            <p className="mb-3 text-lg text-white/60">{t.yourPhoto}</p>
            <BillPhoto src={photo} big />
          </section>

          <label className="mt-6 block text-xl" htmlFor="note">
            {t.noteLabel(helper)}
          </label>
          <input
            id="note"
            value={note}
            maxLength={140}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.notePlaceholder}
            className="mt-3 min-h-16 w-full rounded-2xl bg-card px-5 text-xl placeholder:text-white/30"
          />
        </>
      )}

      {busy && !photo && <p className="mt-6 text-xl text-white/70">{t.reading}</p>}
      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {photo ? (
          <>
            <Button size="lg" onClick={sendToHelper} disabled={busy}>
              {busy ? t.sending : t.send(helper)}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => input.current.click()} disabled={busy}>
              {t.retake}
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" onClick={() => input.current.click()} disabled={busy}>
              {t.take}
            </Button>
            <button type="button" onClick={pickSample} disabled={busy} className="min-h-12 text-lg text-white/60 underline">
              {t.sample}
            </button>
          </>
        )}
        <Button size="lg" variant="secondary" to="/owner/guided">
          {t.back}
        </Button>
      </div>
    </Shell>
  )
}
