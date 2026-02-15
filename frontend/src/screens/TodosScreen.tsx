import { FormEvent, useEffect, useState } from 'react'
import { state, useScreen } from '@sebringj/autonomo-react'
import { Button } from '../components/common/Button'
import { TextInput } from '../components/common/TextInput'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoadingState } from '../components/LoadingState'
import { TodoItem } from '../components/TodoItem'
import { API_BASE } from '../lib/api'
import { Todo } from '../types'

interface TodosScreenProps {
  token: string
  onLogout: () => void
}

export function TodosScreen({ token, onLogout }: TodosScreenProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useScreen('Todos')

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch(`${API_BASE}/todos`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch todos')
        }
        setTodos(data.todos || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch todos'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchTodos()
  }, [token])

  const addTodo = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!newTodo.trim()) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTodo }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add todo')
      }
      setTodos((previousTodos) => [...previousTodos, data.todo])
      setNewTodo('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add todo'
      setError(message)
      state.addError(message)
    }
  }

  const toggleTodo = async (todo: Todo) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${todo.todo_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !todo.completed }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle todo')
      }
      setTodos((previousTodos) =>
        previousTodos.map((item) => (item.todo_id === todo.todo_id ? data.todo : item)),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle todo'
      setError(message)
    }
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.todo_id)
    setEditTitle(todo.title)
  }

  const saveEdit = async (todo: Todo) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${todo.todo_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitle }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save todo')
      }
      setTodos((previousTodos) =>
        previousTodos.map((item) => (item.todo_id === todo.todo_id ? data.todo : item)),
      )
      setEditingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save todo'
      setError(message)
    }
  }

  const deleteTodo = async (todoId: string) => {
    try {
      const response = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete todo')
      }
      setTodos((previousTodos) => previousTodos.filter((todo) => todo.todo_id !== todoId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo'
      setError(message)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="card-title text-2xl font-bold">My Todos</h2>
        <Button
          testId="Todos.Logout"
          hint="Logout button"
          className="btn btn-error btn-sm"
          onPress={onLogout}
          type="button"
        >
          Logout
        </Button>
      </div>

      {error && <ErrorAlert message={error} className="mb-4" />}

      <form className="join w-full mb-6" onSubmit={addTodo}>
        <TextInput
          testId="Todos.NewTodoInput"
          hint="New todo input field"
          type="text"
          placeholder="Add a new todo..."
          className="input input-bordered join-item flex-1"
          value={newTodo}
          onValueChange={setNewTodo}
        />
        <Button
          testId="Todos.AddButton"
          hint="Add todo button"
          type="submit"
          className="btn btn-primary join-item"
          onPress={() => {
            void addTodo()
          }}
        >
          Add
        </Button>
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
          {todos.map((todo) => (
            <TodoItem
              key={todo.todo_id}
              todo={todo}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              toggleTodo={toggleTodo}
              startEdit={startEdit}
              saveEdit={saveEdit}
              cancelEdit={() => setEditingId(null)}
              deleteTodo={deleteTodo}
            />
          ))}
        </ul>
      )}
    </>
  )
}
