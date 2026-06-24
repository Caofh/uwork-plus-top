<template>
  <div class="axios-example">
    <h2>Axios API 使用示例</h2>

    <!-- 应用列表示例 -->
    <div class="example-section">
      <h3 style="margin-bottom: 10px">应用列表</h3>
      <el-button @click="loadAppList" :loading="appLoading">加载应用列表</el-button>
      <div v-if="appList.length > 0" class="app-list">
        <div v-for="app in appList" :key="app.id" class="app-item">
          <h4>{{ app.app_name }}</h4>
          <p>{{ app.app_introduce }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { ElMessage } from 'element-plus'
  import { userApi, appApi, websiteApi } from './api'

  // 响应式数据
  const appLoading = ref(false)
  const appList = ref<any[]>([])

  // 加载应用列表
  const loadAppList = async () => {
    try {
      appLoading.value = true
      const response = await appApi.getAppList({ page: 1, size: 10 })

      if (response.code === 200) {
        appList.value = response.data.slice(0, 5)
        ElMessage.success(`成功加载 ${response.data.total} 个应用`)
      } else {
        ElMessage.error(response.message || '加载失败')
      }
    } catch (error) {
      console.error('加载应用列表错误:', error)
      ElMessage.error('加载失败，请重试')
    } finally {
      appLoading.value = false
    }
  }
</script>

<style scoped>
  .axios-example {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .example-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  }

  .example-section h3 {
    margin-top: 0;
    color: #303133;
    border-bottom: 2px solid #409eff;
    padding-bottom: 10px;
  }

  .app-list {
    margin-top: 15px;
  }

  .app-item {
    padding: 15px;
    margin-bottom: 10px;
    background-color: #f5f7fa;
    border-radius: 6px;
    border-left: 4px solid #409eff;
  }

  .app-item h4 {
    margin: 0 0 8px 0;
    color: #303133;
  }

  .app-item p {
    margin: 0;
    color: #606266;
  }

  .status-result {
    margin-top: 15px;
    padding: 15px;
    background-color: #f0f9ff;
    border-radius: 6px;
    border: 1px solid #b3d8ff;
  }

  .status-result p {
    margin: 5px 0;
    color: #303133;
  }
</style>
