/**
 * 编辑器专用图标：内联 SVG，不引外部图标库，颜色跟随文字。
 * 展示系统一个图标都不用（plan.md 8.1）。
 */

/** 图标路径表。键名与块类型同名，另有若干界面图标。 */
export const PATHS: Record<string, string> = {
  Paragraph: '<path d="M2.5 4h11M2.5 8h11M2.5 12h6"/>',
  Heading: '<path d="M3.5 3.5v9M9 3.5v9M3.5 8h5.5"/>',
  List: '<path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"/>',
  Quote: '<path d="M2.5 4.5h4v4H4A1.5 1.5 0 0 1 2.5 7zM9.5 4.5h4v4H11A1.5 1.5 0 0 1 9.5 7z"/>',
  CodeBlock: '<path d="M6 4.5L2.5 8 6 11.5M10 4.5L13.5 8 10 11.5"/>',
  Infobox: '<path d="M2.5 3h11v10h-11zM2.5 6.2h11M6.2 6.2V13"/>',
  Collapsible: '<path d="M2.5 3.5h11v9h-11zM5.5 7l2.5 2.5L10.5 7"/>',
  Navbox: '<path d="M2.5 3.5h11v9h-11zM2.5 6.5h11M7.5 6.5v6"/>',
  Sidebar: '<path d="M2.5 3.5h11v9h-11zM9.5 3.5v9"/>',
  Image: '<path d="M2.5 3.5h11v9h-11zM4 11.3l3-3.4 2.2 2.5 1.4-1.3 2.4 2.2"/><circle cx="5.6" cy="6.2" r="1"/>',
  Link: '<path d="M6.8 9.2a2.4 2.4 0 0 1 0-3.4l1.2-1.2a2.4 2.4 0 0 1 3.4 3.4l-.6.6M9.2 6.8a2.4 2.4 0 0 1 0 3.4l-1.2 1.2a2.4 2.4 0 0 1-3.4-3.4l.6-.6"/>',
  Notice: '<circle cx="8" cy="8" r="5.5"/><path d="M8 7.4v3.4M8 4.9v.1"/>',
  Table: '<path d="M2.5 3.5h11v9h-11zM2.5 6.5h11M2.5 9.5h11M6.5 3.5v9"/>',
  RawHTML: '<path d="M5 4.5L2.5 8 5 11.5M11 4.5L13.5 8 11 11.5M9 3.5l-2 9"/>',
  up: '<path d="M8 12.5V4M4.5 7.5L8 4l3.5 3.5"/>',
  down: '<path d="M8 3.5V12M4.5 8.5L8 12l3.5-3.5"/>',
  trash: '<path d="M3 4.5h10M6.2 4.5V3h3.6v1.5M4.6 4.5l.6 8.5h5.6l.6-8.5"/>',
  grip: '<path d="M5.5 4.5h5M5.5 8h5M5.5 11.5h5"/>',
  upload: '<path d="M8 11V3.5M5.2 6.3L8 3.5l2.8 2.8M3 13h10"/>',
  plus: '<path d="M8 3.5v9M3.5 8h9"/>',
  dropin: '<path d="M2.5 9.5v3h11v-3M8 2.5v7M5.5 7L8 9.5 10.5 7"/>',
  basket: '<path d="M2.5 6h11l-1.3 7H3.8zM5.8 6L7 3M10.2 6L9 3"/>',
  sliders: '<path d="M3 5.5h10M3 10.5h10M6.2 3.8v3.4M9.8 8.8v3.4"/>',
  tree: '<path d="M4 4h3M4 8h3M4 12h3M9 8h3.5M7 4v8"/>',
  eye: '<path d="M1.5 8S4 4.5 8 4.5 14.5 8 14.5 8 12 11.5 8 11.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.7"/>',
  undo: '<path d="M5.5 4.5L2.5 7.5l3 3M2.8 7.5H9a4 4 0 0 1 0 8H6.5"/>',
  redo: '<path d="M10.5 4.5l3 3-3 3M13.2 7.5H7a4 4 0 0 0 0 8h2.5"/>',
  save: '<path d="M8 11V3M5 6l3-3 3 3M3 13h10"/>',
  reload: '<path d="M13 8a5 5 0 1 1-1.8-3.8M13 3v3.2H9.8"/>',
  clear: '<path d="M4 4l8 8M12 4l-8 8"/>',
  logout: '<path d="M6 3.5H3.5v9H6M9.5 5.5L12 8l-2.5 2.5M11.8 8H6.5"/>',
  doc: '<path d="M4 2.5h5l3 3v8H4zM9 2.5v3h3"/>'
}

/** 生成一个内联 SVG 图标。 */
export function ico(name: string, size = 15, cls = ''): string {
  const path = PATHS[name] ?? ''
  return `<svg class="ico${cls === '' ? '' : ` ${cls}`}" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true">${path}</svg>`
}

/** 图标名是否已定义，供测试与排查用。 */
export function hasIcon(name: string): boolean {
  return name in PATHS
}
