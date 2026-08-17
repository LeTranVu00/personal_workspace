import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import WorkspaceView from './features/workspaces/WorkspaceView'
import Sidebar from './components/layout/Sidebar'
import ConfirmDialog from './components/common/ConfirmDialog'
import WorkspaceModal from './features/workspaces/WorkspaceModal'

import { db } from './db/database'
import { workspaceRepository } from './db/repositories/workspaceRepository'

import type { Workspace } from './types/workspace'

function App() {
  const workspaces =
    useLiveQuery(
      () => db.workspaces.orderBy('createdAt').toArray(),
      [],
    ) ?? []

  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<string | null>(null)

  const [workspaceModal, setWorkspaceModal] =
    useState<{
      mode: 'create' | 'edit'
      workspace?: Workspace
    } | null>(null)

  const [workspaceToDelete, setWorkspaceToDelete] =
    useState<Workspace | null>(null)

  useEffect(() => {
    if (workspaces.length === 0) {
      setActiveWorkspaceId(null)
      return
    }

    const activeWorkspaceStillExists =
      workspaces.some(
        (workspace) =>
          workspace.id === activeWorkspaceId,
      )

    if (!activeWorkspaceStillExists) {
      setActiveWorkspaceId(workspaces[0].id)
    }
  }, [workspaces, activeWorkspaceId])

  const activeWorkspace =
    workspaces.find(
      (workspace) =>
        workspace.id === activeWorkspaceId,
    ) ?? null

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
  }

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg text-app-text">
      <Sidebar
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(workspace) =>
          setActiveWorkspaceId(workspace.id)
        }
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
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-app-border px-6">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">
            {activeWorkspace
              ? activeWorkspace.name
              : 'Trang chủ'}
          </h2>

          {activeWorkspace && (
            <p className="text-xs text-app-muted">
              Workspace
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setWorkspaceModal({
              mode: 'create',
            })
          }
          className="flex items-center gap-2 rounded-lg bg-general px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={18} />
          Tạo Workspace
        </button>
      </header>

      <div className="min-h-0 flex-1">
        {activeWorkspace ? (
          <WorkspaceView
            key={activeWorkspace.id}
            workspace={activeWorkspace}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-general text-xl font-bold text-white">
              W
            </div>

            <h1 className="mt-5 text-2xl font-semibold">
              Personal Workspace
            </h1>

            <p className="mt-2 max-w-md text-app-muted">
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
              className="mt-6 flex items-center gap-2 rounded-lg bg-general px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus size={18} />
              Tạo Workspace
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
            : 'Tạo Workspace'
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
        }" và toàn bộ dữ liệu bên trong sẽ bị xóa.`}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirm={handleDeleteWorkspace}
      />
    </div>
  )
}

export default App