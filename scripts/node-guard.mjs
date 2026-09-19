/**
 * Node 版本闸门。
 *
 * 构建脚本与单元测试是 TypeScript 源文件，靠 Node 原生的类型剥离直接运行，
 * 这需要 Node 22.18 以上（该版本起默认开启类型剥离；再往前要加实验性开关，
 * 而 Node 20 完全没有这个能力）。
 *
 * 低于要求时 Node 只会抛一句 ERR_UNKNOWN_FILE_EXTENSION，从报错里看不出原因，
 * 所以先在这里拦一道，把话说清楚。
 *
 * 这个文件本身是 .mjs，不依赖类型剥离，因此在任何版本上都能执行。
 */

const [major, minor] = process.versions.node
  .split('.')
  .map((part) => Number.parseInt(part, 10))

const tooOld = major < 22 || (major === 22 && minor < 18)

if (tooOld) {
  console.error(
    [
      '',
      `这个项目需要 Node 22.18 以上，当前是 ${process.versions.node}。`,
      '原因：构建脚本与测试是 TypeScript 源文件，靠 Node 原生类型剥离直接运行，',
      '      这个能力在 Node 22.18 起才默认开启。',
      '',
      '切到新版本即可，例如：',
      '  nvm install 24 && nvm use 24',
      '  fnm install 24 && fnm use 24',
      '',
      'GitHub Actions 里已经把 node-version 固定为 24，不会遇到这个问题。',
      ''
    ].join('\n')
  )
  process.exit(1)
}
