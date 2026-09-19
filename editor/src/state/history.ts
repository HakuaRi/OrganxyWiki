/**
 * 撤销重做的历史栈。
 *
 * 只做一件事：在改动之前记一份状态，并支持撤销与重做。
 * 连续键入同一个字段时，窗口内的多次改动合并成一个历史项，
 * 否则敲一个字就占一格历史。
 *
 * 这里刻意不依赖 Vue 与浏览器 API，方便直接跑单测。
 */

interface Entry<T> {
  state: T
  mergeKey: string
  at: number
}

export class HistoryStack<T> {
  private readonly limit: number
  private readonly mergeWindowMs: number
  private readonly undoStack: Entry<T>[] = []
  private readonly redoStack: T[] = []
  private lastKey = ''
  private lastAt = Number.NEGATIVE_INFINITY

  constructor(limit = 50, mergeWindowMs = 500) {
    this.limit = limit
    this.mergeWindowMs = mergeWindowMs
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  get depth(): number {
    return this.undoStack.length
  }

  /**
   * 在改动之前调用，把改动前的状态记下来。
   * 返回 true 表示压入了新的历史项，false 表示与上一项合并了。
   */
  record(before: T, mergeKey?: string, at = Date.now()): boolean {
    const merge =
      mergeKey !== undefined && mergeKey === this.lastKey && at - this.lastAt < this.mergeWindowMs

    if (!merge) {
      this.undoStack.push({ state: before, mergeKey: mergeKey ?? '', at })
      if (this.undoStack.length > this.limit) this.undoStack.shift()
      this.redoStack.length = 0
    }

    this.lastKey = mergeKey ?? ''
    this.lastAt = at
    return !merge
  }

  /** 撤销：传入当前状态，返回要恢复到的状态；没有可撤销的返回 null。 */
  undo(current: T): T | null {
    const entry = this.undoStack.pop()
    if (entry === undefined) return null
    this.redoStack.push(current)
    this.lastKey = ''
    this.lastAt = Number.NEGATIVE_INFINITY
    return entry.state
  }

  /** 重做：传入当前状态，返回要恢复到的状态。 */
  redo(current: T): T | null {
    const state = this.redoStack.pop()
    if (state === undefined) return null
    this.undoStack.push({ state: current, mergeKey: '', at: Date.now() })
    this.lastKey = ''
    this.lastAt = Number.NEGATIVE_INFINITY
    return state
  }

  clear(): void {
    this.undoStack.length = 0
    this.redoStack.length = 0
    this.lastKey = ''
    this.lastAt = Number.NEGATIVE_INFINITY
  }
}
