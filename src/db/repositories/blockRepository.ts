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
  ): Promise<Block> {
    const blocks = await db.blocks
      .where('pageId')
      .equals(pageId)
      .toArray()

    const maxOrder =
      blocks.length > 0
        ? Math.max(
            ...blocks.map(
              (block) => block.order,
            ),
          )
        : -1

    const now = Date.now()

    const block: Block = {
      id: generateId('block'),

      pageId,

      type,

      content:
        createDefaultBlockContent(
          type,
        ) as BlockContent,

      order: maxOrder + 1,

      createdAt: now,
      updatedAt: now,
    }

    await db.blocks.add(block)

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