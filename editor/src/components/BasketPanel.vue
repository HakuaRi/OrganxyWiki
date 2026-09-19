<script setup lang="ts">
/** 左栏：内容块篮子。按住拖进画布，或直接点一下追加到末尾。 */

import { computed, ref } from 'vue'
import { templatesByGroup, type BlockType, type TemplateSchema } from '@wiki/shared'

import { useEditor } from '../state/editor.ts'
import { startDrag } from '../state/drag.ts'
import Icon from './Icon.vue'

const editor = useEditor()
const keyword = ref('')

const groups = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  return templatesByGroup()
    .map((group) => ({
      group: group.group,
      items: group.items.filter((item) =>
        word === '' ? true : `${item.name}${item.label}`.toLowerCase().includes(word)
      )
    }))
    .filter((group) => group.items.length > 0)
})

function onDragStart(event: DragEvent, schema: TemplateSchema): void {
  startDrag({ kind: 'new', type: schema.name as BlockType })
  if (event.dataTransfer !== null) {
    event.dataTransfer.setData('text/plain', schema.name)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function onChipClick(schema: TemplateSchema): void {
  editor.appendBlock(schema.name as BlockType)
}
</script>

<template>
  <section class="panel basket">
    <div class="panel-head">
      <b><Icon name="basket" />内容块篮子</b>
      <span class="sub">拖到画布</span>
    </div>
    <div class="panel-body">
      <input v-model="keyword" type="search" class="filter" placeholder="筛选内容块">

      <div v-for="group in groups" :key="group.group" class="basket-group">
        <h4>{{ group.group }}</h4>
        <div class="chips">
          <div
            v-for="item in group.items"
            :key="item.name"
            class="block-chip"
            :class="{ danger: item.dangerous === true }"
            draggable="true"
            :title="`${item.label}（${item.name}）`"
            @dragstart="onDragStart($event, item)"
            @click="onChipClick(item)"
          >
            <span class="icon"><Icon :name="item.name" /></span>
            <span class="names">
              <span class="zh">{{ item.label }}</span>
              <span class="en">{{ item.name }}</span>
            </span>
          </div>
        </div>
      </div>

      <p v-if="groups.length === 0" class="basket-hint">没有匹配的内容块。</p>
      <p v-else class="basket-hint">
        按住任意一块拖进中间画布，落点会显示一条插入线；拖到已有块的上半或下半决定插在它前面还是后面。
        也可以直接点一下，追加到页面末尾。
      </p>
    </div>
  </section>
</template>
