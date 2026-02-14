import { useState, useEffect, useCallback } from 'react'
import { useAutonomo, useTapHandler, useFillHandler, useToggleHandler, useScreen, state } from '@autonomo/react'

// API base URL - uses proxy in dev, direct in production
const API_BASE = '/api'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  
  // Initialize Autonomo connection
  useAutonomo({
    name: 'localstack-todo',
    debug: true,
    devOnly: true
  })
  
  useEffect(() => {
    if (token) {
      setUser({ username: token })
    }
  }, [token])

  const handleLogin = (newToken, username) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser({ username })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4" data-theme="cupcake">
      <div className="card w-full max-w-lg bg-base-100 shadow-2xl">
        <div className="card-body">
          {user ? (
            <TodoList user={user} token={token} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )}
        </div>
      </div>
    </div>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = { submit: null }

  // Set screen for Autonomo
  useScreen('Login')

  // Register fill handlers for inputs
  useFillHandler('Login.Username', (value) => setUsername(value), { hint: 'Username input field' })
  useFillHandler('Login.Password', (value) => setPassword(value), { hint: 'Password input field' })
  
  // Register tap handler for submit button
  useTapHandler('Login.Submit', () => {
    if (formRef.submit) formRef.submit()
  }, { hint: 'Login button' })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      onLogin(data.token, data.username)
    } catch (err) {
      setError(err.message)
      state.addError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Store submit function for Autonomo
  formRef.submit = handleSubmit

  return (
    <>
      <h2 className="card-title text-2xl font-bold justify-center mb-4">Todo App Login</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="input input-bordered flex items-center gap-2 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            data-testid="Login.Username"
            type="text"
            placeholder="Username"
            className="grow"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="input input-bordered flex items-center gap-2 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
          </svg>
          <input
            data-testid="Login.Password"
            type="password"
            placeholder="Password"
            className="grow"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <div role="alert" className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}
        <button data-testid="Login.Submit" type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="divider">Test Credentials</div>
      <p className="text-center text-sm opacity-70">
        Username: <kbd className="kbd kbd-sm">testuser</kbd> / Password: <kbd className="kbd kbd-sm">testpass</kbd>
      </p>
    </>
  )
}

function TodoList({ user, token, onLogout }) {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const actionsRef = { addTodo: null, logout: null }

  // Set screen for Autonomo
  useScreen('Todos')

  // Register handlers for Autonomo
  useFillHandler('Todos.NewTodoInput', (value) => setNewTodo(value), { hint: 'New todo input field' })
  useTapHandler('Todos.AddButton', () => { if (actionsRef.addTodo) actionsRef.addTodo() }, { hint: 'Add todo button' })
  useTapHandler('Todos.Logout', () => { if (actionsRef.logout) actionsRef.logout() }, { hint: 'Logout button' })

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTodos(data.todos || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [token])

  const addTodo = async (e) => {
    if (e) e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTodo })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTodos([...todos, data.todo])
      setNewTodo('')
    } catch (err) {
      setError(err.message)
      state.addError(err.message)
    }
  }

  // Store actions for Autonomo
  actionsRef.addTodo = addTodo
  actionsRef.logout = onLogout

  const toggleTodo = async (todo) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${todo.todo_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !todo.completed })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTodos(todos.map(t => t.todo_id === todo.todo_id ? data.todo : t))
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (todo) => {
    setEditingId(todo.todo_id)
    setEditTitle(todo.title)
  }

  const saveEdit = async (todo) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${todo.todo_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTodos(todos.map(t => t.todo_id === todo.todo_id ? data.todo : t))
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteTodo = async (todoId) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setTodos(todos.filter(t => t.todo_id !== todoId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="card-title text-2xl font-bold">My Todos</h2>
        <button data-testid="Todos.Logout" className="btn btn-error btn-sm" onClick={onLogout}>Logout</button>
      </div>
      
      {error && (
        <div role="alert" className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <form className="join w-full mb-6" onSubmit={addTodo}>
        <input
          data-testid="Todos.NewTodoInput"
          type="text"
          placeholder="Add a new todo..."
          className="input input-bordered join-item flex-1"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <button data-testid="Todos.AddButton" type="submit" className="btn btn-primary join-item">Add</button>
      </form>

      {todos.length === 0 ? (
        <div className="text-center py-8 opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No todos yet. Add one above!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map(todo => (
            <TodoItem
              key={todo.todo_id}
              todo={todo}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              toggleTodo={toggleTodo}
              startEdit={startEdit}
              saveEdit={saveEdit}
              setEditingId={setEditingId}
              deleteTodo={deleteTodo}
            />
          ))}
        </ul>
      )}
    </>
  )
}

function TodoItem({ todo, editingId, editTitle, setEditTitle, toggleTodo, startEdit, saveEdit, setEditingId, deleteTodo }) {
  const todoId = todo.todo_id

  // Register Autonomo handlers for this todo item
  useToggleHandler(`Todo.${todoId}.Checkbox`, (value) => {
    if (value !== todo.completed) toggleTodo(todo)
  }, { hint: `Toggle todo: ${todo.title}` })
  
  useFillHandler(`Todo.${todoId}.EditInput`, (value) => setEditTitle(value), { hint: 'Edit todo title' })
  useTapHandler(`Todo.${todoId}.Edit`, () => startEdit(todo), { hint: 'Edit this todo' })
  useTapHandler(`Todo.${todoId}.Save`, () => saveEdit(todo), { hint: 'Save edited todo' })
  useTapHandler(`Todo.${todoId}.Cancel`, () => setEditingId(null), { hint: 'Cancel editing' })
  useTapHandler(`Todo.${todoId}.Delete`, () => deleteTodo(todoId), { hint: 'Delete this todo' })

  return (
    <li className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
      <input
        data-testid={`Todo.${todoId}.Checkbox`}
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={todo.completed}
        onChange={() => toggleTodo(todo)}
      />
      
      {editingId === todo.todo_id ? (
        <>
          <input
            data-testid={`Todo.${todoId}.EditInput`}
            type="text"
            className="input input-bordered input-sm flex-1"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <div className="flex gap-1">
            <button data-testid={`Todo.${todoId}.Save`} className="btn btn-success btn-sm" onClick={() => saveEdit(todo)}>Save</button>
            <button data-testid={`Todo.${todoId}.Cancel`} className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <span className={`flex-1 ${todo.completed ? 'line-through opacity-50' : ''}`}>
            {todo.title}
          </span>
          <div className="flex gap-1">
            <button data-testid={`Todo.${todoId}.Edit`} className="btn btn-outline btn-info btn-sm" onClick={() => startEdit(todo)}>Edit</button>
            <button data-testid={`Todo.${todoId}.Delete`} className="btn btn-outline btn-error btn-sm" onClick={() => deleteTodo(todo.todo_id)}>Delete</button>
          </div>
        </>
      )}
    </li>
  )
}

export default App
