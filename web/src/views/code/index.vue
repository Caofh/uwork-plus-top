<template>
  <div class="code-container">
    <div :class="['tab-container', tailWind.flexRowStart]" v-if="isVersion160">
      <el-radio-group v-model="tabPosition">
        <el-radio-button value="code">代码片段</el-radio-button>
        <el-radio-button value="dir">代码文件夹</el-radio-button>
      </el-radio-group>
      <APlus
        v-if="docUrls.codeSnippet"
        class="ml-[10px] auto-bounce"
        :url="docUrls.codeSnippet"
      >
        配合vscode插件"uworkplus-code"使用
      </APlus>
    </div>

    <div class="code-body">
      <CodeDetail v-show="tabPosition === 'code'" />
      <CodeDir v-show="tabPosition === 'dir'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import CodeDetail from './view-detail/codeDetail/index.vue'
  import CodeDir from './view-detail/codeDir/index.vue'
  import { isInElectron, getVersion } from '@/utils/electron'
  import { compareVersions } from '@/utils/version'
  import { tailWind } from '@/utils/tailwind'
  import { docUrls } from '@/config/docs'

  const isVersion160 = ref(false)

  // 判断当前版本是否大于等于1.6.0
  const showCodeContainer = async () => {
    const { data: currentVersion } = isInElectron() ? await getVersion() : { data: undefined }
    const isAfterVersion160 = compareVersions(currentVersion, '1.6.0') >= 0 // 判断当前版本是否大于等于1.5.8
    return isAfterVersion160
  }
  onMounted(async () => {
    const isAfterVersion160 = await showCodeContainer()
    isVersion160.value = isAfterVersion160
  })

  const tabPosition = ref('code')
</script>

<style lang="scss" scoped>
  .code-container {
    --code-bg: #121212;
    --code-bg-elevated: #1a1a1a;
    --code-bg-panel: #1e1e1e;
    --code-border: #2e2e2e;
    --code-text: #e0e0e0;
    --code-text-muted: #bdbdbd;
    --code-accent: #90caf9;
    --code-accent-soft: #1e3a5f;
    --code-hover: #252525;
    --code-radius: 8px;
    --code-radius-sm: 6px;
    --code-transition: 0.18s ease;

    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--code-bg);
    color: var(--code-text);

    .tab-container {
      height: 50px;
      flex-shrink: 0;
      padding: 0 12px;
      display: flex;
      align-items: center;
      background: var(--code-bg-elevated);
      border-bottom: 1px solid var(--code-border);

      :deep(.el-radio-group) {
        background: var(--code-hover);
        border-radius: var(--code-radius-sm);
        padding: 3px;
      }

      :deep(.el-radio-button__inner) {
        background: transparent;
        border: none !important;
        color: var(--code-text-muted);
        border-radius: var(--code-radius-sm) !important;
        box-shadow: none !important;
        transition:
          background var(--code-transition),
          color var(--code-transition);
      }

      :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
        background: var(--code-bg-panel);
        color: var(--code-accent);
        font-weight: 600;
      }

      :deep(.el-radio-button__inner:hover) {
        color: var(--code-accent);
      }
    }

    .code-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 10px 12px 12px;

      :deep(.home),
      :deep(.code-dir) {
        height: 100%;
        min-height: 0;
      }
    }
  }

  // 自动跳跃动画 - 跳一次后等待3秒再跳
  .auto-bounce {
    animation: bounce 3.6s ease-in-out infinite;
  }

  // 定义跳跃关键帧 - 包含等待时间
  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    8.33% {
      transform: translateY(-8px);
    }
    16.67% {
      transform: translateY(0);
    }
    25% {
      transform: translateY(-4px);
    }
    33.33% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(0);
    }
  }
</style>
