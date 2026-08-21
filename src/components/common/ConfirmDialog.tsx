import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

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
  confirmText, 
  onClose, 
  onConfirm 
}: ConfirmDialogProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await onConfirm()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, onConfirm, onClose])

  useEffect(() => {
    if (!open) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      // Enter to confirm
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleConfirm()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, handleConfirm])

  useEffect(() => {
    if (open) {
      setIsSubmitting(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div 
      className="modal-overlay flex items-center justify-center p-4"
      onMouseDown={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      <div 
        className="modal-content w-full max-w-sm rounded-xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-4">
          <h2 
            id="confirm-title"
            className="text-base font-semibold text-app-text"
          >
            {title}
          </h2>
          
          <p 
            id="confirm-description"
            className="mt-2 text-sm leading-6 text-app-muted"
          >
            {description}
          </p>

          {/* Warning hint */}
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs leading-5 text-amber-700">
              {t('common.irreversible')}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="app-secondary-action"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            
            <button 
              type="button" 
              onClick={handleConfirm} 
              className="app-danger-action min-w-[100px]"
              disabled={isSubmitting}
              autoFocus
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t('common.deleting')}</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>{confirmText ?? t('common.delete')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog