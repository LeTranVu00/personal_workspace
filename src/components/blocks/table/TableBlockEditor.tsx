import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ExternalLink,
  Hash,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import {
  createDefaultCellValue,
  type TableCellType,
} from '../../../content/contentRegistry'

import type {
  ChecklistItem,
  LinkValue,
  TableBlockContent,
  TableCellValue,
  TableColumn,
  TableRow,
} from '../../../types/block'

import { generateId } from '../../../utils/generateId'

import TableColumnModal from './TableColumnModal'
import RichTextEditor from '../RichTextEditor'

interface TableBlockEditorProps {
  content: TableBlockContent

  onChange: (
    content: TableBlockContent,
  ) => Promise<void> | void
}

function TableBlockEditor({
  content,
  onChange,
}: TableBlockEditorProps) {
  const [columnModalOpen, setColumnModalOpen] =
    useState(false)

  const [editingColumn, setEditingColumn] =
    useState<TableColumn | undefined>()

  // Column resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null)
  const [startWidth, setStartWidth] = useState(0)
  const [startX, setStartX] = useState(0)
  const [tempWidths, setTempWidths] = useState<Record<string, number>>({})
  const colRefs = useRef<Record<string, HTMLTableCellElement | null>>({})

  useEffect(() => {
    if (!resizingColId) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      setTempWidths((prev) => ({
        ...prev,
        [resizingColId]: Math.max(40, startWidth + delta), // minimum width 40px
      }))
    }

    const handleMouseUp = () => {
      setTempWidths((prev) => {
        const finalWidth = prev[resizingColId]
        if (finalWidth) {
          const nextContent: TableBlockContent = {
            ...content,
            columns: content.columns.map((col) =>
              col.id === resizingColId ? { ...col, width: finalWidth } : col
            ),
          }
          void onChange(nextContent)
        }
        return {}
      })
      setResizingColId(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColId, startX, startWidth, content, onChange])

  const updateCell = (
    rowId: string,
    columnId: string,
    value: TableCellValue,
  ) => {
    const nextContent: TableBlockContent = {
      ...content,

      rows: content.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,

              cells: {
                ...row.cells,
                [columnId]: value,
              },
            }
          : row,
      ),
    }

    void onChange(nextContent)
  }

  const resetColumnWidth = (columnId: string) => {
    const nextContent: TableBlockContent = {
      ...content,
      columns: content.columns.map((col) =>
        col.id === columnId ? { ...col, width: undefined } : col
      ),
    }
    void onChange(nextContent)
    // Also clear from tempWidths
    setTempWidths((prev) => {
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }

  const addRow = () => {
    if (content.columns.length === 0) {
      return
    }

    let nextRowIndex = 1
    const firstCol = content.columns[0]
    if (firstCol && firstCol.type === 'number') {
      let maxNumber = 0
      content.rows.forEach((row) => {
        const val = row.cells[firstCol.id]
        if (typeof val === 'number' && val > maxNumber) {
          maxNumber = val
        }
      })
      nextRowIndex = maxNumber + 1
    }

    const cells = Object.fromEntries(
      content.columns.map((column, colIndex) => [
        column.id,
        colIndex === 0 && column.type === 'number'
          ? nextRowIndex
          : (createDefaultCellValue(
              column.type,
            ) as TableCellValue),
      ]),
    )

    const row: TableRow = {
      id: generateId('row'),
      cells,
    }

    void onChange({
      ...content,

      rows: [
        ...content.rows,
        row,
      ],
    })
  }

  const removeRow = (
    rowId: string,
  ) => {
    void onChange({
      ...content,

      rows: content.rows.filter(
        (row) => row.id !== rowId,
      ),
    })
  }

  const handleColumnSubmit = (
    name: string,
    type: TableCellType,
    options: string[],
  ) => {
    if (editingColumn) {
      const oldType =
        editingColumn.type

      const updatedColumn: TableColumn = {
        ...editingColumn,

        name,
        type,

        options:
          options.length > 0
            ? options
            : undefined,
      }

      const nextContent: TableBlockContent = {
        columns: content.columns.map(
          (column) =>
            column.id ===
            editingColumn.id
              ? updatedColumn
              : column,
        ),

        rows: content.rows.map(
          (row) => ({
            ...row,

            cells: {
              ...row.cells,

              [editingColumn.id]:
                oldType === type
                  ? row.cells[
                      editingColumn.id
                    ]
                  : (createDefaultCellValue(
                      type,
                    ) as TableCellValue),
            },
          }),
        ),
      }

      void onChange(nextContent)

      setEditingColumn(undefined)

      return
    }

    const columnId =
      generateId('col')

    const column: TableColumn = {
      id: columnId,
      name,
      type,

      options:
        options.length > 0
          ? options
          : undefined,
    }

    const nextContent: TableBlockContent = {
      columns: [
        ...content.columns,
        column,
      ],

      rows: content.rows.map(
        (row) => ({
          ...row,

          cells: {
            ...row.cells,

            [columnId]:
              createDefaultCellValue(
                type,
              ) as TableCellValue,
          },
        }),
      ),
    }

    void onChange(nextContent)
  }

  const removeColumn = (
    columnId: string,
  ) => {
    const nextContent: TableBlockContent = {
      columns:
        content.columns.filter(
          (column) =>
            column.id !== columnId,
        ),

      rows: content.rows.map(
        (row) => {
          const cells = {
            ...row.cells,
          }

          delete cells[columnId]

          return {
            ...row,
            cells,
          }
        },
      ),
    }

    void onChange(nextContent)
  }

  const renderCell = (
    column: TableColumn,
    row: TableRow,
  ) => {
    const value =
      row.cells[column.id]

    if (column.type === 'text') {
      const htmlVal = typeof value === 'string' ? value : ''
      // Strip HTML tags to get plain text for width measurement
      const plainText = htmlVal.replace(/<[^>]*>/g, '') || ' '
      return (
        <div className="relative h-full w-full">
          {/* Hidden div for column width measurement */}
          <div className="invisible whitespace-pre px-1.5 py-2 text-sm min-h-[44px] pointer-events-none select-none">
            {plainText}
          </div>
          {/* RichTextEditor overlaid on top */}
          <div className="absolute inset-0 px-1.5 py-1.5 overflow-hidden hover:bg-app-hover/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-inset focus-within:ring-indigo-500/20 transition-colors">
            <RichTextEditor
              content={htmlVal}
              placeholder="..."
              className="text-sm"
              onChange={(html) => updateCell(row.id, column.id, html)}
            />
          </div>
        </div>
      )
    }

    if (
      column.type === 'longText' ||
      column.type === 'note' ||
      column.type === 'quote'
    ) {
      const htmlVal = typeof value === 'string' ? value : ''
      return (
        <div className="h-full w-full min-h-[44px] max-h-48 overflow-y-auto px-1.5 py-1.5 transition-colors hover:bg-app-hover/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-inset focus-within:ring-indigo-500/20 custom-scrollbar">
          <RichTextEditor
            content={htmlVal}
            placeholder="..."
            className="text-sm"
            onChange={(html) => updateCell(row.id, column.id, html)}
          />
        </div>
      )
    }

    if (column.type === 'number') {
      const textVal = typeof value === 'number' ? value.toString() : ''
      return (
        <div className="relative h-full w-full">
          <div className="invisible flex items-center gap-1.5 whitespace-pre px-1.5 py-2 text-sm min-h-[44px]">
            <Hash size={13} className="shrink-0" />
            <span>{textVal + ' '}</span>
          </div>
          <div className="absolute inset-0 flex items-center gap-1.5 px-1.5 py-2 transition-colors hover:bg-app-hover/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-inset focus-within:ring-indigo-500/20">
            <Hash size={13} className="shrink-0 text-app-muted/70" />
            <input
              type="number"
              value={
                typeof value === 'number'
                  ? value
                  : ''
              }
              onChange={(event) => {
                const raw =
                  event.target.value

                updateCell(
                  row.id,
                  column.id,
                  raw === ''
                    ? ''
                    : Number(raw),
                )
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-app-muted/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              placeholder="0"
            />
          </div>
        </div>
      )
    }

    if (
      column.type === 'checkbox'
    ) {
      return (
        <div className="flex h-full items-center justify-center py-3 transition-colors hover:bg-app-hover/50">
          <input
            type="checkbox"
            checked={
              typeof value ===
              'boolean'
                ? value
                : false
            }
            onChange={(event) =>
              updateCell(
                row.id,
                column.id,
                event.target.checked,
              )
            }
            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-500 transition-colors hover:accent-indigo-600"
          />
        </div>
      )
    }

    if (column.type === 'date') {
      const textVal = typeof value === 'string' && value ? value : 'dd/mm/yyyy'
      return (
        <div className="relative h-full w-full">
          <div className="invisible whitespace-pre px-1.5 py-2 text-sm min-h-[44px]">
            {textVal + '       '}
          </div>
          <input
            type="date"
            value={
              typeof value === 'string'
                ? value
                : ''
            }
            onChange={(event) =>
              updateCell(
                row.id,
                column.id,
                event.target.value,
              )
            }
            className="absolute inset-0 w-full h-full bg-transparent px-1.5 py-2 text-sm outline-none transition-colors hover:bg-app-hover/50 focus:bg-white focus:ring-1 focus:ring-inset focus:ring-indigo-500/20"
          />
        </div>
      )
    }

    if (column.type === 'select') {
      const textVal = typeof value === 'string' && value ? value : '-- Chọn --'
      return (
        <div className="relative h-full w-full">
          <div className="invisible whitespace-pre px-1.5 py-2 text-sm min-h-[44px]">
            {textVal + '    '}
          </div>
          <select
            value={
              typeof value === 'string'
                ? value
                : ''
            }
            onChange={(event) =>
              updateCell(
                row.id,
                column.id,
                event.target.value,
              )
            }
            className="absolute inset-0 w-full h-full appearance-none bg-transparent px-1.5 py-2 text-sm outline-none transition-colors hover:bg-app-hover/50 focus:bg-white focus:ring-1 focus:ring-inset focus:ring-indigo-500/20"
          >
          <option value="" className="text-app-muted">
            -- Chọn --
          </option>

          {column.options?.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ),
          )}
        </select>
        </div>
      )
    }

    if (
      column.type ===
      'multiSelect'
    ) {
      const selectedValues =
        Array.isArray(value)
          ? value.filter(
              (
                item,
              ): item is string =>
                typeof item ===
                'string',
            )
          : []

      return (
        <div className="px-2 py-1.5">
          {/* Tag display */}
          {selectedValues.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1">
              {selectedValues.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <select
            multiple
            value={selectedValues}
            onChange={(event) => {
              const values =
                Array.from(
                  event.target
                    .selectedOptions,
                ).map(
                  (option) =>
                    option.value,
                )

              updateCell(
                row.id,
                column.id,
                values,
              )
            }}
            className="w-full bg-transparent text-xs text-app-muted outline-none"
            size={Math.min(3, column.options?.length ?? 2)}
          >
            {column.options?.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ),
            )}
          </select>
        </div>
      )
    }

    if (column.type === 'link') {
      const link: LinkValue =
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
          ? (value as LinkValue)
          : {
              label: '',
              url: '',
            }

      const normalizedUrl =
        link.url.trim()
          ? /^https?:\/\//i.test(
              link.url,
            )
            ? link.url
            : `https://${link.url}`
          : ''

      return (
        <div className="space-y-1 p-2">
          <input
            type="text"
            value={link.label}
            placeholder="Tên link"
            onChange={(event) =>
              updateCell(
                row.id,
                column.id,
                {
                  ...link,
                  label:
                    event.target
                      .value,
                },
              )
            }
            className="w-full bg-transparent px-1 text-sm font-medium outline-none"
          />

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={link.url}
              placeholder="https://..."
              onChange={(event) =>
                updateCell(
                  row.id,
                  column.id,
                  {
                    ...link,
                    url:
                      event.target
                        .value,
                  },
                )
              }
              className="min-w-0 flex-1 bg-transparent px-1 text-xs text-app-muted outline-none"
            />

            {normalizedUrl && (
              <a
                href={normalizedUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-md p-1 text-sky-500 hover:bg-sky-50"
              >
                <ExternalLink
                  size={13}
                />
              </a>
            )}
          </div>
        </div>
      )
    }

    if (
      column.type ===
      'checklist'
    ) {
      const items =
        Array.isArray(value)
          ? (value as ChecklistItem[])
          : []

      const updateItems = (
        nextItems: ChecklistItem[],
      ) => {
        updateCell(
          row.id,
          column.id,
          nextItems,
        )
      }

      const done = items.filter(i => i.checked).length
      const longestText = items.reduce(
        (max, item) => {
          const plainText = item.text.replace(/<[^>]+>/g, '') || ''
          return plainText.length > max.length ? plainText : max
        },
        ''
      )

      return (
        <div className="h-full px-1.5 py-2 transition-colors hover:bg-app-hover/30">
          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group/item relative flex items-center gap-1.5 rounded-md border border-transparent px-1 py-1 transition-colors hover:border-app-border hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() =>
                    updateItems(
                      items.map((current) =>
                        current.id === item.id
                          ? { ...current, checked: !current.checked }
                          : current,
                      ),
                    )
                  }
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-500 shrink-0"
                />
                {/* Rich text input */}
                <div className={`flex-1 min-w-0 ${item.checked ? 'text-app-muted/60 line-through opacity-60' : 'text-app-text'}`}>
                  <RichTextEditor
                    content={item.text}
                    placeholder="Việc cần làm..."
                    onChange={(html) =>
                      updateItems(
                        items.map((current) =>
                          current.id === item.id
                            ? { ...current, text: html }
                            : current,
                        ),
                      )
                    }
                    className="text-xs"
                  />
                </div>

                {/* Delete button - absolute so it doesn't add width */}
                <button
                  type="button"
                  title="Xóa"
                  onClick={() =>
                    updateItems(items.filter((current) => current.id !== item.id))
                  }
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-app-muted/50 opacity-100 md:opacity-0 transition-all hover:bg-red-50 hover:text-red-500 md:group-hover/item:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Width enforcer: invisible row that mirrors longest item → table-auto reads this as min column width */}
          <div aria-hidden className="invisible pointer-events-none flex items-center gap-1.5 px-1 py-1 text-xs whitespace-pre">
            <span className="h-4 w-4 inline-block shrink-0" />
            {longestText || ' '}
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                updateItems([
                  ...items,
                  {
                    id: crypto.randomUUID(),
                    text: '',
                    checked: false,
                  },
                ])
              }
              className="flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-app-muted/80 transition-colors hover:bg-white hover:text-emerald-600 w-fit"
            >
              <Plus size={12} />
              Thêm
            </button>

            {items.length > 0 && (
              <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center" title={`${done}/${items.length} hoàn thành`}>
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-200" strokeWidth="5" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    className="stroke-emerald-500 transition-all duration-500 ease-out"
                    strokeWidth="5"
                    strokeDasharray="88"
                    strokeDashoffset={88 - (done / items.length) * 88}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[7px] font-bold text-emerald-600">
                  {Math.round((done / items.length) * 100)}
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div className="group/block relative -mx-4 px-4 py-2">
      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-app-border bg-white shadow-sm ring-1 ring-slate-900/5 custom-scrollbar">
        {content.columns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-indigo-400"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>

            <p className="mt-3 text-sm font-semibold">
              Bảng chưa có cột
            </p>

            <p className="mt-1 text-xs text-app-muted">
              Thêm cột và chọn loại nội dung cho cột đó.
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingColumn(undefined)
                setColumnModalOpen(true)
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus size={15} />
              Thêm cột đầu tiên
            </button>
          </div>
        ) : (
          <div className="min-w-fit flex flex-col">
            <table className="w-max border-collapse table-auto">
              <thead>
                <tr className="bg-app-surface/80">
                  {content.columns.map(
                    (column) => {
                      // Only apply explicit width when user has resized or saved

                      return (
                        <th
                          key={column.id}
                          ref={(el) => { colRefs.current[column.id] = el }}
                          style={
                            tempWidths[column.id]
                              ? { width: tempWidths[column.id], minWidth: tempWidths[column.id] }
                              : column.width
                              ? { width: column.width }
                              : undefined
                          }
                          className="group/header relative border-b border-r border-app-border px-1.5 py-2.5 text-left last:border-r-0"
                        >
                        <div className="relative flex items-center w-full h-full">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="truncate text-xs font-semibold text-app-text">
                              {
                                column.name
                              }
                            </p>
                          </div>

                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 transition md:group-hover/header:opacity-100 bg-white/90 rounded-md backdrop-blur-sm p-0.5 shadow-sm border border-slate-100">
                            <button
                              type="button"
                              title="Chỉnh sửa cột"
                              onClick={() => {
                                setEditingColumn(
                                  column,
                                )

                                setColumnModalOpen(
                                  true,
                                )
                              }}
                              className="rounded-md p-1 text-app-muted hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                            >
                              <Pencil
                                size={12}
                              />
                            </button>

                            <button
                              type="button"
                              title="Xóa cột"
                              onClick={() =>
                                removeColumn(
                                  column.id,
                                )
                              }
                              className="rounded-md p-1 text-app-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2
                                size={12}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Column Resizer — double-click to reset to auto width */}
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault()
                            const thEl = colRefs.current[column.id]
                            const actualWidth = thEl ? thEl.getBoundingClientRect().width : 120
                            setResizingColId(column.id)
                            setStartX(e.clientX)
                            setStartWidth(actualWidth)
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            resetColumnWidth(column.id)
                          }}
                          title="Kéo để thạy đổi kích thước • Double-click để tự động"
                          className={`absolute bottom-0 right-0 top-0 z-10 w-2 cursor-col-resize transition-colors hover:bg-indigo-400/50 ${
                            resizingColId === column.id ? 'bg-indigo-500' : ''
                          }`}
                        />
                      </th>
                    );
                  })}

                  <th className="w-12 border-b border-app-border" />
                </tr>
              </thead>

              <tbody>
                {content.rows.map(
                  (row) => (
                    <tr
                      key={row.id}
                      className="group/row transition-colors hover:bg-slate-50/70"
                    >
                      {content.columns.map(
                        (column) => (
                          <td
                            key={
                              column.id
                            }
                            className="h-[1px] border-b border-r border-app-border/70 align-top last:border-r-0 p-0"
                          >
                            <div className="h-full min-h-[44px]">
                              {renderCell(
                                column,
                                row,
                              )}
                            </div>
                          </td>
                        ),
                      )}

                      <td className="h-[1px] w-12 border-b border-app-border/70 text-center align-middle p-0">
                        <button
                          type="button"
                          title="Xóa hàng"
                          onClick={() =>
                            removeRow(
                              row.id,
                            )
                          }
                          className="mx-auto rounded-md p-1.5 text-app-muted opacity-100 md:opacity-0 transition-all hover:bg-red-50 hover:text-red-600 md:group-hover/row:opacity-100"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>

            {/* Footer actions */}
            <div className="sticky left-0 flex items-center gap-3 bg-app-surface/30 px-3 py-2.5 border-t border-app-border/70 w-full">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-app-muted transition-colors hover:bg-white hover:text-indigo-600 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-900/5"
              >
                <Plus size={14} />
                Thêm hàng
              </button>

              <div className="h-4 w-px bg-app-border" />

              <button
                type="button"
                onClick={() => {
                  setEditingColumn(
                    undefined,
                  )

                  setColumnModalOpen(
                    true,
                  )
                }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-app-muted transition-colors hover:bg-white hover:text-indigo-600 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-900/5"
              >
                <Plus size={14} />
                Thêm cột
              </button>

              <span className="ml-auto text-xs font-medium text-app-muted/70">
                {content.rows.length} hàng · {content.columns.length} cột
              </span>
            </div>
          </div>
        )}
      </div>
    </div>

      <TableColumnModal
        open={columnModalOpen}
        column={editingColumn}
        onClose={() => {
          setColumnModalOpen(false)
          setEditingColumn(undefined)
        }}
        onSubmit={
          handleColumnSubmit
        }
      />
    </>
  )
}

export default TableBlockEditor