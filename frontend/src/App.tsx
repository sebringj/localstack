import { useEffect, useState } from 'react'
import { AppCard } from './components/AppCard'
import { LoginScreen } from './screens/LoginScreen'
import { TodosScreen } from './screens/TodosScreen'
import { User } from './types'

const TOKEN_KEY = 'token'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (token) {
      setUser({ username: token })
    }
  }, [token])

  const handleLogin = (newToken: string, username: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser({ username })
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4" data-theme="cupcake">
      <AppCard>
        {user ? (
          <TodosScreen token={token!} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </AppCard>
    </div>
  )
}

export default App
