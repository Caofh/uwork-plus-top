<template>
  <div class="tech-list-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">
            <div class="logo-circle"></div>
            <div class="logo-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <span class="logo-text">脚手架</span>
        </div>
      </div>

      <div class="header-center">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            clearable
            placeholder="搜索..."
            class="search-input"
          />
        </div>
      </div>

      <div class="header-right">
        <el-button type="primary" class="add-btn" @click="showDownloadDialog = true">
          新建 Git 仓库解析
        </el-button>
        <el-button v-if="gitStoreData.length" class="setting-btn" @click="refreshGitStore">拉取当前Git仓库</el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 右侧列表区域 -->
      <div class="list-area">
        <!-- 列表头部 -->
        <div class="list-header">
          <div class="list-title c-flex-x-start">
            <h2>脚手架列表</h2>
            <span class="project-count">共{{ gitStoreData.length }}组Git仓库</span>
            <el-select
              class="git-store-select"
              @change="selectStore"
              v-model="gitStoreValue"
              placeholder="请选择Git仓库"
            >
              <el-option
                v-for="(item, index) in gitStoreData"
                :key="item.id"
                :label="item.name"
                :value="`${index}`"
              >
                <div class="c-flex-x-between" style="width: 260px">
                  <span style="float: left">{{ item.name }}</span>
                  <span style="float: right">
                    <el-button
                      link
                      size="small"
                      @click.stop="deleteGitStore(index)"
                      style="color: #f56c6c"
                    >
                      删除
                    </el-button>
                  </span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>

        <!-- 项目列表 -->
        <div class="projects-container-part">
          <div class="projects-container c-flex-x-start" :class="viewMode">
            <div v-for="project in filteredProjects" :key="project.id" class="project-card">
              <div class="project-header c-flex-x-center">
                <div class="project-icon" :style="{ backgroundColor: project.color }">
                  <el-icon><component :is="project.icon" /></el-icon>
                </div>
                <div class="project-meta">
                  <h3 class="project-name">{{ project.name }}</h3>
                  <!-- <p class="project-desc">{{ project.description }}</p> -->
                </div>
                <div class="project-actions">
                  <el-button type="primary" @click="selectProject(project)">初始化脚手架</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Terminal ref="terminalRef" />
    </div>

    <!-- 背景动画元素 -->
    <div class="background-animations">
      <div class="floating-particles">
        <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
      </div>
      <div class="grid-lines"></div>
    </div>

    <!-- 项目选择弹窗 -->
    <ProjectDialog
      v-model="showProjectDialog"
      :project="selectedProject"
      @confirm="handleProjectConfirm"
      @cancel="handleProjectCancel"
    />

    <!-- Git 下载弹窗 -->
    <GitDownloadDialog
      v-model="showDownloadDialog"
      @success="handleDownloadSuccess"
      @error="handleDownloadError"
    />

    <!-- 公用弹窗 -->
    <CommonDialog
      v-model="showDialog"
      :closeOnClickModal="false"
      title="恭喜！"
      customClass="dialog-container"
    >
      <!-- 默认内容插槽 -->
      <p class="dialog-title">项目初始化成功</p>
      <el-button @click="handleConfirm('openFolder')">打开项目文件夹</el-button>
      <el-button @click="handleConfirm('openVscode')">打开vscode</el-button>
      <el-button @click="handleConfirm('openCursor')">打开cursor</el-button>
      <el-button type="primary" @click="handleConfirm('autoInstall')">自动安装依赖</el-button>

      <!-- 底部插槽 -->
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
      </template>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
  import { ElMessage } from 'element-plus'
  import { jsBridge, isInElectron } from '../../utils/electron'
  // 终端组件
  import Terminal from '@/components/terminal/Terminal.vue'

  // 公用弹窗[控制弹窗显示]
  const showDialog = ref(false)
  const handleConfirm = async (type: string) => {
    const path = selectedProjectCompleted.value.path
    // showDialog.value = false;
    if (type === 'openFolder') {
      await terminalRef.value.executeWithoutModal(`open "${path}"`)
    } else if (type === 'openVscode') {
      await terminalRef.value.executeWithoutModal(`code "${path}"`)
    } else if (type === 'openCursor') {
      await terminalRef.value.executeWithoutModal(`cursor "${path}"`)
    } else if (type === 'autoInstall') {
      // 自动安装依赖
      const command = `cd ${path} && yarn && cursor ./`
      await terminalRef.value.executeWithModalMacTerminal(command)
    }
  }

  // 动态导入组件
  const ProjectDialog = defineAsyncComponent(() => import('./components/ProjectDialog.vue'))
  const GitDownloadDialog = defineAsyncComponent(() => import('./components/GitDownloadDialog.vue'))
  const terminalRef = ref(null)

  // 搜索
  const searchQuery = ref('')

  // 视图模式
  const viewMode = ref('grid')

  // gitStore
  const gitStoreValue = ref('')
  const gitStoreData = ref([]) // 所有git仓库数据
  const selectStore = async () => {
    const projectsData = await getGitStoreData(gitStoreData.value)
    projects.value = projectsData
  }
  async function deleteGitStore(index: number) {
    const getHomeProjectPath: any = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    // 删除git原文件
    await terminalRef.value.executeWithoutModal(
      `rm -rf ${getHomeProjectPath.data}/gitStore/${gitStoreData.value[index].name}`
    )

    loadScaffoldProjects()

    // // 重置当前数据
    // if (gitStoreValue.value === String(index)) {
    //   gitStoreValue.value = "";
    //   await loadScaffoldProjects();
    // }

    // // 重置select所有数据
    // gitStoreData.value = gitStoreData.value.filter(
    //   (item: any, i: number) => i !== index
    // );

    ElMessage.success('删除成功')
  }

  // 排序
  const sortBy = ref('created')

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(12)
  const totalProjects = ref(48)

  // 筛选标签
  const filterTags = ref([
    { id: 1, name: '前端', active: false },
    { id: 2, name: '后端', active: false },
    { id: 3, name: '移动端', active: false },
    { id: 4, name: 'AI/ML', active: false },
    { id: 5, name: '区块链', active: false },
    { id: 6, name: '物联网', active: false },
  ])

  // 状态筛选
  const statusFilters = ref([
    { id: 'active', name: '进行中', color: '#67c23a', count: 24, active: true },
    {
      id: 'completed',
      name: '已完成',
      color: '#409eff',
      count: 12,
      active: false,
    },
    { id: 'paused', name: '已暂停', color: '#e6a23c', count: 8, active: false },
    { id: 'archived', name: '已归档', color: '#909399', count: 4, active: false },
  ])

  // 项目数据
  const projects = ref([])

  // 从 electron 读取脚手架目录
  const blackList = ['.git']

  const refreshGitStore = async () => {
    const path = gitStoreData.value[gitStoreValue.value].path

    // git pull 最新代码
    const command = `cd ${path} && git pull`
    await terminalRef.value.executeWithModal(command)

    loadScaffoldProjects()
  }

  const loadScaffoldProjects = async () => {
    if (!isInElectron()) {
      console.log('不在 Electron 环境中')
      return
    }

    const resultDir = (await jsBridge.registerSync({
      method: 'readScaffoldDirectory',
      json: {
        path: '',
      },
    })) as any

    const data = resultDir.data
    if (data.length) {
      gitStoreValue.value = '0'
      gitStoreData.value = data
      const projectsData = await getGitStoreData(gitStoreData.value)
      projects.value = projectsData
    } else {
      gitStoreValue.value = ''
      gitStoreData.value = []
      projects.value = []
    }

    // 设置全部数据
    setAllData(gitStoreData)
  }
  async function setAllData(gitStoreData) {
    gitStoreData.value.forEach(async item => {
      const projectsData = await getGitStoreData(gitStoreData.value, item.name)
      item.projectData = projectsData
    })
  }
  // 获取tab下的详细数据，根据tab的值(gitStoreValue)获取
  async function getGitStoreData(data, byName = null) {
    let result = []

    const gitItem = data[Number(gitStoreValue.value)]
    const name = byName ? byName : gitItem.name
    try {
      const resultRes = (await jsBridge.registerSync({
        method: 'readScaffoldDirectory',
        json: {
          path: name,
        },
      })) as any
      // 黑名单过滤
      const data = resultRes.data.filter((item: any) => {
        return !blackList.includes(item.name)
      })

      if (resultRes.code === 0 && data) {
        // 将目录数据转换为项目格式
        result = data.map((dir: any, index: number) => ({
          id: index + 1,
          name: dir.name,
          description: `脚手架项目: ${dir.name}`,
          // icon: getRandomIcon(),
          // color: getRandomColor(),
          icon: 'Platform',
          color: '#ffffff',
          status: 'active',
          path: dir.path,
        }))
      } else {
        console.error('读取脚手架目录失败:', resultRes.message)
      }
    } catch (error) {
      console.error('调用 electron 接口失败:', error)
    }

    return result
  }

  // 获取随机图标
  const getRandomIcon = () => {
    const icons = ['DataAnalysis', 'Connection', 'Monitor', 'Platform', 'Cpu']
    return icons[Math.floor(Math.random() * icons.length)]
  }

  // 获取随机颜色
  const getRandomColor = () => {
    const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9c27b0', '#ff9800']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // 计算属性
  const filteredProjects = computed(() => {
    let filtered = []

    // 搜索过滤
    if (searchQuery.value) {
      gitStoreData.value.forEach(async item => {
        item.projectData.forEach(project => {
          if (
            project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.value.toLowerCase())
          ) {
            filtered.push(project)
          }
        })
      })
    } else {
      gitStoreData.value.forEach(async item => {
        const currentChooseData = gitStoreData.value[Number(gitStoreValue.value)]
        if (item.name === currentChooseData.name) {
          if (item.projectData) {
            item.projectData.forEach(project => {
              filtered.push(project)
            })
          }
        }
      })
    }

    // 标签过滤
    const activeTags = filterTags.value.filter(tag => tag.active)
    if (activeTags.length > 0) {
      filtered = filtered.filter(project => activeTags.some(tag => project.tags.includes(tag.name)))
    }

    // 状态过滤
    const activeStatus = statusFilters.value.filter(status => status.active)
    if (activeStatus.length > 0) {
      filtered = filtered.filter(project =>
        activeStatus.some(status => project.status === status.id)
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy.value) {
        case 'created':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  })

  // 方法
  const toggleTag = (tagId: number) => {
    const tag = filterTags.value.find(t => t.id === tagId)
    if (tag) {
      tag.active = !tag.active
    }
  }

  const toggleStatus = (statusId: string) => {
    const status = statusFilters.value.find(s => s.id === statusId)
    if (status) {
      status.active = !status.active
    }
  }

  // 弹窗相关状态
  const showProjectDialog = ref(false)
  const showDownloadDialog = ref(false)
  const selectedProject = ref<any>(null)
  const selectedProjectCache = ref<any>(null)
  const selectedProjectCompleted = ref<any>(null)

  const selectProject = (project: any) => {
    // 设置弹窗数据
    selectedProject.value = {}
    selectedProjectCache.value = project
    showProjectDialog.value = true
  }

  // 确认选择项目
  const handleProjectConfirm = async (data: { name: string; path: string }) => {
    // 项目原path
    const path = selectedProjectCache.value.path
    // 项目目标path
    const targetPath = `${data.path}/${data.name}`
    // console.log(path, targetPath);

    // 暂存数据
    selectedProjectCompleted.value = {
      name: data.name,
      path: targetPath,
    }

    // 如果在 Electron 环境中且有路径，则打开文件夹
    if (isInElectron()) {
      try {
        const result: any = await jsBridge.registerSync({
          method: 'copyDirectory',
          json: {
            source: path,
            destination: targetPath,
          },
        })
        if (result?.code !== 0) {
          throw new Error(result?.message || '项目复制失败')
        }
        showDialog.value = true
      } catch (error: any) {
        ElMessage.error(error?.message || '项目初始化失败')
      }
    }
  }

  // 取消选择
  const handleProjectCancel = () => {
    selectedProject.value = null
  }

  // 下载成功处理
  const handleDownloadSuccess = (data: any) => {
    // 重新加载项目列表
    loadScaffoldProjects()
  }

  // 下载错误处理
  const handleDownloadError = (error: any) => {
    ElMessage.error(`解析失败: ${error.message}`)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#67c23a'
    if (progress >= 60) return '#409eff'
    if (progress >= 40) return '#e6a23c'
    return '#f56c6c'
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getParticleStyle = (index: number) => {
    return {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${10 + Math.random() * 20}s`,
    }
  }

  onMounted(() => {
    // 加载脚手架项目数据
    loadScaffoldProjects()
  })
</script>

<style lang="scss" scoped>
  .dialog-container {
    .dialog-title {
      margin-bottom: 20px;
      color: #e0e0e0;
    }
  }

  .tech-list-container {
    background: #121212;
    color: #e0e0e0;
    position: relative;
    overflow: hidden;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
  }

  .background-animations {
    display: none;
  }

  .header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #1a1a1a;
    border-bottom: 1px solid #2e2e2e;
    flex-shrink: 0;

    .header-left {
      .logo {
        display: flex;
        align-items: center;
        gap: 12px;

        .logo-icon {
          display: none;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 600;
          color: #f0f0f0;
        }
      }
    }

    .header-center {
      flex: 1;
      max-width: 400px;
      margin: 0 24px;

      .search-input {
        :deep(.el-input__wrapper) {
          background: #252525;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          box-shadow: none;
          transition:
            background 0.18s ease,
            border-color 0.18s ease;

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
    }

    .header-right {
      display: flex;
      gap: 8px;

      .add-btn {
        border-radius: 6px;
        transition: opacity 0.18s ease;

        &:hover {
          opacity: 0.9;
        }
      }

      .setting-btn {
        background: #252525;
        border: 1px solid #2e2e2e;
        color: #bdbdbd;
        border-radius: 6px;
        transition:
          background 0.18s ease,
          color 0.18s ease;

        &:hover {
          background: #2a2a2a;
          color: #e0e0e0;
          border-color: #3a3a3a;
        }
      }
    }
  }

  .main-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 10px 12px 12px;
    overflow: hidden;
  }

  .list-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #1a1a1a;
    border-radius: 8px;
    border: 1px solid #2e2e2e;
    padding: 16px;

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #2e2e2e;

      .list-title {
        width: 100%;

        h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #f0f0f0;
        }

        .project-count {
          margin-left: 10px;
          margin-right: 10px;
          font-size: 13px;
          color: #757575;
        }

        .git-store-select {
          width: 200px;

          :deep(.el-select__wrapper) {
            background: #252525;
            box-shadow: none;
            border-radius: 6px;

            &:hover,
            &.is-focus {
              background: #2a2a2a;
              box-shadow: none;
            }
          }
        }
      }
    }

    .projects-container-part {
      flex: 1;
      min-height: 0;
      overflow-y: auto;

      .projects-container {
        padding: 0 4px 12px;
        gap: 2%;

        &.grid {
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 4px;
        }

        &.list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .project-card {
          background: #252525;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          width: 32%;
          transform: translateY(0);
          transition: all 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

          &::before {
            display: none;
          }

          &:hover {
            background: #2a2a2a;
            border-color: #444;
            transform: translateY(-3px);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
          }

          .project-header {
            display: flex;
            align-items: center;
            cursor: auto;

            .project-icon {
              width: 44px;
              height: 44px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #90caf9;
              font-size: 20px;
              flex-shrink: 0;
              background: #1e3a5f !important;
            }

            .project-meta {
              flex: 1;
              min-width: 0;

              .project-name {
                font-size: 15px;
                font-weight: 600;
                color: #f0f0f0;
                padding: 0 10px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .project-actions {
              flex-shrink: 0;

              .el-button {
                border-radius: 6px;
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 1200px) {
    .main-content {
      flex-direction: column;
    }

    .list-area .projects-container .project-card {
      width: 48%;
    }
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 12px;
      padding: 12px;

      .header-center {
        margin: 0;
        max-width: 100%;
      }
    }

    .main-content {
      padding: 10px;
    }

    .list-area .projects-container .project-card {
      width: 100%;
    }
  }
</style>
