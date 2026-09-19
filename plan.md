Vue.js 模板驱动 Wiki 系统，完整方案
技术栈：Vue 3 + Vite + TypeScript / 部署：GitHub Pages / 后端：无（纯静态 + GitHub API）

文档版本：v3。本次改动：1) 第八章重写为「已定项与遗留问题」，把样板阶段已经确认的决定固化下来，过时的提问作废；2) 新增 3.4 视觉规范与 4.6 编辑器操作模型；3) 正文中已经解决的「待确认」标注已清除；4) 全文清除中点分隔符。
样板：prototype/style-sample.html（展示系统）、prototype/editor-sample.html（编辑系统）。两者共用同一套设计变量，确认观感后再进入实现。

一、总体架构
1.1 两套系统的物理分离
整个项目由两个独立的 Vue 应用组成，共享同一份仓库中的内容数据和模板 Schema，但构建产物不同。

展示系统（public site） 部署到 https://你的用户名.github.io/仓库名/，面向访客，只读。它读取构建时生成的 JSON/HTML 数据，渲染模板树，输出页面。编辑系统（editor） 部署到 https://你的用户名.github.io/仓库名/editor/（同一仓库的子路径），只有你一个人使用。它用细粒度访问令牌认证后，直接读写仓库中的内容目录，提交 commit 后触发展示系统的自动构建。

两套系统共享一个 /shared 目录，包含模板 Schema 定义、渲染组件和工具函数。展示系统用这些组件做静态渲染，编辑系统用它们做表单生成。

1.2 目录结构
text
wiki-repo/
├── content/                          # 内容数据（编辑器读写，展示系统只读）
│   ├── pages/                        # 页面 JSON，按命名空间分目录
│   │   ├── main/
│   │   │   ├── 首页.json
│   │   │   └── 关于.json
│   │   ├── templates/                # 模板定义页（Schema 来源）
│   │   │   ├── 信息框.json
│   │   │   └── 折叠框.json
│   │   └── categories/               # 分类定义页
│   │       └── 人物.json
│   ├── assets/                       # 图片等静态资源
│   │   └── example.png
│   └── site.json                     # 站点级配置（导航、侧边栏等）
├── shared/                           # 两套系统共享的代码
│   ├── schema/                       # 模板 Schema 定义
│   │   ├── infobox.ts
│   │   ├── collapsible.ts
│   │   ├── navbox.ts
│   │   ├── paragraph.ts
│   │   └── ...
│   ├── components/                   # 渲染组件（Vue SFC）
│   │   ├── InfoboxRenderer.vue
│   │   ├── CollapsibleRenderer.vue
│   │   ├── NavboxRenderer.vue
│   │   └── ...
│   ├── composables/                  # 共享逻辑
│   │   ├── useGitHub.ts              # GitHub API 封装
│   │   ├── useTemplateTree.ts        # 模板树遍历/校验
│   │   └── usePageData.ts            # 页面数据加载
│   └── types/                        # TypeScript 类型定义
│       └── content.ts
├── public-site/                      # 展示系统
│   ├── src/
│   │   ├── layouts/
│   │   │   └── WikiLayout.vue        # 主布局（Vector 风格）
│   │   ├── pages/
│   │   │   ├── PageView.vue          # 页面展示
│   │   │   ├── CategoryView.vue      # 分类页
│   │   │   └── RecentChanges.vue     # 最近更改
│   │   └── App.vue
│   ├── vite.config.ts
│   └── index.html
├── editor/                           # 编辑系统
│   ├── src/
│   │   ├── views/
│   │   │   ├── EditorLayout.vue      # 编辑器主布局
│   │   │   ├── PageList.vue          # 页面列表
│   │   │   └── PageEdit.vue          # 页面编辑
│   │   ├── components/
│   │   │   ├── TemplateTree.vue      # 左侧结构树
│   │   │   ├── TemplateForm.vue      # 中间表单
│   │   │   ├── PreviewPane.vue       # 右侧预览
│   │   │   ├── TemplatePicker.vue    # 模板选择器
│   │   │   └── FieldEditor.vue       # 字段编辑器（按类型分发）
│   │   ├── composables/
│   │   │   ├── useAuth.ts            # 细粒度令牌认证
│   │   │   └── useContentStore.ts    # 内容 CRUD
│   │   └── App.vue
│   ├── vite.config.ts
│   └── index.html
├── .github/workflows/
│   └── build.yml                     # 自动构建 + 部署
└── package.json

待确认 Q1：content/templates/（模板定义页 = Schema 来源）与 shared/schema/（TypeScript Schema）目前是同一个东西的两个位置，属于双事实源，必须二选一。详见第八章 Q1。
待确认 Q16：中文文件名与 URL 编码问题（首页.json → %E9%A6%96%E9%A1%B5），详见 Q16。

二、内容数据规范
2.1 页面 JSON 结构
每个页面是一个独立的 JSON 文件，对应一个模板树。顶层结构如下：

json
{
  "title": "页面标题",
  "namespace": "main",
  "categories": ["人物", "历史"],
  "blocks": [
    { "type": "Infobox", "params": { ... }, "children": [] },
    { "type": "Paragraph", "params": { "text": "..." } },
    { "type": "Collapsible", "params": { ... }, "children": [ ... ] }
  ],
  "raw": {
    "css": "",
    "js": ""
  }
}
blocks 是一个递归数组。每个 block 有 type（对应模板名）、params（参数键值对）、children（子 block 数组，可为空）。raw 字段用于“裸露修改接口”，后文详述。

2.2 模板 Schema 定义
每个模板类型需要一个 Schema，定义有哪些字段、字段类型、是否必填、是否可嵌套子块。Schema 用 TypeScript 定义，既是编辑器生成表单的依据，也是展示系统校验数据的依据。

typescript
// shared/schema/infobox.ts
export const InfoboxSchema: TemplateSchema = {
  name: 'Infobox',
  label: '信息框',
  icon: 'info',
  fields: [
    { key: 'name', label: '名称', type: 'text', required: true },
    { key: 'image', label: '图片', type: 'image' },
    { key: 'caption', label: '图片说明', type: 'text' },
    { key: 'rows', label: '信息行', type: 'template-list', 
      template: 'InfoboxRow' }
  ],
  allowChildren: false
};

export const InfoboxRowSchema: TemplateSchema = {
  name: 'InfoboxRow',
  label: '信息行',
  fields: [
    { key: 'label', label: '标签', type: 'text', required: true },
    { key: 'value', label: '值', type: 'richtext' }
  ],
  allowChildren: false
};
type 支持：text、richtext（带链接/加粗的富文本）、image、select、boolean、template-list（一组同类型子模板实例，对应 MediaWiki 中 {{Infobox}} 内部的多个 {{InfoboxRow}}）、block-list（自由嵌套任意模板）。

待确认 Q4：richtext 的存储格式未定义（受限 HTML 字符串 / 自研行内 AST / Markdown 子集 + [[链接]]），这一个决定同时约束编辑器实现、展示端渲染和旧 Wikitext 迁移的难度，详见第八章 Q4。

2.3 第一批核心模板
按优先级定义以下模板类型（共十三个，最后一个是 2026-02-14 追加的）：

模板名	用途	关键字段	可嵌套
Paragraph	段落文本	text（richtext）	否
Heading	章节标题	level（2-4）、text	否
List	列表	style（无序或有序）、items（每行一项）	否
Infobox	信息框	name、image、rows（InfoboxRow 列表）	否
Collapsible	折叠框	title、expanded	是（block-list）
Navbox	导航盒	title、links，另可给 groups（分组列表）	否
Sidebar	侧边栏	title、blocks（block-list）	是
Notice	提示框	type（info/warning/error）、text	否
Link	站内链接	target、text	否
Image	图片	src、caption、width、align	否
Table	表格	headers、rows（当前是紧凑文本，跨行跨列见 8.6）	否
Quote	引用	text、source	否
CodeBlock	代码块	language、code	否
说明：Heading 的层级只开放 2 到 4，页面标题由页面本身提供；Navbox 除 links 外还支持 groups，否则做不出多行分组的样子；Table 目前用「表头逗号分隔、数据行按竖线分列」的紧凑文本，跨行跨列的做法见 8.6。
三、对外展示系统
3.1 页面布局：复现 Vector 2022。界面不使用任何图标，禁止使用 emoji。
展示系统的布局复现 MediaWiki Vector 2022 皮肤的结构。整体是一个三栏布局：

顶栏（粘性）：左侧是站点 Logo 与名称，其下是站点副标题；中间是搜索框；右侧是“编辑本页”与“退出登录”。左栏：顶部是目录（由正文标题自动生成，粘性跟随），其下是导航（首页、最近更改、随机页面）与全部页面。主内容区：顶部是标签页行，左侧只有“页面”，右侧依次是 阅读 / 编辑 / 查看历史（查看历史带外链标记，直接跳 GitHub 上该文件的提交历史）；其下是页面标题与内容正文（块树渲染结果），底部是分类条、最后编辑时间与页脚。右栏：站点级工具（链入页面、相关更改、页面信息、可打印版、引用本页、查看历史）、分类与语言。页面级的信息框与侧边栏块不放在右栏，而是作为正文里的右侧浮动列，见 3.4 与 8.1。

待确认 Q5：搜索框的实现方式未定。皮肤、讨论页、工具项取舍均已在样板阶段定案（见第八章 8.1），不再讨论。

3.2 渲染流程
展示系统在构建时读取 /content/pages/ 下所有 JSON 文件，对每个页面执行递归渲染。递归函数接收一个 block，根据 type 查找对应的渲染组件，将 params 作为 props 传入，如果有 children 则递归渲染后作为 slot 传入。

typescript
// 伪代码：递归渲染
function renderBlock(block, components) {
  const Comp = components[block.type]
  if (!Comp) return <UnknownBlock type={block.type} />
  const childNodes = block.children?.map(c => renderBlock(c, components)) 
  return <Comp {...block.params}>{childNodes}</Comp>
}
每个渲染组件是标准的 Vue SFC，负责将参数渲染为 HTML。例如 CollapsibleRenderer.vue 内部使用 <details> 和 <summary> 实现折叠功能，expanded 参数控制是否默认展开。

3.3 页面生成与静态输出
public-site 是一个标准的 Vue 3 + Vue Router 应用。构建时通过 Vite 的 SSR 能力，对每条路由（即每个页面 JSON）预渲染为静态 HTML。输出目录（如 dist/）直接部署到 GitHub Pages。

对于分类页、最近更改等动态列表页面，构建脚本额外读取 content/pages/ 下所有页面的元数据（title、categories、git 最后修改时间），生成索引 JSON，供这些页面在客户端渲染。

3.4 视觉规范（已确认，以 prototype/style-sample.html 为准）
颜色：一套低饱和暖中性灰承担全部结构分层（正文 #24272a、次要 #5c6268、最弱 #7d838a、描边 #e6e7e6、浅底 #fafaf9 与 #f4f5f4），只保留一个亮黄绿强调色 #c8ef4a，且只用于高亮：激活标签的指示条、搜索框聚焦、导航链接悬停浅底、信息提示条的左侧细条与图标。界面不再引入第二种色相。
链接：正文链接用深橄榄青柠 #5f7d10（对白底 4.7:1，保证长文可读），悬停转 #41600a 并配亮黄绿浅底；已访问 #6d7350；未创建条目 #a35a52。
形状：所有盒体 1px 极浅描边加 5px 圆角，不使用深色描边与阴影；表格只用横线与表头底色，去掉全部竖线；代码块语法着色降为灰阶。
文字：全部无衬线，正文 15px、行高 1.7；章节标题靠字号与一条浅色横线分层。
右侧浮动列：信息框与侧边栏模板宽 21em，图在上、字段表在下，两块堆叠共用同一条右侧列。让位规则见 8.1：凡是有边框、底色或自带右侧浮动标记的块，以及全部章节标题，一律 clear:right，只有纯文本段落与列表环绕。窗口窄于 760 像素时右侧列落到正文上方并恢复整宽。
图标与图形：展示系统不使用任何图标，所有图形（Logo、搜索放大镜、外链箭头、图片占位）一律用 CSS 或内联 SVG 绘制。禁用 emoji 与中点分隔符。

四、对内编辑系统
4.1 编辑器整体布局
编辑器是一个全屏的 Web 应用，只在你登录后可用。布局分为四个区域（按已确认的交互模型，见 4.6：左栏改为常驻的内容块篮子，中间是页面画布，右栏是按 Schema 生成的属性面板，预览改为画布的视图切换）：

顶部工具栏：页面选择器（下拉搜索或输入路径）、保存按钮、预览开关、模板管理入口、退出登录。左侧结构树：显示当前页面的 block 树。每个节点显示模板图标和 label，可拖拽排序、删除、添加子节点。点击节点后中间表单切换到该节点的编辑。中间表单区：根据当前选中 block 的 Schema 自动生成表单。表单字段按类型渲染：文本输入用 <input>，富文本用轻量 contenteditable，图片上传调用 GitHub API，template-list 显示子模板实例列表并可增删，block-list 显示嵌套 block 树。右侧预览区：实时渲染当前 block 树的最终效果，使用与展示系统完全相同的渲染组件。

4.2 模板选择与插入
点击“添加子模板”或“插入模板”时，弹出模板选择器。选择器按分类展示所有已注册的模板类型，选中后根据该模板的 Schema 初始化一个空的 params 对象，插入到当前 block 的 children 中。

4.3 GitHub 认证：细粒度访问令牌（2026-02-14 更正原 Device Flow 方案）
原方案用 Device Flow，实现在浏览器里直接报 Failed to fetch。实测三条端点的跨域响应头，结论是这条路在纯静态站里走不通：

github.com/login/device/code         不返回 Access-Control-Allow-Origin，并带 default-src 'none' 的 CSP
github.com/login/oauth/access_token  同样不返回，CSP 一致
api.github.com                       预检 204，Access-Control-Allow-Origin 为星号，允许 Authorization 头与 GET、POST、PATCH、PUT、DELETE

也就是说 Device Flow 只能由服务端或中转服务发起，与「零服务器」的前提冲突。因此改用细粒度访问令牌：
使用者在 GitHub 上生成一个只授权本仓库、只给 Contents 读写权限的令牌，粘进编辑器的设置界面，校验身份后存在浏览器 localStorage 里，之后所有 API 调用都带它。
换过来之后安全性反而更好：细粒度令牌可以收窄到一个仓库，而 Device Flow 能拿到的 public_repo 令牌可以写使用者名下所有公开仓库。
令牌随时可在 GitHub 上撤销；编辑器里的「连接测试」会明确报告有没有写权限。
原计划里让你创建的那个 OAuth App 不再需要，留着或删掉都可以。

4.4 页面 CRUD
新建页面：在顶部输入路径（如 main/新页面），编辑器检查该路径是否已存在，不存在则创建空 JSON 文件并 commit。编辑页面：加载 JSON → 反序列化为 block 树 → 渲染结构树和表单 → 修改后点击保存 → 序列化回 JSON → 通过 GitHub Contents API PUT 到 content/pages/路径.json。删除页面：调用 GitHub Contents API DELETE，commit message 记录删除操作。重命名/移动：PUT 新路径 + DELETE 旧路径。

4.5 图片上传
编辑器中的图片字段提供一个上传按钮。选择本地文件后，将文件转为 base64，通过 GitHub Contents API PUT 到 content/assets/ 目录。上传完成后，字段值自动填充为相对于站点的路径（如 /assets/文件名）。GitHub Contents API 每次上传创建一个 commit，符合“内容即 Git 历史”的设计。

4.6 编辑器操作模型：篮子与拖拽（已确认，以 prototype/editor-sample.html 为准）
左栏是常驻的内容块篮子，按 文本 / 结构 / 媒体 / 数据 / 高级 分组，每块显示图标、中文名与 type，顶部可筛选。中间是页面画布，空页面显示提示区；从篮子里拖块进画布即成页，拖动时显示一条亮黄绿插入线，落在某个块的上半或下半决定插在它前面还是后面；也可以直接点篮子里的块追加到页面末尾。
已放入的块可以再次拖动排序，也有 上移 / 下移 / 删除。把块拖进折叠框或侧边栏内部的虚线区即成为子块，从而形成块树；把块拖进自己的子孙里会被拒绝。
点中任意块，右栏按该块类型对应的 Schema 自动生成表单：文本、多行文本、下拉、开关、图片（带上传按钮）、行列表（例如信息框的信息行可增删）。表单底部是默认折叠的「高级（裸露修改）」，内含该块专属的 _raw.css 与 _raw.js。
画布可在「结构视图」与「成稿预览」之间切换，预览复用展示系统的渲染组件与样式，做到所见即所得。顶部工具栏提供页面选择与新建、保存到 GitHub、退出登录。

五、裸露修改接口
你希望“所有内容都可以有裸露的修改接口，比如给某个页面加入特效”。这个需求通过三层裸露实现，层级递增，互不干扰。

5.1 第一层：页面级 raw 字段
每个页面 JSON 顶层保留 raw 字段，包含 css 和 js 两个字符串。展示系统在渲染该页面时，将 raw.css 注入 <style> 标签，将 raw.js 在页面组件挂载后执行。这样你可以对单个页面添加特效、覆盖样式、注入交互逻辑，而不影响其他页面。编辑器提供两个代码编辑器（简单的 <textarea> 即可）来编辑这两个字段。

5.2 第二层：Block 级 raw 字段
每个 block 的 params 中隐含支持一个 _raw 字段，内容同样是 { css, js }。渲染组件在执行自身逻辑之前，先注入 block 级的 CSS，在挂载后执行 block 级的 JS。这样你可以对单个信息框、单个折叠框做视觉或行为上的定制。

5.3 第三层：模板级的 “HTML 逃逸舱”
对于极端情况（需要完全自定义的 HTML 结构），定义一个 RawHTML 模板类型。它的 params 只有一个字段 html，渲染时直接 v-html 输出。编辑器为它提供一个代码编辑区，并在预览区实时显示。这个模板在 Schema 中标记为 dangerous: true，编辑器中以特殊颜色提示。

5.4 实现方式
展示系统的每个渲染组件都通过一个高阶函数包装，统一处理 _raw 的注入：

typescript
function withRaw(Component, schema) {
  return {
    setup(props, { slots }) {
      onMounted(() => {
        const raw = props._raw
        if (raw?.css) injectCSS(raw.css, Component.name)
        if (raw?.js) executeJS(raw.js, Component.name)
      })
      return () => h(Component, props, slots)
    }
  }
}
编辑器在表单底部始终显示一个“高级（裸露修改）”折叠区域，内含 _raw.css 和 _raw.js 的文本框。默认折叠，不干扰日常编辑。

六、部署与工作流
6.1 GitHub Actions 配置
在仓库根目录的 .github/workflows/build.yml 中，定义一个 workflow：触发条件为 push 到 main 分支且路径匹配 content/**。步骤依次为——checkout 仓库、安装 Node.js 20+、安装依赖、运行展示系统构建命令（npm run build:public）、将 public-site/dist 部署到 GitHub Pages。

编辑系统本身也是静态文件，可以在同一个 workflow 中构建后输出到 public-site/dist/editor/ 路径，或者单独部署到一个子路径。推荐做法是：编辑系统只在本地 npm run dev 运行，不公开部署，减少安全暴露面。如果你希望随时随地打开浏览器就能编辑，则把它构建到 /editor/ 子路径一并部署。

待确认 Q3：这里与 3.1 的「编辑本页」链接相互矛盾——若编辑器只在本地 dev 运行，该链接在线上就是死链；若部署到 /editor/，编辑器需要使用者自己填访问令牌（见 4.3）。二者必须二选一。

6.2 日常使用流程
打开编辑器（本地或在线）→ 登录 GitHub → 选择或新建页面 → 在结构树中添加/编辑模板 block → 用表单填写参数（或用裸露接口写自定义 CSS/JS）→ 右侧实时预览 → 点击保存 → 编辑器 commit 到 GitHub → Actions 自动构建 → 展示系统更新。

6.3 旧 Wikitext 迁移
编写一个一次性脚本，解析旧 Wiki 导出的 Wikitext，将 {{模板名|参数}} 转换为对应的 block JSON，将 [[链接]] 转换为 Link block，将普通段落转换为 Paragraph block。复杂解析器函数（#if、#switch）无法自动转换，需要在迁移后手动用 JS 或模板逻辑重新实现。迁移脚本放在 scripts/migrate.ts 中，不参与日常构建。

待确认 Q9：旧 Wiki 的平台、页面数量、模板复杂度、能否导出完整 dump 都未知，这决定迁移脚本是「两三天」还是「两周以上」。建议先用 5–10 页样例数据打通全链路，迁移放到最后一个阶段，详见第八章 Q9。

七、方案可行性评估
几万字内容：按页面拆分为独立 JSON 文件，每个文件几 KB 到几十 KB。Git 仓库总量几 MB。构建时遍历所有 JSON 渲染，Node.js 脚本几秒到几十秒完成。编辑时按需加载单个页面。扩展性充足。

零服务器：编辑系统和展示系统都是静态 SPA，GitHub Pages 托管，GitHub API 读写数据，细粒度令牌认证。无数据库、无后端进程、无月费。只要 GitHub 存在，站点就存在。

模板驱动的模块化：所有内容都是模板 block 的树，没有游离的 Markdown 文本。编辑即插入和配置模板，完全复现 MediaWiki 的“编辑即填模板”体验。

裸露修改接口：页面级、Block 级、模板级三层裸露，覆盖从“加一点 CSS 特效”到“完全自定义 HTML”的全部需求，且不破坏模板体系的结构。

八、已定项与遗留问题
8.1 已定（样板已确认，不再讨论；原先对应的提问作废）
皮肤：只做 Vector 2022。2010 经典不做，也不做皮肤切换开关。
讨论页：不做。标签行只保留 页面，以及 阅读 / 编辑 / 查看历史。
配色：一套低饱和暖中性灰（#24272a 至 #fafaf9），加一个亮黄绿强调色 #c8ef4a。界面不再出现第二种色相。
链接：黄绿色。正文用深橄榄青柠 #5f7d10（对白底 4.7:1，保证长文可读），悬停配亮黄绿浅底，红链 #a35a52 标记尚未创建的条目。
圆角：全部盒体、输入框、按钮、面板统一 5px。
硬边：盒体一律 1px 极浅描边（#e6e7e6）加底色分层；表格只用横线，去掉全部竖线；代码块语法着色降为灰阶。
字体：全部无衬线，正文 15px。
信息框与侧边栏模板：位于右侧浮动列，宽 21em，图在上、字段表在下；两块堆叠共用同一条右侧列；窗口窄于 760 像素时落到正文上方并恢复整宽。
让位规则：凡是有边框、底色或自带右侧浮动标记的块（折叠框、提示框、引用、代码块、图片、表格、导航盒、分类条、页脚）以及全部章节标题，一律 clear:right；只有纯文本段落与列表环绕。这样边框、底色与 [编辑] 小标永远不会横穿右侧列或被压住。
图片：默认随流居中带图注；align 参数支持左浮动与右浮动，文字跨行环绕。
图标：编辑器使用内联 SVG 图标（不引外部图标库、颜色跟随文字）；展示系统一个图标都不加。
合规：禁用 emoji；禁用中点分隔符；禁用外部字体与图标库；所有图形用 CSS 或内联 SVG 绘制。
工具项：保留 链入页面、相关更改、页面信息、可打印版、引用本页、最近更改、随机页面（全部构建期生成）；删除 特殊页面与固定链接；查看历史不在站内做历史页与 diff 视图，标签行与工具里的入口直接跳 GitHub 上该文件的提交历史。
编辑器交互模型：左栏是内容块篮子，拖进中间空页面即可成页；已放入的块可拖动排序、可拖进容器块嵌套；点块在右栏按 Schema 生成表单；结构视图与成稿预览可切换。
认证：细粒度访问令牌，不用 Device Flow（原方案受跨域限制不可行，见 4.3）。
列表模板：追加了第十三个模板 List（无序或有序），因为 plan.md 2.3 原来的十二个模板里没有列表，圆点列表做不出来。
表格跨行跨列：决定改数据模型加做网格界面，不采用「文本里加符号表示合并」的做法，具体见 8.6。
样板位置：prototype/style-sample.html 是展示系统，prototype/editor-sample.html 是编辑系统，两者共用同一套设计变量。

8.2 已确认的实现决定（第八章原提问的答复，已并入执行约束）
Schema 的唯一事实源：全部是 TypeScript 代码，位于 shared/schema/；content/templates/ 只作为模板说明页与示例，不参与渲染分发。
richtext 存储格式：Markdown 子集加双方括号站内链接（三撇号粗体、双方括号内链）。编辑器第一版用文本框加实时预览，不做富文本工具栏。同一套解析器供展示渲染、编辑器预览与旧 wikitext 迁移共用。
编辑器部署：公开部署到 /repo/editor/，标签行的「编辑本页」保持为活链接。
搜索：构建期生成静态索引，客户端查询（中文按 n-gram 切分），不依赖运行时 API。
裸露接口隔离：CSS 做作用域包裹（每个块生成唯一 class 前缀），块级 JS 直接执行但约定挂在块根元素上，RawHTML 用 v-html。
图片：不压缩，上传原图。因此写入通道改用 Git Data API（blobs 加 tree 加 commit），不用 Contents API 的 base64 通道；需在编辑器里对超大文件给出提示（GitHub Pages 单文件上限 100MB）。
包管理：npm workspaces，三个包 shared / public-site / editor。
编辑器预览：注入块级 CSS，但不执行块级 JS。
渲染方式：构建期预渲染加客户端 hydration。
站点配置：site.json 承载站点名、副标题、Logo、导航、工具、页脚链接与默认皮肤，链接全部配置化。
路径与 URL：文件路径用 ASCII slug，title 字段存中文，URL 用 slug。
认证：细粒度访问令牌。旧 Wiki 只有 5 页且你有源代码，迁移放最后。

8.3 仅剩的未决项
Q10 部署坐标（GitHub 用户名、仓库名、用户页还是项目页、有无自定义域名）。
你的答复是「不急，先解决核心最后再解决」。处理方式：与部署坐标相关的一切一律走配置，不写死；开发期用占位值（owner 留空、repo 留空、base 为 /），到 M6 收尾时你在设置界面里填真实值。

8.4 硬性约定：凭据与连接一律由你本人填写
凡是需要密钥、令牌、Client ID、用户名、仓库名、域名、接口地址的地方，一律不要写死在代码里，也不要由我代填。实现方式统一为：留出设置界面或配置文件模板，字段留空并标注用途与格式；未经填写的字段必须让对应功能明确失效并给出提示，不允许用一个默认真值悄悄跑起来。

8.5 里程碑
M0 视觉与交互样板（已完成）：prototype/style-sample.html、prototype/editor-sample.html。
M1 shared Schema 与核心渲染组件、public-site 骨架、视觉落地。
M2 editor：内容块篮子与拖拽、Schema 表单、结构视图与成稿预览。
M3 GitHub 接入：设置界面、令牌认证、页面 CRUD、原图上传、提交。
M3.5 表格网格编辑器：表格数据模型改成单元格网格（含 rowspan 与 colspan），编辑器加 table 字段类型与网格界面。详见 steps.md。
M4 索引页：搜索、最近更改、随机页面、链入页面、页面信息、可打印版、引用本页。
M5 三层裸露修改接口与 RawHTML。
M6 旧 Wikitext 迁移（5 页）、真实部署坐标与 Client ID 收尾。
每一步的拆解、产出与验收标准见 steps.md。

8.6 表格跨行跨列的决定
要支持跨行跨列，有两种做法：一是在现在的紧凑文本里加符号表示合并（例如用 ^ 表示向上合并），二是把表格改成单元格网格再加一个网格界面。
选第二种。理由：第一种虽然实现便宜，但作者很难维护，写错了也看不出来；而且一旦用符号编码，将来想改成网格就要再迁一次数据。第二种的代价是网格编辑器，它是整份计划里最贵的一块界面，所以从 M3 摘出来单列成 M3.5，排在 GitHub 接入之后。

