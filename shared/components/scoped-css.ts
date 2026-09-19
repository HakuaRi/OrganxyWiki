/**
 * 块级裸露修改接口的 CSS 作用域处理，对应 plan.md 5.2 与 8.2。
 *
 * 每个带 _raw.css 的块会拿到一个唯一 class（由块在树里的路径生成），
 * 规则里的每条选择器都被加上这个前缀，因此一个块的样式不会影响到别处。
 * :root / html / body 直接替换成这个作用域选择器本身。
 */

interface Rule {
  prelude: string
  body: string
  raw: string
}

/** 按顶层大括号切分规则。 */
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

/** 给一条选择器加上作用域前缀。 */
function scopeSelector(selector: string, scope: string): string {
  const trimmed = selector.trim()
  if (trimmed === '') return trimmed
  if (trimmed.startsWith(scope)) return trimmed
  if (/^(:root|html|body)\b/.test(trimmed)) return trimmed.replace(/^(:root|html|body)/, scope)
  return `${scope} ${trimmed}`
}

function scopeRules(rules: Rule[], scope: string): string {
  return rules
    .map((rule) => {
      if (rule.prelude === '') return rule.raw

      if (/^@(media|supports|container)\b/.test(rule.prelude)) {
        return `${rule.prelude}{${scopeRules(splitRules(rule.body), scope)}}`
      }
      // @keyframes、@font-face、@layer 之类原样保留
      if (rule.prelude.startsWith('@')) return rule.raw

      const selectors = rule.prelude
        .split(',')
        .map((selector) => scopeSelector(selector, scope))
        .join(',')
      return `${selectors}{${rule.body}}`
    })
    .join('\n')
}

/** 把一段 CSS 限定在 scope 选择器内。 */
export function scopeCss(css: string, scope: string): string {
  if (css.trim() === '') return ''
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return scopeRules(splitRules(withoutComments), scope).trim()
}
