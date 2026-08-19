import { useState, useEffect } from 'react'

import { useLiveQuery } from 'dexie-react-hooks'

import {
  FileText,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react'

import type { Page } from '../../types/page'
import type {
  Block,
} from '../../types/block'
import type { BlockType } from '../../content/contentRegistry'

import { db } from '../../db/database'

import { blockRepository } from '../../db/repositories/blockRepository'
import { pageRepository } from '../../db/repositories/pageRepository'

import BlockPicker from '../../components/blocks/BlockPicker'
import BlockEditor from '../../components/blocks/BlockEditor'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RichTextEditor from '../../components/blocks/RichTextEditor'

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

  const [localTitle, setLocalTitle] = useState(page.title)

  // Sync local title if page title changes externally
  useEffect(() => {
    setLocalTitle(page.title)
  }, [page.title])


  const handleUpdateTitle = async () => {
    const plainText = localTitle.replace(/<[^>]+>/g, '').trim()
    if (localTitle !== page.title) {
      await pageRepository.update(page.id, { title: plainText ? localTitle : 'Trang không có tiêu đề' })
    }
  }

  const handleCreateBlock = async (
    type: BlockType,
    afterBlockId?: string | null,
  ) => {
    await blockRepository.create(
      page.id,
      type,
      afterBlockId,
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
      <div className="w-full flex flex-col items-center">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-12 relative">
          {/* Page Header */}
          <div className="group/header relative mb-8 border-b border-app-border pb-6">
            <div className="flex items-center gap-1.5 text-xs text-app-muted mb-2">
              <FileText size={13} />
              <span>Page</span>
            </div>

            {/* Title Input */}
            <RichTextEditor
              content={localTitle}
              placeholder="Tên trang không có tiêu đề"
              onChange={(html) => setLocalTitle(html)}
              onBlur={handleUpdateTitle}
              className="w-full bg-transparent text-3xl md:text-4xl font-bold tracking-tight text-app-text outline-none placeholder:text-app-muted/30"
            />
          </div>

        {/* Blocks */}
        <div>
          {blocks.length === 0 && (
            <div className="mb-6 rounded-2xl border border-dashed border-app-border bg-app-surface/50 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <LayoutTemplate
                  size={22}
                  strokeWidth={1.5}
                  className="text-app-muted"
                />
              </div>

              <p className="mt-3 text-sm font-semibold">
                Page đang trống
              </p>

              <p className="mt-1 text-xs text-app-muted">
                Thêm block đầu tiên để bắt đầu ghi nội dung
              </p>
            </div>
          )}

          <div className="relative">
            {/* Insert Top */}
            {blocks.length > 0 && (
              <div className="group/insert absolute -top-2 left-0 z-10 flex h-4 w-full -translate-y-1/2 items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-general/20 opacity-0 transition-opacity group-hover/insert:opacity-100" />
                <div className="relative">
                  <BlockPicker variant="compact" onSelect={(type) => handleCreateBlock(type, null)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {blocks.map(
                (block, index) => (
                  <div key={block.id} className="relative">
                    <BlockEditor
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
                    
                    {/* Insert After */}
                    <div className="group/insert absolute -bottom-1 left-0 z-10 flex h-4 w-full translate-y-1/2 items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-general/20 opacity-0 transition-opacity group-hover/insert:opacity-100" />
                      <div className="relative">
                        <BlockPicker variant="compact" onSelect={(type) => handleCreateBlock(type, block.id)} />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Add block controls */}
          <div className="mt-4 flex items-center gap-2">
            <BlockPicker
              onSelect={
                handleCreateBlock
              }
            />

            {blocks.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  handleCreateBlock('text')
                }
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-app-muted transition hover:bg-app-hover hover:text-app-text"
              >
                <Sparkles size={13} />
                Thêm nhanh văn bản
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      <ConfirmDialog
        open={blockToDelete !== null}
        title="Xóa nội dung?"
        description="Block này sẽ bị xóa khỏi Page. Hành động không thể hoàn tác."
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