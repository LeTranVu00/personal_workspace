import { db } from '../db/database'
import type { Workspace } from '../types/workspace'
import type { Category } from '../types/category'
import type { Page } from '../types/page'
import type { Block } from '../types/block'

export interface WorkspaceBackup {
  format: 'personal-workspace-backup'
  version: 1
  exportedAt: string
  data: {
    workspaces: Workspace[]
    categories: Category[]
    pages: Page[]
    blocks: Block[]
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isEntityArray = (value: unknown): value is Array<{ id: string }> =>
  Array.isArray(value) && value.every((item) => isRecord(item) && typeof item.id === 'string' && item.id.length > 0)

export const backupService = {
  async create(): Promise<WorkspaceBackup> {
    const [workspaces, categories, pages, blocks] = await Promise.all([
      db.workspaces.toArray(),
      db.categories.toArray(),
      db.pages.toArray(),
      db.blocks.toArray(),
    ])

    return {
      format: 'personal-workspace-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { workspaces, categories, pages, blocks },
    }
  },

  async restore(input: unknown): Promise<void> {
    if (
      !isRecord(input) ||
      input.format !== 'personal-workspace-backup' ||
      input.version !== 1 ||
      !isRecord(input.data) ||
      !isEntityArray(input.data.workspaces) ||
      !isEntityArray(input.data.categories) ||
      !isEntityArray(input.data.pages) ||
      !isEntityArray(input.data.blocks)
    ) {
      throw new Error('File backup không đúng định dạng Personal Workspace.')
    }

    const data = input.data as WorkspaceBackup['data']

    await db.transaction('rw', db.workspaces, db.categories, db.pages, db.blocks, async () => {
      await db.blocks.clear()
      await db.pages.clear()
      await db.categories.clear()
      await db.workspaces.clear()

      if (data.workspaces.length > 0) await db.workspaces.bulkAdd(data.workspaces)
      if (data.categories.length > 0) await db.categories.bulkAdd(data.categories)
      if (data.pages.length > 0) await db.pages.bulkAdd(data.pages)
      if (data.blocks.length > 0) await db.blocks.bulkAdd(data.blocks)
    })
  },
}
