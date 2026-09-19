<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { records, str } from '../params.ts'
import { Richtext } from '../richtext/Richtext.ts'

const props = defineProps<BlockProps>()

const title = computed(() => str(props.params.title))
const simple = computed(() => str(props.params.links).trim())
/** 链接串整体交给富文本渲染，这样 [[目标|显示文字]] 与顿号分隔都能直接写。 */
const groups = computed(() =>
  records(props.params.groups).map((group) => ({
    label: str(group.label),
    links: str(group.links)
  }))
)
</script>

<template>
  <nav class="navbox">
    <div class="nv-title">{{ title }}</div>
    <div v-if="simple !== '' && groups.length === 0" class="nv-row">
      <div class="nv-td"><Richtext :text="simple" /></div>
    </div>
    <div v-for="(group, index) in groups" :key="index" class="nv-row">
      <div class="nv-th">{{ group.label }}</div>
      <div class="nv-td"><Richtext :text="group.links" /></div>
    </div>
  </nav>
</template>
