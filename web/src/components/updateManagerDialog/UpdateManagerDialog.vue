<template>
  <el-dialog
    v-model="visible"
    title="软件更新"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="update-dialog"
  >
    <div class="update-content">
      <div v-if="updateCompleted && !updateCompletedFailed">
        <!-- 更新完成 -->
        <div v-if="updateCompleted" class="update-completed">
          <div class="success-header">
            <el-icon class="success-icon">
              <CircleCheck />
            </el-icon>
            <h3>新版本下载完成！</h3>
          </div>
          <p class="success-desc">新版本 {{ updateInfo.version }} 已下载完成，是否立即安装。</p>
          <div class="success-actions">
            <el-button type="primary" @click="restartApp">立即安装</el-button>
            <el-button @click="closeDialog">稍后安装</el-button>
          </div>
        </div>
      </div>
      <div v-else-if="updateCompletedFailed">
        <!-- 更新失败 -->
        <div class="update-completed">
          <div class="success-header">
            <el-icon class="success-icon" style="color: #ff0000">
              <CircleClose />
            </el-icon>
            <h3 style="color: #ff0000">下载失败！</h3>
          </div>
          <p class="success-desc">新版本 {{ updateInfo.version }} 下载失败。</p>
          <div class="success-actions">
            <el-button type="primary" @click="reDownloadApp">重新下载</el-button>
            <el-button @click="closeDialog">关闭</el-button>
          </div>
        </div>
      </div>
      <div v-else>
        <!-- 更新信息 -->
        <div v-if="!isDownloading && !isInstalling" class="update-info">
          <div class="version-info">
            <el-icon class="update-icon">
              <Download />
            </el-icon>
            <div class="version-details">
              <h3>发现新版本 {{ updateInfo.version }}</h3>
              <p class="version-desc">{{ updateInfo.description }}</p>
              <p class="version-size">文件大小: {{ formatFileSize(updateInfo.size) }}</p>
            </div>
          </div>

          <div class="update-actions">
            <el-button type="primary" @click="startDownload" :loading="isDownloading">
              立即更新
            </el-button>
            <el-button @click="closeDialog">稍后更新</el-button>
          </div>
        </div>

        <!-- 下载进度 -->
        <div v-if="isDownloading" class="download-progress">
          <div class="progress-header">
            <el-icon class="download-icon">
              <Download />
            </el-icon>
            <span>正在下载更新包...</span>
          </div>

          <el-progress
            :percentage="downloadProgress"
            :status="downloadStatus"
            :stroke-width="8"
            class="progress-bar"
          />

          <div class="progress-details">
            <span class="progress-text">{{ downloadProgress }}%</span>
            <span class="speed-text" v-if="downloadSpeed">
              {{ formatFileSize(downloadSpeed) }}/s
            </span>
          </div>

          <div class="progress-actions">
            <el-button @click="cancelDownload" :disabled="!canCancel">取消下载</el-button>
          </div>
        </div>

        <!-- 安装进度 -->
        <div v-if="isInstalling" class="install-progress">
          <div class="progress-header">
            <el-icon class="install-icon">
              <Setting />
            </el-icon>
            <span>正在安装更新...</span>
          </div>

          <el-progress
            :percentage="installProgress"
            status="success"
            :stroke-width="8"
            class="progress-bar"
          />

          <div class="progress-details">
            <span class="progress-text">{{ installProgress }}%</span>
            <span class="status-text">{{ installStatus }}</span>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-if="updateError" class="update-error">
          <div class="error-header">
            <el-icon class="error-icon">
              <CircleClose />
            </el-icon>
            <h3>更新失败</h3>
          </div>
          <p class="error-desc">{{ errorMessage }}</p>
          <div class="error-actions">
            <el-button type="primary" @click="retryUpdate">重试</el-button>
            <el-button @click="closeDialog">关闭</el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
  import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
  import { Download, Setting, CircleCheck, CircleClose, Warning } from '@element-plus/icons'
  import { ElMessage } from 'element-plus'
  import {
    jsBridge,
    checkUpdate,
    installUpdate,
    downloadUpdate,
    downloadUpdateWithProgress,
    downloadRemoteFile,
    getUpdateStatus,
    getChipInfo
  } from '@/utils/electron'

  // Props
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    demo: {
      type: Boolean,
      default: false,
    },
    autoDemo: {
      type: Boolean,
      default: false,
    },
    updateDetail: {
      type: Object,
      default: () => ({}),
    },
  })

  // Emits
  const emit = defineEmits(['update:modelValue'])

  // 响应式数据
  const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const updateInfo = reactive({
    version: '',
    description: '',
    size: 0,
    downloadUrl: '',
  })

  const isDownloading = ref(false)
  const isInstalling = ref(false)
  const updateCompleted = ref(false)
  const updateCompletedFailed = ref(false)
  const updateError = ref(false)
  const errorMessage = ref('')

  const downloadProgress = ref(0)
  const downloadSpeed = ref(0)
  const downloadStatus = ref('')
  const canCancel = ref(true)

  const installProgress = ref(0)
  const installStatus = ref('准备安装...')

  const downloadId = ref('')
  const downloadPath = ref('') // 下载文件路径path

  // 获取当前Mac电脑芯片类型（apple 或 inter）
  const chipInfo = getChipInfo()
  const DOWNLOAD_PATH = chipInfo === 'Apple' ? 'downloadUrl' : 'downloadUrlInter'
  const NAME_PATH = chipInfo === 'Apple' ? 'name' : 'nameInter'
  const SIZE_PATH = chipInfo === 'Apple' ? 'size' : 'sizeInter'

  // 模拟下载进度更新
  let downloadInterval = null
  let installInterval = null

  const checkDownloadStatus = async updateInfo => {
    const { data } = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })

    const packagePath = `${data}/cache/dmg/${updateInfo.name}`
    downloadPath.value = packagePath
    const exists = await jsBridge.registerSync({
      method: 'existsSync',
      json: {
        path: packagePath,
      },
    })
    // 存在说明，安装包已经下载完成，但是尚未安装，直接展示去安装弹窗
    if (exists.data) {
      updateCompleted.value = true
      updateCompletedFailed.value = false
    }
  }

  watch(
    () => props.updateDetail,
    (newVal, oldVal) => {
      updateInfo.version = newVal?.version
      updateInfo.description = newVal?.description
      updateInfo.size = newVal?.[SIZE_PATH]
      updateInfo.downloadUrl = newVal?.[DOWNLOAD_PATH]
      updateInfo.name = newVal?.[NAME_PATH]

      // 判断是否已经下载完新包
      checkDownloadStatus(updateInfo)
    },
    {
      immediate: true,
      deep: true,
    }
  )

  const reDownloadApp = () => {
    updateCompleted.value = false
    updateCompletedFailed.value = false
    isDownloading.value = false
    isInstalling.value = false
  }

  // 方法
  const startDownload = async () => {
    console.log('开始检查更新...')
    const updateResult = await checkUpdate()
    const { data } = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })

    isDownloading.value = true
    downloadProgress.value = 0
    downloadStatus.value = ''
    canCancel.value = true

    console.log('开始下载新包...', updateResult?.[DOWNLOAD_PATH])
    jsBridge.register({
      method: 'downloadRemoteFile',
      json: {
        url: updateResult?.[DOWNLOAD_PATH],
        targetPath: `${data}/cache/dmg/${updateResult?.[NAME_PATH]}`,
      },
      callback: data => {
        const { status, statusMessage } = data

        if (status === 'failed') {
          updateCompleted.value = false
          updateCompletedFailed.value = true
        } else {
          // 保存下载任务ID
          const downId = data.downloadId
          downloadId.value = downId

          try {
            // 模拟下载进度
            if (downloadProgress.value < 100) {
              downloadProgress.value = data.percent
              downloadSpeed.value = data.speed // 512KB - 1.5MB/s

              if (downloadProgress.value >= 100) {
                downloadProgress.value = 100
                downloadStatus.value = 'success'
                setTimeout(() => {
                  updateCompleted.value = true
                }, 500)
              }
            }
          } catch (error) {
            handleError('下载失败: ' + error.message)
          }
        }
      },
    })

    // const res = await downloadRemoteFile({
    //   url: updateInfo.downloadUrl,
    //   targetPath: './update.dmg',
    //   onProgressCallback: (progressValue) => {
    //     console.log(progressValue)
    //   }
    // })

    // try {
    //   isDownloading.value = true;
    //   downloadProgress.value = 0;
    //   downloadStatus.value = '';
    //   canCancel.value = true;

    //   // 模拟下载进度
    //   downloadInterval = setInterval(() => {
    //     if (downloadProgress.value < 100) {
    //       downloadProgress.value += Math.random() * 10;
    //       downloadSpeed.value = Math.floor(Math.random() * 1024 * 1024) + 512 * 1024; // 512KB - 1.5MB/s

    //       if (downloadProgress.value >= 100) {
    //         downloadProgress.value = 100;
    //         downloadStatus.value = 'success';
    //         clearInterval(downloadInterval);
    //         setTimeout(() => {
    //           startInstall();
    //         }, 500);
    //       }
    //     }
    //   }, 200);

    // } catch (error) {
    //   handleError('下载失败: ' + error.message);
    // }
  }

  const startInstall = () => {
    isDownloading.value = false
    isInstalling.value = true
    installProgress.value = 0
    installStatus.value = '准备安装...'

    // 模拟安装进度
    installInterval = setInterval(() => {
      if (installProgress.value < 100) {
        installProgress.value += Math.random() * 15

        if (installProgress.value < 30) {
          installStatus.value = '解压更新包...'
        } else if (installProgress.value < 60) {
          installStatus.value = '备份原文件...'
        } else if (installProgress.value < 90) {
          installStatus.value = '安装新文件...'
        } else {
          installStatus.value = '完成安装...'
        }

        if (installProgress.value >= 100) {
          installProgress.value = 100
          clearInterval(installInterval)
          setTimeout(() => {
            completeUpdate()
          }, 500)
        }
      }
    }, 300)
  }

  const completeUpdate = () => {
    // isInstalling.value = false;
    updateCompleted.value = true
  }

  const cancelDownload = () => {
    jsBridge.register({
      method: 'abortDownload',
      json: {
        downloadId: downloadId.value,
      },
    })

    // 删除下载文件
    if (downloadPath.value) {
      jsBridge.register({
        method: 'runTerminalCommand',
        json: {
          command: `rm -rf ${downloadPath.value}`,
        },
      })
    }

    // if (downloadInterval) {
    //   clearInterval(downloadInterval);
    //   downloadInterval = null;
    // }
    // isDownloading.value = false;
    // downloadProgress.value = 0;
    // downloadSpeed.value = 0;
    // canCancel.value = false;

    ElMessage.info('下载已取消')
  }

  const restartApp = async () => {
    // 这里应该调用Electron的API重启应用
    // ElMessage.success('应用即将重启...');
    // setTimeout(() => {
    //   closeDialog();
    // }, 1000);
    const { data } = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    const packagePath = `${data}/cache/dmg/${updateInfo.name}`
    // console.log('packagePath')
    // console.log(packagePath)

    // 发送命令（sh脚本内容）
    const shContent = `open ${packagePath}`
    window.electronAPI.runTerminalCommandStream(shContent)

    setTimeout(() => {
      jsBridge.register({
        method: 'closeApp',
      })
    }, 380)
  }

  const retryUpdate = () => {
    updateError.value = false
    errorMessage.value = ''
    startDownload()
  }

  const closeDialog = () => {
    visible.value = false
    resetState()
  }

  const resetState = () => {
    isDownloading.value = false
    isInstalling.value = false
    updateCompletedFailed.value = false
    updateCompleted.value = false
    updateError.value = false
    downloadProgress.value = 0
    installProgress.value = 0
    downloadSpeed.value = 0
    errorMessage.value = ''

    if (downloadInterval) {
      clearInterval(downloadInterval)
      downloadInterval = null
    }
    if (installInterval) {
      clearInterval(installInterval)
      installInterval = null
    }
  }

  const handleError = message => {
    updateError.value = true
    errorMessage.value = message
    isDownloading.value = false
    isInstalling.value = false
  }

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 模拟检查更新
  // const checkForUpdates = () => {
  //   if (props.demo) {
  //     // 演示模式的更新信息
  //     Object.assign(updateInfo, {
  //       version: '2.0.0',
  //       description: '全新界面设计，性能大幅提升，新增AI助手功能，支持插件系统',
  //       size: 128 * 1024 * 1024, // 128MB
  //       downloadUrl: 'https://example.com/update-v2.zip'
  //     });
  //   } else {
  //     // 真实模式的更新信息
  //     updateInfo.version = props.updateDetail?.version
  //     updateInfo.description = props.updateDetail?.description
  //     updateInfo.size = props.updateDetail?.size
  //     updateInfo.downloadUrl = props.updateDetail?.downloadUrl
  //   }
  // };

  // 自动演示功能
  const startAutoDemo = () => {
    if (!props.autoDemo) return

    setTimeout(() => {
      startDownload()
    }, 1000)
  }

  // 生命周期
  onMounted(() => {
    // checkForUpdates();

    if (props.autoDemo) {
      startAutoDemo()
    }
  })

  onUnmounted(() => {
    resetState()
  })
</script>

<style lang="scss" scoped>
  .update-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      .el-dialog__title {
        color: white;
        font-weight: 600;
      }
    }

    :deep(.el-dialog__body) {
      padding: 24px;
    }
  }

  .update-content {
    .update-info {
      .version-info {
        display: flex;
        align-items: flex-start;
        margin-bottom: 24px;

        .update-icon {
          font-size: 48px;
          color: #409eff;
          margin-right: 16px;
          margin-top: 4px;
        }

        .version-details {
          flex: 1;

          h3 {
            margin: 0 0 8px 0;
            color: #303133;
            font-size: 18px;
          }

          .version-desc {
            margin: 0 0 8px 0;
            color: #606266;
            line-height: 1.5;
          }

          .version-size {
            margin: 0;
            color: #909399;
            font-size: 14px;
          }
        }
      }

      .update-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
    }

    .download-progress,
    .install-progress {
      .progress-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .download-icon,
        .install-icon {
          font-size: 24px;
          color: #409eff;
          margin-right: 12px;
        }

        span {
          font-size: 16px;
          color: #303133;
          font-weight: 500;
        }
      }

      .progress-bar {
        margin-bottom: 16px;
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .progress-text {
          font-size: 16px;
          font-weight: 600;
          color: #409eff;
        }

        .speed-text,
        .status-text {
          font-size: 14px;
          color: #909399;
        }
      }

      .progress-actions {
        display: flex;
        justify-content: center;
      }
    }

    .update-completed {
      text-align: center;

      .success-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;

        .success-icon {
          font-size: 64px;
          color: #67c23a;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0;
          color: #67c23a;
          font-size: 20px;
        }
      }

      .success-desc {
        margin: 0 0 24px 0;
        color: #606266;
        line-height: 1.5;
      }

      .success-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
    }

    .update-error {
      text-align: center;

      .error-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;

        .error-icon {
          font-size: 64px;
          color: #f56c6c;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0;
          color: #f56c6c;
          font-size: 20px;
        }
      }

      .error-desc {
        margin: 0 0 24px 0;
        color: #606266;
        line-height: 1.5;
      }

      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .update-dialog {
      :deep(.el-dialog) {
        width: 90% !important;
        margin: 5vh auto;
      }
    }

    .update-content {
      .update-info .update-actions,
      .progress-actions,
      .success-actions,
      .error-actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
</style>
