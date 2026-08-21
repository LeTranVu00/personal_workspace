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
  Table2,
  ChevronDown,
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
import { useLanguage } from '../../../hooks/useLanguage'

interface TableBlockEditorProps {
  content: TableBlockContent
  onChange: (content: TableBlockContent) => Promise<void> | void
}

function MultiSelectCell({
  column,
  row,
  selectedValues,
  updateCell,
}: {
  column: TableColumn
  row: TableRow
  selectedValues: string[]
  updateCell: (rowId: string, columnId: string, value: TableCellValue) => void
}) {
  const { translate, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option]
    updateCell(row.id, column.id, newValues)
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-center px-1.5 py-1.5" ref={containerRef}>
      <div 
        className="flex min-h-[28px] cursor-pointer flex-wrap items-center gap-1 rounded-md px-1 py-1 transition-colors hover:bg-primary/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 && (
          <span className="px-1 text-xs text-app-muted">{translate('Chọn...')}</span>
        )}
        
        {selectedValues.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleOption(tag)
              }}
              className="ml-0.5 rounded-full hover:bg-primary/20"
              title={t('common.remove')}
            >
              <ChevronDown size={10} className="rotate-45" />
            </button>
          </span>
        ))}
        
        <ChevronDown 
          size={12} 
          className={`ml-auto shrink-0 text-app-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="animate-scale-in absolute left-0 top-full z-50 mt-1 w-48 max-h-48 overflow-y-auto rounded-lg border border-app-border bg-white p-1.5 shadow-lg custom-scrollbar">
          {(!column.options || column.options.length === 0) && (
            <div className="p-2 text-xs text-app-muted">
              {translate('Không có tùy chọn')}
            </div>
          )}
          
          {column.options?.map(option => (
            <label 
              key={option} 
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-primary/5"
            >
              <input 
                type="checkbox" 
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-app-border accent-primary"
              />
              <span className="text-app-text">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function TableBlockEditor({
  content,
  onChange,
}: TableBlockEditorProps) {
  const { translate, t } = useLanguage()
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<TableColumn | undefined>()

  // Column resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null)
  const [startWidth, setStartWidth] = useState(0)
  const [startX, setStartX] = useState(0)
  const [tempWidths, setTempWidths] = useState<Record<string, number>>({})
  const colRefs = useRef<Record<string, HTMLTableCellElement | null>>({})

  useEffect(() => {
    if (!resizingColId) return

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const delta = clientX - startX
      setTempWidths((prev) => ({
        ...prev,
        [resizingColId]: Math.max(40, startWidth + delta),
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
    document.addEventListener('touchmove', handleMouseMove)
    document.addEventListener('touchend', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleMouseMove)
      document.removeEventListener('touchend', handleMouseUp)
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
    setTempWidths((prev) => {
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }

  const addRow = () => {
    if (content.columns.length === 0) return

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
          : (createDefaultCellValue(column.type) as TableCellValue),
      ]),
    )

    const row: TableRow = {
      id: generateId('row'),
      cells,
    }

    void onChange({
      ...content,
      rows: [...content.rows, row],
    })
  }

  const removeRow = (rowId: string) => {
    void onChange({
      ...content,
      rows: content.rows.filter((row) => row.id !== rowId),
    })
  }

  const handleColumnSubmit = (
    name: string,
    type: TableCellType,
    options: string[],
  ) => {
    if (editingColumn) {
      const oldType = editingColumn.type
      const updatedColumn: TableColumn = {
        ...editingColumn,
        name,
        type,
        options: options.length > 0 ? options : undefined,
      }

      const nextContent: TableBlockContent = {
        columns: content.columns.map((column) =>
          column.id === editingColumn.id ? updatedColumn : column,
        ),
        rows: content.rows.map((row) => ({
          ...row,
          cells: {
            ...row.cells,
            [editingColumn.id]:
              oldType === type
                ? row.cells[editingColumn.id]
                : (createDefaultCellValue(type) as TableCellValue),
          },
        })),
      }

      void onChange(nextContent)
      setEditingColumn(undefined)
      return
    }

    const columnId = generateId('col')
    const column: TableColumn = {
      id: columnId,
      name,
      type,
      options: options.length > 0 ? options : undefined,
    }

    const nextContent: TableBlockContent = {
      columns: [...content.columns, column],
      rows: content.rows.map((row) => ({
        ...row,
        cells: {
          ...row.cells,
          [columnId]: createDefaultCellValue(type) as TableCellValue,
        },
      })),
    }

    void onChange(nextContent)
  }

  const removeColumn = (columnId: string) => {
    const nextContent: TableBlockContent = {
      columns: content.columns.filter((column) => column.id !== columnId),
      rows: content.rows.map((row) => {
        const cells = { ...row.cells }
        delete cells[columnId]
        return { ...row, cells }
      }),
    }
    void onChange(nextContent)
  }

  const renderCell = (column: TableColumn, row: TableRow) => {
    const value = row.cells[column.id]
    const cellSurface = 'table-cell-surface h-full w-full px-2 py-2'

    if (column.type === 'text') {
      const htmlVal = typeof value === 'string' ? value : ''
      const plainText = htmlVal.replace(/<[^>]*>/g, '') || ' '
      
      return (
        <div className="relative h-full w-full">
          <div className="invisible whitespace-pre px-1.5 py-2 text-sm min-h-[44px] pointer-events-none select-none">
            {plainText}
          </div>
          <div className={`absolute inset-0 ${cellSurface} overflow-hidden`}>
            <RichTextEditor
              content={htmlVal}
              placeholder="..."
              className="text-sm text-app-text"
              onChange={(html) => updateCell(row.id, column.id, html)}
            />
          </div>
        </div>
      )
    }

    if (column.type === 'longText' || column.type === 'note' || column.type === 'quote') {
      const htmlVal = typeof value === 'string' ? value : ''
      return (
        <div className={`${cellSurface} max-h-40 overflow-y-auto custom-scrollbar`}>
          <RichTextEditor
            content={htmlVal}
            placeholder="..."
            className="text-sm text-app-text"
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
          <div className={`${cellSurface} absolute inset-0 flex items-center gap-1.5`}>
            <Hash size={13} className="shrink-0 text-app-muted/50" />
            <input
              type="number"
              value={typeof value === 'number' ? value : ''}
              onChange={(event) => {
                const raw = event.target.value
                updateCell(row.id, column.id, raw === '' ? '' : Number(raw))
              }}
              className="table-cell-control flex-1 text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              placeholder="0"
            />
          </div>
        </div>
      )
    }

    if (column.type === 'checkbox') {
      return (
        <div className={`${cellSurface} flex items-center justify-center`}>
          <input
            type="checkbox"
            checked={typeof value === 'boolean' ? value : false}
            onChange={(event) => updateCell(row.id, column.id, event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-app-border accent-primary transition-colors"
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
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => updateCell(row.id, column.id, event.target.value)}
            className="table-cell-control table-cell-surface absolute inset-0 h-full w-full px-2 py-2 text-sm"
          />
        </div>
      )
    }

    if (column.type === 'select') {
      const textVal = typeof value === 'string' && value ? value : translate('-- Chọn --')
      return (
        <div className="relative h-full w-full">
          <div className="invisible whitespace-pre px-1.5 py-2 text-sm min-h-[44px]">
            {textVal + '    '}
          </div>
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => updateCell(row.id, column.id, event.target.value)}
            className="table-cell-control table-cell-surface absolute inset-0 h-full w-full appearance-none px-2 py-2 text-sm cursor-pointer"
          >
            <option value="" className="text-app-muted">
              {translate('-- Chọn --')}
            </option>
            {column.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (column.type === 'multiSelect') {
      const selectedValues = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []

      return (
        <MultiSelectCell
          column={column}
          row={row}
          selectedValues={selectedValues}
          updateCell={updateCell}
        />
      )
    }

    if (column.type === 'link') {
      const link: LinkValue = value && typeof value === 'object' && !Array.isArray(value)
        ? (value as LinkValue)
        : { label: '', url: '' }

      const normalizedUrl = link.url.trim()
        ? /^https?:\/\//i.test(link.url)
          ? link.url
          : `https://${link.url}`
        : ''

      return (
        <div className={`${cellSurface} space-y-1.5`}>
          <input
            type="text"
            value={link.label}
            placeholder={translate('Tên link')}
            onChange={(event) => updateCell(row.id, column.id, { ...link, label: event.target.value })}
            className="table-cell-control w-full text-sm font-medium"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={link.url}
              placeholder="https://..."
              onChange={(event) => updateCell(row.id, column.id, { ...link, url: event.target.value })}
              className="table-cell-control flex-1 text-xs text-app-muted"
            />
            {normalizedUrl && (
              <a
                href={normalizedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
                title={t('common.open')}
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      )
    }

    if (column.type === 'checklist') {
      const items = Array.isArray(value) ? (value as ChecklistItem[]) : []

      const updateItems = (nextItems: ChecklistItem[]) => {
        updateCell(row.id, column.id, nextItems)
      }

      const done = items.filter(i => i.checked).length
      const longestText = items.reduce((max, item) => {
        const plainText = item.text.replace(/<[^>]+>/g, '') || ''
        return plainText.length > max.length ? plainText : max
      }, '')

      return (
        <div className={`${cellSurface} h-full`}>
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="group/item relative flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-primary/5"
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
                  className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-app-border accent-emerald-500"
                />
                <div className={`min-w-0 flex-1 ${item.checked ? 'text-app-muted/60 line-through opacity-60' : 'text-app-text'}`}>
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
                <button
                  type="button"
                  title={translate('Xóa')}
                  onClick={() => updateItems(items.filter((current) => current.id !== item.id))}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-app-muted/50 opacity-100 transition-all hover:bg-red-50 hover:text-red-500 md:opacity-0 md:group-hover/item:opacity-100"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <div aria-hidden className="invisible pointer-events-none flex items-center gap-1.5 px-1 py-1 text-xs whitespace-pre">
            <span className="h-4 w-4 inline-block shrink-0" />
            {longestText || ' '}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateItems([
                  ...items,
                  { id: crypto.randomUUID(), text: '', checked: false },
                ])
              }
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-app-muted transition-colors hover:bg-emerald-50 hover:text-emerald-600"
            >
              <Plus size={11} />
              {translate('Thêm')}
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

  const getColumnMinWidth = (column: TableColumn) => {
    if (column.width) return column.width

    switch (column.type) {
      case 'checkbox': return 76
      case 'number': return 112
      case 'date': return 150
      case 'link': return 220
      case 'longText':
      case 'note':
      case 'quote':
      case 'checklist': return 220
      default: return 160
    }
  }

  return (
    <>
      <div className="group/block relative -mx-4 px-4 py-2">
        <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-app-border bg-white shadow-sm custom-scrollbar">
          {content.columns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Table2 size={24} className="text-primary" strokeWidth={1.5} />
              </div>
              <p className="mt-4 text-sm font-semibold text-app-text">
                {translate('Bảng chưa có cột')}
              </p>
              <p className="mt-1 text-xs text-app-muted">
                {translate('Thêm cột và chọn loại nội dung cho cột đó.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingColumn(undefined)
                  setColumnModalOpen(true)
                }}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95"
              >
                <Plus size={15} />
                {translate('Thêm cột đầu tiên')}
              </button>
            </div>
          ) : (
            <div className="min-w-fit flex flex-col">
              <table className="w-max min-w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-app-surface/50">
                    {content.columns.map((column) => (
                      <th
                        key={column.id}
                        ref={(el) => { colRefs.current[column.id] = el }}
                        style={
                          tempWidths[column.id]
                            ? { width: tempWidths[column.id], minWidth: tempWidths[column.id] }
                            : column.width
                            ? { width: column.width, minWidth: column.width }
                            : { minWidth: getColumnMinWidth(column) }
                        }
                        className="group/header relative border-b border-r border-app-border px-3 py-2.5 text-left last:border-r-0"
                      >
                        <div className="relative flex items-center w-full h-full">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="truncate text-xs font-semibold text-app-text">
                              {column.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-app-muted">
                              {column.type}
                            </p>
                          </div>

                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 transition-opacity md:group-hover/header:opacity-100 bg-white/90 rounded-md backdrop-blur-sm p-0.5 shadow-sm border border-app-border">
                            <button
                              type="button"
                              title={translate('Chỉnh sửa cột')}
                              onClick={() => {
                                setEditingColumn(column)
                                setColumnModalOpen(true)
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              title={translate('Xóa cột')}
                              onClick={() => removeColumn(column.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Column Resizer */}
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault()
                            const thEl = colRefs.current[column.id]
                            const actualWidth = thEl ? thEl.getBoundingClientRect().width : 120
                            setResizingColId(column.id)
                            setStartX(e.clientX)
                            setStartWidth(actualWidth)
                          }}
                          onTouchStart={(e) => {
                            const thEl = colRefs.current[column.id]
                            const actualWidth = thEl ? thEl.getBoundingClientRect().width : 120
                            setResizingColId(column.id)
                            setStartX(e.touches[0].clientX)
                            setStartWidth(actualWidth)
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            resetColumnWidth(column.id)
                          }}
                          title={t('table.resizeHint')}
                          className={`absolute bottom-0 right-0 top-0 z-10 w-1.5 cursor-col-resize transition-colors hover:bg-primary/40 ${
                            resizingColId === column.id ? 'bg-primary' : ''
                          }`}
                        />
                      </th>
                    ))}
                    <th className="w-12 border-b border-app-border" />
                  </tr>
                </thead>

                <tbody>
                  {content.rows.map((row) => (
                    <tr key={row.id} className="group/row transition-colors hover:bg-app-hover/30">
                      {content.columns.map((column) => (
                        <td
                          key={column.id}
                          className="h-[1px] border-b border-r border-app-border/50 align-top last:border-r-0 p-0"
                        >
                          <div className="h-full min-h-[44px]">
                            {renderCell(column, row)}
                          </div>
                        </td>
                      ))}
                      <td className="h-[1px] w-12 border-b border-app-border/50 text-center align-middle p-0">
                        <button
                          type="button"
                          title={translate('Xóa hàng')}
                          onClick={() => removeRow(row.id)}
                          className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-app-muted opacity-100 transition-all hover:bg-red-50 hover:text-red-500 md:opacity-0 md:group-hover/row:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="sticky left-0 flex items-center gap-2 bg-app-surface/30 px-3 py-2.5 border-t border-app-border">
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-app-muted transition-colors hover:bg-white hover:text-primary"
                >
                  <Plus size={13} />
                  {translate('Thêm hàng')}
                </button>

                <div className="h-4 w-px bg-app-border" />

                <button
                  type="button"
                  onClick={() => {
                    setEditingColumn(undefined)
                    setColumnModalOpen(true)
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-app-muted transition-colors hover:bg-white hover:text-primary"
                >
                  <Plus size={13} />
                  {translate('Thêm cột')}
                </button>

                <span className="ml-auto text-[11px] font-medium text-app-muted">
                  {content.rows.length} {t('table.rows')} · {content.columns.length} {t('table.columns')}
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
        onSubmit={handleColumnSubmit}
      />
    </>
  )
}

export default TableBlockEditor