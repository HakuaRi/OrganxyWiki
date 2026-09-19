/** 展示系统入口：挂载应用并做 hydration。 */

import { createSSRApp } from 'vue'
import App from './App.vue'
import { createBrowserRouter } from './router.ts'
import './styles.ts'

const app = createSSRApp(App)
const router = createBrowserRouter()
app.use(router)

// 预渲染出来的 HTML 已经是对应路由的内容，等路由就绪再挂载，保证 hydration 匹配。
router.isReady().then(() => app.mount('#app'))
