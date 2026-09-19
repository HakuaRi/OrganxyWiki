/**
 * 侧边栏块。渲染在正文的右侧浮动列里。
 *
 * 这里用渲染函数而不是模板，因为要把每个子块分别包进 .st-block：
 * 子块由父级通过插槽传进来，只有拿到 VNode 数组才拆得开。
 */

import { defineComponent, h, type VNode } from 'vue'
import { str } from '../params.ts'

export default defineComponent({
  name: 'SidebarRenderer',
  props: {
    params: { type: Object, required: true },
    /** 声明 path 只是为了接住父级统一传下来的属性，避免它落成多余的 HTML 属性。 */
    path: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () => {
      const children: VNode[] = slots.default?.() ?? []
      return h('section', { class: 'sidebar-tpl' }, [
        h('div', { class: 'st-title' }, str((props.params as Record<string, unknown>).title)),
        h(
          'div',
          { class: 'st-body' },
          children.map((child, index) => h('div', { class: 'st-block', key: index }, [child]))
        )
      ])
    }
  }
})
