import { ButtonHTMLAttributes, ReactNode } from 'react'
import { useAutonomoTapBinding } from '../../providers/AutonomoProvider'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onPress: () => void
  children: ReactNode
  testId?: string
  hint?: string
}

export function Button({ onPress, children, testId, hint, ...buttonProps }: ButtonProps) {
  useAutonomoTapBinding(testId, onPress, hint)

  return (
    <button data-testid={testId} onClick={onPress} {...buttonProps}>
      {children}
    </button>
  )
}