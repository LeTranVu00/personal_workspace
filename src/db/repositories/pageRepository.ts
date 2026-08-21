import { db } from '../database'
import type { Page, PagePriority, PageRecurrence, PageStatus, PageType } from '../../types/page'
import { generateId } from '../../utils/generateId'

const normalizePageTitle = (title: string): string => {
  const plainText = title.replace(/<[^>]+>/g, '').trim()
  return plainText || 'Trang không có tiêu đề'
}

const normalizeTags = (tags?: string[]): string[] =>
  Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 6),
    ),
  )

const normalizeRelatedPageIds = (pageIds?: string[]): string[] =>
  Array.from(new Set((pageIds ?? []).filter(Boolean))).slice(0, 20)

export const pageRepository = {
  async create(
    workspaceId: string,
    categoryId: string,
    title: string,
    options: {
      type?: PageType
      status?: PageStatus
      priority?: PagePriority
      dueDate?: number
      recurrence?: PageRecurrence
      relatedPageIds?: string[]
      tags?: string[]
      pinned?: boolean
    } = {},
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
      title: normalizePageTitle(title),
      type: options.type ?? 'note',
      status: options.status ?? 'active',
      priority: options.priority ?? 'normal',
      ...(options.dueDate !== undefined && { dueDate: options.dueDate }),
      ...(options.recurrence !== undefined && { recurrence: options.recurrence }),
      relatedPageIds: normalizeRelatedPageIds(options.relatedPageIds),
      tags: normalizeTags(options.tags),
      pinned: options.pinned ?? false,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    }

    await db.pages.add(page)

    return page
  },

  async update(
    id: string,
    updates: Partial<Pick<Page, 'title' | 'type' | 'status' | 'priority' | 'reminderEnabled' | 'relatedPageIds' | 'tags' | 'pinned'>> & {
      dueDate?: number | null
      reminderAt?: number | null
      recurrence?: PageRecurrence | null
    },
  ): Promise<void> {
    await db.pages.update(id, {
      ...(updates.title !== undefined && { title: normalizePageTitle(updates.title) }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.dueDate !== undefined && { dueDate: updates.dueDate ?? undefined }),
      ...(updates.reminderAt !== undefined && { reminderAt: updates.reminderAt ?? undefined }),
      ...(updates.reminderEnabled !== undefined && { reminderEnabled: updates.reminderEnabled }),
      ...(updates.recurrence !== undefined && { recurrence: updates.recurrence ?? undefined }),
      ...(updates.relatedPageIds !== undefined && {
        relatedPageIds: normalizeRelatedPageIds(updates.relatedPageIds),
      }),
      ...(updates.tags !== undefined && { tags: normalizeTags(updates.tags) }),
      ...(updates.pinned !== undefined && { pinned: updates.pinned }),
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

        const relatedPages = (await db.pages.toArray()).filter((page) =>
          (page.relatedPageIds ?? []).includes(id),
        )

        await Promise.all(
          relatedPages.map((page) =>
            db.pages.update(page.id, {
              relatedPageIds: (page.relatedPageIds ?? []).filter((pageId) => pageId !== id),
              updatedAt: Date.now(),
            }),
          ),
        )

        await db.pages.delete(id)
      },
    )
  },

  async setRelation(pageId: string, relatedPageId: string, connected: boolean): Promise<void> {
    if (pageId === relatedPageId) return

    await db.transaction('rw', db.pages, async () => {
      const [page, relatedPage] = await Promise.all([
        db.pages.get(pageId),
        db.pages.get(relatedPageId),
      ])

      if (!page || !relatedPage) return

      const nextPageIds = connected
        ? [...(page.relatedPageIds ?? []), relatedPageId]
        : (page.relatedPageIds ?? []).filter((id) => id !== relatedPageId)
      const nextRelatedPageIds = connected
        ? [...(relatedPage.relatedPageIds ?? []), pageId]
        : (relatedPage.relatedPageIds ?? []).filter((id) => id !== pageId)

      await Promise.all([
        db.pages.update(pageId, {
          relatedPageIds: normalizeRelatedPageIds(nextPageIds),
          updatedAt: Date.now(),
        }),
        db.pages.update(relatedPageId, {
          relatedPageIds: normalizeRelatedPageIds(nextRelatedPageIds),
          updatedAt: Date.now(),
        }),
      ])
    })
  },

  async moveToCategory(ids: string[], categoryId: string): Promise<void> {
    if (ids.length === 0) return

    await db.transaction('rw', db.pages, async () => {
      await Promise.all(
        ids.map((id) =>
          db.pages.update(id, {
            categoryId,
            updatedAt: Date.now(),
          }),
        ),
      )
    })
  },

  async complete(id: string): Promise<Page | null> {
    const page = await db.pages.get(id)
    if (!page) return null

    await pageRepository.update(id, { status: 'done' })
    if (!page.recurrence) return null

    const nextDueDate = page.dueDate ? new Date(page.dueDate) : new Date()
    if (page.recurrence === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1)
    if (page.recurrence === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7)
    if (page.recurrence === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1)

    return pageRepository.create(page.workspaceId, page.categoryId, page.title, {
      type: page.type,
      status: 'active',
      priority: page.priority,
      dueDate: nextDueDate.getTime(),
      recurrence: page.recurrence,
      tags: page.tags,
    })
  },
}