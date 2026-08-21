import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutGrid, Plus, Menu, FileText, CheckSquare, ListTodo, Command } from 'lucide-react'
import WorkspaceView from './features/workspaces/WorkspaceView'
import Sidebar from './components/layout/Sidebar'
import ConfirmDialog from './components/common/ConfirmDialog'
import WorkspaceModal from './features/workspaces/WorkspaceModal'

import { db } from './db/database'
import { workspaceRepository } from './db/repositories/workspaceRepository'

import type { Workspace } from './types/workspace'
import type { Page } from './types/page'
import { useLanguage } from './hooks/useLanguage'

function App() {
  const { t } = useLanguage()
  const workspaces =
    useLiveQuery(
      () => db.workspaces.orderBy('createdAt').toArray(),
      [],
    ) ?? []

  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<string | null>(() => localStorage.getItem('activeWorkspaceId'))

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('activeWorkspaceId', activeWorkspaceId)
    } else {
      localStorage.removeItem('activeWorkspaceId')
    }
  }, [activeWorkspaceId])

  const [activePageId, setActivePageId] =
    useState<string | null>(() => localStorage.getItem('activePageId'))

  useEffect(() => {
    if (activePageId) {
      localStorage.setItem('activePageId', activePageId)
    } else {
      localStorage.removeItem('activePageId')
    }
  }, [activePageId])

  const [workspaceModal, setWorkspaceModal] =
    useState<{
      mode: 'create' | 'edit'
      workspace?: Workspace
    } | null>(null)

  const [workspaceToDelete, setWorkspaceToDelete] =
    useState<Workspace | null>(null)

  const activeWorkspace =
    workspaces.find(
      (workspace) =>
        workspace.id === activeWorkspaceId,
    ) ?? null

  const pages =
    useLiveQuery<Page[]>(
      () =>
        activeWorkspaceId
          ? db.pages.where('workspaceId').equals(activeWorkspaceId).toArray()
          : Promise.resolve([]),
      [activeWorkspaceId],
    ) ?? []

  const activePage =
    (pages.find((p: Page) => p.id === activePageId) ?? null)

  const recentPages =
    useLiveQuery(
      () => db.pages.orderBy('updatedAt').reverse().limit(5).toArray(),
      [],
    ) ?? []

  const overviewStats = {
    notes: recentPages.filter((page) => page.type === 'note').length,
    tasks: recentPages.filter((page) => page.type === 'task').length,
    lists: recentPages.filter((page) => page.type === 'list').length,
  }

  const handleCreateWorkspace = async (
    name: string,
  ) => {
    const workspace =
      await workspaceRepository.create(name)

    setActiveWorkspaceId(workspace.id)
  }

  const handleRenameWorkspace = async (
    name: string,
  ) => {
    if (!workspaceModal?.workspace) {
      return
    }

    await workspaceRepository.update(
      workspaceModal.workspace.id,
      name,
    )
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) {
      return
    }

    await workspaceRepository.remove(
      workspaceToDelete.id,
    )

    if (activeWorkspaceId === workspaceToDelete.id) {
      setActiveWorkspaceId(null)
      setActivePageId(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg text-app-text">
      <Sidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        activePageId={activePageId}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onSelectWorkspace={(workspace) => {
          setActiveWorkspaceId(workspace.id)
          setActivePageId(null)
        }}
        onCreateWorkspace={() =>
          setWorkspaceModal({
            mode: 'create',
          })
        }
        onEditWorkspace={(workspace) =>
          setWorkspaceModal({
            mode: 'edit',
            workspace,
          })
        }
        onDeleteWorkspace={(workspace) =>
          setWorkspaceToDelete(workspace)
        }
        onSelectPage={(pageId) =>
          setActivePageId(pageId || null)
        }
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header - Minimalist */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-app-border bg-white/80 px-3 backdrop-blur-sm md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-hover hover:text-app-text md:hidden"
              title={t('common.menu')}
            >
              <Menu size={18} />
            </button>
            
            {activeWorkspace ? (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white shadow-sm">
                  {activeWorkspace.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-app-text">
                    {activeWorkspace.name}
                  </h2>
                  <p className="text-[11px] text-app-muted">
                    {t('common.workspace')}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <LayoutGrid size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-app-text">
                    {t('home.title')}
                  </h2>
                  <p className="text-[11px] text-app-muted">
                    {t('app.name')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard shortcut hint */}
            <div className="hidden items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-[11px] text-app-muted lg:flex">
              <Command size={12} />
              <span>K</span>
            </div>
            
            <button
              type="button"
              onClick={() =>
                setWorkspaceModal({
                  mode: 'create',
                })
              }
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-all hover:bg-primary-dark active:scale-95 sm:px-4"
              title={t('home.createWorkspace')}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t('home.createWorkspace')}</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeWorkspace ? (
            <WorkspaceView
              key={activeWorkspace.id}
              workspace={activeWorkspace}
              activePage={activePage}
              onSelectPage={(pageId) => setActivePageId(pageId || null)}
            />
          ) : (
            /* Empty State - Welcome */
            <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-6">
              <div className="w-full max-w-2xl text-center">
                {/* Logo/Brand */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white shadow-lg shadow-primary/20">
                  {t('app.name').charAt(0)}
                </div>

                <h1 className="mt-6 text-3xl font-semibold tracking-tight text-app-text">
                  {t('app.name')}
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-app-muted">
                  {t('home.emptyDescription')}
                </p>

                {/* Stats - Minimal cards */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="group rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="text-xs font-medium uppercase tracking-wider text-app-muted">
                          {t('page.type.note')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-app-text">
                      {overviewStats.notes}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">
                      {t('home.recentPages')}
                    </div>
                  </div>

                  <div className="group rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-primary" />
                        <span className="text-xs font-medium uppercase tracking-wider text-app-muted">
                          {t('page.type.task')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-app-text">
                      {overviewStats.tasks}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">
                      {t('home.recentPages')}
                    </div>
                  </div>

                  <div className="group rounded-xl border border-app-border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListTodo size={16} className="text-primary" />
                        <span className="text-xs font-medium uppercase tracking-wider text-app-muted">
                          {t('page.type.list')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-3xl font-semibold text-app-text">
                      {overviewStats.lists}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">
                      {t('home.recentPages')}
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={() =>
                    setWorkspaceModal({
                      mode: 'create',
                    })
                  }
                  className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/30 active:scale-95"
                >
                  <Plus size={18} />
                  {t('home.emptyTitle')}
                </button>

                {/* Quick tips */}
                <div className="mt-8 flex items-center justify-center gap-4 text-xs text-app-muted">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-app-border bg-app-surface px-1.5 py-0.5 text-[10px] font-medium">⌘ K</kbd>
                    {t('common.search')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-app-border bg-app-surface px-1.5 py-0.5 text-[10px] font-medium">⌘ N</kbd>
                    {t('common.new')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <WorkspaceModal
        open={workspaceModal !== null}
        title={
          workspaceModal?.mode === 'edit'
            ? t('common.rename')
            : t('workspace.create')
        }
        initialName={
          workspaceModal?.workspace?.name ?? ''
        }
        submitText={
          workspaceModal?.mode === 'edit'
            ? t('common.save')
            : t('home.createWorkspace')
        }
        onClose={() => setWorkspaceModal(null)}
        onSubmit={
          workspaceModal?.mode === 'edit'
            ? handleRenameWorkspace
            : handleCreateWorkspace
        }
      />

      <ConfirmDialog
        open={workspaceToDelete !== null}
        title={t('common.delete')}
        description={`${workspaceToDelete?.name ?? ''} - ${t('common.delete')}`}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteWorkspace}
      />
    </div>
  )
}

export default App