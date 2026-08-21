import TableBlockEditor from './table/TableBlockEditor'
import RichTextEditor from './RichTextEditor'
import { useEffect, useState } from 'react'

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
import { useLanguage } from '../../hooks/useLanguage'

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
  text:      'bg-slate-50',
  heading:   'bg-blue-50',
  note:      'bg-amber-50',
  quote:     'bg-violet-50',
  code:      'bg-emerald-50',
  checklist: 'bg-green-50',
  link:      'bg-sky-50',
  table:     'bg-indigo-50',
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
  const { translate, t } = useLanguage()
  const [content, setContent] = useState<BlockContent>(block.content)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setContent(block.content)
  }, [block.id, block.content])

  const save = async (nextContent: BlockContent) => {
    setContent(nextContent)
    await blockRepository.updateContent(block.id, nextContent)
  }

  const saveCurrent = async () => {
    await blockRepository.updateContent(block.id, content)
  }

  const BlockIcon = BLOCK_ICONS[block.type] ?? FileText
  const blockIconColor = BLOCK_ICON_COLORS[block.type] ?? 'text-slate-500'
  const blockIconBg = BLOCK_ICON_BG[block.type] ?? 'bg-slate-50'

  const renderContent = () => {
    switch (block.type) {
      case 'heading': {
        const current = content as HeadingBlockContent

        return (
          <RichTextEditor
            content={current.text}
            placeholder={translate('Tiêu đề...')}
            onChange={(html) => setContent({ text: html })}
            onBlur={saveCurrent}
            onFocus={() => setIsFocused(true)}
            className="text-2xl font-bold leading-tight text-app-text"
          />
        )
      }

      case 'text': {
        const current = content as TextBlockContent

        return (
          <RichTextEditor
            content={current.text}
            placeholder={translate('Nhập nội dung...')}
            onChange={(html) => setContent({ text: html })}
            onBlur={saveCurrent}
            onFocus={() => setIsFocused(true)}
            className="text-sm leading-7 text-app-text"
          />
        )
      }

      case 'note': {
        const current = content as NoteBlockContent

        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100">
                <NotepadText size={13} className="text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-amber-700">
                {translate('Ghi chú')}
              </span>
            </div>
            <RichTextEditor
              content={current.text}
              placeholder={translate('Viết ghi chú...')}
              onChange={(html) => setContent({ text: html })}
              onBlur={saveCurrent}
              onFocus={() => setIsFocused(true)}
              className="text-sm leading-6 text-amber-900"
            />
          </div>
        )
      }

      case 'quote': {
        const current = content as QuoteBlockContent

        return (
          <div className="flex gap-3 rounded-r-xl border-l-4 border-violet-400 bg-violet-50/50 py-3 pl-4 pr-3">
            <div className="flex-1">
              <RichTextEditor
                content={current.text}
                placeholder={translate('Nhập trích dẫn...')}
                onChange={(html) => setContent({ text: html })}
                onBlur={saveCurrent}
                onFocus={() => setIsFocused(true)}
                className="text-base italic leading-7 text-violet-800"
              />
            </div>
            <Quote size={18} className="mt-0.5 shrink-0 text-violet-300" />
          </div>
        )
      }

      case 'code': {
        const current = content as CodeBlockContent

        return (
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 font-mono text-sm">
            {/* Language bar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Code size={12} className="text-emerald-400" />
                <input
                  type="text"
                  value={current.language}
                  onChange={(event) => setContent({ ...current, language: event.target.value })}
                  onBlur={saveCurrent}
                  className="w-28 bg-transparent text-xs font-medium text-emerald-400 outline-none placeholder:text-slate-600"
                  placeholder="language"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={current.code}
                placeholder={translate('// Mã nguồn...')}
                rows={5}
                onChange={(event) => setContent({ ...current, code: event.target.value })}
                onBlur={saveCurrent}
                onFocus={() => setIsFocused(true)}
                className="w-full resize-y bg-transparent text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
                spellCheck={false}
              />
            </div>
          </div>
        )
      }

      case 'checklist': {
        const current = content as ChecklistBlockContent

        const updateItemText = (id: string, text: string) => {
          setContent({
            items: current.items.map((item) =>
              item.id === id ? { ...item, text } : item,
            ),
          })
        }

        const toggleItem = async (id: string) => {
          const nextContent: ChecklistBlockContent = {
            items: current.items.map((item) =>
              item.id === id ? { ...item, checked: !item.checked } : item,
            ),
          }
          await save(nextContent)
        }

        const addItem = async () => {
          const nextContent: ChecklistBlockContent = {
            items: [
              ...current.items,
              { id: generateId('check'), text: '', checked: false },
            ],
          }
          await save(nextContent)
        }

        const removeItem = async (id: string) => {
          const nextContent: ChecklistBlockContent = {
            items: current.items.filter((item) => item.id !== id),
          }
          await save(nextContent)
        }

        const doneCount = current.items.filter(i => i.checked).length
        const total = current.items.length

        return (
          <div className="space-y-1">
            {/* Progress bar */}
            {total > 0 && (
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-surface">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(doneCount / total) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-app-muted">
                  {doneCount}/{total}
                </span>
              </div>
            )}

            {current.items.map((item) => (
              <div
                key={item.id}
                className="group/item flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-app-hover/50"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
                />

                <div className={`min-w-0 flex-1 ${item.checked ? 'text-app-muted line-through opacity-60' : ''}`}>
                  <RichTextEditor
                    content={item.text}
                    placeholder={translate('Việc cần làm...')}
                    onChange={(html) => updateItemText(item.id, html)}
                    onBlur={saveCurrent}
                    onFocus={() => setIsFocused(true)}
                    className="text-sm leading-6"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  title={t('common.delete')}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted opacity-100 transition-colors hover:bg-red-50 hover:text-red-500 md:opacity-0 md:group-hover/item:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-app-muted transition-colors hover:bg-emerald-50 hover:text-emerald-600"
            >
              <Plus size={13} />
              {t('common.addItem')}
            </button>
          </div>
        )
      }

      case 'link': {
        const current = content as LinkBlockContent

        let safeUrl: string | null = null

        if (current.url.trim()) {
          try {
            const normalized = /^https?:\/\//i.test(current.url)
              ? current.url
              : `https://${current.url}`
            const parsed = new URL(normalized)

            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
              safeUrl = parsed.toString()
            }
          } catch {
            safeUrl = null
          }
        }

        return (
          <div className="group/link overflow-hidden rounded-xl border border-app-border bg-white transition-all hover:border-sky-200 hover:shadow-sm">
            <div className="flex items-center gap-3 border-b border-app-border bg-app-surface/50 px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                <Link size={14} className="text-sky-500" />
              </div>
              <div className="min-w-0 flex-1">
                <RichTextEditor
                  content={current.label}
                  placeholder={translate('Tên liên kết')}
                  onChange={(html) => setContent({ ...current, label: html })}
                  onBlur={saveCurrent}
                  onFocus={() => setIsFocused(true)}
                  className="text-sm font-medium text-app-text"
                />
              </div>
              {safeUrl && (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={t('common.open')}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sky-500 transition-colors hover:bg-sky-50"
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
                onChange={(event) => setContent({ ...current, url: event.target.value })}
                onBlur={saveCurrent}
                onFocus={() => setIsFocused(true)}
                className="w-full bg-transparent text-xs text-app-muted outline-none placeholder:text-app-muted-2"
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
    <div 
      className={`group/block relative rounded-xl px-3 py-2 transition-all ${
        isFocused ? 'bg-primary/5' : 'hover:bg-app-hover/30'
      }`}
      onBlur={() => setIsFocused(false)}
    >
      {/* Toolbar — Floating on hover */}
      <div className="mb-1.5 flex h-7 items-center justify-end gap-0.5 opacity-100 md:opacity-0 transition-opacity md:group-hover/block:opacity-100">
        <div className="flex items-center gap-0.5 rounded-lg border border-app-border bg-white p-0.5 shadow-sm">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            title={translate('Di chuyển lên')}
            className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            title={translate('Di chuyển xuống')}
            className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>

          <div className="mx-0.5 h-4 w-px bg-app-border" />

          <button
            type="button"
            onClick={onDelete}
            title={translate('Xóa Block')}
            className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="relative flex gap-3">
        {/* Block type indicator — Left side */}
        <div className="mt-1 shrink-0 opacity-100 md:opacity-0 transition-opacity md:group-hover/block:opacity-100">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${blockIconBg}`}>
            <BlockIcon size={14} className={blockIconColor} />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default BlockEditor