<template>
  <div class="vite-bg">
    <header class="vite-header">
      <img src="./assets/imgs/logo.png" alt="Vite Logo" class="vite-logo" />
      <nav class="vite-nav">
        <!-- <a href="#" class="vite-link">指引</a>
        <a href="#" class="vite-link">配置</a>
        <a href="#" class="vite-link">插件</a>
        <a href="#" class="vite-link">团队成员</a>
        <a href="#" class="vite-link">博客</a> -->
      </nav>
    </header>
    <main class="vite-main">
      <h1 class="vite-title">UworkPlus官网</h1>
      <h2 class="vite-subtitle">
        — 个人工作台
        <br />
        高效管理你工作的一切内容
      </h2>
      <div class="vite-actions">
        <section class="download-panel">
          <h2 class="download-panel-title">下载 UworkPlus</h2>

          <div class="download-os-tabs">
            <button
              type="button"
              class="download-os-tab"
              :class="{ active: downloadArch === 'arm64' }"
              @click="downloadArch = 'arm64'"
            >
              <span class="download-os-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                  />
                </svg>
              </span>
              <span>Apple 芯片</span>
            </button>
            <button
              type="button"
              class="download-os-tab"
              :class="{ active: downloadArch === 'x64' }"
              @click="downloadArch = 'x64'"
            >
              <span class="download-os-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M4 5h16a1 1 0 0 1 1 1v3H3V6a1 1 0 0 1 1-1zm-1 5h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9zm4 2v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"
                  />
                </svg>
              </span>
              <span>Intel 芯片</span>
            </button>
          </div>

          <div class="download-command-box">
            <code class="download-command-text">{{ installCommand }}</code>
            <button
              type="button"
              class="download-copy-btn"
              :class="{ copied: installCommandCopied }"
              :aria-label="installCommandCopied ? '已复制' : '复制命令'"
              @click="copyInstallCommand"
            >
              <svg v-if="!installCommandCopied" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="1.8" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-width="1.8" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <p class="download-command-hint">在终端中粘贴并执行</p>

          <div class="download-divider">或</div>

          <button type="button" class="download-primary-btn" @click="downloadApp">
            {{ downloadBtnLabel }}
          </button>
          <p class="download-note">{{ downloadNote }}</p>

          <div v-if="downloadArch === 'arm64'" class="download-post-install">
            <p class="download-post-install-title">安装后执行以下命令解除隔离：</p>
            <div class="download-command-box download-command-box--small">
              <code class="download-command-text">{{ quarantineCommand }}</code>
              <button
                type="button"
                class="download-copy-btn"
                :class="{ copied: quarantineCommandCopied }"
                :aria-label="quarantineCommandCopied ? '已复制' : '复制命令'"
                @click="copyQuarantineCommand"
              >
                <svg v-if="!quarantineCommandCopied" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="1.8" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-width="1.8" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>
      <div class="vite-features">
        <div class="vite-feature">
          <h3>🏠 首页</h3>
          <p>展示项目概览、热门资讯、数据统计等核心信息</p>
        </div>
        <div class="vite-feature">
          <h3>📝 文档管理</h3>
          <p>创建、编辑、管理各种文档和笔记</p>
        </div>
        <div class="vite-feature">
          <h3>🛠️ 工具集合</h3>
          <p>提供 JSON 查看器、代码片段管理、网站导航等实用工具</p>
        </div>
        <div class="vite-feature">
          <h3>⚡ 脚本执行</h3>
          <p>管理和执行各种 Shell 脚本、命令和工具</p>
        </div>
        <div class="vite-feature">
          <h3>🚀 脚手架</h3>
          <p>快速创建和初始化各种项目模板</p>
        </div>
        <div class="vite-feature">
          <h3>👤 用户中心</h3>
          <p>个人信息管理、设置和偏好配置</p>
        </div>
      </div>
    </main>
    <!-- 共同构建的坚实基础模块 -->
    <section>
      <div class="vite-foundation-section vite-foundation-section-base">
        <div class="vite-foundation-intro">
          <h2 class="vite-foundation-title">软件介绍</h2>
          <a
            v-if="docUrls.intro"
            :href="docUrls.intro"
            target="_blank"
            rel="noopener noreferrer"
            class="vite-foundation-banner"
          >
            <span class="vite-foundation-banner-inner">
              <img
                v-if="remoteUrl('/base_api/public/img/saveImg/sws70s398wh1772715433346.png')"
                :src="remoteUrl('/base_api/public/img/saveImg/sws70s398wh1772715433346.png')"
                alt="Web 项目核心功能文档"
                class="vite-foundation-banner-img"
              />
              <span class="vite-foundation-banner-play" aria-hidden="true">
                <span class="vite-foundation-banner-play-icon"></span>
              </span>
            </span>
          </a>
        </div>
        <h2 class="vite-foundation-title">Web 项目核心功能</h2>
        <div class="vite-foundation-cards">
          <!-- 现代化前端架构 -->
          <div class="vite-foundation-card">
            <div class="vite-foundation-img">
              <img class="vite-img-dom" src="./assets/imgs/6.png" />
            </div>
            <div class="vite-foundation-content">
              <h3>现代化前端架构</h3>
              <p>基于 Vue 3 + Vite + TypeScript + Electron 构建。脚手架创新模式管理</p>
            </div>
          </div>
          <!-- 丰富的组件库 -->
          <div class="vite-foundation-card">
            <div class="vite-foundation-img">
              <img class="vite-img-dom" src="./assets/imgs/5.png" />
            </div>
            <div class="vite-foundation-content">
              <h3>灵活的文档管理</h3>
              <p>集成 Element Plus、自定义 UI 组件，提供完整的文档管理解决方案</p>
            </div>
          </div>
          <!-- 微前端架构支持 -->
          <div class="vite-foundation-card">
            <div class="vite-foundation-img">
              <img class="vite-img-dom" src="./assets/imgs/7.png" />
            </div>
            <div class="vite-foundation-content">
              <h3>微前端架构支持</h3>
              <p>
                基于 qiankun
                框架，支持多应用集成和独立部署。首页集成github高热度项目统计。百度、微博热搜。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用技巧部分 -->
      <div class="vite-foundation-section">
        <h2 class="vite-foundation-title">🔧 使用技巧</h2>
        <div class="vite-foundation-cards">
          <div class="vite-foundation-card">
            <div class="vite-foundation-img tips-bg">
              <span class="tips-icon">📝</span>
            </div>
            <div class="vite-foundation-content">
              <h3>脚本管理</h3>
              <p>在脚本管理中可以创建、编辑、复制和删除脚本</p>
            </div>
          </div>
          <div class="vite-foundation-card">
            <div class="vite-foundation-img tips-bg">
              <span class="tips-icon">🛠️</span>
            </div>
            <div class="vite-foundation-content">
              <h3>工具页面</h3>
              <p>工具页面支持多种格式的文件查看和编辑</p>
            </div>
          </div>
          <div class="vite-foundation-card">
            <div class="vite-foundation-img tips-bg">
              <span class="tips-icon">🚀</span>
            </div>
            <div class="vite-foundation-content">
              <h3>脚手架功能</h3>
              <p>脚手架功能支持多种项目模板，一键初始化</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 特色亮点部分 -->
      <div class="vite-foundation-section">
        <h2 class="vite-foundation-title">💡 特色亮点</h2>
        <div class="vite-foundation-cards">
          <div class="vite-foundation-card">
            <div class="vite-foundation-img highlight-bg">
              <span class="highlight-icon">🎨</span>
            </div>
            <div class="vite-foundation-content">
              <h3>现代化 UI 设计</h3>
              <p>支持深色主题，界面美观易用</p>
            </div>
          </div>
          <div class="vite-foundation-card">
            <div class="vite-foundation-img highlight-bg">
              <span class="highlight-icon">⚡</span>
            </div>
            <div class="vite-foundation-content">
              <h3>高性能渲染</h3>
              <p>流畅的用户体验，响应迅速</p>
            </div>
          </div>
          <div class="vite-foundation-card">
            <div class="vite-foundation-img highlight-bg">
              <span class="highlight-icon">🔒</span>
            </div>
            <div class="vite-foundation-content">
              <h3>安全可靠</h3>
              <p>支持本地数据存储，保护隐私</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 注意事项部分 -->
      <div class="vite-foundation-section">
        <h2 class="vite-foundation-title">⚠️ 注意事项</h2>
        <div class="vite-foundation-cards">
          <div class="vite-foundation-card">
            <div class="vite-foundation-img notice-bg">
              <span class="notice-icon">📱</span>
            </div>
            <div class="vite-foundation-content">
              <h3>系统兼容性</h3>
              <p>客户端只支持 macOS Apple 芯片</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <footer v-if="siteIcpNumber" class="vite-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank">{{ siteIcpNumber }}</a>
    </footer>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import axios from 'axios'
  import { docUrls } from '@/config/docs'
  import { remoteUrl, updatesInfoUrl, siteIcpNumber } from '@/config/remote'

  const INSTALL_SCRIPT_URL =
    'https://raw.giteeusercontent.com/redorc/mac-init/raw/master/softWare-sh/init-uworkplus.sh'

  /** arm64: Apple 芯片；x64: Intel 芯片 */
  const downloadArch = ref('arm64')
  const installCommandCopied = ref(false)
  const quarantineCommandCopied = ref(false)

  const installCommand = computed(
    () => `curl -fsSL ${INSTALL_SCRIPT_URL} | bash`
  )

  const quarantineCommand =
    'sudo xattr -d com.apple.quarantine /Applications/UworkPlus.app'

  const downloadBtnLabel = computed(() =>
    downloadArch.value === 'arm64' ? '下载 macOS 版 - Apple 芯片' : '下载 macOS 版 - Intel 芯片'
  )

  const downloadNote = computed(() =>
    downloadArch.value === 'arm64'
      ? '适用于 macOS Apple 芯片设备'
      : '下载后请在「设置」中授权软件'
  )

  async function copyText(text, copiedRef) {
    try {
      await navigator.clipboard.writeText(text)
      copiedRef.value = true
      window.setTimeout(() => {
        copiedRef.value = false
      }, 1600)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  function copyInstallCommand() {
    copyText(installCommand.value, installCommandCopied)
  }

  function copyQuarantineCommand() {
    copyText(quarantineCommand, quarantineCommandCopied)
  }

  const downloadApp = async () => {
    try {
      const updateUrl =
        updatesInfoUrl ||
        remoteUrl('/updates/update-info-latest.json')
      if (!updateUrl) {
        console.error('未配置更新地址（VITE_UPDATES_INFO_URL 或 VITE_REMOTE_ORIGIN）')
        return
      }
      const response = await axios.get(`${updateUrl}?t=${new Date().getTime()}`)
      const data = response.data || {}
      const isAppleChip = downloadArch.value === 'arm64'

      // Apple 芯片 → downloadUrl；Intel 芯片 → downloadUrlInter（字段互不混用）
      const downloadUrl = isAppleChip ? data.downloadUrl : data.downloadUrlInter

      if (!downloadUrl) {
        console.error(
          isAppleChip
            ? '未找到 Apple 芯片下载地址（downloadUrl）'
            : '未找到 Intel 芯片下载地址（downloadUrlInter）'
        )
        return
      }

      window.location.href = downloadUrl
    } catch (error) {
      console.error('下载应用失败:', error)
    }
  }
</script>

<style scoped lang="scss">
  .vite-bg {
    min-height: 100vh;
    /* 统一主内容和 foundation 区域的渐变背景 */
    background:
      radial-gradient(ellipse 80% 60% at 60% 40%, #3a1c71 0%, #241e4a 40%, #18181c 100%),
      linear-gradient(135deg, #646cff 0%, #18181c 100%);
    color: #fff;
    font-family: 'Inter', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow-y: scroll;
    height: 100vh;
  }
  .vite-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 48px 0 48px;
  }
  .vite-logo {
    height: 60px;
  }
  .vite-nav {
    display: flex;
    gap: 32px;
  }
  .vite-link {
    color: #fff;
    text-decoration: none;
    font-weight: 500;
    font-size: 1.1rem;
    transition: color 0.2s;
  }
  .vite-link:hover {
    color: #b8b8ff;
  }
  .vite-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 16px 0 16px;
    position: relative;
    z-index: 1;
    background: transparent;
    box-shadow: none;
  }
  .vite-main::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 30%;
    transform: translate(-50%, -50%);
    width: 900px;
    height: 600px;
    background: radial-gradient(
      ellipse 60% 40% at 50% 50%,
      rgba(100, 108, 255, 0.25) 0%,
      rgba(162, 89, 255, 0.18) 60%,
      transparent 100%
    );
    filter: blur(32px);
    z-index: -1;
    pointer-events: none;
  }
  .vite-title {
    font-size: 2.8rem;
    font-weight: 900;
    margin-bottom: 16px;
    color: #fff;
    letter-spacing: 2px;
    text-shadow:
      0 2px 12px rgba(100, 108, 255, 0.1),
      0 1px 2px #000;
    background: none;
    -webkit-background-clip: unset;
    -webkit-text-fill-color: unset;
    background-clip: unset;
    border-radius: 18px;
    padding: 8px 24px 8px 24px;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .vite-subtitle {
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 32px;
    color: #e0e0ff;
    text-shadow:
      0 2px 16px rgba(100, 108, 255, 0.18),
      0 1px 2px #000;
  }
  .vite-actions {
    margin-bottom: 48px;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .download-panel {
    width: min(560px, 100%);
    padding: 28px 24px 24px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(18, 18, 24, 0.72);
    box-shadow:
      0 18px 48px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
  }

  .download-panel-title {
    margin: 0 0 24px;
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.02em;
  }

  .download-os-tabs {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .download-os-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 108px;
    padding: 12px 18px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: #c8c8e8;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
  }

  .download-os-tab:hover {
    color: #fff;
  }

  .download-os-tab.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .download-os-icon {
    display: inline-flex;
    width: 28px;
    height: 28px;
    color: currentColor;
  }

  .download-os-icon svg {
    width: 100%;
    height: 100%;
  }

  .download-command-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .download-command-box--small {
    margin-top: 10px;
  }

  .download-command-text {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
    font-family: 'Fira Mono', 'Consolas', 'Monaco', monospace;
    font-size: 0.88rem;
    line-height: 1.5;
    color: #f2f2ff;
  }

  .download-copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #b8b8ff;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }

  .download-copy-btn svg {
    width: 18px;
    height: 18px;
  }

  .download-copy-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  .download-copy-btn.copied {
    color: #7dffb0;
  }

  .download-command-hint {
    margin: 10px 0 0;
    font-size: 0.88rem;
    color: #a8a8d8;
    text-align: center;
  }

  .download-divider {
    margin: 22px 0 18px;
    font-size: 0.9rem;
    color: #9a9ac0;
    text-align: center;
  }

  .download-primary-btn {
    display: block;
    width: 100%;
    padding: 14px 24px;
    border: none;
    border-radius: 999px;
    background: #f4f4f8;
    color: #17171d;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .download-primary-btn:hover {
    background: #fff;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
    transform: translateY(-1px);
  }

  .download-note {
    margin: 12px 0 0;
    font-size: 0.84rem;
    color: #9a9ac0;
    text-align: center;
  }

  .download-post-install {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    text-align: left;
  }

  .download-post-install-title {
    margin: 0;
    font-size: 0.9rem;
    color: #c8c8e8;
    text-align: center;
  }

  .download-tabs {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    margin-bottom: 20px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(100, 108, 255, 0.35);
  }
  .download-tab {
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 1rem;
    font-weight: 600;
    color: #b8b8ff;
    background: transparent;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      box-shadow 0.2s;
  }
  .download-tab:hover {
    color: #fff;
  }
  .download-tab.active {
    color: #fff;
    background: linear-gradient(90deg, #646cff 0%, #a259ff 100%);
    box-shadow: 0 2px 12px rgba(100, 108, 255, 0.35);
  }
  .code {
    background: #000000;
    border-radius: 12px;
    padding: 16px 20px;
    margin: 10px 0;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(100, 108, 255, 0.2);
    position: relative;
    overflow: hidden;
  }
  .command-part {
    margin-top: 60px;
    .command-part-title {
      color: #b8b8ff;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 12px;
      text-align: center;
      text-shadow: 0 2px 8px rgba(100, 108, 255, 0.2);
      letter-spacing: 0.5px;
      position: relative;
      padding: 8px 0;
    }
    .command-part-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #646cff 50%, transparent 100%);
      border-radius: 1px;
    }
  }

  .code::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #646cff 0%, #a259ff 100%);
  }
  .code pre {
    margin: 0;
    color: #00ff88;
    font-family: 'Fira Mono', 'Consolas', 'Monaco', monospace;
    font-size: 0.95rem;
    line-height: 1.5;
    text-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
  }
  .code code {
    background: transparent;
    padding: 0;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
  }
  .vite-btn a {
    background: linear-gradient(90deg, #646cff 0%, #a259ff 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 32px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
    box-shadow: 0 2px 8px rgba(100, 108, 255, 0.1);
  }
  .vite-btn :hover {
    background: #3a1c71;
  }
  .vite-btn-outline {
    background: transparent;
    color: #b8b8ff;
    border: 2px solid #a259ff;
  }
  .vite-btn-outline:hover {
    background: linear-gradient(90deg, #646cff 0%, #a259ff 100%);
    color: #fff;
  }
  .vite-features {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    justify-content: center;
    margin-top: 32px;
  }
  .vite-feature {
    background: linear-gradient(135deg, #23232b 60%, #111118 100%);
    border-radius: 18px;
    box-shadow:
      0 2px 16px rgba(100, 108, 255, 0.1),
      0 1.5px 8px #000;
    padding: 32px 24px;
    min-width: 220px;
    max-width: 320px;
    flex: 1 1 220px;
    text-align: left;
    border: 1px solid #23232b;
  }
  .vite-feature h3 {
    color: #b8b8ff;
    font-size: 1.2rem;
    margin-bottom: 8px;
  }
  .vite-feature p {
    color: #e0e0ff;
    font-size: 1rem;
  }
  .vite-footer {
    text-align: center;
    padding: 24px 0 16px 0;
    color: #888;
    font-size: 0.95rem;
    background: transparent;
  }
  .vite-footer a {
    color: #888;
  }
  .vite-foundation-section {
    background: transparent;
    padding: 64px 0 32px 0;
    margin-top: 0;
  }
  .vite-foundation-intro {
    max-width: 840px;
    margin: 0 auto 48px;
    padding: 28px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(30, 28, 45, 0.6) 0%, rgba(25, 24, 38, 0.5) 100%);
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(100, 108, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .vite-foundation-intro .vite-foundation-title {
    margin-bottom: 24px;
  }
  .vite-foundation-banner {
    display: block;
    max-width: 800px;
    margin: 0 auto;
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    transition: opacity 0.2s, transform 0.2s;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .vite-foundation-banner:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
  .vite-foundation-banner:hover .vite-foundation-banner-play {
    background: rgba(0, 0, 0, 0.55);
    transform: translate(-50%, -50%) scale(1.08);
  }
  .vite-foundation-banner-inner {
    position: relative;
    display: block;
  }
  .vite-foundation-banner-img {
    width: 100%;
    height: auto;
    vertical-align: middle;
  }
  .vite-foundation-banner-play {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, transform 0.2s;
    pointer-events: none;
  }
  .vite-foundation-banner-play-icon {
    width: 0;
    height: 0;
    margin-left: 6px;
    border-style: solid;
    border-width: 14px 0 14px 24px;
    border-color: transparent transparent transparent #fff;
  }
  .vite-foundation-title {
    color: #fff;
    font-size: 2.2rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 40px;
    letter-spacing: 2px;
    text-shadow:
      0 2px 16px #3a1c71,
      0 1px 2px #000;
  }
  .vite-foundation-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    justify-content: center;
    align-items: stretch;
    max-width: 1200px;
    margin: 0 auto;
  }
  .vite-foundation-card {
    background: linear-gradient(135deg, #23232b 80%, #23272f 100%);
    border-radius: 20px;
    box-shadow: 0 4px 32px 0 rgba(100, 108, 255, 0.1);
    padding: 32px 28px 24px 28px;
    min-width: 320px;
    max-width: 420px;
    flex: 1 1 320px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0;
    transition:
      box-shadow 0.2s,
      transform 0.2s;
    border: 1px solid #23272f;
  }
  .vite-foundation-card:hover {
    box-shadow: 0 8px 40px 0 rgba(100, 108, 255, 0.18);
    transform: translateY(-4px) scale(1.02);
  }
  .vite-foundation-img {
    margin-bottom: 24px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
  }
  .vite-img-dom {
    width: 320px;
    height: auto;
    border-radius: 10px;
  }
  .code-bg {
    background: #18181c;
    border-radius: 12px;
    padding: 12px 16px;
    width: 100%;
    min-height: 80px;
    color: #fff;
    font-family: 'Fira Mono', 'Consolas', monospace;
    font-size: 0.98rem;
    overflow-x: auto;
  }
  .tips-bg {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 12px;
    padding: 20px;
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(100, 108, 255, 0.2);
  }
  .highlight-bg {
    background: linear-gradient(135deg, #2d1b69 0%, #1a1a2e 100%);
    border-radius: 12px;
    padding: 20px;
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(162, 89, 255, 0.2);
  }
  .notice-bg {
    background: linear-gradient(135deg, #1a2e1a 0%, #1a1a2e 100%);
    border-radius: 12px;
    padding: 20px;
    width: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(103, 194, 58, 0.2);
  }
  .tips-icon,
  .highlight-icon,
  .notice-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  }
  .vite-foundation-content h3 {
    color: #b8b8ff;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 8px;
    text-shadow:
      0 2px 8px #3a1c71,
      0 1px 2px #000;
  }
  .vite-foundation-content p {
    color: #e0e0ff;
    font-size: 1rem;
    font-weight: 400;
    margin-bottom: 0;
  }
  @media (max-width: 900px) {
    .download-panel {
      padding: 22px 16px 18px;
    }

    .download-os-tabs {
      gap: 8px;
    }

    .download-os-tab {
      min-width: 0;
      flex: 1;
      padding: 10px 12px;
    }

    .download-command-text {
      font-size: 0.78rem;
    }

    .vite-foundation-cards {
      flex-direction: column;
      align-items: center;
    }
    .vite-foundation-card {
      min-width: 0;
      max-width: 98vw;
      width: 100%;
    }
  }
</style>
