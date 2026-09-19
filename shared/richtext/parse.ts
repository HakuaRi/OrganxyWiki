/**
 * 行内富文本解析器：Markdown 子集加双方括号站内链接。
 *
 * 支持：
 *   三撇号粗体        三个单引号包住
 *   两撇号斜体        两个单引号包住
 *   [[目标]]          站内链接
 *   [[目标|显示文字]] 带别名的站内链接
 *   [文字](https://…) 外部链接
 *
 * 只做词法层面的切分，不做转义。转义交给渲染层（Vue 默认转义文本节点），
 * 所以这里的输出可以安全地直接变成 VNode。
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'link'; target: string; label: string; external: boolean }

interface Pattern {
  re: RegExp
  build: (match: RegExpExecArray) => InlineNode[]
}

/**
 * 顺序即优先级：同一个位置上多个模式同时命中时，靠前的胜出。
 * 粗体必须排在斜体前面，否则三个单引号会被当成「斜体加一个引号」。
 */
const PATTERNS: Pattern[] = [
  {
    re: /'''([\s\S]+?)'''/,
    build: (m) => [{ type: 'bold', children: parseInline(m[1]) }]
  },
  {
    re: /''([\s\S]+?)''/,
    build: (m) => [{ type: 'italic', children: parseInline(m[1]) }]
  },
  {
    re: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/,
    build: (m) => [
      {
        type: 'link',
        target: m[1].trim(),
        label: (m[2] ?? m[1]).trim(),
        external: false
      }
    ]
  },
  {
    re: /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/,
    build: (m) => [{ type: 'link', target: m[2], label: m[1], external: true }]
  }
]

/** 把一段文本切成行内节点序列。 */
export function parseInline(input: string | undefined | null): InlineNode[] {
  const source = input ?? ''
  const nodes: InlineNode[] = []
  let rest = source

  while (rest.length > 0) {
    let hit: { index: number; length: number; nodes: InlineNode[] } | null = null

    for (const pattern of PATTERNS) {
      const match = pattern.re.exec(rest)
      if (!match) continue
      if (hit === null || match.index < hit.index) {
        hit = { index: match.index, length: match[0].length, nodes: pattern.build(match) }
      }
    }

    if (hit === null) {
      nodes.push({ type: 'text', value: rest })
      break
    }
    if (hit.index > 0) nodes.push({ type: 'text', value: rest.slice(0, hit.index) })
    nodes.push(...hit.nodes)
    rest = rest.slice(hit.index + hit.length)
  }

  return mergeText(nodes)
}

/** 把相邻的文本节点合并，减少 VNode 数量。 */
function mergeText(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = []
  for (const node of nodes) {
    const last = out[out.length - 1]
    if (node.type === 'text' && last !== undefined && last.type === 'text') {
      last.value += node.value
      continue
    }
    out.push(node)
  }
  return out
}

/** 取纯文本，用于摘要、目录标签与搜索索引。 */
export function inlineToPlainText(nodes: InlineNode[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') out += node.value
    else if (node.type === 'link') out += node.label
    else out += inlineToPlainText(node.children)
  }
  return out
}

/** 取出全部链接目标，用于反链索引与红链判断。 */
export function inlineLinkTargets(nodes: InlineNode[]): Array<{ target: string; external: boolean }> {
  const out: Array<{ target: string; external: boolean }> = []
  const walk = (list: InlineNode[]): void => {
    for (const node of list) {
      if (node.type === 'link') out.push({ target: node.target, external: node.external })
      else if (node.type !== 'text') walk(node.children)
    }
  }
  walk(nodes)
  return out
}
