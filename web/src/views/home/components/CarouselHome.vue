<template>
  <div class="carousel-container-home">
    <Carousel
      :items="carouselItems"
      :base-width="props.carouselWidth"
      :autoplay="true"
      :autoplay-delay="3000"
      :pause-on-hover="true"
      :loop="true"
      :round="false"
    />

    <!-- 网站介绍弹窗 -->
    <CommonDialog v-model="showIntroDialog" title="UworkPlus 使用手册" width="800px" :center="true">
      <div class="intro-content">
        <div class="intro-section">
          <h3>🎯 主要功能</h3>
          <div class="feature-grid">
            <div class="feature-item">
              <h4>🏠 首页</h4>
              <p>展示项目概览、热门资讯、数据统计等核心信息</p>
            </div>
            <div class="feature-item">
              <h4>📝 文档管理</h4>
              <p>创建、编辑、管理各种文档和笔记</p>
            </div>
            <div class="feature-item">
              <h4>🛠️ 工具集合</h4>
              <p>提供 JSON 查看器、代码片段管理、网站导航等实用工具</p>
            </div>
            <div class="feature-item">
              <h4>⚡ 脚本执行</h4>
              <p>管理和执行各种 Shell 脚本、命令和工具</p>
            </div>
            <div class="feature-item">
              <h4>🚀 脚手架</h4>
              <p>快速创建和初始化各种项目模板</p>
            </div>
            <div class="feature-item">
              <h4>👤 用户中心</h4>
              <p>个人信息管理、设置和偏好配置</p>
            </div>
          </div>
        </div>

        <div class="intro-section">
          <h3>🔧 使用技巧</h3>
          <ul class="tips-list">
            <li>在脚本管理中可以创建、编辑、复制和删除脚本</li>
            <li>工具页面支持多种格式的文件查看和编辑</li>
            <li>脚手架功能支持多种项目模板，一键初始化</li>
            <li>所有功能都支持响应式设计，适配各种设备</li>
          </ul>
        </div>

        <div class="intro-section">
          <h3>💡 特色亮点</h3>
          <div class="highlights">
            <div class="highlight-item">
              <span class="highlight-icon">🎨</span>
              <span>现代化 UI 设计，支持深色主题</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-icon">⚡</span>
              <span>高性能渲染，流畅的用户体验</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-icon">🔒</span>
              <span>安全可靠，支持本地数据存储</span>
            </div>
          </div>
        </div>
        <div class="intro-section">
          <h3>💡 注意事项</h3>
          <div class="highlights">
            <div class="highlight-item">
              <span class="highlight-icon">📱</span>
              <span>客户端 只支持macOS Apple芯片</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showIntroDialog = false">关闭</el-button>
          <el-button type="primary" @click="openDocumentation">查看详细文档</el-button>
        </div>
      </template>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
  import { watch, ref } from 'vue'
  import Carousel from '@/components/ui/carousel/Carousel.vue'
  import type { CarouselItem } from '@/components/ui/carousel/Carousel.vue'
  import CommonDialog from '@/components/commonDialog/CommonDialog.vue'
  import { openElectronWebview, getVersion } from '@/utils/electron'
  import { compareVersions } from '@/utils/version'
  import { useLoginHooks } from '@/hooks/loginHooks'
  import { ElMessage } from 'element-plus'

  // 获取当前token用户信息
  const { token, showLogin } = useLoginHooks()

  // 图片
  import birdPng from './images/bird-banner.jpg'
  import uworkPlusPng from './images/UworkPlus-banner.jpg'
  import SwitchProxyPng from './images/SwitchProxy-banner.jpg'
  import uworkHomePng from './images/UworkPlus-home.png'
  import elementFilterPng from './images/ElementFilter.jpg'

  import { openExternal, isInElectron } from '@/utils/electron'
  import { docUrls } from '@/config/docs'
  import { resolveRemoteOrLocal, remoteUrl } from '@/config/remote'

  // 声明你想接收的 props
  const props = defineProps({
    carouselWidth: {
      type: Number,
      default: 0,
    },
  })

  // 弹窗显示状态
  const showIntroDialog = ref(false)

  const carouselItems: CarouselItem[] = [
    {
      title: 'UworkPlus使用手册',
      description: '点击观看',
      id: 1,
      bgImage: uworkPlusPng,
      onClick: () => {
        // 显示网站介绍弹窗
        showIntroDialog.value = true
      },
    },
    {
      title: 'Element Filter官网',
      description: 'Chrome 插件',
      id: 2,
      bgImage: elementFilterPng,
      // icon: "pi pi-home",
      onClick: () => {
        const url = resolveRemoteOrLocal('/resource/elementFilter/updatePackage/docs/index.html')
        if (isInElectron()) {
          // 官网
          openExternal(url)
        } else {
          // 跳转
          window.open(url, '_blank')
        }
      },
    },
    {
      title: '新游上线：小鸟飞飞',
      description: '开始起飞',
      id: 1,
      bgImage: birdPng,
      onClick: async () => {
        // 判断当前版本是否大于等于1.7.1
        const { data: currentVersion } = isInElectron() ? await getVersion() : { data: undefined }
        const isAfterVersion171 = compareVersions(currentVersion, '1.7.1') >= 0

        if (isAfterVersion171) {
          if (token.value) {
            const openIdByToken = `${token.value}_isToken`
            // 开始游戏
            openElectronWebview({
              url: remoteUrl(`/bird/?openId=${openIdByToken}`),
              title: '小鸟飞飞',
              width: 390,
              height: 780,
            })
          } else {
            setTimeout(() => {
              showLogin(true)
            }, 200)
          }
        } else {
          ElMessage.warning('当前版本不支持本功能，请点击右上角🔄升级到最新版本!')
        }
      },
    },
    {
      title: 'UworkPlus官网',
      description: '去看看',
      id: 2,
      bgImage: uworkHomePng,
      // icon: "pi pi-home",
      onClick: () => {
        const url = resolveRemoteOrLocal('/uworkplus/introduction?origin=custom')
        if (isInElectron()) {
          // 官网
          openExternal(url)
        } else {
          // 跳转
          window.open(url, '_blank')
        }
      },
    },
    {
      title: 'SwitchProxy',
      description: '跨平台的"接口代理"管理利器',
      id: 1,
      bgImage: SwitchProxyPng,
      onClick: () => {
        const url = resolveRemoteOrLocal('/switchproxy')
        if (isInElectron()) {
          // 官网
          openExternal(url)
        } else {
          // 跳转
          window.open(url, '_blank')
        }
      },
    },
  ]

  // 打开详细文档
  const openDocumentation = () => {
    // 这里可以添加跳转到详细文档的逻辑
    console.log('打开详细文档')
    // showIntroDialog.value = false;
    const docUrl = docUrls.intro
    if (!docUrl) {
      return
    }
    openExternal(docUrl)
  }
</script>
<style scoped lang="scss">
  .carousel-container-home {
    height: 100%;
    width: 100%;

    :deep(.cpt-carousel) {
      height: 100%;
    }
  }

  .intro-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 20px;
    color: #e0e0e0;

    .intro-section {
      margin-bottom: 30px;

      h3 {
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        color: #7ee2ad;
        font-size: 18px;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 20px;

        .feature-item {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          padding: 15px;

          h4 {
            margin-bottom: 8px;
            color: #f0f0f0;
            font-size: 16px;
          }

          p {
            margin: 0;
            color: rgba(224, 224, 224, 0.78);
            font-size: 14px;
            line-height: 1.5;
          }
        }
      }

      .tips-list {
        list-style: none;
        padding: 0;

        li {
          margin-bottom: 10px;
          padding: 12px 15px;
          border: 1px solid rgba(66, 185, 131, 0.16);
          border-left: 3px solid #7ee2ad;
          border-radius: 12px;
          background: rgba(66, 185, 131, 0.08);
          color: #e0e0e0;

          code {
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 6px;
            color: #7ee2ad;
            font-family: 'Monaco', 'Menlo', monospace;
          }
        }
      }

      .highlights {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;

        .highlight-item {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 3px solid #7ee2ad;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          padding: 12px 15px;

          .highlight-icon {
            font-size: 20px;
          }

          span:last-child {
            color: #f0f0f0;
            font-size: 14px;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
