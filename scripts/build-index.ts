/**
 * 构建期索引生成，对应 plan.md 3.3 与 steps.md M1-8。
 *
 * 读 content/pages 下的全部页面 JSON，做 Schema 校验，然后产出：
 *   页面数据与元数据、分类索引、反链索引、最近更改、搜索索引。
 * 结果写进 public-site/src/generated/content.ts（生成物，不入库）。
 *
 * 更新时间优先取 git 的最后提交时间；取不到（不在仓库里、或环境不允许
 * 起子进程）就退回文件修改时间，并在输出里说明用的是哪一种。
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateBlocks } from '../shared/schema/validate.ts'
import { blocksToPlainText, blockLinkTargets } from '../shared/plain-text.ts'
import type { PageData, PageMeta } from '../shared/types/content.ts'

/** 仓库根目录按脚本自身位置推导，这样从任何工作目录调用都一致。 */
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const pagesDir = join(root, 'content', 'pages')
const outFile = join(root, 'public-site', 'src', 'generated', 'content.ts')
const excerptLength = 140

/** 递归收集页面 JSON，跳过下划线开头的文件与目录。 */
function collectFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectFiles(full))
    else if (entry.name.endsWith('.json')) out.push(full)
  }
  return out
}

/** 页面在仓库里的相对路径，统一用正斜杠，去掉 .json。 */
function slugOf(file: string): string {
  return relative(pagesDir, file).split(sep).join('/').replace(/\.json$/i, '')
}

let gitWorks = true
let gitProbeDone = false

/** 取 git 最后提交时间；失败返回空串并记下 git 不可用。 */
function gitUpdatedAt(file: string): string {
  if (!gitWorks) return ''
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', relative(root, file).split(sep).join('/')],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    )
    return output.trim()
  } catch {
    gitWorks = false
    return ''
  }
}

function fileUpdatedAt(file: string): string {
  return statSync(file).mtime.toISOString()
}

function main(): void {
  const files = collectFiles(pagesDir).sort()

  const pages: Record<string, PageData> = {}
  const meta: PageMeta[] = []
  const categories: Record<string, string[]> = {}
  const rawLinks: Record<string, string[]> = {}
  const search: Array<{ path: string; title: string; text: string }> = []
  let problemCount = 0

  for (const file of files) {
    const slug = slugOf(file)
    const text = readFileSync(file, 'utf8')
    let data: PageData
    try {
      data = JSON.parse(text) as PageData
    } catch (error) {
      console.error(`解析失败 ${slug}: ${(error as Error).message}`)
      problemCount++
      continue
    }

    const issues = validateBlocks(data.blocks ?? [])
    if (issues.length > 0) {
      problemCount += issues.length
      for (const issue of issues) console.error(`校验失败 ${slug}: ${issue.message}`)
    }

    if (gitProbeDone === false) {
      gitProbeDone = true
      gitUpdatedAt(file)
    }
    const updatedAt = gitUpdatedAt(file) || fileUpdatedAt(file)
    const plain = blocksToPlainText(data.blocks ?? [])

    pages[slug] = data
    meta.push({
      slug,
      namespace: data.namespace ?? 'main',
      title: data.title ?? slug,
      categories: data.categories ?? [],
      updatedAt,
      excerpt: plain.slice(0, excerptLength)
    })

    for (const category of data.categories ?? []) {
      const list = categories[category] ?? []
      list.push(slug)
      categories[category] = list
    }

    const targets = new Set<string>()
    for (const block of data.blocks ?? []) {
      for (const target of blockLinkTargets(block)) {
        const clean = target.replace(/^\/+/, '').replace(/\.json$/i, '')
        targets.add(clean.includes('/') ? clean : `main/${clean}`)
      }
    }
    rawLinks[slug] = [...targets]
    search.push({ path: slug, title: data.title ?? slug, text: plain })
  }

  // 反链：把「谁指向谁」倒过来
  const backlinks: Record<string, string[]> = {}
  for (const [from, targets] of Object.entries(rawLinks)) {
    for (const target of targets) {
      const list = backlinks[target] ?? []
      if (!list.includes(from)) list.push(from)
      backlinks[target] = list
    }
  }

  const recentChanges = [...meta]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map((item) => ({
      path: item.slug,
      title: item.title,
      updatedAt: item.updatedAt,
      excerpt: item.excerpt
    }))

  const generated = `/* 由 scripts/build-index.ts 生成，请勿手改。运行 npm run gen 可重新生成。 */
import type { PageData, PageMeta } from '../../../shared/types/content.ts'

export interface RecentChange {
  path: string
  title: string
  updatedAt: string
  excerpt: string
}

export interface SearchEntry {
  path: string
  title: string
  text: string
}

/** 全部页面，键是页面路径，例如 main/shen-kuo。 */
export const PAGES: Record<string, PageData> = ${JSON.stringify(pages, null, 2)}

/** 页面元数据，按路径排序。 */
export const PAGE_META: PageMeta[] = ${JSON.stringify(meta, null, 2)}

/** 分类到页面路径。 */
export const CATEGORIES: Record<string, string[]> = ${JSON.stringify(categories, null, 2)}

/** 反链：目标页面路径到来源页面路径。 */
export const BACKLINKS: Record<string, string[]> = ${JSON.stringify(backlinks, null, 2)}

/** 最近更改，按时间倒序。 */
export const RECENT_CHANGES: RecentChange[] = ${JSON.stringify(recentChanges, null, 2)}

/** 搜索索引。 */
export const SEARCH_INDEX: SearchEntry[] = ${JSON.stringify(search, null, 2)}
`

  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, generated, 'utf8')

  console.log(`页面 ${meta.length} 个，分类 ${Object.keys(categories).length} 个`)
  console.log(`更新时间来源：${gitWorks ? 'git 提交时间' : '文件修改时间（git 不可用）'}`)
  if (problemCount > 0) {
    console.error(`校验或解析共发现 ${problemCount} 个问题`)
    process.exitCode = 1
  }
  console.log(`已写出 ${relative(root, outFile).split(sep).join('/')}`)
}

main()
