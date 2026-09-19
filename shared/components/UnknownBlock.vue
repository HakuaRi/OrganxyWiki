<script setup lang="ts">
/**
 * 未知块类型：内容引用了没有注册 Schema 的类型时兜底，
 * 而不是整页渲染失败。
 */
defineProps<{ type: string }>()
</script>

<template>
  <div class="notice notice-warning">
    <span class="n-icon" aria-hidden="true">!</span>
    <div class="n-body">
      <p>未知的内容块类型「{{ type }}」，已在渲染时跳过。请在编辑器中移除或改成已注册的类型。</p>
    </div>
  </div>
</template>
