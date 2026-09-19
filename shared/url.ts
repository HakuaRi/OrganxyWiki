/**
 * 地址拼装。所有对外链接都必须经过这里，保证部署到子路径时不会出现白图。
 *
 * 约定：
 *   站内页面路径 = base + (主命名空间不带前缀，其它命名空间带前缀) + slug
 *   站内资源路径 = base + 以 / 开头的资源路径
 *   外链原样返回
 */

/** 规范化基础路径：保证以 / 开头、以 / 结尾。 */
export function normalizeBase(base: string | undefined): string {
  const raw = (base ?? '').trim()
  if (raw === '' || raw === '/') return '/'
  const withLead = raw.startsWith('/') ? raw : `/${raw}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

/** 判断是不是外链。 */
export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')
}

/**
 * 站点保留路由。它们不是内容页面，因此不能参与红链判断，
 * 否则最近更改、搜索这类入口会被标成尚未创建。
 */
const RESERVED_ROUTES = new Set([
  'recent-changes',
  'random',
  'categories',
  'category',
  'search',
  'tools',
  'privacy',
  'about',
  'disclaimer',
  'mobile'
])

/** 目标是否指向站点的保留路由。 */
export function isReservedRoute(target: string): boolean {
  const first = target.replace(/^\/+/, '').split('/')[0] ?? ''
  return RESERVED_ROUTES.has(first)
}

/**
 * 站内页面地址。
 * target 形如 shen-kuo 或 main/shen-kuo；主命名空间在地址里省略。
 */
export function pageHref(base: string, target: string): string {
  const clean = target.trim().replace(/^\/+/, '').replace(/\.json$/i, '')
  const parts = clean.split('/').filter((part) => part !== '')
  const path = parts.length <= 1 ? parts.join('') : parts.join('/')
  return normalizeBase(base) + path
}

/** 站内资源地址：src 以 / 开头。 */
export function assetHref(base: string, src: string): string {
  if (src === '') return ''
  if (isExternal(src)) return src
  return normalizeBase(base) + src.replace(/^\/+/, '')
}

/** 编辑器里打开某个页面的地址；未配置编辑器时返回空串。 */
export function editorHref(editorBase: string, target: string): string {
  if (editorBase.trim() === '') return ''
  return normalizeBase(editorBase) + `#/${target.replace(/^\/+/, '')}`
}

/** 任意链接：外链原样，站内链接拼 base。 */
export function linkHref(base: string, href: string): string {
  if (isExternal(href) || href.startsWith('#')) return href
  return normalizeBase(base) + href.replace(/^\/+/, '')
}
