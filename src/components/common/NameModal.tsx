import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface NameModalProps {
  open: boolean
  title: string
  label: string
  placeholder?: string
  initialValue?: string
  submitText?: string

  onClose: () => void
  onSubmit: (value: string) => Promise<void> | void
}

function NameModal({
  open,
  title,
  label,
  placeholder = '',
  initialValue = '',
  submitText = 'Lưu',
  onClose,
  onSubmit,
}: NameModalProps) {
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
    }
  }, [open, initialValue])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

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

    const trimmedValue = value.trim()

    if (!trimmedValue || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)

      await onSubmit(trimmedValue)

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
          <label className="text-sm font-medium">
            {label}
          </label>

          <input
            type="text"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
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
              disabled={!value.trim() || isSubmitting}
              className="rounded-lg bg-general px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NameModal