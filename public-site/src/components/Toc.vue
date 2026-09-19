<script setup lang="ts">
import type { OutlineItem } from '@wiki/shared'

defineProps<{ items: OutlineItem[] }>()

/** 只有三级以上才需要缩进样式，二级不绑 class，避免渲染出 class=""。 */
function indent(item: OutlineItem): Record<string, string> {
  if (item.level === 3) return { class: 'lv3' }
  if (item.level === 4) return { class: 'lv4' }
  return {}
}
</script>

<template>
  <details v-if="items.length > 0" class="toc" open>
    <summary class="toc-head">目录</summary>
    <ul>
      <li v-for="item in items" :key="item.id" v-bind="indent(item)">
        <a :href="`#${item.id}`"><span class="num">{{ item.number }}</span>{{ item.label }}</a>
      </li>
    </ul>
  </details>
</template>
