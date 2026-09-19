<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { str } from '../params.ts'
import { assetHref } from '../url.ts'
import { useSite } from '../site-context.ts'

const props = defineProps<BlockProps>()
const site = useSite()

const src = computed(() => assetHref(site.base, str(props.params.src).trim()))
const caption = computed(() => str(props.params.caption))
const width = computed(() => str(props.params.width).trim())
const alignClass = computed(() => {
  const align = str(props.params.align, '随流')
  if (align === '左浮动') return 'fig-left'
  if (align === '右浮动') return 'fig-right'
  return 'fig-center'
})
</script>

<template>
  <figure class="figure" :class="alignClass">
    <span class="fig-inner">
      <img v-if="src" :src="src" :alt="caption" :style="width ? { width } : undefined">
    </span>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
