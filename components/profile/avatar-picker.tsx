import { AVATAR_PRESETS } from '@/lib/validations/profile'
import type { AvatarPresetKey } from '@/lib/validations/profile'

interface AvatarPickerProps {
  /** Currently selected preset key */
  value: string
  /** Called with the preset key when an avatar is selected */
  onChange: (key: AvatarPresetKey) => void
}

/**
 * Grid of predefined climbing-themed avatars.
 *
 * Each avatar is a button with an emoji and label. The selected avatar
 * is highlighted with a primary ring. Used in the profile edit form.
 */
export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">Avatar</p>
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Choix d'avatar">
        {AVATAR_PRESETS.map((preset) => {
          const isSelected = value === preset.key
          return (
            <button
              key={preset.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={preset.label}
              onClick={() => onChange(preset.key)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors min-touch ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-muted/50 hover:border-border hover:bg-muted'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {preset.emoji}
              </span>
              <span className="text-[10px] text-muted-foreground">{preset.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
