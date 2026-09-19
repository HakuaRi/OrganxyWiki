/**
 * 站点级配置，对应 content/site.json。
 *
 * 约定：导航、工具、页脚里的链接全部来自这里，不允许写死在组件里。
 * 与部署坐标相关的字段（base）留空时按根路径处理，未填写的功能必须明确失效并提示。
 */

/** 一条导航链接。 */
export interface SiteLink {
  label: string
  /** 站内路径（以 / 开头）或完整外链。 */
  href: string
}

/** 仓库坐标。留空表示尚未配置，依赖它的功能必须自己失效。 */
export interface RepoConfig {
  owner: string
  repo: string
  branch: string
}

/** 站点配置。 */
export interface SiteConfig {
  /** 站点名，显示在顶栏与页脚。 */
  name: string
  /** 站点副标题。 */
  tagline: string
  /** Logo 图片路径，留空则用文字。 */
  logo: string
  /** 部署基础路径，例如 / 或 /wiki/。留空视为 /。 */
  base: string
  /**
   * 编辑系统所在的路径，例如 /editor/。留空表示未部署编辑器，
   * 此时页面上的「编辑」入口一律不渲染，而不是指向一个死链接。
   */
  editorBase: string
  /**
   * 仓库坐标，只用于拼「查看历史」这类跳 GitHub 的链接。
   * 三个字段任一为空即视为未配置，对应的入口不渲染（见 plan.md 8.4）。
   */
  repository: RepoConfig
  /** 左栏导航。 */
  navigation: SiteLink[]
  /** 右栏工具。 */
  tools: SiteLink[]
  /** 页脚链接。 */
  footer: SiteLink[]
  /** 页脚版权与许可说明。 */
  license: string
  /** 默认皮肤标识。当前只实现 vector-2022。 */
  skin: 'vector-2022'
}
