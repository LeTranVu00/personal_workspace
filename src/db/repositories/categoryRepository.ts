import { db } from '../database'
import type { Category } from '../../types/category'
import { generateId } from '../../utils/generateId'

export const categoryRepository = {
  async create(
    workspaceId: string,
    name: string,
  ): Promise<Category> {
    const categories = await db.categories
      .where('workspaceId')
      .equals(workspaceId)
      .toArray()

    const maxOrder =
      categories.length > 0
        ? Math.max(...categories.map((category) => category.order))
        : -1

    const now = Date.now()

    const category: Category = {
      id: generateId('cat'),
      workspaceId,
      name: name.trim(),
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    }

    await db.categories.add(category)

    return category
  },

  async update(
    id: string,
    name: string,
  ): Promise<void> {
    await db.categories.update(id, {
      name: name.trim(),
      updatedAt: Date.now(),
    })
  },

  async remove(id: string): Promise<void> {
    await db.transaction(
      'rw',
      db.categories,
      db.pages,
      db.blocks,
      async () => {
        const pages = await db.pages
          .where('categoryId')
          .equals(id)
          .toArray()

        const pageIds = pages.map((page) => page.id)

        if (pageIds.length > 0) {
          const deletedPageIds = new Set(pageIds)
          const relatedPages = (await db.pages.toArray()).filter((page) => !deletedPageIds.has(page.id))

          await Promise.all(
            relatedPages
              .filter((page) => (page.relatedPageIds ?? []).some((relatedId) => deletedPageIds.has(relatedId)))
              .map((page) =>
                db.pages.update(page.id, {
                  relatedPageIds: (page.relatedPageIds ?? []).filter((relatedId) => !deletedPageIds.has(relatedId)),
                  updatedAt: Date.now(),
                }),
              ),
          )
        }

        if (pageIds.length > 0) {
          await db.blocks
            .where('pageId')
            .anyOf(pageIds)
            .delete()
        }

        await db.pages
          .where('categoryId')
          .equals(id)
          .delete()

        await db.categories.delete(id)
      },
    )
  },
}