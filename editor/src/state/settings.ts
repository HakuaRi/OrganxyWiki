/**
 * 编辑器配置。
 *
 * 按 plan.md 8.4 的硬性约定：凭据与仓库坐标一律不由代码代填，
 * 这里只提供字段与校验，值由使用者在设置界面自己填，
 * 存在浏览器本地，不进仓库、不进构建产物。
 *
 * 未填写的字段必须让对应功能明确失效：没填仓库坐标就不能保存，
 * 没有访问令牌就不能读写，而不是拿一个默认值悄悄跑起来。
 *
 * 访问令牌不在这里，它在 auth.ts 里单独存，因为它需要「粘贴后立即校验」的手感。
 */

import { computed, ref, type ComputedRef } from 'vue'

export interface EditorSettings {
  /** 仓库所有者。 */
  owner: string
  /** 仓库名。 */
  repo: string
  /** 分支名。 */
  branch: string
  /** 内容页面所在目录，相对仓库根。 */
  contentRoot: string
  /** 静态资源目录，相对仓库根。 */
  assetsRoot: string
  /** 展示端引用资源时用的 URL 前缀。 */
  mediaPath: string
}

const STORAGE_KEY = 'wiki-editor-settings'

/** owner 与 repo 故意留空：它们是使用者必须自己填的东西。 */
export const DEFAULT_SETTINGS: EditorSettings = {
  owner: '',
  repo: '',
  branch: 'main',
  contentRoot: 'content/pages',
  assetsRoot: 'content/assets',
  mediaPath: '/media'
}

function read(): EditorSettings {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<EditorSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export const settings = ref<EditorSettings>(read())

/** 保存配置。 */
export function saveSettings(next: EditorSettings): void {
  settings.value = { ...next }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  } catch {
    // 隐私模式或配额满：本次会话内仍然生效，只是不持久化。
  }
}

/** 清空全部配置。 */
export function resetSettings(): void {
  saveSettings({ ...DEFAULT_SETTINGS })
}

/** 仓库坐标是否填全。 */
export const repoConfigured: ComputedRef<boolean> = computed(
  () =>
    settings.value.owner.trim() !== '' &&
    settings.value.repo.trim() !== '' &&
    settings.value.branch.trim() !== ''
)

/** 列出还缺哪些字段，用于界面提示。 */
export function missingForRepo(): string[] {
  const missing: string[] = []
  if (settings.value.owner.trim() === '') missing.push('仓库所有者')
  if (settings.value.repo.trim() === '') missing.push('仓库名')
  if (settings.value.branch.trim() === '') missing.push('分支')
  return missing
}

/* ===== 路径换算 ===== */

/** 页面路径转仓库内文件路径：main/shen-kuo 加 content/pages 前缀再加 .json。 */
export function pageFilePath(path: string): string {
  const root = settings.value.contentRoot.replace(/^\/+|\/+$/g, '')
  return `${root}/${path.replace(/^\/+/, '')}.json`
}

/** 仓库内文件路径转页面路径；不在内容目录下的返回 null。 */
export function pagePathFromFile(filePath: string): string | null {
  const root = settings.value.contentRoot.replace(/^\/+|\/+$/g, '')
  const prefix = `${root}/`
  if (!filePath.startsWith(prefix) || !filePath.endsWith('.json')) return null
  return filePath.slice(prefix.length, -'.json'.length)
}

/** 资源文件名转展示端 URL。 */
export function mediaUrl(fileName: string): string {
  const base = settings.value.mediaPath.replace(/\/+$/, '')
  return `${base}/${fileName}`
}
