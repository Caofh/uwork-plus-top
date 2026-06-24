<template>
  <div class="canvas-area">
    <div class="canvas-header">
      <div class="canvas-tools w-full" :class="[tailWind.flexRowBetween]">
        <div>
          <el-button-group>
            <el-button
              :type="viewMode === 'desktop' ? 'primary' : ''"
              @click="viewMode = 'desktop'"
            >
              <el-icon><Monitor /></el-icon> 桌面
            </el-button>
            <!-- <el-button
            size="small"
            :type="viewMode === 'tablet' ? 'primary' : ''"
            @click="viewMode = 'tablet'"
          >
            <el-icon><Grid /></el-icon> 平板
          </el-button>
          <el-button
            size="small"
            :type="viewMode === 'mobile' ? 'primary' : ''"
            @click="viewMode = 'mobile'"
          >
            <el-icon><Iphone /></el-icon> 手机
          </el-button> -->
          </el-button-group>
          <el-button class="ml-[10px]" @click="clearCanvas">
            <el-icon><Delete /></el-icon> 清空
          </el-button>
        </div>
        <el-button @click="saveCanvasData">保存</el-button>
      </div>
    </div>

    <!-- 数据预览弹窗 -->
    <el-dialog
      v-model="showDataDialog"
      title="画布数据预览"
      width="80%"
      :before-close="handleCloseDialog"
    >
      <div class="data-preview-container">
        <div class="data-preview-header">
          <span class="file-name">pageComponents.json</span>
          <el-button size="small" @click="copyToClipboard">复制</el-button>
        </div>
        <div class="data-preview-content">
          <pre class="json-content">{{ formattedData }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDataDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportData">导出文件</el-button>
      </template>
    </el-dialog>
    <div class="canvas-content" :class="`view-${viewMode}`">
      <div
        class="canvas-container"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @click="handleCanvasClick"
      >
        <!-- 空状态 -->
        <div v-if="pageComponents.length === 0" class="canvas-empty">
          <div class="empty-content">
            <el-icon class="empty-icon" size="48"><Plus /></el-icon>
            <p class="empty-text">拖拽组件到此处开始设计</p>
            <p class="empty-hint">从左侧组件库拖拽组件到画布中</p>
          </div>
        </div>

        <!-- 页面组件列表 -->
        <div v-else class="components-list">
          <div
            v-for="(component, index) in pageComponents"
            :key="component.id"
            class="component-wrapper"
            :class="{ active: selectedComponent?.id === component.id }"
            @click.stop="selectComponent(component)"
          >
            <!-- 组件操作工具栏 -->
            <div class="component-toolbar" v-if="selectedComponent?.id === component.id">
              <el-button size="small" @click="moveUp(index)" :disabled="index === 0">
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button
                size="small"
                @click="moveDown(index)"
                :disabled="index === pageComponents.length - 1"
              >
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <el-button size="small" @click="duplicateComponent(component)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button size="small" type="danger" @click="removeComponent(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <!-- 动态组件渲染 -->
            <template v-if="component.component === 'ContainerComponent'">
              <component
                :is="componentMap[component.component]"
                :props="component.props"
                :slots="component.slots"
                :componentMap="componentMap"
                :item="component"
                class="canvas-component container-component"
              />
            </template>
            <template v-else>
              <component
                :is="componentMap[component.component]"
                :props="component.props"
                class="canvas-component normal-component"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, toRaw } from 'vue'
import eventBus from '@/utils/eventBus'
import { ElMessage } from 'element-plus'
import {
  ArrowUp,
  ArrowDown,
  CopyDocument,
  Delete,
  Monitor,
  Grid,
  Iphone,
  Plus,
} from '@element-plus/icons-vue'
import TextComponent from './components/TextComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import ContainerComponent from './components/ContainerComponent.vue'

import { tailWind } from '@/utils/tailwind'

interface PageComponent {
  id: string
  type: string
  component: string
  componentCpt?: any
  props: Record<string, any>
  slots?: Record<string, any>
  componentList?: PageComponent[]
}

interface ModuleItem {
  type: string
  name: string
  description: string
  icon: string
  component: string
  defaultProps: Record<string, any>
}

// Props
const props = defineProps<{
  pageComponents: PageComponent[]
}>()

// Emits
const emit = defineEmits<{
  'update:pageComponents': [components: PageComponent[]]
  'select-component': [component: PageComponent | null]
}>()

// 响应式数据
const viewMode = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const selectedComponent = ref<PageComponent | null>(null)
const showDataDialog = ref(false)
const formattedData = ref('')

// 计算属性
const pageComponents = computed({
  get: () => props.pageComponents,
  set: value => emit('update:pageComponents', value),
})

// 组件映射
const componentMap: Record<string, any> = {
  TextComponent,
  ButtonComponent,
  ContainerComponent,
}

// 生成唯一ID
const generateId = () => {
  return 'component_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 处理拖拽放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  // 检查是否拖拽到了容器组件上
  const target = event.target as HTMLElement
  const containerElement = target.closest('.container-component')

  if (containerElement) {
    return // 让容器组件处理
  }

  try {
    const moduleData = JSON.parse(
      event.dataTransfer?.getData('application/json') || '{}'
    ) as ModuleItem

    if (moduleData.type) {
      const newComponent: PageComponent = {
        id: generateId(),
        type: moduleData.type,
        component: moduleData.component,
        props: { ...moduleData.defaultProps },
      }

      pageComponents.value = [...toRaw(pageComponents.value), newComponent]
      selectComponent(newComponent)
    }
  } catch (error) {
    console.error('解析拖拽数据失败:', error)
  }
}

// 处理拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

// 选择组件
const selectComponent = (component: PageComponent) => {
  console.log('selectComponent-2')

  console.log('component')
  console.log(component)

  eventBus.emit('close-component-toolbar', null)
  eventBus.emit('close-component-toolbar-inner', null)
  selectedComponent.value = component
  emit('select-component', component)
}

// 处理画布点击
const handleCanvasClick = () => {
  selectedComponent.value = null
  // emit('select-component', null)
}

// 上移组件
const moveUp = (index: number) => {
  if (index > 0) {
    const newComponents = [...pageComponents.value]
    ;[newComponents[index - 1], newComponents[index]] = [
      newComponents[index],
      newComponents[index - 1],
    ]
    pageComponents.value = newComponents
  }
}

// 下移组件
const moveDown = (index: number) => {
  if (index < pageComponents.value.length - 1) {
    const newComponents = [...pageComponents.value]
    ;[newComponents[index], newComponents[index + 1]] = [
      newComponents[index + 1],
      newComponents[index],
    ]
    pageComponents.value = newComponents
  }
}

// 复制组件
const duplicateComponent = (component: PageComponent) => {
  const newComponent: PageComponent = {
    ...component,
    id: generateId(),
  }
  pageComponents.value = [...pageComponents.value, newComponent]
  selectComponent(newComponent)
}

// 删除组件
const removeComponent = (index: number) => {
  pageComponents.value = pageComponents.value.filter((_, i) => i !== index)
  if (
    selectedComponent.value &&
    pageComponents.value.findIndex(c => c.id === selectedComponent.value?.id) === -1
  ) {
    selectedComponent.value = null
    emit('select-component', null)
  }
}

// 清空画布
const clearCanvas = () => {
  pageComponents.value = []
  selectedComponent.value = null
  emit('select-component', null)
}

// 保存画布数据
const saveCanvasData = () => {
  console.log('saveCanvasData')
  console.log(pageComponents.value)

  // 格式化JSON数据
  formattedData.value = JSON.stringify(pageComponents.value, null, 2)
  showDataDialog.value = true
}

// 关闭弹窗
const handleCloseDialog = () => {
  showDataDialog.value = false
}

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedData.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 导出文件
const exportData = () => {
  const blob = new Blob([formattedData.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pageComponents.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('文件已导出')
}

onMounted(() => {
  eventBus.on('close-component-toolbar', handleCanvasClick)
})
onUnmounted(() => {
  eventBus.off('close-component-toolbar', handleCanvasClick)
})
</script>

<style lang="scss" scoped>
.canvas-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  .canvas-header {
    padding: 12px 16px;
    background: #ffffff;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .canvas-tools {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .canvas-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    justify-content: center;

    &.view-desktop .canvas-container {
      width: 100%;
      max-width: 1200px;
      height: calc(100vh - 220px);
      overflow-y: auto;
    }

    &.view-tablet .canvas-container {
      width: 768px;
    }

    &.view-mobile .canvas-container {
      width: 375px;
    }
  }

  .canvas-container {
    min-height: 600px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    transition: all 0.3s ease;
  }
}

.canvas-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .empty-content {
    text-align: center;
    color: #999999;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #cccccc;
    }

    .empty-text {
      font-size: 16px;
      margin-bottom: 8px;
      color: #666666;
    }

    .empty-hint {
      font-size: 14px;
      color: #999999;
    }
  }
}

.components-list {
  padding: 50px 20px 20px 20px;
}

.component-wrapper {
  position: relative;
  // margin-bottom: 16px;
  // border: 2px solid transparent;
  margin: 2px;
  // border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #e9ecef;
  }

  &.active {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }

  .component-toolbar {
    min-width: 170px;
    position: absolute;
    top: -40px;
    right: 0;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;

    .el-button {
      margin: 0 2px;
    }
  }

  .canvas-component {
    width: 100%;
  }
}

// 数据预览弹窗样式
.data-preview-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;

  .data-preview-header {
    background: #2d2d30;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #3e3e42;

    .file-name {
      color: #cccccc;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .data-preview-content {
    flex: 1;
    overflow: auto;
    background: #1e1e1e;

    .json-content {
      margin: 0;
      padding: 16px;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      width: 100%;
      height: 100%;
      box-sizing: border-box;

      // JSON语法高亮样式
      :deep(.json-key) {
        color: #9cdcfe;
      }

      :deep(.json-string) {
        color: #ce9178;
      }

      :deep(.json-number) {
        color: #b5cea8;
      }

      :deep(.json-boolean) {
        color: #569cd6;
      }

      :deep(.json-null) {
        color: #808080;
      }
    }
  }
}

// 滚动条样式
.data-preview-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.data-preview-content::-webkit-scrollbar-track {
  background: #2d2d30;
}

.data-preview-content::-webkit-scrollbar-thumb {
  background: #464647;
  border-radius: 4px;
}

.data-preview-content::-webkit-scrollbar-thumb:hover {
  background: #5a5a5c;
}
</style>
