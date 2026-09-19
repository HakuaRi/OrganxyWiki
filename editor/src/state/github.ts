/**
 * GitHub API 封装。
 *
 * 写入走 Git Data API（blobs 到 tree 到 commit 到 ref），不用 Contents API：
 * 一是为了支持原图上传（几 MB 的图片走 base64 的 Contents 通道又慢又容易失败），
 * 二是能把一次编辑里的多个文件改动合成一个提交。
 *
 * 冲突检测靠 ref 更新本身：提交的父提交是读取时拿到的那个 sha，
 * 如果期间分支被别人推进过，非快进的 ref 更新会被 GitHub 拒绝。
 */

import { invalidateSession } from './auth.ts'
import { safeFetch } from './net.ts'

const API = 'https://api.github.com'

export interface RepoRef {
  owner: string
  repo: string
  branch: string
}

export class GitHubError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await safeFetch(`${API}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init?.headers ?? {}) }
  })

  if (response.status === 401) {
    invalidateSession('令牌已失效，请重新登录。')
    throw new GitHubError('令牌已失效，请重新登录。', 401)
  }
  if (!response.ok) {
    throw new GitHubError(await describeFailure(response), response.status)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function describeFailure(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = (await response.json()) as { message?: string; errors?: unknown }
    detail = body.message ?? ''
  } catch {
    detail = ''
  }
  if (response.status === 404) {
    return `仓库或路径不存在，或者当前令牌没有访问权限。${detail}`
  }
  if (response.status === 403) {
    return `权限不足或触发了速率限制。${detail}`
  }
  if (response.status === 422) {
    return `请求被拒绝，通常是分支已经往前走了。${detail}`
  }
  return `GitHub 返回 ${response.status}。${detail}`
}

/* ===== 身份与仓库 ===== */

export interface RepoInfo {
  defaultBranch: string
  isPrivate: boolean
  canPush: boolean
}

export async function getRepoInfo(token: string, repo: RepoRef): Promise<RepoInfo> {
  const data = await request<{
    default_branch: string
    private: boolean
    permissions?: { push?: boolean }
  }>(token, `/repos/${repo.owner}/${repo.repo}`)
  return {
    defaultBranch: data.default_branch,
    isPrivate: data.private,
    canPush: data.permissions?.push === true
  }
}

/* ===== 读取 ===== */

export interface RemoteFile {
  path: string
  sha: string
}

/** 列出某个目录下的全部文件（递归）。 */
export async function listFiles(token: string, repo: RepoRef, root: string): Promise<RemoteFile[]> {
  const head = await getBranchCommitSha(token, repo)
  const treeSha = await getCommitTreeSha(token, repo, head)
  const tree = await request<{ tree: Array<{ path: string; type: string; sha: string }> }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/trees/${treeSha}?recursive=1`
  )
  const prefix = root.replace(/\/+$/, '') === '' ? '' : `${root.replace(/\/+$/, '')}/`
  return tree.tree
    .filter((entry) => entry.type === 'blob')
    .filter((entry) => (prefix === '' ? true : entry.path.startsWith(prefix)))
    .map((entry) => ({ path: entry.path, sha: entry.sha }))
}

/** 读一个文本文件。 */
export async function readTextFile(token: string, repo: RepoRef, path: string): Promise<string> {
  const data = await request<{ content: string; encoding: string }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(repo.branch)}`
  )
  return data.encoding === 'base64' ? decodeBase64Utf8(data.content) : data.content
}

/** 按 blob sha 读一个文本文件。 */
export async function readBlobText(token: string, repo: RepoRef, sha: string): Promise<string> {
  const data = await request<{ content: string; encoding: string }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/blobs/${sha}`
  )
  return data.encoding === 'base64' ? decodeBase64Utf8(data.content) : data.content
}

/** 分支当前的提交 sha。 */
export async function getBranchCommitSha(token: string, repo: RepoRef): Promise<string> {
  const data = await request<{ object: { sha: string } }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/ref/heads/${encodePath(repo.branch)}`
  )
  return data.object.sha
}

/** 某个提交对应的 tree sha。 */
export async function getCommitTreeSha(
  token: string,
  repo: RepoRef,
  commitSha: string
): Promise<string> {
  const data = await request<{ tree: { sha: string } }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/commits/${commitSha}`
  )
  return data.tree.sha
}

/* ===== 写入 ===== */

export interface FileChange {
  /** 仓库内路径。 */
  path: string
  /** 文本内容；用 base64 时传编码后的字符串。 */
  content: string
  encoding: 'utf-8' | 'base64'
  /** 传 null 表示删除这个文件。 */
  delete?: boolean
}

async function createBlob(
  token: string,
  repo: RepoRef,
  content: string,
  encoding: 'utf-8' | 'base64'
): Promise<string> {
  const data = await request<{ sha: string }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/blobs`,
    {
      method: 'POST',
      body: JSON.stringify({ content, encoding })
    }
  )
  return data.sha
}

interface TreeEntry {
  path: string
  mode: '100644'
  type: 'blob'
  sha: string | null
}

async function createTree(
  token: string,
  repo: RepoRef,
  baseTree: string,
  entries: TreeEntry[]
): Promise<string> {
  const data = await request<{ sha: string }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/trees`,
    {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTree, tree: entries })
    }
  )
  return data.sha
}

async function createCommit(
  token: string,
  repo: RepoRef,
  message: string,
  treeSha: string,
  parentSha: string
): Promise<string> {
  const data = await request<{ sha: string }>(
    token,
    `/repos/${repo.owner}/${repo.repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] })
    }
  )
  return data.sha
}

async function updateRef(
  token: string,
  repo: RepoRef,
  commitSha: string,
  force = false
): Promise<void> {
  await request<unknown>(token, `/repos/${repo.owner}/${repo.repo}/git/refs/heads/${encodePath(repo.branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitSha, force })
  })
}

/**
 * 一次提交多个文件改动。
 *
 * baseSha 是读取内容时拿到的提交 sha。分支在这之后被别人推进过的话，
 * ref 更新会因为非快进被拒绝，调用方据此提示「请重新载入」。
 */
export async function commitChanges(
  token: string,
  repo: RepoRef,
  changes: FileChange[],
  message: string,
  baseSha?: string
): Promise<string> {
  const parent = baseSha ?? (await getBranchCommitSha(token, repo))
  const treeSha = await getCommitTreeSha(token, repo, parent)

  const entries: TreeEntry[] = []
  for (const change of changes) {
    if (change.delete === true) {
      entries.push({ path: change.path, mode: '100644', type: 'blob', sha: null })
      continue
    }
    const sha = await createBlob(token, repo, change.content, change.encoding)
    entries.push({ path: change.path, mode: '100644', type: 'blob', sha })
  }

  const newTree = await createTree(token, repo, treeSha, entries)
  const commit = await createCommit(token, repo, message, newTree, parent)
  await updateRef(token, repo, commit)
  return commit
}

/* ===== 工具 ===== */

/** 路径分段编码，保留斜杠。 */
function encodePath(path: string): string {
  return path
    .split('/')
    .filter((part) => part !== '')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

/** base64 转 UTF-8 文本。Node 与浏览器都有 atob 与 TextDecoder。 */
export function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** 字节转 base64，分块处理避免超长参数。 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}
