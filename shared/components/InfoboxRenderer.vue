<script setup lang="ts">
import type { BlockProps } from './types.ts'
import { computed } from 'vue'
import { Richtext } from '../richtext/Richtext.ts'
import { records, str } from '../params.ts'
import { assetHref } from '../url.ts'
import { useSite } from '../site-context.ts'

const props = defineProps<BlockProps>()
const site = useSite()

const name = computed(() => str(props.params.name))
const subtitle = computed(() => str(props.params.subtitle))
const caption = computed(() => str(props.params.caption))
const image = computed(() => assetHref(site.base, str(props.params.image).trim()))
const rows = computed(() =>
  records(props.params.rows).map((row) => ({
    label: str(row.label),
    value: str(row.value)
  }))
)
</script>

<template>
  <section class="infobox">
    <div class="ib-head">
      <div class="ib-title">{{ name }}</div>
      <div v-if="subtitle" class="ib-sub">{{ subtitle }}</div>
    </div>
    <div class="ib-body">
      <figure v-if="image || caption" class="ib-figure">
        <span class="fig-inner">
          <img v-if="image" :src="image" :alt="caption || name">
        </span>
        <figcaption v-if="caption">{{ caption }}</figcaption>
      </figure>
      <table v-if="rows.length > 0" class="ib-rows">
        <tbody>
          <tr v-for="(row, index) in rows" :key="index">
            <th>{{ row.label }}</th>
            <td><Richtext :text="row.value" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
