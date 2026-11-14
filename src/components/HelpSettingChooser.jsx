import Button from './Button.jsx'
import t, { THRESHOLDS } from './helpSetting.strings.js'

/**
 * The two big choices for "when to ask for help": every transfer, or only
 * above one of three amounts. Buttons only, no typing.
 * @param {{
 *   current?: {helpMode: string, threshold: number|null},
 *   onChoose: (setting: {helpMode: 'EVERY'|'OVER', threshold: number|null}) => void,
 *   disabled?: boolean,
 * }} props `current` is highlighted in the brand pink
 */
export default function HelpSettingChooser({ current, onChoose, disabled }) {
  const isEvery = current?.helpMode === 'EVERY'
  const chosen = (threshold) => current?.helpMode === 'OVER' && current.threshold === threshold

  return (
    <div>
      <Button
        size="lg"
        variant={isEvery ? 'primary' : 'secondary'}
        disabled={disabled}
        onClick={() => onChoose({ helpMode: 'EVERY', threshold: null })}
      >
        {t.every}
      </Button>

      <p className="mt-8 text-xl">{t.overLabel}</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {THRESHOLDS.map((threshold) => (
          <Button
            key={threshold}
            size="lg"
            className="px-2"
            variant={chosen(threshold) ? 'primary' : 'secondary'}
            disabled={disabled}
            onClick={() => onChoose({ helpMode: 'OVER', threshold })}
          >
            {t.amount(threshold)}
          </Button>
        ))}
      </div>
    </div>
  )
}
