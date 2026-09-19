<script setup lang="ts">
/**
 * 站点外壳：顶栏、三栏布局、标签行与页脚。
 * 视觉全部来自 shared/styles/wiki.css，与样板一致。
 */

import { computed } from 'vue'
import { buildOutline } from '@wiki/shared'
import {
  PAGE_META,
  SITE,
  categoryHref,
  formatDate,
  historyHrefOf,
  pageHrefOf,
  searchAction,
  siteHref,
  useCurrentPage
} from '../content.ts'
import Toc from '../components/Toc.vue'

const page = useCurrentPage()

const outline = computed(() => (page.value ? buildOutline(page.value.data.blocks ?? []) : []))
const categories = computed(() => page.value?.data.categories ?? [])
const lastEdited = computed(() => (page.value?.meta ? formatDate(page.value.meta.updatedAt) : ''))
const historyHref = computed(() => (page.value ? historyHrefOf(page.value.path) : ''))
const editHref = computed(() => {
  if (page.value === null || SITE.editorBase.trim() === '') return ''
  const base = SITE.editorBase.endsWith('/') ? SITE.editorBase : `${SITE.editorBase}/`
  return `${base}#/${page.value.path}`
})

/** 左栏的页面列表，首页除外。 */
const pageList = computed(() => PAGE_META.filter((item) => item.slug !== 'main/home'))
</script>

<template>
  <header class="site-header">
    <a class="logo" :href="siteHref('/')">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect x=".75" y=".75" width="30.5" height="30.5" rx="5" style="fill:none;stroke:#e6e7e6"/>
        <path d="M8 23c3-8 6-12 8-12s5 4 8 12" style="fill:none;stroke:#5f7d10" stroke-width="1.8"/>
        <path d="M5 25h22" style="stroke:#7d838a" stroke-width="1.2"/>
      </svg>
      <span>
        <span class="wordmark">{{ SITE.name }}</span>
        <span class="tagline">{{ SITE.tagline }}</span>
      </span>
    </a>

    <form class="search" role="search" :action="searchAction()" method="get">
      <input type="search" name="q" placeholder="搜索示例Wiki" aria-label="搜索">
      <button type="submit" aria-label="搜索"><span class="mag" /></button>
    </form>

    <nav class="head-tools">
      <a v-if="editHref !== ''" :href="editHref">编辑本页</a>
    </nav>
  </header>

  <div class="body-wrap">
    <aside class="sidebar">
      <Toc :items="outline" />
      <nav class="portal">
        <h3>导航</h3>
        <ul>
          <li v-for="link in SITE.navigation" :key="link.href">
            <a :href="siteHref(link.href)">{{ link.label }}</a>
          </li>
        </ul>
      </nav>
      <nav v-if="pageList.length > 0" class="portal">
        <h3>全部页面</h3>
        <ul>
          <li v-for="item in pageList" :key="item.slug">
            <a :href="pageHrefOf(item.slug, SITE.base)">{{ item.title }}</a>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="content">
      <nav class="tabs" aria-label="页面操作">
        <span class="tab-list">
          <span class="tab active"><a :href="siteHref('/')">页面</a></span>
        </span>
        <span class="tab-list">
          <span class="tab active"><a href="#">{{ '阅读' }}</a></span>
          <span v-if="editHref !== ''" class="tab"><a :href="editHref">编辑</a></span>
          <span v-if="historyHref !== ''" class="tab">
            <a class="ext" :href="historyHref" target="_blank" rel="noopener noreferrer">查看历史</a>
          </span>
        </span>
      </nav>

      <router-view />

      <footer class="mw-footer">
        <p v-if="lastEdited !== ''" class="last-edit">
          本页面最后编辑于 {{ lastEdited }}。
          <template v-if="historyHref !== ''">
            历史记录见
            <a class="ext" :href="historyHref" target="_blank" rel="noopener noreferrer">GitHub 提交历史</a>。
          </template>
        </p>
        <ul>
          <li v-for="link in SITE.footer" :key="link.href">
            <a :href="siteHref(link.href)">{{ link.label }}</a>
          </li>
        </ul>
        <p>{{ SITE.license }}</p>
      </footer>
    </main>

    <aside class="tools">
      <h3>工具</h3>
      <ul>
        <li v-for="tool in SITE.tools" :key="tool.href">
          <a :href="siteHref(tool.href)">{{ tool.label }}</a>
        </li>
        <li v-if="historyHref !== ''">
          <a class="ext" :href="historyHref" target="_blank" rel="noopener noreferrer">查看历史</a>
        </li>
      </ul>
      <template v-if="categories.length > 0">
        <h3>分类</h3>
        <ul>
          <li v-for="name in categories" :key="name">
            <a :href="categoryHref(name)">{{ name }}</a>
          </li>
        </ul>
      </template>
    </aside>
  </div>
</template>
