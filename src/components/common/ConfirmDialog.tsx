import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Xóa',
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
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
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={20} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-app-muted hover:bg-app-hover"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-app-muted">
            {description}
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-app-muted hover:bg-app-hover"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog