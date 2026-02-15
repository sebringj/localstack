import { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { useAutonomo } from '@sebringj/autonomo-react'
import { registerFillHandler, registerTapHandler, registerToggleHandler } from '@sebringj/autonomo-core'

interface AutonomoProviderProps {
  children: ReactNode
}

interface AutonomoContextValue {
  enabled: boolean
}

const AutonomoContext = createContext<AutonomoContextValue>({ enabled: false })

function AutonomoBridge() {
  useAutonomo({
    name: 'localstack-todo',
    debug: true,
    devOnly: true,
  })

  return null
}

function isLocalhostHost() {
  if (typeof window === 'undefined') {
    return false
  }

  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

export function AutonomoProvider({ children }: AutonomoProviderProps) {
  const enabled = isLocalhostHost()

  const value = useMemo<AutonomoContextValue>(() => ({ enabled }), [enabled])

  return (
    <AutonomoContext.Provider value={value}>
      {enabled && <AutonomoBridge />}
      {children}
    </AutonomoContext.Provider>
  )
}

export function useAutonomoTapBinding(id: string | undefined, handler: () => void | Promise<void>, hint?: string) {
  const { enabled } = useContext(AutonomoContext)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled || !id) {
      return
    }

    return registerTapHandler(id, () => handlerRef.current(), { hint })
  }, [enabled, id, hint])
}

export function useAutonomoFillBinding(
  id: string | undefined,
  handler: (value: string) => void | Promise<void>,
  options?: {
    hint?: string
    getValue?: () => string
    onSubmit?: () => void
  },
) {
  const { enabled } = useContext(AutonomoContext)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled || !id) {
      return
    }

    return registerFillHandler(id, (value) => handlerRef.current(value), {
      hint: options?.hint,
      getValue: options?.getValue,
      onSubmit: options?.onSubmit,
    })
  }, [enabled, id, options?.hint, options?.getValue, options?.onSubmit])
}

export function useAutonomoToggleBinding(
  id: string | undefined,
  handler: (value?: string) => void | Promise<void>,
  options?: {
    hint?: string
    getValue?: () => string
  },
) {
  const { enabled } = useContext(AutonomoContext)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled || !id) {
      return
    }

    return registerToggleHandler(id, (value) => handlerRef.current(value), {
      hint: options?.hint,
      getValue: options?.getValue,
    })
  }, [enabled, id, options?.hint, options?.getValue])
}