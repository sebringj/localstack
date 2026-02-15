import { ChangeEvent, InputHTMLAttributes } from 'react'
import { useAutonomoFillBinding } from '../../providers/AutonomoProvider'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  testId?: string
  hint?: string
}

export function TextInput({ value, onValueChange, testId, hint, ...inputProps }: TextInputProps) {
  useAutonomoFillBinding(testId, onValueChange, {
    hint,
    getValue: () => value,
  })

  return (
    <input
      data-testid={testId}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange(event.target.value)}
      {...inputProps}
    />
  )
}