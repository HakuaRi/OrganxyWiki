/**
 * 预渲染：把客户端构建产物里的 index.html 当作模板，
 * 用 SSR 产物逐条路由渲染，写出 dist/<路由>/index.html。
 *
 * 前提：先跑过 vite build（客户端）与 vite build --ssr（服务端）。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** 仓库根目录按脚本自身位置推导，这样从任何工作目录调用都一致。 */
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')

interface RenderResult {
  html: string
  title: string
  description: string
}

interface ServerEntry {
  listRoutes: () => string[]
  render: (url: string) => Promise<RenderResult>
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 路由对应的输出文件。根路由写 index.html，其它写 <路由>/index.html。 */
function outputFileFor(siteDir: string, route: string): string {
  if (route === '/404') return join(siteDir, 'dist', '404.html')
  const clean = decodeURIComponent(route).replace(/^\/+/, '').replace(/\/+$/, '')
  return clean === ''
    ? join(siteDir, 'dist', 'index.html')
    : join(siteDir, 'dist', clean, 'index.html')
}

async function main(): Promise<void> {
  const siteDir = join(root, 'public-site')
  const template = readFileSync(join(siteDir, 'dist', 'index.html'), 'utf8')
  const entryUrl = pathToFileURL(join(siteDir, 'dist-ssr', 'entry-server.js')).href
  const entry = (await import(entryUrl)) as ServerEntry

  const routes = entry.listRoutes()
  let failures = 0

  for (const route of routes) {
    try {
      const { html, title, description } = await entry.render(route)
      const head = [
        `<title>${escapeHtml(title)}</title>`,
        description === '' ? '' : `<meta name="description" content="${escapeHtml(description)}">`
      ]
        .filter((line) => line !== '')
        .join('\n    ')

      const page = template
        .replace('<!--app-head-->', head)
        .replace('<!--app-html-->', html)

      const file = outputFileFor(siteDir, route)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, page, 'utf8')
    } catch (error) {
      failures++
      console.error(`渲染失败 ${route}: ${(error as Error).message}`)
    }
  }

  console.log(`预渲染完成：${routes.length - failures}/${routes.length} 条路由`)
  if (failures > 0) process.exitCode = 1
}

await main()
