import type { TemplateSchema } from '../types/schema.ts'

/** 站内链接：作为独立块使用时渲染成一段只含链接的段落。 */
export const LinkSchema = {
  name: 'Link',
  label: '站内链接',
  group: '媒体',
  fields: [
    { key: 'target', label: '目标页面', type: 'text', required: true, hint: '页面 slug，例如 meng-xi-bi-tan' },
    { key: 'text', label: '显示文字', type: 'text', hint: '留空则用目标页面的标题' }
  ]
} satisfies TemplateSchema
