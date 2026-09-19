import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  clone,
  containsId,
  countBlocks,
  findEntry,
  listOf,
  moveNode,
  toContentBlocks,
  toEditNodes,
  type EditNode
} from './tree.ts'

function node(id: string, type: EditNode['type'] = 'Paragraph', children: EditNode[] = []): EditNode {
  return { id, type, params: {}, children }
}

/** 造一棵 a(b, c) 与 d 的树。 */
function sample(): EditNode[] {
  return [
    node('a', 'Collapsible', [node('b'), node('c')]),
    node('d')
  ]
}

test('findEntry 能定位顶层与嵌套节点，并给出父级', () => {
  const blocks = sample()
  assert.equal(findEntry(blocks, 'a')?.parentId, 'root')
  assert.equal(findEntry(blocks, 'a')?.index, 0)
  assert.equal(findEntry(blocks, 'c')?.parentId, 'a')
  assert.equal(findEntry(blocks, 'c')?.index, 1)
  assert.equal(findEntry(blocks, '不存在'), null)
})

test('listOf 是纯结构访问：叶子块返回空数组，不存在的父级返回 null', () => {
  const blocks = sample()
  assert.equal(listOf(blocks, 'root')?.length, 2)
  assert.equal(listOf(blocks, 'a')?.length, 2)
  // 叶子块有 children 数组，只是空的；能不能放子块由 Schema 判断，见 store 里的容器校验。
  assert.deepEqual(listOf(blocks, 'b'), [])
  assert.equal(listOf(blocks, '不存在'), null)
})

test('containsId 覆盖自身与子孙', () => {
  const blocks = sample()
  assert.equal(containsId(blocks[0], 'a'), true)
  assert.equal(containsId(blocks[0], 'c'), true)
  assert.equal(containsId(blocks[0], 'd'), false)
})

test('countBlocks 统计整棵树', () => {
  assert.equal(countBlocks(sample()), 4)
  assert.equal(countBlocks([]), 0)
})

// index 的语义是「插到该位置之前」，与画布上按鼠标位置算出来的落点一致。
test('移动：同列表内往后移，索引要修正一位', () => {
  // 插到 c 之前
  const before = [node('a'), node('b'), node('c')]
  assert.equal(moveNode(before, 'a', 'root', 2), 'ok')
  assert.deepEqual(before.map((item) => item.id), ['b', 'a', 'c'])

  // 插到末尾（c 之后）
  const after = [node('a'), node('b'), node('c')]
  assert.equal(moveNode(after, 'a', 'root', 3), 'ok')
  assert.deepEqual(after.map((item) => item.id), ['b', 'c', 'a'])
})

test('移动：同列表内往前移，索引不变', () => {
  const blocks = [node('a'), node('b'), node('c')]
  assert.equal(moveNode(blocks, 'c', 'root', 0), 'ok')
  assert.deepEqual(blocks.map((item) => item.id), ['c', 'a', 'b'])
})

test('移动：不允许把块放进自己的子孙里', () => {
  const blocks = sample()
  assert.equal(moveNode(blocks, 'a', 'b', 0), 'into-self')
  assert.equal(moveNode(blocks, 'a', 'a', 0), 'into-self')
  // 树结构没有被破坏
  assert.deepEqual(blocks.map((item) => item.id), ['a', 'd'])
  assert.deepEqual(blocks[0].children.map((item) => item.id), ['b', 'c'])
})

test('移动：跨层级移动（把子块提到顶层，把顶层块塞进容器）', () => {
  const blocks = sample()
  assert.equal(moveNode(blocks, 'c', 'root', 0), 'ok')
  assert.deepEqual(blocks.map((item) => item.id), ['c', 'a', 'd'])
  assert.deepEqual(blocks[1].children.map((item) => item.id), ['b'])

  assert.equal(moveNode(blocks, 'd', 'a', 1), 'ok')
  assert.deepEqual(blocks.map((item) => item.id), ['c', 'a'])
  assert.deepEqual(blocks[1].children.map((item) => item.id), ['b', 'd'])
})

test('移动：目标下标越界会被夹住', () => {
  const blocks = [node('a'), node('b')]
  assert.equal(moveNode(blocks, 'a', 'root', 99), 'ok')
  assert.deepEqual(blocks.map((item) => item.id), ['b', 'a'])
})

test('移动：目标不存在或无此块时如实返回', () => {
  const blocks = sample()
  assert.equal(moveNode(blocks, '不存在', 'root', 0), 'missing')
  assert.equal(moveNode(blocks, 'a', '不存在', 0), 'no-target')
})

test('内容树转换：补齐 id，写回时去掉 id，空 _raw 不落盘', () => {
  const content = [
    {
      type: 'Collapsible' as const,
      params: { title: '折叠' },
      children: [{ type: 'Paragraph' as const, params: { text: '正文' }, children: [] }],
      _raw: { css: '', js: '' }
    },
    {
      type: 'Notice' as const,
      params: { type: 'info', text: '提示' },
      children: [],
      _raw: { css: '.x{color:red}', js: '' }
    }
  ]

  const edit = toEditNodes(content)
  assert.equal(edit.length, 2)
  assert.ok(edit[0].id !== '')
  assert.ok(edit[0].children[0].id !== '')
  assert.notEqual(edit[0].id, edit[0].children[0].id)

  const back = toContentBlocks(edit)
  assert.equal(JSON.stringify(back).includes('"id"'), false)
  assert.equal(back[0]._raw, undefined)
  assert.deepEqual(back[1]._raw, { css: '.x{color:red}', js: '' })
  assert.equal(back[0].children[0].params.text, '正文')
})

test('clone 与源数据互不影响', () => {
  const source = sample()
  const copy = clone(source)
  copy[0].children.push(node('x'))
  assert.equal(source[0].children.length, 2)
  assert.equal(copy[0].children.length, 3)
})
