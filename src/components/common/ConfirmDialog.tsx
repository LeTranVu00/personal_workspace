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
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-sm rounded-2xl border border-app-border bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={19} className="text-red-500" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-hover"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-4">
          <h2 className="text-base font-semibold">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-app-muted">
            {description}
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-app-muted transition hover:bg-app-hover"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-red-200 transition hover:bg-red-600 active:scale-95"
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