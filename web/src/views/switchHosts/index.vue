<template>
  <div class="hosts-container" @click="closeContextMenu">
    <aside class="sidebar">
      <div class="sidebar-title">
        <div class="sidebar-title-left">
          <span class="sidebar-title-text">🌐 SwitchHosts</span>
        </div>
        <span class="add-icon" @click="addProfile" title="添加配置">+</span>
      </div>

      <ul class="group-list">
        <li
          :class="['group-item', activeKey === 'system' ? 'active' : '']"
          @click="selectSystemHosts"
        >
          <span class="group-label bold">系统 Hosts</span>
          <span class="readonly-tag">只读</span>
        </li>
        <li
          v-for="(item, index) in profileList"
          :key="item.id"
          :class="['group-item', activeKey === item.id ? 'active' : '']"
          @click="selectProfile(item.id)"
          @contextmenu.prevent="showContextMenu($event, index, item)"
        >
          <span class="group-label">{{ item.hostsName || '未命名' }}</span>
          <SwitchBtn v-model="item.inUse" @click.stop="toggleProfile(item)" />
        </li>
      </ul>

      <div class="recycle-section">
        <div class="recycle-header" @click="recycleExpanded = !recycleExpanded">
          <span>回收站</span>
          <span class="recycle-count">{{ trashList.length }}</span>
          <span class="recycle-arrow">{{ recycleExpanded ? '▾' : '▸' }}</span>
        </div>
        <ul v-if="recycleExpanded" class="recycle-list">
          <li
            v-for="item in trashList"
            :key="item.id"
            class="recycle-item"
            @contextmenu.prevent="showTrashContextMenu($event, item)"
          >
            <span class="group-label">{{ item.hostsName || '未命名' }}</span>
          </li>
          <li v-if="!trashList.length" class="recycle-empty">暂无删除项</li>
        </ul>
      </div>

      <Teleport to="body">
        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          @click.stop
        >
          <div class="context-menu-item" @click="handleEdit(contextMenu.index, contextMenu.item)">
            重命名
          </div>
          <div
            class="context-menu-item delete"
            @click="showDeleteDialog(contextMenu.index, contextMenu.item)"
          >
            删除
          </div>
        </div>

        <div
          v-if="trashContextMenu.visible"
          class="context-menu"
          :style="{ left: trashContextMenu.x + 'px', top: trashContextMenu.y + 'px' }"
          @click.stop
        >
          <div class="context-menu-item" @click="restoreFromTrash(trashContextMenu.item)">恢复</div>
          <div class="context-menu-item delete" @click="permanentDelete(trashContextMenu.item)">
            彻底删除
          </div>
        </div>
      </Teleport>
    </aside>

    <main class="main-content">
      <div class="main-title">
        <span class="main-title-text">{{ currentTitle }}</span>
        <span v-if="isReadOnly" class="readonly">只读</span>
        <el-icon v-if="titleLoading" class="main-title-loading">
          <Loading />
        </el-icon>
      </div>

      <div class="editor-panel">
        <div ref="editorContainer" class="monaco-editor-container"></div>
      </div>

      <div class="status-bar">
        <span>{{ editorStats.lines }} 行</span>
        <span>{{ editorStats.bytes }} B</span>
        <span v-if="isReadOnly">只读</span>
      </div>
    </main>

    <el-dialog
      v-model="showDeleteConfirmDialog"
      title="确认删除"
      width="320px"
      :close-on-click-modal="false"
      @close="cancelDelete"
    >
      <div>确定要删除该配置吗？删除后可在回收站恢复。</div>
      <template #footer>
        <el-button @click="cancelDelete">取消</el-button>
        <el-button type="primary" @click="confirmDelete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showNameDialog"
      :title="nameDialogMode === 'edit' ? '重命名' : '添加配置'"
      width="320px"
      @close="handleNameDialogCancel"
    >
      <el-input v-model="profileNameInput" placeholder="请输入配置名称" autofocus />
      <template #footer>
        <el-button @click="handleNameDialogCancel">取消</el-button>
        <el-button type="primary" @click="handleNameDialogConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, nextTick, watch, toRaw } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Loading } from '@element-plus/icons'
  import SwitchBtn from '../switchProxy/components/SwitchBtn.vue'
  import { isInElectron } from '@/utils/electron'
  import { DEFAULT_HOSTS_CONTENT } from './constants'
  import {
    hostsService,
    hostsTrashService,
    readSystemHosts,
    applyHostsProfiles,
  } from './hostsService'

  const profileList = ref([])
  const trashList = ref([])
  const systemHostsContent = ref('')
  const activeKey = ref('system')
  const recycleExpanded = ref(false)

  const editorContainer = ref(null)
  let monacoInstance = null
  let editorResizeObserver = null
  let hostsLanguageRegistered = false

  const titleLoading = ref(false)
  const showDeleteConfirmDialog = ref(false)
  const showNameDialog = ref(false)
  const nameDialogMode = ref('add')
  const profileNameInput = ref('')
  let editIndex = ref(null)
  let deleteIndex = ref(null)
  let deleteItem = ref(null)

  const contextMenu = ref({ visible: false, x: 0, y: 0, index: null, item: null })
  const trashContextMenu = ref({ visible: false, x: 0, y: 0, item: null })

  const MENU_ITEM_HEIGHT = 36
  const MENU_WIDTH = 120
  const MENU_PADDING = 8
  const VIEWPORT_MARGIN = 8

  function clampMenuPosition(clientX, clientY, itemCount) {
    const menuHeight = MENU_PADDING + itemCount * MENU_ITEM_HEIGHT
    let x = clientX
    let y = clientY

    if (x + MENU_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
      x = window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN
    }
    if (x < VIEWPORT_MARGIN) {
      x = VIEWPORT_MARGIN
    }

    if (y + menuHeight > window.innerHeight - VIEWPORT_MARGIN) {
      y = clientY - menuHeight
    }
    if (y < VIEWPORT_MARGIN) {
      y = VIEWPORT_MARGIN
    }

    return { x, y }
  }

  const editorStats = ref({ lines: 0, bytes: 0 })

  const isReadOnly = computed(() => activeKey.value === 'system')

  const currentTitle = computed(() => {
    if (activeKey.value === 'system') {
      return '系统 Hosts'
    }
    const profile = profileList.value.find(item => item.id === activeKey.value)
    return profile?.hostsName || ''
  })

  function updateEditorStats(content) {
    const text = String(content || '')
    editorStats.value = {
      lines: text ? text.split('\n').length : 0,
      bytes: new TextEncoder().encode(text).length,
    }
  }

  async function loadProfiles() {
    profileList.value = (await hostsService.readAll()) || []
  }

  async function loadTrash() {
    trashList.value = (await hostsTrashService.readAll()) || []
  }

  async function refreshSystemHosts() {
    try {
      systemHostsContent.value = await readSystemHosts()
    } catch (error) {
      ElMessage.error(error?.message || '读取系统 hosts 失败')
      systemHostsContent.value = ''
    }
  }

  function getEditorValue() {
    if (activeKey.value === 'system') {
      return systemHostsContent.value
    }
    const profile = profileList.value.find(item => item.id === activeKey.value)
    return profile?.hostsContent ?? ''
  }

  function destroyEditor() {
    editorResizeObserver?.disconnect()
    editorResizeObserver = null
    if (monacoInstance) {
      monacoInstance.dispose()
      monacoInstance = null
    }
  }

  function registerHostsLanguage(monaco) {
    if (hostsLanguageRegistered) {
      return
    }
    monaco.languages.register({ id: 'hosts' })
    monaco.languages.setMonarchTokensProvider('hosts', {
      tokenizer: {
        root: [
          [/^\s*#.*$/, 'comment'],
          [/^\s*\d+\.\d+\.\d+\.\d+/, 'number'],
          [/::\d+/, 'number'],
          [/[a-zA-Z0-9._-]+/, 'string'],
        ],
      },
    })
    monaco.editor.defineTheme('hosts-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'number', foreground: '569CD6' },
        { token: 'string', foreground: 'D4D4D4' },
      ],
      colors: {},
    })
    hostsLanguageRegistered = true
  }

  async function mountEditor() {
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
    if (!editorContainer.value) {
      return
    }

    destroyEditor()

    const monaco = await import('monaco-editor')
    registerHostsLanguage(monaco)

    const value = getEditorValue()
    updateEditorStats(value)

    monacoInstance = monaco.editor.create(editorContainer.value, {
      value,
      language: 'hosts',
      readOnly: isReadOnly.value,
      theme: 'hosts-dark',
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
    })

    if (!isReadOnly.value) {
      monacoInstance.onDidChangeModelContent(() => {
        updateEditorStats(monacoInstance.getValue())
      })
      monacoInstance.onDidBlurEditorWidget(() => {
        saveCurrentEditorContent()
      })
    }

    monacoInstance.layout()
    editorResizeObserver = new ResizeObserver(() => {
      monacoInstance?.layout()
    })
    editorResizeObserver.observe(editorContainer.value)
  }

  function selectSystemHosts() {
    activeKey.value = 'system'
    refreshSystemHosts()
  }

  function selectProfile(id) {
    activeKey.value = id
  }

  function addProfile() {
    nameDialogMode.value = 'add'
    profileNameInput.value = ''
    showNameDialog.value = true
  }

  function handleEdit(index, item) {
    nameDialogMode.value = 'edit'
    editIndex.value = index
    profileNameInput.value = item.hostsName || ''
    showNameDialog.value = true
    closeContextMenu()
  }

  async function handleNameDialogConfirm() {
    const name = profileNameInput.value.trim()
    if (!name) {
      ElMessage.warning('请输入配置名称')
      return
    }

    if (nameDialogMode.value === 'add') {
      const created = await hostsService.create({
        hostsName: name,
        inUse: false,
        hostsContent: DEFAULT_HOSTS_CONTENT,
      })
      await loadProfiles()
      activeKey.value = created.id
      ElMessage.success('添加成功')
    } else if (editIndex.value !== null && profileList.value[editIndex.value]) {
      const item = profileList.value[editIndex.value]
      item.hostsName = name
      await hostsService.update(item.id, { hostsName: name })
      ElMessage.success('重命名成功')
    }

    handleNameDialogCancel()
  }

  function handleNameDialogCancel() {
    showNameDialog.value = false
    profileNameInput.value = ''
    nameDialogMode.value = 'add'
    editIndex.value = null
  }

  async function applyToSystem() {
    titleLoading.value = true
    try {
      const result = await applyHostsProfiles(toRaw(profileList.value))
      if (result?.firstInstall) {
        ElMessage.success('已授权 hosts 免密写入，后续修改无需再输入密码')
      }
      if (activeKey.value === 'system') {
        await refreshSystemHosts()
        await mountEditor()
      }
      return result
    } catch (error) {
      ElMessage.error(error?.message || '应用 hosts 失败，请确认已授权管理员权限')
      throw error
    } finally {
      titleLoading.value = false
    }
  }

  async function toggleProfile(item) {
    try {
      await hostsService.update(item.id, { inUse: item.inUse })
      await applyToSystem()
      ElMessage.success(item.inUse ? '已启用' : '已关闭')
    } catch (error) {
      item.inUse = !item.inUse
    }
  }

  async function saveCurrentEditorContent() {
    if (!monacoInstance || isReadOnly.value) {
      return
    }

    const profile = profileList.value.find(item => item.id === activeKey.value)
    if (!profile) {
      return
    }

    const content = monacoInstance.getValue()
    profile.hostsContent = content
    await hostsService.update(profile.id, { hostsContent: content })

    if (profile.inUse) {
      try {
        await applyToSystem()
      } catch (_) {
        // error already shown
      }
    }
  }

  function showContextMenu(e, index, item) {
    contextMenu.value.visible = false
    trashContextMenu.value.visible = false
    const { x, y } = clampMenuPosition(e.clientX, e.clientY, 2)
    nextTick(() => {
      contextMenu.value = {
        visible: true,
        x,
        y,
        index,
        item,
      }
    })
  }

  function showTrashContextMenu(e, item) {
    trashContextMenu.value.visible = false
    contextMenu.value.visible = false
    const { x, y } = clampMenuPosition(e.clientX, e.clientY, 2)
    nextTick(() => {
      trashContextMenu.value = {
        visible: true,
        x,
        y,
        item,
      }
    })
  }

  function closeContextMenu() {
    contextMenu.value.visible = false
    trashContextMenu.value.visible = false
  }

  function showDeleteDialog(index, item) {
    deleteIndex.value = index
    deleteItem.value = item
    showDeleteConfirmDialog.value = true
    closeContextMenu()
  }

  function cancelDelete() {
    showDeleteConfirmDialog.value = false
    deleteIndex.value = null
    deleteItem.value = null
  }

  async function confirmDelete() {
    if (deleteIndex.value === null || !deleteItem.value) {
      cancelDelete()
      return
    }

    const item = deleteItem.value
    const wasActive = item.inUse
    const wasSelected = activeKey.value === item.id

    await hostsTrashService.create({
      hostsName: item.hostsName,
      hostsContent: item.hostsContent,
      deletedAt: new Date().toISOString(),
      inUse: false,
    })
    await hostsService.remove(item.id)
    await loadProfiles()
    await loadTrash()

    if (wasSelected) {
      activeKey.value = 'system'
    }

    if (wasActive) {
      try {
        await applyToSystem()
      } catch (_) {
        // ignore
      }
    }

    ElMessage.success('已移入回收站')
    cancelDelete()
  }

  async function restoreFromTrash(item) {
    if (!item) {
      return
    }
    await hostsService.create({
      hostsName: item.hostsName,
      hostsContent: item.hostsContent,
      inUse: false,
    })
    await hostsTrashService.remove(item.id)
    await loadProfiles()
    await loadTrash()
    closeContextMenu()
    ElMessage.success('已恢复')
  }

  async function permanentDelete(item) {
    if (!item) {
      return
    }
    await hostsTrashService.remove(item.id)
    await loadTrash()
    closeContextMenu()
    ElMessage.success('已彻底删除')
  }

  watch(activeKey, async () => {
    if (activeKey.value === 'system') {
      await refreshSystemHosts()
    }
    await mountEditor()
  })

  onMounted(async () => {
    if (!isInElectron()) {
      ElMessage.warning('Hosts 管理需要在桌面客户端中使用')
      return
    }

    await loadProfiles()
    await loadTrash()
    await refreshSystemHosts()
    await mountEditor()
  })

  onUnmounted(() => {
    destroyEditor()
  })
</script>

<style scoped>
  .hosts-container {
    display: flex;
    height: 100%;
    min-height: 0;
    background: #121212;
    color: #e0e0e0;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
  .sidebar {
    min-width: 220px;
    flex-shrink: 0;
    background: #1a1a1a;
    border-right: 1px solid #2e2e2e;
    padding: 24px 0 0 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .sidebar-title {
    font-size: 18px;
    font-weight: bold;
    color: #f0f0f0;
    padding: 0 24px 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .sidebar-title-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .add-icon {
    font-size: 20px;
    color: #64b5f6;
    cursor: pointer;
    user-select: none;
  }
  .add-icon:hover {
    color: #90caf9;
  }
  .group-list {
    list-style: none;
    padding: 0 10px;
    margin: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .group-item {
    padding: 8px 10px;
    font-size: 15px;
    color: #bdbdbd;
    display: flex;
    align-items: center;
    cursor: pointer;
    justify-content: space-between;
    border-radius: 6px;
    transition:
      background 0.18s,
      color 0.18s;
  }
  .group-item.active {
    font-weight: bold;
    color: #90caf9;
    background: #1e3a5f;
  }
  .group-item:hover {
    background: #252525;
    color: #90caf9;
  }
  .group-label {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .group-label.bold {
    font-weight: bold;
  }
  .readonly-tag {
    font-size: 11px;
    color: #9e9e9e;
    background: #2a2a2a;
    border-radius: 4px;
    padding: 1px 6px;
    flex-shrink: 0;
  }
  .recycle-section {
    border-top: 1px solid #2e2e2e;
    padding: 8px 10px 12px;
    flex-shrink: 0;
  }
  .recycle-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    color: #9e9e9e;
    font-size: 14px;
    border-radius: 6px;
  }
  .recycle-header:hover {
    background: #252525;
    color: #bdbdbd;
  }
  .recycle-count {
    background: #333;
    border-radius: 10px;
    padding: 0 6px;
    font-size: 12px;
  }
  .recycle-arrow {
    margin-left: auto;
  }
  .recycle-list {
    list-style: none;
    margin: 4px 0 0;
    padding: 0 4px;
    max-height: 120px;
    overflow-y: auto;
  }
  .recycle-item {
    padding: 6px 8px;
    font-size: 13px;
    color: #888;
    border-radius: 4px;
    cursor: context-menu;
  }
  .recycle-item:hover {
    background: #252525;
  }
  .recycle-empty {
    padding: 6px 8px;
    font-size: 12px;
    color: #666;
  }
  .main-content {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #121212;
  }
  .main-title {
    font-size: 18px;
    font-weight: bold;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #1a1a1a;
    color: #f0f0f0;
    border-bottom: 1px solid #2e2e2e;
    flex-shrink: 0;
  }
  .readonly {
    font-size: 13px;
    color: #9e9e9e;
    background: #2a2a2a;
    border-radius: 4px;
    padding: 2px 8px;
  }
  .editor-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #1e1e1e;
  }
  .monaco-editor-container {
    flex: 1;
    min-height: 0;
    width: 100%;
  }
  :deep(.monaco-editor) {
    height: 100% !important;
  }
  .status-bar {
    flex-shrink: 0;
    display: flex;
    gap: 16px;
    padding: 4px 12px;
    font-size: 12px;
    color: #9e9e9e;
    background: #007acc;
    color: #fff;
  }
  .context-menu {
    position: fixed;
    z-index: 9999;
    background: #252525;
    border: 1px solid #3a3a3a;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    min-width: 100px;
    padding: 4px 0;
  }
  .context-menu-item {
    padding: 8px 18px;
    cursor: pointer;
    font-size: 14px;
    color: #e0e0e0;
  }
  .context-menu-item:hover {
    background: #333;
  }
  .context-menu-item.delete {
    color: #ef5350;
  }
  .main-title-loading {
    font-size: 18px;
    color: #90caf9;
  }
  .main-title-loading svg {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
</style>
