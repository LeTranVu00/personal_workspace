export type PageType = 'note' | 'task' | 'list' | 'draft' | 'idea' | 'journal' | 'checklist'
export type PageStatus = 'active' | 'doing' | 'done' | 'archived'
export type PagePriority = 'low' | 'normal' | 'high'
export type PageRecurrence = 'daily' | 'weekly' | 'monthly'

export interface Page {
  id: string
  workspaceId: string
  categoryId: string
  title: string
  type?: PageType
  status?: PageStatus
  priority?: PagePriority
  dueDate?: number
  recurrence?: PageRecurrence
  relatedPageIds?: string[]
  tags?: string[]
  pinned?: boolean
  order: number
  createdAt: number
  updatedAt: number
}