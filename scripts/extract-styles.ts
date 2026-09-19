/**
 * 一次性脚本：把视觉样板的 CSS 抽成正式样式资产。
 *
 * 从 prototype/style-sample.html 里取出 style 块，剥掉只属于原型的东西
 * （顶部控制条、说明面板、给控制条让位的 body padding），
 * 输出 shared/styles/tokens.css（设计变量）与 shared/styles/wiki.css（其余全部）。
 * 生成之后这两个文件就是事实源，本脚本不再参与构建。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

interface Rule {
  prelude: string
  body: string
  raw: string
}

/** 按顶层大括号切分规则，@media 等块整体保留（其内部由调用方递归处理）。 */
function splitRules(text: string): Rule[] {
  const rules: Rule[] = []
  let depth = 0
  let start = 0
  let preludeEnd = -1

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') {
      if (depth === 0) preludeEnd = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        rules.push({
          prelude: text.slice(start, preludeEnd).trim(),
          body: text.slice(preludeEnd + 1, i),
          raw: text.slice(start, i + 1)
        })
        start = i + 1
      }
    }
  }

  const tail = text.slice(start).trim()
  if (tail !== '') rules.push({ prelude: '', body: '', raw: tail })
  return rules
}

const PROTOTYPE_ONLY = /\.proto-bar|\.notes\b|\.notes\[hidden\]|\.notes header|\.notes ol|\.notes li|\.notes code/

/** 丢掉原型专用的规则；@media 内部递归过滤。 */
function stripPrototype(rules: Rule[]): Rule[] {
  const out: Rule[] = []
  for (const rule of rules) {
    if (PROTOTYPE_ONLY.test(rule.prelude)) continue
    if (/^body$/.test(rule.prelude) && rule.body.includes('padding-top:29px')) continue

    if (rule.prelude.startsWith('@media')) {
      const inner = stripPrototype(splitRules(rule.body))
      if (inner.length === 0) continue
      out.push({
        prelude: rule.prelude,
        body: inner.map((r) => r.raw).join(''),
        raw: `${rule.prelude}{${inner.map((r) => r.raw).join('')}}`
      })
      continue
    }
    out.push(rule)
  }
  return out
}

const html = readFileSync('prototype/style-sample.html', 'utf8')
const match = /<style>([\s\S]*?)<\/style>/.exec(html)
if (match === null) throw new Error('样板里找不到 style 块')

const all = splitRules(match[1])
// 注意：prelude 里会带上紧邻的注释，所以用后缀匹配而不是全等。
const rootRule = all.find((rule) => /:root$/.test(rule.prelude.trim()))
if (rootRule === undefined) throw new Error('样板里找不到 :root 变量块')

const rest = stripPrototype(all.filter((rule) => rule !== rootRule))

const banner = `/* 由 prototype/style-sample.html 抽取而来（脚本：scripts/extract-styles.ts）。
   生成后本文件即为事实源，改动请直接改这里，不要再改样板。 */
`

const tokens = `${banner}\n${rootRule.raw}\n`
const wiki = `${banner}\n${rest.map((rule) => rule.raw).join('\n')}\n`

for (const [path, content] of [
  ['shared/styles/tokens.css', tokens],
  ['shared/styles/wiki.css', wiki]
] as const) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
  console.log(`${path}  ${content.split('\n').length} 行  ${content.length} 字节`)
}

const dropped = all.filter((rule) => /\.proto-bar|\.notes|padding-top:29px/.test(rule.prelude + rule.body))
console.log(`丢弃原型专用规则 ${dropped.length} 条：`)
for (const rule of dropped) console.log(`  ${rule.prelude.replace(/\s+/g, ' ').slice(0, 70) || rule.raw.slice(0, 70)}`)
