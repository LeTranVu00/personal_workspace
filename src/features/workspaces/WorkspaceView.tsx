import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PageEditor from '../pages/PageEditor'

import {
  Activity,
  AlertCircle,
  CalendarDays,
  CalendarClock,
  CheckSquare,
  FileText,
  FolderOpen,
  ListTodo,
  Search,
  X,
  LayoutGrid,
  KanbanSquare,
} from 'lucide-react'

import { pageRepository } from '../../db/repositories/pageRepository'

import { db } from '../../db/database'

import type { Workspace } from '../../types/workspace'
import type { Page as WorkspacePage } from '../../types/page'
import { useLanguage } from '../../hooks/useLanguage'

interface WorkspaceViewProps {
  workspace: Workspace
  activePage: WorkspacePage | null
  onSelectPage?: (pageId: string) => void
}

function WorkspaceView({
  workspace,
  activePage,
  onSelectPage,
}: WorkspaceViewProps) {
  const { t } = useLanguage()
  const pages =
    useLiveQuery<WorkspacePage[]>(
      () =>
        db.pages
          .where('workspaceId')
          .equals(workspace.id)
          .sortBy('updatedAt')
          .then((items) => [...items].reverse()),
      [workspace.id],
    ) ?? []

  const [viewMode, setViewMode] = useState<'overview' | 'kanban'>('overview')
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const matchingPages = normalizedQuery
    ? pages.filter((page) => {
        const searchableText = [
          page.title,
          page.type,
          page.status,
          page.priority,
          ...(page.tags ?? []),
        ]
          .join(' ')
          .toLowerCase()

        return searchableText.includes(normalizedQuery)
      })
    : pages

  const totalPages = pages.length
  const taskPages = pages.filter((page) => page.type === 'task')
  const activeTasks = taskPages.filter((page) => page.status !== 'done' && page.status !== 'archived').length
  const completedTaskCount = taskPages.filter((page) => page.status === 'done').length
  const completionRate = taskPages.length > 0
    ? Math.round((completedTaskCount / taskPages.length) * 100)
    : 0
  const scheduledTasks = taskPages.filter((page) => page.dueDate !== undefined && page.status !== 'archived').length
  const doingTasks = taskPages.filter((page) => page.status === 'doing').length
  const doneTasks = pages.filter((page) => page.status === 'done').length
  const notesCount = pages.filter((page) => page.type === 'note').length
  const overdueTasks = pages.filter(
    (page) =>
      page.type === 'task' &&
      page.status !== 'done' &&
      page.status !== 'archived' &&
      page.dueDate !== undefined &&
      page.dueDate < Date.now(),
  ).length
  const recentPages = matchingPages.slice(0, 5)
  const pinnedPages = [...matchingPages]
    .filter((page) => page.pinned)
    .slice(0, 3)
  const focusTasks = [...matchingPages]
    .filter((page) => page.type === 'task' && (page.status === 'active' || page.status === 'doing'))
    .sort((a, b) => {
      const dueDateDelta = (a.dueDate ?? Number.MAX_SAFE_INTEGER) - (b.dueDate ?? Number.MAX_SAFE_INTEGER)

      if (dueDateDelta !== 0) {
        return dueDateDelta
      }

      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const priorityDelta = (priorityOrder[b.priority ?? 'normal'] ?? 0) - (priorityOrder[a.priority ?? 'normal'] ?? 0)

      if (priorityDelta !== 0) {
        return priorityDelta
      }

      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    })
    .slice(0, 4)
  const topTags = Array.from(
    new Set(pages.flatMap((page) => page.tags ?? [])),
  )
    .slice(0, 5)

  const kanbanColumns = [
    { key: 'doing', label: t('overview.doing') },
    { key: 'active', label: t('overview.active') },
    { key: 'done', label: t('overview.done') },
  ] as const

  const updateStatus = async (pageId: string, status: 'active' | 'doing' | 'done') => {
    await pageRepository.update(pageId, { status })
  }

  const handleDropToColumn = async (status: 'active' | 'doing' | 'done') => {
    if (!draggedPageId) {
      return
    }

    await updateStatus(draggedPageId, status)
    setDraggedPageId(null)
  }

  return (
    <section className="min-w-0 flex-1 overflow-y-auto bg-app-bg custom-scrollbar">
      {activePage ? (
        <PageEditor
          key={activePage.id}
          page={activePage}
          onSelectPage={onSelectPage}
        />
      ) : (
        <div className="flex h-full min-h-125 justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-6xl">
            {/* Search Bar - Minimalist */}
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-app-border bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Search size={15} className="shrink-0 text-app-muted" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('search.workspace')}
                className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
                  title={t('common.clear')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4 border-b border-app-border pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                  {t('overview.label')}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-app-text">
                  {workspace.name}
                </h2>
              </div>

              {/* View Toggle */}
              <div className="flex w-full items-center gap-1 rounded-lg border border-app-border bg-white p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('overview')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all sm:flex-none ${
                    viewMode === 'overview'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  <LayoutGrid size={14} />
                  {t('overview.overview')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all sm:flex-none ${
                    viewMode === 'kanban'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                  }`}
                >
                  <KanbanSquare size={14} />
                  {t('overview.kanban')}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {normalizedQuery && (
              <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-app-text">
                    {t('search.results')}
                  </h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                    {matchingPages.length} {t('common.items')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchingPages.length === 0 && (
                    <span className="text-xs text-app-muted">{t('search.noResults')}</span>
                  )}
                  {matchingPages.slice(0, 6).map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => onSelectPage?.(page.id)}
                      className="rounded-full border border-app-border bg-white px-3 py-1.5 text-xs text-app-text transition-all hover:border-primary hover:text-primary"
                    >
                      {page.title || t('page.untitled')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'overview' && (
              <>
                {/* Stats Grid - Flat Design */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <FileText size={16} className="text-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        {t('overview.items')}
                      </span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-app-text">{totalPages}</div>
                    <p className="mt-1 text-[11px] text-app-muted">{t('overview.totalPages')}</p>
                  </div>

                  <div className="rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <CheckSquare size={16} className="text-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        {t('overview.tasks')}
                      </span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-app-text">{activeTasks}</div>
                    <p className="mt-1 text-[11px] text-app-muted">{t('overview.inProgress')}</p>
                  </div>

                  <div className="rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <ListTodo size={16} className="text-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        {t('overview.done')}
                      </span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-app-text">{doneTasks}</div>
                    <p className="mt-1 text-[11px] text-app-muted">{t('overview.completed')}</p>
                  </div>

                  <div className="rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <FolderOpen size={16} className="text-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        {t('overview.notes')}
                      </span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-app-text">{notesCount}</div>
                    <p className="mt-1 text-[11px] text-app-muted">{t('overview.notes')}</p>
                  </div>

                  <div className="rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <AlertCircle size={16} className="text-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        {t('overview.overdue')}
                      </span>
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-app-text">{overdueTasks}</div>
                    <p className="mt-1 text-[11px] text-app-muted">{t('overview.overdue')}</p>
                  </div>
                </div>

                {/* Workflow Health - Clean Section */}
                <div className="mt-4 rounded-xl border border-app-border bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-app-text">
                        {t('overview.workflowHealth')}
                      </h3>
                      <p className="mt-1 text-[11px] text-app-muted">
                        {t('overview.workflowDescription')}
                      </p>
                    </div>
                    <Activity size={18} className="text-primary" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.85fr_0.85fr]">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-app-muted">{t('overview.taskCompletion')}</span>
                        <span className="font-semibold text-app-text">{completionRate}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-app-surface">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-app-muted">
                        {completedTaskCount} / {taskPages.length} {t('overview.completedTasks')}
                      </p>
                    </div>

                    <div className="rounded-lg bg-app-surface/50 px-3.5 py-3">
                      <div className="flex items-center gap-2 text-app-muted">
                        <CalendarClock size={14} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          {t('overview.scheduled')}
                        </span>
                      </div>
                      <div className="mt-2 text-xl font-semibold text-app-text">{scheduledTasks}</div>
                      <p className="mt-0.5 text-[10px] text-app-muted">
                        {t('overview.scheduledDescription')}
                      </p>
                    </div>

                    <div className="rounded-lg bg-app-surface/50 px-3.5 py-3">
                      <div className="flex items-center gap-2 text-app-muted">
                        <CheckSquare size={14} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          {t('overview.inProgress')}
                        </span>
                      </div>
                      <div className="mt-2 text-xl font-semibold text-app-text">{doingTasks}</div>
                      <p className="mt-0.5 text-[10px] text-app-muted">
                        {t('overview.doingDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="space-y-4">
                    {/* Pinned Pages */}
                    <div className="rounded-xl border border-app-border bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-app-text">
                          {t('overview.pinnedFocus')}
                        </h3>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                          {t('overview.priority')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {pinnedPages.length === 0 && (
                          <div className="rounded-lg border border-dashed border-app-border bg-app-surface/30 p-4 text-center text-xs text-app-muted">
                            {t('overview.noPinned')}
                          </div>
                        )}

                        {pinnedPages.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => onSelectPage?.(page.id)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-app-border px-3.5 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-app-text">
                                {page.title || t('page.untitled')}
                              </div>
                              <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                                {page.type ?? 'note'}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                              {t('common.pinned')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Today Focus */}
                    <div className="rounded-xl border border-app-border bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-app-text">
                          {t('overview.todayFocus')}
                        </h3>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                          {t('overview.priority')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {focusTasks.length === 0 && (
                          <div className="rounded-lg border border-dashed border-app-border bg-app-surface/30 p-4 text-center text-xs text-app-muted">
                            {t('overview.noFocus')}
                          </div>
                        )}

                        {focusTasks.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => onSelectPage?.(page.id)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-app-border px-3.5 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-app-text">
                                {page.title || t('page.untitled')}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                                <span className={page.priority === 'high' ? 'text-red-500' : ''}>
                                  {page.priority ?? 'normal'}
                                </span>
                                <span>•</span>
                                <span>{page.status ?? 'active'}</span>
                                {page.dueDate && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <CalendarDays size={10} />
                                      {new Date(page.dueDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                              page.priority === 'high'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {page.priority === 'high' ? t('overview.urgent') : t('overview.next')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Pages */}
                    <div className="rounded-xl border border-app-border bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-app-text">
                          {t('overview.recentItems')}
                        </h3>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                          {t('overview.latest')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {recentPages.length === 0 && (
                          <div className="rounded-lg border border-dashed border-app-border bg-app-surface/30 p-4 text-center text-xs text-app-muted">
                            {t('overview.noPages')}
                          </div>
                        )}

                        {recentPages.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => onSelectPage?.(page.id)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-app-border px-3.5 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-app-text">
                                {page.title || t('page.untitled')}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                                <span>{page.type ?? 'note'}</span>
                                <span>•</span>
                                <span>{page.status ?? 'active'}</span>
                              </div>
                            </div>

                            <span className="shrink-0 rounded-full border border-app-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-app-muted">
                              {page.tags?.[0] ?? t('overview.general')}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Tags */}
                  <div className="h-fit rounded-xl border border-app-border bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-app-text">
                        {t('overview.quickTags')}
                      </h3>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        {t('overview.focus')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {topTags.length === 0 && (
                        <span className="text-xs text-app-muted">{t('overview.noTags')}</span>
                      )}

                      {topTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-primary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {viewMode === 'kanban' && (
              <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div className="grid min-w-175 grid-cols-3 gap-4">
                  {kanbanColumns.map((column) => {
                    const columnItems = matchingPages.filter(
                      (page) => page.type === 'task' && (page.status ?? 'active') === column.key,
                    )

                    return (
                      <div
                        key={column.key}
                        className="rounded-xl border border-app-border bg-white p-4"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDropToColumn(column.key)}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-app-text">
                            {column.label}
                          </h3>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                            {columnItems.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {columnItems.length === 0 && (
                            <div className="rounded-lg border border-dashed border-app-border bg-app-surface/30 p-4 text-center text-xs text-app-muted">
                              {t('overview.noWork')}
                            </div>
                          )}

                          {columnItems.map((page) => (
                            <div
                              key={page.id}
                              draggable
                              onDragStart={() => setDraggedPageId(page.id)}
                              onDragEnd={() => setDraggedPageId(null)}
                              className="cursor-move rounded-lg border border-app-border bg-app-surface/50 p-3.5 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => onSelectPage?.(page.id)}
                                className="block w-full text-left"
                              >
                                <div className="text-sm font-medium text-app-text">
                                  {page.title || t('page.untitled')}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-app-muted">
                                  <span className={page.priority === 'high' ? 'text-red-500' : ''}>
                                    {page.priority ?? 'normal'}
                                  </span>
                                  <span>{page.tags?.[0] ?? t('overview.general')}</span>
                                </div>
                              </button>

                              <div className="mt-3 flex gap-1">
                                {kanbanColumns
                                  .filter((item) => item.key !== column.key)
                                  .map((item) => (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => updateStatus(page.id, item.key)}
                                      className="flex-1 rounded-md border border-app-border bg-white px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-app-muted transition-all hover:border-primary hover:text-primary"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default WorkspaceView