<template>
  <div class="editor-page">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-left">
        <h1 class="editor-title">低代码编辑器</h1>
      </div>
      <div class="header-right">
        <!-- <el-button-group>
          <el-button @click="preview">
            <el-icon><View /></el-icon> 预览
          </el-button>
          <el-button type="primary" @click="save">
            <el-icon><Document /></el-icon> 保存
          </el-button>
          <el-button type="success" @click="publish">
            <el-icon><Upload /></el-icon> 发布
          </el-button>
        </el-button-group> -->
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <!-- 左侧组件库 -->
      <div class="editor-sidebar editor-sidebar-left">
        <ModuleList />
      </div>

      <!-- 中间画布区域 -->
      <div class="editor-main">
        <CanvasArea
          v-model:page-components="pageComponents"
          @select-component="handleSelectComponent"
        />
      </div>

      <!-- 右侧属性面板 -->
      <div class="editor-sidebar editor-sidebar-right">
        <PropertyPanel :selectedCpt="selectedComponent" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'EditorPage',
})

import { ref, onMounted, provide, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { View, Document, Upload } from '@element-plus/icons-vue'
import ModuleList from '@/components/editor/ModuleList.vue'
import CanvasArea from '@/components/editor/CanvasArea.vue'
import PropertyPanel from '@/components/editor/PropertyPanel.vue'

// 定义页面组件接口
interface PageComponent {
  id: string
  type: string
  component: string
  props: Record<string, any>
}

// 响应式数据
const pageComponents = ref<PageComponent[]>([])
const selectedComponent = ref<PageComponent | null>(null)

// 选择组件
const handleSelectComponent = (component: PageComponent | null) => {
  console.log('component')
  console.log(component)

  selectedComponent.value = component
}

/* 父组件注册 */
// 注册provide，用于深层子组件调用，所有逻辑统一收到当前父组件执行（单项数据流，子组件只做展示）
const parentProvidePool = {
  handleSelectComponent: handleSelectComponent, // 调用右侧配置组件
}
provide('parentProvide', parentProvidePool)

// 预览功能
const preview = () => {
  ElMessage.success('预览功能开发中...')
}

// 保存功能
const save = () => {
  const data = {
    components: toRaw(pageComponents.value),
    timestamp: Date.now(),
  }
  console.log('data')
  console.log(data)

  // localStorage.setItem('editor-data', JSON.stringify(data))
  ElMessage.success('保存成功')
}

// 发布功能
const publish = () => {
  ElMessage.success('发布功能开发中...')
}

// 组件挂载时的操作
onMounted(() => {
  // 尝试加载之前保存的数据
  const savedData = localStorage.getItem('editor-data')
  if (savedData) {
    try {
      const data = JSON.parse(savedData)
      pageComponents.value = data.components || []
    } catch (error) {
      console.error('加载保存数据失败:', error)
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-page {
  // height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.editor-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .header-left {
    .editor-title {
      font-size: 20px;
      font-weight: 600;
      color: #333333;
      margin: 0;
    }
  }

  .header-right {
    .el-button-group {
      .el-button {
        margin-left: 8px;
      }
    }
  }
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;

  &.editor-sidebar-right {
    border-right: none;
    border-left: 1px solid #e9ecef;
  }
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 响应式设计
@media (max-width: 1200px) {
  .editor-sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .editor-sidebar {
    width: 200px;
  }

  .editor-header {
    padding: 0 12px;

    .editor-title {
      font-size: 16px;
    }
  }
}
</style>
