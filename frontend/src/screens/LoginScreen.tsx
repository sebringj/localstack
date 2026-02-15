import { FormEvent, useState } from 'react'
import { state, useScreen } from '@sebringj/autonomo-react'
import { Button } from '../components/common/Button'
import { TextInput } from '../components/common/TextInput'
import { ErrorAlert } from '../components/ErrorAlert'
import { API_BASE } from '../lib/api'

interface LoginScreenProps {
  onLogin: (token: string, username: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useScreen('Login')

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      onLogin(data.token, data.username)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      state.addError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="card-title text-2xl font-bold justify-center mb-4">Todo App Login</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="input input-bordered flex items-center gap-2 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <TextInput
            testId="Login.Username"
            hint="Username input field"
            type="text"
            placeholder="Username"
            className="grow"
            value={username}
            onValueChange={setUsername}
            required
          />
        </label>

        <label className="input input-bordered flex items-center gap-2 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
          </svg>
          <TextInput
            testId="Login.Password"
            hint="Password input field"
            type="password"
            placeholder="Password"
            className="grow"
            value={password}
            onValueChange={setPassword}
            required
          />
        </label>

        {error && <ErrorAlert message={error} />}

        <Button
          testId="Login.Submit"
          hint="Login button"
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
          onPress={() => {
            void handleSubmit()
          }}
        >
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <div className="divider">Test Credentials</div>
      <p className="text-center text-sm opacity-70">
        Username: <kbd className="kbd kbd-sm">testuser</kbd> / Password: <kbd className="kbd kbd-sm">testpass</kbd>
      </p>
    </>
  )
}
