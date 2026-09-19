/**
 * GitHub 认证：细粒度访问令牌（fine-grained personal access token）。
 *
 * 为什么不用 Device Flow（2026-02-14 更正）：
 * 原计划（plan.md 4.3 与 Q18）打算用 Device Flow，实现之后在浏览器里直接报
 * "Failed to fetch"。实测确认原因是 CORS：
 *   github.com/login/device/code         不返回 Access-Control-Allow-Origin
 *   github.com/login/oauth/access_token  同样没有，且带 default-src 'none' 的 CSP
 * 也就是说，Device Flow 只能由服务端或中转服务发起，与「零服务器」的前提冲突。
 * 而 api.github.com 的预检明确允许 Authorization 头与各种方法，浏览器直连没问题。
 *
 * 换用细粒度令牌之后反而更安全：可以把权限收窄到「只这一个仓库、只给 Contents 读写」，
 * 而 Device Flow 能拿到的 public_repo 令牌可以写你名下所有公开仓库。
 *
 * 令牌只存在本机浏览器的 localStorage，不进代码、不进构建产物。
 */

import { computed, ref, type ComputedRef } from 'vue'

import { safeFetch } from './net.ts'

const API_URL = 'https://api.github.com'
const TOKEN_KEY = 'wiki-editor-auth'

export interface AuthInfo {
  token: string
  login: string
  name: string
}

/** 当前登录态。设置面板与 API 层都读它。 */
export const auth = ref<AuthInfo | null>(readToken())
export const busy = ref(false)
export const error = ref('')

/** 是否已登录。 */
export const signedIn: ComputedRef<boolean> = computed(() => auth.value !== null)

function readToken(): AuthInfo | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(TOKEN_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as AuthInfo
    return typeof parsed.token === 'string' && parsed.token !== '' ? parsed : null
  } catch {
    return null
  }
}

function writeToken(info: AuthInfo | null): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (info === null) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, JSON.stringify(info))
  } catch {
    // 存不下也不影响本次会话使用。
  }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

/** 用令牌读一次身份信息，兼作令牌有效性校验。 */
async function fetchViewer(token: string): Promise<{ login: string; name?: string | null }> {
  const response = await safeFetch(`${API_URL}/user`, { headers: headers(token) })
  if (response.status === 401) throw new Error('令牌无效、已过期，或者被撤销了。')
  if (!response.ok) throw new Error(`校验令牌时 GitHub 返回 ${response.status}。`)
  return (await response.json()) as { login: string; name?: string | null }
}

/** 用访问令牌登录。返回是否成功。 */
export async function signInWithToken(raw: string): Promise<boolean> {
  const token = raw.trim()
  if (token === '') {
    error.value = '先把访问令牌粘进来。'
    return false
  }
  busy.value = true
  error.value = ''
  try {
    const viewer = await fetchViewer(token)
    const info: AuthInfo = { token, login: viewer.login, name: viewer.name ?? viewer.login }
    auth.value = info
    writeToken(info)
    return true
  } catch (failure) {
    error.value = (failure as Error).message
    return false
  } finally {
    busy.value = false
  }
}

/** 退出登录，清掉本地令牌。 */
export function signOut(): void {
  auth.value = null
  writeToken(null)
  error.value = ''
}

/** 令牌失效时由 API 层调用，回到未登录状态而不是静默失败。 */
export function invalidateSession(message: string): void {
  auth.value = null
  writeToken(null)
  error.value = message
}

/** 启动时校验一次本地已有的令牌。 */
export async function revalidate(): Promise<void> {
  const current = auth.value
  if (current === null) return
  try {
    const viewer = await fetchViewer(current.token)
    const info: AuthInfo = {
      token: current.token,
      login: viewer.login,
      name: viewer.name ?? viewer.login
    }
    auth.value = info
    writeToken(info)
  } catch (failure) {
    invalidateSession((failure as Error).message)
  }
}

export function useAuth() {
  return {
    auth,
    signedIn,
    busy,
    error,
    signInWithToken,
    signOut,
    revalidate
  }
}

/** 供 API 层取令牌。 */
export function currentToken(): string {
  return auth.value?.token ?? ''
}
