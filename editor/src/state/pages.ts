/**
 * 页面级操作：列表、打开、新建、重新载入、保存、删除、移动、丢弃草稿。
 *
 * 具体数据从哪来由 source.ts 决定（本地内容文件或 GitHub 仓库），
 * 这里只负责把结果落到编辑器状态上，并把各种失败翻译成提示。
 */

import { computed, ref, type ComputedRef } from 'vue'
import type { PageData } from '@wiki/shared/types/content.ts'

import { SOURCE_PAGES, emptyPage, nextEmptyPath } from '../data/pages.ts'
import { useEditor } from './editor.ts'
import { deletePage, listPages, readPage, renamePage, savePage } from './source.ts'
import type { PageEntry } from './source.ts'

const editor = useEditor()

const pageList = ref<PageEntry[]>([])
const listBusy = ref(false)
const listError = ref('')

/** 当前页面在列表里的标题，找不到就用编辑器里的标题。 */
export const currentTitle: ComputedRef<string> = computed(() => {
  const hit = pageList.value.find((entry) => entry.path === editor.pagePath.value)
  return hit?.title ?? editor.pageTitle.value
})

/** 刷新页面列表。 */
export async function refreshList(): Promise<void> {
  listBusy.value = true
  listError.value = ''
  try {
    pageList.value = await listPages()
  } catch (failure) {
    listError.value = (failure as Error).message
    pageList.value = []
  } finally {
    listBusy.value = false
  }
}

/** 打开一个页面：有草稿优先用草稿。 */
export async function openPage(path: string): Promise<void> {
  listError.value = ''
  try {
    const loaded = await readPage(path)
    const restored = editor.openPage(path, loaded.data, loaded.revision)
    if (restored) editor.toast('已恢复这个页面的本地草稿。')
  } catch (failure) {
    listError.value = (failure as Error).message
    editor.toast(`打开失败：${(failure as Error).message}`)
  }
}

/** 新建一个空页面。只改内存，保存时才落到仓库。 */
export function newPage(): void {
  const existing = [...pageList.value.map((entry) => entry.path), editor.pagePath.value]
  const path = nextEmptyPath(existing)
  const page = emptyPage(path)
  page.title = '新页面'
  editor.loadPage(path, page, editor.revision.value)
  editor.toast(`已新建空页面 ${path}，填好内容后点保存。`)
}

/** 从内容来源重新载入当前页面，丢掉内存里的改动。 */
export async function reloadPage(): Promise<void> {
  await openPage(editor.pagePath.value)
  editor.toast('已从内容来源重新载入。')
}

/** 保存当前页面。 */
export async function saveCurrentPage(): Promise<void> {
  if (editor.saving.value) return
  editor.saving.value = true
  try {
    const path = editor.pagePath.value
    const data = editor.pageData()
    const revision = await savePage(path, data, commitMessage(`编辑 ${path}`, data), editor.revision.value)
    editor.markSaved(revision)
    await refreshList()
  } catch (failure) {
    editor.toast(`保存失败：${(failure as Error).message}`)
  } finally {
    editor.saving.value = false
  }
}

/** 删除当前页面。 */
export async function deleteCurrentPage(): Promise<void> {
  const path = editor.pagePath.value
  editor.saving.value = true
  try {
    const revision = await deletePage(path, `删除 ${path}`, editor.revision.value)
    editor.toast(`已删除 ${path}。`)
    await refreshList()
    const next = pageList.value[0]?.path
    if (next !== undefined) await openPage(next)
    else editor.loadPage(path, emptyPage(path), revision)
  } catch (failure) {
    editor.toast(`删除失败：${(failure as Error).message}`)
  } finally {
    editor.saving.value = false
  }
}

/** 把当前页面移动到新路径。 */
export async function moveCurrentPage(nextPath: string): Promise<void> {
  const from = editor.pagePath.value
  const to = nextPath.trim().replace(/^\/+|\/+$/g, '')
  if (to === '' || to === from) return
  editor.saving.value = true
  try {
    const data = editor.pageData()
    const revision = await renamePage(from, to, data, `移动 ${from} 到 ${to}`, editor.revision.value)
    editor.loadPage(to, data, revision)
    editor.toast(`已移动到 ${to}。`)
    await refreshList()
  } catch (failure) {
    editor.toast(`移动失败：${(failure as Error).message}`)
  } finally {
    editor.saving.value = false
  }
}

/** 丢弃当前页面的本地草稿。 */
export function discardDraft(): void {
  const path = editor.pagePath.value
  const local = SOURCE_PAGES[path]
  const fallback: PageData = local ?? emptyPage(path)
  editor.discardDraft(fallback, editor.revision.value)
}

/** 自动生成提交说明。 */
function commitMessage(prefix: string, data: PageData): string {
  return `${prefix}：${data.blocks.length} 个顶层块`
}

export function usePages() {
  return {
    pageList,
    listBusy,
    listError,
    currentTitle,
    refreshList,
    openPage,
    newPage,
    reloadPage,
    saveCurrentPage,
    deleteCurrentPage,
    moveCurrentPage,
    discardDraft
  }
}
