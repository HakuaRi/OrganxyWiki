/**
 * 模板 Schema 的类型定义。
 *
 * Schema 是编辑器生成表单、展示端校验数据的共同依据。
 * 唯一事实源是 shared/schema/ 下的 TypeScript 代码（见 plan.md 8.2）。
 */

import type { Block } from './content'

/** Schema 支持的字段类型，对应 plan.md 2.2。 */
export type FieldType =
  | 'text'
  | 'richtext'
  | 'image'
  | 'select'
  | 'boolean'
  | 'code'
  | 'template-list'
  | 'block-list'

/** 字段定义。 */
export interface FieldSchema {
  /** 参数键名。 */
  key: string
  /** 表单里显示的中文标签。 */
  label: string
  type: FieldType
  required?: boolean
  /** select 的候选项。 */
  options?: string[]
  /** 字段默认值。 */
  default?: unknown
  /** 表单里的补充说明。 */
  hint?: string
  /** template-list 指向的子模板名。 */
  item?: string
  /** template-list 每一行的字段定义。 */
  itemFields?: FieldSchema[]
}

/** 模板定义。 */
export interface TemplateSchema {
  /** 与块的 type 一致。 */
  name: string
  /** 中文名，显示在内容块篮子里。 */
  label: string
  /** 篮子里的分组。 */
  group: '文本' | '结构' | '媒体' | '数据' | '高级'
  /** 是否可以容纳子块。 */
  container?: boolean
  /** 危险块，编辑器需要用警示色标出。 */
  dangerous?: boolean
  fields: FieldSchema[]
}

/** 按类型取 Schema 的接口。 */
export type TemplateRegistry = Record<string, TemplateSchema>

/** 校验结果。 */
export interface ValidationIssue {
  /** 出问题的块的 id（编辑器内才有）。 */
  blockId?: string
  /** 参数键名，页面级问题为空。 */
  key?: string
  message: string
}

/** 校验一个块树，返回全部问题。 */
export type ValidateBlocks = (blocks: Block[]) => ValidationIssue[]
