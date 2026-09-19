import type { TemplateSchema } from '../types/schema.ts'

/** 引用：引文加出处，出处显示在右下角。 */
export const QuoteSchema = {
  name: 'Quote',
  label: '引用',
  group: '文本',
  fields: [
    { key: 'text', label: '引文', type: 'richtext', required: true },
    { key: 'source', label: '出处', type: 'text' }
  ]
} satisfies TemplateSchema
