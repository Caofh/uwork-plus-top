<template>
  <div class="tech-list-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-text">代码文件夹</span>
        </div>
      </div>

      <div class="header-center">
        <div class="search-box">
          <el-input v-model="searchQuery" clearable placeholder="搜索..." class="search-input" />
        </div>
      </div>

      <div class="header-right">
        <el-button type="primary" class="add-btn" @click="showDownloadDialog = true">
          新建 Git 仓库解析
        </el-button>
        <el-button v-if="gitStoreData.length" class="setting-btn" @click="refreshGitStore">
          拉取当前Git仓库
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 右侧列表区域 -->
      <div class="list-area">
        <!-- 列表头部 -->
        <div class="list-header">
          <div class="list-title c-flex-x-between">
            <div :class="[tailWind.flexRowStart]">
              <h2>组件列表</h2>
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
              <!-- <el-button class="ml-[10px]" type="primary" @click="openGitStore">打开仓库</el-button> -->
            </div>

            <div>
              <el-button v-if="gitStoreData.length" type="primary" @click="addCodeDir">
                新增
              </el-button>
            </div>
          </div>
        </div>

        <!-- 项目列表 -->
        <div class="projects-container-part">
          <div class="projects-container c-flex-x-start" :class="viewMode">
            <div
              class="project-card mb-[20px] p-[5px]"
              v-for="project in filteredProjects"
              :key="project.id"
            >
              <div class="project-header c-flex-x-center">
                <div class="project-meta w-full">
                  <h3 class="project-name mb-[5px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {{ project.modalNameDir }}
                  </h3>
                  <div class="w-full h-[100px] mb-[5px]">
                    <el-image
                      v-if="project.modalApp_iconUrl"
                      class="w-full h-full object-cover"
                      ref="imageRef"
                      :src="project.modalApp_iconUrl"
                      show-progress
                      :preview-src-list="[project.modalApp_iconUrl]"
                      fit="cover"
                      :preview-teleported="true"
                    />
                  </div>
                  <div
                    class="project-path mb-[5px] h-[48px] overflow-hidden text-ellipsis line-clamp-2"
                    :class="[tailWind.flexRowStart, 'items-start']"
                  >
                    {{ project.modalAppPath }}
                  </div>
                  <div
                    class="project-introduce mb-[5px] overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {{ project.modalAppIntroduce }}
                  </div>
                  <div :class="[tailWind.flexRowStart, 'flex-wrap', 'gap-[10px]']">
                    <div>
                      <el-button class="" size="small" type="primary" @click="getUrlLink(project)">
                        获取链接
                      </el-button>
                    </div>
                    <div>
                      <el-button
                        class=""
                        size="small"
                        type="primary"
                        @click="selectProject(project)"
                      >
                        编辑
                      </el-button>
                    </div>
                    <div>
                      <el-button size="small" type="danger" @click="deleteProject(project)">
                        删除
                      </el-button>
                    </div>
                  </div>
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
    <!-- <ProjectDialog
      v-model="showProjectDialog"
      :project="selectedProject"
      @confirm="handleProjectConfirm"
      @cancel="handleProjectCancel"
    /> -->

    <!-- Git 下载弹窗 -->
    <GitDownloadDialog
      v-model="showDownloadDialog"
      @success="handleDownloadSuccess"
      @error="handleDownloadError"
    />

    <!-- 添加分组 -->
    <el-dialog
      v-model="showModalGroup"
      :title="modalGroupStatus === 'add' ? '添加文件夹' : '编辑文件夹'"
      width="600px"
      :close-on-click-modal="false"
      :append-to-body="false"
    >
      <div class="modal-body">
        <div class="mb-[10px]">
          <el-input v-model="modalNameDir" placeholder="请输入代码文件夹名称" clearable />
        </div>
        <div class="mb-[10px]">
          <el-input
            ref="inputUpload"
            class="item-icon-url"
            placeholder="直接粘贴截图ctrl+v 或 输入icon的线上url地址"
            v-model="modalApp_iconUrl"
          ></el-input>
          <div class="c-flex-x-start preview-icon-container mt-[10px]" v-if="modalApp_iconUrl">
            <span>图片预览：</span>
            <img class="preview-icon" :src="modalApp_iconUrl" alt="icon" />
          </div>
        </div>
        <div class="form-row mb-[10px]">
          <el-input
            v-model="modalAppPath"
            :placeholder="`请输入组件在'${gitStoreData[Number(gitStoreValue)].name}'项目中的文件路径，如：/src/views/code/view-detail`"
            clearable
          />
        </div>
        <div class="form-row mb-[10px]">
          <el-input v-model="modalAppIntroduce" placeholder="请输入描述" clearable />
        </div>
      </div>
      <template #footer>
        <el-button v-if="modalGroupStatus === 'add'" class="black-btn" @click="handleAddGroup">
          确定
        </el-button>
        <el-button
          v-else-if="modalGroupStatus === 'edit'"
          class="black-btn"
          @click="handleEditGroup"
        >
          确定
        </el-button>

        <el-button @click="showModalGroup = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 公用弹窗 -->
    <CommonDialog
      v-model="showDialog"
      :closeOnClickModal="false"
      title="选择仓库打开方式"
      customClass="dialog-container"
    >
      <!-- 默认内容插槽 -->
      <el-button @click="handleConfirm('openFolder')">打开项目文件夹</el-button>
      <el-button @click="handleConfirm('openVscode')">打开vscode</el-button>
      <el-button @click="handleConfirm('openCursor')">打开cursor</el-button>
      <el-button type="primary" @click="handleConfirm('autoInstall')">终端打开</el-button>

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
  import { jsBridge, isInElectron } from '@/utils/electron'
  // 终端组件
  import Terminal from '@/components/terminal/Terminal.vue'
  import CodeDirListService from './utils/sqlOperate'
  import { tailWind } from '@/utils/tailwind'
  import { cloneDeep } from 'lodash'
  import { v4 as uuidv4 } from 'uuid'
  import { ElMessageBox } from 'element-plus'
  import { copyToClipboard } from '@/utils'

  // 剪贴板hook
  import { useClipboardHook } from '@/views/application/hooks/useClipboard'
  const inputUpload = ref(null)
  const { pasteDataReault } = useClipboardHook({
    domRef: inputUpload,
    callback: clipboardData => {
      if (clipboardData.url) {
        modalApp_iconUrl.value = clipboardData.url
        ElMessage.success('icon上传成功')
      }
    },
  })

  // 公用弹窗[控制弹窗显示]
  const showDialog = ref(false)
  const handleConfirm = async (type: string) => {
    const path = selectedProjectCompleted.value
    // showDialog.value = false;
    if (type === 'openFolder') {
      // 打开项目文件夹
      await terminalRef.value.executeWithoutModal(`open ${path}`)
    } else if (type === 'openVscode') {
      // 打开vscode
      await terminalRef.value.executeWithoutModal(`code ${path}`)
    } else if (type === 'openCursor') {
      // 打开cursor
      await terminalRef.value.executeWithoutModal(`cursor ${path}`)
    } else if (type === 'autoInstall') {
      // 自动安装依赖
      const command = `cd ${path}`
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
    // const projectsData = await getGitStoreData(gitStoreData.value)
    // projects.value = projectsData
  }
  async function deleteGitStore(index: number) {
    const getHomeProjectPath: any = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    // 删除git原文件
    await terminalRef.value.executeWithoutModal(
      `rm -rf ${getHomeProjectPath.data}/codeDirGitStore/${gitStoreData.value[index].name}`
    )

    // 删除数据库数据
    await CodeDirListService.remove(gitStoreData.value[index].id)

    // 重新加载项目列表
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

  // ----------- 添加代码文件夹相关 ------------------------------------------------------------
  const showModalGroup = ref(false) // 显示代码文件夹弹窗
  const modalNameDir = ref('')
  const modalApp_iconUrl = ref('')
  const modalAppPath = ref('')
  const modalAppIntroduce = ref('')
  const modalGroupStatus = ref('add') // 弹窗状态：add-添加，edit-编辑
  const modalProjectDataCache = ref<any>({}) // 缓存项目数据
  // ----------- 添加代码文件夹相关 ------------------------------------------------------------

  const refreshGitStore = async () => {
    const path = gitStoreData.value[gitStoreValue.value].path

    // git pull 最新代码
    const command = `cd ${path} && git pull`
    await terminalRef.value.executeWithModal(command)

    ElMessage.success('拉取最新代码成功')
    terminalRef.value.showExecModal = false

    // loadScaffoldProjects()
  }

  // type: 1-重置数据，2-刷新当前tab数据
  const loadScaffoldProjects = async ({ type = 2 }: { type?: number } = {}) => {
    if (!isInElectron()) {
      console.log('不在 Electron 环境中')
      return
    }

    // const resultDir = (await jsBridge.registerSync({
    //   method: 'readScaffoldDirectory',
    //   json: {
    //     path: '',
    //   },
    // })) as any

    const resultDirSql = (await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'readAll',
        data: { sql: 'dataSql/codeDirList.json' },
      },
    })) as any[]

    const data = resultDirSql
    // console.log('666resultDirSql')
    // console.log(resultDirSql)

    if (data.length) {
      if (type === 1) {
        gitStoreValue.value = '0'
      }

      gitStoreData.value = data
      // const projectsData = await getGitStoreData(gitStoreData.value)
      // console.log('666projectsData')
      // console.log(projectsData)

      projects.value = data
      console.log(data)
    } else {
      gitStoreValue.value = ''
      gitStoreData.value = []
      projects.value = []
    }

    // 设置全部数据
    // setAllData(gitStoreData)
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
            project.modalNameDir.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            project.modalAppIntroduce.toLowerCase().includes(searchQuery.value.toLowerCase())
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

      // console.log('666filtered')
      // console.log(filtered)
    }

    // 标签过滤
    const activeTags = filterTags.value.filter(tag => tag.active)
    if (activeTags.length > 0) {
      filtered = filtered.filter(project => activeTags.some(tag => project.tags.includes(tag.name)))
    }

    // 状态过滤
    // const activeStatus = statusFilters.value.filter(status => status.active)
    // if (activeStatus.length > 0) {
    //   filtered = filtered.filter(project =>
    //     activeStatus.some(status => project.status === status.id)
    //   )
    // }

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

  const getUrlLink = async (project: any) => {
    // console.log(project)

    const path = project.modalAppPath[0] === '/' ? project.modalAppPath : `/${project.modalAppPath}`
    const getHomeProjectPath: any = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    const copyText = `${getHomeProjectPath.data}/codeDirGitStore/${gitStoreData.value[gitStoreValue.value].name}${path}`
    await copyToClipboard(copyText)

    ElMessage.success('获取链接成功！已复制到剪贴板中')
  }
  const selectProject = (project: any) => {
    // 打开编辑弹窗
    showModalGroup.value = true
    modalGroupStatus.value = 'edit'
    modalProjectDataCache.value = cloneDeep(project)

    // 设置弹窗数据
    modalNameDir.value = modalProjectDataCache.value.modalNameDir
    modalApp_iconUrl.value = modalProjectDataCache.value.modalApp_iconUrl
    modalAppPath.value = modalProjectDataCache.value.modalAppPath
    modalAppIntroduce.value = modalProjectDataCache.value.modalAppIntroduce
  }
  const deleteProject = (project: any) => {
    ElMessageBox.confirm('确定删除该文件夹吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      // 项目id
      const id = project.id

      const gitItem = cloneDeep(gitStoreData.value[Number(gitStoreValue.value)])
      gitItem.projectData = gitItem.projectData.filter(item => item.id !== id)
      // 新增文件夹数据
      await CodeDirListService.update(gitItem.id, gitItem)

      // 重新加载数据
      await loadScaffoldProjects()

      ElMessage.success('删除成功')
    })
  }

  // 确认选择项目
  // const handleProjectConfirm = async (data: { name: string; path: string }) => {
  //   // 项目原path
  //   const path = selectedProjectCache.value.path
  //   // 项目目标path
  //   const targetPath = `${data.path}/${data.name}`
  //   // console.log(path, targetPath);

  //   // 暂存数据
  //   selectedProjectCompleted.value = {
  //     name: data.name,
  //     path: targetPath,
  //   }

  //   // 如果在 Electron 环境中且有路径，则打开文件夹
  //   if (isInElectron()) {
  //     const command = `cp -r ${path} ${targetPath}`
  //     await terminalRef.value.executeWithoutModal(command)

  //     // 弹窗启动
  //     showDialog.value = true
  //   }
  // }

  // 取消选择
  // const handleProjectCancel = () => {
  //   selectedProject.value = null
  // }

  // 下载成功处理
  const handleDownloadSuccess = (data: any) => {
    // 重新加载项目列表
    loadScaffoldProjects()
  }

  // 下载错误处理
  const handleDownloadError = (error: any) => {
    ElMessage.error(`解析失败: ${error.message}`)
  }

  const getParticleStyle = (index: number) => {
    return {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${10 + Math.random() * 20}s`,
    }
  }

  // ------------------------------- 添加代码文件夹 -----------------------------------------------
  const resetModalData = async () => {
    // 清空input数据
    modalNameDir.value = ''
    modalApp_iconUrl.value = ''
    modalAppPath.value = ''
    modalAppIntroduce.value = ''

    // 关闭弹窗
    showModalGroup.value = false

    // 重新加载数据
    await loadScaffoldProjects()
  }
  // 添加代码文件夹
  const addCodeDir = () => {
    modalGroupStatus.value = 'add'
    showModalGroup.value = true
  }

  // 打开仓库
  const openGitStore = async () => {
    const getHomeProjectPath: any = await jsBridge.registerSync({
      method: 'getHomeProjectPath',
    })
    const name = gitStoreData.value[gitStoreValue.value].name
    const targetPath = `${getHomeProjectPath.data}/codeDirGitStore/${name}`

    selectedProjectCompleted.value = targetPath
    showDialog.value = true
  }

  async function handleAddGroup() {
    if (!modalNameDir.value.trim()) {
      ElMessage.error('请输入文件夹名称')
      return
    }

    const newItem = {
      id: uuidv4(),
      modalNameDir: modalNameDir.value.trim(),
      modalApp_iconUrl: modalApp_iconUrl.value.trim(),
      modalAppPath: modalAppPath.value.trim(),
      modalAppIntroduce: modalAppIntroduce.value.trim(),
    }

    const gitItem = cloneDeep(gitStoreData.value[Number(gitStoreValue.value)])
    gitItem.projectData.push(newItem)

    // 新增文件夹数据
    await CodeDirListService.update(gitItem.id, gitItem)

    // 重置弹窗数据
    await resetModalData()

    ElMessage.success('数据更新成功')
  }
  async function handleEditGroup() {
    if (!modalNameDir.value.trim()) {
      ElMessage.error('请输入文件夹名称')
      return
    }
    // 项目id
    const id = modalProjectDataCache.value.id

    const gitItem = cloneDeep(gitStoreData.value[Number(gitStoreValue.value)])
    gitItem.projectData.forEach(item => {
      if (item.id === id) {
        item.modalNameDir = modalNameDir.value.trim()
        item.modalApp_iconUrl = modalApp_iconUrl.value.trim()
        item.modalAppPath = modalAppPath.value.trim()
        item.modalAppIntroduce = modalAppIntroduce.value.trim()
      }
    })

    // 新增文件夹数据
    await CodeDirListService.update(gitItem.id, gitItem)

    // 重置弹窗数据
    await resetModalData()

    ElMessage.success('数据更新成功')
  }
  // ------------------------------- 添加代码文件夹 -----------------------------------------------

  onMounted(() => {
    // 加载脚手架项目数据
    loadScaffoldProjects({ type: 1 })
  })
</script>

<style lang="scss" scoped>
  .dialog-container {
    .dialog-title {
      margin-bottom: 20px;
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

  // 背景动画 — 关闭，保持界面干净柔和
  .background-animations {
    display: none;
  }

  // 头部
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

  // 主内容区域
  .main-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 10px 12px 12px;
    overflow: hidden;
  }

  // 列表区域
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
        gap: 2.5% !important;

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
          box-sizing: border-box;
          background: #252525;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease;
          position: relative;
          overflow: hidden;
          width: 18%;

          &::before {
            display: none;
          }

          &:hover {
            background: #2a2a2a;
            border-color: #444;
            transform: none;
            box-shadow: none;
          }

          .project-header {
            display: flex;
            cursor: auto;

            .project-meta {
              .project-path {
                word-break: break-all;
                font-size: 12px;
                color: #757575;
              }

              .project-introduce {
                font-size: 13px;
                color: #bdbdbd;
              }

              .project-name {
                font-size: 15px;
                font-weight: 600;
                color: #f0f0f0;
              }
            }
          }
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .main-content {
      flex-direction: column;
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

    .projects-container.grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<style>
  .preview-icon-container {
    .preview-icon {
      width: 150px;
      height: 100px;
      border-radius: 5px;
      object-fit: contain;
    }
  }
</style>
