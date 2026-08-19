import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'

import {
  getContentDefinitions,
  type BlockType,
} from '../../content/contentRegistry'

// Per-type accent colors for icons
const BLOCK_ICON_COLORS: Record<string, string> = {
  text:      'text-slate-500',
  heading:   'text-blue-500',
  note:      'text-amber-500',
  quote:     'text-violet-500',
  code:      'text-emerald-500',
  checklist: 'text-green-500',
  link:      'text-sky-500',
  table:     'text-indigo-500',
}

const BLOCK_ICON_BG: Record<string, string> = {
  text:      'bg-slate-100',
  heading:   'bg-blue-50',
  note:      'bg-amber-50',
  quote:     'bg-violet-50',
  code:      'bg-emerald-50',
  checklist: 'bg-green-50',
  link:      'bg-sky-50',
  table:     'bg-indigo-50',
}

interface BlockPickerProps {
  onSelect: (
    type: BlockType,
  ) => Promise<void> | void
  variant?: 'default' | 'compact'
}

interface PopupPosition {
  top: number
  left: number
}

const POPUP_WIDTH = 320
const POPUP_MAX_HEIGHT = 340
const POPUP_OFFSET = 8

function BlockPicker({
  onSelect,
  variant = 'default',
}: BlockPickerProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] =
    useState<PopupPosition>({ top: 0, left: 0 })

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const blockTypes = getContentDefinitions('block')

  const calculatePosition =
    useCallback(() => {
      if (!buttonRef.current) return

      const rect =
        buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      const spaceBelow =
        viewportHeight - rect.bottom
      const spaceAbove = rect.top

      let top: number
      if (
        spaceBelow >= POPUP_MAX_HEIGHT + POPUP_OFFSET ||
        spaceBelow >= spaceAbove
      ) {
        top = rect.bottom + POPUP_OFFSET
      } else {
        top =
          rect.top -
          Math.min(POPUP_MAX_HEIGHT, spaceAbove - POPUP_OFFSET) -
          POPUP_OFFSET
      }

      let left = rect.left
      if (left + POPUP_WIDTH > viewportWidth) {
        left = viewportWidth - POPUP_WIDTH - POPUP_OFFSET
      }

      setPosition({ top, left })
    }, [])

  const handleToggle = () => {
    if (!open) {
      calculatePosition()
    }
    setOpen((current) => !current)
  }

  const handleSelect = async (
    type: BlockType,
  ) => {
    await onSelect(type)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const insideButton = buttonRef.current?.contains(target)
      const insidePopup = popupRef.current?.contains(target)
      if (!insideButton && !insidePopup) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    )
    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      )
    }
  }, [open])

  return (
    <div className="inline-block">
      {variant === 'compact' ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          title="Chèn nội dung"
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
            open
              ? 'border-general bg-general text-white shadow-md'
              : 'border-transparent bg-white text-app-muted shadow-sm hover:border-app-border hover:text-app-text hover:shadow'
          }`}
        >
          <Plus size={14} className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            open
              ? 'border-general bg-general/5 text-general'
              : 'border-app-border text-app-muted hover:border-app-border-2 hover:bg-app-hover hover:text-app-text'
          }`}
        >
          <Plus size={15} className={open ? 'text-general' : ''} />
          Thêm nội dung
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
            className="animate-slide-up overflow-hidden rounded-2xl border border-app-border bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="border-b border-app-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-app-muted">
                Chọn loại nội dung
              </p>
            </div>

            {/* Grid */}
            <div className="max-h-[280px] overflow-y-auto p-3 custom-scrollbar">
              <div className="grid grid-cols-2 gap-1.5">
                {blockTypes.map(
                  ({
                    type,
                    label,
                    description,
                    icon: Icon,
                  }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        handleSelect(type as BlockType)
                      }
                      className="flex items-center gap-3 rounded-xl p-3 text-left transition hover:bg-app-hover"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          BLOCK_ICON_BG[type] ?? 'bg-slate-100'
                        }`}
                      >
                        <Icon
                          size={16}
                          className={BLOCK_ICON_COLORS[type] ?? 'text-slate-500'}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-app-muted">
                          {description}
                        </p>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default BlockPicker