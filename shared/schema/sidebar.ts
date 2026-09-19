import type { TemplateSchema } from '../types/schema.ts'

/**
 * 侧边栏：可以容纳子块，渲染在正文的右侧浮动列里，
 * 与信息框一样要对正文让出空间。
 */
export const SidebarSchema = {
  name: 'Sidebar',
  label: '侧边栏',
  group: '结构',
  container: true,
  fields: [{ key: 'title', label: '标题', type: 'text', required: true }]
} satisfies TemplateSchema
