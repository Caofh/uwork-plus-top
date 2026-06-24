<template>
  <el-dialog
    v-model="visible"
    title="项目配置"
    width="500px"
    :close-on-click-modal="false"
    class="project-dialog"
    @close="handleClose"
  >
    <div class="dialog-content">
      <div class="form-item">
        <label class="form-label">项目名称</label>
        <el-input v-model="formData.name" placeholder="请输入项目名称" class="form-input" />
      </div>

      <div class="form-item">
        <label class="form-label">项目路径</label>
        <div class="path-input-group">
          <el-input
            v-model="formData.path"
            placeholder="请选择项目路径"
            readonly
            class="form-input"
          />
          <el-button type="primary" @click="chooseProjectPath" class="path-select-btn">
            选择路径
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { jsBridge, isInElectron } from '../../../utils/electron'

  // 定义组件名称
  defineOptions({
    name: 'ProjectDialog',
  })

  interface ProjectData {
    name: string
    path: string
  }

  interface Props {
    modelValue: boolean
    project?: any
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', data: ProjectData): void
    (e: 'cancel'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    project: null,
  })

  const emit = defineEmits<Emits>()

  // 弹窗显示状态
  const visible = ref(false)

  // 表单数据
  const formData = ref<ProjectData>({
    name: '',
    path: '',
  })

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    newVal => {
      console.log('ProjectDialog - modelValue changed:', newVal)
      visible.value = newVal
      if (newVal && props.project) {
        // 设置初始数据
        formData.value = {
          name: props.project.name || '',
          path: props.project.path || '',
        }
        console.log('ProjectDialog - formData set:', formData.value)
      }
    }
  )

  // 监听 visible 变化
  watch(visible, newVal => {
    emit('update:modelValue', newVal)
  })

  // 选择路径
  const chooseProjectPath = () => {
    if (!isInElectron()) {
      ElMessage.warning('请在 Electron 环境中使用此功能')
      return
    }

    console.log('调用 jsBridge.register 选择路径')
    jsBridge.register({
      method: 'choosePath',
      json: {},
      callback: (result: any) => {
        console.log('路径选择回调结果:', result)
        if (result && result.path) {
          formData.value.path = result.path
          // ElMessage.success("路径选择成功");
        } else {
          console.log('没有选择路径或选择被取消')
        }
      },
    })
  }

  // 确认
  const handleConfirm = async () => {
    if (!formData.value.name.trim()) {
      ElMessage.warning('请输入项目名称')
      return
    }

    if (!formData.value.path.trim()) {
      ElMessage.warning('请选择项目路径')
      return
    }

    const targetPath = `${formData.value.path}/${formData.value.name}`
    const exists: any = await jsBridge.registerSync({
      method: 'existsSync',
      json: {
        path: targetPath,
      },
    })
    if (exists.data) {
      ElMessage.error('目标路径已存在')
      return
    }

    emit('confirm', { ...formData.value })
    handleClose()
  }

  // 取消
  const handleCancel = () => {
    emit('cancel')
    handleClose()
  }

  // 关闭弹窗
  const handleClose = () => {
    visible.value = false
    // 重置表单数据
    formData.value = {
      name: '',
      path: '',
    }
  }
</script>

<style lang="scss" scoped>
  .project-dialog {
    :deep(.el-dialog) {
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 8px;
      color: #e0e0e0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);

      .el-dialog__header {
        border-bottom: 1px solid #2e2e2e;
        padding: 14px 20px;

        .el-dialog__title {
          color: #f0f0f0;
          font-weight: 600;
          font-size: 15px;
        }
      }

      .el-dialog__body {
        padding: 20px;
      }

      .el-dialog__footer {
        border-top: 1px solid #2e2e2e;
        padding: 12px 20px;
      }
    }

    .dialog-content {
      .form-item {
        margin-bottom: 18px;

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #bdbdbd;
        }

        .form-input {
          :deep(.el-input__wrapper) {
            background: #252525;
            border: 1px solid #2e2e2e;
            border-radius: 6px;
            box-shadow: none;

            &:hover {
              background: #2a2a2a;
              border-color: #3a3a3a;
            }

            &.is-focus {
              border-color: #64b5f6;
              background: #2a2a2a;
              box-shadow: none;
            }
          }

          :deep(.el-input__inner) {
            color: #e0e0e0;

            &::placeholder {
              color: #757575;
            }
          }
        }

        .path-input-group {
          display: flex;
          gap: 10px;
          align-items: flex-end;

          .form-input {
            flex: 1;
          }

          .path-select-btn {
            border-radius: 6px;
            white-space: nowrap;
          }
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .el-button {
        border-radius: 6px;

        &:not(.el-button--primary) {
          background: #252525;
          border: 1px solid #2e2e2e;
          color: #bdbdbd;

          &:hover {
            background: #2a2a2a;
            color: #e0e0e0;
            border-color: #3a3a3a;
          }
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .project-dialog {
      :deep(.el-dialog) {
        width: 90% !important;
        margin: 5vh auto;
      }

      .path-input-group {
        flex-direction: column;
        align-items: stretch;

        .path-select-btn {
          margin-top: 8px;
        }
      }
    }
  }
</style>
