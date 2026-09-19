<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { Richtext } from '../richtext/Richtext.ts'
import { splitList, splitRows, str } from '../params.ts'

const props = defineProps<BlockProps>()

const caption = computed(() => str(props.params.caption))
const headers = computed(() => splitList(str(props.params.headers)))
const rows = computed(() => splitRows(str(props.params.rows)))
</script>

<template>
  <table class="wikitable">
    <caption v-if="caption">{{ caption }}</caption>
    <thead v-if="headers.length > 0">
      <tr>
        <th v-for="(header, index) in headers" :key="index">{{ header }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
        <td v-for="(cell, cellIndex) in row" :key="cellIndex"><Richtext :text="cell" /></td>
      </tr>
    </tbody>
  </table>
</template>
