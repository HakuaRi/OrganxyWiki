/** 拖拽状态。篮子里的块与画布上的块共用这一份负载。 */

import { ref } from 'vue'
import type { BlockType } from '@wiki/shared'

export type DragPayload =
  | { kind: 'new'; type: BlockType }
  | { kind: 'move'; id: string }

/** 当前正在拖的东西，松手后清空。 */
export const dragPayload = ref<DragPayload | null>(null)

/** 是否有拖拽进行中，用于让空页面提示暂时隐身。 */
export const dragging = ref(false)

export function startDrag(payload: DragPayload): void {
  dragPayload.value = payload
  dragging.value = true
}

export function endDrag(): void {
  dragPayload.value = null
  dragging.value = false
}
