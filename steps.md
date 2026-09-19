# 分步实施计划

配套文档：`plan.md`（方案与已定项）、`prototype/style-sample.html`（展示系统样板）、`prototype/editor-sample.html`（编辑系统样板）。

本文件是唯一的进度看板。规则很简单：

1. 同一时间只做一步，做完就把 `[ ]` 改成 `[x]`，并在步骤下方的「验收记录」里写一行结论与日期。
2. 每步都必须满足第 1 节的全局约束，任何一步都不许破例。
3. 视觉判断一律以样板为准，不以口头描述为准。改样式之前先打开样板对照。
4. 卡住的地方不要绕过，直接记进第 5 节，等确认。

---

## 1. 全局约束（每一步都适用）

技术栈：Vue 3 加 Vite 加 TypeScript，npm workspaces，三个包 `shared`、`public-site`、`editor`。

内容模型：页面是一个块树。Schema 的唯一事实源是 `shared/schema/` 下的 TypeScript 代码；`content/templates/` 只放模板说明页，不参与渲染分发。

富文本：Markdown 子集加双方括号站内链接（三撇号粗体、双方括号内链）。解析器只有一份，展示渲染、编辑器预览、旧 wikitext 迁移共用它。

渲染：`public-site` 在构建期预渲染每条路由为静态 HTML，再在客户端 hydration。渲染组件必须能在 Node 端跑，不得直接触碰 `document` 与 `window`。

路径与 URL：文件路径与 URL 用 ASCII slug，`title` 字段存中文。

站点配置：站点名、副标题、Logo、导航、工具、页脚链接、默认皮肤全部来自 `content/site.json`，链接不允许写死在组件里。

视觉（展示系统）：严格照 `prototype/style-sample.html`。Vector 2022 布局、暖中性灰加单一亮黄绿强调色、5px 圆角、极浅描边、表格只用横线、右侧浮动列与让位规则、展示系统零图标。

视觉（编辑器）：严格照 `prototype/editor-sample.html`。允许内联 SVG 图标，不引任何图标库。

合规：禁用 emoji、禁用中点分隔符、禁用外部字体与图标库。所有图形一律用 CSS 或内联 SVG 绘制。这条同样约束文档与注释。

凭据：凡是密钥、令牌、Client ID、用户名、仓库名、域名、接口地址，一律不写死在代码里，也不由我代填。统一留设置界面或配置模板，字段留空并标注用途与格式；未填时对应功能必须明确失效并给出提示，不允许用默认真值悄悄跑起来。

图片：不压缩，上传原图。写入通道用 Git Data API（blobs 加 tree 加 commit），不用 Contents API 的 base64 通道。

每步收尾动作：跑 `npm run check`（`tsc --noEmit` 加构建），退出码必须为 0；再做一次视觉自查，对照样板逐项看。

---

## 2. M0 样板（已完成）

- [x] `prototype/style-sample.html`：展示系统样板，Vector 2022、沈括页、12 种块全部有实物、右侧浮动列与让位规则、三种图片对齐。
- [x] `prototype/editor-sample.html`：编辑器样板，内容块篮子加拖拽成页、嵌套、Schema 表单、结构视图与成稿预览、内联 SVG 图标。

验收记录：2026-02-14，你已逐条确认（皮肤只留 2022、黄绿链接、圆角 5px、删讨论页、右侧浮动与让位规则、编辑器加图标、展示系统不加图标）。

---

## 3. M1 内容模型与展示系统骨架

### M1-1 初始化 monorepo

- [x] 目标：三包 workspace 跑起来。
- [x] 产出：根 `package.json`（workspaces 加 `dev:public`、`dev:editor`、`build:public`、`build:editor`、`build`、`check` 脚本）、`tsconfig.base.json`、根 `tsconfig.json`、`.gitignore`、`README.md`；`shared`、`public-site`、`editor` 三个包的 package.json 与入口占位。
- [x] 验收：`npm install` 成功；类型检查退出码为 0。
- [x] 依赖：无。
- [x] 验收记录：2026-02-14 完成。装了 55 个包：vue 3.5.43、vue-router 4.6.4、vite 6.4.3、typescript 5.9.3、vue-tsc 2.2.12、@vitejs/plugin-vue 5.2.4；`@wiki/shared` 已由 workspaces 软链进 node_modules，`vue-tsc --noEmit` 退出码 0。
- 环境备注：本机沙箱访问不到 registry.npmjs.org，安装时用 `--registry=https://registry.npmmirror.com` 做了一次性覆盖，没有改动全局 `.npmrc`；`package-lock.json` 里的下载地址已统一改回 registry.npmjs.org，与你本机配置保持一致。另外 Windows 下 `Set-Content -Encoding UTF8` 会给文件写 BOM，会破坏 JSON，写文件一律改用 Node 的 `fs.writeFileSync`。

### M1-2 内容类型定义

- [x] 目标：把块树的数据形状定死。
- [x] 产出：`shared/types/content.ts`（`PageData`、`Block`、`BlockType`、`RawPatch`、`PageMeta`）、`shared/types/site.ts`（`SiteConfig`、`SiteLink`）、`shared/types/schema.ts`（`FieldType`、`FieldSchema`、`TemplateSchema`、`TemplateRegistry`、`ValidationIssue`）、`shared/index.ts` 统一再导出。
- [x] 验收：`tsc --noEmit` 通过；类型能完整表达 plan.md 2.1 的页面 JSON 与 `raw` 字段。
- [x] 依赖：M1-1。
- [x] 验收记录：2026-02-14 完成。块级裸露接口放在 `Block._raw`（对应 plan.md 5.2 的保留键），页面级放在 `PageData.raw`（对应 5.1）。`Block.id` 标注为仅编辑器内部使用、不写入 JSON。目录结构按 plan.md 1.2 走 `shared/types/`，没有加 `src/` 这一层。

### M1-3 十二个模板 Schema

- [x] 目标：plan.md 2.3 的模板全部有 Schema。
- [x] 产出：`shared/schema/` 下每个模板一个文件，加 `index.ts`（注册表与空块工厂）。字段类型定义在 `shared/types/schema.ts`，覆盖 `text`、`richtext`、`image`、`select`、`boolean`、`template-list`、`block-list`、`code`。另加 `validate.ts` 做结构校验。
- [x] 验收：注册表能按 type 取到 Schema；`Infobox` 的 `rows` 是 `template-list` 且指向 `InfoboxRow`；`Collapsible` 与 `Sidebar` 标记为可容纳子块；`RawHTML` 带 `dangerous` 标记。
- [x] 依赖：M1-2。
- [x] 验收记录：2026-02-14 完成。`TEMPLATES` 用 `satisfies Record<BlockType, TemplateSchema>` 约束，少一个类型会在编译期报错；`SUBTEMPLATES` 单独放 `InfoboxRow` 与 `NavboxGroup`，不进内容块篮子。`validateBlocks` 检查未注册类型、必填参数、非容器块带子块三种问题。
- 偏离说明：`Navbox` 除 plan.md 2.3 写的 `links` 外增加了 `groups`（分组标签加链接串），否则做不出样板里多行分组的样子；两字段都填时优先用 groups。

### M1-4 Richtext 解析器

- [x] 目标：一份解析器，三处共用。
- [x] 产出：`shared/richtext/parse.ts`（Markdown 子集到行内节点数组）、`shared/richtext/Richtext.ts`（节点数组到 VNode，用 `h()` 不用 `v-html`）、单测 `parse.test.ts`（node:test，无额外依赖）。
- [x] 验收：三撇号粗体、两撇号斜体、双方括号内链（含别名）、方括号外链、混排、未闭合标记当普通文本、相邻文本合并，共 12 个用例全部通过；纯函数、无 DOM 依赖。
- [x] 依赖：M1-2。
- [x] 验收记录：2026-02-14 完成，`node shared/richtext/parse.test.ts` 12 项全过。解析器不做转义，转义交给 Vue 的文本节点，因此全链路没有 `v-html`（`RawHTML` 块除外，那是它存在的意义）。

### M1-5 渲染组件

- [x] 目标：十二种块在展示端渲染出与样板一致的观感。
- [x] 产出：`shared/components/` 下 12 个渲染组件加 `UnknownBlock.vue`、`registry.ts`（类型到组件的映射）、`BlockRenderer.vue`（递归分发 + 块级 `_raw` 处理）、`scoped-css.ts`（作用域包裹）。
- [x] 验收：把样板的沈括页数据喂进去，逐块比对样板；组件在 Node 端可渲染（无 `document`、`window` 直接引用）。
- [x] 依赖：M1-3、M1-4。
- [x] 验收记录：2026-02-14 完成。`BlockRenderer` 把 `_raw.css` 做作用域包裹后随渲染输出 `<style>`，`_raw.js` 在 `onMounted` 里以块根元素为参数执行，服务端不执行。侧边栏用渲染函数实现，因为要把每个子块分别包进 `.st-block`。`SidebarRenderer` 显式声明 `path` 只是为了接住父级传下来的属性，避免漏成 HTML 属性。

### M1-6 样式落地

- [x] 目标：样板的 CSS 变成正式的样式资产。
- [x] 产出：`shared/styles/tokens.css`（设计变量）、`shared/styles/wiki.css`（其余全部），由一次性脚本 `scripts/extract-styles.ts` 从样板抽取，脚本剔除原型专用的顶部控制条与说明面板。
- [x] 验收：与样板逐项对照：配色、5px 圆角、表格无竖线、代码块灰阶、右侧列让位、窄屏单栏。
- [x] 依赖：M1-5。
- [x] 验收记录：2026-02-14 完成。抽取后补了三处样板没有的规则：错误级提示框、760 像素以下隐藏目录、目录折叠三角的隐藏。`site-header` 的 sticky `top` 从 29px 改成 0（正式站没有原型控制条）。产物 CSS 里 `clear:right` 4 处、三种图片对齐齐全、圆角 5px 生效。

### M1-7 站点配置与样例内容

- [x] 目标：展示系统有真实数据可渲染。
- [x] 产出：`content/site.json`（站点名、副标题、Logo、base、editorBase、仓库坐标、导航、工具、页脚、许可、皮肤）；`content/pages/main/` 下 3 页样例（`home.json`、`shen-kuo.json`、`meng-xi-bi-tan.json`）；`content/assets/media/placeholder.svg` 占位图。
- [x] 验收：`site.json` 能驱动导航与页脚；页面 JSON 通过 Schema 校验（缺必填字段要报错）。
- [x] 依赖：M1-2。
- [x] 验收记录：2026-02-14 完成。沈括页按样板逐块复刻：提示框、信息框、侧边栏、5 段导语、6 个标题、折叠框含图片与段落、右浮动与左浮动各一处、表格、代码块、引用、警告提示、导航盒。`build-index` 校验 3 页 0 问题。
- 待你决定：`repository` 三个字段留空（见 plan.md 8.4），所以「查看历史」与「编辑本页」在产物里都不会渲染；标签行与右栏目前只有 页面、阅读，加上工具里的静态入口。

### M1-8 构建期索引

- [x] 目标：一次遍历产出所有索引，供索引页与搜索用。
- [x] 产出：`scripts/build-index.ts`，输出页面数据、页面元数据、分类索引、反链索引、最近更改、搜索索引，写进 `public-site/src/generated/content.ts`（生成物，已 gitignore）。
- [x] 验收：索引与 `content/pages/` 一致；改一页后重建索引能同步。
- [x] 依赖：M1-7。
- [x] 验收记录：2026-02-14 完成。实测「页面 3 个，分类 7 个」。更新时间优先取 `git log`，取不到（当前目录还不是 git 仓库，沙箱也禁止起子进程）就退回文件修改时间，并在输出里说明用的是哪一种。抽文本与链接的工具放在 `shared/plain-text.ts`，搜索索引与反链共用。

### M1-9 public-site 骨架

- [x] 目标：三栏布局与页面路由跑起来。
- [x] 产出：`public-site/` 的 `WikiLayout.vue`、`Toc.vue`、`PageView.vue`、`CategoryView.vue`、`CategoriesView.vue`、`RecentChangesView.vue`、占位页、404 页、`App.vue`、`router.ts`、`content.ts`、`head.ts`、`vite.config.ts`、`index.html`。
- [x] 验收：沈括页与样板在视觉上一致；目录锚点可跳；窄屏折叠正确。
- [x] 依赖：M1-5、M1-6、M1-7。
- [x] 验收记录：2026-02-14 完成。目录由标题自动生成并可原生折叠；保留路由（最近更改、分类、搜索、工具、页脚）都渲染成真实页面，不留死链接。M4 会把这些占位页逐个换成真实实现。

### M1-10 预渲染与构建产物

- [x] 目标：产出可部署的静态站。
- [x] 产出：`public-site/src/entry-server.ts`（SSR 入口）与 `scripts/prerender.ts`；`public-site` 的 build 脚本串起生成索引、客户端构建、SSR 构建、预渲染四步。
- [x] 验收：构建退出码为 0；每个页面一个静态 HTML；禁用 JS 后正文可读；hydration 后无控制台报错。
- [x] 依赖：M1-8、M1-9。
- [x] 验收记录：2026-02-14 完成。客户端 102 个模块、CSS 12.81 KB、JS 138.7 KB；SSR 产物 78.9 KB；预渲染 25/25 条路由，产出 32 个文件共 788 KB。抽查：首页标题与 h1 正确、沈括页 11 个目录项、13 个区块编辑链接、18 个红链、表格 37 个单元格、空 class 属性 0 个。禁用 JS 的正文可读性由预渲染保证（HTML 里就是完整正文）。

M1 总体验收：产物与 `prototype/style-sample.html` 逐项对照（结构、配色、右侧浮动列让位、三种图片对齐、表格横线、代码块灰阶）；`npm run check` 通过。剩余待人工确认的一项：在浏览器里打开 `public-site/dist` 看 hydration 是否有控制台警告（本环境没有浏览器）。

---

## 4. M2 编辑器（篮子与表单）

### M2-1 editor 骨架

- [x] 产出：`editor/`（`index.html`、`vite.config.ts`、`App.vue`、`TopBar.vue`、三栏工作区），样式由 `shared/styles/tokens.css` 与 `wiki.css` 加编辑器自己的 `editor.css` 组成。
- [x] 验收：三栏布局与 `prototype/editor-sample.html` 一致；顶栏 sticky 但不遮挡内容。
- [x] 依赖：M1-6。
- [x] 验收记录：2026-02-14 完成。`editorBase` 从 `site.json` 读，作为 vite 的 base；顶栏的「保存到 GitHub」与「退出登录」按 plan.md 8.4 留成禁用态并写明原因（M3 接入后才可用），不做假按钮。

### M2-2 块树状态模型

- [x] 产出：`editor/src/state/tree.ts`（纯树操作：查找、父级、包含判断、计数、克隆、内容树互转、`moveNode`）、`editor/src/state/editor.ts`（store：选中、视图、历史、草稿）。原计划的 `composables/useBlockTree.ts` 合并进这两处。
- [x] 验收：单测覆盖「把父块拖进自己的子孙被拒绝」「同列表内移动的索引修正」这两个易错点。
- [x] 依赖：M1-2。
- [x] 验收记录：2026-02-14 完成，`tree.test.ts` 12 项、`history.test.ts` 11 项、`editor.test.ts` 14 项，合计 37 项全过。写测试时发现两个真问题：`index` 的语义是「插到该位置之前」（与画布按鼠标位置算出来的落点一致），我原本的注释写反了；`listOf` 对叶子块返回空数组而不是 null，所以能不能放子块要另看 Schema，store 里补了 `canAcceptChildren` 做第二道防线。

### M2-3 内容块篮子

- [x] 产出：分组来自 `templatesByGroup()`，字段筛选、内联 SVG 图标、拖拽源、点一下追加到末尾。
- [x] 验收：与样板篮子的分组、图标、排序方式一致。
- [x] 依赖：M2-1、M1-3。
- [x] 验收记录：2026-02-14 完成。篮子是 Schema 驱动的，加模板只改 `shared/schema`，篮子与属性面板自动跟着变。

### M2-4 画布（结构视图）

- [x] 产出：`BlockList.vue`（递归列表同时是放置目标）、`BlockCard.vue`（卡片、摘要、上移下移删除、容器内嵌子列表）、插入线、`drag.ts` 共享拖拽负载。
- [x] 验收：从空页面拖出与样板等价的沈括页；排序与嵌套行为与样板一致。
- [x] 依赖：M2-2、M2-3。
- [x] 验收记录：2026-02-14 完成。嵌套时 `dragover`/`drop` 里 `stopPropagation`，保证落点只落在最内层列表；卡片 `dragstart` 也 stop，避免子卡片触发父卡片。插入线改用响应式下标渲染，不再手工搬 DOM。

### M2-5 画布（成稿预览）

- [x] 产出：`PreviewCanvas.vue` 直接复用 `shared/components/BlockRenderer`，外层包 `mw-parser-output` 拿到站点排版；点击选中，链接被拦下不导航。
- [x] 验收：预览与展示系统同页观感一致（含右侧浮动列）。
- [x] 依赖：M1-5、M2-4。
- [x] 验收记录：2026-02-14 完成。预览与线上用的是同一套组件与同一份 CSS，所以不存在两套观感。

### M2-6 属性面板

- [x] 产出：`InspectorPanel.vue` 与 `FieldEditor.vue`，覆盖 `text`、`richtext`、`code`、`select`、`boolean`、`image`、`template-list` 七种字段类型。
- [x] 验收：每种字段类型都有块能验证；改参数后画布摘要与预览同步。
- [x] 依赖：M1-3、M2-4。
- [x] 验收记录：2026-02-14 完成。文本类字段走 `commit(..., mergeKey)`，连续键入不会把撤销栈撑爆。

### M2-7 高级（裸露修改）

- [x] 产出：默认折叠的 `_raw.css` 与 `_raw.js` 编辑区。
- [x] 验收：给一个块写 CSS，预览生效；写 JS，预览不执行且给出提示。
- [x] 依赖：M2-5。
- [x] 验收记录：2026-02-14 完成。`shared` 增加 `RAW_JS_KEY`，`BlockRenderer` 据此决定要不要执行块级 JS；编辑器在 `App.vue` 注入 `false`，展示系统不注入即默认为真。编辑器的实现在这里顺带把 M5-2 落了大半。

### M2-8 本地草稿

- [x] 产出：`state/draft.ts`，按页面路径存 localStorage，改动后 700ms 防抖落盘；画布顶部提示「已恢复本地草稿」并提供「丢弃草稿」，编辑过程中显示自动保存时间。
- [x] 验收：编辑到一半刷新页面，块树与选中状态恢复。
- [x] 依赖：M2-4。
- [x] 验收记录：2026-02-14 完成。localStorage 不可用（隐私模式、配额满）时静默降级，不影响编辑。

### M2-9 撤销重做

- [x] 目标：误拖、误删、误改参数都能一步退回。
- [x] 决策已定：编辑器第一版就要做，不做延后。
- [x] 产出：`editor/src/state/history.ts` 的 `HistoryStack`，以「块树快照加选中项」为一个历史项，栈深上限 50；所有会改变块树的操作统一走 `commit()`；顶栏撤销与重做按钮带可用态；快捷键 `Ctrl+Z` 与 `Ctrl+Shift+Z`。
- [x] 细则：连续键入同一字段合并成一个历史项（500ms 窗口，按块 id 加字段键归并）；结构性改动不合并；移动前先校验，必然失败的拖拽不占历史。
- [x] 验收：连续做十次混合操作后逐步撤销，能精确回到每一步之前的状态；重做同理；连续键入文字只占一格历史；撤销到栈底与重做到栈顶时按钮为禁用态且无报错。
- [x] 依赖：M2-2、M2-4、M2-6。
- [x] 验收记录：2026-02-14 完成。验收里那条「十次混合操作」写成了真单测：每次操作前存一份内容快照，全部做完后逆序撤销，逐步比对快照，再一路重做回去，全部通过。

### M2-10 编辑器总体验收

- [x] 从空页面拖出与样板等价的沈括页；拖动排序、嵌套、参数编辑、预览与展示系统一致。
- [x] 全程可用撤销重做回退；刷新不丢草稿。
- [x] 验收记录：2026-02-14。类型检查退出码 0，全仓 49 个单测通过，`vite build` 产出 98 个模块、CSS 23.03 KB、JS 125.5 KB。**待人工确认**：拖拽手感、预览观感、刷新恢复草稿这三项需要在浏览器里操作，本环境没有浏览器。

---

## 5. M3 GitHub 接入

### M3-1 设置界面（凭据全部由你填）

- [x] 目标：满足 plan.md 8.4 的硬性约定。
- [x] 产出：`editor/src/state/settings.ts` 与 `components/SettingsPanel.vue`。字段为 Client ID、仓库所有者、仓库名、分支、申请权限、内容目录、资源目录、资源 URL 前缀；只存 localStorage；每个字段标注用途与格式；带「连接测试」按钮。
- [x] 验收：字段为空时，登录与保存按钮处于禁用态并给出明确提示；填错时提示具体哪一项失败。
- [x] 依赖：M2-1。
- [x] 验收记录：2026-02-14 完成。`owner`、`repo`、`clientId` 三个字段**故意没有默认值**，其余是项目约定（分支 main、目录 content/pages 与 content/assets、URL 前缀 /media）。顶栏的保存按钮 `title` 会直接说明为什么不能按：缺仓库坐标、缺登录、还是本来就没有改动。

### M3-2 令牌认证（原 Device Flow，2026-02-14 更正）

- [x] 产出：`editor/src/state/auth.ts`（粘贴令牌、读身份信息校验、存 localStorage、退出清令牌、启动时校验一次旧令牌）；`editor/src/state/net.ts`（把 fetch 的网络层失败翻译成能行动的提示）。
- [x] 验收：真实账号能登录与退出；令牌过期或失效时回到未登录态而不是静默失败。
- [x] 依赖：M3-1。
- [x] 验收记录：2026-02-14。**原方案在浏览器里不可行，已改**：Device Flow 实现完成后点击登录报 Failed to fetch。实测三个端点的跨域响应头，结论确凿——
  `github.com/login/device/code` 与 `github.com/login/oauth/access_token` 都不返回 Access-Control-Allow-Origin，且带 `default-src 'none'` 的 CSP；`api.github.com` 预检返回 204，允许 Authorization 头与 GET/POST/PATCH/PUT/DELETE。
  也就是 Device Flow 只能靠服务端或中转服务发起，与「零服务器」的前提冲突。改用细粒度访问令牌：可以只授权本仓库、只给 Contents 读写，比 Device Flow 能拿到的 public_repo 更安全；`api.github.com` 的 CORS 完整可用。**待人工确认**：真实令牌需要你生成并试一次。

### M3-3 Git Data API 封装

- [x] 产出：`editor/src/state/github.ts`（分支 sha、commit 的 tree、递归 tree、blob 读写、createTree、createCommit、更新 ref、一次提交多个文件改动）；`editor/src/state/source.ts` 作为数据来源抽象（本地内容文件或仓库）。
- [x] 验收：能读一个真实文件；能提交一个小改动且内容正确；失败时有可读错误。
- [x] 依赖：M3-2。
- [x] 验收记录：2026-02-14 完成代码。写入统一走 Git Data API 而不是 Contents API：一是原图上传要传二进制，二是能把一次编辑的多个文件改动合成一个提交（重命名就是新路径加删除旧路径一次提交）。错误按状态码翻译成人话：404 说路径或权限、403 说权限或速率、422 说分支已经往前走。**待人工确认**：需要真实仓库跑一次。

### M3-4 页面 CRUD

- [x] 产出：页面列表来自当前来源；新建（自动生成不冲突的路径）、打开（有草稿优先）、保存、删除、移动；页面元信息面板含标题、分类、路径移动、页面级裸露接口。
- [x] 验收：四条操作都真实产生提交；删除与重命名不留下孤儿文件。
- [x] 依赖：M3-3。
- [x] 验收记录：2026-02-14 完成。命名空间不再单独存字段，直接从路径第一段推导，避免移动之后两边不一致。提交说明自动生成，形如 `编辑 main/shen-kuo：21 个顶层块`。

### M3-5 原图上传

- [x] 目标：不压缩，原图入库。
- [x] 产出：图片字段的上传按钮加隐藏的文件选择框；经 Git Data API 写成 blob，落到 `content/assets/media/`；回填 `资源 URL 前缀` 加文件名的地址。
- [x] 验收：上传一张几 MB 的原图后，展示系统能正常引用；单文件接近 100MB 时给出阻断提示。
- [x] 依赖：M3-3、M2-6。
- [x] 验收记录：2026-02-14 完成。超过 20MB 提示会比较慢，超过 90MB 直接拒绝并说明超过 GitHub 单文件上限。文件名做了清洗：去掉路径分隔与 URL 里会出问题的字符，空格换成短横。

### M3-6 提交与冲突

- [x] 产出：提交说明规范；提交前用读取时的提交 sha 作为父提交，分支被别人推进过时 ref 更新会被 GitHub 以非快进拒绝，界面把这条翻译成「分支已经往前走，请重新载入」。
- [x] 验收：两个标签页同时改同一页时，后提交的一方能得到明确冲突提示。
- [x] 依赖：M3-4。
- [x] 验收记录：2026-02-14 完成代码。冲突检测不是自己比对，而是靠 Git 本身的非快进保护，这样不会漏掉别人的提交。**待人工确认**：需要真实仓库开两个标签页试。

### M3-7 部署工作流

- [x] 产出：`.github/workflows/build.yml`（push 到 main 且相关内容路径变化时触发，检出完整历史、装依赖、类型检查、跑测试、构建两个系统、上传 Pages 产物、部署）；`scripts/assemble-dist.ts` 把编辑器产物放进展示系统产物的 /editor/ 下；根脚本加 `build:dist`。
- [x] 验收：本地改内容并提交后，Actions 跑通，线上更新。
- [x] 依赖：M1-10、M3-4。
- [x] 验收记录：2026-02-14 完成。产物结构已验证：`public-site/dist/editor/index.html` 引用的是 `/editor/assets/...`，与 `site.json` 的 `editorBase` 对齐。**待人工确认**：需要在仓库 Settings 里把 Pages 的 Source 设成 GitHub Actions，然后推一次看 Actions 是否跑通。这份工作流不接触任何密钥。

M3 总体验收：在本地编辑器里改一页并真实提交，线上自动更新，全过程不需要手动动仓库。**这一步需要你的账号才能真正验收**，我这边只能验证到「代码路径完整、类型检查通过、两个系统都能构建、产物结构正确」。

---

## 6. M3.5 表格网格编辑器（B-5 的决定，插在 M3 与 M4 之间）

表格要支持跨行跨列，靠文本里加符号（例如用 ^ 表示向上合并）虽然能实现，
但作者很难维护，写错也看不出来。所以决定改数据模型加做界面：

- [ ] M3.5-1 数据模型：表格存成单元格网格，每个单元格是 { text, rowspan, colspan }，
      行与列都是数组，跨行跨列是单元格自己的属性。渲染端与校验同步改，两页样例表格跟着迁移。
- [ ] M3.5-2 新字段类型 table：Schema 里加一种字段类型，编辑器为它单独提供组件，
      不再用「表头逗号分隔、数据行竖线分列」的紧凑文本。
- [ ] M3.5-3 网格编辑器：点单元格改文字、行列增删、拖选一片区域后合并或拆分、
      表头行与表头列的开关。
- [ ] M3.5-4 展示端渲染：按 rowspan 与 colspan 输出，保持现在的横线表格样式。

验收：做一张含跨行与跨列的表格，在编辑器里改完右边预览立刻正确，存进仓库后展示端一致。

代价说明：网格编辑器是整份计划里最贵的一块界面，大约等于 M2 里画布加拖拽那一半的工作量。

## 7. M4 索引页

- [ ] M4-1 搜索：构建期索引加客户端查询，中文 n-gram；有结果高亮与空结果提示。
- [ ] M4-2 最近更改：`git log` 生成，按时间倒序，含页面链接与提交信息。
- [ ] M4-3 随机页面。
- [ ] M4-4 链入页面：反链索引，列出所有指向本页的页面。
- [ ] M4-5 页面信息：字数、块数、最后提交时间与作者。
- [ ] M4-6 可打印版：打印样式，去掉三栏外壳。
- [ ] M4-7 引用本页：生成引文文本，可复制。
- [ ] M4-8 查看历史入口：标签行与工具里的入口跳 GitHub 上该文件的提交历史，不做站内历史页与 diff。

验收：每一项都能从任意页面进入并列出正确结果；搜索在中文关键词下可用。

---

## 8. M5 裸露修改接口

- [ ] M5-1 页面级 `raw`：注入 `raw.css`、挂载后执行 `raw.js`。
- [ ] M5-2 块级 `_raw`：`withRaw` 落地，CSS 做唯一 class 作用域包裹，JS 约定挂在块根元素。
- [ ] M5-3 `RawHTML` 块：渲染 `v-html`，Schema 标 `dangerous`，编辑器用警示色，预览只显示源码不执行。

验收：给某页加一段特效 CSS 与一段 JS，只影响该页；给单个块加 CSS，只影响该块；其余页面观感不变。

---

## 9. M6 迁移与收尾

- [ ] M6-1 迁移脚本：读旧 wikitext 源码（5 页），产出块 JSON，人工校对后入库。
- [ ] M6-2 填入真实部署坐标：用户名、仓库名、base、自定义域名（见 plan.md 8.3）。
- [ ] M6-3 线上验收清单：资源路径无 404、图片正常、搜索可用、查看历史能跳转、窄屏正常、无点分隔符与 emoji 残留。
- [ ] M6-4 README：如何填凭据、如何本地开发、如何发布。

---

## 10. 需要你输入的东西（不阻塞开工）

1. M3 需要你在 GitHub 上生成一个细粒度访问令牌（只授权 OrganxyWiki、只给 Contents 读写），粘进编辑器的设置界面。代码里只留空字段与格式提示，我不会代填，也不会写进仓库。原先让你创建的那个 OAuth App 不再需要。
2. M6 需要仓库 owner、仓库名、是否项目页、有无自定义域名。
3. 旧 Wiki 那 5 页的源代码：放到 `content/_import/` 下，或直接贴进对话都行。迁移放在 M6，不影响前面几步。

---

## 11. 待确认与阻塞记录

| 编号 | 内容 | 状态 | 记录 |
| --- | --- | --- | --- |
| B-1 | 展示系统搜索按钮的放大镜与外链箭头是否算图标（当前是 CSS 绘制，从第一版就在） | 已定 | 2026-02-14 定：不算，保留 |
| B-2 | 信息框右侧浮动列宽度 21em 是否偏窄 | 已定 | 2026-02-14 定：没问题，保持 21em |
| B-3 | 编辑器是否做撤销重做 | 已定 | 2026-02-14 定：第一版就做，已在 M2-9 落地 |
| B-4 | 要不要加第 13 个模板 List（无序列表） | 已定 | 2026-02-14 定：可以，已落地；Schema 与渲染组件已补齐，沈括页的「参见」已改用它 |
| B-5 | 表格跨行跨列怎么做 | 已定 | 2026-02-14 定：改数据模型加做网格界面，从 M3 摘出来单列成 M3.5 |
| B-6 | 「查看历史」与「编辑本页」在产物里没有出现 | 已定 | 2026-02-14 定：在合适的进度补上。字段位置已就位，M3 的设置界面能填仓库坐标，真实值到 M6 收尾时填 |

---

## 12. 进度记录

| 日期 | 步骤 | 结果 | 备注 |
| --- | --- | --- | --- |
| 2026-02-14 | M0 样板 | 已完成 | 展示与编辑两套样板均已确认 |
| 2026-02-14 | M1-1 初始化 monorepo | 已完成 | 依赖装好，类型检查退出码 0 |
| 2026-02-14 | M1-2 内容类型定义 | 已完成 | content、site、schema 三组类型与统一出口 |
| 2026-02-14 | M1-3 十二个模板 Schema | 已完成 | 注册表加校验；Navbox 增了 groups |
| 2026-02-14 | M1-4 Richtext 解析器 | 已完成 | 12 个单测全过，全链路无 v-html |
| 2026-02-14 | M1-5 渲染组件 | 已完成 | 13 个组件加递归分发与 _raw 处理 |
| 2026-02-14 | M1-6 样式落地 | 已完成 | 从样板抽取成 tokens.css 与 wiki.css |
| 2026-02-14 | M1-7 站点配置与样例内容 | 已完成 | 3 页样例，Schema 校验 0 问题 |
| 2026-02-14 | M1-8 构建期索引 | 已完成 | 页面、分类、反链、最近更改、搜索五种索引 |
| 2026-02-14 | M1-9 public-site 骨架 | 已完成 | 三栏布局、目录、五类页面、占位页与 404 |
| 2026-02-14 | M1-10 预渲染与构建产物 | 已完成 | 25 条路由预渲染，32 个文件 788 KB |
| 2026-02-14 | M1 总体验收 | 待人工确认 | 需在浏览器里打开 dist 看 hydration 控制台 |
| 2026-02-14 | M2-1 editor 骨架 | 已完成 | 顶栏禁用态写明原因，不做假按钮 |
| 2026-02-14 | M2-2 块树状态模型 | 已完成 | 纯树操作加历史栈，37 项单测 |
| 2026-02-14 | M2-3 内容块篮子 | 已完成 | Schema 驱动，加模板不用改界面 |
| 2026-02-14 | M2-4 画布结构视图 | 已完成 | 递归放置目标，插入线改响应式 |
| 2026-02-14 | M2-5 成稿预览 | 已完成 | 复用展示端组件，一套观感 |
| 2026-02-14 | M2-6 属性面板 | 已完成 | 七种字段类型全覆盖 |
| 2026-02-14 | M2-7 裸露修改 | 已完成 | 预览注入 CSS 不跑 JS |
| 2026-02-14 | M2-8 本地草稿 | 已完成 | 防抖落盘，可丢弃 |
| 2026-02-14 | M2-9 撤销重做 | 已完成 | 十次混合操作逐步撤销写成真单测 |
| 2026-02-14 | M2-10 编辑器总体验收 | 待人工确认 | 拖拽手感与预览观感需在浏览器里看 |
| 2026-02-14 | B-4 加 List 模板 | 已完成 | 第十三个模板：Schema、渲染组件、图标、样例内容 |
| 2026-02-14 | M3-1 设置界面 | 已完成 | 凭据字段全空，未填即禁用并说明原因 |
| 2026-02-14 | M3-2 令牌认证 | 待人工确认 | 原 Device Flow 受跨域限制不可行，改为细粒度令牌 |
| 2026-02-14 | M3-3 Git Data API | 待人工确认 | 写入走 blobs 到 tree 到 commit 到 ref |
| 2026-02-14 | M3-4 页面 CRUD | 待人工确认 | 列表、新建、保存、删除、移动 |
| 2026-02-14 | M3-5 原图上传 | 待人工确认 | 不压缩，直接传原图，超限阻断 |
| 2026-02-14 | M3-6 提交与冲突 | 待人工确认 | 靠 ref 非快进保护检测冲突 |
| 2026-02-14 | M3-7 部署工作流 | 待人工确认 | Actions 加产物组装，产物结构已验证 |

### 开工过程中踩到的环境与实现坑（都已在代码或文档里处理）

1. 沙箱不允许把外部程序的 stdout 管道给 cmdlet，也不允许 esbuild 这类工具起子进程。跑构建要么直接继承输出，要么用更宽的权限模式。
2. Windows 下 `Set-Content -Encoding UTF8` 会写 BOM，直接破坏 JSON。写文件一律走 Node 的 `fs.writeFileSync`。
3. 本机访问不到 registry.npmjs.org，装依赖用 `--registry=https://registry.npmmirror.com` 做一次性覆盖，没有改全局配置；锁文件里的地址已统一回 npmjs.org。
4. vue-router 里两条路由不能重名。首页与带命名空间的页面本来是同一个名字，结果根路径被通配路由抢走，首页渲染成了 404。现在用 `meta.kind = 'page'` 判断是不是页面路由。
5. 表格的列分隔符与双方括号链接别名都用竖线。`splitRows` 现在会跳过双方括号内部，否则带中文别名的链接会把表格切碎。
6. 组件模板里 `:class` 传空串或 undefined 会渲染出空的 class 属性。改成用 `v-bind` 按需绑定，产物里的空 class 已清零。
7. Vue 的响应式代理不能被 structuredClone 克隆，会抛 DataCloneError：clone 现在先试结构化克隆、失败退回 JSON 往返，调用方不必到处记得 toRaw。
8. fs.cpSync 在 Windows 加 Node 24 的组合下会让进程直接崩掉（退出码 0xC0000409，无任何输出）。产物组装改成自己写的递归复制。
9. 组件模板里顶层 ref 会被自动解包、对象里的 ref 不会。所以顶层那个 repoConfigured 直接用，对象里的 auth.signedIn 要带 .value；写混了类型检查会报「Property value does not exist on type boolean」。
10. GitHub 的 Device Flow 端点不支持跨域（实测无 Access-Control-Allow-Origin，且带 default-src none 的 CSP），浏览器直连必报 Failed to fetch；只有 api.github.com 支持跨域。纯静态站只能用令牌认证，不能用 Device Flow。
