import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Archive,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Filter,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Square,
  Trash2,
  X,
} from 'lucide-react'

import { db } from '../../db/database'
import { categoryRepository } from '../../db/repositories/categoryRepository'
import { pageRepository } from '../../db/repositories/pageRepository'
import { pageTemplates, type PageTemplateKey } from '../../constants/pageTemplates'
import { workflowTemplates, type WorkflowTemplateKey } from '../../constants/workflowTemplates'

import NameModal from '../common/NameModal'
import ConfirmDialog from '../common/ConfirmDialog'
import BackupModal from '../common/BackupModal'
import { useLanguage } from '../../hooks/useLanguage'

import type { Workspace } from '../../types/workspace'
import type { Category } from '../../types/category'
import type { Page as WorkspacePage, PagePriority, PageStatus } from '../../types/page'

interface SidebarProps {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  activePageId: string | null

  onSelectWorkspace: (workspace: Workspace) => void
  onCreateWorkspace: () => void
  onEditWorkspace: (workspace: Workspace) => void
  onDeleteWorkspace: (workspace: Workspace) => void
  onSelectPage: (pageId: string) => void
  isOpen?: boolean
  onClose?: () => void
}

// Generates a consistent hue from a string
function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

function stripHtml(html: string) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').trim()
}

function WorkspaceAvatar({ name }: { name: string }) {
  const hue = stringToHue(name)
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white shadow-sm"
      style={{ background: `hsl(${hue}, 65%, 45%)` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Sidebar({
  workspaces,
  activeWorkspaceId,
  activePageId,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  onSelectPage,
  isOpen,
  onClose,
}: SidebarProps) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [collapsedCategories, setCollapsedCategories] =
    useState<Record<string, boolean>>(() => {
      const stored = localStorage.getItem('collapsedCategories')
      return stored ? JSON.parse(stored) : {}
    })

  useEffect(() => {
    localStorage.setItem('collapsedCategories', JSON.stringify(collapsedCategories))
  }, [collapsedCategories])

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const categories =
    useLiveQuery<Category[]>(
      () =>
        activeWorkspaceId
          ? db.categories
              .where('workspaceId')
              .equals(activeWorkspaceId)
              .sortBy('order')
          : Promise.resolve([]),
      [activeWorkspaceId],
    ) ?? []

  const pages =
    useLiveQuery<WorkspacePage[]>(
      () =>
        activeWorkspaceId
          ? db.pages
              .where('workspaceId')
              .equals(activeWorkspaceId)
              .sortBy('order')
          : Promise.resolve([]),
      [activeWorkspaceId],
    ) ?? []

  const [categoryModal, setCategoryModal] =
    useState<{
      mode: 'create' | 'edit'
      category?: Category
    } | null>(null)

  const [pageModal, setPageModal] =
    useState<{
      mode: 'create' | 'edit'
      categoryId?: string
      page?: WorkspacePage
      templateKey?: PageTemplateKey
      workflowKey?: WorkflowTemplateKey
    } | null>(null)

  const [pageStatusFilter, setPageStatusFilter] =
    useState<'all' | PageStatus>('all')
  const [pagePriorityFilter, setPagePriorityFilter] =
    useState<'all' | PagePriority>('all')
  const [pageTagFilter, setPageTagFilter] = useState<string>('all')
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [backupModalOpen, setBackupModalOpen] = useState(false)

  const [categoryToDelete, setCategoryToDelete] =
    useState<Category | null>(null)

  const [pageToDelete, setPageToDelete] =
    useState<WorkspacePage | null>(null)

  const handleCategorySubmit = async (name: string) => {
    if (categoryModal?.mode === 'edit') {
      if (!categoryModal.category) return
      await categoryRepository.update(categoryModal.category.id, name)
      return
    }
    if (!activeWorkspaceId) return
    await categoryRepository.create(activeWorkspaceId, name)
  }

  const handlePageSubmit = async (title: string) => {
    if (pageModal?.mode === 'edit') {
      if (!pageModal.page) return
      await pageRepository.update(pageModal.page.id, { title })
      return
    }
    if (!pageModal?.categoryId || !activeWorkspaceId) return

    if (pageModal.workflowKey) {
      const workflow = workflowTemplates.find((item) => item.key === pageModal.workflowKey)
      if (!workflow) return

      const createdPages = []
      for (const step of workflow.steps) {
        createdPages.push(await pageRepository.create(
          activeWorkspaceId,
          pageModal.categoryId,
          `${title} - ${step}`,
          { type: 'task', status: 'active', priority: 'normal', tags: [workflow.key, 'workflow'] },
        ))
      }
      for (let index = 1; index < createdPages.length; index += 1) {
        await pageRepository.setRelation(createdPages[index - 1].id, createdPages[index].id, true)
      }
      if (createdPages[0]) onSelectPage(createdPages[0].id)
      return
    }

    const template =
      pageTemplates.find((item) => item.key === pageModal.templateKey) ?? pageTemplates[0]

    const page = await pageRepository.create(
      activeWorkspaceId,
      pageModal.categoryId,
      title,
      {
        type: template.type,
        status: template.status,
        priority: template.priority,
        tags: template.defaultTags,
      },
    )
    onSelectPage(page.id)
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    const pageBelongsToCategory = pages.some(
      (p) => p.id === activePageId && p.categoryId === categoryToDelete.id,
    )
    await categoryRepository.remove(categoryToDelete.id)
    if (pageBelongsToCategory) onSelectPage('')
  }

  const handleDeletePage = async () => {
    if (!pageToDelete) return
    await pageRepository.remove(pageToDelete.id)
    if (activePageId === pageToDelete.id) onSelectPage('')
  }

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase()),
  )

  const allTags = Array.from(
    new Set(
      pages.flatMap((page) => page.tags ?? []),
    ),
  ).sort((a, b) => a.localeCompare(b))

  const sortedPages = [...pages].sort((a, b) => {
    if ((b.pinned ?? false) !== (a.pinned ?? false)) {
      return Number(b.pinned ?? false) - Number(a.pinned ?? false)
    }
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
  })

  const filteredPages = sortedPages.filter((page) => {
    const matchesStatus =
      pageStatusFilter === 'all' || page.status === pageStatusFilter
    const matchesPriority =
      pagePriorityFilter === 'all' || page.priority === pagePriorityFilter
    const matchesTag =
      pageTagFilter === 'all' || (page.tags ?? []).includes(pageTagFilter)

    return matchesStatus && matchesPriority && matchesTag
  })

  const activeWorkspace =
    workspaces.find((ws) => ws.id === activeWorkspaceId) ?? null

  const handleTogglePinned = async (page: WorkspacePage) => {
    await pageRepository.update(page.id, {
      pinned: !(page.pinned ?? false),
    })
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds((current) =>
      current.includes(pageId)
        ? current.filter((id) => id !== pageId)
        : [...current, pageId],
    )
  }

  const handleBulkArchive = async () => {
    const selectedPages = pages.filter((page) => selectedPageIds.includes(page.id))
    const shouldArchive = selectedPages.some((page) => page.status !== 'archived')

    await Promise.all(
      selectedPages.map((page) =>
        pageRepository.update(page.id, {
          status: shouldArchive ? 'archived' : 'active',
        }),
      ),
    )
    setSelectedPageIds([])
  }

  const handleBulkPin = async () => {
    const selectedPages = pages.filter((page) => selectedPageIds.includes(page.id))
    const shouldPin = selectedPages.some((page) => !page.pinned)

    await Promise.all(
      selectedPages.map((page) => pageRepository.update(page.id, { pinned: shouldPin })),
    )
    setSelectedPageIds([])
  }

  const handleBulkMove = async (categoryId: string) => {
    if (!categoryId) return
    await pageRepository.moveToCategory(selectedPageIds, categoryId)
    setSelectedPageIds([])
  }

  const handleBulkDelete = async () => {
    await Promise.all(selectedPageIds.map((pageId) => pageRepository.remove(pageId)))
    if (activePageId && selectedPageIds.includes(activePageId)) onSelectPage('')
    setSelectedPageIds([])
  }

  // Close menu on outside click
  const handleBackdropClick = () => {
    if (openMenuId) setOpenMenuId(null)
  }

  const hasActiveFilters = pageStatusFilter !== 'all' || pagePriorityFilter !== 'all' || pageTagFilter !== 'all'

  return (
    <>
      {/* Menu Backdrop */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-30"
          onClick={handleBackdropClick}
        />
      )}

      {/* Mobile Sidebar Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-app-border bg-white transition-transform duration-200 ease-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ─── Header ─── */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-app-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm">
            W
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-app-text">
              Personal Workspace
            </h1>
            <p className="text-[11px] text-app-muted">{t('app.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-muted transition-colors hover:bg-app-hover hover:text-app-text md:hidden"
            title={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Search ─── */}
        <div className="px-3 pt-3">
          <div className="group flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
            <Search size={14} className="shrink-0 text-app-muted transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('workspace.search')}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-app-muted"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded p-0.5 text-app-muted transition-colors hover:text-app-text"
                title={t('common.clear')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ─── Workspace Section ─── */}
        <div className="mt-4 px-3">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">
              {t('workspace.section')}
            </span>
            <button
              type="button"
              onClick={onCreateWorkspace}
              title={t('workspace.create')}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {filteredWorkspaces.length === 0 && (
              <p className="px-2 py-3 text-xs text-app-muted">
                {search ? t('workspace.noResults') : t('workspace.none')}
              </p>
            )}
            {filteredWorkspaces.map((workspace) => {
              const isActive = activeWorkspaceId === workspace.id
              return (
                <div key={workspace.id} className="group/ws relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWorkspace(workspace)
                      setOpenMenuId(null)
                      onClose?.()
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 pr-9 text-left transition-all ${
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-app-text hover:bg-app-hover'
                    }`}
                  >
                    <WorkspaceAvatar name={workspace.name} />
                    <span className="truncate text-sm">{workspace.name}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId((cur) =>
                        cur === workspace.id ? null : workspace.id,
                      )
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-app-muted opacity-100 transition-all hover:bg-white hover:text-app-text hover:shadow-sm md:opacity-0 md:group-hover/ws:opacity-100"
                    title={t('common.more')}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenuId === workspace.id && (
                    <div className="animate-scale-in absolute right-1 top-10 z-30 w-40 rounded-xl border border-app-border bg-white p-1.5 shadow-lg shadow-slate-200/50">
                      <button
                        type="button"
                        onClick={() => {
                          onEditWorkspace(workspace)
                          setOpenMenuId(null)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-app-text transition-colors hover:bg-app-hover"
                      >
                        <Pencil size={14} className="text-app-muted" />
                        {t('common.rename')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteWorkspace(workspace)
                          setOpenMenuId(null)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Category & Page navigation ─── */}
        {activeWorkspace && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-app-border">
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen size={12} className="shrink-0 text-app-muted" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                  {activeWorkspace.name}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                    hasActiveFilters
                      ? 'bg-primary/10 text-primary'
                      : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                  }`}
                  title={t('filter.title')}
                >
                  <Filter size={13} />
                </button>
                <button
                  type="button"
                  title={t('category.create')}
                  onClick={() => setCategoryModal({ mode: 'create' })}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <FolderPlus size={14} />
                </button>
              </div>
            </div>

            {/* Filters - Collapsible */}
            {showFilters && (
              <div className="mx-3 mb-2">
                <div className="rounded-xl border border-app-border bg-app-surface/50 p-3">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                      {t('filter.title')}
                    </span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setPageStatusFilter('all')
                          setPagePriorityFilter('all')
                          setPageTagFilter('all')
                        }}
                        className="text-[10px] font-medium text-primary transition-colors hover:text-primary-dark"
                      >
                        {t('filter.clear')}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="block">
                      <span className="app-form-label">{t('filter.status')}</span>
                      <select
                        value={pageStatusFilter}
                        onChange={(event) => setPageStatusFilter(event.target.value as 'all' | PageStatus)}
                        className="app-form-select mt-1"
                      >
                        <option value="all">{t('filter.all')}</option>
                        <option value="active">{t('filter.active')}</option>
                        <option value="doing">{t('filter.doing')}</option>
                        <option value="done">{t('filter.done')}</option>
                        <option value="archived">{t('filter.archived')}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="app-form-label">{t('filter.priority')}</span>
                      <select
                        value={pagePriorityFilter}
                        onChange={(event) => setPagePriorityFilter(event.target.value as 'all' | PagePriority)}
                        className="app-form-select mt-1"
                      >
                        <option value="all">{t('filter.all')}</option>
                        <option value="high">{t('filter.high')}</option>
                        <option value="normal">{t('filter.normal')}</option>
                        <option value="low">{t('filter.low')}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="app-form-label">{t('filter.tag')}</span>
                      <select
                        value={pageTagFilter}
                        onChange={(event) => setPageTagFilter(event.target.value)}
                        className="app-form-select mt-1"
                      >
                        <option value="all">{t('filter.all')}</option>
                        {allTags.map((tag) => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk actions */}
            {selectedPageIds.length > 0 && (
              <div className="mx-3 mb-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {selectedPageIds.length} {t('common.selected')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPageIds([])}
                    className="text-[10px] font-medium text-app-muted transition-colors hover:text-app-text"
                  >
                    {t('common.clear')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleBulkArchive()}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-2 text-[10px] font-medium text-app-text transition-colors hover:bg-app-hover"
                  >
                    <Archive size={12} className="text-app-muted" />
                    {t('common.archive')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkPin()}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-2 text-[10px] font-medium text-app-text transition-colors hover:bg-app-hover"
                  >
                    <Pin size={12} className="text-app-muted" />
                    {t('common.pin')}
                  </button>
                  <select
                    value=""
                    onChange={(event) => void handleBulkMove(event.target.value)}
                    className="col-span-2 rounded-lg border border-app-border bg-white px-2 py-2 text-[10px] font-medium text-app-text outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t('common.moveTo')}...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-2 py-2 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={12} />
                    {t('common.deleteSelected')}
                  </button>
                </div>
              </div>
            )}

            {/* Pages list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
              {categories.length === 0 && (
                <div className="px-2 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Folder size={20} className="text-primary" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-app-text">{t('category.none')}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-app-muted">{t('category.createHint')}</p>
                  <button
                    type="button"
                    onClick={() => setCategoryModal({ mode: 'create' })}
                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95"
                  >
                    <Plus size={14} />
                    {t('category.createButton')}
                  </button>
                </div>
              )}

              {categories.map((category) => {
                const categoryPages = filteredPages.filter(
                  (p) => p.categoryId === category.id,
                )
                const isCollapsed = collapsedCategories[category.id]

                return (
                  <div key={category.id} className="mb-0.5">
                    {/* Category header */}
                    <div className="group/cat relative flex items-center gap-1 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-app-hover">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:text-app-text"
                        title={isCollapsed ? t('common.expand') : t('common.collapse')}
                      >
                        <ChevronRight
                          size={14}
                          className={`shrink-0 transition-transform duration-200 ${
                            isCollapsed ? '' : 'rotate-90'
                          }`}
                        />
                      </button>

                      <Folder
                        size={14}
                        className="shrink-0 text-amber-500"
                      />

                      <span
                        className="min-w-0 flex-1 cursor-pointer truncate text-xs font-medium text-app-text"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </span>

                      <span className="text-[10px] text-app-muted">
                        {categoryPages.length}
                      </span>

                      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover/cat:opacity-100">
                        <button
                          type="button"
                          title={t('page.add')}
                          onClick={() =>
                            setPageModal({ mode: 'create', categoryId: category.id })
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-white hover:text-primary"
                        >
                          <Plus size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId((cur) =>
                              cur === category.id ? null : category.id,
                            )
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-white hover:text-app-text"
                          title={t('common.more')}
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>

                      {openMenuId === category.id && (
                        <div className="animate-scale-in absolute right-1 top-9 z-30 w-40 rounded-xl border border-app-border bg-white p-1.5 shadow-lg shadow-slate-200/50">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryModal({ mode: 'edit', category })
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-app-text transition-colors hover:bg-app-hover"
                          >
                            <Pencil size={14} className="text-app-muted" />
                            {t('common.rename')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryToDelete(category)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pages */}
                    {!isCollapsed && (
                      <div className="ml-5 mt-0.5 space-y-0.5 border-l border-app-border pl-2">
                        {categoryPages.map((page) => {
                          const isActive = activePageId === page.id
                          const isSelected = selectedPageIds.includes(page.id)

                          return (
                            <div key={page.id} className="group/page relative">
                              <button
                                type="button"
                                title={isSelected ? t('common.deselect') : t('common.select')}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  togglePageSelection(page.id)
                                }}
                                className={`absolute left-0 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-app-muted transition-all hover:bg-white hover:text-primary ${
                                  isSelected ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover/page:opacity-100'
                                }`}
                              >
                                {isSelected ? (
                                  <Check size={12} className="text-primary" />
                                ) : (
                                  <Square size={12} />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onSelectPage(page.id)
                                  setOpenMenuId(null)
                                  onClose?.()
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-6 pr-8 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 font-medium text-primary'
                                    : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                                }`}
                              >
                                <FileText
                                  size={12}
                                  className={`shrink-0 ${isActive ? 'text-primary' : ''}`}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {stripHtml(page.title) || t('page.untitled')}
                                </span>
                                {page.pinned && (
                                  <Pin size={10} className="shrink-0 text-primary" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId((cur) =>
                                    cur === page.id ? null : page.id,
                                  )
                                }}
                                className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-app-muted opacity-100 transition-all hover:bg-white hover:text-app-text md:opacity-0 md:group-hover/page:opacity-100"
                                title={t('common.more')}
                              >
                                <MoreHorizontal size={13} />
                              </button>

                              {openMenuId === page.id && (
                                <div className="animate-scale-in absolute right-1 top-8 z-30 w-40 rounded-xl border border-app-border bg-white p-1.5 shadow-lg shadow-slate-200/50">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPageModal({ mode: 'edit', page })
                                      setOpenMenuId(null)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-app-text transition-colors hover:bg-app-hover"
                                  >
                                    <Pencil size={14} className="text-app-muted" />
                                    {t('common.rename')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await handleTogglePinned(page)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-app-text transition-colors hover:bg-app-hover"
                                  >
                                    {page.pinned ? (
                                      <>
                                        <PinOff size={14} className="text-app-muted" />
                                        {t('common.unpin')}
                                      </>
                                    ) : (
                                      <>
                                        <Pin size={14} className="text-app-muted" />
                                        {t('common.pin')}
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPageToDelete(page)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                                  >
                                    <Trash2 size={14} />
                                    {t('common.delete')}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {categoryPages.length === 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPageModal({ mode: 'create', categoryId: category.id })
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-app-muted transition-colors hover:bg-app-hover hover:text-primary"
                          >
                            <Plus size={12} />
                            {t('page.add')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Footer ─── */}
        <div className="shrink-0 border-t border-app-border p-3">
          <button
            type="button"
            onClick={() => setBackupModalOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
          >
            <Settings size={14} />
            {t('settings')}
          </button>
        </div>
      </aside>

      <NameModal
        open={categoryModal !== null}
        title={categoryModal?.mode === 'edit' ? t('category.edit') : t('category.create')}
        label={t('category.name')}
        placeholder={t('category.placeholder')}
        initialValue={categoryModal?.category?.name ?? ''}
        submitText={categoryModal?.mode === 'edit' ? t('common.save') : t('category.createButton')}
        onClose={() => setCategoryModal(null)}
        onSubmit={handleCategorySubmit}
      />

      <NameModal
        open={pageModal !== null}
        title={pageModal?.mode === 'edit' ? t('page.edit') : t('page.create')}
        label={t('page.title')}
        placeholder={t('page.placeholder')}
        initialValue={pageModal?.page?.title ?? ''}
        submitText={pageModal?.mode === 'edit' ? t('common.save') : t('page.createButton')}
        extraContent={
          pageModal?.mode !== 'edit' ? (
            <div className="mb-4 space-y-3">
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                  {t('page.templates')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {pageTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() =>
                        setPageModal((current) =>
                          current
                            ? { ...current, templateKey: template.key, workflowKey: undefined }
                            : current,
                        )
                      }
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        (pageModal?.templateKey ?? 'note') === template.key
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-app-border bg-white text-app-muted hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wide">
                        {template.label}
                      </div>
                      <div className="mt-1 text-[10px] leading-relaxed opacity-80">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-app-border pt-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                  {t('page.workflows')}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {workflowTemplates.map((workflow) => (
                    <button
                      key={workflow.key}
                      type="button"
                      onClick={() => setPageModal((current) => current ? { ...current, workflowKey: workflow.key, templateKey: undefined } : current)}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        pageModal?.workflowKey === workflow.key
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-app-border bg-white text-app-muted hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wide">
                        {workflow.label}
                      </div>
                      <div className="mt-1 text-[10px] leading-relaxed opacity-80">
                        {workflow.description}
                      </div>
                      <div className="mt-1 text-[9px] text-app-muted">
                        {workflow.steps.length} {t('common.steps')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null
        }
        onClose={() => setPageModal(null)}
        onSubmit={handlePageSubmit}
      />

      <ConfirmDialog
        open={categoryToDelete !== null}
        title={t('category.deleteTitle')}
        description={t('category.deleteDescription', { name: categoryToDelete?.name ?? '' })}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
      />

      <ConfirmDialog
        open={pageToDelete !== null}
        title={t('page.deleteTitle')}
        description={t('page.deleteDescription', { title: pageToDelete?.title ?? '' })}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleDeletePage}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={t('page.bulkDeleteTitle')}
        description={t('page.bulkDeleteDescription', { count: selectedPageIds.length })}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />

      <BackupModal
        open={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />
    </>
  )
}

export default Sidebar