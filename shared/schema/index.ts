import type { Block, BlockType } from '../types/content.ts'
import type { FieldSchema, TemplateSchema } from '../types/schema.ts'

import { ParagraphSchema } from './paragraph.ts'
import { HeadingSchema } from './heading.ts'
import { ListSchema } from './list.ts'
import { QuoteSchema } from './quote.ts'
import { CodeBlockSchema } from './code-block.ts'
import { InfoboxSchema, InfoboxRowSchema } from './infobox.ts'
import { CollapsibleSchema } from './collapsible.ts'
import { NavboxSchema, NavboxGroupSchema } from './navbox.ts'
import { SidebarSchema } from './sidebar.ts'
import { ImageSchema } from './image.ts'
import { LinkSchema } from './link.ts'
import { NoticeSchema } from './notice.ts'
import { TableSchema } from './table.ts'
import { RawHtmlSchema } from './raw-html.ts'

/**
 * 模板注册表。这是 Schema 的唯一事实源（见 plan.md 8.2）：
 * 编辑器据此生成表单，构建期据此校验内容，展示端据此分发渲染组件。
 * 这里的键必须覆盖 BlockType 的全部取值，缺一个会在这里报类型错误。
 */
export const TEMPLATES = {
  Paragraph: ParagraphSchema,
  Heading: HeadingSchema,
  List: ListSchema,
  Quote: QuoteSchema,
  CodeBlock: CodeBlockSchema,
  Infobox: InfoboxSchema,
  Collapsible: CollapsibleSchema,
  Navbox: NavboxSchema,
  Sidebar: SidebarSchema,
  Image: ImageSchema,
  Link: LinkSchema,
  Notice: NoticeSchema,
  Table: TableSchema,
  RawHTML: RawHtmlSchema
} satisfies Record<BlockType, TemplateSchema>

/** 只作为其它模板内部的子项存在，不出现在内容块篮子里。 */
export const SUBTEMPLATES = {
  InfoboxRow: InfoboxRowSchema,
  NavboxGroup: NavboxGroupSchema
} satisfies Record<string, TemplateSchema>

/** 内容块篮子的分组顺序。 */
export const GROUPS = ['文本', '结构', '媒体', '数据', '高级'] as const
export type TemplateGroup = (typeof GROUPS)[number]

/** 按类型名取 Schema。 */
export function getSchema(name: string): TemplateSchema | undefined {
  const all: Record<string, TemplateSchema> = { ...TEMPLATES, ...SUBTEMPLATES }
  return all[name]
}

/** 顶层模板（不含只作子项用的），按篮子分组。 */
export function templatesByGroup(): Array<{ group: TemplateGroup; items: TemplateSchema[] }> {
  const list = Object.values(TEMPLATES) as TemplateSchema[]
  return GROUPS.map((group) => ({
    group,
    items: list.filter((schema) => schema.group === group)
  })).filter((entry) => entry.items.length > 0)
}

/** 该类型是否允许容纳子块。 */
export function isContainer(name: string): boolean {
  return getSchema(name)?.container === true
}

/** 字段的初始值。 */
function fieldDefault(field: FieldSchema): unknown {
  if (field.default !== undefined) return field.default
  switch (field.type) {
    case 'select':
      return field.options?.[0] ?? ''
    case 'boolean':
      return false
    case 'template-list':
      return []
    default:
      return ''
  }
}

/** 按 Schema 生成一份空的参数表。 */
export function defaultParams(schema: TemplateSchema): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const field of schema.fields) params[field.key] = fieldDefault(field)
  return params
}

/** 新建一个空块。id 由编辑器负责添加，不写入内容文件。 */
export function createBlock(type: BlockType, params?: Record<string, unknown>): Block {
  const schema = TEMPLATES[type]
  return {
    type,
    params: { ...defaultParams(schema), ...(params ?? {}) },
    children: []
  }
}
