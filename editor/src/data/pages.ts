/**
 * 编辑器的数据来源。
 *
 * M2 直接读工作区里的内容文件（Vite 的 glob 导入）；
 * M3 接入 GitHub 之后，这里会换成从仓库读取，接口保持不变：
 * 页面路径到页面数据的映射，以及站点配置。
 */

import type { PageData, SiteConfig } from '@wiki/shared'

import siteJson from '../../../content/site.json'

const modules = import.meta.glob<PageData>('../../../content/pages/**/*.json', {
  eager: true,
  import: 'default'
})

/** 页面路径到内容的映射，键形如 main/shen-kuo。 */
export const SOURCE_PAGES: Record<string, PageData> = Object.fromEntries(
  Object.entries(modules).map(([file, data]) => [
    file.replace(/^.*\/content\/pages\//, '').replace(/\.json$/, ''),
    data
  ])
)

/** 页面列表，首页排在最前。 */
export const PAGE_LIST: string[] = Object.keys(SOURCE_PAGES).sort((a, b) => {
  if (a === 'main/home') return -1
  if (b === 'main/home') return 1
  return a.localeCompare(b)
})

export const SITE = siteJson as SiteConfig

/** 供预览判断红链用。 */
export const PAGE_INDEX: Set<string> = new Set(PAGE_LIST)

/** 新建页面时用的占位路径。 */
export function nextEmptyPath(existing: string[]): string {
  let index = 1
  let candidate = 'main/新页面'
  while (existing.includes(candidate)) {
    index += 1
    candidate = `main/新页面${index}`
  }
  return candidate
}

/** 空页面。 */
export function emptyPage(path: string): PageData {
  const slug = path.split('/').pop() ?? 'new'
  return { title: slug, namespace: path.split('/')[0] ?? 'main', categories: [], blocks: [] }
}
