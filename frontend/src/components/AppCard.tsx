import { ReactNode } from 'react'

interface AppCardProps {
  children: ReactNode
}

export function AppCard({ children }: AppCardProps) {
  return (
    <div className="card w-full max-w-lg bg-base-100 shadow-2xl">
      <div className="card-body">{children}</div>
    </div>
  )
}
