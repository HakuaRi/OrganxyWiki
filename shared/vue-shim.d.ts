/**
 * Vue 单文件组件的类型声明。
 * 让 tsc 认识 .vue 导入（真实类型检查由 vue-tsc 完成）。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
