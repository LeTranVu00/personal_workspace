import { db } from '../database'

import {
  createDefaultBlockContent,
  type BlockType,
} from '../../content/contentRegistry'

import type {
  Block,
  BlockContent,
} from '../../types/block'

import { generateId } from '../../utils/generateId'

export const blockRepository = {
  async create(
    pageId: string,
    type: BlockType,
    afterBlockId?: string | null,
  ): Promise<Block> {
    const blocks = await db.blocks
      .where('pageId')
      .equals(pageId)
      .sortBy('order')

    let newOrder = 0

    if (afterBlockId) {
      const afterBlock = blocks.find((b) => b.id === afterBlockId)
      if (afterBlock) {
        newOrder = afterBlock.order + 1
      } else {
        newOrder = blocks.length > 0 ? blocks[blocks.length - 1].order + 1 : 0
      }
    } else if (afterBlockId === null) {
      newOrder = blocks.length > 0 ? blocks[0].order : 0
    } else {
      newOrder = blocks.length > 0 ? blocks[blocks.length - 1].order + 1 : 0
    }

    const now = Date.now()

    const block: Block = {
      id: generateId('block'),
      pageId,
      type,
      content:
        createDefaultBlockContent(
          type,
        ) as BlockContent,
      order: newOrder,
      createdAt: now,
      updatedAt: now,
    }

    await db.transaction('rw', db.blocks, async () => {
      // Shift blocks down to make room
      const blocksToShift = blocks.filter((b) => b.order >= newOrder)
      for (const b of blocksToShift) {
        await db.blocks.update(b.id, { order: b.order + 1 })
      }

      await db.blocks.add(block)
    })

    return block
  },

  async updateContent(
    id: string,
    content: BlockContent,
  ): Promise<void> {
    await db.blocks.update(id, {
      content,
      updatedAt: Date.now(),
    })
  },

  async remove(
    id: string,
  ): Promise<void> {
    await db.blocks.delete(id)
  },

  async move(
    pageId: string,
    id: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    const blocks = await db.blocks
      .where('pageId')
      .equals(pageId)
      .sortBy('order')

    const currentIndex =
      blocks.findIndex(
        (block) =>
          block.id === id,
      )

    if (currentIndex === -1) {
      return
    }

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      targetIndex < 0 ||
      targetIndex >=
        blocks.length
    ) {
      return
    }

    const currentBlock =
      blocks[currentIndex]

    const targetBlock =
      blocks[targetIndex]

    const currentOrder =
      currentBlock.order

    const targetOrder =
      targetBlock.order

    await db.transaction(
      'rw',
      db.blocks,
      async () => {
        await db.blocks.update(
          currentBlock.id,
          {
            order:
              targetOrder,

            updatedAt:
              Date.now(),
          },
        )

        await db.blocks.update(
          targetBlock.id,
          {
            order:
              currentOrder,

            updatedAt:
              Date.now(),
          },
        )
      },
    )
  },
}