import { useState } from 'react'
import {
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import {
  CONTENT_REGISTRY,
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

  const addRow = () => {
    if (content.columns.length === 0) {
      return
    }

    const cells = Object.fromEntries(
      content.columns.map((column) => [
        column.id,
        createDefaultCellValue(
          column.type,
        ) as TableCellValue,
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
    /*
     * EDIT COLUMN
     */
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

        /*
         * Nếu đổi TYPE của cột:
         * tự reset toàn bộ Cell
         * sang default value mới.
         */
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

    /*
     * CREATE COLUMN
     */
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

      /*
       * Tự thêm Cell tương ứng
       * cho TẤT CẢ row hiện tại.
       */
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

    /*
     * TEXT
     */
    if (column.type === 'text') {
      return (
        <input
          type="text"
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
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        />
      )
    }

    /*
     * LONG TEXT / NOTE / QUOTE
     */
    if (
      column.type === 'longText' ||
      column.type === 'note' ||
      column.type === 'quote'
    ) {
      return (
        <textarea
          value={
            typeof value === 'string'
              ? value
              : ''
          }
          rows={2}
          onChange={(event) =>
            updateCell(
              row.id,
              column.id,
              event.target.value,
            )
          }
          className="w-full resize-y bg-transparent px-2 py-2 text-sm outline-none"
        />
      )
    }

    /*
     * NUMBER
     */
    if (column.type === 'number') {
      return (
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
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        />
      )
    }

    /*
     * CHECKBOX
     */
    if (
      column.type === 'checkbox'
    ) {
      return (
        <div className="flex justify-center">
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
            className="h-4 w-4 accent-[#0068FF]"
          />
        </div>
      )
    }

    /*
     * DATE
     */
    if (column.type === 'date') {
      return (
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
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        />
      )
    }

    /*
     * SELECT
     */
    if (
      column.type === 'select'
    ) {
      return (
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
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        >
          <option value="">
            Chọn...
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
      )
    }

    /*
     * MULTI SELECT
     */
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
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
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
      )
    }

    /*
     * LINK
     */
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
        <div className="space-y-1 p-1">
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
            className="w-full bg-transparent px-1 text-sm outline-none"
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
                className="rounded-md p-1 text-general hover:bg-general/10"
              >
                <ExternalLink
                  size={14}
                />
              </a>
            )}
          </div>
        </div>
      )
    }

    /*
     * CHECKLIST
     */
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

      return (
        <div className="min-w-52 space-y-1 p-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group/item flex items-center gap-2"
            >
              <input
                type="checkbox"
                checked={
                  item.checked
                }
                onChange={() =>
                  updateItems(
                    items.map(
                      (current) =>
                        current.id ===
                        item.id
                          ? {
                              ...current,
                              checked:
                                !current.checked,
                            }
                          : current,
                    ),
                  )
                }
                className="h-4 w-4 accent-[#0068FF]"
              />

              <input
                value={item.text}
                onChange={(event) =>
                  updateItems(
                    items.map(
                      (current) =>
                        current.id ===
                        item.id
                          ? {
                              ...current,
                              text:
                                event
                                  .target
                                  .value,
                            }
                          : current,
                    ),
                  )
                }
                className={`min-w-0 flex-1 bg-transparent text-xs outline-none ${
                  item.checked
                    ? 'text-app-muted line-through'
                    : ''
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  updateItems(
                    items.filter(
                      (current) =>
                        current.id !==
                        item.id,
                    ),
                  )
                }
                className="text-app-muted opacity-0 hover:text-red-500 group-hover/item:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              updateItems([
                ...items,

                {
                  id: generateId(
                    'check',
                  ),
                  text: '',
                  checked: false,
                },
              ])
            }
            className="flex items-center gap-1 text-xs text-app-muted hover:text-general"
          >
            <Plus size={13} />
            Thêm
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-app-border">
        {content.columns.length ===
        0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium">
              Bảng chưa có cột
            </p>

            <p className="mt-1 text-xs text-app-muted">
              Thêm cột và chọn loại
              nội dung cho cột đó.
            </p>

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
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-general px-3 py-2 text-sm font-medium text-white"
            >
              <Plus size={16} />
              Thêm cột
            </button>
          </div>
        ) : (
          <>
            <table className="w-full min-w-[700px] border-collapse">
              <thead className="bg-app-surface">
                <tr>
                  {content.columns.map(
                    (column) => (
                      <th
                        key={column.id}
                        className="group/header min-w-44 border-b border-r border-app-border px-3 py-2 text-left last:border-r-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {
                                column.name
                              }
                            </p>

                            <p className="text-[10px] font-normal text-app-muted">
                              {
                                CONTENT_REGISTRY[
                                  column
                                    .type
                                ]
                                  .label
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingColumn(
                                column,
                              )

                              setColumnModalOpen(
                                true,
                              )
                            }}
                            className="rounded-md p-1 text-app-muted opacity-0 hover:bg-white hover:text-general group-hover/header:opacity-100"
                          >
                            <Pencil
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeColumn(
                                column.id,
                              )
                            }
                            className="rounded-md p-1 text-app-muted opacity-0 hover:bg-red-50 hover:text-red-500 group-hover/header:opacity-100"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      </th>
                    )
                  )}

                  <th className="w-12 border-b border-app-border" />
                </tr>
              </thead>

              <tbody>
                {content.rows.map(
                  (row) => (
                    <tr
                      key={row.id}
                      className="group/row"
                    >
                      {content.columns.map(
                        (column) => (
                          <td
                            key={
                              column.id
                            }
                            className="border-b border-r border-app-border align-top last:border-r-0"
                          >
                            {renderCell(
                              column,
                              row,
                            )}
                          </td>
                        ),
                      )}

                      <td className="border-b border-app-border text-center">
                        <button
                          type="button"
                          onClick={() =>
                            removeRow(
                              row.id,
                            )
                          }
                          className="rounded-md p-2 text-app-muted opacity-0 hover:bg-red-50 hover:text-red-500 group-hover/row:opacity-100"
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

            <div className="flex gap-2 p-2">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-app-muted hover:bg-app-hover hover:text-general"
              >
                <Plus size={14} />
                Hàng
              </button>

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
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-app-muted hover:bg-app-hover hover:text-general"
              >
                <Plus size={14} />
                Cột
              </button>
            </div>
          </>
        )}
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