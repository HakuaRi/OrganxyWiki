import type { Block } from '../types/content.ts'
import type { ValidationIssue } from '../types/schema.ts'
import { getSchema } from './index.ts'

/** 空值判断：未定义、null、或只有空白字符的字符串。 */
export function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * 校验一棵块树，返回全部问题。
 * 只做结构层面的检查：类型是否注册、必填参数是否为空、非容器块是否带了子块。
 */
export function validateBlocks(blocks: Block[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  walk(blocks, issues, '')
  return issues
}

function walk(blocks: Block[], issues: ValidationIssue[], trail: string): void {
  blocks.forEach((block, index) => {
    const at = trail === '' ? String(index + 1) : `${trail}.${index + 1}`
    const schema = getSchema(block.type)
    if (!schema) {
      issues.push({
        blockId: block.id,
        message: `第 ${at} 个块的类型「${block.type}」没有注册 Schema`
      })
      return
    }

    for (const field of schema.fields) {
      const value = block.params[field.key]

      if (field.type === 'template-list') {
        if (field.required && (!Array.isArray(value) || value.length === 0)) {
          issues.push({
            blockId: block.id,
            key: field.key,
            message: `第 ${at} 个块（${schema.label}）的「${field.label}」至少要有一行`
          })
          continue
        }
        if (!Array.isArray(value)) continue
        value.forEach((row, rowIndex) => {
          const record = (row ?? {}) as Record<string, unknown>
          for (const itemField of field.itemFields ?? []) {
            if (itemField.required && isBlank(record[itemField.key])) {
              issues.push({
                blockId: block.id,
                key: field.key,
                message: `第 ${at} 个块（${schema.label}）「${field.label}」第 ${rowIndex + 1} 行缺少必填项「${itemField.label}」`
              })
            }
          }
        })
        continue
      }

      if (field.required && isBlank(value)) {
        issues.push({
          blockId: block.id,
          key: field.key,
          message: `第 ${at} 个块（${schema.label}）缺少必填参数「${field.label}」`
        })
      }
    }

    if (!schema.container && block.children.length > 0) {
      issues.push({
        blockId: block.id,
        message: `第 ${at} 个块（${schema.label}）不允许容纳子块，但它带了 ${block.children.length} 个子块`
      })
    }

    walk(block.children, issues, at)
  })
}
