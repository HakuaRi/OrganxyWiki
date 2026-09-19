import type { TemplateSchema } from '../types/schema.ts'

/** 章节标题：层级只开放 2 到 4，页面标题由页面本身提供。 */
export const HeadingSchema = {
  name: 'Heading',
  label: '章节标题',
  group: '文本',
  fields: [
    { key: 'level', label: '层级', type: 'select', options: ['2', '3', '4'], default: '2' },
    { key: 'text', label: '标题文字', type: 'text', required: true }
  ]
} satisfies TemplateSchema
