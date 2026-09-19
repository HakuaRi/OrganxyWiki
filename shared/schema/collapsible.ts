import type { TemplateSchema } from '../types/schema.ts'

/** 折叠框：可以容纳子块，用原生 details 实现，无脚本依赖。 */
export const CollapsibleSchema = {
  name: 'Collapsible',
  label: '折叠框',
  group: '结构',
  container: true,
  fields: [
    { key: 'title', label: '标题', type: 'text', required: true },
    { key: 'expanded', label: '默认展开', type: 'boolean', default: true }
  ]
} satisfies TemplateSchema
