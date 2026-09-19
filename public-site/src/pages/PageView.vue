<script setup lang="ts">
import { computed, provide } from 'vue'
import { BlockRenderer, PAGE_KEY } from '@wiki/shared'
import { SITE, categoryHref, useCurrentPage } from '../content.ts'
import { useHead } from '../head.ts'
import NotFoundView from './NotFoundView.vue'

const page = useCurrentPage()

// 章节标题上的「编辑」链接要知道自己在哪一页，这里把当前页面路径注入下去。
provide(PAGE_KEY, () => page.value?.path ?? '')

useHead(
  computed(() => (page.value ? `${page.value.data.title} - ${SITE.name}` : SITE.name)),
  computed(() => page.value?.meta?.excerpt ?? SITE.tagline)
)

const categories = computed(() => page.value?.data.categories ?? [])
</script>

<template>
  <template v-if="page">
    <div class="site-sub">出自 {{ SITE.name }}</div>
    <h1 class="firstHeading">{{ page.data.title }}</h1>

    <div class="mw-parser-output">
      <BlockRenderer
        v-for="(block, index) in page.data.blocks"
        :key="index"
        :block="block"
        :path="String(index)"
      />
    </div>

    <div v-if="categories.length > 0" class="catlinks">
      <b>分类</b>
      <template v-for="(name, index) in categories" :key="name">
        <span v-if="index > 0" class="cat-sep">、</span><a :href="categoryHref(name)">{{ name }}</a>
      </template>
    </div>
  </template>

  <NotFoundView v-else />
</template>
