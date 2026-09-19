/**
 * 网络层的小包装。
 *
 * fetch 在 CORS 被拦或网络不通时只会抛出一句 "Failed to fetch"，
 * 这对使用者没有任何指导意义，所以统一在这里翻译成能看懂、能行动的提示。
 */

/** 发请求；只有网络层失败才会抛错，HTTP 状态码由调用方判断。 */
export async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (failure) {
    const reason = (failure as Error).message
    throw new Error(
      `连不上 GitHub（${reason}）。常见原因有三个：网络需要代理才能访问 GitHub、` +
        `浏览器扩展拦了跨站请求、或者当前断网。请在浏览器控制台的 Network 面板确认请求是否真的发出去了。`
    )
  }
}
