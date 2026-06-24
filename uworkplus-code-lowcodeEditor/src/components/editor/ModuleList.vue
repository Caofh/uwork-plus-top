<template>
  <div class="module-list">
    <div class="module-list-header">
      <h3 class="text-lg font-semibold text-gray-800">组件库</h3>
    </div>
    <div class="module-list-content">
      <div class="module-category" v-for="category in moduleCategories" :key="category.name">
        <div class="category-header">
          <h4 class="text-sm font-medium text-gray-600">{{ category.name }}</h4>
        </div>
        <div class="category-items">
          <div
            v-for="module in category.modules"
            :key="module.type"
            class="module-item"
            draggable="true"
            @dragstart="handleDragStart($event, module)"
            @dragend="handleDragEnd"
          >
            <div class="module-icon">
              <el-icon size="18" class="text-lg">
                <component :is="getIconComponent(module.icon)" />
              </el-icon>
            </div>
            <div class="module-info">
              <span class="module-name">{{ module.name }}</span>
              <span class="module-desc">{{ module.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Document, Picture, Mouse, Box, Grid, Menu, Edit, ArrowDown } from '@element-plus/icons-vue'

// 图标映射
const iconMap: Record<string, any> = {
  'el-icon-document': Document,
  'el-icon-picture': Picture,
  'el-icon-mouse': Mouse,
  'el-icon-box': Box,
  'el-icon-s-grid': Grid,
  'el-icon-menu': Menu,
  'el-icon-edit': Edit,
  'el-icon-arrow-down': ArrowDown
}

// 获取图标组件
const getIconComponent = (iconClass: string) => {
  return iconMap[iconClass] || Document
}

interface ModuleItem {
  type: string
  name: string
  description: string
  icon: string
  component: string
  defaultProps: Record<string, any>
}

interface ModuleCategory {
  name: string
  modules: ModuleItem[]
}

// 定义模块分类和组件
const moduleCategories = ref<ModuleCategory[]>([
  {
    name: '基础组件',
    modules: [
      {
        type: 'text',
        name: '文本',
        description: '显示文本内容',
        icon: 'el-icon-document',
        component: 'TextComponent',
        defaultProps: {
          text: '这是一段文本',
          fontSize: 14,
          color: '#333333',
          textAlign: 'left'
        }
      },
      // {
      //   type: 'image',
      //   name: '图片',
      //   description: '显示图片',
      //   icon: 'el-icon-picture',
      //   component: 'ImageComponent',
      //   defaultProps: {
      //     src: '',
      //     alt: '图片',
      //     width: 200,
      //     height: 150
      //   }
      // },
      {
        type: 'button',
        name: '按钮',
        description: '可点击的按钮',
        icon: 'el-icon-mouse',
        component: 'ButtonComponent',
        defaultProps: {
          text: '按钮',
          type: 'primary',
          size: 'default'
        }
      }
    ]
  },
  {
    name: '布局组件',
    modules: [
      {
        type: 'container',
        name: '容器',
        description: '布局容器',
        icon: 'el-icon-box',
        component: 'ContainerComponent',
        defaultProps: {
          width: 'auto',
          height: 'auto',
          padding: 10,
          backgroundColor: '#ffffff'
        }
      },
      // {
      //   type: 'row',
      //   name: '行',
      //   description: '横向布局',
      //   icon: 'el-icon-s-grid',
      //   component: 'RowComponent',
      //   defaultProps: {
      //     gutter: 20,
      //     align: 'top'
      //   }
      // },
      // {
      //   type: 'col',
      //   name: '列',
      //   description: '纵向布局',
      //   icon: 'el-icon-menu',
      //   component: 'ColComponent',
      //   defaultProps: {
      //     span: 12,
      //     offset: 0
      //   }
      // }
    ]
  },
  // {
  //   name: '表单组件',
  //   modules: [
  //     {
  //       type: 'input',
  //       name: '输入框',
  //       description: '文本输入框',
  //       icon: 'el-icon-edit',
  //       component: 'InputComponent',
  //       defaultProps: {
  //         placeholder: '请输入内容',
  //         type: 'text',
  //         size: 'default'
  //       }
  //     },
  //     {
  //       type: 'select',
  //       name: '选择器',
  //       description: '下拉选择框',
  //       icon: 'el-icon-arrow-down',
  //       component: 'SelectComponent',
  //       defaultProps: {
  //         placeholder: '请选择',
  //         options: [
  //           { label: '选项1', value: 'option1' },
  //           { label: '选项2', value: 'option2' }
  //         ]
  //       }
  //     }
  //   ]
  // }
])

// 拖拽开始事件
const handleDragStart = (event: DragEvent, module: ModuleItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(module))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// 拖拽结束事件
const handleDragEnd = () => {
  // 拖拽结束后的处理
  // console.log('拖拽结束')

}
</script>

<style lang="scss" scoped>
.module-list {
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;

  &-header {
    padding: 16px;
    border-bottom: 1px solid #e9ecef;
    background: #ffffff;
  }

  &-content {
    padding: 12px;
  }
}

.module-category {
  margin-bottom: 20px;

  .category-header {
    margin-bottom: 8px;
    padding: 0 4px;
  }

  .category-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.module-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
  }

  .module-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 6px;
    margin-right: 12px;
    color: #6c757d;
  }

  .module-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .module-name {
      font-size: 14px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 2px;
    }

    .module-desc {
      font-size: 12px;
      color: #6c757d;
    }
  }
}
</style>
