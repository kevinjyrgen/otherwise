import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import HelpSettingChooser from '../../components/HelpSettingChooser.jsx'
import { rightsText } from '../../components/rights.strings.js'
import Shell from '../../components/Shell.jsx'
import { useLive } from '../../live.js'
import t from './OwnerAddHelper.strings.js'

/**
 * Adding a helper, one decision per screen:
 * 1. what a helper can and cannot do, 2. when to ask for help,
 * 3. find the person, then confirm it is the right one and send the invite.
 */
export default function OwnerAddHelper() {
  const { me, call, send } = useLive()
  const [step, setStep] = useState('rights')
  const [setting, setSetting] = useState(null)
  const [query, setQuery] = useState('')
  const [match, setMatch] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // One helper at a time: with an invite out or a helper active there is
  // nothing to add. This also brings her back here once the invite is sent.
  if (me.link && me.link.status !== 'DECLINED') return <Navigate to="/owner/helper" replace />

  /** Runs one server step and shows its error, if any. */
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

  const find = () =>
    run(async () => {
      setMatch(await call(`/owner/directory?q=${encodeURIComponent(query)}`))
      setStep('match')
    })

  const invite = () => run(() => send('/owner/helper/invite', { helperId: match.id, ...setting }))

  return (
    <Shell>
      {step === 'rights' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.rightsTitle}</h1>
          <p className="mt-6 text-2xl leading-relaxed">{rightsText}</p>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" onClick={() => setStep('setting')}>
              {t.understand}
            </Button>
            <Button size="lg" variant="secondary" to="/owner/helper">
              {t.back}
            </Button>
          </div>
        </>
      )}

      {step === 'setting' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.settingTitle}</h1>
          <div className="mt-8">
            <HelpSettingChooser
              onChoose={(choice) => {
                setSetting(choice)
                setStep('find')
              }}
            />
          </div>
          <div className="mt-auto pt-8">
            <Button size="lg" variant="secondary" onClick={() => setStep('rights')}>
              {t.back}
            </Button>
          </div>
        </>
      )}

      {step === 'find' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.findTitle}</h1>
          <label className="mt-8 block text-xl" htmlFor="find">
            {t.findLabel}
          </label>
          <input
            id="find"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && query.trim() && find()}
            autoComplete="off"
            autoCapitalize="none"
            className="mt-3 min-h-16 w-full rounded-2xl bg-card px-5 text-xl"
          />
          <p className="mt-3 text-lg text-white/60">{t.findHint}</p>
          {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" onClick={find} disabled={busy || !query.trim()}>
              {t.find}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setStep('setting')}>
              {t.back}
            </Button>
          </div>
        </>
      )}

      {step === 'match' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.matchTitle}</h1>
          <section className="mt-8 flex flex-col items-center rounded-3xl bg-card p-8 text-center">
            <Avatar name={match.name} className="h-24 w-24 text-3xl" />
            <p className="mt-4 text-3xl font-bold">{match.name}</p>
            <p className="mt-1 text-xl text-white/60">{match.wisetag}</p>
          </section>
          <p className="mt-6 text-xl text-white/70">{t.matchText(match.name.split(' ')[0])}</p>
          {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" onClick={invite} disabled={busy}>
              {t.invite}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setStep('find')} disabled={busy}>
              {t.searchAgain}
            </Button>
          </div>
        </>
      )}
    </Shell>
  )
}
