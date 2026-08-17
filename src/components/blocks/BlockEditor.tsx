import TableBlockEditor from './table/TableBlockEditor'
import {
  useEffect,
  useState,
} from 'react'

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'

import type {
  Block,
  BlockContent,
  ChecklistBlockContent,
  HeadingBlockContent,
  LinkBlockContent,
  NoteBlockContent,
  TableBlockContent,
  TextBlockContent,
  QuoteBlockContent,
  CodeBlockContent,
} from '../../types/block'

import { blockRepository } from '../../db/repositories/blockRepository'

import { generateId } from '../../utils/generateId'

interface BlockEditorProps {
  block: Block
  isFirst: boolean
  isLast: boolean

  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function BlockEditor({
  block,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockEditorProps) {
  const [content, setContent] =
    useState<BlockContent>(block.content)

  useEffect(() => {
    setContent(block.content)
  }, [block.id, block.content])

  const save = async (
    nextContent: BlockContent,
  ) => {
    setContent(nextContent)

    await blockRepository.updateContent(
      block.id,
      nextContent,
    )
  }

  const saveCurrent = async () => {
    await blockRepository.updateContent(
      block.id,
      content,
    )
  }

  const renderContent = () => {
    switch (block.type) {
      case 'heading': {
        const current =
          content as HeadingBlockContent

        return (
          <input
            type="text"
            value={current.text}
            placeholder="Tiêu đề..."
            onChange={(event) =>
              setContent({
                text: event.target.value,
              })
            }
            onBlur={saveCurrent}
            className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-slate-300"
          />
        )
      }

      case 'text': {
        const current =
          content as TextBlockContent

        return (
          <textarea
            value={current.text}
            placeholder="Nhập nội dung..."
            rows={3}
            onChange={(event) =>
              setContent({
                text: event.target.value,
              })
            }
            onBlur={saveCurrent}
            className="w-full resize-y bg-transparent text-sm leading-7 outline-none placeholder:text-slate-300"
          />
        )
      }

      case 'note': {
        const current =
          content as NoteBlockContent

        return (
          <div className="rounded-xl border border-general/20 bg-general/5 p-4">
            <textarea
              value={current.text}
              placeholder="Viết ghi chú..."
              rows={3}
              onChange={(event) =>
                setContent({
                  text: event.target.value,
                })
              }
              onBlur={saveCurrent}
              className="w-full resize-y bg-transparent text-sm leading-6 outline-none placeholder:text-app-muted"
            />
          </div>
        )
      }

      case 'quote': {
        const current =
          content as QuoteBlockContent

        return (
          <div className="border-l-4 border-general pl-4 py-1 italic">
            <textarea
              value={current.text}
              placeholder="Nhập trích dẫn..."
              rows={2}
              onChange={(event) =>
                setContent({
                  text: event.target.value,
                })
              }
              onBlur={saveCurrent}
              className="w-full resize-y bg-transparent text-lg text-app-muted outline-none"
            />
          </div>
        )
      }

      case 'code': {
        const current =
          content as CodeBlockContent

        return (
          <div className="rounded-xl bg-slate-900 p-4 font-mono text-sm">
            <input
              type="text"
              value={current.language}
              onChange={(event) =>
                setContent({
                  ...current,
                  language: event.target.value,
                })
              }
              onBlur={saveCurrent}
              className="mb-2 w-32 bg-transparent text-xs text-slate-400 outline-none placeholder:text-slate-600"
              placeholder="language"
            />
            <textarea
              value={current.code}
              placeholder="Mã nguồn..."
              rows={4}
              onChange={(event) =>
                setContent({
                  ...current,
                  code: event.target.value,
                })
              }
              onBlur={saveCurrent}
              className="w-full resize-y bg-transparent text-slate-100 outline-none"
              spellCheck={false}
            />
          </div>
        )
      }

      case 'checklist': {
        const current =
          content as ChecklistBlockContent

        const updateItemText = (
          id: string,
          text: string,
        ) => {
          setContent({
            items: current.items.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      text,
                    }
                  : item,
            ),
          })
        }

        const toggleItem = async (
          id: string,
        ) => {
          const nextContent: ChecklistBlockContent =
            {
              items: current.items.map(
                (item) =>
                  item.id === id
                    ? {
                        ...item,
                        checked:
                          !item.checked,
                      }
                    : item,
              ),
            }

          await save(nextContent)
        }

        const addItem = async () => {
          const nextContent: ChecklistBlockContent =
            {
              items: [
                ...current.items,
                {
                  id: generateId(
                    'check',
                  ),
                  text: '',
                  checked: false,
                },
              ],
            }

          await save(nextContent)
        }

        const removeItem = async (
          id: string,
        ) => {
          const nextContent: ChecklistBlockContent =
            {
              items: current.items.filter(
                (item) =>
                  item.id !== id,
              ),
            }

          await save(nextContent)
        }

        return (
          <div className="space-y-2">
            {current.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="group/item flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={
                      item.checked
                    }
                    onChange={() =>
                      toggleItem(
                        item.id,
                      )
                    }
                    className="h-4 w-4 accent-[#0068FF]"
                  />

                  <input
                    type="text"
                    value={item.text}
                    placeholder="Việc cần làm..."
                    onChange={(
                      event,
                    ) =>
                      updateItemText(
                        item.id,
                        event.target
                          .value,
                      )
                    }
                    onBlur={
                      saveCurrent
                    }
                    className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                      item.checked
                        ? 'text-app-muted line-through'
                        : ''
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(
                        item.id,
                      )
                    }
                    className="rounded-md p-1 text-app-muted opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover/item:opacity-100"
                  >
                    <Trash2
                      size={14}
                    />
                  </button>
                </div>
              ),
            )}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-app-muted transition hover:bg-app-hover hover:text-general"
            >
              <Plus size={14} />
              Thêm mục
            </button>
          </div>
        )
      }

      case 'link': {
        const current =
          content as LinkBlockContent

        let safeUrl: string | null =
          null

        if (current.url.trim()) {
          try {
            const normalized =
              /^https?:\/\//i.test(
                current.url,
              )
                ? current.url
                : `https://${current.url}`

            const parsed =
              new URL(normalized)

            if (
              parsed.protocol ===
                'http:' ||
              parsed.protocol ===
                'https:'
            ) {
              safeUrl =
                parsed.toString()
            }
          } catch {
            safeUrl = null
          }
        }

        return (
          <div className="rounded-xl border border-app-border p-4">
            <input
              type="text"
              value={
                current.label
              }
              placeholder="Tên liên kết"
              onChange={(event) =>
                setContent({
                  ...current,
                  label:
                    event.target
                      .value,
                })
              }
              onBlur={saveCurrent}
              className="w-full bg-transparent text-sm font-medium outline-none"
            />

            <input
              type="text"
              value={current.url}
              placeholder="https://..."
              onChange={(event) =>
                setContent({
                  ...current,
                  url: event.target
                    .value,
                })
              }
              onBlur={saveCurrent}
              className="mt-2 w-full bg-transparent text-xs text-app-muted outline-none"
            />

            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-general hover:underline"
              >
                Mở liên kết
                <ExternalLink
                  size={13}
                />
              </a>
            )}
          </div>
        )
      }

      case 'table': {
        return (
          <TableBlockEditor
            content={content as TableBlockContent}
            onChange={save}
          />
        )
      }
    }
  }

  return (
    <div className="group relative rounded-xl border border-transparent px-3 py-3 transition hover:border-app-border">
      <div className="absolute right-2 top-2 z-10 flex items-center rounded-lg border border-app-border bg-white p-0.5 opacity-0 shadow-sm transition group-hover:opacity-100">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          title="Di chuyển lên"
          className="rounded-md p-1.5 text-app-muted hover:bg-app-hover disabled:opacity-30"
        >
          <ChevronUp size={15} />
        </button>

        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          title="Di chuyển xuống"
          className="rounded-md p-1.5 text-app-muted hover:bg-app-hover disabled:opacity-30"
        >
          <ChevronDown size={15} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          title="Xóa Block"
          className="rounded-md p-1.5 text-app-muted hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {renderContent()}
    </div>
  )
}

export default BlockEditor