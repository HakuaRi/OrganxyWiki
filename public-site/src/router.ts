/**
 * 路由表。
 *
 * 静态路由（最近更改、分类、工具占位）定义在前面，通配的页面路由放在后面；
 * 站点保留前缀见 shared/url.ts 的 RESERVED_ROUTES。
 */

import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory
} from 'vue-router'

import PageView from './pages/PageView.vue'
import CategoryView from './pages/CategoryView.vue'
import CategoriesView from './pages/CategoriesView.vue'
import RecentChangesView from './pages/RecentChangesView.vue'
import PlaceholderView from './pages/PlaceholderView.vue'
import NotFoundView from './pages/NotFoundView.vue'

import { CATEGORIES, PAGES, SITE, pageHrefOf } from './content.ts'

/** 工具占位页的显示名。M4 会逐个换成真实实现。 */
export const TOOL_TITLES: Record<string, string> = {
  backlinks: '链入页面',
  recent: '相关更改',
  'page-info': '页面信息',
  print: '可打印版',
  cite: '引用本页',
  history: '查看历史'
}

export function createAppRouter(history: RouterHistory): Router {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: PageView, meta: { kind: 'page', title: '首页' } },
      {
        path: '/recent-changes',
        name: 'recent-changes',
        component: RecentChangesView,
        meta: { title: '最近更改' }
      },
      { path: '/categories', name: 'categories', component: CategoriesView, meta: { title: '全部分类' } },
      { path: '/category/:name', name: 'category', component: CategoryView, meta: { title: '分类' } },
      {
        path: '/search',
        name: 'search',
        component: PlaceholderView,
        meta: { title: '搜索', note: '搜索功能按计划在 M4 接入：构建期生成静态索引，客户端查询。' }
      },
      {
        path: '/random',
        name: 'random',
        component: PlaceholderView,
        meta: { title: '随机页面', note: '随机跳转按计划在 M4 接入。' }
      },
      {
        path: '/tools/:tool',
        name: 'tool',
        component: PlaceholderView,
        meta: { title: '工具', note: '这个工具页按计划在 M4 接入。' }
      },
      {
        path: '/:namespace(main|templates|categories)/:slug',
        name: 'page-namespaced',
        component: PageView,
        meta: { kind: 'page' }
      },
      { path: '/:slug', name: 'page', component: PageView, meta: { kind: 'page' } },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: '页面不存在' } }
    ],
    scrollBehavior(_to, _from, saved) {
      return saved ?? { top: 0 }
    }
  })
}

/** 服务端渲染用：内存历史。 */
export function createServerRouter(): Router {
  return createAppRouter(createMemoryHistory())
}

/** 浏览器用：真实历史，基础路径跟随 site.json 的 base。 */
export function createBrowserRouter(): Router {
  return createAppRouter(createWebHistory(SITE.base))
}

/** 预渲染需要覆盖的全部路由。 */
export function buildRouteList(): string[] {
  const routes = new Set<string>(['/', '/recent-changes', '/categories', '/search', '/random', '/404'])

  for (const path of Object.keys(PAGES)) {
    routes.add(pageHrefOf(path, '/'))
  }
  for (const name of Object.keys(CATEGORIES)) {
    routes.add(`/category/${encodeURIComponent(name)}`)
  }
  for (const href of SITE.tools) routes.add(href.href)
  for (const href of SITE.footer) routes.add(href.href)
  for (const tool of Object.keys(TOOL_TITLES)) routes.add(`/tools/${tool}`)

  return [...routes]
}
