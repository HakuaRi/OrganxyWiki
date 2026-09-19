/**
 * 内容访问层：把构建期生成的索引与站点配置收拢到一处，
 * 并给页面组件提供「按当前路由解析页面」的唯一入口。
 */

import { computed, type ComputedRef } from 'vue'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'
import { normalizeBase, type PageData, type PageMeta, type SiteConfig } from '@wiki/shared'

import siteJson from '../../content/site.json'
import {
  BACKLINKS,
  CATEGORIES,
  PAGES,
  PAGE_META,
  RECENT_CHANGES,
  SEARCH_INDEX
} from './generated/content.ts'

export const SITE = siteJson as SiteConfig
export const PAGE_INDEX: Set<string> = new Set(Object.keys(PAGES))
export { BACKLINKS, CATEGORIES, PAGES, PAGE_META, RECENT_CHANGES, SEARCH_INDEX }

export interface ResolvedPage {
  /** 页面路径，例如 main/shen-kuo。 */
  path: string
  data: PageData
  meta: PageMeta | undefined
}

/** 把路由参数拼成页面路径。 */
export function routePathOf(route: RouteLocationNormalizedLoaded): string {
  const namespace = typeof route.params.namespace === 'string' ? route.params.namespace : 'main'
  const slug = typeof route.params.slug === 'string' ? route.params.slug : ''
  if (slug === '') return 'main/home'
  return `${namespace}/${slug}`
}

/** 按页面路径取页面。 */
export function resolvePagePath(path: string): ResolvedPage | null {
  const data = PAGES[path]
  if (data === undefined) return null
  return { path, data, meta: PAGE_META.find((item) => item.slug === path) }
}

/** 当前路由对应的页面，解析不到返回 null。 */
export function useCurrentPage(): ComputedRef<ResolvedPage | null> {
  const route = useRoute()
  return computed(() => {
    // 用 meta 标记而不是路由名判断：页面路由有首页与带命名空间两条，名不同。
    if (route.meta.kind !== 'page') return null
    return resolvePagePath(routePathOf(route))
  })
}

/** 页面的对外地址。 */
export function pageHrefOf(path: string, base: string): string {
  const [namespace, slug] = path.split('/')
  const prefix = base.endsWith('/') ? base : `${base}/`
  if (slug === undefined) return prefix
  if (namespace === 'main') return slug === 'home' ? prefix : `${prefix}${slug}`
  return `${prefix}${namespace}/${slug}`
}

/** 页面标题。 */
export function pageTitleOf(page: ResolvedPage): string {
  return page.data.title
}

/** 站点配置里的链接补上 base。 */
export function siteHref(href: string): string {
  if (/^(https?:)?\/\//.test(href)) return href
  return normalizeBase(SITE.base) + href.replace(/^\/+/, '')
}

/** 分类页地址。 */
export function categoryHref(name: string): string {
  return `${normalizeBase(SITE.base)}category/${encodeURIComponent(name)}`
}

/** 搜索页地址，供顶栏搜索框用。 */
export function searchAction(): string {
  return `${normalizeBase(SITE.base)}search`
}

/** 格式化日期：只取日期部分，避免服务端与客户端时区不一致导致 hydration 不匹配。 */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (match === null) return iso
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`
}

/** 查看历史的地址；仓库未配置时返回空串。 */
export function historyHrefOf(pagePath: string): string {
  const { owner, repo, branch } = SITE.repository
  if (owner === '' || repo === '' || branch === '') return ''
  return `https://github.com/${owner}/${repo}/commits/${branch}/content/pages/${pagePath}.json`
}
