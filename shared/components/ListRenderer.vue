<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { str } from '../params.ts'
import { Richtext } from '../richtext/Richtext.ts'

const props = defineProps<BlockProps>()

const ordered = computed(() => str(props.params.style, '无序') === '有序')
const items = computed(() =>
  str(props.params.items)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
)
</script>

<template>
  <component :is="ordered ? 'ol' : 'ul'">
    <li v-for="(item, index) in items" :key="index"><Richtext :text="item" /></li>
  </component>
</template>
