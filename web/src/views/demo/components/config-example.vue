<template>
  <div class="config-example">
    <h2>配置系统使用示例</h2>

    <!-- 环境信息 -->
    <div class="config-section">
      <h3>环境信息</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="当前环境">{{ envInfo.env }}</el-descriptions-item>
        <el-descriptions-item label="是否开发环境">{{ envInfo.isDev }}</el-descriptions-item>
        <el-descriptions-item label="是否测试环境">{{ envInfo.isStaging }}</el-descriptions-item>
        <el-descriptions-item label="是否生产环境">{{ envInfo.isProd }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- API配置 -->
    <div class="config-section">
      <h3>API配置</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="基础URL">{{ apiConfig.baseURL }}</el-descriptions-item>
        <el-descriptions-item label="超时时间">{{ apiConfig.timeout }}ms</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ apiConfig.retryTimes }}</el-descriptions-item>
        <el-descriptions-item label="重试延迟">{{ apiConfig.retryDelay }}ms</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 应用配置 -->
    <div class="config-section">
      <h3>应用配置</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="应用名称">{{ appConfig.app.name }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ appConfig.app.version }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ appConfig.app.description }}</el-descriptions-item>
        <el-descriptions-item label="调试模式">{{ appConfig.debug }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 上传配置 -->
    <div class="config-section">
      <h3>上传配置</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="最大文件大小">
          {{ formatFileSize(uploadConfig.maxSize) }}
        </el-descriptions-item>
        <el-descriptions-item label="允许的文件类型">
          {{ uploadConfig.allowedTypes.join(', ') }}
        </el-descriptions-item>
        <el-descriptions-item label="上传端点">{{ uploadConfig.endpoint }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 主题配置 -->
    <div class="config-section">
      <h3>主题配置</h3>
      <div class="theme-colors">
        <div
          v-for="(color, key) in themeConfig"
          :key="key"
          class="color-item"
          :style="{ backgroundColor: color }"
        >
          <span class="color-name">{{ key }}</span>
          <span class="color-value">{{ color }}</span>
        </div>
      </div>
    </div>

    <!-- 分页配置 -->
    <div class="config-section">
      <h3>分页配置</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="默认页大小">
          {{ paginationConfig.pageSize }}
        </el-descriptions-item>
        <el-descriptions-item label="页大小选项">
          {{ paginationConfig.pageSizes.join(', ') }}
        </el-descriptions-item>
        <el-descriptions-item label="显示大小选择器">
          {{ paginationConfig.showSizeChanger }}
        </el-descriptions-item>
        <el-descriptions-item label="显示快速跳转">
          {{ paginationConfig.showQuickJumper }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 动态配置获取 -->
    <div class="config-section">
      <h3>动态配置获取</h3>
      <el-input
        v-model="configPath"
        placeholder="输入配置路径，如: api.baseURL"
        style="width: 300px; margin-right: 10px"
      />
      <el-button @click="getConfigValue">获取配置值</el-button>
      <div v-if="configResult" class="config-result">
        <strong>结果:</strong>
        {{ JSON.stringify(configResult) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import {
    getAppConfig,
    getApiConfig,
    getEnvInfo,
    getUploadConfig,
    getThemeConfig,
    getPaginationConfig,
    getConfigValue,
    isDevelopment,
    isStaging,
    isProduction,
  } from '@/utils/config'

  // 响应式数据
  const configPath = ref('api.baseURL')
  const configResult = ref<any>(null)

  // 获取配置
  const appConfig = getAppConfig()
  const apiConfig = getApiConfig()
  const envInfo = getEnvInfo()
  const uploadConfig = getUploadConfig()
  const themeConfig = getThemeConfig()
  const paginationConfig = getPaginationConfig()

  // 环境检查
  const envChecks = computed(() => ({
    isDev: isDevelopment(),
    isStaging: isStaging(),
    isProd: isProduction(),
  }))

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取配置值
  const getConfigValueHandler = () => {
    if (configPath.value) {
      configResult.value = getConfigValue(configPath.value)
    }
  }
</script>

<style scoped>
  .config-example {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .config-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  }

  .config-section h3 {
    margin-top: 0;
    color: #303133;
    border-bottom: 2px solid #409eff;
    padding-bottom: 10px;
  }

  .theme-colors {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .color-item {
    width: 120px;
    height: 80px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
  }

  .color-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .color-value {
    font-size: 12px;
    opacity: 0.9;
  }

  .config-result {
    margin-top: 15px;
    padding: 15px;
    background-color: #f0f9ff;
    border-radius: 6px;
    border: 1px solid #b3d8ff;
  }
</style>
