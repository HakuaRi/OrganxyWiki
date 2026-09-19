/** 所有块渲染组件共用的 props。path 是块在树里的路径，用于锚点与 _raw 作用域。 */
export interface BlockProps {
  params: Record<string, unknown>
  path: string
}
