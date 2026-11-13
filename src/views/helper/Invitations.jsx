import { useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import setting from '../../components/helpSetting.strings.js'
import { rightsText } from '../../components/rights.strings.js'
import { useLive } from '../../live.js'
import t from './Invitations.strings.js'

/**
 * Invitations waiting for this person's answer: who is asking, the same
 * rights text the owner saw, and Accept / Decline. Only she can answer.
 * Renders nothing when there are none.
 */
export default function Invitations() {
  const { me, send } = useLive()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (me.invitations.length === 0) return null

  const answer = async (invitation, action) => {
    setBusy(true)
    setError('')
    try {
      await send(`/helper/invitations/${invitation.id}/${action}`)
    } catch (problem) {
      setError(problem.message)
    }
    setBusy(false)
  }

  return (
    <section className="mt-6">
      <h2 className="font-bold text-white/60">{t.title}</h2>
      {me.invitations.map((invitation) => (
        <div key={invitation.id} className="mt-3 rounded-3xl bg-card p-5 ring-2 ring-bright-green">
          <div className="flex items-center gap-3">
            <Avatar name={invitation.ownerName} />
            <p className="text-xl font-bold">{t.asking(invitation.ownerName)}</p>
          </div>
          <p className="mt-4 text-sm text-white/60">{t.rightsIntro(invitation.ownerName)}</p>
          <blockquote className="mt-2 border-l-2 border-bright-green pl-4 text-lg leading-relaxed">
            {rightsText}
          </blockquote>
          <p className="mt-4 font-semibold">
            {setting.summaryForHelper(invitation.helpMode, invitation.threshold)}
          </p>
          <p className="mt-1 text-white/70">{t.yourPart}</p>
          {error && <p className="mt-3 text-red-300">{error}</p>}
          <div className="mt-5 flex gap-3">
            <Button onClick={() => answer(invitation, 'accept')} disabled={busy}>
              {t.accept}
            </Button>
            <Button variant="secondary" onClick={() => answer(invitation, 'decline')} disabled={busy}>
              {t.decline}
            </Button>
          </div>
        </div>
      ))}
    </section>
  )
}
