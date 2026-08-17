import { db } from '../database'
import type { Workspace } from '../../types/workspace'
import { generateId } from '../../utils/generateId'

export const workspaceRepository = {
  async create(name: string): Promise<Workspace> {
    const now = Date.now()

    const workspace: Workspace = {
      id: generateId('ws'),
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
    }

    await db.workspaces.add(workspace)

    return workspace
  },

  async getAll(): Promise<Workspace[]> {
    return db.workspaces.orderBy('createdAt').toArray()
  },

  async update(id: string, name: string): Promise<void> {
    await db.workspaces.update(id, {
      name: name.trim(),
      updatedAt: Date.now(),
    })
  },

  async remove(id: string): Promise<void> {
    await db.transaction(
      'rw',
      db.workspaces,
      db.categories,
      db.pages,
      db.blocks,
      async () => {
        const pages = await db.pages
          .where('workspaceId')
          .equals(id)
          .toArray()

        const pageIds = pages.map((page) => page.id)

        if (pageIds.length > 0) {
          await db.blocks
            .where('pageId')
            .anyOf(pageIds)
            .delete()
        }

        await db.pages
          .where('workspaceId')
          .equals(id)
          .delete()

        await db.categories
          .where('workspaceId')
          .equals(id)
          .delete()

        await db.workspaces.delete(id)
      },
    )
  },
}