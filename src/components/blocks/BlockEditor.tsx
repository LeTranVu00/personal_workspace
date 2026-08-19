import TableBlockEditor from './table/TableBlockEditor'
import RichTextEditor from './RichTextEditor'
import {
  useEffect,
  useState,
} from 'react'

import {
  ChevronDown,
  ChevronUp,
  Code,
  ExternalLink,
  FileText,
  Heading,
  Link,
  ListChecks,
  NotepadText,
  Plus,
  Quote,
  Table2,
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

// Block type icon map
const BLOCK_ICONS: Record<string, React.ElementType> = {
  text:      FileText,
  heading:   Heading,
  note:      NotepadText,
  quote:     Quote,
  code:      Code,
  checklist: ListChecks,
  link:      Link,
  table:     Table2,
}

const BLOCK_ICON_COLORS: Record<string, string> = {
  text:      'text-slate-400',
  heading:   'text-blue-400',
  note:      'text-amber-400',
  quote:     'text-violet-400',
  code:      'text-emerald-400',
  checklist: 'text-green-400',
  link:      'text-sky-400',
  table:     'text-indigo-400',
}

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

  const BlockIcon = BLOCK_ICONS[block.type] ?? FileText
  const blockIconColor = BLOCK_ICON_COLORS[block.type] ?? 'text-slate-400'

  const renderContent = () => {
    switch (block.type) {
      case 'heading': {
        const current =
          content as HeadingBlockContent

        return (
          <RichTextEditor
            content={current.text}
            placeholder="Tiêu đề..."
            onChange={(html) =>
              setContent({
                text: html,
              })
            }
            onBlur={saveCurrent}
            className="text-2xl font-bold leading-tight text-app-text"
          />
        )
      }

      case 'text': {
        const current =
          content as TextBlockContent

        return (
          <RichTextEditor
            content={current.text}
            placeholder="Nhập nội dung..."
            onChange={(html) =>
              setContent({
                text: html,
              })
            }
            onBlur={saveCurrent}
            className="text-sm leading-7 text-app-text"
          />
        )
      }

      case 'note': {
        const current =
          content as NoteBlockContent

        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <NotepadText size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">Ghi chú</span>
            </div>
            <RichTextEditor
              content={current.text}
              placeholder="Viết ghi chú..."
              onChange={(html) =>
                setContent({
                  text: html,
                })
              }
              onBlur={saveCurrent}
              className="text-sm leading-6 text-amber-900"
            />
          </div>
        )
      }

      case 'quote': {
        const current =
          content as QuoteBlockContent

        return (
          <div className="flex gap-3 rounded-r-xl border-l-4 border-violet-400 bg-violet-50/50 py-3 pl-4 pr-3">
            <div className="flex-1">
              <RichTextEditor
                content={current.text}
                placeholder="Nhập trích dẫn..."
                onChange={(html) =>
                  setContent({
                    text: html,
                  })
                }
                onBlur={saveCurrent}
                className="text-base italic text-violet-800"
              />
            </div>
            <Quote size={18} className="mt-0.5 shrink-0 text-violet-300" />
          </div>
        )
      }

      case 'code': {
        const current =
          content as CodeBlockContent

        return (
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 font-mono text-sm">
            {/* Language bar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
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
                className="w-28 bg-transparent text-xs text-emerald-400 outline-none"
                placeholder="language"
              />
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={current.code}
                placeholder="// Mã nguồn..."
                rows={5}
                onChange={(event) =>
                  setContent({
                    ...current,
                    code: event.target.value,
                  })
                }
                onBlur={saveCurrent}
                className="w-full resize-y bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
                spellCheck={false}
              />
            </div>
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

        const doneCount = current.items.filter(i => i.checked).length
        const total = current.items.length

        return (
          <div className="space-y-1">
            {/* Progress bar */}
            {total > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-surface">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(doneCount / total) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-app-muted">
                  {doneCount}/{total}
                </span>
              </div>
            )}

            {current.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="group/item flex items-center gap-2.5 rounded-lg px-1 py-1 transition hover:bg-app-hover"
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
                    className="h-4 w-4 shrink-0 accent-green-500"
                  />

                  <div className={`min-w-0 flex-1 ${item.checked ? 'text-app-muted line-through opacity-60' : ''}`}>
                    <RichTextEditor
                      content={item.text}
                      placeholder="Việc cần làm..."
                      onChange={(html) => updateItemText(item.id, html)}
                      onBlur={saveCurrent}
                      className="text-sm leading-6"
                    />
                  </div>

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
                      size={13}
                    />
                  </button>
                </div>
              ),
            )}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-app-muted transition hover:bg-app-hover hover:text-green-600"
            >
              <Plus size={13} />
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
          <div className="group/link overflow-hidden rounded-xl border border-app-border bg-white transition hover:border-sky-200 hover:shadow-sm">
            <div className="flex items-center gap-2 border-b border-app-border bg-app-surface/50 px-4 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100">
                <Link size={13} className="text-sky-500" />
              </div>
              <div className="min-w-0 flex-1">
                <RichTextEditor
                  content={current.label}
                  placeholder="Tên liên kết"
                  onChange={(html) => setContent({ ...current, label: html })}
                  onBlur={saveCurrent}
                  className="text-sm font-medium"
                />
              </div>
              {safeUrl && (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto shrink-0 rounded-lg p-1 text-sky-500 transition hover:bg-sky-50"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
            <div className="px-4 py-2.5">
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
                className="w-full bg-transparent text-xs text-app-muted outline-none"
              />
            </div>
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
    <div className="group/block relative rounded-xl px-3 py-2 transition">
      {/* Toolbar — above the block content */}
      <div className="mb-1.5 flex h-7 items-center justify-end gap-0.5 opacity-0 transition group-hover/block:opacity-100">
        <div className="flex items-center gap-0.5 rounded-lg border border-app-border bg-white p-0.5 shadow-sm">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Di chuyển lên"
            className="rounded-md p-1.5 text-app-muted transition hover:bg-app-hover disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            title="Di chuyển xuống"
            className="rounded-md p-1.5 text-app-muted transition hover:bg-app-hover disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>

          <div className="mx-0.5 h-4 w-px bg-app-border" />

          <button
            type="button"
            onClick={onDelete}
            title="Xóa Block"
            className="rounded-md p-1.5 text-app-muted transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Block type indicator — left side */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 opacity-0 transition group-hover/block:opacity-100">
          <BlockIcon size={14} className={blockIconColor} />
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

export default BlockEditor