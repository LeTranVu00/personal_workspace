import {
  useEffect,
  useState,
} from 'react'

import { X } from 'lucide-react'

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
  }, [open, column])

  if (!open) {
    return null
  }

  const definition =
    CONTENT_REGISTRY[type]

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-app-border bg-white shadow-xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
          <h2 className="font-semibold">
            {column
              ? 'Chỉnh sửa cột'
              : 'Thêm cột'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-app-muted hover:bg-app-hover"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5">
          <label className="text-sm font-medium">
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
            className="mt-2 w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none focus:border-general"
          />

          <p className="mb-2 mt-5 text-sm font-medium">
            Loại nội dung
          </p>

          <div className="grid grid-cols-2 gap-2">
            {definitions.map(
              ({
                type: definitionType,
                label,
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
                    onClick={() =>
                      setType(
                        currentType,
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                      active
                        ? 'border-general bg-general/5 text-general'
                        : 'border-app-border hover:bg-app-hover'
                    }`}
                  >
                    <Icon
                      size={17}
                    />

                    {label}
                  </button>
                )
              },
            )}
          </div>

          {supportsOptions && (
            <div className="mt-5">
              <label className="text-sm font-medium">
                Các lựa chọn
              </label>

              <p className="mt-1 text-xs text-app-muted">
                Mỗi dòng là một lựa
                chọn.
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
                rows={5}
                placeholder={`Chưa làm
Đang làm
Hoàn thành`}
                className="mt-2 w-full resize-none rounded-xl border border-app-border p-3 text-sm outline-none focus:border-general"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-hover"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              className="rounded-lg bg-general px-4 py-2 text-sm font-medium text-white"
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