<script setup lang="ts">
/** 右栏：按选中块的 Schema 自动生成参数表单，底部是块级裸露修改接口。 */

import { computed } from 'vue'

import { useEditor } from '../state/editor.ts'
import FieldEditor from './FieldEditor.vue'
import Icon from './Icon.vue'

const editor = useEditor()

const node = computed(() => editor.selected.value)
const schema = computed(() => editor.selectedSchema.value)
const rawCss = computed(() => node.value?._raw?.css ?? '')
const rawJs = computed(() => node.value?._raw?.js ?? '')

function onRaw(which: 'css' | 'js', event: Event): void {
  const target = node.value
  if (target === null) return
  editor.updateRaw(target.id, which, (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <section class="panel inspector">
    <div class="panel-head">
      <b><Icon name="sliders" />块属性</b>
      <span class="sub">由 Schema 自动生成</span>
    </div>

    <p v-if="node === null" class="ins-empty">
      还没有选中内容块。<br>
      在中间画布上点一下某个块，这里就会显示它的参数表单。
    </p>

    <template v-else>
      <div class="ins-head">
        <span class="bc-icon"><Icon :name="node.type" /></span>
        <b>{{ schema?.label ?? node.type }}</b>
        <code>{{ node.type }}</code>
      </div>

      <div class="fields">
        <FieldEditor
          v-for="field in schema?.fields ?? []"
          :key="field.key"
          :node="node"
          :field="field"
        />
      </div>

      <p v-if="schema?.container === true" class="ins-note" style="padding:0 .8em">
        这个块可以容纳子块：把其它块拖进它内部的虚线区即可。
      </p>

      <details class="advanced">
        <summary>高级（裸露修改）</summary>
        <label class="field">
          <span class="flabel">_raw.css</span>
          <textarea rows="3" :value="rawCss" @input="onRaw('css', $event)" />
        </label>
        <label class="field">
          <span class="flabel">_raw.js</span>
          <textarea rows="3" :value="rawJs" @input="onRaw('js', $event)" />
        </label>
        <p class="ins-note">
          默认折叠，不干扰日常编辑。样式会被限定在这个块内部；脚本以块根元素为参数执行，
          并且只发布到线上页面，编辑器预览里不会跑。
        </p>
      </details>
    </template>
  </section>
</template>
