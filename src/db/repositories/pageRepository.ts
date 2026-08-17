import { db } from '../database'
import type { Page } from '../../types/page'
import { generateId } from '../../utils/generateId'

export const pageRepository = {
  async create(
    workspaceId: string,
    categoryId: string,
    title: string,
  ): Promise<Page> {
    const pages = await db.pages
      .where('categoryId')
      .equals(categoryId)
      .toArray()

    const maxOrder =
      pages.length > 0
        ? Math.max(...pages.map((page) => page.order))
        : -1

    const now = Date.now()

    const page: Page = {
      id: generateId('page'),
      workspaceId,
      categoryId,
      title: title.trim(),
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    }

    await db.pages.add(page)

    return page
  },

  async update(
    id: string,
    title: string,
  ): Promise<void> {
    await db.pages.update(id, {
      title: title.trim(),
      updatedAt: Date.now(),
    })
  },

  async remove(id: string): Promise<void> {
    await db.transaction(
      'rw',
      db.pages,
      db.blocks,
      async () => {
        await db.blocks
          .where('pageId')
          .equals(id)
          .delete()

        await db.pages.delete(id)
      },
    )
  },
}