/**
 * 从块树里抽取纯文本与链接目标。
 *
 * 用途：搜索索引、最近更改摘要、反链索引、以及判断红链。
 * 代码块与自定义 HTML 不参与抽取：里面出现的双方括号是代码，不是链接。
 */

import type { Block } from './types/content.ts'
import { records, splitRows, str } from './params.ts'
import { inlineLinkTargets, inlineToPlainText, parseInline } from './richtext/parse.ts'

/** 单个块的可读文本。 */
export function blockText(block: Block): string {
  const params = block.params
  switch (block.type) {
    case 'Paragraph':
    case 'Quote':
    case 'Notice':
    case 'Heading':
      return inlineToPlainText(parseInline(str(params.text)))
    case 'List':
      return str(params.items)
        .split(/\r?\n/)
        .map((line) => inlineToPlainText(parseInline(line.trim())))
        .filter((line) => line !== '')
        .join(' ')
    case 'CodeBlock':
      return str(params.code)
    case 'Table':
      return [
        str(params.caption),
        str(params.headers),
        splitRows(str(params.rows))
          .map((row) => row.join(' '))
          .join(' ')
      ]
        .filter((part) => part !== '')
        .join(' ')
    case 'Infobox':
      return [
        str(params.name),
        str(params.subtitle),
        str(params.caption),
        records(params.rows)
          .map((row) => `${str(row.label)} ${inlineToPlainText(parseInline(str(row.value)))}`)
          .join(' ')
      ]
        .filter((part) => part !== '')
        .join(' ')
    case 'Navbox':
      return [
        str(params.title),
        str(params.links),
        records(params.groups)
          .map((group) => `${str(group.label)} ${inlineToPlainText(parseInline(str(group.links)))}`)
          .join(' ')
      ]
        .filter((part) => part !== '')
        .join(' ')
    case 'Sidebar':
    case 'Collapsible':
      return str(params.title)
    case 'Image':
      return str(params.caption)
    case 'Link':
      return str(params.text) || str(params.target)
    case 'RawHTML':
      return ''
    default:
      return ''
  }
}

/** 整棵块树的纯文本，空白已归一。 */
export function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = []
  for (const block of blocks) {
    const text = blockText(block)
    if (text !== '') parts.push(text)
    if (block.children.length > 0) parts.push(blocksToPlainText(block.children))
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/** 块树里出现的全部站内链接目标（去重前的原始顺序）。 */
export function blockLinkTargets(block: Block): string[] {
  if (block.type === 'CodeBlock' || block.type === 'RawHTML') return []

  const out: string[] = []
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      for (const link of inlineLinkTargets(parseInline(value))) {
        if (!link.external) out.push(link.target)
      }
      return
    }
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (value !== null && typeof value === 'object') {
      Object.values(value).forEach(visit)
    }
  }

  visit(block.params)
  for (const child of block.children) out.push(...blockLinkTargets(child))
  return out
}
