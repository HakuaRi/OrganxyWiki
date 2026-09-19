<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { CATEGORIES, PAGE_META, SITE, pageHrefOf } from '../content.ts'
import { useHead } from '../head.ts'

const route = useRoute()
const name = computed(() => String(route.params.name ?? ''))

const entries = computed(() =>
  (CATEGORIES[name.value] ?? []).map((slug) => ({
    slug,
    title: PAGE_META.find((item) => item.slug === slug)?.title ?? slug
  }))
)

useHead(computed(() => `分类:${name.value} - ${SITE.name}`))
</script>

<template>
  <div class="site-sub">出自 {{ SITE.name }}</div>
  <h1 class="firstHeading">分类:{{ name }}</h1>

  <div class="mw-parser-output">
    <p>属于本分类的页面共 {{ entries.length }} 个。</p>
    <ul>
      <li v-for="entry in entries" :key="entry.slug">
        <a :href="pageHrefOf(entry.slug, SITE.base)">{{ entry.title }}</a>
      </li>
    </ul>
  </div>
</template>
