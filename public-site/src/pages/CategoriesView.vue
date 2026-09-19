<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIES, PAGE_META, SITE, categoryHref, pageHrefOf } from '../content.ts'
import { useHead } from '../head.ts'

const groups = computed(() =>
  Object.entries(CATEGORIES)
    .map(([name, slugs]) => ({
      name,
      pages: slugs.map((slug) => ({
        slug,
        title: PAGE_META.find((item) => item.slug === slug)?.title ?? slug
      }))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
)

useHead(computed(() => `全部分类 - ${SITE.name}`))
</script>

<template>
  <div class="site-sub">出自 {{ SITE.name }}</div>
  <h1 class="firstHeading">全部分类</h1>

  <div class="mw-parser-output">
    <p>共 {{ groups.length }} 个分类。</p>
    <section v-for="group in groups" :key="group.name" class="sidebar-tpl">
      <div class="st-title"><a :href="categoryHref(group.name)">{{ group.name }}</a></div>
      <div class="st-body">
        <div class="st-block">
          <ul>
            <li v-for="item in group.pages" :key="item.slug">
              <a :href="pageHrefOf(item.slug, SITE.base)">{{ item.title }}</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
