import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import site from '../content/site.json'

const here = fileURLToPath(new URL('.', import.meta.url))
const base = (site as { base?: string }).base ?? '/'

export default defineConfig({
  base,
  plugins: [vue()],

  // 内容里的图片等静态资源直接来自 content/assets，构建时原样复制到产物根目录。
  publicDir: fileURLToPath(new URL('../content/assets', import.meta.url)),

  build: {
    outDir: 'dist',
    emptyOutDir: true
  },

  ssr: {
    // shared 是只发布源码的内部包，必须一起打进 SSR 产物，
    // 否则预渲染脚本会用 Node 去解析 .vue 文件。
    noExternal: ['@wiki/shared']
  }
})
