import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inlineToPlainText, parseInline } from './parse.ts'

test('纯文本原样返回', () => {
  assert.deepEqual(parseInline('沈括是北宋人'), [{ type: 'text', value: '沈括是北宋人' }])
})

test('空值返回空数组', () => {
  assert.deepEqual(parseInline(''), [])
  assert.deepEqual(parseInline(undefined), [])
  assert.deepEqual(parseInline(null), [])
})

test('三撇号是粗体，不是斜体加引号', () => {
  const nodes = parseInline("'''沈括'''（1031年）")
  assert.equal(nodes.length, 2)
  assert.equal(nodes[0].type, 'bold')
  assert.deepEqual((nodes[0] as { children: unknown[] }).children, [{ type: 'text', value: '沈括' }])
  assert.deepEqual(nodes[1], { type: 'text', value: '（1031年）' })
})

test('两撇号是斜体', () => {
  assert.deepEqual(parseInline("''梦溪笔谈''"), [
    { type: 'italic', children: [{ type: 'text', value: '梦溪笔谈' }] }
  ])
})

test('粗体里可以套斜体', () => {
  const nodes = parseInline("'''粗''斜''体'''")
  assert.equal(nodes.length, 1)
  const bold = nodes[0] as { type: string; children: Array<{ type: string }> }
  assert.equal(bold.type, 'bold')
  assert.deepEqual(bold.children.map((n) => n.type), ['text', 'italic', 'text'])
})

test('站内链接，带别名与不带别名', () => {
  assert.deepEqual(parseInline('[[梦溪笔谈]]'), [
    { type: 'link', target: '梦溪笔谈', label: '梦溪笔谈', external: false }
  ])
  assert.deepEqual(parseInline('[[meng-xi-bi-tan|梦溪笔谈]]'), [
    { type: 'link', target: 'meng-xi-bi-tan', label: '梦溪笔谈', external: false }
  ])
})

test('外部链接带别名', () => {
  assert.deepEqual(parseInline('[李约瑟](https://example.org/needham)'), [
    { type: 'link', target: 'https://example.org/needham', label: '李约瑟', external: true }
  ])
})

test('同一段里多种格式混排，按出现顺序切分', () => {
  const nodes = parseInline("他写了《[[梦溪笔谈]]》，'''非常重要'''，见[外链](https://a.example)。")
  assert.deepEqual(
    nodes.map((n) => n.type),
    ['text', 'link', 'text', 'bold', 'text', 'link', 'text']
  )
})

test('未闭合的标记当普通文本处理', () => {
  assert.deepEqual(parseInline("'''没有闭合"), [{ type: 'text', value: "'''没有闭合" }])
  assert.deepEqual(parseInline('[[没有闭合'), [{ type: 'text', value: '[[没有闭合' }])
})

test('相邻文本节点被合并', () => {
  const nodes = parseInline('前[[a]]后')
  assert.deepEqual(nodes.map((n) => n.type), ['text', 'link', 'text'])
  assert.equal((nodes[0] as { value: string }).value, '前')
})

test('转义交给渲染层，解析器不改写尖括号', () => {
  assert.deepEqual(parseInline('<script>alert(1)</script>'), [
    { type: 'text', value: '<script>alert(1)</script>' }
  ])
})

test('取纯文本用于摘要与目录', () => {
  assert.equal(inlineToPlainText(parseInline("'''沈括'''写了《[[梦溪笔谈]]》")), '沈括写了《梦溪笔谈》')
})
