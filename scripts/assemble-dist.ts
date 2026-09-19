/**
 * 组装可部署目录：把编辑器产物放进展示系统产物的 /editor/ 子路径下。
 *
 * 编辑器本身就是静态文件，按 plan.md 6.1 的做法与展示系统一起发布；
 * 它的 vite base 取自 site.json 的 editorBase，所以资源引用自动对齐。
 *
 * 注意：这里没用 fs.cpSync。实测在 Windows 加 Node 24 的组合下，
 * cpSync 会让进程直接崩掉（退出码 0xC0000409，且没有任何输出），
 * 所以自己递归复制，行为可预期。
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const siteDist = join(root, 'public-site', 'dist')
const editorDist = join(root, 'editor', 'dist')
const target = join(siteDist, 'editor')

/** 递归复制目录，返回复制的文件数。 */
function copyDir(from: string, to: string): number {
  mkdirSync(to, { recursive: true })
  let count = 0
  for (const entry of readdirSync(from)) {
    const source = join(from, entry)
    const destination = join(to, entry)
    if (statSync(source).isDirectory()) {
      count += copyDir(source, destination)
      continue
    }
    copyFileSync(source, destination)
    count += 1
  }
  return count
}

if (!existsSync(siteDist)) {
  throw new Error('public-site/dist 不存在，先运行 npm run build:public')
}
if (!existsSync(editorDist)) {
  throw new Error('editor/dist 不存在，先运行 npm run build:editor')
}

rmSync(target, { recursive: true, force: true })
const copied = copyDir(editorDist, target)

console.log(`编辑器产物已放入 public-site/dist/editor（${copied} 个文件）`)
