<template>
  <div class="document-container">
    <div class="document-header">
      <div class="document-header-left c-flex-x-start">
        <h2>文档管理</h2>
        <div class="document-tabs c-flex-x-start">
          <el-tooltip content="文档数据存储在当前电脑本地。" placement="bottom">
            <button
              type="button"
              class="document-tab"
              :class="{ active: docTab === 'local' }"
              @click="switchDocTab('local')"
            >
              本地文档
            </button>
          </el-tooltip>
          <el-tooltip content="文档数据存储到云端。" placement="bottom">
            <button
              type="button"
              class="document-tab"
              :class="{ active: docTab === 'online' }"
              @click="switchDocTab('online')"
            >
              线上文档
            </button>
          </el-tooltip>
        </div>
      </div>
      <div v-if="docTab === 'local'" class="header-actions">
        <el-button type="primary" @click="addGroup">
          <el-icon style="margin-right: 5px; color: #fff">
            <Plus />
          </el-icon>
          新增分组
        </el-button>
        <el-button v-if="documentDataCurrent" type="primary" @click="addArticle">
          <el-icon style="margin-right: 5px; color: #fff">
            <Plus />
          </el-icon>
          新增文档/笔记
        </el-button>
        <!-- <el-button type="info" @click="drawerVisible = true">
          <el-icon>
            <Setting />
          </el-icon>
          文档设置
        </el-button> -->
      </div>
    </div>

    <!-- 本地文档 -->
    <div v-show="docTab === 'local'" class="document-content c-flex-x-start">
      <div :class="['always-use c-flex-y-start c-animation-transition', 'always-use-show']">
        <div class="always-use-title c-flex-x-between">
          <div>分组</div>
          <el-tooltip placement="right" :show-arrow="true" effect="customized" :enterable="false">
            <template #default>
              <div class="c-flex-x-end always-use-item-content add-group-btn" @click="addGroup">
                <el-icon><CirclePlusFilled /></el-icon>
              </div>
            </template>
            <template #content>
              <div class="custom-tooltip-content">
                <div class="app-tooltip-title">添加分组</div>
              </div>
            </template>
          </el-tooltip>
        </div>
        <div :class="['always-use-content', 'c-flex-y-start']">
          <div
            v-for="item in documentData"
            :key="item.id"
            class="always-use-item"
            :class="{ active: currentId === item.id }"
          >
            <el-tooltip
              placement="right"
              :show-arrow="true"
              class="custom-tooltip"
              effect="customized"
            >
              <template #default>
                <div
                  class="always-use-item-content"
                  @contextmenu.prevent="showContextMenu($event, item)"
                >
                  <div
                    @click="setDocumentDataCurrentById(item.id)"
                    class="always-use-item-title c-ellipsis-single c-cursor"
                  >
                    {{ item.text }}
                  </div>
                </div>
              </template>
              <template #content>
                <div class="custom-tooltip-content">
                  <div class="tooltip-desc">{{ item.description }}</div>
                </div>
              </template>
            </el-tooltip>
          </div>
        </div>
      </div>
      <div class="document-content-list" v-if="documentDataCurrent && documentDataCurrent.children">
        <div
          class="document-content-item c-flex-x-between"
          v-for="item in documentDataCurrent.children"
          :key="item.id"
        >
          <div class="document-content-item-title">{{ item.text }}</div>
          <div class="document-content-item-btns c-flex-x-end">
            <el-button class="btn" size="small" @click="lookArticle(item.id)">查看</el-button>
            <el-button class="btn" size="small" @click="createClone(item.id)">创建副本</el-button>
            <el-button class="btn" size="small" @click="editArticle(item.id)">编辑</el-button>
            <el-button class="btn" size="small" @click="deleteArticle(item.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 线上文档 -->
    <div v-show="docTab === 'online'" class="document-online-panel">
      <OnlineDoc />
    </div>

    <!-- 新增文档抽屉 -->
    <el-drawer
      class="doc-editor-drawer"
      append-to-body
      v-model="drawerEditorVisible"
      direction="btt"
      title="新增文档"
      :with-header="false"
    >
      <div class="doc-editor-drawer-body">
        <div class="title-parent c-flex-x-center">
          <h2 class="doc-title c-flex-x-start">
            <span class="doc-title-text">
              {{ curerntDocClickCacheType === 'add' ? '新增文档' : '编辑文档' }}
            </span>
            <el-button type="primary" size="small" @click="saveMarkdown">保存</el-button>
          </h2>
          <div class="doc-close" @click="drawerEditorVisible = false">
            <el-icon>
              <Close />
            </el-icon>
          </div>
          <div class="doc-title-input c-flex-x-center">
            <h2>标题：</h2>
            <el-input
              class="doc-title-input-input"
              v-model="curerntDocClickCache.text"
              placeholder="请输入文档标题"
            />
          </div>
        </div>
        <!-- 微应用容器 -->
        <div class="react-editor-wrap">
          <div class="react-editor" v-show="miniAppLoading" v-loading="true"></div>
          <div v-show="!miniAppLoading" class="react-editor" id="react-app-container"></div>
        </div>
      </div>
    </el-drawer>

    <!-- 文档设置抽屉 -->
    <el-drawer
      class="doc-editor-right"
      v-model="drawerVisible"
      title="文档设置"
      direction="rtl"
      size="500px"
      :before-close="handleDrawerClose"
    >
      <div class="drawer-content">
        <!-- 文档信息 -->
        <el-card class="drawer-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>文档信息</span>
            </div>
          </template>
          <el-form :model="documentInfo" label-width="80px">
            <el-form-item label="文档标题">
              <el-input v-model="documentInfo.title" placeholder="请输入文档标题" />
            </el-form-item>
            <el-form-item label="文档类型">
              <el-select
                v-model="documentInfo.type"
                placeholder="请选择文档类型"
                style="width: 100%"
              >
                <el-option label="技术文档" value="tech" />
                <el-option label="用户手册" value="manual" />
                <el-option label="API文档" value="api" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="文档描述">
              <el-input
                v-model="documentInfo.description"
                type="textarea"
                :rows="3"
                placeholder="请输入文档描述"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 编辑器设置 -->
        <el-card class="drawer-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>编辑器设置</span>
            </div>
          </template>
          <el-form :model="editorSettings" label-width="100px">
            <el-form-item label="主题模式">
              <el-radio-group v-model="editorSettings.theme">
                <el-radio label="light">浅色主题</el-radio>
                <el-radio label="dark">深色主题</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="字体大小">
              <el-slider
                v-model="editorSettings.fontSize"
                :min="12"
                :max="20"
                :step="1"
                show-input
                input-size="small"
              />
            </el-form-item>
            <el-form-item label="自动保存">
              <el-switch v-model="editorSettings.autoSave" />
            </el-form-item>
            <el-form-item label="行号显示">
              <el-switch v-model="editorSettings.showLineNumbers" />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作按钮 -->
        <div class="drawer-actions">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 新增分组弹窗 -->
    <CommonDialog v-model="addGroupVisible" :title="editGroupMode ? '编辑分组' : '新增分组'">
      <el-form :model="addGroupForm" label-width="100px">
        <el-form-item label="分组名称">
          <el-input v-model="addGroupForm.text" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="分组描述">
          <el-input v-model="addGroupForm.description" placeholder="请输入分组描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addGroupVisible = false">取消</el-button>
          <el-button type="primary" @click="addGroupNext">
            {{ editGroupMode ? '更新' : '确认' }}
          </el-button>
        </div>
      </template>
    </CommonDialog>

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
      }"
      @click="hideContextMenu"
    >
      <div class="context-menu-item" @click="editGroup">
        <el-icon>
          <Edit />
        </el-icon>
        <span>编辑</span>
      </div>
      <div class="context-menu-item" @click="deleteGroup">
        <el-icon>
          <Delete />
        </el-icon>
        <span>删除</span>
      </div>
    </div>
  </div>
</template>
<script setup>
  import { reactive, ref, nextTick, onMounted, onUnmounted, watch, toRaw } from 'vue'
  import { ElMessage, ElMessageBox, selectGroupKey } from 'element-plus'
  import { Edit, Delete, CirclePlusFilled } from '@element-plus/icons-vue'
  import { cloneDeep } from 'lodash'
  // hooks
  import { useMiniApp, useDocumentDataApi } from './hooks'
  import { jsBridge } from '@/utils/electron'
  import { GroupFinder } from './util'
  import { v4 as uuidv4 } from 'uuid'
  import { useCommonStore } from '@/store/common'
  import { demoContent } from './constants'
  import { getDocumentOnlineUrl } from './documentUrls'
  import OnlineDoc from './components/OnlineDoc.vue'

  const docTab = ref('local')
  const onlineDocUrl = ref(getDocumentOnlineUrl())

  const switchDocTab = tab => {
    docTab.value = tab
    if (tab === 'online') {
      onlineDocUrl.value = getDocumentOnlineUrl()
    }
  }

  const backMessage = data => {
    console.log('主应用 接收到 子应用 传参:', data)
    if (data.type === 'complete') {
      miniAppLoading.value = false
    } else {
      miniAppMarkdown.value = data.val
    }
  }

  // hooks ---
  const {
    documentData,
    documentDataCurrent,
    currentId,
    setDocumentData,
    setDocumentDataCurrent,
    setCurrentId,
    initDoctData,
    refreshDoctData,
    setDocumentDataCurrentById,
  } = useDocumentDataApi()
  const { microApp, startMicroApp, miniAction, isLoadMicroApp } = useMiniApp(backMessage)
  const commonStore = useCommonStore()
  // hooks ---

  // 抽屉显示状态
  const drawerVisible = ref(false)
  const drawerEditorVisible = ref(false)
  const miniAppLoading = ref(true)

  // 文档信息
  const documentInfo = reactive({
    title: '',
    type: 'tech',
    description: '',
  })

  // 编辑器设置
  const editorSettings = reactive({
    theme: 'light',
    fontSize: 14,
    autoSave: true,
    showLineNumbers: true,
  })

  // 监听抽屉显示状态
  watch(drawerEditorVisible, async newValue => {
    // 控制底部dock展示与隐藏
    if (newValue === true) {
      commonStore.updateShowDock(false)
    } else {
      commonStore.updateShowDock(true)
    }
  })

  // 抽屉关闭处理
  const handleDrawerClose = done => {
    ElMessageBox.confirm('确定要关闭设置面板吗？未保存的设置将会丢失。')
      .then(() => {
        done()
      })
      .catch(() => {
        // 取消关闭
      })
  }

  // 保存设置
  const saveSettings = () => {
    // 这里可以添加保存设置的逻辑
    ElMessage.success('设置保存成功')
    drawerVisible.value = false
  }

  // 找到具体点击的文档内容
  function findArticleById(id) {
    return documentDataCurrent.value.children.find(item => item.id === id)
  }

  // 点击查看的文档内容
  let curerntDocClickCache = ref(null)
  let curerntDocClickCacheType = ref('') // 点击类型： look 、 edit 、 add
  let miniAppMarkdown = ref('') // 子应用传入的markdown（监听change事件，实时传输markdown）

  // 新增分组
  const addGroupVisible = ref(false)
  const addGroupForm = reactive({
    text: '',
    description: '',
  })

  // 右键菜单相关
  const contextMenuVisible = ref(false)
  const contextMenuPosition = reactive({ x: 0, y: 0 })
  const currentContextItem = ref(null)

  // 显示右键菜单
  const showContextMenu = (event, item) => {
    event.preventDefault()
    currentContextItem.value = item
    contextMenuPosition.x = event.clientX - 92 + 10
    contextMenuPosition.y = event.clientY - 15
    contextMenuVisible.value = true

    // 点击其他地方隐藏菜单
    setTimeout(() => {
      document.addEventListener('click', hideContextMenu, { once: true })
    }, 0)
  }

  // 隐藏右键菜单
  const hideContextMenu = () => {
    contextMenuVisible.value = false
    // currentContextItem.value = null;
  }

  // 编辑分组
  const editGroup = () => {
    if (!currentContextItem.value) return

    const item = currentContextItem.value
    addGroupForm.text = item.text
    addGroupForm.description = item.description || ''
    addGroupVisible.value = true

    // 修改弹窗标题和按钮
    editGroupMode.value = true
    editingGroupId.value = item.id

    hideContextMenu()
  }

  // 删除分组
  const deleteGroup = async () => {
    if (!currentContextItem.value) return

    try {
      await ElMessageBox.confirm(
        `确定要删除分组"${currentContextItem.value.text}"吗？删除后该分组下的所有文档也将被删除。`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      // 执行删除逻辑
      await deleteGroupById(currentContextItem.value.id)
      ElMessage.success('删除成功')
      hideContextMenu()
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  // 删除分组的方法
  const deleteGroupById = async groupId => {
    try {
      const res = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'remove',
          data: { id: groupId, sql: 'document' },
        },
      })

      // 刷新数据
      await refreshDoctData()

      // 如果删除的是当前选中的分组，清空选择
      if (currentId.value === groupId) {
        currentId.value = null
        documentDataCurrent.value = null
      }

      return res
    } catch (error) {
      console.error('删除分组失败:', error)
      throw error
    }
  }

  // 编辑分组模式
  const editGroupMode = ref(false)
  const editingGroupId = ref(null)

  // 修改新增分组的逻辑，支持编辑模式
  async function addGroupNext() {
    if (editGroupMode.value) {
      // 编辑模式
      await updateGroup()
    } else {
      // 新增模式
      await createNewGroup()
    }
  }

  // 创建新分组
  async function createNewGroup() {
    const newData = {
      ...addGroupForm,
      timestamp: new Date().getTime(),
      children: [],
    }

    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'create',
        data: { item: newData, sql: 'document' },
      },
    })

    ElMessage.success('新增分组成功')
    setTimeout(async () => {
      await refreshDoctData()

      // 如果只有一条数据，则选中第一条
      if (documentData.value.length === 1) {
        setDocumentDataCurrent(documentData.value[0])
        setCurrentId(documentData.value[0].id)
      }

      addGroupVisible.value = false
      resetGroupForm()
    }, 1200)
  }

  // 更新分组
  async function updateGroup() {
    if (!editingGroupId.value) return

    try {
      // 找到要编辑的分组
      const groupIndex = documentData.value.findIndex(item => item.id === editingGroupId.value)
      if (groupIndex === -1) {
        ElMessage.error('分组不存在')
        return
      }

      const updatedGroup = {
        ...documentData.value[groupIndex],
        text: addGroupForm.text,
        description: addGroupForm.description,
        timestamp: new Date().getTime(),
      }
      updatedGroup.children = toRaw(updatedGroup.children)

      await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id: editingGroupId.value, item: updatedGroup, sql: 'document' },
        },
      })

      ElMessage.success('更新分组成功')
      setTimeout(() => {
        refreshDoctData()
        addGroupVisible.value = false
        resetGroupForm()
      }, 1200)
    } catch (error) {
      ElMessage.error('更新分组失败')
    }
  }

  // 重置分组表单
  const resetGroupForm = () => {
    addGroupForm.text = ''
    addGroupForm.description = ''
    editGroupMode.value = false
    editingGroupId.value = null
  }

  // 新增分组
  async function addGroup() {
    console.log('新增分组')
    editGroupMode.value = false
    editingGroupId.value = null
    resetGroupForm()
    addGroupVisible.value = true
  }

  // 新增文章
  function addArticle() {
    miniAppLoading.value = true
    drawerEditorVisible.value = true

    const defaultContent = demoContent
    const curerntDoc = {
      content: defaultContent,
    }

    // 暂存数据
    curerntDocClickCache.value = curerntDoc
    curerntDocClickCacheType.value = 'add'
    miniAppMarkdown.value = curerntDoc.content

    nextTick(() => {
      if (isLoadMicroApp()) {
        miniAction.setGlobalState({
          type: 'edit', // 编辑
          curerntDoc: curerntDoc,
          onMessage: backMessage,
        })
      } else {
        startMicroApp({
          id: '#react-app-container',
          props: {
            type: 'edit', // 查看
            curerntDoc: curerntDoc, // 点击文档内容
          },
        })
      }
    })
  }
  // 查看文章
  const lookArticle = id => {
    drawerEditorVisible.value = true
    // 找到具体点击的文档内容
    const curerntDoc = findArticleById(id)

    // 暂存数据
    curerntDocClickCache.value = cloneDeep(curerntDoc)
    curerntDocClickCacheType.value = 'look'
    miniAppMarkdown.value = curerntDoc.content

    nextTick(() => {
      if (isLoadMicroApp()) {
        miniAction.setGlobalState({
          type: 'look', // 编辑
          curerntDoc: curerntDoc,
          onMessage: backMessage,
        })
      } else {
        startMicroApp({
          id: '#react-app-container',
          props: {
            type: 'look', // 查看
            curerntDoc: curerntDoc, // 点击文档内容
          },
        })
      }
    })
  }

  // 编辑文章
  const editArticle = id => {
    miniAppLoading.value = true
    drawerEditorVisible.value = true
    // 找到具体点击的文档内容
    const curerntDoc = findArticleById(id)

    // 暂存数据
    curerntDocClickCache.value = cloneDeep(curerntDoc)
    curerntDocClickCacheType.value = 'edit'
    miniAppMarkdown.value = curerntDoc.content

    nextTick(() => {
      // console.log(isLoadMicroApp())
      if (isLoadMicroApp()) {
        miniAction.setGlobalState({
          type: 'edit', // 编辑
          curerntDoc: curerntDoc,
          onMessage: backMessage,
        })
      } else {
        startMicroApp({
          id: '#react-app-container',
          props: {
            type: 'edit', // 编辑
            curerntDoc: curerntDoc, // 点击文档内容
          },
        })
      }
    })

    // 向子应用发送消息
    // setTimeout(() => {
    //   miniAction.setGlobalState({ id })
    // }, 1000)
  }

  const createClone = id => {
    miniAppLoading.value = true
    drawerEditorVisible.value = true

    const curerntChoosedData = findArticleById(id)

    const curerntDoc = {
      text: curerntChoosedData.text,
      content: curerntChoosedData.content,
    }

    // 暂存数据
    curerntDocClickCache.value = curerntDoc
    curerntDocClickCacheType.value = 'add'
    miniAppMarkdown.value = curerntDoc.content

    nextTick(() => {
      if (isLoadMicroApp()) {
        miniAction.setGlobalState({
          type: 'edit', // 编辑
          curerntDoc: curerntDoc,
          onMessage: backMessage,
        })
      } else {
        startMicroApp({
          id: '#react-app-container',
          props: {
            type: 'edit', // 查看
            curerntDoc: curerntDoc, // 点击文档内容
          },
        })
      }
    })
  }

  // 删除文章
  const deleteArticle = async id => {
    console.log(id)
    await ElMessageBox.confirm(`确定要删除吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteArticleById(id)
  }

  const deleteArticleById = async id => {
    // 数据处理
    const group = findGroupById(id)
    const parent = group.parent
    // 删除 children 中的数据
    for (let i = 0; i < parent.children.length; i++) {
      if (parent.children[i].id === id) {
        parent.children.splice(i, 1)
        break
      }
    }

    try {
      const res = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id: parent.id, item: parent, sql: 'document' },
        },
      })

      refreshDoctData()
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }

  function findGroupById(id) {
    // 使用增强版本
    const finder = new GroupFinder(documentData.value, 'id')
    const group = finder.findGroupById(id)
    return group
  }

  // 保存markdown
  async function saveMarkdown() {
    if (miniAppMarkdown.value === '') {
      ElMessage.error('请输入文档内容')
      return
    }
    if (curerntDocClickCache.value.title === '') {
      ElMessage.error('请输入文档标题')
      return
    }

    if (curerntDocClickCacheType.value === 'add') {
      // 新增
      addNext()
      // const group = findGroupById(curerntDocClickCache.value.id)
      // const parent = group.parent;
      // parent.children.push(curerntDocClickCache.value);
    } else {
      // 编辑
      editNext()
    }
  }

  // 新增
  async function addNext() {
    // 数据处理
    const parent = documentDataCurrent.value
    parent.children.push({
      id: uuidv4(),
      text: curerntDocClickCache.value.text,
      content: miniAppMarkdown.value,
      timestamp: new Date().getTime(),
      description: '',
    })

    try {
      const res = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id: parent.id, item: parent, sql: 'document' },
        },
      })
      // console.log('parent', parent)
      refreshDoctData()
      ElMessage.success('保存成功')

      setTimeout(() => {
        drawerEditorVisible.value = false
      }, 1200)
    } catch (error) {
      ElMessage.error('保存失败')
    }
  }

  // 编辑
  async function editNext() {
    // 数据处理
    const group = findGroupById(curerntDocClickCache.value.id)
    const parent = group.parent
    parent.children.forEach(item => {
      // 替换当前选中id的markdown数据
      if (item.id === curerntDocClickCache.value.id) {
        item.content = miniAppMarkdown.value
        item.text = curerntDocClickCache.value.text
      }
    })

    try {
      const res = await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id: parent.id, item: parent, sql: 'document' },
        },
      })
      // console.log('parent', parent)

      refreshDoctData()
      ElMessage.success('保存成功')

      setTimeout(() => {
        drawerEditorVisible.value = false
      }, 1200)
    } catch (error) {
      ElMessage.error('保存失败')
    }
  }

  onMounted(async () => {
    await initDoctData()
  })
</script>

<style scoped lang="scss">
  .document-container {
    --doc-bg: #121212;
    --doc-bg-elevated: #1a1a1a;
    --doc-bg-panel: #1e1e1e;
    --doc-border: #2e2e2e;
    --doc-text: #e0e0e0;
    --doc-text-muted: #bdbdbd;
    --doc-text-dim: #9e9e9e;
    --doc-accent: #90caf9;
    --doc-accent-soft: #1e3a5f;
    --doc-hover: #252525;
    --doc-radius: 8px;
    --doc-radius-sm: 6px;
    --doc-transition: 0.18s ease;

    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 10px 12px 12px;
    background: var(--doc-bg);
    color: var(--doc-text);
    box-sizing: border-box;
  }

  :deep(.doc-editor-right) {
    .el-drawer__body {
      padding-bottom: 0;
    }

    .drawer-actions {
      padding-bottom: 40px;
      border-top: none;
    }
  }

  .document-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding: 12px 16px;
    background: var(--doc-bg-elevated);
    border: 1px solid var(--doc-border);
    border-radius: var(--doc-radius);
    flex-shrink: 0;
  }

  .document-header-left {
    gap: 16px;
    min-width: 0;
    height: 32px;
  }

  .document-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #f0f0f0;
  }

  .header-actions {
    display: flex;
    gap: 8px;

    :deep(.el-button) {
      border-radius: var(--doc-radius-sm);
    }

    :deep(.el-button:not(.el-button--primary)) {
      background: var(--doc-hover);
      border-color: var(--doc-border);
      color: var(--doc-text-muted);
    }
  }

  .document-tabs {
    gap: 6px;
  }

  .document-tab {
    border: 1px solid var(--doc-border);
    background: var(--doc-hover);
    color: var(--doc-text-muted);
    font-size: 13px;
    padding: 5px 14px;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background var(--doc-transition),
      color var(--doc-transition),
      border-color var(--doc-transition);

    &:hover {
      color: var(--doc-accent);
      border-color: #3a3a3a;
      background: #2a2a2a;
    }

    &.active {
      color: var(--doc-accent);
      border-color: #3d5a80;
      background: var(--doc-accent-soft);
    }
  }

  .document-online-panel {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .document-content {
    flex: 1;
    min-height: 0;
    align-items: stretch;
    gap: 10px;

    .always-use {
      flex-shrink: 0;
      margin-right: 12px;
      background-color: #1a1a1a;
      height: calc(100vh - 180px);
      padding: 10px 0;
      border-radius: 8px;
      width: 0;
      overflow: hidden;
      border: 1px solid #2e2e2e;
      transition: width 0.3s cubic-bezier(0.45, 0.04, 0.08, 2.29);
      display: flex;
      flex-direction: column;

      &.always-use-show {
        width: 150px;
      }

      .always-use-title {
        position: relative;
        font-size: 15px;
        font-weight: 600;
        color: #f0f0f0;
        width: 100%;
        padding: 3px 10px 8px;
        margin-bottom: 10px;
        border-bottom: 1px solid #2e2e2e;

        .add-group-btn {
          cursor: pointer;
          width: 23px;
          height: 23px;
          color: #64b5f6;

          &:hover {
            color: #90caf9;
          }
        }
      }

      .always-use-content {
        flex: 1;
        overflow-y: auto;
        padding-top: 7px;
        width: 100%;

        .always-use-item {
          margin-bottom: 8px;
          padding: 0 8px;

          &.active {
            .always-use-item-content {
              .always-use-item-title {
                background-color: #1e3a5f;
                color: #90caf9;
                font-weight: 600;

                &:hover {
                  background-color: #234a75;
                  transform: translateY(-3px);
                  box-shadow: 0 4px 14px rgba(30, 58, 95, 0.35);
                }
              }
            }
          }

          .always-use-item-content {
            position: relative;

            .always-use-item-title {
              font-size: 13px;
              color: #bdbdbd;
              width: 118px;
              height: 42px;
              line-height: 22px;
              border-radius: 6px;
              text-align: center;
              padding: 10px;
              background-color: #252525;
              box-shadow: none;
              transform: translateY(0);
              transition: all 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

              &:hover {
                background-color: #2e2e2e;
                color: #90caf9;
                transform: translateY(-4px);
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
              }
            }
          }
        }
      }
    }

    .document-content-list {
      flex: 1;
      min-width: 0;
      height: calc(100vh - 180px);
      overflow-y: auto;
      padding: 8px 2px 4px;

      .document-content-item {
        margin-bottom: 8px;
        padding: 12px 14px;
        background: var(--doc-bg-panel);
        border: 1px solid var(--doc-border);
        border-radius: var(--doc-radius);
        transform: translateY(0);
        transition: all 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

        &:hover {
          border-color: #3a3a3a;
          background: #252525;
          transform: translateY(-4px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
        }

        .document-content-item-title {
          color: var(--doc-text);
          font-size: 14px;
        }

        .document-content-item-btns {
          flex-shrink: 0;
          gap: 6px;

          .btn {
            margin: 0;
            background: var(--doc-hover);
            border: 1px solid var(--doc-border);
            border-radius: var(--doc-radius-sm);
            color: var(--doc-text-muted);
            box-shadow: none;
            transition:
              background var(--doc-transition),
              color var(--doc-transition),
              border-color var(--doc-transition);

            &:hover {
              color: var(--doc-accent);
              border-color: #3d5a80;
              background: var(--doc-accent-soft);
            }
          }
        }
      }
    }
  }

  .drawer-content {
    padding: 0;
  }

  .drawer-card {
    margin-bottom: 16px;
    background: var(--doc-bg-panel);
    border: 1px solid var(--doc-border);
    border-radius: var(--doc-radius);

    :deep(.el-card__header) {
      border-bottom: 1px solid var(--doc-border);
      padding: 12px 16px;
    }

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .drawer-card:last-child {
    margin-bottom: 0;
  }

  .card-header {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #f0f0f0;
  }

  .micro-app-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .drawer-actions {
    position: sticky;
    bottom: 0;
    background: var(--doc-bg-elevated);
    padding: 16px 0;
    border-top: 1px solid var(--doc-border);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }

  @media (max-width: 768px) {
    .document-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .context-menu {
    position: fixed;
    z-index: 9999;
    background: #252525;
    border: 1px solid #3a3a3a;
    border-radius: var(--doc-radius-sm);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    min-width: 120px;
    user-select: none;
    overflow: hidden;

    .context-menu-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      cursor: pointer;
      transition: background var(--doc-transition);

      &:hover {
        background: #333;

        span {
          color: var(--doc-text);
        }

        .el-icon {
          color: var(--doc-accent);
        }
      }

      .el-icon {
        margin-right: 8px;
        font-size: 14px;
        color: var(--doc-text-dim);
        transition: color var(--doc-transition);
      }

      span {
        font-size: 14px;
        color: var(--doc-text-muted);
        transition: color var(--doc-transition);
      }
    }
  }

  .always-use-item-content {
    position: relative;
  }
</style>

<style lang="scss">
  .doc-editor-drawer {
    padding: 0 !important;
    height: 85vh !important;

    .el-drawer__body {
      background: #141414;
    }

    .doc-editor-drawer-body {
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #e0e0e0;

      .title-parent {
        position: relative;
        flex-shrink: 0;
        margin-bottom: 0;
        padding: 12px 16px;
        background: #1e1e1e;
        border-bottom: 1px solid #2e2e2e;

        .doc-title {
          position: absolute;
          left: 16px;

          .doc-title-text {
            margin-right: 10px;
            color: #f0f0f0;
            font-size: 16px;
          }
        }

        .doc-close {
          position: absolute;
          right: 16px;
          cursor: pointer;
          color: #bdbdbd;
          transition: color 0.18s ease;

          &:hover {
            color: #90caf9;
          }
        }

        .doc-title-input {
          width: 100%;

          h2 {
            color: #bdbdbd;
            font-size: 14px;
            font-weight: 500;
          }

          .doc-title-input-input {
            width: 300px;

            .el-input__wrapper {
              background: #252525;
              box-shadow: none;
              border-radius: 6px;
            }

            .el-input__inner {
              color: #e0e0e0;
            }
          }
        }
      }

      .react-editor-wrap {
        flex: 1;
        min-height: 0;
        position: relative;
        margin: 10px 12px 12px;
        padding: 10px;
        background: #252525;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        box-sizing: border-box;
        overflow: hidden;
      }

      .react-editor {
        height: 100%;
        min-height: 0;
        color: #e0e0e0;
        overflow-x: hidden;
        overflow-y: auto;
        margin: 0;
        padding: 0;
        background: transparent;
        border: none;
        // border-radius: 6px;
        box-shadow: none;
        box-sizing: border-box;

        :deep(#__qiankun_microapp_wrapper_for_react_app__) {
          min-height: 100%;
          border-radius: 6px;
          background: #1e1e1e;
          border: 1px solid #2e2e2e;
        }

        :deep(.md-editor) {
          min-height: 500px;
          background: #1e1e1e !important;
          border: none !important;
          border-radius: 6px;
        }

        :deep(.el-loading-mask) {
          background-color: rgba(30, 30, 30, 0.72);
          border-radius: 6px;
        }
      }
    }
  }
</style>
