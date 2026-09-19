<script setup lang="ts">
/**
 * 占位页：为计划中但尚未实现的入口提供真实页面，
 * 这样导航里不会出现死链接。M4 会逐个替换成真实实现。
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SITE } from '../content.ts'
import { useHead } from '../head.ts'
import { TOOL_TITLES } from '../router.ts'

const route = useRoute()

const heading = computed(() => {
  const tool = route.params.tool
  if (typeof tool === 'string' && TOOL_TITLES[tool] !== undefined) return TOOL_TITLES[tool]
  return String(route.meta.title ?? '尚未实现')
})

const note = computed(() => String(route.meta.note ?? '这个入口尚未接入，计划见 steps.md 的 M4。'))

useHead(computed(() => `${heading.value} - ${SITE.name}`))
</script>

<template>
  <div class="site-sub">出自 {{ SITE.name }}</div>
  <h1 class="firstHeading">{{ heading }}</h1>

  <div class="mw-parser-output">
    <div class="notice">
      <span class="n-icon" aria-hidden="true">i</span>
      <div class="n-body">
        <p>{{ note }}</p>
      </div>
    </div>
    <p>
      相关工具的其他入口：<a :href="`${SITE.base}tools/backlinks`">链入页面</a>、<a :href="`${SITE.base}tools/page-info`">页面信息</a>、<a :href="`${SITE.base}tools/cite`">引用本页</a>。
    </p>
  </div>
</template>
