/**
 * 富文本渲染组件：把 parseInline 输出的节点序列变成 VNode。
 * 文本节点交给 Vue 转义，因此整条链路不出现 v-html。
 */

import { defineComponent, h, type VNode } from 'vue'
import { parseInline, type InlineNode } from './parse.ts'
import { usePageIndex, useSite } from '../site-context.ts'
import { isReservedRoute, pageHref } from '../url.ts'

interface RenderContext {
  base: string
  isMissing: (target: string) => boolean
}

function toVNodes(nodes: InlineNode[], ctx: RenderContext): Array<string | VNode> {
  return nodes.map((node, index) => {
    if (node.type === 'text') return node.value

    if (node.type === 'bold') {
      return h('b', { key: index }, toVNodes(node.children, ctx))
    }
    if (node.type === 'italic') {
      return h('i', { key: index }, toVNodes(node.children, ctx))
    }

    if (node.external) {
      return h(
        'a',
        {
          key: index,
          class: 'ext',
          href: node.target,
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        node.label
      )
    }

    const missing = ctx.isMissing(node.target)
    // 只在缺页时才带上 class 与 title，避免渲染出空的 class=""。
    const attrs: Record<string, unknown> = {
      key: index,
      href: pageHref(ctx.base, node.target)
    }
    if (missing) {
      attrs.class = 'new'
      attrs.title = '该页面尚未创建'
    }
    return h('a', attrs, node.label)
  })
}

/** 行内富文本。传入 text，输出一串行内节点。 */
export const Richtext = defineComponent({
  name: 'Richtext',
  props: {
    text: { type: String, default: '' }
  },
  setup(props) {
    const site = useSite()
    const index = usePageIndex()

    const ctx: RenderContext = {
      base: site.base,
      isMissing: (target) => {
        if (index.size === 0) return false
        if (isReservedRoute(target)) return false
        const clean = target.replace(/^\/+/, '').replace(/\.json$/i, '')
        const namespaced = clean.includes('/') ? clean : `main/${clean}`
        return !index.has(clean) && !index.has(namespaced)
      }
    }

    return () => toVNodes(parseInline(props.text), ctx)
  }
})
