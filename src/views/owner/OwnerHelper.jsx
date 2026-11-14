import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import HelpSettingChooser from '../../components/HelpSettingChooser.jsx'
import setting from '../../components/helpSetting.strings.js'
import Shell from '../../components/Shell.jsx'
import { useLive } from '../../live.js'
import t from './OwnerHelper.strings.js'

const pill = {
  INVITED: 'bg-white/10 text-white',
  ACTIVE: 'bg-brand-pink text-brand-green',
  DECLINED: 'bg-red-400/20 text-red-300',
}

/**
 * The owner's "Helper" page: add a helper, watch the invite (Invited → Active
 * or Declined, live), change when she gets help, remove or change her helper.
 */
export default function OwnerHelper() {
  const { me, send } = useLive()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  // Which confirmation is open: null, 'remove' or 'change'.
  const [asking, setAsking] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const link = me.link

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

  const saveSetting = (choice) =>
    run(async () => {
      await send('/owner/helper/setting', choice, 'PUT')
      setEditing(false)
    })

  /** Removes the helper; for "change" she goes straight on to invite someone new. */
  const removeHelper = () =>
    run(async () => {
      const next = asking === 'change' ? '/owner/helper/add' : '/owner/helper'
      await send('/owner/helper', undefined, 'DELETE')
      setAsking(null)
      navigate(next)
    })

  if (!link) {
    return (
      <Shell>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="mt-4 text-xl text-white/70">{t.noneText}</p>
        <div className="mt-8">
          <Button size="lg" to="/owner/helper/add">
            {t.add}
          </Button>
        </div>
      </Shell>
    )
  }

  const name = link.helper.name
  const firstName = name.split(' ')[0]

  if (asking) {
    return (
      <Shell>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
          {asking === 'change' ? t.changeQuestion(firstName) : t.removeQuestion(firstName)}
        </h1>
        <p className="mt-4 text-xl text-white/70">{t.removeText(firstName)}</p>
        {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button size="lg" variant="secondary" onClick={removeHelper} disabled={busy}>
            {asking === 'change' ? t.yesChange : t.yesRemove}
          </Button>
          <Button size="lg" onClick={() => setAsking(null)} disabled={busy}>
            {t.no(firstName)}
          </Button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} className="h-16 w-16 text-xl" />
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold">{name}</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 font-semibold ${pill[link.status]}`}>
              {t.status[link.status]}
            </span>
          </div>
        </div>
        <p className="mt-4 text-xl text-white/70">{t.statusText[link.status](firstName)}</p>
      </section>

      {link.status !== 'DECLINED' && (
        <section className="mt-4 rounded-3xl bg-card p-6">
          <h2 className="text-lg text-white/60">{t.settingTitle}</h2>
          {editing ? (
            <div className="mt-4">
              <HelpSettingChooser current={link} onChoose={saveSetting} disabled={busy} />
              <Button size="lg" variant="secondary" className="mt-8" onClick={() => setEditing(false)}>
                {t.keepSetting}
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-2xl font-semibold">
                {setting.summary(link.helpMode, link.threshold)}
              </p>
              <Button size="lg" variant="secondary" className="mt-5" onClick={() => setEditing(true)}>
                {t.changeSetting}
              </Button>
            </>
          )}
        </section>
      )}

      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      <div className="mt-8 flex flex-col gap-3">
        {link.status === 'ACTIVE' && (
          <>
            <Button size="lg" variant="secondary" onClick={() => setAsking('change')}>
              {t.change}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setAsking('remove')}>
              {t.remove}
            </Button>
          </>
        )}
        {link.status === 'INVITED' && (
          <Button size="lg" variant="secondary" onClick={() => setAsking('remove')}>
            {t.cancelInvite}
          </Button>
        )}
        {link.status === 'DECLINED' && (
          <Button size="lg" to="/owner/helper/add">
            {t.askSomeoneElse}
          </Button>
        )}
      </div>
    </Shell>
  )
}
