import { useEffect, useState } from 'react'
import { LayoutGrid, X } from 'lucide-react'

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
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-md rounded-2xl border border-app-border bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-general/10">
              <LayoutGrid size={15} className="text-general" />
            </div>
            <h2 className="text-base font-semibold">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-hover hover:text-app-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5"
        >
          <label
            htmlFor="workspace-name"
            className="text-xs font-semibold uppercase tracking-wider text-app-muted"
          >
            Tên Workspace
          </label>

          <input
            id="workspace-name"
            type="text"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Học tập, Công việc..."
            className="mt-2 w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none transition focus:border-general focus:ring-3 focus:ring-general/10"
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-app-muted transition hover:bg-app-hover"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-lg bg-general px-4 py-2 text-sm font-medium text-white shadow-sm shadow-general/20 transition hover:bg-general-dark disabled:cursor-not-allowed disabled:opacity-50"
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