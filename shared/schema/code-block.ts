import type { TemplateSchema } from '../types/schema.ts'

/** 代码块：语言字段只用于将来的高亮，当前按灰阶等宽输出。 */
export const CodeBlockSchema = {
  name: 'CodeBlock',
  label: '代码块',
  group: '文本',
  fields: [
    { key: 'language', label: '语言', type: 'text', default: 'text' },
    { key: 'code', label: '代码', type: 'code', required: true }
  ]
} satisfies TemplateSchema
