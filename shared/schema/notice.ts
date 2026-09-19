import type { TemplateSchema } from '../types/schema.ts'

/**
 * 提示框。三种类型共用一套样式，靠左侧细条与图标区分：
 * info 用强调色，warning 用低饱和琥珀，error 用低饱和砖红。
 */
export const NoticeSchema = {
  name: 'Notice',
  label: '提示框',
  group: '数据',
  fields: [
    {
      key: 'type',
      label: '类型',
      type: 'select',
      options: ['info', 'warning', 'error'],
      default: 'info'
    },
    { key: 'text', label: '文字', type: 'richtext', required: true }
  ]
} satisfies TemplateSchema
