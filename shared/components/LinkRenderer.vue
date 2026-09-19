<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { pageHref, isReservedRoute } from '../url.ts'
import { str } from '../params.ts'
import { usePageIndex, useSite } from '../site-context.ts'

const props = defineProps<BlockProps>()

const site = useSite()
const index = usePageIndex()

const target = computed(() => str(props.params.target).trim())
const label = computed(() => str(props.params.text).trim() || target.value)
const href = computed(() => pageHref(site.base, target.value))
const missing = computed(() => {
  if (index.size === 0 || target.value === '') return false
  if (isReservedRoute(target.value)) return false
  const clean = target.value.replace(/^\/+/, '')
  const namespaced = clean.includes('/') ? clean : `main/${clean}`
  return !index.has(clean) && !index.has(namespaced)
})
</script>

<template>
  <p>
    <a :href="href" v-bind="missing ? { class: 'new', title: '该页面尚未创建' } : {}">{{ label }}</a>
  </p>
</template>
