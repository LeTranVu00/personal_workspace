import { useState } from 'react'
import {
  Home,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react'

import type { Workspace } from '../../types/workspace'

interface SidebarProps {
  workspaces: Workspace[]
  activeWorkspaceId: string | null

  onSelectWorkspace: (workspace: Workspace) => void
  onCreateWorkspace: () => void
  onEditWorkspace: (workspace: Workspace) => void
  onDeleteWorkspace: (workspace: Workspace) => void
}

function Sidebar({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null)

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-app-border bg-white">
      <div className="flex h-16 items-center border-b border-app-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-general font-bold text-white">
          W
        </div>

        <div className="ml-3 min-w-0">
          <h1 className="truncate text-sm font-semibold">
            Personal Workspace
          </h1>

          <p className="text-xs text-app-muted">
            Journey Log
          </p>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 rounded-lg bg-app-surface px-3 py-2.5">
          <Search
            size={17}
            className="shrink-0 text-app-muted"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm Workspace..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-app-muted"
          />
        </div>
      </div>

      <nav className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-app-hover"
        >
          <Home size={18} />
          Trang chủ
        </button>
      </nav>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
            Workspace
          </span>

          <button
            type="button"
            onClick={onCreateWorkspace}
            title="Tạo Workspace"
            className="rounded-md p-1 text-app-muted transition hover:bg-app-hover hover:text-general"
          >
            <Plus size={17} />
          </button>
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {filteredWorkspaces.length === 0 && (
            <p className="px-3 py-4 text-sm text-app-muted">
              Không tìm thấy Workspace.
            </p>
          )}

          {filteredWorkspaces.map((workspace) => {
            const isActive =
              activeWorkspaceId === workspace.id

            return (
              <div
                key={workspace.id}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectWorkspace(workspace)
                    setOpenMenuId(null)
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 pr-10 text-left text-sm transition ${
                    isActive
                      ? 'bg-general/10 font-medium text-general'
                      : 'hover:bg-app-hover'
                  }`}
                >
                  <span className="truncate">
                    {workspace.name}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()

                    setOpenMenuId((current) =>
                      current === workspace.id
                        ? null
                        : workspace.id,
                    )
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-app-muted hover:bg-white hover:text-app-text"
                >
                  <MoreHorizontal size={16} />
                </button>

                {openMenuId === workspace.id && (
                  <div className="absolute right-2 top-10 z-20 w-40 rounded-xl border border-app-border bg-white p-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        onEditWorkspace(workspace)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-app-hover"
                    >
                      <Pencil size={15} />
                      Đổi tên
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteWorkspace(workspace)
                        setOpenMenuId(null)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-app-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-app-hover"
        >
          <Settings size={18} />
          Cài đặt
        </button>
      </div>
    </aside>
  )
}

export default Sidebar