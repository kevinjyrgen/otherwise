import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { useLive } from '../../live.js'
import t from './OwnerRequest.strings.js'

/** Step 1: the owner asks her helper to prepare a transfer, with an optional note. */
export default function OwnerRequest() {
  const { me, send } = useLive()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Mari Tamm → Mari: first names read friendlier on the owner's screens.
  const helper = me.helperName.split(' ')[0]

  const ask = async () => {
    setBusy(true)
    try {
      await send('/owner/transfers', { note })
      navigate('/owner')
    } catch (problem) {
      setError(problem.message)
      setBusy(false)
    }
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title(helper)}</h1>
      <p className="mt-4 text-xl text-white/70">{t.text(helper)}</p>

      <label className="mt-8 block text-xl" htmlFor="note">
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

      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button size="lg" onClick={ask} disabled={busy}>
          {t.ask(helper)}
        </Button>
        <Button size="lg" variant="secondary" to="/owner">
          {t.back}
        </Button>
      </div>
    </Shell>
  )
}
