import type {
  BlockType,
  TableCellType,
} from '../content/contentRegistry'

export interface TextBlockContent {
  text: string
}

export interface HeadingBlockContent {
  text: string
}

export interface NoteBlockContent {
  text: string
}

export interface QuoteBlockContent {
  text: string
}

export interface CodeBlockContent {
  code: string
  language: string
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface ChecklistBlockContent {
  items: ChecklistItem[]
}

export interface LinkValue {
  label: string
  url: string
}

export interface LinkBlockContent
  extends LinkValue {}

export type TableCellValue =
  | string
  | number
  | boolean
  | string[]
  | LinkValue
  | ChecklistItem[]
  | null

export interface TableColumn {
  id: string

  name: string

  type: TableCellType

  options?: string[]

  width?: number
}

export interface TableRow {
  id: string

  cells: Record<
    string,
    TableCellValue
  >
}

export interface TableBlockContent {
  columns: TableColumn[]
  rows: TableRow[]
}

export type BlockContent =
  | TextBlockContent
  | HeadingBlockContent
  | NoteBlockContent
  | ChecklistBlockContent
  | LinkBlockContent
  | TableBlockContent
  | QuoteBlockContent
  | CodeBlockContent

export interface Block {
  id: string
  pageId: string

  type: BlockType

  content: BlockContent

  order: number

  createdAt: number
  updatedAt: number
}