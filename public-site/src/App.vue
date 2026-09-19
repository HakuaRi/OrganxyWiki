<script setup lang="ts">
/** 应用根组件：注入站点配置与页面索引，然后交给站点外壳。 */

import { provide } from 'vue'
import { PAGE_INDEX_KEY, SITE_KEY } from '@wiki/shared'
import { PAGE_INDEX, SITE } from './content.ts'
import WikiLayout from './layouts/WikiLayout.vue'

provide(SITE_KEY, SITE)
provide(PAGE_INDEX_KEY, PAGE_INDEX)
</script>

<template>
  <WikiLayout />
</template>
