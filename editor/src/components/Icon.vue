<script setup lang="ts">
/** 一个内联 SVG 图标。路径表是本地常量，不涉及用户内容。 */

import { computed } from 'vue'
import { PATHS } from './icons.ts'

const props = withDefaults(defineProps<{ name: string; size?: number; lead?: boolean }>(), {
  size: 15,
  lead: false
})

const cls = computed(() => (props.lead ? 'ico ico-lead' : 'ico'))
const body = computed(() => PATHS[props.name] ?? '')
</script>

<template>
  <svg :class="cls" :width="size" :height="size" viewBox="0 0 16 16" aria-hidden="true" v-html="body" />
</template>
