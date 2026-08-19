import { useState } from 'react'
import PageEditor from '../pages/PageEditor'

import {
  FileText,
  FolderOpen,
} from 'lucide-react'

import type { Workspace } from '../../types/workspace'
import type { Page as WorkspacePage } from '../../types/page'

interface WorkspaceViewProps {
  workspace: Workspace
  activePage: WorkspacePage | null
}

function WorkspaceView({
  workspace: _workspace,
  activePage,
}: WorkspaceViewProps) {
  return (
    <section className="min-w-0 flex-1 overflow-y-auto bg-app-bg custom-scrollbar">
      {activePage ? (
        <PageEditor
          key={activePage.id}
          page={activePage}
        />
      ) : (
        <div className="flex h-full min-h-[500px] items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-app-surface">
              <FolderOpen
                size={26}
                strokeWidth={1.5}
                className="text-app-muted"
              />
            </div>

            <h2 className="mt-4 text-base font-semibold">
              Chọn một Page để bắt đầu
            </h2>

            <p className="mt-1.5 max-w-xs text-sm leading-6 text-app-muted">
              Chọn Page từ sidebar bên trái, hoặc
              tạo Page mới trong một danh mục.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-app-border px-3 py-2 text-xs text-app-muted">
                <FileText size={13} />
                <span>Chọn Page từ sidebar</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default WorkspaceView