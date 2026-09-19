import type { TemplateSchema } from '../types/schema.ts'

/**
 * 图片。三种对齐方式与样板一致：
 * 随流（默认，居中带图注）、左浮动、右浮动，浮动时文字跨行环绕。
 */
export const ImageSchema = {
  name: 'Image',
  label: '图片',
  group: '媒体',
  fields: [
    {
      key: 'src',
      label: '图片',
      type: 'image',
      required: true,
      hint: '站内路径以 / 开头，例如 /media/placeholder.svg'
    },
    { key: 'caption', label: '图注', type: 'text' },
    { key: 'width', label: '显示宽度', type: 'text', hint: '留空自适应，例如 380 或 60%' },
    { key: 'align', label: '对齐', type: 'select', options: ['随流', '左浮动', '右浮动'], default: '随流' }
  ]
} satisfies TemplateSchema
