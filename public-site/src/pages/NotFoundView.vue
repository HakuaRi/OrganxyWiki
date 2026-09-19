<script setup lang="ts">
import { computed } from 'vue'
import { SITE, siteHref } from '../content.ts'
import { useHead } from '../head.ts'

useHead(computed(() => `页面不存在 - ${SITE.name}`))
</script>

<template>
  <div class="site-sub">出自 {{ SITE.name }}</div>
  <h1 class="firstHeading">页面不存在</h1>

  <div class="mw-parser-output">
    <div class="notice notice-warning">
      <span class="n-icon" aria-hidden="true">!</span>
      <div class="n-body">
        <p>没有找到这个地址对应的页面。它可能已经被移动或删除。</p>
      </div>
    </div>
    <p>可以回到<a :href="siteHref('/')">首页</a>，或者从左侧的导航里重新找。</p>
  </div>
</template>
