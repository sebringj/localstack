import { ChangeEvent, InputHTMLAttributes } from 'react'
import { useAutonomoToggleBinding } from '../../providers/AutonomoProvider'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onToggle' | 'type'> {
  checked: boolean
  onToggle: (checked: boolean) => void
  testId?: string
  hint?: string
}

export function Checkbox({ checked, onToggle, testId, hint, ...inputProps }: CheckboxProps) {
  useAutonomoToggleBinding(
    testId,
    (value?: string) => {
      const nextChecked = value === undefined ? !checked : value === 'true'
      if (nextChecked !== checked) {
        onToggle(nextChecked)
      }
    },
    {
      hint,
      getValue: () => String(checked),
    },
  )

  return (
    <input
      data-testid={testId}
      type="checkbox"
      checked={checked}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onToggle(event.target.checked)}
      {...inputProps}
    />
  )
}