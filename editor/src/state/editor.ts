/**
 * 编辑器状态：整页数据（元信息加块树）、选中项、视图模式、撤销重做、草稿。
 *
 * 所有会改动内容的操作都必须经过 commit()，不允许在外面直接改，
 * 否则历史会错位（steps.md M2-9 定的唯一入口约定）。
 * 页面级元信息（标题、分类、页面级裸露接口）也走同一条历史。
 */

import { computed, ref, toRaw } from 'vue'

// 纯逻辑走子路径导入，这样 state 层能被 Node 直接加载跑单测；
// 渲染组件才走包入口（包入口会带上 .vue，Node 加载不了）。
import { createBlock, getSchema, isContainer } from '@wiki/shared/schema/index.ts'
import type { BlockType, PageData, RawPatch } from '@wiki/shared/types/content.ts'
import type { TemplateSchema } from '@wiki/shared/types/schema.ts'

import { HistoryStack } from './history.ts'
import {
  clone,
  containsId,
  countBlocks,
  findEntry,
  listOf,
  moveNode,
  nextId,
  toContentBlocks,
  toEditNodes,
  type EditNode
} from './tree.ts'
import { clearDraft, readDraft, writeDraft } from './draft.ts'

export type ViewMode = 'tree' | 'preview'

interface Snapshot {
  blocks: EditNode[]
  selectedId: string | null
  title: string
  categories: string[]
  raw: RawPatch
}

/** 连续键入同一个字段时合并成一个历史项的窗口。 */
const MERGE_WINDOW_MS = 500
const HISTORY_LIMIT = 50

const blocks = ref<EditNode[]>([])
const selectedId = ref<string | null>(null)
const pagePath = ref('main/home')
const pageTitle = ref('')
const pageCategories = ref<string[]>([])
const pageRaw = ref<RawPatch>({ css: '', js: '' })
const revision = ref('local')
const mode = ref<ViewMode>('tree')
const saving = ref(false)
const dirty = ref(false)

const history = new HistoryStack<Snapshot>(HISTORY_LIMIT, MERGE_WINDOW_MS)
const historyVersion = ref(0)

const toastMessage = ref('')
const draftSavedAt = ref('')
const draftRestored = ref(false)

const canUndo = computed(() => {
  historyVersion.value
  return history.canUndo
})
const canRedo = computed(() => {
  historyVersion.value
  return history.canRedo
})
const blockCount = computed(() => countBlocks(blocks.value))
const selected = computed<EditNode | null>(() => {
  if (selectedId.value === null) return null
  const entry = findEntry(blocks.value, selectedId.value)
  return entry === null ? null : entry.node
})
const selectedSchema = computed<TemplateSchema | null>(() => {
  const node = selected.value
  return node === null ? null : (getSchema(node.type) ?? null)
})

let toastTimer: ReturnType<typeof setTimeout> | null = null
let draftTimer: ReturnType<typeof setTimeout> | null = null

/** 提示条。 */
function toast(message: string): void {
  toastMessage.value = message
  if (toastTimer !== null) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3600)
}

function snapshot(): Snapshot {
  return {
    blocks: clone(toRaw(blocks.value)),
    selectedId: selectedId.value,
    title: pageTitle.value,
    categories: [...pageCategories.value],
    raw: clone(pageRaw.value)
  }
}

function restore(snap: Snapshot): void {
  blocks.value = snap.blocks
  selectedId.value = snap.selectedId
  pageTitle.value = snap.title
  pageCategories.value = [...snap.categories]
  pageRaw.value = clone(snap.raw)
}

/**
 * 执行一次改动。
 * mergeKey 相同且在窗口内的连续改动只占一个历史项，用于文本输入。
 */
function commit(mutate: () => void, mergeKey?: string): void {
  history.record(snapshot(), mergeKey)
  historyVersion.value += 1
  mutate()
  dirty.value = true
  scheduleDraft()
}

function scheduleDraft(): void {
  if (draftTimer !== null) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    saveDraft()
  }, 700)
}

/** 组装成可写进内容文件的整页数据。 */
function pageData(): PageData {
  const raw = pageRaw.value
  const keepRaw = raw.css.trim() !== '' || raw.js.trim() !== ''
  return {
    title: pageTitle.value,
    // 命名空间就是路径的第一段，不单独存，避免重命名后不一致。
    namespace: pagePath.value.includes('/') ? (pagePath.value.split('/')[0] ?? 'main') : 'main',
    categories: [...pageCategories.value],
    blocks: toContentBlocks(toRaw(blocks.value)),
    ...(keepRaw ? { raw: clone(raw) } : {})
  }
}

/** 把当前整页写进本地草稿。 */
function saveDraft(): void {
  const saved = writeDraft(pagePath.value, pageData(), clone(toRaw(blocks.value)))
  if (saved) draftSavedAt.value = new Date().toISOString()
}

/* ===== 历史 ===== */

function undo(): void {
  const restored = history.undo(snapshot())
  if (restored === null) return
  restore(restored)
  historyVersion.value += 1
  dirty.value = true
  scheduleDraft()
}

function redo(): void {
  const restored = history.redo(snapshot())
  if (restored === null) return
  restore(restored)
  historyVersion.value += 1
  dirty.value = true
  scheduleDraft()
}

/* ===== 载入 ===== */

/** 载入一整页。 */
function loadPage(path: string, data: PageData, rev: string): void {
  pagePath.value = path
  pageTitle.value = data.title ?? path
  pageCategories.value = [...(data.categories ?? [])]
  pageRaw.value = data.raw === undefined ? { css: '', js: '' } : clone(data.raw)
  blocks.value = toEditNodes(data.blocks)
  selectedId.value = blocks.value.length > 0 ? blocks.value[0].id : null
  revision.value = rev
  draftSavedAt.value = ''
  draftRestored.value = false
  dirty.value = false
  history.clear()
  historyVersion.value += 1
}

/** 打开一个页面：有草稿优先用草稿。返回是否用了草稿。 */
function openPage(path: string, data: PageData, rev: string): boolean {
  const draft = readDraft(path)
  loadPage(path, draft?.page ?? data, rev)
  if (draft !== null) {
    blocks.value = draft.blocks
    selectedId.value = draft.blocks.length > 0 ? draft.blocks[0].id : null
    draftSavedAt.value = draft.savedAt
    draftRestored.value = true
    dirty.value = true
    return true
  }
  return false
}

/** 丢弃当前页面的草稿，回到内容文件的样子。 */
function discardDraft(data: PageData, rev: string): void {
  clearDraft(pagePath.value)
  loadPage(pagePath.value, data, rev)
  toast('已丢弃草稿，回到内容文件里的样子。')
}

/** 保存成功后调用：更新基线提交并清掉草稿。 */
function markSaved(rev: string): void {
  revision.value = rev
  dirty.value = false
  clearDraft(pagePath.value)
  draftSavedAt.value = ''
  draftRestored.value = false
  toast('已提交到 GitHub。')
}

/* ===== 选择与视图 ===== */

function select(id: string | null): void {
  selectedId.value = id
}

function setMode(next: ViewMode): void {
  mode.value = next
}

/* ===== 页面级元信息 ===== */

function setTitle(value: string): void {
  commit(() => {
    pageTitle.value = value
  }, 'page:title')
}

function setCategories(value: string): void {
  const list = value
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter((item) => item !== '')
  commit(() => {
    pageCategories.value = list
  }, 'page:categories')
}

function setPageRaw(which: 'css' | 'js', value: string): void {
  commit(
    () => {
      pageRaw.value = { ...pageRaw.value, [which]: value }
    },
    `page:raw:${which}`
  )
}

/* ===== 结构改动 ===== */

/** 新建一个编辑期节点。 */
function createNode(type: BlockType): EditNode {
  const block = createBlock(type)
  return { id: nextId(), type: block.type, params: block.params, children: [] }
}

/**
 * 目标父级能不能放子块。
 * 顶层永远可以；块级要看 Schema 里有没有标记为容器。
 */
function canAcceptChildren(parentId: string): boolean {
  if (parentId === 'root') return true
  const entry = findEntry(blocks.value, parentId)
  return entry !== null && isContainer(entry.node.type)
}

/** 在指定父级的第 index 位插入一个新块。 */
function insertBlock(parentId: string, index: number, type: BlockType): void {
  if (!canAcceptChildren(parentId)) {
    toast('这个块不接收子块。')
    return
  }
  const target = listOf(blocks.value, parentId)
  if (target === null) return
  const node = createNode(type)
  commit(() => {
    target.splice(Math.max(0, Math.min(index, target.length)), 0, node)
    selectedId.value = node.id
  })
  toast(`已放入「${getSchema(type)?.label ?? type}」。`)
}

/** 追加到顶层末尾。 */
function appendBlock(type: BlockType): void {
  insertBlock('root', blocks.value.length, type)
}

/**
 * 移动已有块到目标父级的第 index 位。
 * 先做检查再记录历史，避免把一次必然失败的拖拽也塞进撤销栈。
 */
function moveBlock(id: string, parentId: string, index: number): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  if (containsId(entry.node, parentId)) {
    toast('不能把一个块放进它自己的内部。')
    return
  }
  if (!canAcceptChildren(parentId)) {
    toast('这个块不接收子块。')
    return
  }
  if (listOf(blocks.value, parentId) === null) return

  commit(() => {
    if (moveNode(blocks.value, id, parentId, index) === 'ok') selectedId.value = id
  })
}

/** 在同级里上下移动。 */
function moveWithinList(id: string, delta: number): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  const next = entry.index + delta
  if (next < 0 || next >= entry.list.length) return
  commit(() => {
    const [node] = entry.list.splice(entry.index, 1)
    entry.list.splice(next, 0, node)
  })
}

function removeBlock(id: string): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  commit(() => {
    entry.list.splice(entry.index, 1)
    if (selectedId.value === id) selectedId.value = null
  })
  toast('已删除一个块。')
}

function clearBlocks(): void {
  commit(() => {
    blocks.value = []
    selectedId.value = null
  })
  toast('页面已清空。')
}

/* ===== 参数改动 ===== */

function updateParam(id: string, key: string, value: unknown, typed = false): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  commit(
    () => {
      entry.node.params[key] = value
    },
    typed ? `${id}:${key}` : undefined
  )
}

function updateRaw(id: string, which: 'css' | 'js', value: string): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  commit(
    () => {
      const node = entry.node
      node._raw = { css: node._raw?.css ?? '', js: node._raw?.js ?? '', [which]: value }
    },
    `${id}:raw:${which}`
  )
}

function addRow(id: string, key: string): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  const field = getSchema(entry.node.type)?.fields.find((item) => item.key === key)
  if (field?.itemFields === undefined) return
  const blank: Record<string, unknown> = {}
  for (const itemField of field.itemFields) blank[itemField.key] = ''
  commit(() => {
    const rows = entry.node.params[key]
    if (Array.isArray(rows)) rows.push(blank)
    else entry.node.params[key] = [blank]
    selectedId.value = id
  })
}

function removeRow(id: string, key: string, index: number): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  commit(() => {
    const rows = entry.node.params[key]
    if (Array.isArray(rows)) rows.splice(index, 1)
  })
}

function updateRow(
  id: string,
  key: string,
  index: number,
  field: string,
  value: string,
  typed = false
): void {
  const entry = findEntry(blocks.value, id)
  if (entry === null) return
  commit(
    () => {
      const rows = entry.node.params[key]
      if (!Array.isArray(rows)) return
      const row = rows[index] as Record<string, unknown> | undefined
      if (row === undefined) return
      row[field] = value
    },
    typed ? `${id}:${key}:${index}:${field}` : undefined
  )
}

/* ===== 对外 ===== */

export function useEditor() {
  return {
    blocks,
    selectedId,
    selected,
    selectedSchema,
    pagePath,
    pageTitle,
    pageCategories,
    pageRaw,
    revision,
    mode,
    blockCount,
    canUndo,
    canRedo,
    dirty,
    saving,
    toastMessage,
    draftSavedAt,
    draftRestored,

    toast,
    select,
    setMode,
    undo,
    redo,

    loadPage,
    openPage,
    discardDraft,
    markSaved,
    saveDraft,

    setTitle,
    setCategories,
    setPageRaw,

    insertBlock,
    appendBlock,
    moveBlock,
    moveWithinList,
    removeBlock,
    clearBlocks,

    updateParam,
    updateRaw,
    addRow,
    removeRow,
    updateRow,

    /** 当前整页数据，可直接写进内容文件。 */
    pageData,
    /** 内容数据转编辑期节点。 */
    fromContent: toEditNodes
  }
}
