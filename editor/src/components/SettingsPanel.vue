<script setup lang="ts">
/**
 * 设置面板。
 *
 * 按 plan.md 8.4：这里只有空字段与说明，没有任何预填的凭据。
 * 仓库坐标与访问令牌都由使用者自己填，只存在本机浏览器里。
 */

import { computed, ref, watch } from 'vue'

import {
  DEFAULT_SETTINGS,
  missingForRepo,
  repoConfigured,
  resetSettings,
  saveSettings,
  settings,
  type EditorSettings
} from '../state/settings.ts'
import { useAuth } from '../state/auth.ts'
import { getRepoInfo } from '../state/github.ts'
import Icon from './Icon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (event: 'close'): void }>()

const auth = useAuth()

const draft = ref<EditorSettings>({ ...settings.value })
const token = ref('')
const saved = ref(false)
const testing = ref(false)
const testResult = ref('')
const testOk = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    draft.value = { ...settings.value }
    token.value = ''
    saved.value = false
    testResult.value = ''
  }
)

const repoMissing = computed(() => missingForRepo())

/** 生成细粒度令牌的页面地址。 */
const tokenPage = 'https://github.com/settings/personal-access-tokens/new'

function onSave(): void {
  saveSettings(draft.value)
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 2400)
}

function onReset(): void {
  resetSettings()
  draft.value = { ...DEFAULT_SETTINGS }
  testResult.value = ''
}

async function onSignIn(): Promise<void> {
  const ok = await auth.signInWithToken(token.value)
  if (ok) {
    token.value = ''
    testResult.value = ''
  }
}

/** 连接测试：能读到仓库就说明坐标与令牌都对。 */
async function onTest(): Promise<void> {
  const current = auth.auth.value?.token ?? ''
  if (current === '') {
    testOk.value = false
    testResult.value = '先登录再测试。'
    return
  }
  testing.value = true
  testResult.value = ''
  try {
    const info = await getRepoInfo(current, {
      owner: draft.value.owner.trim(),
      repo: draft.value.repo.trim(),
      branch: draft.value.branch.trim()
    })
    const pushable = info.canPush
    testOk.value = pushable
    testResult.value = pushable
      ? `连接成功。默认分支 ${info.defaultBranch}，${info.isPrivate ? '私有仓库' : '公开仓库'}，有写权限。`
      : `能读到仓库，但这个令牌没有写权限。请检查 Contents 权限是不是设成了 Read and write。`
  } catch (failure) {
    testOk.value = false
    testResult.value = (failure as Error).message
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div v-if="open" class="modal-mask" @click.self="emit('close')">
    <section class="modal">
      <header class="modal-head">
        <b><Icon name="sliders" />编辑器设置</b>
        <button type="button" class="btn" @click="emit('close')"><Icon name="clear" :size="14" />关闭</button>
      </header>

      <div class="modal-body">
        <p class="ins-note">
          下面的值只保存在你这台机器的浏览器里，不会进代码、不会进构建产物。
          没有填的字段对应功能会直接失效，不会有默认真值替你跑起来。
        </p>

        <h4>仓库坐标</h4>
        <p class="ins-note">
          这四个字段决定编辑器读写哪个仓库的哪个目录。
          <template v-if="repoMissing.length > 0">还缺：{{ repoMissing.join('、') }}。</template>
        </p>
        <div class="field-pair">
          <label class="field">
            <span class="flabel">仓库所有者</span>
            <input v-model="draft.owner" type="text" placeholder="GitHub 用户名或组织名" spellcheck="false">
          </label>
          <label class="field">
            <span class="flabel">仓库名</span>
            <input v-model="draft.repo" type="text" placeholder="例如 OrganxyWiki" spellcheck="false">
          </label>
        </div>
        <div class="field-pair">
          <label class="field">
            <span class="flabel">分支</span>
            <input v-model="draft.branch" type="text" spellcheck="false">
          </label>
          <label class="field">
            <span class="flabel">资源 URL 前缀</span>
            <input v-model="draft.mediaPath" type="text" spellcheck="false">
          </label>
        </div>
        <div class="field-pair">
          <label class="field">
            <span class="flabel">内容目录</span>
            <input v-model="draft.contentRoot" type="text" spellcheck="false">
            <span class="fhint">页面 JSON 所在目录，相对仓库根。</span>
          </label>
          <label class="field">
            <span class="flabel">资源目录</span>
            <input v-model="draft.assetsRoot" type="text" spellcheck="false">
            <span class="fhint">图片等静态资源所在目录。</span>
          </label>
        </div>

        <h4>访问令牌</h4>
        <p class="ins-note">
          用一个细粒度访问令牌登录。它可以把权限收窄到「只这一个仓库、只给内容读写」，
          比 OAuth 授权更安全，也用不到客户端密钥。令牌只存在本机，随时可以在 GitHub 上撤销。
        </p>
        <ol class="steps">
          <li>打开 <a :href="tokenPage" target="_blank" rel="noopener noreferrer" class="ext">新建细粒度令牌</a> 页面。</li>
          <li>Repository access 选 Only select repositories，只勾上 <code>{{ draft.owner || '你的用户名' }}/{{ draft.repo || '仓库名' }}</code>。</li>
          <li>Permissions 里展开 Repository permissions，把 <b>Contents</b> 设成 <b>Read and write</b>。</li>
          <li>Generate token，复制生成的令牌（形如 github_pat_ 开头）。</li>
        </ol>

        <div v-if="auth.signedIn.value" class="login-row">
          <span>已登录为 <b>{{ auth.auth.value?.login }}</b></span>
          <button type="button" class="btn" @click="auth.signOut()"><Icon name="logout" :size="14" :lead="true" />退出登录</button>
        </div>

        <template v-else>
          <label class="field">
            <span class="flabel">访问令牌</span>
            <div class="token-row">
              <input
                v-model="token"
                type="password"
                placeholder="粘贴 github_pat_ 开头的令牌"
                spellcheck="false"
                autocomplete="off"
                @keyup.enter="onSignIn()"
              >
              <button type="button" class="btn" :disabled="auth.busy.value" @click="onSignIn()">
                <Icon name="upload" :size="14" :lead="true" />{{ auth.busy.value ? '校验中' : '登录' }}
              </button>
            </div>
          </label>
          <p v-if="auth.error.value !== ''" class="error-text">{{ auth.error.value }}</p>
        </template>

        <h4>连接测试</h4>
        <div class="login-row">
          <button type="button" class="btn" :disabled="testing || !repoConfigured || !auth.signedIn.value" @click="onTest()">
            <Icon name="reload" :size="14" :lead="true" />测试能否读写
          </button>
          <span v-if="testResult !== ''" :class="testOk ? 'ok-text' : 'error-text'">{{ testResult }}</span>
        </div>
      </div>

      <footer class="modal-foot">
        <button type="button" class="btn" @click="onReset()">恢复默认</button>
        <span class="spacer" />
        <span v-if="saved" class="ok-text">已保存到本机。</span>
        <button type="button" class="btn btn-primary" @click="onSave()">保存设置</button>
      </footer>
    </section>
  </div>
</template>
