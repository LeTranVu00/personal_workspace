import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Upload, X, Database, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { backupService } from '../../services/backupService'
import { useLanguage } from '../../hooks/useLanguage'

interface BackupModalProps {
  open: boolean
  onClose: () => void
}

function BackupModal({ open, onClose }: BackupModalProps) {
  const { language, setLanguage, t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  if (!open) return null

  const handleExport = async () => {
    setIsWorking(true)
    setMessage(null)

    try {
      const backup = await backupService.create()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `personal-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: t('backup.exported') })
    } catch {
      setMessage({ type: 'error', text: t('backup.exportError') })
    } finally {
      setIsWorking(false)
    }
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!window.confirm(t('backup.confirm'))) {
      return
    }

    setIsWorking(true)
    setMessage(null)

    try {
      const content = await file.text()
      await backupService.restore(JSON.parse(content))
      localStorage.removeItem('activeWorkspaceId')
      localStorage.removeItem('activePageId')
      window.location.reload()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('backup.importError') 
      })
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div 
      className="modal-overlay flex items-center justify-center p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div 
        className="modal-content w-full max-w-md rounded-xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Database size={16} className="text-primary" />
            </div>
            <div>
              <h2 
                id="backup-modal-title"
                className="text-base font-semibold text-app-text"
              >
                {t('backup.title')}
              </h2>
              <p className="mt-0.5 text-xs text-app-muted">
                {t('backup.description')}
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

        {/* Content */}
        <div className="space-y-3 p-6">
          {/* Export Button */}
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isWorking}
            className="group flex w-full items-center gap-3 rounded-xl border border-app-border bg-app-surface/50 px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-colors group-hover:bg-primary/10">
              {isWorking ? (
                <Loader2 size={18} className="animate-spin text-primary" />
              ) : (
                <Download size={18} className="text-primary" />
              )}
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-app-text">
                {t('backup.export')}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-app-muted">
                {t('backup.exportDescription')}
              </span>
            </span>
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="group flex w-full items-center gap-3 rounded-xl border border-app-border bg-app-surface/50 px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-colors group-hover:bg-primary/10">
              <Upload size={18} className="text-primary" />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-app-text">
                {t('backup.import')}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-app-muted">
                {t('backup.importDescription')}
              </span>
            </span>
          </button>
          
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="application/json,.json" 
            onChange={(event) => void handleImport(event)} 
            className="hidden" 
          />

          {/* Message Display */}
          {message && (
            <div className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 ${
              message.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              )}
              <p className={`text-xs leading-5 ${
                message.type === 'success' ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Language Selector */}
          <div className="border-t border-app-border pt-4">
            <label className="app-form-label flex items-center gap-2">
              <Globe size={13} className="text-app-muted" />
              {t('language')}
            </label>
            
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'vi' | 'en')}
              className="app-form-select mt-2"
              disabled={isWorking}
            >
              <option value="vi">{t('vietnamese')}</option>
              <option value="en">{t('english')}</option>
            </select>
            
            <p className="mt-2 text-[10px] leading-4 text-app-muted-2">
              {t('language.description')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-app-border bg-app-surface/30 px-6 py-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="app-secondary-action"
            disabled={isWorking}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BackupModal