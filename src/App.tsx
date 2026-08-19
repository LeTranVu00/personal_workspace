import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LayoutGrid, Plus, Menu } from 'lucide-react'
import WorkspaceView from './features/workspaces/WorkspaceView'
import Sidebar from './components/layout/Sidebar'
import ConfirmDialog from './components/common/ConfirmDialog'
import WorkspaceModal from './features/workspaces/WorkspaceModal'

import { db } from './db/database'
import { workspaceRepository } from './db/repositories/workspaceRepository'

import type { Workspace } from './types/workspace'
import type { Page } from './types/page'

function App() {
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
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-app-border bg-white px-3 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="mr-1 rounded-md p-1.5 text-app-muted hover:bg-app-hover md:hidden"
            >
              <Menu size={18} />
            </button>
            {activeWorkspace ? (
              <>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-general text-[11px] font-bold text-white">
                  {activeWorkspace.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="truncate text-sm font-semibold">
                  {activeWorkspace.name}
                </h2>
                <span className="rounded-full bg-app-surface px-2 py-0.5 text-[10px] font-medium text-app-muted">
                  Workspace
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-app-muted" />
                <h2 className="text-sm font-semibold text-app-muted">
                  Trang chủ
                </h2>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setWorkspaceModal({
                mode: 'create',
              })
            }
            className="flex items-center gap-1.5 rounded-lg bg-general px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-general-dark active:scale-95"
          >
            <Plus size={15} />
            Tạo Workspace
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeWorkspace ? (
            <WorkspaceView
              key={activeWorkspace.id}
              workspace={activeWorkspace}
              activePage={activePage}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              {/* Decorative background */}
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-general/5 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-general to-blue-600 text-2xl font-bold text-white shadow-lg shadow-general/30">
                  W
                </div>
              </div>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                Personal Workspace
              </h1>

              <p className="mt-2 max-w-xs text-sm leading-6 text-app-muted">
                Tạo Workspace đầu tiên để bắt đầu
                quản lý học tập, công việc và hành
                trình của bạn.
              </p>

              <button
                type="button"
                onClick={() =>
                  setWorkspaceModal({
                    mode: 'create',
                  })
                }
                className="mt-6 flex items-center gap-2 rounded-xl bg-general px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-general/25 transition hover:bg-general-dark active:scale-95"
              >
                <Plus size={16} />
                Tạo Workspace đầu tiên
              </button>
            </div>
          )}
        </div>
      </main>

      <WorkspaceModal
        open={workspaceModal !== null}
        title={
          workspaceModal?.mode === 'edit'
            ? 'Đổi tên Workspace'
            : 'Tạo Workspace mới'
        }
        initialName={
          workspaceModal?.workspace?.name ?? ''
        }
        submitText={
          workspaceModal?.mode === 'edit'
            ? 'Lưu thay đổi'
            : 'Tạo Workspace'
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
        title="Xóa Workspace?"
        description={`Workspace "${
          workspaceToDelete?.name ?? ''
        }" và toàn bộ dữ liệu bên trong sẽ bị xóa vĩnh viễn.`}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteWorkspace}
      />
    </div>
  )
}

export default App