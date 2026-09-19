import { test } from 'node:test'
import assert from 'node:assert/strict'

import { HistoryStack } from './history.ts'

/** 造一个装字符串的历史栈，时间由参数控制。 */
function stack(limit = 50, window = 500): HistoryStack<string> {
  return new HistoryStack<string>(limit, window)
}

test('没有历史时不能撤销也不能重做', () => {
  const history = stack()
  assert.equal(history.canUndo, false)
  assert.equal(history.canRedo, false)
  assert.equal(history.undo('当前'), null)
  assert.equal(history.redo('当前'), null)
})

test('记录一次改动后可以撤销回改动前的状态', () => {
  const history = stack()
  history.record('改动前', undefined, 0)
  assert.equal(history.canUndo, true)
  assert.equal(history.undo('改动后'), '改动前')
  assert.equal(history.canUndo, false)
  assert.equal(history.canRedo, true)
  assert.equal(history.redo('改动前'), '改动后')
})

test('撤销之后再做新改动，重做栈被清空', () => {
  const history = stack()
  history.record('v0', undefined, 0)
  history.undo('v1')
  assert.equal(history.canRedo, true)
  history.record('v0', undefined, 1000)
  assert.equal(history.canRedo, false)
})

test('同一个字段的连续输入在窗口内只占一个历史项', () => {
  const history = stack()
  history.record('起点', 'b1:text', 0)
  history.record('起点', 'b1:text', 100)
  history.record('起点', 'b1:text', 200)
  assert.equal(history.depth, 1)
  // 撤销一次就回到起点，而不是一个字一步
  assert.equal(history.undo('输入三段之后'), '起点')
  assert.equal(history.canUndo, false)
})

test('不同字段之间不合并', () => {
  const history = stack()
  history.record('起点', 'b1:text', 0)
  history.record('起点', 'b1:title', 100)
  assert.equal(history.depth, 2)
})

test('超过合并窗口之后再输入，另起一个历史项', () => {
  const history = stack()
  history.record('起点', 'b1:text', 0)
  history.record('起点', 'b1:text', 1000)
  assert.equal(history.depth, 2)
})

test('不带 mergeKey 的改动永远另起一项', () => {
  const history = stack()
  history.record('v1', undefined, 0)
  history.record('v2', undefined, 10)
  assert.equal(history.depth, 2)
})

test('历史深度不超过上限，最旧的被丢掉', () => {
  const history = stack(3)
  for (let i = 0; i < 5; i++) history.record(`v${i}`, undefined, i * 1000)
  assert.equal(history.depth, 3)
  assert.equal(history.undo('现在'), 'v4')
  assert.equal(history.undo('v4'), 'v3')
  assert.equal(history.undo('v3'), 'v2')
  assert.equal(history.canUndo, false)
})

test('撤销与重做可以来回走多步', () => {
  const history = stack()
  history.record('v0', undefined, 0)
  history.record('v1', undefined, 1000)
  history.record('v2', undefined, 2000)

  assert.equal(history.undo('v3'), 'v2')
  assert.equal(history.undo('v2'), 'v1')
  assert.equal(history.undo('v1'), 'v0')
  assert.equal(history.redo('v0'), 'v1')
  assert.equal(history.redo('v1'), 'v2')
  assert.equal(history.redo('v2'), 'v3')
  assert.equal(history.canRedo, false)
})

test('撤销之后立刻继续输入，不会被合并进旧的历史项', () => {
  const history = stack()
  history.record('v0', 'b1:text', 0)
  history.undo('v1')
  // 紧接着又敲同一个字段，应该重新压栈
  history.record('v0', 'b1:text', 50)
  assert.equal(history.depth, 1)
  assert.equal(history.canUndo, true)
})

test('clear 之后两边都空', () => {
  const history = stack()
  history.record('v0', undefined, 0)
  history.undo('v1')
  history.clear()
  assert.equal(history.canUndo, false)
  assert.equal(history.canRedo, false)
})
