import { useEffect, useState, useRef } from 'react'
import { LayoutGrid, X, Check, Loader2, Sparkles } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

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
  submitText, 
  onClose, 
  onSubmit 
}: WorkspaceModalProps) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [open, initialName])

  useEffect(() => {
    if (!open) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || isSubmitting) return
    
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
      className="modal-overlay flex items-center justify-center p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
    >
      <div 
        className="modal-content w-full max-w-md rounded-xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <LayoutGrid size={16} className="text-primary" />
            </div>
            <div>
              <h2 
                id="workspace-modal-title"
                className="text-base font-semibold text-app-text"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-xs text-app-muted">
                {initialName ? t('workspace.editDescription') : t('workspace.createDescription')}
              </p>
            </div>
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

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            <label 
              htmlFor="workspace-name"
              className="app-form-label"
            >
              {t('workspace.label')}
            </label>
            
            <div className="relative mt-2">
              <input 
                id="workspace-name"
                ref={inputRef}
                type="text" 
                value={name} 
                onChange={(event) => setName(event.target.value)} 
                placeholder={t('workspace.placeholder')}
                className="app-form-input pr-10"
                disabled={isSubmitting}
                autoComplete="off"
                maxLength={50}
              />
              
              {name.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Sparkles size={14} className="text-primary" />
                </div>
              )}
            </div>

            {/* Character count */}
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[10px] text-app-muted-2">
                {t('workspace.nameHint')}
              </p>
              <span className="text-[10px] text-app-muted-2">
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-app-border bg-app-surface/30 px-6 py-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="app-secondary-action"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            
            <button 
              type="submit" 
              disabled={!name.trim() || isSubmitting} 
              className="app-primary-action min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t('common.saving')}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{submitText ?? t('common.save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkspaceModal