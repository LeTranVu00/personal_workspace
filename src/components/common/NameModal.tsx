import { useEffect, useState, useRef } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

interface NameModalProps {
  open: boolean
  title: string
  label: string
  placeholder?: string
  initialValue?: string
  submitText?: string
  extraContent?: React.ReactNode
  onClose: () => void
  onSubmit: (value: string) => Promise<void> | void
}

function NameModal({ 
  open, 
  title, 
  label, 
  placeholder = '', 
  initialValue = '', 
  submitText, 
  extraContent, 
  onClose, 
  onSubmit 
}: NameModalProps) {
  const { t } = useLanguage()
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [open, initialValue])

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
    const trimmedValue = value.trim()
    if (!trimmedValue || isSubmitting) return
    
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
      className="modal-overlay flex items-center justify-center p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal-content w-full max-w-md rounded-xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header - Clean & Minimal */}
        <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Check size={16} className="text-primary" />
            </div>
            <h2 
              id="modal-title"
              className="text-base font-semibold text-app-text"
            >
              {title}
            </h2>
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
              htmlFor="modal-input"
              className="app-form-label"
            >
              {label}
            </label>
            
            {extraContent && (
              <div className="mt-4">
                {extraContent}
              </div>
            )}

            <input 
              id="modal-input"
              ref={inputRef}
              type="text" 
              value={value} 
              onChange={(event) => setValue(event.target.value)} 
              placeholder={placeholder} 
              className="app-form-input mt-2"
              disabled={isSubmitting}
              autoComplete="off"
              maxLength={100}
            />

            {/* Character count */}
            {value.length > 0 && (
              <div className="mt-1.5 text-right text-[10px] text-app-muted-2">
                {value.length}/100
              </div>
            )}
          </div>

          {/* Footer - Action Buttons */}
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
              disabled={!value.trim() || isSubmitting} 
              className="app-primary-action min-w-[100px]"
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

export default NameModal