<template>
  <el-dialog v-model="visible" title="解析 Git 仓库" width="600px" :close-on-click-modal="false">
    <div class="git-download-form">
      <div class="form-item">
        <label class="form-label">仓库地址</label>
        <el-input
          v-model="formData.repositoryUrl"
          placeholder="请输入 Git 仓库地址"
          class="form-input"
        />
        <div class="form-tip">示例: https://gitee.com/redorc/scaffold-2025.git</div>
      </div>

      <!-- <div class="form-item">
        <label class="form-label">下载路径</label>
        <div class="path-input-group">
          <el-input
            v-model="formData.targetPath"
            placeholder="请选择下载路径"
            readonly
            class="form-input"
          />
          <el-button
            type="primary"
            @click="chooseDownloadPath"
            class="path-select-btn"
          >
            选择路径
          </el-button>
        </div>
        <div class="form-tip">示例: ~/UWORK-PLUS-dev</div>
      </div> -->

      <div class="form-item" v-if="downloadStatus">
        <label class="form-label">解析状态</label>
        <div class="status-display">
          <el-tag :type="getStatusType()">{{ downloadStatus.message }}</el-tag>
          <div v-if="downloadStatus.data?.path" class="path-info">
            解析路径: {{ downloadStatus.data.path }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleDownload" :loading="isDownloading">
          {{ isDownloading ? '解析中...' : '开始解析' }}
        </el-button>
      </div>
    </template>

    <Terminal ref="terminalRef" />
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { jsBridge, isInElectron } from '@/utils/electron'
  import Terminal from '@/components/terminal/Terminal.vue'
  import CodeDirListService from '../utils/sqlOperate'

  interface DownloadForm {
    repositoryUrl: string
    targetPath: string
  }

  interface DownloadStatus {
    code: number
    message: string
    data?: any
  }

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success', data: any): void
    (e: 'error', error: any): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
  })

  const emit = defineEmits<Emits>()

  const terminalRef = ref<InstanceType<typeof Terminal>>()

  // 弹窗显示状态
  const visible = ref(false)

  // 表单数据
  const formData = ref<DownloadForm>({
    repositoryUrl: '',
    targetPath: '',
  })

  // 下载状态
  const downloadStatus = ref<DownloadStatus | null>(null)
  const isDownloading = ref(false)

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    newVal => {
      visible.value = newVal
      if (newVal) {
        // 重置状态
        downloadStatus.value = null
        isDownloading.value = false
      }
    }
  )

  // 监听 visible 变化
  watch(visible, newVal => {
    emit('update:modelValue', newVal)
  })

  // 选择下载路径
  const chooseDownloadPath = () => {
    if (!isInElectron()) {
      ElMessage.warning('请在 Electron 环境中使用此功能')
      return
    }

    jsBridge.register({
      method: 'choosePath',
      json: {},
      callback: (result: any) => {
        if (result && result.path) {
          formData.value.targetPath = result.path
          ElMessage.success('路径选择成功')
        }
      },
    })
  }

  // 获取状态类型
  const getStatusType = () => {
    if (!downloadStatus.value) return 'info'

    switch (downloadStatus.value.code) {
      case 0:
        return 'success'
      case 1:
        return 'warning'
      case 2:
      case 3:
        return 'danger'
      default:
        return 'info'
    }
  }

  // 开始下载
  const handleDownload = async () => {
    if (!isInElectron()) {
      ElMessage.warning('请在 Electron 环境中使用此功能')
      return
    }

    if (isDownloading.value) {
      return
    }

    if (!formData.value.repositoryUrl.trim()) {
      ElMessage.warning('请输入仓库地址')
      return
    }

    // HTTPS 校验
    // const url = formData.value.repositoryUrl.trim()
    // if (!url.startsWith('https://')) {
    //   ElMessage.warning('请使用 HTTPS 协议的仓库地址')
    //   return
    // }

    // 先测试仓库连通性
    isDownloading.value = true
    downloadStatus.value = {
      code: 0,
      message: '正在测试仓库连通性...',
    }

    try {
      // 调用 Electron 方法测试仓库连通性
      const testResult = (await jsBridge.registerSync({
        method: 'testGitRepository',
        json: {
          repositoryUrl: formData.value.repositoryUrl,
        },
      })) as { success: boolean; message?: string }

      if (!testResult.success) {
        isDownloading.value = false
        downloadStatus.value = {
          code: 2,
          message: testResult.message || '仓库地址无法访问，请检查地址是否正确或网络连接',
        }
        ElMessage.error(testResult.message || '仓库地址无法访问，请检查地址是否正确或网络连接')

        await downloadGitRepositoryByTerminal()
        return
      }

      downloadGitRepository(downloadStatus, isDownloading)
    } catch (error) {
      isDownloading.value = false
      downloadStatus.value = {
        code: 3,
        message: '连通性测试失败，请稍后重试',
      }
      ElMessage.error('连通性测试失败，请稍后重试')
      console.error('Git 仓库连通性测试失败:', error)

      await downloadGitRepositoryByTerminal()
    }
  }

  async function downloadGitRepositoryByTerminal() {
    const homePath = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    const targetPath = `${(homePath as any).data}/codeDirGitStore`
    const command = `cd ${targetPath} && pwd && git clone ${formData.value.repositoryUrl}`
    terminalRef.value?.executeWithModal(command)
  }

  async function createProject(data) {
    const newItem = {
      ...data,
      name: data.path.split('/').pop(),
      path: data.path,
      type: 'directory',
      projectData: [],
    }
    delete newItem.output
    await CodeDirListService.create(newItem)
  }
  async function downloadGitRepository(downloadStatus, isDownloading) {
    // 连通性测试通过，开始下载
    downloadStatus.value = {
      code: 0,
      message: '连通性测试通过，正在解析仓库...',
    }

    const homePath = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    const targetPath = `${(homePath as any).data}/codeDirGitStore`

    jsBridge.register({
      method: 'downloadGitRepository',
      json: {
        repositoryUrl: formData.value.repositoryUrl,
        targetPath: targetPath,
      },
      callback: (result: any) => {
        // isDownloading.value = false;
        downloadStatus.value = result

        if (result.code === 0) {
          ElMessage.success('仓库解析成功！')
          console.log('result.data')
          console.log(result.data)

          createProject(result.data)

          emit('success', result.data)
          // 延迟关闭弹窗，让用户看到成功信息
          setTimeout(() => {
            handleClose()
          }, 1200)
        } else if (result.code === 1) {
          ElMessage.warning(result.message)
          isDownloading.value = false
        } else {
          ElMessage.error(result.message)
          isDownloading.value = false
        }
      },
    })
  }

  // 取消
  const handleCancel = () => {
    handleClose()
  }

  // 关闭弹窗
  const handleClose = () => {
    visible.value = false
    // 重置状态
    downloadStatus.value = null
    isDownloading.value = false

    formData.value.repositoryUrl = ''
  }
</script>

<style lang="scss" scoped>
  .git-download-form {
    .form-item {
      margin-bottom: 20px;

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .form-input {
        width: 100%;
      }

      .form-tip {
        margin-top: 4px;
        font-size: 12px;
        color: #999;
      }

      .path-input-group {
        display: flex;
        gap: 12px;
        align-items: flex-end;

        .form-input {
          flex: 1;
        }

        .path-select-btn {
          white-space: nowrap;
        }
      }

      .status-display {
        overflow-x: auto;
        .path-info {
          margin-top: 8px;
          font-size: 12px;
          color: #666;
          word-break: break-all;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  // 响应式设计
  @media (max-width: 768px) {
    .path-input-group {
      flex-direction: column;
      align-items: stretch;

      .path-select-btn {
        margin-top: 8px;
      }
    }
  }
</style>
