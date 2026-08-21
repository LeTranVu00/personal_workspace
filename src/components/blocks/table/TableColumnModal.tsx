import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Check, ChevronDown, X, Plus, Pencil, Loader2 } from 'lucide-react'

import {
  CONTENT_REGISTRY,
  getContentDefinitions,
  type TableCellType,
} from '../../../content/contentRegistry'

import type {
  TableColumn,
} from '../../../types/block'
import { useLanguage } from '../../../hooks/useLanguage'

interface TableColumnModalProps {
  open: boolean

  column?: TableColumn

  onClose: () => void

  onSubmit: (
    name: string,
    type: TableCellType,
    options: string[],
  ) => void
}

// Per-type icon colors (matches BlockPicker) - Optimized for primary theme
const COL_ICON_COLORS: Record<string, string> = {
  text:        'text-slate-500',
  longText:    'text-slate-500',
  number:      'text-blue-500',
  checkbox:    'text-emerald-500',
  date:        'text-indigo-500',
  select:      'text-orange-500',
  multiSelect: 'text-amber-500',
  link:        'text-sky-500',
  checklist:   'text-emerald-600',
  note:        'text-yellow-600',
  quote:       'text-violet-500',
}

const COL_ICON_BG: Record<string, string> = {
  text:        'bg-slate-50',
  longText:    'bg-slate-50',
  number:      'bg-blue-50',
  checkbox:    'bg-emerald-50',
  date:        'bg-indigo-50',
  select:      'bg-orange-50',
  multiSelect: 'bg-amber-50',
  link:        'bg-sky-50',
  checklist:   'bg-emerald-50',
  note:        'bg-yellow-50',
  quote:       'bg-violet-50',
}

function TableColumnModal({
  open,
  column,
  onClose,
  onSubmit,
}: TableColumnModalProps) {
  const { translate, t } = useLanguage()
  const [name, setName] = useState('')
  const [type, setType] = useState<TableCellType>('text')
  const [optionsText, setOptionsText] = useState('')
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const definitions = getContentDefinitions('table-cell')

  useEffect(() => {
    if (!open) {
      return
    }

    setName(column?.name ?? '')
    setType(column?.type ?? 'text')
    setOptionsText(column?.options?.join('\n') ?? '')
    setTypeDropdownOpen(false)
    setIsSubmitting(false)
    
    // Focus name input after animation
    setTimeout(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }, 50)
  }, [open, column])

  useEffect(() => {
    if (!typeDropdownOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setTypeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [typeDropdownOpen])

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

  if (!open) {
    return null
  }

  const definition = CONTENT_REGISTRY[type]
  const selectedDefinition = definitions.find((d) => d.type === type)
  const SelectedIcon = selectedDefinition?.icon
  const supportsOptions = 'hasOptions' in definition && definition.hasOptions === true

  const handleSubmit = () => {
    if (!name.trim() || isSubmitting) {
      return
    }

    const options = supportsOptions
      ? optionsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      : []

    setIsSubmitting(true)
    
    // Small delay for better UX
    setTimeout(() => {
      onSubmit(name.trim(), type, options)
      onClose()
      setIsSubmitting(false)
    }, 150)
  }

  return (
    <div 
      className="modal-overlay flex items-center justify-center p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="column-modal-title"
    >
      <div 
        className="modal-content w-full max-w-sm rounded-xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              {column ? (
                <Pencil size={16} className="text-primary" />
              ) : (
                <Plus size={16} className="text-primary" />
              )}
            </div>
            <div>
              <h2 
                id="column-modal-title"
                className="text-base font-semibold text-app-text"
              >
                {column ? translate('Chỉnh sửa cột') : translate('Thêm cột mới')}
              </h2>
              <p className="mt-0.5 text-xs text-app-muted">
                {column ? translate('Cập nhật thông tin cột') : translate('Tạo cột mới cho bảng')}
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

        <div className="p-6">
          {/* Column name */}
          <div>
            <label 
              htmlFor="column-name"
              className="app-form-label"
            >
              {translate('Tên cột')}
            </label>
            
            <input
              id="column-name"
              ref={nameInputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={translate('Ví dụ: Trạng thái')}
              className="app-form-input mt-2"
              disabled={isSubmitting}
              autoComplete="off"
              maxLength={50}
            />
            
            <div className="mt-1.5 flex justify-end">
              <span className="text-[10px] text-app-muted-2">
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Column type */}
          <div className="mt-4">
            <label className="app-form-label">
              {translate('Loại nội dung')}
            </label>

            <div ref={dropdownRef} className="relative mt-2">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setTypeDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-app-border bg-white px-3.5 py-2.5 text-sm transition-all hover:border-app-border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isSubmitting}
              >
                <span className="flex items-center gap-2.5">
                  {SelectedIcon && (
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${COL_ICON_BG[type] ?? 'bg-slate-50'}`}>
                      <SelectedIcon
                        size={15}
                        className={COL_ICON_COLORS[type] ?? 'text-slate-500'}
                      />
                    </div>
                  )}
                  <span className="font-medium text-app-text">
                    {selectedDefinition?.label ?? translate('Chọn loại...')}
                  </span>
                </span>

                <ChevronDown
                  size={15}
                  className={`shrink-0 text-app-muted transition-transform duration-200 ${
                    typeDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {typeDropdownOpen && (
                <div className="animate-slide-down absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-app-border bg-white shadow-lg">
                  <div className="max-h-64 overflow-y-auto p-1.5 custom-scrollbar">
                    {definitions.map(({
                      type: definitionType,
                      label,
                      description,
                      icon: Icon,
                    }) => {
                      const currentType = definitionType as TableCellType
                      const active = type === currentType

                      return (
                        <button
                          key={currentType}
                          type="button"
                          onClick={() => {
                            setType(currentType)
                            setTypeDropdownOpen(false)
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-app-hover'
                          }`}
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${COL_ICON_BG[currentType] ?? 'bg-slate-50'}`}>
                            <Icon
                              size={14}
                              className={COL_ICON_COLORS[currentType] ?? 'text-slate-500'}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold leading-tight ${
                              active ? 'text-primary' : 'text-app-text'
                            }`}>
                              {translate(label)}
                            </p>

                            {description && (
                              <p className="mt-0.5 truncate text-[10px] text-app-muted">
                                {translate(description)}
                              </p>
                            )}
                          </div>

                          {active && (
                            <Check
                              size={14}
                              className="ml-auto shrink-0 text-primary"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options (for select / multiSelect) */}
          {supportsOptions && (
            <div className="mt-4">
              <label className="app-form-label">
                {translate('Các lựa chọn')}
              </label>

              <p className="mt-1 text-[11px] leading-4 text-app-muted">
                {translate('Mỗi dòng là một lựa chọn.')}
              </p>

              <textarea
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                rows={4}
                placeholder={`Chưa làm\nĐang làm\nHoàn thành`}
                className="app-form-textarea mt-2 resize-none font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="app-secondary-action"
              disabled={isSubmitting}
            >
              {translate('Hủy')}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="app-primary-action min-w-[110px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t('common.saving')}</span>
                </>
              ) : (
                <>
                  {column ? (
                    <Check size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  <span>
                    {column ? translate('Lưu thay đổi') : translate('Thêm cột')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableColumnModal