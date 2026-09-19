<script setup lang="ts">
/**
 * 成稿预览：直接复用展示系统的渲染组件，所见即所得。
 *
 * 与展示系统的差别只有两处：
 *   1. 预览里不执行块级 _raw.js，只注入 CSS（plan.md 8.2）；
 *   2. 链接被拦下，避免把编辑器导航走；点击用于选中块。
 */

import { BlockRenderer } from '@wiki/shared'

import { useEditor } from '../state/editor.ts'

const editor = useEditor()

function onClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target !== null && target.closest('a') !== null) event.preventDefault()

  const wrapper = target?.closest('.pv-block') as HTMLElement | null
  const id = wrapper?.dataset.id
  editor.select(id === undefined ? null : id)
}
</script>

<template>
  <div class="pv-wrap mw-parser-output" @click="onClick">
    <div
      v-for="(node, index) in editor.blocks.value"
      :key="node.id"
      class="pv-block"
      :class="{ 'is-selected': editor.selectedId.value === node.id }"
      :data-type="node.type"
      :data-id="node.id"
    >
      <BlockRenderer :block="node" :path="String(index)" />
    </div>
    <div v-if="editor.blocks.value.length === 0" class="empty-zone">
      空页面没有可预览的内容。切回结构视图，从左边篮子里拖几个块进来。
    </div>
  </div>
</template>
