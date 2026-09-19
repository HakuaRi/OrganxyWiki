/**
 * 数据来源抽象。
 *
 * 没配置仓库或没登录时用本地模式：读工作区里的内容文件，不可写，草稿仍旧存在浏览器本地。
 * 配置好并登录之后切到 GitHub 模式：页面列表与内容都来自仓库，保存即提交。
 *
 * 上层只认这个接口，不关心数据从哪来。
 */

import type { PageData } from '@wiki/shared'

import { SOURCE_PAGES } from '../data/pages.ts'
import { auth } from './auth.ts'
import {
  GitHubError,
  bytesToBase64,
  commitChanges,
  getBranchCommitSha,
  listFiles,
  readBlobText,
  type RepoRef
} from './github.ts'
import { mediaUrl, pageFilePath, pagePathFromFile, repoConfigured, settings } from './settings.ts'

export type SourceKind = 'local' | 'github'

export interface PageEntry {
  path: string
  title: string
}

export interface LoadedPage {
  data: PageData
  /** GitHub 模式下是当时的分支提交 sha；本地模式是固定字符串。 */
  revision: string
}

const LOCAL_REVISION = 'local'

/** 当前该用哪个来源。 */
export function activeSource(): SourceKind {
  return repoConfigured.value && auth.value !== null ? 'github' : 'local'
}

function repo(): RepoRef {
  return {
    owner: settings.value.owner.trim(),
    repo: settings.value.repo.trim(),
    branch: settings.value.branch.trim()
  }
}

function token(): string {
  return auth.value?.token ?? ''
}

/** 本地模式下不可用的操作，统一给出同一句提示。 */
function requireGitHub(action: string): never {
  throw new Error(`${action}需要先在设置里填好仓库坐标并登录 GitHub。当前是本地模式，只能用草稿。`)
}

/* ===== 列表 ===== */

/** 并发上限，避免一次打太多请求。 */
async function mapLimit<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      out[index] = await run(items[index])
    }
  })
  await Promise.all(workers)
  return out
}

/** 列出全部页面。 */
export async function listPages(): Promise<PageEntry[]> {
  if (activeSource() === 'local') {
    return Object.entries(SOURCE_PAGES)
      .map(([path, data]) => ({ path, title: data.title }))
      .sort((a, b) => comparePath(a.path, b.path))
  }

  const files = await listFiles(token(), repo(), settings.value.contentRoot)
  const pages = files
    .map((file) => pagePathFromFile(file.path))
    .filter((path): path is string => path !== null)

  const entries = await mapLimit(pages, 5, async (path) => {
    try {
      const data = await readPage(path)
      return { path, title: data.data.title }
    } catch {
      // 单个页面读失败（比如 JSON 坏了）不应该让整个列表挂掉。
      return { path, title: path }
    }
  })

  return entries.sort((a, b) => comparePath(a.path, b.path))
}

function comparePath(a: string, b: string): number {
  if (a === 'main/home') return -1
  if (b === 'main/home') return 1
  return a.localeCompare(b)
}

/* ===== 读取 ===== */

export async function readPage(path: string): Promise<LoadedPage> {
  if (activeSource() === 'local') {
    const data = SOURCE_PAGES[path]
    if (data === undefined) throw new Error(`本地内容里没有 ${path}`)
    return { data, revision: LOCAL_REVISION }
  }

  const revision = await getBranchCommitSha(token(), repo())
  const text = await readText(path)
  let data: PageData
  try {
    data = JSON.parse(text) as PageData
  } catch (error) {
    throw new Error(`${path}.json 不是合法的 JSON：${(error as Error).message}`)
  }
  return { data, revision }
}

async function readText(path: string): Promise<string> {
  const files = await listFiles(token(), repo(), settings.value.contentRoot)
  const target = pageFilePath(path)
  const entry = files.find((file) => file.path === target)
  if (entry === undefined) throw new Error(`仓库里找不到 ${target}`)
  return readBlobText(token(), repo(), entry.sha)
}

/* ===== 写入 ===== */

/** 序列化成内容文件的格式：两空格缩进，结尾一个换行。 */
export function serializePage(data: PageData): string {
  return `${JSON.stringify(data, null, 2)}\n`
}

/** 保存一页。返回新的提交 sha。 */
export async function savePage(
  path: string,
  data: PageData,
  message: string,
  revision: string
): Promise<string> {
  if (activeSource() === 'local') requireGitHub('保存')
  return commitChanges(
    token(),
    repo(),
    [{ path: pageFilePath(path), content: serializePage(data), encoding: 'utf-8' }],
    message,
    revision === LOCAL_REVISION ? undefined : revision
  )
}

/** 删除一页。 */
export async function deletePage(path: string, message: string, revision: string): Promise<string> {
  if (activeSource() === 'local') requireGitHub('删除页面')
  return commitChanges(
    token(),
    repo(),
    [{ path: pageFilePath(path), content: '', encoding: 'utf-8', delete: true }],
    message,
    revision === LOCAL_REVISION ? undefined : revision
  )
}

/** 重命名或移动一页：一次提交里同时写新路径与删旧路径。 */
export async function renamePage(
  from: string,
  to: string,
  data: PageData,
  message: string,
  revision: string
): Promise<string> {
  if (activeSource() === 'local') requireGitHub('重命名页面')
  return commitChanges(
    token(),
    repo(),
    [
      { path: pageFilePath(to), content: serializePage(data), encoding: 'utf-8' },
      { path: pageFilePath(from), content: '', encoding: 'utf-8', delete: true }
    ],
    message,
    revision === LOCAL_REVISION ? undefined : revision
  )
}

/** 上传一张原图，返回可以直接填进图片字段的地址。 */
export async function uploadImage(file: File): Promise<{ url: string; path: string; commit: string }> {
  if (activeSource() === 'local') requireGitHub('上传图片')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const name = safeFileName(file.name)
  const path = `${settings.value.assetsRoot.replace(/\/+$/, '')}/media/${name}`
  const revision = await getBranchCommitSha(token(), repo())

  const commit = await commitChanges(
    token(),
    repo(),
    [{ path, content: bytesToBase64(bytes), encoding: 'base64' }],
    `上传图片 ${name}`,
    revision
  )
  return { url: mediaUrl(name), path, commit }
}

/** 文件名清洗：去掉路径分隔与 URL 里会出问题的字符。 */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'image'
  const cleaned = base.replace(/[#?%*:|"<>]/g, '-').replace(/\s+/g, '-')
  return cleaned === '' ? 'image' : cleaned
}

export { GitHubError }
