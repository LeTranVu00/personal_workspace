import type { LucideIcon } from 'lucide-react'

import {
  AlignLeft,
  CalendarDays,
  FileText,
  Hash,
  Heading,
  Link,
  ListChecks,
  ListFilter,
  NotepadText,
  Table2,
  Tags,
  ToggleLeft,
  Quote,
  Code,
} from 'lucide-react'

export type ContentContext =
  | 'block'
  | 'table-cell'

interface ContentDefinition {
  label: string
  description: string
  icon: LucideIcon

  contexts: readonly ContentContext[]

  blockDefault?: () => unknown
  cellDefault?: () => unknown

  hasOptions?: boolean
}

export const CONTENT_REGISTRY = {
  text: {
    label: 'Văn bản',
    description: 'Nội dung văn bản ngắn.',
    icon: FileText,

    contexts: [
      'block',
      'table-cell',
    ],

    blockDefault: () => ({
      text: '',
    }),

    cellDefault: () => '',
  },

  longText: {
    label: 'Văn bản dài',
    description: 'Nội dung nhiều dòng.',
    icon: AlignLeft,

    contexts: [
      'table-cell',
    ],

    cellDefault: () => '',
  },

  heading: {
    label: 'Tiêu đề',
    description: 'Tiêu đề phân chia nội dung.',
    icon: Heading,

    contexts: [
      'block',
    ],

    blockDefault: () => ({
      text: '',
    }),
  },

  note: {
    label: 'Ghi chú',
    description: 'Ghi chú hoặc thông tin quan trọng.',
    icon: NotepadText,

    contexts: [
      'block',
      'table-cell',
    ],

    blockDefault: () => ({
      text: '',
    }),

    cellDefault: () => '',
  },

  number: {
    label: 'Số',
    description: 'Giá trị dạng số.',
    icon: Hash,

    contexts: [
      'table-cell',
    ],

    cellDefault: () => 0,
  },

  checkbox: {
    label: 'Checkbox',
    description: 'Đúng / sai hoặc hoàn thành.',
    icon: ToggleLeft,

    contexts: [
      'table-cell',
    ],

    cellDefault: () => false,
  },

  select: {
    label: 'Lựa chọn',
    description: 'Chọn một giá trị.',
    icon: ListFilter,

    contexts: [
      'table-cell',
    ],

    cellDefault: () => '',

    hasOptions: true,
  },

  multiSelect: {
    label: 'Nhiều lựa chọn',
    description: 'Chọn nhiều giá trị.',
    icon: Tags,

    contexts: [
      'table-cell',
    ],

    cellDefault: () => [],

    hasOptions: true,
  },

  date: {
    label: 'Ngày',
    description: 'Ngày hoặc deadline.',
    icon: CalendarDays,

    contexts: [
      'table-cell',
    ],

    cellDefault: () => '',
  },

  link: {
    label: 'Liên kết',
    description: 'Website hoặc tài liệu.',
    icon: Link,

    contexts: [
      'block',
      'table-cell',
    ],

    blockDefault: () => ({
      label: '',
      url: '',
    }),

    cellDefault: () => ({
      label: '',
      url: '',
    }),
  },

  checklist: {
    label: 'Checklist',
    description: 'Danh sách việc cần làm.',
    icon: ListChecks,

    contexts: [
      'block',
      'table-cell',
    ],

    blockDefault: () => ({
      items: [],
    }),

    cellDefault: () => [],
  },

  table: {
    label: 'Bảng',
    description: 'Bảng dữ liệu động.',
    icon: Table2,

    contexts: [
      'block',
    ],

    blockDefault: () => ({
      columns: [],
      rows: [],
    }),
  },

  quote: {
    label: 'Trích dẫn',
    description: 'Đoạn trích dẫn nổi bật.',
    icon: Quote,

    contexts: [
      'block',
      'table-cell',
    ],

    blockDefault: () => ({
      text: '',
    }),

    cellDefault: () => '',
  },

  code: {
    label: 'Mã nguồn',
    description: 'Đoạn code có định dạng.',
    icon: Code,

    contexts: [
      'block',
    ],

    blockDefault: () => ({
      code: '',
      language: 'javascript',
    }),
  },
} as const satisfies Record<
  string,
  ContentDefinition
>

export type ContentType =
  keyof typeof CONTENT_REGISTRY

type Registry =
  typeof CONTENT_REGISTRY

export type ContentTypeFor<
  Context extends ContentContext,
> = {
  [Key in keyof Registry]:
    Context extends Registry[Key]['contexts'][number]
      ? Key
      : never
}[keyof Registry]

export type BlockType =
  ContentTypeFor<'block'>

export type TableCellType =
  ContentTypeFor<'table-cell'>

  export function getContentDefinitions(
  context: ContentContext,
) {
  return Object.entries(
    CONTENT_REGISTRY,
  )
    .filter(([, definition]) =>
      (
        definition.contexts as readonly ContentContext[]
      ).includes(context),
    )
    .map(([type, definition]) => ({
      type: type as ContentType,
      ...definition,
    }))
}

export function createDefaultBlockContent(
  type: BlockType,
) {
  const definition =
    CONTENT_REGISTRY[type] as ContentDefinition

  if (!definition.blockDefault) {
    throw new Error(
      `Content type "${type}" không hỗ trợ Block.`,
    )
  }

  return definition.blockDefault()
}

export function createDefaultCellValue(
  type: TableCellType,
) {
  const definition =
    CONTENT_REGISTRY[type] as ContentDefinition

  if (!definition.cellDefault) {
    throw new Error(
      `Content type "${type}" không hỗ trợ Table Cell.`,
    )
  }

  return definition.cellDefault()
}