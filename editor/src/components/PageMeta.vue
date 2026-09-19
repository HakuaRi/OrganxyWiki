<script setup lang="ts">
/** 页面级信息：标题、分类、路径（移动），以及页面级裸露修改接口。 */

import { computed, ref } from 'vue'

import { useEditor } from '../state/editor.ts'
import { usePages } from '../state/pages.ts'
import Icon from './Icon.vue'

const editor = useEditor()
const pages = usePages()

const pathDraft = ref('')
const editingPath = ref(false)

const categoryText = computed({
  get: () => editor.pageCategories.value.join('、'),
  set: (value: string) => editor.setCategories(value)
})

function startMove(): void {
  pathDraft.value = editor.pagePath.value
  editingPath.value = true
}

async function confirmMove(): Promise<void> {
  await pages.moveCurrentPage(pathDraft.value)
  editingPath.value = false
}
</script>

<template>
  <div class="page-meta">
    <label class="field">
      <span class="flabel">标题</span>
      <input
        type="text"
        :value="editor.pageTitle.value"
        placeholder="页面标题"
        @input="editor.setTitle(($event.target as HTMLInputElement).value)"
      >
    </label>

    <label class="field">
      <span class="flabel">分类</span>
      <input type="text" :value="categoryText" placeholder="用顿号分隔，例如：北宋官员、杭州人" @input="categoryText = ($event.target as HTMLInputElement).value">
    </label>

    <div class="field">
      <span class="flabel">路径</span>
      <div v-if="editingPath" class="path-edit">
        <input v-model="pathDraft" type="text" spellcheck="false">
        <button type="button" class="btn" :disabled="editor.saving.value" @click="confirmMove()">移动</button>
        <button type="button" class="btn" @click="editingPath = false">取消</button>
      </div>
      <div v-else class="path-view">
        <code>{{ editor.pagePath.value }}</code>
        <button type="button" class="btn" @click="startMove()">移动</button>
      </div>
      <span class="fhint">路径用 ASCII slug，标题用中文；路径的第一段是命名空间。</span>
    </div>

    <details class="advanced">
      <summary>页面级裸露修改</summary>
      <label class="field">
        <span class="flabel">raw.css</span>
        <textarea
          rows="3"
          :value="editor.pageRaw.value.css"
          placeholder="只作用于这一页的 CSS"
          @input="editor.setPageRaw('css', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>
      <label class="field">
        <span class="flabel">raw.js</span>
        <textarea
          rows="3"
          :value="editor.pageRaw.value.js"
          placeholder="这一页挂载后执行的 JS"
          @input="editor.setPageRaw('js', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>
      <p class="ins-note">页面级接口作用于整页；单块的定制写在右侧「块属性」的高级里。</p>
    </details>

    <div v-if="pages.listError.value !== ''" class="error-text">
      <Icon name="Notice" :size="14" />{{ pages.listError.value }}
    </div>
  </div>
</template>
