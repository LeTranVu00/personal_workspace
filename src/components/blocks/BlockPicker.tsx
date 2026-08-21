import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, X } from 'lucide-react'

import {
  getContentDefinitions,
  type BlockType,
} from '../../content/contentRegistry'
import { useLanguage } from '../../hooks/useLanguage'

// Per-type accent colors for icons - Consistent with theme
const BLOCK_ICON_COLORS: Record<string, string> = {
  text:      'text-slate-500',
  heading:   'text-blue-500',
  note:      'text-amber-500',
  quote:     'text-violet-500',
  code:      'text-emerald-500',
  checklist: 'text-emerald-600',
  link:      'text-sky-500',
  table:     'text-indigo-500',
}

const BLOCK_ICON_BG: Record<string, string> = {
  text:      'bg-slate-50',
  heading:   'bg-blue-50',
  note:      'bg-amber-50',
  quote:     'bg-violet-50',
  code:      'bg-emerald-50',
  checklist: 'bg-emerald-50',
  link:      'bg-sky-50',
  table:     'bg-indigo-50',
}

interface BlockPickerProps {
  onSelect: (type: BlockType) => Promise<void> | void
  variant?: 'default' | 'compact'
}

interface PopupPosition {
  top: number
  left: number
}

const POPUP_WIDTH = 320
const POPUP_MAX_HEIGHT = 380
const POPUP_OFFSET = 8

function BlockPicker({
  onSelect,
  variant = 'default',
}: BlockPickerProps) {
  const { translate, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopupPosition>({ top: 0, left: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const blockTypes = getContentDefinitions('block')
  
  const filteredBlockTypes = blockTypes.filter((blockType) => {
    if (!searchQuery.trim()) return true
    
    const searchableText = [
      translate(blockType.label),
      translate(blockType.description),
      blockType.type,
    ].join(' ').toLowerCase()
    
    return searchableText.includes(searchQuery.trim().toLowerCase())
  })

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top

    let top: number
    if (spaceBelow >= POPUP_MAX_HEIGHT + POPUP_OFFSET || spaceBelow >= spaceAbove) {
      top = rect.bottom + POPUP_OFFSET
    } else {
      top = rect.top - Math.min(POPUP_MAX_HEIGHT, spaceAbove - POPUP_OFFSET) - POPUP_OFFSET
    }

    let left = rect.left
    if (left + POPUP_WIDTH > viewportWidth) {
      left = viewportWidth - POPUP_WIDTH - POPUP_OFFSET
    }
    
    // Ensure left is never negative
    left = Math.max(POPUP_OFFSET, left)

    setPosition({ top, left })
  }, [])

  const handleToggle = () => {
    if (!open) {
      calculatePosition()
      setSearchQuery('')
    }
    setOpen((current) => !current)
  }

  const handleSelect = async (type: BlockType) => {
    await onSelect(type)
    setOpen(false)
    setSearchQuery('')
  }

  useEffect(() => {
    if (!open) return

    // Focus search input after opening
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const insideButton = buttonRef.current?.contains(target)
      const insidePopup = popupRef.current?.contains(target)
      if (!insideButton && !insidePopup) {
        setOpen(false)
        setSearchQuery('')
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="inline-block">
      {variant === 'compact' ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          title={translate('Chèn nội dung')}
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
            open
              ? 'border-primary bg-primary text-white shadow-md scale-110'
              : 'border-transparent bg-white text-app-muted shadow-sm hover:border-primary/30 hover:text-primary hover:shadow'
          }`}
        >
          <Plus size={14} className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
            open
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-app-border text-app-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
          }`}
        >
          <Plus size={15} className={open ? 'text-primary' : ''} />
          {translate('Thêm nội dung')}
        </button>
      )}

      {open &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: POPUP_WIDTH,
              zIndex: 9999,
            }}
            className="animate-scale-in overflow-hidden rounded-xl border border-app-border bg-white shadow-xl"
            role="dialog"
            aria-label={translate('Chọn loại nội dung')}
          >
            {/* Header with Search */}
            <div className="border-b border-app-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">
                  {translate('Chọn loại nội dung')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setSearchQuery('')
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
                  title={t('common.close')}
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="group flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
                <Search size={14} className="shrink-0 text-app-muted transition-colors group-focus-within:text-primary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-app-muted"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="shrink-0 rounded p-0.5 text-app-muted transition-colors hover:text-app-text"
                    title={t('common.clear')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="max-h-[280px] overflow-y-auto p-2 custom-scrollbar">
              {filteredBlockTypes.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-app-text">
                    {t('search.noResults')}
                  </p>
                  <p className="mt-1 text-xs text-app-muted">
                    {t('search.tryDifferent')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {filteredBlockTypes.map(({
                    type,
                    label,
                    description,
                    icon: Icon,
                  }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelect(type as BlockType)}
                      className="group flex items-center gap-2.5 rounded-lg p-2.5 text-left transition-all hover:bg-primary/5"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          BLOCK_ICON_BG[type] ?? 'bg-slate-50'
                        } transition-transform group-hover:scale-105`}
                      >
                        <Icon
                          size={16}
                          className={BLOCK_ICON_COLORS[type] ?? 'text-slate-500'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight text-app-text group-hover:text-primary">
                          {translate(label)}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-app-muted">
                          {translate(description)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-app-border bg-app-surface/50 px-3 py-2">
              <p className="text-center text-[10px] text-app-muted-2">
                {t('common.pressEsc')}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default BlockPicker