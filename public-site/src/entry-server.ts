/**
 * 服务端渲染入口，供 scripts/prerender.ts 调用。
 *
 * listRoutes 给出需要预渲染的全部地址；render 返回该地址的 HTML 与 head 信息。
 */

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import App from './App.vue'
import { takeHead } from './head.ts'
import { buildRouteList, createServerRouter } from './router.ts'
import './styles.ts'

export { buildRouteList as listRoutes }

export interface RenderResult {
  html: string
  title: string
  description: string
}

/** 渲染一条路由。 */
export async function render(url: string): Promise<RenderResult> {
  const app = createSSRApp(App)
  const router = createServerRouter()
  app.use(router)

  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const head = takeHead()

  return { html, title: head.title, description: head.description }
}
