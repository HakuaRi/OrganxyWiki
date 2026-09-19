/**
 * 编辑器内部的块树类型与纯函数工具。
 *
 * 与内容文件里的 Block 相比，编辑期的节点保证有 id（仅编辑器使用，不写入文件）。
 * 所有对树的查找、移动、克隆都走这里，便于单测。
 */

import type { Block } from '@wiki/shared/types/content.ts'

/** 编辑期的块节点：一定有 id。 */
export interface EditNode extends Block {
  id: string
  children: EditNode[]
}

/** 在树里定位一个节点。 */
export interface Entry {
  node: EditNode
  list: EditNode[]
  index: number
  parentId: string
}

let counter = 0

/** 生成一个编辑期 id。 */
export function nextId(): string {
  counter += 1
  return `n${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * 克隆一份普通数据。
 *
 * structuredClone 不接受 Vue 的响应式代理（会抛 DataCloneError），
 * 而调用方有时拿到代理有时拿到普通对象，所以先试结构化克隆，
 * 失败再退回 JSON 往返：编辑器里的数据都是纯 JSON，这条路安全。
 */
export function clone<T>(value: T): T {
  try {
    return structuredClone(value) as T
  } catch {
    return JSON.parse(JSON.stringify(value)) as T
  }
}

/** 把内容文件里的块树转成编辑期节点树，补齐 id。 */
export function toEditNodes(blocks: Block[] | undefined): EditNode[] {
  return (blocks ?? []).map((block) => ({
    id: nextId(),
    type: block.type,
    params: clone(block.params ?? {}),
    children: toEditNodes(block.children),
    ...(block._raw === undefined ? {} : { _raw: clone(block._raw) })
  }))
}

/** 写回内容文件前清理：去掉 id，去掉空的 _raw。 */
export function toContentBlocks(blocks: EditNode[]): Block[] {
  return blocks.map((node) => {
    const raw = node._raw
    const keepRaw = raw !== undefined && (raw.css.trim() !== '' || raw.js.trim() !== '')
    return {
      type: node.type,
      params: clone(node.params),
      children: toContentBlocks(node.children),
      ...(keepRaw ? { _raw: clone(raw) } : {})
    }
  })
}

/** 在树里按 id 查找。 */
export function findEntry(blocks: EditNode[], id: string, parentId = 'root'): Entry | null {
  for (let index = 0; index < blocks.length; index++) {
    const node = blocks[index]
    if (node.id === id) return { node, list: blocks, index, parentId }
    const found = findEntry(node.children, id, node.id)
    if (found !== null) return found
  }
  return null
}

/** 取某个父级下的子块数组；root 表示顶层。 */
export function listOf(blocks: EditNode[], parentId: string): EditNode[] | null {
  if (parentId === 'root') return blocks
  const entry = findEntry(blocks, parentId)
  return entry === null ? null : entry.node.children
}

/** node 自身或它的子孙里是否有 id。 */
export function containsId(node: EditNode, id: string): boolean {
  if (node.id === id) return true
  return node.children.some((child) => containsId(child, id))
}

/** 统计整棵树的块数。 */
export function countBlocks(blocks: EditNode[]): number {
  return blocks.reduce((total, node) => total + 1 + countBlocks(node.children), 0)
}

/** 移动的结果，供调用方决定要不要提示。 */
export type MoveResult = 'ok' | 'missing' | 'into-self' | 'no-target'

/**
 * 把 id 对应的块移动到目标父级的第 index 位（原地修改）。
 *
 * 两条容易写错的规则都在这里：
 *   1. 不允许把块拖进自己的子孙里；
 *   2. 在同一个列表内往后移动时，目标下标要按「先移除再插入」修正一位。
 */
export function moveNode(
  blocks: EditNode[],
  id: string,
  parentId: string,
  index: number
): MoveResult {
  const entry = findEntry(blocks, id)
  if (entry === null) return 'missing'
  if (containsId(entry.node, parentId)) return 'into-self'

  const target = listOf(blocks, parentId)
  if (target === null) return 'no-target'

  let next = index
  if (entry.list === target && entry.index < index) next -= 1

  entry.list.splice(entry.index, 1)
  target.splice(Math.max(0, Math.min(next, target.length)), 0, entry.node)
  return 'ok'
}
