<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { Richtext } from '../richtext/Richtext.ts'
import { str } from '../params.ts'

const props = defineProps<BlockProps>()

const kind = computed(() => {
  const raw = str(props.params.type, 'info')
  return ['info', 'warning', 'error'].includes(raw) ? raw : 'info'
})
const modifier = computed(() => (kind.value === 'info' ? '' : ` notice-${kind.value}`))
const glyph = computed(() => (kind.value === 'info' ? 'i' : '!'))
const text = computed(() => str(props.params.text))
</script>

<template>
  <div class="notice" :class="modifier.trim()">
    <span class="n-icon" aria-hidden="true">{{ glyph }}</span>
    <div class="n-body">
      <p><Richtext :text="text" /></p>
    </div>
  </div>
</template>
