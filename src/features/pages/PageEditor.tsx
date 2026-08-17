import { useState } from 'react'

import { useLiveQuery } from 'dexie-react-hooks'

import {
  FileText,
  Plus,
} from 'lucide-react'

import type { Page } from '../../types/page'
import type {
  Block,
} from '../../types/block'
import type { BlockType } from '../../content/contentRegistry'

import { db } from '../../db/database'

import { blockRepository } from '../../db/repositories/blockRepository'

import BlockPicker from '../../components/blocks/BlockPicker'
import BlockEditor from '../../components/blocks/BlockEditor'
import ConfirmDialog from '../../components/common/ConfirmDialog'

interface PageEditorProps {
  page: Page
}

function PageEditor({
  page,
}: PageEditorProps) {
  const blocks =
    useLiveQuery(
      () =>
        db.blocks
          .where('pageId')
          .equals(page.id)
          .sortBy('order'),
      [page.id],
    ) ?? []

  const [blockToDelete, setBlockToDelete] =
    useState<Block | null>(null)

  const handleCreateBlock = async (
    type: BlockType,
  ) => {
    await blockRepository.create(
      page.id,
      type,
    )
  }

  const handleDeleteBlock = async () => {
    if (!blockToDelete) {
      return
    }

    await blockRepository.remove(
      blockToDelete.id,
    )
  }

  return (
    <>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <div className="flex items-center gap-2 text-sm text-app-muted">
          <FileText size={16} />
          Page
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {page.title}
        </h1>

        <p className="mt-2 text-sm text-app-muted">
          Thêm ghi chú, checklist, bảng
          và các nội dung khác vào Page.
        </p>

        <div className="mt-10">
          {blocks.length === 0 && (
            <div className="mb-5 rounded-2xl border border-dashed border-app-border px-6 py-10 text-center">
              <FileText
                size={32}
                strokeWidth={1.5}
                className="mx-auto text-app-muted"
              />

              <p className="mt-3 text-sm font-medium">
                Page đang trống
              </p>

              <p className="mt-1 text-xs text-app-muted">
                Thêm nội dung đầu tiên
                để bắt đầu.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {blocks.map(
              (block, index) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  isFirst={index === 0}
                  isLast={
                    index ===
                    blocks.length - 1
                  }
                  onMoveUp={() =>
                    blockRepository.move(
                      page.id,
                      block.id,
                      'up',
                    )
                  }
                  onMoveDown={() =>
                    blockRepository.move(
                      page.id,
                      block.id,
                      'down',
                    )
                  }
                  onDelete={() =>
                    setBlockToDelete(
                      block,
                    )
                  }
                />
              ),
            )}
          </div>

          <div className="mt-4">
            <BlockPicker
              onSelect={
                handleCreateBlock
              }
            />
          </div>

          {blocks.length > 0 && (
            <button
              type="button"
              onClick={() =>
                handleCreateBlock(
                  'text',
                )
              }
              className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-app-muted hover:bg-app-hover hover:text-general"
            >
              <Plus size={14} />
              Thêm nhanh văn bản
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={blockToDelete !== null}
        title="Xóa nội dung?"
        description="Block này sẽ bị xóa khỏi Page."
        onClose={() =>
          setBlockToDelete(null)
        }
        onConfirm={
          handleDeleteBlock
        }
      />
    </>
  )
}

export default PageEditor