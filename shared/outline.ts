/**
 * 目录大纲：从块树里抽出章节标题，生成编号与锚点。
 *
 * 只统计顶层块里的标题。折叠框、侧边栏内部的标题不进目录，
 * 这与样板的行为一致（样板里的侧边栏分节标题不出现在目录里）。
 * 锚点 id 与 BlockRenderer 传给块的路由路径一致，所以能直接跳转。
 */

import type { Block } from './types/content.ts'
import { str } from './params.ts'
import { inlineToPlainText, parseInline } from './richtext/parse.ts'

export interface OutlineItem {
  id: string
  label: string
  /** 实际标题层级，2 到 4。 */
  level: number
  /** 显示的编号，例如 1、1.2。 */
  number: string
}

/** 顶层第 index 个块的标题锚点 id。 */
export function headingId(index: number): string {
  return `sec-${index}`
}

/** 生成大纲。 */
export function buildOutline(blocks: Block[]): OutlineItem[] {
  const items: OutlineItem[] = []
  const counters = [0, 0, 0]

  blocks.forEach((block, index) => {
    if (block.type !== 'Heading') return

    const declared = Number.parseInt(str(block.params.level, '2'), 10)
    const level = Number.isNaN(declared) ? 2 : Math.min(Math.max(declared, 2), 4)
    const depth = level - 2

    counters[depth] += 1
    for (let i = depth + 1; i < counters.length; i++) counters[i] = 0

    const label = inlineToPlainText(parseInline(str(block.params.text))).trim()
    if (label === '') return

    items.push({
      id: headingId(index),
      label,
      level,
      number: counters.slice(0, depth + 1).join('.')
    })
  })

  return items
}
