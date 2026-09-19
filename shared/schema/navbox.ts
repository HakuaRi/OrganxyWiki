import type { TemplateSchema } from '../types/schema.ts'

/** 导航盒的一个分组：一个分组标签加一串链接。 */
export const NavboxGroupSchema = {
  name: 'NavboxGroup',
  label: '导航分组',
  group: '结构',
  fields: [
    { key: 'label', label: '分组标签', type: 'text', required: true },
    {
      key: 'links',
      label: '链接',
      type: 'richtext',
      required: true,
      hint: '用顿号分隔；每项写成 [[目标|显示文字]]，例如 [[meng-xi-bi-tan|梦溪笔谈]]'
    }
  ]
} satisfies TemplateSchema

/**
 * 导航盒。样板里是多行分组的样子，所以除了 plan.md 2.3 写的一条链接列表，
 * 还额外支持分组；两者都留空时只显示标题。
 */
export const NavboxSchema = {
  name: 'Navbox',
  label: '导航盒',
  group: '结构',
  fields: [
    { key: 'title', label: '标题', type: 'text', required: true },
    {
      key: 'links',
      label: '单行链接',
      type: 'richtext',
      hint: '用顿号分隔；填了分组就留空'
    },
    {
      key: 'groups',
      label: '分组',
      type: 'template-list',
      item: 'NavboxGroup',
      itemFields: NavboxGroupSchema.fields
    }
  ]
} satisfies TemplateSchema
