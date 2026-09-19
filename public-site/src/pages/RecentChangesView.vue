<script setup lang="ts">
import { computed } from 'vue'
import { SITE, formatDate, pageHrefOf } from '../content.ts'
import { useHead } from '../head.ts'
import { RECENT_CHANGES } from '../content.ts'

useHead(computed(() => `最近更改 - ${SITE.name}`))
</script>

<template>
  <div class="site-sub">出自 {{ SITE.name }}</div>
  <h1 class="firstHeading">最近更改</h1>

  <div class="mw-parser-output">
    <p>按内容文件的最后修改时间倒序排列，共 {{ RECENT_CHANGES.length }} 条。</p>
    <table class="wikitable">
      <thead>
        <tr>
          <th>页面</th>
          <th>时间</th>
          <th>摘要</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in RECENT_CHANGES" :key="item.path">
          <td><a :href="pageHrefOf(item.path, SITE.base)">{{ item.title }}</a></td>
          <td>{{ formatDate(item.updatedAt) }}</td>
          <td>{{ item.excerpt }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
