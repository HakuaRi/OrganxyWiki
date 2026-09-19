import type { TemplateSchema } from '../types/schema.ts'

/**
 * 自定义 HTML，对应 plan.md 5.3 的第三层裸露接口。
 * 标记为危险块：编辑器用警示色标出，预览只显示源码不执行。
 */
export const RawHtmlSchema = {
  name: 'RawHTML',
  label: '自定义 HTML',
  group: '高级',
  dangerous: true,
  fields: [
    {
      key: 'html',
      label: 'HTML 源码',
      type: 'code',
      required: true,
      hint: '危险块：直接输出不做转义。只用在自己完全清楚内容来源的场合。'
    }
  ]
} satisfies TemplateSchema
