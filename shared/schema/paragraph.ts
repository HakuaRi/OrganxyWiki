import type { TemplateSchema } from '../types/schema.ts'

/** 段落：最基础的文本块，正文用 Markdown 子集。 */
export const ParagraphSchema = {
  name: 'Paragraph',
  label: '段落',
  group: '文本',
  fields: [
    {
      key: 'text',
      label: '正文',
      type: 'richtext',
      required: true,
      hint: '行内格式：三撇号为粗体，双方括号为站内链接，例如 [[梦溪笔谈]]'
    }
  ]
} satisfies TemplateSchema
