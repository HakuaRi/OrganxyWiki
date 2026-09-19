/**
 * 块类型到渲染组件的映射。
 * 这里的键必须覆盖 TEMPLATES 的全部键，缺一个会在类型层面报错。
 */

import type { Component } from 'vue'
import type { BlockType } from '../types/content.ts'

import ParagraphRenderer from './ParagraphRenderer.vue'
import HeadingRenderer from './HeadingRenderer.vue'
import ListRenderer from './ListRenderer.vue'
import QuoteRenderer from './QuoteRenderer.vue'
import CodeBlockRenderer from './CodeBlockRenderer.vue'
import InfoboxRenderer from './InfoboxRenderer.vue'
import CollapsibleRenderer from './CollapsibleRenderer.vue'
import NavboxRenderer from './NavboxRenderer.vue'
import SidebarRenderer from './SidebarRenderer.ts'
import ImageRenderer from './ImageRenderer.vue'
import LinkRenderer from './LinkRenderer.vue'
import NoticeRenderer from './NoticeRenderer.vue'
import TableRenderer from './TableRenderer.vue'
import RawHtmlRenderer from './RawHtmlRenderer.vue'

export const COMPONENTS = {
  Paragraph: ParagraphRenderer,
  Heading: HeadingRenderer,
  List: ListRenderer,
  Quote: QuoteRenderer,
  CodeBlock: CodeBlockRenderer,
  Infobox: InfoboxRenderer,
  Collapsible: CollapsibleRenderer,
  Navbox: NavboxRenderer,
  Sidebar: SidebarRenderer,
  Image: ImageRenderer,
  Link: LinkRenderer,
  Notice: NoticeRenderer,
  Table: TableRenderer,
  RawHTML: RawHtmlRenderer
} satisfies Record<BlockType, Component>
