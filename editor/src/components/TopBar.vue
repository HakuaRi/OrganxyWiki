<script setup lang="ts">
/** 顶栏：页面选择、视图切换、历史操作、保存与登录入口。 */

import { computed, ref } from 'vue'

import { useEditor } from '../state/editor.ts'
import { SITE } from '../data/pages.ts'
import { usePages } from '../state/pages.ts'
import { activeSource } from '../state/source.ts'
import { repoConfigured } from '../state/settings.ts'
import { useAuth } from '../state/auth.ts'
import SettingsPanel from './SettingsPanel.vue'
import Icon from './Icon.vue'

const editor = useEditor()
const pages = usePages()
const auth = useAuth()

const settingsOpen = ref(false)

const options = computed(() => {
  const list = pages.pageList.value.map((entry) => entry.path)
  if (!list.includes(editor.pagePath.value)) list.push(editor.pagePath.value)
  return list
})

function labelOf(path: string): string {
  const hit = pages.pageList.value.find((entry) => entry.path === path)
  return hit === undefined ? `${path}　未保存` : `${path}　${hit.title}`
}

/** 当前状态，直接说清楚现在处在什么模式、有没有未提交的改动。 */
const stateText = computed(() => {
  if (editor.draftRestored.value) return '本地草稿'
  if (activeSource() === 'local') return '本地模式'
  if (editor.dirty.value) return '有未提交改动'
  return '与仓库一致'
})

/** 保存按钮为什么不能按。 */
const saveHint = computed(() => {
  if (!repoConfigured.value) return '先在设置里填写仓库坐标'
  if (!auth.signedIn.value) return '先在设置里登录 GitHub'
  if (!editor.dirty.value) return '当前没有未提交的改动'
  return '提交到 GitHub'
})

const canSave = computed(() => repoConfigured.value && auth.signedIn.value && editor.dirty.value)

function onSelect(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  void pages.openPage(value)
}
</script>

<template>
  <header class="ed-top">
    <div class="ed-brand">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect x=".75" y=".75" width="30.5" height="30.5" rx="5" style="fill:none;stroke:#e6e7e6"/>
        <path d="M8 23c3-8 6-12 8-12s5 4 8 12" style="fill:none;stroke:#5f7d10" stroke-width="1.8"/>
        <path d="M5 25h22" style="stroke:#7d838a" stroke-width="1.2"/>
      </svg>
      <span>
        <span class="wordmark">{{ SITE.name }}</span>
        <span class="tag">编辑系统</span>
      </span>
    </div>

    <div class="ed-page">
      <Icon name="doc" />
      <select :value="editor.pagePath.value" :disabled="pages.listBusy.value" @change="onSelect">
        <option v-for="path in options" :key="path" :value="path">{{ labelOf(path) }}</option>
      </select>
      <span class="muted">{{ stateText }}</span>
      <span v-if="pages.listBusy.value" class="muted">读取中</span>
    </div>

    <span class="spacer" />

    <div class="ed-actions">
      <span class="seg" role="group" aria-label="视图">
        <button type="button" :aria-pressed="editor.mode.value === 'tree'" @click="editor.setMode('tree')">
          <Icon name="tree" :lead="true" />结构视图
        </button>
        <button type="button" :aria-pressed="editor.mode.value === 'preview'" @click="editor.setMode('preview')">
          <Icon name="eye" :lead="true" />成稿预览
        </button>
      </span>

      <button type="button" class="btn" :disabled="!editor.canUndo.value" title="撤销（Ctrl+Z）" @click="editor.undo()">
        <Icon name="undo" :lead="true" />撤销
      </button>
      <button type="button" class="btn" :disabled="!editor.canRedo.value" title="重做（Ctrl+Shift+Z）" @click="editor.redo()">
        <Icon name="redo" :lead="true" />重做
      </button>

      <button type="button" class="btn" @click="settingsOpen = true">
        <Icon name="sliders" :lead="true" />设置
      </button>
      <button type="button" class="btn" @click="pages.reloadPage()">
        <Icon name="reload" :lead="true" />重新载入
      </button>
      <button type="button" class="btn" @click="editor.clearBlocks()">
        <Icon name="clear" :lead="true" />清空
      </button>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="!canSave || editor.saving.value"
        :title="saveHint"
        @click="pages.saveCurrentPage()"
      >
        <Icon name="save" :lead="true" />{{ editor.saving.value ? '提交中' : '保存' }}
      </button>
      <button
        type="button"
        class="btn"
        :disabled="!auth.signedIn.value || editor.saving.value"
        :title="auth.signedIn.value ? '删除这一页并提交' : '先登录'"
        @click="pages.deleteCurrentPage()"
      >
        <Icon name="trash" :lead="true" />删除
      </button>

      <button v-if="auth.signedIn.value" type="button" class="btn" @click="auth.signOut()">
        <Icon name="logout" :lead="true" />退出 {{ auth.auth.value?.login }}
      </button>
      <button v-else type="button" class="btn" @click="settingsOpen = true">
        <Icon name="upload" :lead="true" />登录
      </button>
    </div>

    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" />
  </header>
</template>
