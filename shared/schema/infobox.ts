import type { TemplateSchema } from '../types/schema.ts'

/** 信息行：只作为信息框内部的子模板存在，不会单独出现在内容块篮子里。 */
export const InfoboxRowSchema = {
  name: 'InfoboxRow',
  label: '信息行',
  group: '结构',
  fields: [
    { key: 'label', label: '标签', type: 'text', required: true },
    { key: 'value', label: '值', type: 'richtext' }
  ]
} satisfies TemplateSchema

/**
 * 信息框。渲染在正文的右侧浮动列里，正文段落环绕并为其让出空间，
 * 带边框与底色的块一律清除右侧浮动（见 plan.md 8.1 让位规则）。
 */
export const InfoboxSchema = {
  name: 'Infobox',
  label: '信息框',
  group: '结构',
  fields: [
    { key: 'name', label: '名称', type: 'text', required: true },
    { key: 'subtitle', label: '副标题', type: 'text' },
    { key: 'image', label: '图片', type: 'image' },
    { key: 'caption', label: '图片说明', type: 'text' },
    {
      key: 'rows',
      label: '信息行',
      type: 'template-list',
      item: 'InfoboxRow',
      itemFields: InfoboxRowSchema.fields
    }
  ]
} satisfies TemplateSchema
