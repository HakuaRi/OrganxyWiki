<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { Richtext } from '../richtext/Richtext.ts'
import { str } from '../params.ts'

const props = defineProps<BlockProps>()
const text = computed(() => str(props.params.text))
</script>

<template>
  <p><Richtext :text="text" /></p>
</template>
