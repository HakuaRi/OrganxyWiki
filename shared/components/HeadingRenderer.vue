<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { str } from '../params.ts'
import { editorHref } from '../url.ts'
import { usePageTarget, useSite } from '../site-context.ts'
import { headingId } from '../outline.ts'

const props = defineProps<BlockProps>()

const site = useSite()
const pageTarget = usePageTarget()

const level = computed(() => {
  const raw = str(props.params.level, '2')
  return ['2', '3', '4'].includes(raw) ? raw : '2'
})
const tag = computed(() => `h${level.value}`)
/** 顶层块的 path 就是它的序号，与目录里的锚点一致。 */
const anchor = computed(() => (/^\d+$/.test(props.path) ? headingId(Number(props.path)) : `sec-${props.path}`))
const editHref = computed(() => editorHref(site.editorBase, pageTarget()))
</script>

<template>
  <component :is="tag" :id="anchor">
    {{ str(params.text) }}
    <span v-if="editHref" class="mw-editsection">[<a :href="editHref">编辑</a>]</span>
  </component>
</template>
