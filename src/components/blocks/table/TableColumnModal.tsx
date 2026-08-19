import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Check, ChevronDown, X } from 'lucide-react'

import {
  CONTENT_REGISTRY,
  getContentDefinitions,
  type TableCellType,
} from '../../../content/contentRegistry'

import type {
  TableColumn,
} from '../../../types/block'

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

// Per-type icon colors (matches BlockPicker)
const COL_ICON_COLORS: Record<string, string> = {
  text:        'text-slate-500',
  longText:    'text-slate-500',
  number:      'text-blue-500',
  checkbox:    'text-green-500',
  date:        'text-purple-500',
  select:      'text-orange-500',
  multiSelect: 'text-amber-500',
  link:        'text-sky-500',
  checklist:   'text-emerald-500',
  note:        'text-yellow-500',
  quote:       'text-violet-500',
}

const COL_ICON_BG: Record<string, string> = {
  text:        'bg-slate-100',
  longText:    'bg-slate-100',
  number:      'bg-blue-50',
  checkbox:    'bg-green-50',
  date:        'bg-purple-50',
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
  const [name, setName] =
    useState('')

  const [type, setType] =
    useState<TableCellType>(
      'text',
    )

  const [optionsText, setOptionsText] =
    useState('')

  const [typeDropdownOpen, setTypeDropdownOpen] =
    useState(false)

  const dropdownRef =
    useRef<HTMLDivElement>(null)

  const definitions =
    getContentDefinitions(
      'table-cell',
    )

  useEffect(() => {
    if (!open) {
      return
    }

    setName(
      column?.name ?? '',
    )

    setType(
      column?.type ?? 'text',
    )

    setOptionsText(
      column?.options?.join(
        '\n',
      ) ?? '',
    )

    setTypeDropdownOpen(false)
  }, [open, column])

  useEffect(() => {
    if (!typeDropdownOpen) return

    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setTypeDropdownOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    )

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      )
  }, [typeDropdownOpen])

  if (!open) {
    return null
  }

  const definition =
    CONTENT_REGISTRY[type]

  const selectedDefinition =
    definitions.find(
      (d) => d.type === type,
    )

  const SelectedIcon =
    selectedDefinition?.icon

  const supportsOptions =
    'hasOptions' in definition &&
    definition.hasOptions === true

  const handleSubmit = () => {
    if (!name.trim()) {
      return
    }

    const options =
      supportsOptions
        ? optionsText
            .split('\n')
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean)
        : []

    onSubmit(
      name.trim(),
      type,
      options,
    )

    onClose()
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-sm rounded-2xl border border-app-border bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
          <h2 className="text-base font-semibold">
            {column
              ? 'Chỉnh sửa cột'
              : 'Thêm cột mới'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-hover"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Column name */}
          <label className="text-xs font-semibold uppercase tracking-wider text-app-muted">
            Tên cột
          </label>

          <input
            autoFocus
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            placeholder="Ví dụ: Trạng thái"
            className="mt-2 w-full rounded-xl border border-app-border px-4 py-2.5 text-sm outline-none transition focus:border-general focus:ring-3 focus:ring-general/10"
          />

          {/* Column type */}
          <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-wider text-app-muted">
            Loại nội dung
          </label>

          <div
            ref={dropdownRef}
            className="relative"
          >
            {/* Trigger */}
            <button
              type="button"
              onClick={() =>
                setTypeDropdownOpen(
                  (v) => !v,
                )
              }
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-app-border bg-white px-3 py-2.5 text-sm transition hover:border-app-border-2"
            >
              <span className="flex items-center gap-2">
                {SelectedIcon && (
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${COL_ICON_BG[type] ?? 'bg-slate-100'}`}>
                    <SelectedIcon
                      size={15}
                      className={COL_ICON_COLORS[type] ?? 'text-slate-500'}
                    />
                  </div>
                )}
                <span className="font-medium">
                  {selectedDefinition?.label ??
                    'Chọn loại...'}
                </span>
              </span>

              <ChevronDown
                size={15}
                className={`shrink-0 text-app-muted transition-transform ${
                  typeDropdownOpen
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            {typeDropdownOpen && (
              <div className="animate-slide-down absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-app-border bg-white shadow-xl">
                <div className="max-h-64 overflow-y-auto p-1.5 custom-scrollbar">
                  {definitions.map(
                    ({
                      type: definitionType,
                      label,
                      description,
                      icon: Icon,
                    }) => {
                      const currentType =
                        definitionType as TableCellType

                      const active =
                        type === currentType

                      return (
                        <button
                          key={
                            currentType
                          }
                          type="button"
                          onClick={() => {
                            setType(
                              currentType,
                            )
                            setTypeDropdownOpen(
                              false,
                            )
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                            active
                              ? 'bg-general/5 text-general'
                              : 'hover:bg-app-hover'
                          }`}
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${COL_ICON_BG[currentType] ?? 'bg-slate-100'}`}>
                            <Icon
                              size={14}
                              className={COL_ICON_COLORS[currentType] ?? 'text-slate-500'}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-tight">
                              {label}
                            </p>

                            {description && (
                              <p className="truncate text-[11px] text-app-muted">
                                {
                                  description
                                }
                              </p>
                            )}
                          </div>

                          {active && (
                            <Check
                              size={14}
                              className="ml-auto shrink-0 text-general"
                            />
                          )}
                        </button>
                      )
                    },
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Options (for select / multiSelect) */}
          {supportsOptions && (
            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-app-muted">
                Các lựa chọn
              </label>

              <p className="mt-1 text-[11px] text-app-muted">
                Mỗi dòng là một lựa chọn.
              </p>

              <textarea
                value={
                  optionsText
                }
                onChange={(
                  event,
                ) =>
                  setOptionsText(
                    event.target
                      .value,
                  )
                }
                rows={4}
                placeholder={`Chưa làm\nĐang làm\nHoàn thành`}
                className="mt-2 w-full resize-none rounded-xl border border-app-border p-3 text-sm outline-none transition focus:border-general focus:ring-3 focus:ring-general/10"
              />
            </div>
          )}

          {/* Actions */}
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
              onClick={
                handleSubmit
              }
              disabled={!name.trim()}
              className="rounded-lg bg-general px-4 py-2 text-sm font-medium text-white shadow-sm shadow-general/20 transition hover:bg-general-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {column
                ? 'Lưu thay đổi'
                : 'Thêm cột'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableColumnModal