<script setup lang="ts">
/** 画布上的一张块卡片：可拖动排序、可选中、可上移下移删除；容器块内嵌子列表。 */

import { computed } from 'vue'
import { getSchema, records, str } from '@wiki/shared'

import { useEditor } from '../state/editor.ts'
import { startDrag } from '../state/drag.ts'
import type { EditNode } from '../state/tree.ts'
import BlockList from './BlockList.vue'
import Icon from './Icon.vue'

const props = defineProps<{ node: EditNode; parentId: string; index: number }>()

const editor = useEditor()

const schema = computed(() => getSchema(props.node.type) ?? null)
const isContainer = computed(() => schema.value?.container === true)
const isSelected = computed(() => editor.selectedId.value === props.node.id)

/** 摘要：取前几个填了值的字段，让人一眼看出这块是什么内容。 */
const summary = computed(() => {
  const fields = schema.value?.fields ?? []
  const parts: string[] = []

  for (const field of fields) {
    if (parts.length >= 3) break
    const value = props.node.params[field.key]

    if (field.type === 'template-list') {
      const rows = records(value)
      if (rows.length > 0) parts.push(`${field.label}：${rows.length} 行`)
      continue
    }
    if (field.type === 'boolean') {
      parts.push(`${field.label}：${value === true ? '是' : '否'}`)
      continue
    }
    const text = str(value).replace(/\s+/g, ' ')
    if (text !== '') parts.push(`${field.label}：${text.slice(0, 46)}`)
  }

  if (isContainer.value) parts.push(`子块 ${props.node.children.length} 个`)
  return parts
})

function onDragStart(event: DragEvent): void {
  event.stopPropagation()
  startDrag({ kind: 'move', id: props.node.id })
  if (event.dataTransfer !== null) {
    event.dataTransfer.setData('text/plain', props.node.id)
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div
    class="block-card"
    :class="{ 'is-selected': isSelected }"
    draggable="true"
    @dragstart="onDragStart"
    @click="editor.select(node.id)"
  >
    <div class="bc-head">
      <span class="bc-handle" title="按住拖动"><Icon name="grip" :size="13" /></span>
      <span class="bc-icon"><Icon :name="node.type" /></span>
      <span class="bc-type">{{ node.type }}</span>
      <span class="bc-label">{{ schema?.label ?? '' }}</span>
      <span class="bc-actions">
        <button
          type="button"
          data-act="up"
          title="上移"
          :disabled="index === 0"
          @click.stop="editor.moveWithinList(node.id, -1)"
        >
          <Icon name="up" :size="13" />
        </button>
        <button
          type="button"
          data-act="down"
          title="下移"
          @click.stop="editor.moveWithinList(node.id, 1)"
        >
          <Icon name="down" :size="13" />
        </button>
        <button
          type="button"
          data-act="del"
          title="删除"
          @click.stop="editor.removeBlock(node.id)"
        >
          <Icon name="trash" :size="13" />
        </button>
      </span>
    </div>

    <div class="bc-summary">
      <template v-if="summary.length > 0">{{ summary.join('　') }}</template>
      <span v-else class="bc-empty">未填写参数</span>
    </div>

    <BlockList v-if="isContainer" :list="node.children" :parent-id="node.id" />
  </div>
</template>
