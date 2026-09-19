<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { bool, str } from '../params.ts'

const props = defineProps<BlockProps>()
const title = computed(() => str(props.params.title))
const expanded = computed(() => bool(props.params.expanded, false))
</script>

<template>
  <details class="collapsible" :open="expanded">
    <summary>{{ title }}</summary>
    <div class="col-body">
      <slot />
    </div>
  </details>
</template>
