import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BookOpen,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react'

import { db } from '../../db/database'
import { categoryRepository } from '../../db/repositories/categoryRepository'
import { pageRepository } from '../../db/repositories/pageRepository'

import NameModal from '../common/NameModal'
import ConfirmDialog from '../common/ConfirmDialog'

import type { Workspace } from '../../types/workspace'
import type { Category } from '../../types/category'
import type { Page as WorkspacePage } from '../../types/page'

interface SidebarProps {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  activePageId: string | null

  onSelectWorkspace: (workspace: Workspace) => void
  onCreateWorkspace: () => void
  onEditWorkspace: (workspace: Workspace) => void
  onDeleteWorkspace: (workspace: Workspace) => void
  onSelectPage: (pageId: string) => void
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
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
      style={{ background: `hsl(${hue}, 70%, 50%)` }}
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
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null)

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
    } | null>(null)

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
      // When editing from modal, we are saving plain text/HTML depending on what the modal uses
      await pageRepository.update(pageModal.page.id, { title })
      return
    }
    if (!pageModal?.categoryId || !activeWorkspaceId) return
    const page = await pageRepository.create(
      activeWorkspaceId,
      pageModal.categoryId,
      title,
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

  const activeWorkspace =
    workspaces.find((ws) => ws.id === activeWorkspaceId) ?? null

  // Close menu on outside click
  const handleBackdropClick = () => {
    if (openMenuId) setOpenMenuId(null)
  }

  return (
    <>
      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={handleBackdropClick}
        />
      )}

      <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg">
        {/* ─── Header ─── */}
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-general to-blue-600 text-sm font-bold text-white shadow-sm">
            W
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight">
              Personal Workspace
            </h1>
            <p className="text-[11px] text-app-muted">Journey Log</p>
          </div>
        </div>

        {/* ─── Search ─── */}
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-transparent bg-app-surface px-2.5 py-2 transition focus-within:border-app-border-2 focus-within:bg-white">
            <Search size={13} className="shrink-0 text-app-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm Workspace..."
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-app-muted-2"
            />
          </div>
        </div>

        {/* ─── Workspace Section ─── */}
        <div className="mt-3 px-3">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-app-muted-2">
              Workspace
            </span>
            <button
              type="button"
              onClick={onCreateWorkspace}
              title="Tạo Workspace mới"
              className="rounded-md p-0.5 text-app-muted transition hover:bg-app-hover hover:text-general"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {filteredWorkspaces.length === 0 && (
              <p className="px-2 py-3 text-xs text-app-muted">
                {search ? 'Không tìm thấy.' : 'Chưa có Workspace nào.'}
              </p>
            )}
            {filteredWorkspaces.map((workspace) => {
              const isActive = activeWorkspaceId === workspace.id
              return (
                <div key={workspace.id} className="relative z-20 group/ws">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWorkspace(workspace)
                      setOpenMenuId(null)
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 pr-8 text-left text-sm transition ${
                      isActive
                        ? 'bg-general/10 font-medium text-general'
                        : 'text-app-text hover:bg-app-hover'
                    }`}
                  >
                    <WorkspaceAvatar name={workspace.name} />
                    <span className="truncate text-sm">{workspace.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId((cur) =>
                        cur === workspace.id ? null : workspace.id,
                      )
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-app-muted opacity-0 transition hover:bg-white hover:text-app-text group-hover/ws:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenuId === workspace.id && (
                    <div className="animate-scale-in absolute right-1 top-9 z-30 w-36 rounded-xl border border-app-border bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          onEditWorkspace(workspace)
                          setOpenMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition hover:bg-app-hover"
                      >
                        <Pencil size={13} className="text-app-muted" />
                        Đổi tên
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteWorkspace(workspace)
                          setOpenMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Xóa
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
          <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-sidebar-border">
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <BookOpen size={11} className="shrink-0 text-app-muted" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-app-muted-2">
                  {activeWorkspace.name}
                </span>
              </div>
              <button
                type="button"
                title="Tạo danh mục"
                onClick={() => setCategoryModal({ mode: 'create' })}
                className="ml-1 shrink-0 rounded-md p-0.5 text-app-muted transition hover:bg-app-hover hover:text-general"
              >
                <FolderPlus size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
              {categories.length === 0 && (
                <div className="px-2 py-5 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-app-surface">
                    <Folder size={18} className="text-app-muted" />
                  </div>
                  <p className="mt-2 text-xs font-medium">Chưa có danh mục</p>
                  <p className="mt-0.5 text-[11px] text-app-muted">Tạo danh mục để tổ chức Pages</p>
                  <button
                    type="button"
                    onClick={() => setCategoryModal({ mode: 'create' })}
                    className="mt-3 rounded-lg bg-general px-3 py-1.5 text-xs font-medium text-white transition hover:bg-general-dark"
                  >
                    Tạo danh mục
                  </button>
                </div>
              )}

              {categories.map((category) => {
                const categoryPages = pages.filter(
                  (p) => p.categoryId === category.id,
                )
                const isCollapsed = collapsedCategories[category.id]

                return (
                  <div key={category.id} className="mb-1">
                    {/* Category header */}
                    <div className="group/cat relative flex items-center gap-1 rounded-lg px-1 py-1.5 transition hover:bg-app-hover">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="rounded p-0.5 text-app-muted"
                      >
                        <ChevronRight
                          size={13}
                          className={`shrink-0 transition-transform duration-150 ${
                            isCollapsed ? '' : 'rotate-90'
                          }`}
                        />
                      </button>

                      <Folder
                        size={13}
                        className="shrink-0 text-amber-500"
                      />

                      <span
                        className="min-w-0 flex-1 cursor-pointer truncate text-xs font-semibold"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </span>

                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover/cat:opacity-100">
                        <button
                          type="button"
                          title="Thêm Page"
                          onClick={() =>
                            setPageModal({ mode: 'create', categoryId: category.id })
                          }
                          className="rounded-md p-0.5 transition hover:bg-white hover:text-general"
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
                          className="rounded-md p-0.5 transition hover:bg-white"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>

                      {openMenuId === category.id && (
                        <div className="animate-scale-in absolute right-1 top-8 z-30 w-36 rounded-xl border border-app-border bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryModal({ mode: 'edit', category })
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition hover:bg-app-hover"
                          >
                            <Pencil size={13} className="text-app-muted" />
                            Đổi tên
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryToDelete(category)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pages */}
                    {!isCollapsed && (
                      <div className="ml-5 mt-0.5 space-y-0.5">
                        {categoryPages.map((page) => (
                          <div key={page.id} className="group/page relative">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPage(page.id)
                                setOpenMenuId(null)
                              }}
                              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 pr-7 text-left text-xs transition ${
                                activePageId === page.id
                                  ? 'bg-general/10 font-medium text-general'
                                  : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                              }`}
                            >
                              <FileText
                                size={12}
                                className={`shrink-0 ${activePageId === page.id ? 'text-general' : ''}`}
                              />
                              <span className="truncate">{stripHtml(page.title) || 'Trang không có tiêu đề'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId((cur) =>
                                  cur === page.id ? null : page.id,
                                )
                              }}
                              className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-app-muted opacity-0 transition hover:bg-white group-hover/page:opacity-100"
                            >
                              <MoreHorizontal size={13} />
                            </button>

                            {openMenuId === page.id && (
                              <div className="animate-scale-in absolute right-0 top-7 z-30 w-36 rounded-xl border border-app-border bg-white p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPageModal({ mode: 'edit', page })
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition hover:bg-app-hover"
                                >
                                  <Pencil size={13} className="text-app-muted" />
                                  Đổi tên
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPageToDelete(page)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 transition hover:bg-red-50"
                                >
                                  <Trash2 size={13} />
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {categoryPages.length === 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPageModal({ mode: 'create', categoryId: category.id })
                            }
                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-app-muted-2 transition hover:bg-app-hover hover:text-general"
                          >
                            <Plus size={12} />
                            Thêm Page
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
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-app-muted transition hover:bg-app-hover hover:text-app-text"
          >
            <Settings size={15} />
            Cài đặt
          </button>
        </div>
      </aside>

      <NameModal
        open={categoryModal !== null}
        title={categoryModal?.mode === 'edit' ? 'Đổi tên danh mục' : 'Tạo danh mục mới'}
        label="Tên danh mục"
        placeholder="Ví dụ: Vocabulary"
        initialValue={categoryModal?.category?.name ?? ''}
        submitText={categoryModal?.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo danh mục'}
        onClose={() => setCategoryModal(null)}
        onSubmit={handleCategorySubmit}
      />

      <NameModal
        open={pageModal !== null}
        title={pageModal?.mode === 'edit' ? 'Đổi tên Page' : 'Tạo Page mới'}
        label="Tên Page"
        placeholder="Ví dụ: Day 1"
        initialValue={pageModal?.page?.title ?? ''}
        submitText={pageModal?.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo Page'}
        onClose={() => setPageModal(null)}
        onSubmit={handlePageSubmit}
      />

      <ConfirmDialog
        open={categoryToDelete !== null}
        title="Xóa danh mục?"
        description={`Danh mục "${categoryToDelete?.name ?? ''}" và toàn bộ Page bên trong sẽ bị xóa vĩnh viễn.`}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
      />

      <ConfirmDialog
        open={pageToDelete !== null}
        title="Xóa Page?"
        description={`Page "${pageToDelete?.title ?? ''}" và toàn bộ nội dung bên trong sẽ bị xóa vĩnh viễn.`}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleDeletePage}
      />
    </>
  )
}

export default Sidebar