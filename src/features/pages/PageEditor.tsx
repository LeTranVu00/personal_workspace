import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  Archive,
  CalendarDays,
  FileText,
  Link2,
  LayoutTemplate,
  Pin,
  PinOff,
  Unlink2,
  ChevronDown,
  Plus,
} from 'lucide-react'

import type { Page, PageRecurrence } from '../../types/page'
import type { Block } from '../../types/block'
import type { BlockType } from '../../content/contentRegistry'

import { db } from '../../db/database'
import { blockRepository } from '../../db/repositories/blockRepository'
import { pageRepository } from '../../db/repositories/pageRepository'

import BlockPicker from '../../components/blocks/BlockPicker'
import BlockEditor from '../../components/blocks/BlockEditor'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RichTextEditor from '../../components/blocks/RichTextEditor'
import { useLanguage } from '../../hooks/useLanguage'

interface PageEditorProps {
  page: Page
  onSelectPage?: (pageId: string) => void
}

function PageEditor({ page, onSelectPage }: PageEditorProps) {
  const blocks =
    useLiveQuery(
      () => db.blocks.where('pageId').equals(page.id).sortBy('order'),
      [page.id],
    ) ?? []

  const workspacePages =
    useLiveQuery(
      () => db.pages.where('workspaceId').equals(page.workspaceId).sortBy('updatedAt'),
      [page.workspaceId],
    ) ?? []

  const [blockToDelete, setBlockToDelete] = useState<Block | null>(null)
  const [localTitle, setLocalTitle] = useState(page.title)
  const [localDueDate, setLocalDueDate] = useState(() =>
    page.dueDate ? new Date(page.dueDate).toISOString().slice(0, 10) : '',
  )
  const [showMetadata, setShowMetadata] = useState(false)
  const { t, translate } = useLanguage()

  const pageType = page.type ?? 'note'
  const pageStatus = page.status ?? 'active'
  const pageTags = page.tags ?? []
  const relatedPages = workspacePages.filter((item) =>
    (page.relatedPageIds ?? []).includes(item.id),
  )
  const availableRelatedPages = workspacePages.filter(
    (item) => item.id !== page.id && !(page.relatedPageIds ?? []).includes(item.id),
  )

  // Sync local title if page title changes externally
  useEffect(() => {
    setLocalTitle(page.title)
  }, [page.title])

  useEffect(() => {
    setLocalDueDate(page.dueDate ? new Date(page.dueDate).toISOString().slice(0, 10) : '')
  }, [page.dueDate])

  const handleUpdateTitle = async () => {
    const nextTitle = localTitle.replace(/<[^>]+>/g, '').trim() || 'Trang không có tiêu đề'
    if (nextTitle !== page.title) {
      await pageRepository.update(page.id, { title: nextTitle })
    }
  }

  const handleTogglePinned = async () => {
    await pageRepository.update(page.id, {
      pinned: !(page.pinned ?? false),
    })
  }

  const handleDueDateChange = async (value: string) => {
    setLocalDueDate(value)
    await pageRepository.update(page.id, {
      dueDate: value ? new Date(`${value}T23:59:59`).getTime() : null,
    })
  }

  const handleToggleArchived = async () => {
    await pageRepository.update(page.id, {
      status: pageStatus === 'archived' ? 'active' : 'archived',
    })
  }

  const handleRelationChange = async (relatedPageId: string) => {
    if (!relatedPageId) return
    await pageRepository.setRelation(page.id, relatedPageId, true)
  }

  const handleRemoveRelation = async (relatedPageId: string) => {
    await pageRepository.setRelation(page.id, relatedPageId, false)
  }

  const handleQuickStatusUpdate = async (nextStatus: 'active' | 'doing' | 'done') => {
    if (nextStatus === 'done') {
      await pageRepository.complete(page.id)
      return
    }
    await pageRepository.update(page.id, { status: nextStatus })
  }

  const handleRecurrenceChange = async (value: string) => {
    await pageRepository.update(page.id, {
      recurrence: (value || null) as PageRecurrence | null,
    })
  }

  const handleCreateBlock = async (type: BlockType, afterBlockId?: string | null) => {
    await blockRepository.create(page.id, type, afterBlockId)
  }

  const handleDeleteBlock = async () => {
    if (!blockToDelete) return
    await blockRepository.remove(blockToDelete.id)
  }

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-10 relative">
          
          {/* Page Header - Minimalist */}
          <div className="group/header relative mb-8">
            {/* Metadata Bar - Collapsible */}
            <div className="mb-5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowMetadata(!showMetadata)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
              >
                <FileText size={13} />
                <span className="font-medium uppercase tracking-wider">{pageType}</span>
                <ChevronDown size={12} className={`transition-transform ${showMetadata ? 'rotate-180' : ''}`} />
              </button>

              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                pageStatus === 'done' 
                  ? 'bg-emerald-50 text-emerald-600'
                  : pageStatus === 'doing'
                  ? 'bg-blue-50 text-blue-600'
                  : pageStatus === 'archived'
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-primary/10 text-primary'
              }`}>
                {pageStatus}
              </span>

              {page.pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-600">
                  <Pin size={10} />
                  {t('page.pinned')}
                </span>
              )}

              {page.dueDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-app-surface px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                  <CalendarDays size={10} />
                  {new Date(page.dueDate).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            {/* Expandable Metadata Panel */}
            {showMetadata && (
              <div className="animate-slide-down mb-6 rounded-xl border border-app-border bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Quick Actions */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="app-form-label mb-2">{t('page.quickActions')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate('doing')}
                        className={`app-secondary-action px-3 py-1.5 text-xs ${
                          pageStatus === 'doing' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''
                        }`}
                      >
                        {t('page.start')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate('done')}
                        className={`app-secondary-action px-3 py-1.5 text-xs ${
                          pageStatus === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''
                        }`}
                      >
                        {t('page.done')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate('active')}
                        className={`app-secondary-action px-3 py-1.5 text-xs ${
                          pageStatus === 'active' ? 'bg-primary/10 text-primary border-primary/20' : ''
                        }`}
                      >
                        {t('page.active')}
                      </button>
                      <button
                        type="button"
                        onClick={handleTogglePinned}
                        className={`app-secondary-action px-3 py-1.5 text-xs ${
                          page.pinned ? 'bg-amber-50 text-amber-600 border-amber-200' : ''
                        }`}
                      >
                        {page.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                        {page.pinned ? t('page.unpin') : t('page.pin')}
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleArchived}
                        className={`app-secondary-action px-3 py-1.5 text-xs ${
                          pageStatus === 'archived' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''
                        }`}
                      >
                        <Archive size={12} />
                        {pageStatus === 'archived' ? t('page.restore') : t('page.archive')}
                      </button>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="app-form-label mb-2 flex items-center gap-1.5">
                      <CalendarDays size={12} />
                      {t('page.deadline')}
                    </label>
                    <input
                      type="date"
                      value={localDueDate}
                      onChange={(event) => void handleDueDateChange(event.target.value)}
                      className="app-form-input"
                    />
                  </div>

                  {/* Recurrence */}
                  <div>
                    <label className="app-form-label mb-2">{translate('Lặp lại')}</label>
                    <select
                      value={page.recurrence ?? ''}
                      onChange={(event) => void handleRecurrenceChange(event.target.value)}
                      className="app-form-select"
                    >
                      <option value="">{translate('Không lặp')}</option>
                      <option value="daily">{translate('Mỗi ngày')}</option>
                      <option value="weekly">{translate('Mỗi tuần')}</option>
                      <option value="monthly">{translate('Mỗi tháng')}</option>
                    </select>
                  </div>

                  {/* Tags */}
                  {pageTags.length > 0 && (
                    <div>
                      <label className="app-form-label mb-2">{t('page.tags')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {pageTags.slice(0, 5).map((tag) => (
                          <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Title - Large & Focused */}
            <RichTextEditor
              content={localTitle}
              placeholder={t('page.untitled')}
              onChange={(html) => setLocalTitle(html)}
              onBlur={handleUpdateTitle}
              className="w-full bg-transparent text-3xl md:text-4xl font-bold tracking-tight text-app-text outline-none placeholder:text-app-muted/30"
            />
          </div>

          {/* Related Pages - Collapsible Section */}
          <div className="mb-8">
            <details className="group rounded-xl border border-app-border bg-white">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 transition-colors hover:bg-app-hover/50">
                <Link2 size={14} className="text-primary" />
                <h2 className="text-sm font-semibold text-app-text">{t('page.related')}</h2>
                <span className="rounded-full bg-app-surface px-2 py-0.5 text-[10px] font-medium text-app-muted">
                  {relatedPages.length}
                </span>
                <ChevronDown size={14} className="ml-auto text-app-muted transition-transform group-open:rotate-180" />
              </summary>

              <div className="border-t border-app-border p-3">
                <div className="space-y-1.5">
                  {relatedPages.map((relatedPage) => (
                    <div
                      key={relatedPage.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-app-hover/50"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectPage?.(relatedPage.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-medium text-app-text">
                          {relatedPage.title || t('page.noTitle')}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                          {relatedPage.type ?? 'note'}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemoveRelation(relatedPage.id)}
                        title={t('page.removeRelation')}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Unlink2 size={13} />
                      </button>
                    </div>
                  ))}

                  {availableRelatedPages.length > 0 && (
                    <div className="relative mt-2">
                      <select
                        value=""
                        onChange={(event) => void handleRelationChange(event.target.value)}
                        className="app-form-select"
                      >
                        <option value="">+ {t('page.addRelation')}</option>
                        {availableRelatedPages.map((availablePage) => (
                          <option key={availablePage.id} value={availablePage.id}>
                            {availablePage.title || t('page.untitled')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {relatedPages.length === 0 && availableRelatedPages.length === 0 && (
                    <p className="px-3 py-2 text-xs text-app-muted">
                      {t('page.noRelatedPages')}
                    </p>
                  )}
                </div>
              </div>
            </details>
          </div>

          {/* Blocks Section */}
          <div>
            {blocks.length === 0 && (
              <div className="mb-6 rounded-xl border border-dashed border-app-border bg-app-surface/30 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm">
                  <LayoutTemplate size={24} strokeWidth={1.5} className="text-primary" />
                </div>
                <p className="mt-4 text-sm font-semibold text-app-text">
                  {t('page.emptyContent')}
                </p>
                <p className="mt-1 text-xs text-app-muted">
                  {t('page.addFirstBlock')}
                </p>
              </div>
            )}

            <div className="relative">
              {/* Insert Top */}
              {blocks.length > 0 && (
                <div className="group/insert absolute -top-2 left-0 z-10 flex h-4 w-full -translate-y-1/2 items-center justify-center opacity-100 md:opacity-0 transition-opacity md:hover:opacity-100">
                  <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-primary/20 opacity-100 md:opacity-0 transition-opacity md:group-hover/insert:opacity-100" />
                  <div className="relative">
                    <BlockPicker variant="compact" onSelect={(type) => handleCreateBlock(type, null)} />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <div key={block.id} className="relative">
                    <BlockEditor
                      block={block}
                      isFirst={index === 0}
                      isLast={index === blocks.length - 1}
                      onMoveUp={() => blockRepository.move(page.id, block.id, 'up')}
                      onMoveDown={() => blockRepository.move(page.id, block.id, 'down')}
                      onDelete={() => setBlockToDelete(block)}
                    />
                    
                    {/* Insert After */}
                    <div className="group/insert absolute -bottom-1 left-0 z-10 flex h-4 w-full translate-y-1/2 items-center justify-center opacity-100 md:opacity-0 transition-opacity md:hover:opacity-100">
                      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-primary/20 opacity-100 md:opacity-0 transition-opacity md:group-hover/insert:opacity-100" />
                      <div className="relative">
                        <BlockPicker variant="compact" onSelect={(type) => handleCreateBlock(type, block.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Block Controls */}
            <div className="mt-6 flex items-center gap-2">
              <BlockPicker onSelect={handleCreateBlock} />

              {blocks.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCreateBlock('text')}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
                >
                  <Plus size={13} />
                  {t('page.quickAddText')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={blockToDelete !== null}
        title={t('page.deleteBlock')}
        description={t('page.deleteBlockDescription')}
        onClose={() => setBlockToDelete(null)}
        onConfirm={handleDeleteBlock}
      />
    </>
  )
}

export default PageEditor