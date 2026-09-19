<script setup lang="ts">
/**
 * 递归的块列表，同时是放置目标。
 *
 * 每个列表自己处理 dragover 与 drop，并且阻止冒泡，
 * 这样嵌套时落点只会落在最内层那个列表上。
 */

import { computed, ref, watch } from 'vue'

import { useEditor } from '../state/editor.ts'
import { dragPayload, dragging, endDrag } from '../state/drag.ts'
import type { EditNode } from '../state/tree.ts'
import BlockCard from './BlockCard.vue'
import Icon from './Icon.vue'

const props = defineProps<{ list: EditNode[]; parentId: string }>()

const editor = useEditor()

const nested = computed(() => props.parentId !== 'root')
/** 插入线当前落在第几个位置，null 表示不显示。 */
const insertIndex = ref<number | null>(null)

watch(dragging, (active) => {
  if (!active) insertIndex.value = null
})

function onDragOver(event: DragEvent): void {
  if (dragPayload.value === null) return
  event.preventDefault()
  event.stopPropagation()

  const container = event.currentTarget as HTMLElement
  const cards = Array.from(container.children).filter((child) =>
    (child as HTMLElement).classList.contains('block-card')
  ) as HTMLElement[]

  let index = cards.length
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect()
    if (event.clientY < rect.top + rect.height / 2) {
      index = i
      break
    }
  }
  insertIndex.value = index
}

function onDrop(event: DragEvent): void {
  const payload = dragPayload.value
  if (payload === null) return
  event.preventDefault()
  event.stopPropagation()

  const index = insertIndex.value ?? props.list.length
  insertIndex.value = null

  if (payload.kind === 'new') editor.insertBlock(props.parentId, index, payload.type)
  else editor.moveBlock(payload.id, props.parentId, index)

  endDrag()
}
</script>

<template>
  <div
    class="children-list"
    :class="{ nested }"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <div v-if="list.length === 0" class="empty-zone" :class="{ small: nested }">
      <template v-if="nested">
        <Icon name="plus" :size="14" class="ez-inline" />拖到这里成为子块
      </template>
      <template v-else>
        <Icon name="dropin" :size="24" class="ez-ico" />
        这是空页面。把左边篮子里的内容块拖进来，<br>
        顺序就是页面从上到下的顺序。<br>
        <span style="font-size:.9em">也可以先点一下篮子里的块，追加到末尾。</span>
      </template>
    </div>

    <template v-for="(node, index) in list" :key="node.id">
      <div v-if="insertIndex === index" class="ins-line" />
      <BlockCard :node="node" :parent-id="parentId" :index="index" />
    </template>

    <div v-if="insertIndex !== null && insertIndex >= list.length" class="ins-line" />
  </div>
</template>
