/**
 * 本地草稿：按页面路径存在 localStorage，刷新不丢。
 * 存的是整页数据（元信息加块树），只在本机，不上传也不写进内容文件。
 */

import type { PageData } from '@wiki/shared/types/content.ts'

import type { EditNode } from './tree.ts'

interface Draft {
  savedAt: string
  page: PageData
  blocks: EditNode[]
}

const PREFIX = 'wiki-editor-draft:'

function keyOf(pagePath: string): string {
  return `${PREFIX}${pagePath}`
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** 写入草稿，返回是否成功。 */
export function writeDraft(pagePath: string, page: PageData, blocks: EditNode[]): boolean {
  const store = storage()
  if (store === null) return false
  const draft: Draft = { savedAt: new Date().toISOString(), page, blocks }
  try {
    store.setItem(keyOf(pagePath), JSON.stringify(draft))
    return true
  } catch {
    // 超出配额或隐私模式：忽略即可，不影响编辑。
    return false
  }
}

/** 读取草稿；没有或读坏了返回 null。 */
export function readDraft(pagePath: string): Draft | null {
  const store = storage()
  if (store === null) return null
  const raw = store.getItem(keyOf(pagePath))
  if (raw === null) return null
  try {
    const parsed = JSON.parse(raw) as Draft
    if (!Array.isArray(parsed.blocks)) return null
    return parsed
  } catch {
    return null
  }
}

/** 删除草稿。 */
export function clearDraft(pagePath: string): void {
  const store = storage()
  if (store === null) return
  store.removeItem(keyOf(pagePath))
}
