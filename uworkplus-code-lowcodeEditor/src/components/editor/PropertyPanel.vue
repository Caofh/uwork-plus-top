<template>
  <div class="property-panel" @click.stop>
    <div class="property-header">
      <h3 class="text-lg font-semibold text-gray-800">属性设置</h3>
    </div>
    <div class="property-content">
      <!-- 无选中组件时的状态 -->
      <div v-if="!selectedComponent" class="no-selection">
        <div class="no-selection-content">
          <el-icon size="32"><InfoFilled /></el-icon>
          <p>请选择一个组件进行编辑</p>
        </div>
      </div>

      <!-- 选中组件时的属性编辑 -->
      <div v-else class="property-form">
        <div class="component-info">
          <h4 class="component-name">{{ getComponentName(selectedComponent.type) }}</h4>
          <p class="component-type">{{ selectedComponent.type }}</p>
        </div>

        <div class="property-sections">
          <!-- 基础属性 -->
          <div class="property-section">
            <div class="section-title">基础属性</div>
            <div class="section-content">
              <!-- 文本组件属性 -->
              <template v-if="selectedComponent.type === 'text'">
                <div class="property-item">
                  <label class="property-label">文本内容</label>
                  <el-input
                    v-model="selectedComponent.props.text"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入文本内容"
                  />
                </div>
                <div class="property-item">
                  <label class="property-label">字体大小</label>
                  <el-input-number
                    v-model="selectedComponent.props.fontSize"
                    :min="12"
                    :max="72"
                    controls-position="right"
                  />
                </div>
                <div class="property-item">
                  <label class="property-label">文字颜色</label>
                  <el-color-picker v-model="selectedComponent.props.color" />
                </div>
                <div class="property-item">
                  <label class="property-label">对齐方式</label>
                  <el-select
                    v-model="selectedComponent.props.textAlign"
                    placeholder="请选择对齐方式"
                  >
                    <el-option label="左对齐" value="left" />
                    <el-option label="居中" value="center" />
                    <el-option label="右对齐" value="right" />
                  </el-select>
                </div>
              </template>

              <!-- 按钮组件属性 -->
              <template v-else-if="selectedComponent.type === 'button'">
                <div class="property-item">
                  <label class="property-label">按钮文字</label>
                  <el-input v-model="selectedComponent.props.text" placeholder="请输入按钮文字" />
                </div>
                <div class="property-item">
                  <label class="property-label">按钮类型</label>
                  <el-select v-model="selectedComponent.props.type" placeholder="请选择按钮类型">
                    <el-option label="主要按钮" value="primary" />
                    <el-option label="成功按钮" value="success" />
                    <el-option label="信息按钮" value="info" />
                    <el-option label="警告按钮" value="warning" />
                    <el-option label="危险按钮" value="danger" />
                  </el-select>
                </div>
                <div class="property-item">
                  <label class="property-label">按钮尺寸</label>
                  <el-select v-model="selectedComponent.props.size" placeholder="请选择按钮尺寸">
                    <el-option label="大" value="large" />
                    <el-option label="默认" value="default" />
                    <el-option label="小" value="small" />
                  </el-select>
                </div>
              </template>

              <!-- 容器组件属性 -->
              <template v-else-if="selectedComponent.type === 'container'">
                <div class="property-item">
                  <label class="property-label">宽度</label>
                  <el-input
                    v-model="selectedComponent.props.width"
                    placeholder="例如: 100% 或 200px"
                  />
                </div>
                <div class="property-item">
                  <label class="property-label">高度</label>
                  <el-input
                    v-model="selectedComponent.props.height"
                    placeholder="例如: auto 或 100px"
                  />
                </div>
                <div class="property-item">
                  <label class="property-label">内边距</label>
                  <el-input-number
                    v-model="selectedComponent.props.padding"
                    :min="0"
                    :max="100"
                    controls-position="right"
                  />
                </div>
                <div class="property-item">
                  <label class="property-label">背景颜色</label>
                  <el-color-picker v-model="selectedComponent.props.backgroundColor" />
                </div>
                <div class="property-item">
                  <label class="property-label">对齐方式(Flex布局)</label>
                  <el-radio
                    v-model="selectedComponent.props.alignType"
                    value="1"
                    label="水平对齐"
                  />
                  <el-radio
                    v-model="selectedComponent.props.alignType"
                    value="2"
                    label="垂直对齐"
                  />
                  <div class="mt-[10px]" v-if="selectedComponent.props.alignType === '1'">
                    <div :class="[tailWind.flexRowStart, 'mb-[10px;]']">
                      <div class="mr-[5px] text-[12px]">水平方向</div>
                      <div class="flex-1">
                        <el-select
                          v-model="selectedComponent.props.alignType1DetailRow"
                          placeholder="请选择对齐方式"
                        >
                          <el-option label="居左" value="left" />
                          <el-option label="居中" value="center" />
                          <el-option label="居右" value="right" />
                          <el-option label="两端对齐" value="justify" />
                        </el-select>
                      </div>
                    </div>
                    <div :class="[tailWind.flexRowStart]">
                      <div class="mr-[5px] text-[12px]">垂直方向</div>
                      <div class="flex-1">
                        <el-select
                          v-model="selectedComponent.props.alignType1DetailCol"
                          placeholder="请选择垂直对齐方式"
                        >
                          <el-option label="靠上" value="top" />
                          <el-option label="居中" value="center" />
                          <el-option label="靠下" value="bottom" />
                        </el-select>
                      </div>
                    </div>
                  </div>
                  <div class="mt-[10px]" v-if="selectedComponent.props.alignType === '2'">
                    <div :class="[tailWind.flexRowStart, 'mb-[10px;]']">
                      <div class="mr-[5px] text-[12px]">垂直方向</div>
                      <div class="flex-1">
                        <el-select
                          v-model="selectedComponent.props.alignType2DetailRow"
                          placeholder="请选择对齐方式"
                        >
                          <el-option label="靠上" value="top" />
                          <el-option label="居中" value="center" />
                          <el-option label="靠下" value="bottom" />
                          <el-option label="两端对齐" value="justify" />
                        </el-select>
                      </div>
                    </div>
                    <div :class="[tailWind.flexRowStart]">
                      <div class="mr-[5px] text-[12px]">水平方向</div>
                      <div class="flex-1">
                        <el-select
                          v-model="selectedComponent.props.alignType2DetailCol"
                          placeholder="请选择水平对齐方式"
                        >
                          <el-option label="居左" value="left" />
                          <el-option label="居中" value="center" />
                          <el-option label="居右" value="right" />
                        </el-select>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="property-item">
                  <label class="property-label">是否换行(flex布局)</label>
                  <el-checkbox
                    v-model="selectedComponent.props.alignTypeWrap"
                    label="是否换行"
                  ></el-checkbox>
                </div>
              </template>
            </div>
          </div>

          <!-- 样式属性 -->
          <!-- <div class="property-section">
            <div class="section-title">样式设置</div>
            <div class="section-content">
              <div class="property-item">
                <label class="property-label">外边距</label>
                <div class="margin-controls">
                  <el-input-number
                    v-model="marginTop"
                    :min="0"
                    :max="100"
                    placeholder="上"
                    size="small"
                  />
                  <el-input-number
                    v-model="marginRight"
                    :min="0"
                    :max="100"
                    placeholder="右"
                    size="small"
                  />
                  <el-input-number
                    v-model="marginBottom"
                    :min="0"
                    :max="100"
                    placeholder="下"
                    size="small"
                  />
                  <el-input-number
                    v-model="marginLeft"
                    :min="0"
                    :max="100"
                    placeholder="左"
                    size="small"
                  />
                </div>
              </div>
              <div class="property-item">
                <label class="property-label">边框</label>
                <div class="border-controls">
                  <el-input-number
                    v-model="borderWidth"
                    :min="0"
                    :max="10"
                    placeholder="宽度"
                    size="small"
                  />
                  <el-select v-model="borderStyle" size="small" style="width: 80px">
                    <el-option label="实线" value="solid" />
                    <el-option label="虚线" value="dashed" />
                    <el-option label="点线" value="dotted" />
                  </el-select>
                  <el-color-picker v-model="borderColor" size="small" />
                </div>
              </div>
            </div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import eventBus from '@/utils/eventBus'
import { cloneDeep } from 'lodash'
import { tailWind } from '@/utils/tailwind'

interface PageComponent {
  id?: string
  type?: string
  component?: string
  props?: Record<string, any>
}

interface Props {
  selectedCpt: PageComponent | null
}

const props = defineProps<Props>()

const selectedComponent = ref<PageComponent>({})

// 响应式数据
const marginTop = ref(0)
const marginRight = ref(0)
const marginBottom = ref(0)
const marginLeft = ref(0)
const borderWidth = ref(0)
const borderStyle = ref('solid')
const borderColor = ref('#e9ecef')

// 获取组件名称
const getComponentName = (type: string) => {
  const nameMap: Record<string, string> = {
    text: '文本',
    button: '按钮',
    container: '容器',
    image: '图片',
    input: '输入框',
    select: '选择器',
    row: '行',
    col: '列',
  }
  return nameMap[type] || type
}

// 监听组件变化，缓存数据 => selectedComponent
watch(
  () => props.selectedCpt,
  newComponent => {
    if (newComponent) {
      // 重置样式属性到默认值
      marginTop.value = 0
      marginRight.value = 0
      marginBottom.value = 0
      marginLeft.value = 0
      borderWidth.value = 0
      borderStyle.value = 'solid'
      borderColor.value = '#e9ecef'

      console.log('newComponent')
      console.log(newComponent)

      // 断开数据，深拷贝，遵循单项数据流。
      // selectedComponent.value = cloneDeep(newComponent)
      selectedComponent.value = newComponent
    }
  },
  { immediate: true, deep: true }
)

// 监听 配置模块内容改变，向画板区域发送改变事件。
// watch(
//   selectedComponent,
//   newComponent => {
//     // 向组件发送数据
//     if (newComponent.type === 'text') {
//       eventBus.emit('changeTextCpt', newComponent)
//     } else if (newComponent.type === 'container') {
//       eventBus.emit('changeContainerCpt', newComponent)
//     }
//   },
//   {
//     immediate: true,
//     deep: true,
//   }
// )
</script>

<style lang="scss" scoped>
.property-panel {
  height: 100%;
  background: #f8f9fa;
  border-left: 1px solid #e9ecef;
  overflow-y: auto;

  .property-header {
    padding: 16px;
    border-bottom: 1px solid #e9ecef;
    background: #ffffff;
  }

  .property-content {
    padding: 16px;
  }
}

.no-selection {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  .no-selection-content {
    text-align: center;
    color: #999999;

    i {
      font-size: 32px;
      margin-bottom: 12px;
      display: block;
    }

    p {
      font-size: 14px;
      margin: 0;
    }
  }
}

.property-form {
  .component-info {
    margin-bottom: 20px;
    padding: 12px;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #e9ecef;

    .component-name {
      font-size: 16px;
      font-weight: 600;
      color: #333333;
      margin: 0 0 4px 0;
    }

    .component-type {
      font-size: 12px;
      color: #666666;
      margin: 0;
    }
  }
}

.property-sections {
  .property-section {
    margin-bottom: 20px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e9ecef;
    }

    .section-content {
      .property-item {
        margin-bottom: 16px;

        .property-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #555555;
          margin-bottom: 6px;
        }

        .margin-controls,
        .border-controls {
          display: flex;
          gap: 6px;
          align-items: center;

          .el-input-number {
            width: 60px;
          }
        }
      }
    }
  }
}
</style>
