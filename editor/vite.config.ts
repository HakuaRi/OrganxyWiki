import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import site from '../content/site.json'

const base = (site as { editorBase?: string }).editorBase || '/'

export default defineConfig({
  // 编辑器部署在站点的子路径下，地址由 site.json 的 editorBase 决定。
  base,
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    // 本地开发时内容目录在工作区里，允许读取。
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] }
  }
})
