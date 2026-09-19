/**
 * 站点上下文：把站点配置与页面索引通过 provide 注入，
 * 让渲染组件（富文本链接、图片地址、编辑链接）不必层层传参。
 */

import { inject, type InjectionKey } from 'vue'
import type { SiteConfig } from './types/site.ts'

/** 站点配置的注入键。 */
export const SITE_KEY: InjectionKey<SiteConfig> = Symbol('wiki:site')

/** 页面索引：已存在的目标集合，元素形如 main/shen-kuo。用来判断红链。 */
export const PAGE_INDEX_KEY: InjectionKey<Set<string>> = Symbol('wiki:page-index')

/** 当前页面的目标路径，形如 main/shen-kuo。用于「编辑本页」与区块编辑链接。 */
export const PAGE_KEY: InjectionKey<() => string> = Symbol('wiki:page')

/**
 * 是否执行块级 _raw.js。
 * 编辑器预览把它设为 false：预览只注入 CSS，不跑 JS（plan.md 8.2）。
 */
export const RAW_JS_KEY: InjectionKey<boolean> = Symbol('wiki:raw-js')

const FALLBACK_SITE: SiteConfig = {
  name: '示例Wiki',
  tagline: '',
  logo: '',
  base: '/',
  editorBase: '',
  repository: { owner: '', repo: '', branch: 'main' },
  navigation: [],
  tools: [],
  footer: [],
  license: '',
  skin: 'vector-2022'
}

/** 取站点配置。没有注入时返回一份最小默认值，保证组件不会崩。 */
export function useSite(): SiteConfig {
  return inject(SITE_KEY, FALLBACK_SITE)
}

/** 取页面索引。没有注入时返回空集合。 */
export function usePageIndex(): Set<string> {
  return inject(PAGE_INDEX_KEY, new Set<string>())
}

/** 取当前页面目标路径的读取函数。没有注入时返回空串。 */
export function usePageTarget(): () => string {
  return inject(PAGE_KEY, () => '')
}

/** 是否允许执行块级 _raw.js。默认允许，编辑器预览会关掉。 */
export function useRawJsEnabled(): boolean {
  return inject(RAW_JS_KEY, true)
}
