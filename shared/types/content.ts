/**
 * 内容数据模型。
 *
 * 一个页面是一棵块树：每个块有类型、参数表与子块数组。
 * 这套类型只描述数据形状，不涉及任何渲染实现。
 */

/** 块允许携带的类型名，与 shared/schema 注册表一一对应。 */
export type BlockType =
  | 'Paragraph'
  | 'Heading'
  | 'List'
  | 'Infobox'
  | 'Collapsible'
  | 'Navbox'
  | 'Sidebar'
  | 'Notice'
  | 'Link'
  | 'Image'
  | 'Table'
  | 'Quote'
  | 'CodeBlock'
  | 'RawHTML'

/**
 * 裸露修改接口：页面级 raw 与块级 _raw 共用这个形状。
 * css 注入到作用域内，js 在挂载后执行。
 */
export interface RawPatch {
  css: string
  js: string
}

/** 块级裸露接口挂在参数表的保留键上，避免与模板字段冲突。 */
export interface Block {
  /** 前端生成，仅用于编辑器内部定位，不写入 JSON。 */
  id?: string
  type: BlockType
  params: Record<string, unknown>
  children: Block[]
  /** 块级裸露修改接口，对应 plan.md 5.2。 */
  _raw?: RawPatch
}

/** 一个页面文件的内容，对应 plan.md 2.1。 */
export interface PageData {
  /** 展示用标题，中文。 */
  title: string
  /** 命名空间目录名，例如 main、templates。 */
  namespace: string
  /** 所属分类，用于分类页与底部分类条。 */
  categories: string[]
  blocks: Block[]
  /** 页面级裸露修改接口，对应 plan.md 5.1。 */
  raw?: RawPatch
}

/** 构建期生成的页面元数据，供索引页与搜索使用。 */
export interface PageMeta {
  /** ASCII slug，同时是文件路径与 URL。 */
  slug: string
  namespace: string
  title: string
  categories: string[]
  /** Git 最后提交时间，ISO 字符串。 */
  updatedAt: string
  /** 纯文本摘要，供搜索结果展示。 */
  excerpt: string
}
