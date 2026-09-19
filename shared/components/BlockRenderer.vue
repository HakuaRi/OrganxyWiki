<script setup lang="ts">
/**
 * 递归渲染一个块。
 *
 * 职责只有三件：
 *   1. 按 type 找到渲染组件，把 params 传下去；
 *   2. 把 children 递归渲染后放进默认插槽；
 *   3. 处理块级裸露修改接口（_raw）：CSS 做作用域包裹后随渲染输出，
 *      JS 在挂载后以块根元素为参数执行，只在浏览器端跑。
 */

import { computed, onMounted, ref, type Component } from 'vue'
import type { Block } from '../types/content.ts'
import { useRawJsEnabled } from '../site-context.ts'
import { COMPONENTS } from './registry.ts'
import { scopeCss } from './scoped-css.ts'
import UnknownBlock from './UnknownBlock.vue'

const props = defineProps<{ block: Block; path: string }>()

const rawJsEnabled = useRawJsEnabled()

const component = computed<Component | null>(
  () => (COMPONENTS as Record<string, Component>)[props.block.type] ?? null
)

const scopeClass = computed(() => (props.block._raw?.css ? `blk-${props.path}` : ''))

/** 只有真的需要作用域时才绑 class，否则会渲染出空的 class=""。 */
const scopeAttrs = computed(() => (scopeClass.value === '' ? {} : { class: scopeClass.value }))

const scopedCss = computed(() => {
  const css = props.block._raw?.css
  return css ? scopeCss(css, `.blk-${props.path}`) : ''
})

const rootEl = ref<{ $el?: Element } | null>(null)

onMounted(() => {
  const js = props.block._raw?.js
  if (js === undefined || js.trim() === '') return
  if (!rawJsEnabled) return
  const element = (rootEl.value?.$el ?? null) as Element | null
  try {
    // 约定：脚本只操作传进来的这个根元素内部，不要碰全局。
    new Function('root', js)(element)
  } catch (error) {
    console.error(`[raw] 第 ${props.path} 个块的 _raw.js 执行失败`, error)
  }
})
</script>

<template>
  <component
    :is="component"
    v-if="component"
    ref="rootEl"
    v-bind="scopeAttrs"
    :params="block.params"
    :path="path"
  >
    <BlockRenderer
      v-for="(child, index) in block.children"
      :key="index"
      :block="child"
      :path="`${path}-${index}`"
    />
  </component>
  <UnknownBlock v-else :type="block.type" />
  <component :is="'style'" v-if="scopedCss">{{ scopedCss }}</component>
</template>
