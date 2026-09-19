import type { TemplateSchema } from '../types/schema.ts'

/**
 * 表格。为了不引入嵌套的行列编辑器，表头与数据行用紧凑文本输入：
 * 表头按逗号分隔，数据行每行一条记录、列之间用竖线分隔。
 * 表格样式只用横线，与样板一致。
 */
export const TableSchema = {
  name: 'Table',
  label: '表格',
  group: '数据',
  fields: [
    { key: 'caption', label: '表格标题', type: 'text' },
    { key: 'headers', label: '表头', type: 'text', hint: '用逗号分隔列名，例如：书名,成书年代,卷数' },
    {
      key: 'rows',
      label: '数据行',
      type: 'code',
      required: true,
      hint: '每行一条记录，列之间用竖线分隔，例如：梦溪笔谈|约1088年|26卷'
    }
  ]
} satisfies TemplateSchema
