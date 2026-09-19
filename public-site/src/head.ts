/**
 * 页面标题的写入与采集。
 *
 * 浏览器端直接写 document.title；服务端没有 document，
 * 就把标题暂存下来，预渲染脚本渲染完一页后取走写进 HTML 的 head。
 */

import { watchEffect, type Ref } from 'vue'

const isServer = typeof document === 'undefined'

let capturedTitle = ''
let capturedDescription = ''

/** 声明当前页面的标题与描述。 */
export function useHead(title: Ref<string>, description?: Ref<string>): void {
  if (isServer) {
    watchEffect(() => {
      capturedTitle = title.value
      capturedDescription = description?.value ?? ''
    })
    return
  }
  watchEffect(() => {
    document.title = title.value
  })
}

/** 服务端渲染后取走并清空暂存的 head 信息。 */
export function takeHead(): { title: string; description: string } {
  const head = { title: capturedTitle, description: capturedDescription }
  capturedTitle = ''
  capturedDescription = ''
  return head
}
