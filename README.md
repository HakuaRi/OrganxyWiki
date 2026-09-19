# OrganxyWiki

模板驱动的内容系统。展示系统只读、构建期预渲染为静态站；编辑系统是内容块篮子加拖拽的 SPA，通过 GitHub API 读写内容。无后端、无数据库。

## 文档

- `plan.md`：完整方案与已定项。开工前先读第八章。
- `steps.md`：分步实施计划与进度看板。每完成一步就在那里勾选。
- `prototype/style-sample.html`：展示系统的视觉样板，样式判断以它为准。
- `prototype/editor-sample.html`：编辑系统的交互样板。

## 环境要求

**Node 22.18 以上。** 构建脚本与单元测试是 TypeScript 源文件，靠 Node 原生的类型剥离直接运行，这个能力从 Node 22.18 起才默认开启。仓库里的 `.nvmrc` 写的是 24。

版本不够时 `npm run check` 会先打印一段说明再退出，不会抛一句看不懂的 `ERR_UNKNOWN_FILE_EXTENSION`。GitHub Actions 里已经把版本固定为 24。

```bash
nvm install 24 && nvm use 24     # 或 fnm install 24 && fnm use 24
```

## 开发

```bash
npm install
npm run check        # 类型检查
npm run test         # 单元测试
npm run dev:public   # 展示系统
npm run dev:editor   # 编辑系统
npm run build:dist   # 构建两个系统并组装成可部署目录
```

本地地址带站点前缀（前缀来自 `content/site.json` 的 base），Vite 会把完整地址打印出来：

- 展示系统 `http://localhost:5173/OrganxyWiki/`
- 编辑系统 `http://localhost:5173/OrganxyWiki/editor/`

目录说明：

- `shared/`：两套系统共用的类型、模板 Schema、富文本解析器、渲染组件与样式。
- `public-site/`：展示系统，构建期预渲染。
- `editor/`：编辑系统。
- `content/`：内容数据。页面是块树 JSON，路径用 ASCII slug，标题存中文。
- `scripts/`：构建期索引、预渲染与产物组装。

## 第一次使用编辑器要填的东西

凡是密钥、令牌、仓库名、域名等，一律不写死在代码里。它们在编辑器的设置界面里由使用者自己填写，只保存在本地浏览器，不进仓库、不进构建产物。未填写的项会让对应功能明确失效并给出提示。

### 仓库坐标

在编辑器右上角点「设置」，按这张表填：

| 字段 | 填什么 |
| --- | --- |
| 仓库所有者 | `HakuaRi` |
| 仓库名 | `OrganxyWiki` |
| 分支 | `main` |
| 内容目录 | `content/pages` |
| 资源目录 | `content/assets` |
| 资源 URL 前缀 | `/media` |

### 访问令牌

认证用的是**细粒度访问令牌**，不需要 OAuth App，也不需要任何客户端密钥。

为什么不用 GitHub 的 Device Flow：它的两个端点（`github.com/login/device/code` 与 `/login/oauth/access_token`）都不返回跨域响应头，还带着 `default-src 'none'` 的内容安全策略，浏览器直连只会得到一句 Failed to fetch。Device Flow 必须由服务端或中转服务发起，与「零服务器」的前提冲突。而 `api.github.com` 的跨域支持是完整的。

生成步骤：

1. 打开 `https://github.com/settings/personal-access-tokens/new`。
2. Repository access 选 **Only select repositories**，只勾上 `OrganxyWiki`。
3. Permissions 里展开 Repository permissions，把 **Contents** 设为 **Read and write**。
4. Generate token，复制生成的令牌（形如 `github_pat_` 开头）。
5. 粘进编辑器设置里的「访问令牌」，点登录。

登录后点「测试能否读写」确认权限对了。令牌只存在本机浏览器，随时可以在 GitHub 上撤销；撤销之后编辑器会明确提示令牌失效，并回到未登录状态。

## 发布

1. 仓库 Settings 里的 Pages，Source 选 **GitHub Actions**。
2. 推到 `main`，`.github/workflows/build.yml` 会自动跑类型检查、单元测试、构建与部署。
3. 站点在 `https://hakuari.github.io/OrganxyWiki/`，编辑器在 `https://hakuari.github.io/OrganxyWiki/editor/`。

地址里的 `/OrganxyWiki/` 来自 `content/site.json` 的 `base` 与 `editorBase`。以后换成自定义域名，或者改成用户页仓库，只改这两个字段即可，其余代码不用动。

## 约定

- 禁用 emoji、禁用中点分隔符、禁用外部字体与图标库。
- 展示系统不使用任何图标；编辑器允许内联 SVG 图标。
- 所有图形一律用 CSS 或内联 SVG 绘制。
