import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface WorkspaceModalProps {
  open: boolean
  title: string
  initialName?: string
  submitText?: string
  onClose: () => void
  onSubmit: (name: string) => Promise<void> | void
}

function WorkspaceModal({
  open,
  title,
  initialName = '',
  submitText = 'Lưu',
  onClose,
  onSubmit,
}: WorkspaceModalProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
    }
  }, [open, initialName])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)

      await onSubmit(trimmedName)

      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-app-muted transition hover:bg-app-hover hover:text-app-text"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5"
        >
          <label
            htmlFor="workspace-name"
            className="text-sm font-medium"
          >
            Tên Workspace
          </label>

          <input
            id="workspace-name"
            type="text"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Học tập"
            className="mt-2 w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none transition focus:border-general focus:ring-2 focus:ring-general/10"
          />

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-app-muted transition hover:bg-app-hover"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-lg bg-general px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkspaceModal