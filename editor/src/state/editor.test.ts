import { test } from 'node:test'
import assert from 'node:assert/strict'

import type { PageData } from '@wiki/shared/types/content.ts'

import { useEditor } from './editor.ts'
import type { EditNode } from './tree.ts'

const editor = useEditor()

/** 一份固定的测试页数据。 */
function samplePage(): PageData {
  return {
    title: '测试页',
    namespace: 'main',
    categories: ['测试分类'],
    blocks: [
      {
        type: 'Collapsible',
        params: { title: '折叠', expanded: true },
        children: [{ type: 'Paragraph', params: { text: '子块正文' }, children: [] }]
      },
      { type: 'Paragraph', params: { text: '第二块' }, children: [] }
    ]
  }
}

/** 用导出结果做内容快照，比整棵树更稳定（导出时已经去掉编辑器 id）。 */
function content(): string {
  return JSON.stringify(editor.pageData())
}

/** 每个用例都从一棵干净的小树开始。 */
function reset(): EditNode[] {
  editor.loadPage('main/测试', samplePage(), 'local')
  return editor.blocks.value
}

test('载入页面后选中第一个块，历史为空', () => {
  const blocks = reset()
  assert.equal(blocks.length, 2)
  assert.equal(editor.blockCount.value, 3)
  assert.equal(editor.selectedId.value, blocks[0].id)
  assert.equal(editor.canUndo.value, false)
  assert.equal(editor.pageTitle.value, '测试页')
  assert.deepEqual(editor.pageCategories.value, ['测试分类'])
})

test('插入块之后可以撤销回原样', () => {
  reset()
  const before = editor.blockCount.value
  editor.appendBlock('Notice')
  assert.equal(editor.blockCount.value, before + 1)
  assert.equal(editor.canUndo.value, true)

  editor.undo()
  assert.equal(editor.blockCount.value, before)
  assert.equal(editor.canRedo.value, true)

  editor.redo()
  assert.equal(editor.blockCount.value, before + 1)
})

test('删除块可以撤销，且撤销后选中项跟着回来', () => {
  const blocks = reset()
  const target = blocks[0].id
  editor.select(target)
  editor.removeBlock(target)
  assert.equal(editor.blockCount.value, 1)
  assert.equal(editor.selectedId.value, null)

  editor.undo()
  assert.equal(editor.blockCount.value, 3)
  assert.equal(editor.selectedId.value, target)
})

test('移动块可以撤销，撤销后顺序完全一致', () => {
  const blocks = reset()
  const ids = blocks.map((node) => node.id)

  editor.moveBlock(ids[0], 'root', 2)
  assert.deepEqual(editor.blocks.value.map((node) => node.id), [ids[1], ids[0]])

  editor.undo()
  assert.deepEqual(editor.blocks.value.map((node) => node.id), ids)
})

test('把父块拖进自己的子孙被拒绝，且不占历史', () => {
  const blocks = reset()
  const parent = blocks[0]
  const child = parent.children[0]

  editor.moveBlock(parent.id, child.id, 0)

  assert.equal(editor.blocks.value[0].children.length, 1)
  assert.equal(editor.canUndo.value, false)
})

test('叶子块不接收子块', () => {
  const blocks = reset()
  const leaf = blocks[1]
  editor.moveBlock(blocks[0].id, leaf.id, 0)
  assert.equal(editor.blocks.value.length, 2)
  assert.equal(leaf.children.length, 0)
})

test('参数改动可以撤销', () => {
  const blocks = reset()
  const target = blocks[1]
  editor.updateParam(target.id, 'text', '改过的正文')
  assert.equal(editor.blocks.value[1].params.text, '改过的正文')
  editor.undo()
  assert.equal(editor.blocks.value[1].params.text, '第二块')
})

test('连续键入同一个字段只占一个历史项', () => {
  const blocks = reset()
  const target = blocks[1]
  editor.updateParam(target.id, 'text', '一', true)
  editor.updateParam(target.id, 'text', '一二', true)
  editor.updateParam(target.id, 'text', '一二三', true)

  assert.equal(editor.blocks.value[1].params.text, '一二三')
  editor.undo()
  assert.equal(editor.blocks.value[1].params.text, '第二块')
  assert.equal(editor.canUndo.value, false)
})

test('页面级元信息改动也能撤销', () => {
  reset()
  editor.setTitle('改过的标题')
  editor.setCategories('甲、乙')
  assert.equal(editor.pageData().title, '改过的标题')
  assert.deepEqual(editor.pageData().categories, ['甲', '乙'])

  editor.undo()
  assert.deepEqual(editor.pageData().categories, ['测试分类'])
  editor.undo()
  assert.equal(editor.pageData().title, '测试页')
})

test('行列表可以增删改，并且都能撤销', () => {
  reset()
  editor.appendBlock('Infobox')
  const box = editor.blocks.value[editor.blocks.value.length - 1]
  editor.addRow(box.id, 'rows')
  editor.addRow(box.id, 'rows')
  assert.equal((editor.blocks.value[2].params.rows as unknown[]).length, 2)

  editor.updateRow(box.id, 'rows', 0, 'label', '字', true)
  assert.equal((editor.blocks.value[2].params.rows as Array<Record<string, unknown>>)[0].label, '字')

  editor.removeRow(box.id, 'rows', 1)
  assert.equal((editor.blocks.value[2].params.rows as unknown[]).length, 1)

  editor.undo()
  assert.equal((editor.blocks.value[2].params.rows as unknown[]).length, 2)
})

test('块级裸露接口可以改，也可以撤销；空值不写进导出结果', () => {
  const blocks = reset()
  const target = blocks[1].id
  /** 用函数取值，避免断言把属性收窄成 never。 */
  const css = (): string => editor.blocks.value[1]._raw?.css ?? ''

  editor.updateRaw(target, 'css', '.pv{color:red}')
  assert.equal(css(), '.pv{color:red}')
  assert.deepEqual(editor.pageData().blocks[1]._raw, { css: '.pv{color:red}', js: '' })

  // 紧跟着清空：同一个字段在合并窗口内，算一次编辑
  editor.updateRaw(target, 'css', '')
  assert.equal(editor.pageData().blocks[1]._raw, undefined)
  editor.undo()
  assert.equal(editor.pageData().blocks[1]._raw, undefined)

  // 中间夹一次结构性改动会断开合并窗口，于是清空成为独立的一步
  editor.updateRaw(target, 'css', '.pv{color:red}')
  editor.appendBlock('Notice')
  editor.updateRaw(target, 'css', '')
  assert.equal(css(), '')
  editor.undo()
  assert.equal(css(), '.pv{color:red}')
})

test('页面级裸露接口可以改，空值不落盘', () => {
  reset()
  editor.setPageRaw('css', '.page{color:red}')
  assert.equal(editor.pageData().raw?.css, '.page{color:red}')
  editor.setPageRaw('css', '')
  assert.equal(editor.pageData().raw, undefined)
})

test('混合十次操作后逐步撤销，能精确回到每一步之前', () => {
  reset()

  const before: string[] = []
  const run = (operation: () => void): void => {
    before.push(content())
    operation()
  }

  run(() => editor.appendBlock('Notice'))
  run(() => editor.appendBlock('Heading'))
  run(() => editor.appendBlock('List'))
  run(() => editor.moveWithinList(editor.blocks.value[0].id, 1))
  run(() => editor.removeBlock(editor.blocks.value[2].id))
  run(() => editor.updateParam(editor.blocks.value[0].id, 'text', '改过的正文'))
  run(() => editor.appendBlock('Quote'))
  run(() => editor.moveBlock(editor.blocks.value[3].id, 'root', 0))
  run(() => editor.removeBlock(editor.blocks.value[0].id))
  run(() => editor.clearBlocks())

  assert.equal(editor.blocks.value.length, 0)

  // 逆序撤销：每一步都应精确回到该操作之前
  for (let i = before.length - 1; i >= 0; i--) {
    assert.equal(editor.canUndo.value, true, `第 ${i + 1} 步之前还能撤销`)
    editor.undo()
    assert.equal(content(), before[i], `撤销后应回到第 ${i + 1} 步之前`)
  }
  assert.equal(editor.canUndo.value, false)
  assert.equal(editor.blockCount.value, 3)

  // 再一路重做回去，回到清空后的状态
  for (let i = 0; i < before.length; i++) {
    assert.equal(editor.canRedo.value, true, `第 ${i + 1} 步还能重做`)
    editor.redo()
  }
  assert.equal(editor.canRedo.value, false)
  assert.equal(editor.blocks.value.length, 0)
})

test('清空之后是一棵空树，且可以撤销', () => {
  reset()
  editor.clearBlocks()
  assert.equal(editor.blocks.value.length, 0)
  assert.equal(editor.selected.value, null)
  editor.undo()
  assert.equal(editor.blocks.value.length, 2)
})

test('切换页面会清空历史并重置选中', () => {
  reset()
  editor.appendBlock('Notice')
  assert.equal(editor.canUndo.value, true)

  editor.loadPage(
    'main/另一个',
    { title: '另一页', namespace: 'main', categories: [], blocks: [] },
    'local'
  )
  assert.equal(editor.canUndo.value, false)
  assert.equal(editor.selectedId.value, null)
  assert.equal(editor.pagePath.value, 'main/另一个')
  assert.equal(editor.dirty.value, false)
})

test('改动会把页面标成有未提交内容，标记保存后清掉', () => {
  reset()
  assert.equal(editor.dirty.value, false)
  editor.appendBlock('Notice')
  assert.equal(editor.dirty.value, true)
  editor.markSaved('commit-sha')
  assert.equal(editor.dirty.value, false)
  assert.equal(editor.revision.value, 'commit-sha')
})

test('导出的内容树里没有编辑器 id', () => {
  reset()
  assert.equal(JSON.stringify(editor.pageData()).includes('"id"'), false)
})
