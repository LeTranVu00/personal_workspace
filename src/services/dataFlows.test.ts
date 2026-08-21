import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db/database'
import { pageRepository } from '../db/repositories/pageRepository'
import { categoryRepository } from '../db/repositories/categoryRepository'
import { backupService } from './backupService'

const workspaceId = 'test-workspace'
const categoryId = 'test-category'

async function clearDatabase() {
  await db.transaction('rw', db.workspaces, db.categories, db.pages, db.blocks, async () => {
    await db.blocks.clear()
    await db.pages.clear()
    await db.categories.clear()
    await db.workspaces.clear()
  })
}

describe('local data flows', () => {
  afterEach(async () => {
    await clearDatabase()
  })

  it('creates the next daily recurring task when completed', async () => {
    const dueDate = new Date('2026-08-21T23:59:59').getTime()
    const page = await pageRepository.create(workspaceId, categoryId, 'Daily review', {
      type: 'task',
      recurrence: 'daily',
      dueDate,
    })

    const nextPage = await pageRepository.complete(page.id)
    const completedPage = await db.pages.get(page.id)

    expect(completedPage?.status).toBe('done')
    expect(nextPage?.title).toBe('Daily review')
    expect(nextPage?.status).toBe('active')
    expect(nextPage?.recurrence).toBe('daily')
    expect(nextPage?.dueDate).toBe(new Date('2026-08-22T23:59:59').getTime())
  })

  it('exports and restores workspace data', async () => {
    await db.workspaces.add({
      id: workspaceId,
      name: 'Test workspace',
      createdAt: 1,
      updatedAt: 1,
    })
    await db.categories.add({
      id: categoryId,
      workspaceId,
      name: 'Test category',
      order: 0,
      createdAt: 1,
      updatedAt: 1,
    })
    await pageRepository.create(workspaceId, categoryId, 'Backup page', { type: 'note' })

    const backup = await backupService.create()
    await clearDatabase()
    await backupService.restore(backup)

    expect(await db.workspaces.count()).toBe(1)
    expect(await db.categories.count()).toBe(1)
    expect(await db.pages.count()).toBe(1)
    expect((await db.pages.toArray())[0].title).toBe('Backup page')
  })

  it('rejects invalid backup files without changing data', async () => {
    await db.workspaces.add({
      id: workspaceId,
      name: 'Protected workspace',
      createdAt: 1,
      updatedAt: 1,
    })

    await expect(backupService.restore({ format: 'invalid' })).rejects.toThrow()
    expect(await db.workspaces.count()).toBe(1)
    expect((await db.workspaces.get(workspaceId))?.name).toBe('Protected workspace')
  })

  it('keeps Page relationships symmetric and cleans them on deletion', async () => {
    const firstPage = await pageRepository.create(workspaceId, categoryId, 'First page')
    const secondPage = await pageRepository.create(workspaceId, categoryId, 'Second page')

    await pageRepository.setRelation(firstPage.id, secondPage.id, true)
    expect((await db.pages.get(firstPage.id))?.relatedPageIds).toContain(secondPage.id)
    expect((await db.pages.get(secondPage.id))?.relatedPageIds).toContain(firstPage.id)

    await pageRepository.remove(secondPage.id)
    expect((await db.pages.get(firstPage.id))?.relatedPageIds).not.toContain(secondPage.id)
  })

  it('cleans related Page ids when deleting a category', async () => {
    const firstPage = await pageRepository.create(workspaceId, categoryId, 'First page')
    const secondCategoryId = 'second-category'
    await db.categories.add({
      id: secondCategoryId,
      workspaceId,
      name: 'Second category',
      order: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    const secondPage = await pageRepository.create(workspaceId, secondCategoryId, 'Second page')

    await pageRepository.setRelation(firstPage.id, secondPage.id, true)
    await categoryRepository.remove(categoryId)

    expect((await db.pages.get(secondPage.id))?.relatedPageIds).not.toContain(firstPage.id)
  })
})
