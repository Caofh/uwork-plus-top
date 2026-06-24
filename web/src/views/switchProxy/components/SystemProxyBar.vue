<template>
  <div class="system-proxy-bar">
    <span class="system-proxy-bar__label">开启全局系统代理：</span>
    <div class="system-proxy-bar__info">
      <span class="system-proxy-bar__endpoint">127.0.0.1:7035</span>
      <el-tag v-if="running" type="success" size="small">运行中</el-tag>
      <el-tag v-else-if="enabled" type="warning" size="small">未就绪</el-tag>
      <!-- <el-tag v-if="mockRuleCount > 0" type="info" size="small">Mock {{ mockRuleCount }}</el-tag> -->
      <el-tag v-if="enabled && caTrusted" type="success" size="small">证书已信任</el-tag>
      <el-tag v-else-if="enabled && caInKeychain" type="warning" size="small">证书未设为信任</el-tag>
      <el-tag v-else-if="enabled" type="danger" size="small">证书未安装</el-tag>
      <span v-if="service" class="system-proxy-bar__service">{{ service }}</span>
    </div>
    <div v-if="enabled" class="system-proxy-bar__cert-actions">
      <div class="system-proxy-bar__install-group">
        <el-button
          size="small"
          type="primary"
          :loading="loading"
          @click="installCertificate"
        >
          安装 HTTPS 证书
        </el-button>
        <el-tooltip v-if="docUrls.proxyCertHelp" content="安装证书教程" placement="top">
          <button
            type="button"
            class="system-proxy-bar__help"
            @click="openCertHelpDoc"
          >
            ?
          </button>
        </el-tooltip>
      </div>
      <el-button
        size="small"
        :loading="loading"
        @click="revealCertificate"
      >
        打开证书
      </el-button>
    </div>
    <SwitchBtn
      :model-value="enabled"
      @update:modelValue="toggle"
    />
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import SwitchBtn from './SwitchBtn.vue'
  import { useSystemProxy } from '../useSystemProxy'
  import { openExternal } from '@/utils/electron'
  import { docUrls } from '@/config/docs'

  const {
    enabled,
    running,
    service,
    caTrusted,
    caInKeychain,
    loading,
    toggle,
    installCertificate,
    revealCertificate,
    init,
  } = useSystemProxy()

  function openCertHelpDoc() {
    if (!docUrls.proxyCertHelp) {
      return
    }
    openExternal(docUrls.proxyCertHelp)
  }

  onMounted(() => {
    init()
  })
</script>

<style scoped lang="scss">
  .system-proxy-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
    flex-shrink: 0;
  }

  .system-proxy-bar__label {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .system-proxy-bar__info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .system-proxy-bar__endpoint {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .system-proxy-bar__service {
    color: var(--el-text-color-placeholder);
  }

  .system-proxy-bar__cert-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    margin-right: 4px;
  }

  .system-proxy-bar__install-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .system-proxy-bar__help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 1px solid var(--el-border-color);
    border-radius: 50%;
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
</style>
