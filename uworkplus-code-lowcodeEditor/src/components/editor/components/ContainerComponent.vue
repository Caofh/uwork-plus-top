<template>
  <div
    :class="['container-component', containerStyleClass]"
    :style="containerStyle"
    @drop="handleDropContainer($event, item)"
  >
    <!-- <slot :slots="dataInner.slots"></slot> -->
    <div
      v-for="(component, index) in componentListInner"
      :key="component.id"
      class="component-wrapper-inner"
      :class="{ active: selectedComponent?.id === component.id }"
      @click.stop="selectComponent(component)"
    >
      <!-- <component
        :is="component.componentCpt"
        :props="component.props"
        :slots="component.slots"
      ></component> -->

      <!-- 组件操作工具栏 -->
      <div class="component-toolbar" v-if="selectedComponent?.id === component.id">
        <el-button size="small" @click="moveUp(index)" :disabled="index === 0">
          <el-icon><ArrowUp /></el-icon>
        </el-button>
        <el-button
          size="small"
          @click="moveDown(index)"
          :disabled="index === componentListInner.length - 1"
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
          :is="component.componentCpt"
          :props="component.props"
          :slots="component.slots"
          :item="component"
          :componentList="component.componentList"
          :componentMap="componentMap"
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
</template>

<script lang="ts" setup>
import {
  computed,
  watch,
  ref,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  inject,
  toRaw,
} from 'vue'
import eventBus from '@/utils/eventBus'
import { ArrowUp, ArrowDown, CopyDocument, Delete } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash'

defineOptions({
  name: 'ContainerComponent',
})

interface Props {
  props: Record<string, any>
  slots?: Record<string, any>
  componentCpt?: any
  componentMap: Record<string, any>
  item: any
}

const props = withDefaults(defineProps<Props>(), {
  props: () => ({}),
  slots: () => ({}),
  componentMap: () => ({}),
  item: () => ({}),
})

const dataInner: any = ref({})
const componentListInner = ref<any[]>([])
const selectedComponent = ref<any>(null)
// 内部缓存数据赋值
watch(
  props,
  newVal => {
    // console.log('newVal')
    // console.log(newVal)

    dataInner.value = newVal
    // componentListInner.value = newVal.componentList
  },
  {
    immediate: true,
    deep: true,
  }
)

// 向主数据内追加容器内的 组件list
watch(
  () => componentListInner,
  newVal => {
    const newValClone: any = cloneDeep(toRaw(newVal.value))
    newValClone.forEach((item: any) => {
      delete item.componentCpt
    })
    ;(props.item as any).componentList = newValClone
  },
  {
    deep: true,
  }
)

const containerStyle = computed(() => ({
  width: dataInner.value.props.width || 'auto',
  height: dataInner.value.props.height || 'auto',
  padding: `${dataInner.value.props.padding || 10}px`,
  backgroundColor: dataInner.value.props.backgroundColor || '#ffffff',
  border: '1px solid #e9ecef',
  // borderRadius: '4px',
}))

// tailwind样式-预置
const tailWind = {
  flexRowCenter: 'flex flex-row justify-center items-center', // 横向水平居中
  flexRowStart: 'flex flex-row justify-start items-center', // 横向水平靠左
  flexRowBetween: 'flex flex-row justify-between items-center', // 横向水平靠两边
  flexRowEnd: 'flex flex-row justify-end items-center', // 横向水平靠右
  flexColCenter: 'flex flex-col justify-center items-center', // 纵向水平居中
  flexColStart: 'flex flex-col justify-start items-center', // 纵向水平靠上
  flexColBetween: 'flex flex-col justify-between items-center', // 纵向水平靠上下两边
  flexColEnd: 'flex flex-col justify-end items-center', // 纵向水平靠下
  textEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap', // 单行文本溢出省略号
}
const containerStyleClass = computed(() => {
  let cssClassStringArr: string[] = []

  const props = dataInner.value.props || {}

  if (props?.alignType === '1') {
    if (props?.alignType1DetailRow === 'left') {
      cssClassStringArr.push(tailWind.flexRowStart)
    } else if (props?.alignType1DetailRow === 'center') {
      cssClassStringArr.push(tailWind.flexRowCenter)
    } else if (props?.alignType1DetailRow === 'right') {
      cssClassStringArr.push(tailWind.flexRowEnd)
    } else if (props?.alignType1DetailRow === 'justify') {
      cssClassStringArr.push(tailWind.flexRowBetween)
    }

    if (props?.alignType1DetailCol) {
      // 清除掉原有的 'items-center' 类名
      cssClassStringArr = cssClassStringArr.map(item => item.replace(/items-center/g, ''))

      if (props?.alignType1DetailCol === 'top') {
        cssClassStringArr.push('items-start')
      } else if (props?.alignType1DetailCol === 'center') {
        cssClassStringArr.push('items-center')
      } else if (props?.alignType1DetailCol === 'bottom') {
        cssClassStringArr.push('items-end')
      }
    }
  } else if (props?.alignType === '2') {
    if (props?.alignType2DetailRow === 'top') {
      cssClassStringArr.push(tailWind.flexColStart)
    } else if (props?.alignType2DetailRow === 'center') {
      cssClassStringArr.push(tailWind.flexColCenter)
    } else if (props?.alignType2DetailRow === 'bottom') {
      cssClassStringArr.push(tailWind.flexColEnd)
    } else if (props?.alignType2DetailRow === 'justify') {
      cssClassStringArr.push(tailWind.flexColBetween)
    }

    if (props?.alignType2DetailCol) {
      // 清除掉原有的 'items-center' 类名
      cssClassStringArr = cssClassStringArr.map(item => item.replace(/items-center/g, ''))

      if (props?.alignType2DetailCol === 'left') {
        cssClassStringArr.push('items-start')
      } else if (props?.alignType2DetailCol === 'center') {
        cssClassStringArr.push('items-center')
      } else if (props?.alignType2DetailCol === 'right') {
        cssClassStringArr.push('items-end')
      }
    }
  }

  // 处理换行tailwind的class类
  if (props?.alignTypeWrap) {
    cssClassStringArr.push('flex-wrap')
  }

  const cssClassString = cssClassStringArr.join(' ')
  return cssClassString
})

/* 子组件调用 */
// 所有逻辑集中在最顶层处理 接受父组件的provide方法
const parentProvide = inject('parentProvide')

// 获取当前组件实例
const instance = getCurrentInstance()

// 生成唯一ID
const generateId = () => {
  return 'component_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}
// 处理拖拽放置
const handleDropContainer = (event: DragEvent, component: any) => {
  event.preventDefault()
  event.stopPropagation()

  // 如果不是容器组件，则不处理
  if (component.props && component.props.width === undefined) return

  try {
    const moduleData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}') as any

    if (moduleData.type) {
      const newComponent: any = {
        id: generateId(),
        type: moduleData.type,
        component: moduleData.component,
        componentCpt:
          moduleData.component === 'ContainerComponent'
            ? instance?.type // 使用当前组件实例的type作为自己的引用
            : dataInner.value.componentMap[moduleData.component],
        props: { ...moduleData.defaultProps },
      }

      // 如果组件列表不存在，则创建一个
      if (!componentListInner.value) {
        componentListInner.value = []
      }
      componentListInner.value.push(newComponent)
    }
  } catch (error) {
    console.error('解析拖拽数据失败:', error)
  }
}

// 上移组件
const moveUp = (index: number) => {
  if (index > 0) {
    const newComponents = [...componentListInner.value]
    ;[newComponents[index - 1], newComponents[index]] = [
      newComponents[index],
      newComponents[index - 1],
    ]
    componentListInner.value = newComponents
  }
}

// 下移组件
const moveDown = (index: number) => {
  if (index < componentListInner.value.length - 1) {
    const newComponents = [...componentListInner.value]
    ;[newComponents[index], newComponents[index + 1]] = [
      newComponents[index + 1],
      newComponents[index],
    ]
    componentListInner.value = newComponents
  }
}

// 复制组件
const duplicateComponent = (component: any) => {
  const newComponent: any = {
    ...component,
    id: generateId(),
  }
  componentListInner.value = [...componentListInner.value, newComponent]
  selectComponent(newComponent)
}

// 删除组件
const removeComponent = (index: number) => {
  componentListInner.value = componentListInner.value.filter((_, i) => i !== index)
  if (
    selectedComponent.value &&
    componentListInner.value.findIndex(c => c.id === selectedComponent.value?.id) === -1
  ) {
    selectedComponent.value = null
  }
}

// 选择组件
const selectComponent = (component: any) => {
  console.log('selectComponent-1')

  eventBus.emit('close-component-toolbar', null)

  // 缓存当前选中的组件
  selectedComponent.value = component

  // 唤起右侧配置模块
  ;(parentProvide as any).handleSelectComponent(component)
}

const documentClick = () => {
  selectedComponent.value = null
}

// const changeContainerCptFunc = (changeData: any) => {
//   console.log('changeData-ContainerComponent', changeData)
//   // dataInner.value = {
//   //   ...dataInner.value,
//   //   ...changeData,
//   // }
// }
onMounted(() => {
  document.addEventListener('click', documentClick)
  eventBus.on('close-component-toolbar-inner', documentClick)
  eventBus.on('close-component-toolbar', documentClick)
  // eventBus.on('changeContainerCpt', changeContainerCptFunc)
})
onUnmounted(() => {
  document.removeEventListener('click', documentClick)
  eventBus.off('close-component-toolbar-inner', documentClick)
  eventBus.off('close-component-toolbar', documentClick)
  // eventBus.off('changeContainerCpt', changeContainerCptFunc)
})

// Expose methods for parent component
defineExpose({
  selectComponent,
})
</script>

<style lang="scss" scoped>
.container-component {
  min-height: 50px;
  .component-wrapper-inner {
    // width: 100%;
    // border: 2px solid transparent;
    // border-radius: 4px;
    position: relative;
    // margin: 2px;

    &:hover {
      border-color: #e9ecef;
      // border-radius: 6px;
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
  }
}
</style>
