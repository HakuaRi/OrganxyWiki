<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { str } from '../params.ts'

const props = defineProps<BlockProps>()
const html = computed(() => str(props.params.html))
</script>

<template>
  <!-- 危险块：按 plan.md 5.3 直接输出，不做转义。 -->
  <div class="raw-html" v-html="html" />
</template>
