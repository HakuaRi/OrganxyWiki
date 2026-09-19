<script setup lang="ts">
/** 应用根：注入站点上下文（预览不执行块级 JS），装配三栏工作区与全局快捷键。 */

import { onMounted, onUnmounted, provide, ref } from 'vue'
import { PAGE_INDEX_KEY, RAW_JS_KEY, SITE_KEY } from '@wiki/shared'

import { PAGE_INDEX, SITE } from './data/pages.ts'
import { useEditor } from './state/editor.ts'
import { usePages } from './state/pages.ts'
import { useAuth } from './state/auth.ts'
import { endDrag } from './state/drag.ts'
import TopBar from './components/TopBar.vue'
import BasketPanel from './components/BasketPanel.vue'
import CanvasPanel from './components/CanvasPanel.vue'
import InspectorPanel from './components/InspectorPanel.vue'

const editor = useEditor()
const pages = usePages()
const auth = useAuth()
const booted = ref(false)

provide(SITE_KEY, SITE)
provide(PAGE_INDEX_KEY, PAGE_INDEX)
// 预览只注入块级 CSS，不执行块级 JS（plan.md 8.2）。
provide(RAW_JS_KEY, false)

function onKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    editor.undo()
    return
  }
  if (key === 'z' && event.shiftKey) {
    event.preventDefault()
    editor.redo()
  }
}

onMounted(async () => {
  document.addEventListener('dragend', endDrag)
  window.addEventListener('keydown', onKeydown)

  // 先按当前来源拉列表，再打开第一页；本地模式下这一步不碰网络。
  await pages.refreshList()
  const first = pages.pageList.value[0]?.path ?? 'main/home'
  await pages.openPage(first)
  booted.value = true

  // 本地存过令牌的话，顺手验一次，失效就回到未登录状态。
  if (auth.signedIn.value) void auth.revalidate()
})

onUnmounted(() => {
  document.removeEventListener('dragend', endDrag)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <TopBar />
  <div class="ed-body">
    <BasketPanel />
    <CanvasPanel />
    <InspectorPanel />
  </div>

  <div v-if="!booted" class="toast on">正在载入内容</div>
  <div class="toast" :class="{ on: editor.toastMessage.value !== '' }">
    {{ editor.toastMessage.value }}
  </div>
</template>
