import Dexie, { type EntityTable } from 'dexie'

import type { Workspace } from '../types/workspace'
import type { Category } from '../types/category'
import type { Page } from '../types/page'
import type { Block } from '../types/block'

const db = new Dexie('PersonalWorkspaceDB') as Dexie & {
  workspaces: EntityTable<Workspace, 'id'>
  categories: EntityTable<Category, 'id'>
  pages: EntityTable<Page, 'id'>
  blocks: EntityTable<Block, 'id'>
}

db.version(1).stores({
  workspaces:
    'id, name, createdAt, updatedAt',

  categories:
    'id, workspaceId, name, order, createdAt, updatedAt',

  pages:
    'id, workspaceId, categoryId, type, status, priority, pinned, tags, title, order, createdAt, updatedAt',

  blocks:
    'id, pageId, type, order, createdAt, updatedAt',
})

export { db }