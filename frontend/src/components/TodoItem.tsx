import { KeyboardEvent } from 'react'
import { Button } from './common/Button'
import { Checkbox } from './common/Checkbox'
import { TextInput } from './common/TextInput'
import { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  editingId: string | null
  editTitle: string
  setEditTitle: (title: string) => void
  toggleTodo: (todo: Todo) => Promise<void>
  startEdit: (todo: Todo) => void
  saveEdit: (todo: Todo) => Promise<void>
  cancelEdit: () => void
  deleteTodo: (todoId: string) => Promise<void>
}

export function TodoItem({
  todo,
  editingId,
  editTitle,
  setEditTitle,
  toggleTodo,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteTodo,
}: TodoItemProps) {
  const todoId = todo.todo_id

  return (
    <li className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
      <Checkbox
        testId={`Todo.${todoId}.Checkbox`}
        hint={`Toggle todo: ${todo.title}`}
        className="checkbox checkbox-primary"
        checked={todo.completed}
        onToggle={() => {
          void toggleTodo(todo)
        }}
      />

      {editingId === todoId ? (
        <>
          <TextInput
            testId={`Todo.${todoId}.EditInput`}
            hint="Edit todo title"
            type="text"
            className="input input-bordered input-sm flex-1"
            value={editTitle}
            onValueChange={setEditTitle}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') {
                void saveEdit(todo)
              }
              if (event.key === 'Escape') {
                cancelEdit()
              }
            }}
            autoFocus
          />
          <div className="flex gap-1">
            <Button
              testId={`Todo.${todoId}.Save`}
              hint="Save edited todo"
              className="btn btn-success btn-sm"
              onPress={() => {
                void saveEdit(todo)
              }}
              type="button"
            >
              Save
            </Button>
            <Button
              testId={`Todo.${todoId}.Cancel`}
              hint="Cancel editing"
              className="btn btn-ghost btn-sm"
              onPress={cancelEdit}
              type="button"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className={`flex-1 ${todo.completed ? 'line-through opacity-50' : ''}`}>{todo.title}</span>
          <div className="flex gap-1">
            <Button
              testId={`Todo.${todoId}.Edit`}
              hint="Edit this todo"
              className="btn btn-outline btn-info btn-sm"
              onPress={() => startEdit(todo)}
              type="button"
            >
              Edit
            </Button>
            <Button
              testId={`Todo.${todoId}.Delete`}
              hint="Delete this todo"
              className="btn btn-outline btn-error btn-sm"
              onPress={() => {
                void deleteTodo(todoId)
              }}
              type="button"
            >
              Delete
            </Button>
          </div>
        </>
      )}
    </li>
  )
}
