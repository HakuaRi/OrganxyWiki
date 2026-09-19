import type { TemplateSchema } from '../types/schema.ts'

/**
 * 列表。每行一项，项里可以写双方括号站内链接。
 * 需要更细的行内排版（加粗等）也可以直接写在项里，走同一套富文本解析。
 */
export const ListSchema = {
  name: 'List',
  label: '列表',
  group: '文本',
  fields: [
    { key: 'style', label: '类型', type: 'select', options: ['无序', '有序'], default: '无序' },
    {
      key: 'items',
      label: '列表项',
      type: 'code',
      required: true,
      hint: '每行一项，例如：[[meng-xi-bi-tan|梦溪笔谈]]'
    }
  ]
} satisfies TemplateSchema
