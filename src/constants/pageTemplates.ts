import type { PagePriority, PageStatus, PageType } from '../types/page'

export type PageTemplateKey = 'note' | 'task' | 'list' | 'idea' | 'journal' | 'checklist'

export interface PageTemplate {
  key: PageTemplateKey
  label: string
  description: string
  type: PageType
  status: PageStatus
  priority: PagePriority
  defaultTags: string[]
}

export const pageTemplates: PageTemplate[] = [
  {
    key: 'note',
    label: 'Note',
    description: 'Ghi chép nhanh',
    type: 'note',
    status: 'active',
    priority: 'normal',
    defaultTags: ['note'],
  },
  {
    key: 'task',
    label: 'Task',
    description: 'Việc cần xử lý',
    type: 'task',
    status: 'doing',
    priority: 'high',
    defaultTags: ['task'],
  },
  {
    key: 'list',
    label: 'List',
    description: 'Checklist / danh sách',
    type: 'list',
    status: 'active',
    priority: 'normal',
    defaultTags: ['list'],
  },
  {
    key: 'idea',
    label: 'Idea',
    description: 'Ý tưởng mới',
    type: 'idea',
    status: 'active',
    priority: 'normal',
    defaultTags: ['idea'],
  },
  {
    key: 'journal',
    label: 'Journal',
    description: 'Nhật ký / reflection',
    type: 'journal',
    status: 'active',
    priority: 'normal',
    defaultTags: ['journal'],
  },
  {
    key: 'checklist',
    label: 'Checklist',
    description: 'Việc cần đánh dấu',
    type: 'checklist',
    status: 'active',
    priority: 'normal',
    defaultTags: ['checklist'],
  },
]

export const getPageTemplate = (key: PageTemplateKey): PageTemplate =>
  pageTemplates.find((template) => template.key === key) ?? pageTemplates[0]
