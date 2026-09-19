/**
 * 共享层入口。
 *
 * 这里只作为统一出口，具体内容按里程碑逐步补齐：
 *   types/       内容与站点配置的类型（M1-2）
 *   schema/      十二个模板的 Schema 注册表（M1-3）
 *   richtext/    Markdown 子集解析器与渲染（M1-4）
 *   components/  十二种块的渲染组件（M1-5）
 *   styles/      设计变量与组件样式（M1-6）
 *
 * 导入约定：相对导入一律带 .ts 扩展名。这样同一份源码能被 Vite、vue-tsc
 * 与 Node 的原生类型剥离（scripts/ 与测试脚本）三方一致地解析。
 */

export const SHARED_PACKAGE = '@wiki/shared'

export type { Block, BlockType, PageData, PageMeta, RawPatch } from './types/content.ts'
export type { SiteConfig, SiteLink, RepoConfig } from './types/site.ts'
export type {
  FieldSchema,
  FieldType,
  TemplateRegistry,
  TemplateSchema,
  ValidateBlocks,
  ValidationIssue
} from './types/schema.ts'

export {
  GROUPS,
  SUBTEMPLATES,
  TEMPLATES,
  createBlock,
  defaultParams,
  getSchema,
  isContainer,
  templatesByGroup
} from './schema/index.ts'
export type { TemplateGroup } from './schema/index.ts'
export { isBlank, validateBlocks } from './schema/validate.ts'

export { bool, records, splitList, splitRows, str } from './params.ts'
export { buildOutline, headingId } from './outline.ts'
export type { OutlineItem } from './outline.ts'
export { assetHref, editorHref, isExternal, linkHref, normalizeBase, pageHref } from './url.ts'
export {
  PAGE_INDEX_KEY,
  PAGE_KEY,
  RAW_JS_KEY,
  SITE_KEY,
  usePageIndex,
  usePageTarget,
  useRawJsEnabled,
  useSite
} from './site-context.ts'
export { blocksToPlainText, blockText, blockLinkTargets } from './plain-text.ts'
export { inlineToPlainText, parseInline } from './richtext/parse.ts'
export type { InlineNode } from './richtext/parse.ts'
export { Richtext } from './richtext/Richtext.ts'
export { COMPONENTS } from './components/registry.ts'
export { scopeCss } from './components/scoped-css.ts'
export type { BlockProps } from './components/types.ts'
export { default as BlockRenderer } from './components/BlockRenderer.vue'
