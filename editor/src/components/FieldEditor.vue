<script setup lang="ts">
/** 单个字段的编辑器，按 Schema 里的字段类型分发。 */

import { computed, ref } from 'vue'
import { records, str, type FieldSchema } from '@wiki/shared'

import { useEditor } from '../state/editor.ts'
import { uploadImage } from '../state/source.ts'
import { useAuth } from '../state/auth.ts'
import { repoConfigured } from '../state/settings.ts'
import type { EditNode } from '../state/tree.ts'
import Icon from './Icon.vue'

const props = defineProps<{ node: EditNode; field: FieldSchema }>()

const editor = useEditor()
const auth = useAuth()

const value = computed(() => props.node.params[props.field.key])
const text = computed(() => str(value.value))
const rows = computed(() => records(value.value))

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

/** 原图上传需要仓库坐标与登录，缺一个就不让点。 */
const canUpload = computed(() => repoConfigured.value && auth.signedIn.value)

const MB = 1024 * 1024

/** 文本类字段：连续键入合并成一个历史项。 */
function onText(event: Event): void {
  editor.updateParam(props.node.id, props.field.key, (event.target as HTMLInputElement).value, true)
}

function onSelectValue(event: Event): void {
  editor.updateParam(props.node.id, props.field.key, (event.target as HTMLSelectElement).value)
}

function onCheck(event: Event): void {
  editor.updateParam(props.node.id, props.field.key, (event.target as HTMLInputElement).checked)
}

function pickFile(): void {
  if (!canUpload.value) {
    editor.toast('上传原图需要先在设置里填好仓库坐标并登录 GitHub。')
    return
  }
  fileInput.value?.click()
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file === undefined) return

  // 按 plan.md 8.2 的约定不压缩、直接传原图，所以这里只做提示与阻断。
  if (file.size > 90 * MB) {
    editor.toast(`这个文件 ${(file.size / MB).toFixed(1)}MB，超过 GitHub 的单文件上限，换一张或先自行压缩。`)
    return
  }
  if (file.size > 20 * MB) {
    editor.toast(`这个文件 ${(file.size / MB).toFixed(1)}MB，原图上传会比较慢，请等一会儿。`)
  }

  uploading.value = true
  try {
    const result = await uploadImage(file)
    editor.updateParam(props.node.id, props.field.key, result.url)
    editor.toast(`已上传原图，字段值填成 ${result.url}。`)
  } catch (failure) {
    editor.toast(`上传失败：${(failure as Error).message}`)
  } finally {
    uploading.value = false
  }
}

function onRowInput(index: number, key: string, event: Event): void {
  editor.updateRow(
    props.node.id,
    props.field.key,
    index,
    key,
    (event.target as HTMLInputElement).value,
    true
  )
}
</script>

<template>
  <div v-if="field.type === 'boolean'" class="field">
    <label class="check">
      <input type="checkbox" :checked="value === true" @change="onCheck">
      {{ field.label }}
    </label>
  </div>

  <label v-else class="field">
    <span class="flabel">
      {{ field.label }}
      <i v-if="field.required === true" class="req">必填</i>
    </span>

    <textarea
      v-if="field.type === 'richtext' || field.type === 'code'"
      :rows="field.type === 'richtext' ? 5 : 6"
      :value="text"
      @input="onText"
    />

    <select v-else-if="field.type === 'select'" :value="text" @change="onSelectValue">
      <option v-for="option in field.options ?? []" :key="option" :value="option">{{ option }}</option>
    </select>

    <div v-else-if="field.type === 'image'" class="with-btn">
      <input type="text" :value="text" placeholder="/media/文件名.svg" @input="onText">
      <button
        type="button"
        class="btn"
        :disabled="uploading"
        :title="canUpload ? '上传原图并回填路径' : '需要先填仓库坐标并登录'"
        @click="pickFile()"
      >
        <Icon name="upload" :size="14" :lead="true" />{{ uploading ? '上传中' : '上传' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile">
    </div>

    <div v-else-if="field.type === 'template-list'" class="rows-editor">
      <div v-for="(row, index) in rows" :key="index" class="row-item">
        <input
          v-for="itemField in field.itemFields ?? []"
          :key="itemField.key"
          type="text"
          :value="str(row[itemField.key])"
          :placeholder="itemField.label"
          @input="onRowInput(index, itemField.key, $event)"
        >
        <button
          type="button"
          class="row-del"
          title="删除这一行"
          @click="editor.removeRow(node.id, field.key, index)"
        >
          <Icon name="trash" :size="13" />
        </button>
      </div>
      <button type="button" class="row-add" @click="editor.addRow(node.id, field.key)">
        <Icon name="plus" :size="13" :lead="true" />添加一行
      </button>
    </div>

    <input v-else type="text" :value="text" @input="onText">

    <span v-if="field.hint !== undefined" class="fhint">{{ field.hint }}</span>
  </label>
</template>
