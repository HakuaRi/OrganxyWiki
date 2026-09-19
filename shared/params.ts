/**
 * 块参数的取值helper。
 *
 * 内容 JSON 里的 params 是 unknown，渲染组件一律通过这些函数取值，
 * 避免到处写类型断言，也让缺字段时有统一的兜底行为。
 */

/** 取字符串。数字与布尔会转成字符串，其它类型给兜底值。 */
export function str(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

/** 取布尔。兼容字符串形式的 true 与 false。 */
export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

/** 取对象数组，用于 template-list 这类字段。 */
export function records(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is Record<string, unknown> => item !== null && typeof item === 'object'
  )
}

/** 按顿号或逗号切分一段文本，去空白、丢空项。 */
export function splitList(value: string, separator = /[、,，]/): string[] {
  return value
    .split(separator)
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

/**
 * 按竖线切分一行表格。
 *
 * 必须跳过双方括号内部：[[目标|显示文字]] 里的竖线是链接的别名分隔符，
 * 不是列分隔符，否则带中文别名的链接会把表格切碎。
 */
export function splitCells(line: string): string[] {
  const cells: string[] = []
  let depth = 0
  let current = ''

  for (let i = 0; i < line.length; i++) {
    if (line.startsWith('[[', i)) {
      depth++
      current += '[['
      i++
      continue
    }
    if (line.startsWith(']]', i) && depth > 0) {
      depth--
      current += ']]'
      i++
      continue
    }
    if (line[i] === '|' && depth === 0) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += line[i]
  }

  cells.push(current.trim())
  return cells
}

/** 按行切分，再按竖线切分列，用于表格的数据行。 */
export function splitRows(value: string): string[][] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => splitCells(line))
}
