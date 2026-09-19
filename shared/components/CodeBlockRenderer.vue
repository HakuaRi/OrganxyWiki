<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { str } from '../params.ts'

const props = defineProps<BlockProps>()
const code = computed(() => str(props.params.code))
</script>

<template>
  <pre class="code">{{ code }}</pre>
</template>
