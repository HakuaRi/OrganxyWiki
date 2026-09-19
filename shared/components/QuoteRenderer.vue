<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { Richtext } from '../richtext/Richtext.ts'
import { str } from '../params.ts'

const props = defineProps<BlockProps>()
const text = computed(() => str(props.params.text))
const source = computed(() => str(props.params.source))
</script>

<template>
  <blockquote class="quote">
    <p class="q-text"><Richtext :text="text" /></p>
    <span v-if="source" class="q-src">{{ source }}</span>
  </blockquote>
</template>
