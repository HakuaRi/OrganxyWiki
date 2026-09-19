<script setup lang="ts">
/** 画布：页面级信息、结构视图（可拖拽的块树）与成稿预览两种模式。 */

import { computed } from 'vue'

import { useEditor } from '../state/editor.ts'
import { usePages } from '../state/pages.ts'
import { dragging } from '../state/drag.ts'
import BlockList from './BlockList.vue'
import PageMeta from './PageMeta.vue'
import PreviewCanvas from './PreviewCanvas.vue'
import Icon from './Icon.vue'

const editor = useEditor()
const pages = usePages()

const draftLabel = computed(() => {
  if (!editor.draftRestored.value) return ''
  const raw = editor.draftSavedAt.value
  if (raw === '') return '已恢复本地草稿'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '已恢复本地草稿'
  return `已恢复本地草稿（保存于 ${date.toLocaleString('zh-CN', { hour12: false })}）`
})

/** 编辑过程中提示草稿已经自动存到本地。 */
const autoSaved = computed(() => {
  if (editor.draftRestored.value) return false
  const raw = editor.draftSavedAt.value
  if (raw === '') return false
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false
  return `草稿已自动保存 ${date.toLocaleTimeString('zh-CN', { hour12: false })}`
})
</script>

<template>
  <section class="panel canvas">
    <div class="canvas-head">
      <span class="path">{{ editor.pagePath.value }}</span>
      <span class="count">共 {{ editor.blockCount.value }} 个块（顶层 {{ editor.blocks.value.length }} 个）</span>
      <span class="spacer" />
      <span v-if="autoSaved !== false" class="count">{{ autoSaved }}</span>
      <span class="count"><Icon name="grip" :size="14" :lead="true" />拖动块可排序，拖进虚线区可嵌套</span>
    </div>

    <div class="canvas-body" :class="{ dragging }">
      <div v-if="draftLabel !== ''" class="draft-bar">
        <span>{{ draftLabel }}</span>
        <span class="spacer" />
        <button type="button" class="btn" @click="pages.discardDraft()">丢弃草稿</button>
      </div>

      <PageMeta />

      <BlockList v-if="editor.mode.value === 'tree'" :list="editor.blocks.value" parent-id="root" />
      <PreviewCanvas v-else />
    </div>
  </section>
</template>
