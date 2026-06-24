<template>
  <div
    ref="apiDebugRef"
    v-loading="systemProxyToggleLoading"
    element-loading-text="正在切换全局代理..."
    class="api-debug"
    @click="closeContextMenu"
  >
    <SystemProxyBar class="api-debug__global-proxy" />

    <div class="api-debug__body">
      <aside class="api-debug__sidebar" :style="{ width: `${sidebarWidth}px` }">
        <div class="sidebar-header">
          <span class="sidebar-title">接口管理</span>
          <div class="sidebar-actions">
            <el-button link type="primary" title="新建目录" @click="handleAddFolder(null)">
              <el-icon><FolderAdd /></el-icon>
            </el-button>
            <el-button link type="primary" title="新建接口" @click="handleAddApi(null)">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>

        <el-input v-model="searchKeyword" placeholder="搜索接口" clearable class="sidebar-search">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div v-loading="loading" class="sidebar-tree">
          <el-tree
            :key="treeStructureKey"
            ref="treeRef"
            :data="displayTreeData"
            node-key="id"
            :props="treeProps"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
            @node-contextmenu="handleNodeContextMenu"
          >
            <template #default="{ data }">
              <div
                class="tree-node"
                @dblclick.stop="data.type === 'api' && openApiInTab(data, { forceNew: true })"
              >
                <el-icon v-if="data.type === 'folder'" class="tree-node__icon"><Folder /></el-icon>
                <span
                  v-else
                  class="tree-node__method"
                  :class="`method-${(data.method || 'GET').toLowerCase()}`"
                >
                  {{ data.method || 'GET' }}
                </span>
                <span class="tree-node__label">{{ data.name }}</span>
              </div>
            </template>
          </el-tree>
          <el-empty v-if="!loading && displayTreeData.length === 0" description="暂无接口" />
        </div>
      </aside>

      <div
        class="api-debug__resizer"
        :class="{ 'api-debug__resizer--active': isSidebarResizing }"
        @mousedown="startSidebarResize"
      />

      <main class="api-debug__main">
        <div v-if="sessionTabs.length" class="workspace-tabs">
          <draggable
            ref="workspaceTabsRef"
            v-model="sessionTabs"
            item-key="tabId"
            class="workspace-tabs__scroll"
            :animation="180"
            :delay="80"
            :filter="'.workspace-tab__close'"
            :prevent-on-filter="true"
            ghost-class="workspace-tab--ghost"
            drag-class="workspace-tab--dragging"
            @end="onTabDragEnd"
          >
            <template #item="{ element: tab }">
              <div
                class="workspace-tab"
                :class="{ 'workspace-tab--active': tab.tabId === activeTabId }"
                :data-tab-id="tab.tabId"
                @click="switchTab(tab.tabId)"
              >
                <span
                  class="workspace-tab__method"
                  :class="`method-${(tab.api.method || 'GET').toLowerCase()}`"
                >
                  {{ tab.api.method || 'GET' }}
                </span>
                <span class="workspace-tab__name" :title="tab.api.name">{{ tab.api.name }}</span>
                <el-icon class="workspace-tab__close" @click.stop="closeTab(tab.tabId)">
                  <Close />
                </el-icon>
              </div>
            </template>
          </draggable>
          <button class="workspace-tabs__add" title="新建标签页" @click="addBlankTab">+</button>
        </div>

        <template v-if="activeSession">
          <div ref="sessionWorkspaceRef" class="session-workspace">
            <div class="request-section" :style="{ height: `${requestSectionHeight}px` }">
              <div class="request-bar">
                <el-select v-model="activeSession.api.method" class="method-select">
                  <el-option v-for="item in HTTP_METHODS" :key="item" :label="item" :value="item" />
                </el-select>
                <el-input
                  v-model="activeSession.api.url"
                  placeholder="请输入请求 URL"
                  class="url-input"
                />
                <el-button type="primary" :loading="sending" @click="handleSend">发送</el-button>
                <el-button :loading="saving" class="!ml-0" @click="handleSave">保存</el-button>
              </div>

              <el-tabs v-model="activeSession.requestTab" class="request-tabs">
                <el-tab-pane label="Params" name="params">
                  <KeyValueTable v-model="activeSession.api.queryParams" show-description />
                </el-tab-pane>
                <el-tab-pane label="Headers" name="headers">
                  <KeyValueTable v-model="activeSession.api.headers" />
                </el-tab-pane>
                <el-tab-pane label="Body" name="body">
                  <div class="body-panel">
                    <el-radio-group v-model="activeSession.api.bodyType" class="body-type">
                      <el-radio-button label="none">none</el-radio-button>
                      <el-radio-button label="json">JSON</el-radio-button>
                      <el-radio-button label="raw">raw</el-radio-button>
                    </el-radio-group>
                    <el-input
                      v-if="activeSession.api.bodyType !== 'none'"
                      v-model="activeSession.api.body"
                      type="textarea"
                      :rows="8"
                      placeholder="请输入请求 Body"
                      class="body-editor"
                    />
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>

            <div
              class="panel-resizer"
              :class="{ 'panel-resizer--active': isPanelResizing }"
              @mousedown="startPanelResize"
            />

            <div class="response-panel">
              <template v-if="mockPanelVisible">
                <div class="response-split__header response-split__header--mock-panel">
                  <span class="response-split__title">Mock 配置</span>
                  <el-button size="small" type="primary" @click="toggleMockPanel">
                    返回响应
                  </el-button>
                </div>
                <MockPanel
                  v-model="activeSession.api.mockCases"
                  v-model:active-case-id="activeSession.activeMockCaseId"
                  v-model:match-pattern="activeSession.api.mockUrlPattern"
                  :mock-enabled="activeSession.mockEnabled"
                  :current-url="activeSession.api.url"
                  @apply="handleApplyMock"
                  @save="handleSaveMock"
                />
              </template>

              <div v-else class="response-split-wrap">
                <div class="response-split-toolbar">
                  <div>
                    <div v-if="canShowDiffAssessment" class="response-diff-assessment">
                      <el-tooltip
                        content="比较真实数据和Mock数据之间属性的差异，不包含内容。"
                        placement="top"
                      >
                        <span class="response-diff-assessment__label">差异评估</span>
                      </el-tooltip>
                      <template v-if="responseDiffAssessment">
                        <el-tag v-if="responseDiffAssessment.invalid" type="warning" size="small">
                          非 JSON，无法评估
                        </el-tag>
                        <template v-else-if="responseDiffAssessment.isIdentical">
                          <el-tag type="success" size="small">属性结构一致</el-tag>
                        </template>
                        <template v-else>
                          <el-tag type="primary" size="small">
                            属性匹配度 {{ responseDiffAssessment.matchRate }}%
                          </el-tag>
                          <el-tag type="success" size="small">
                            相同属性 {{ responseDiffAssessment.stats.same }}
                          </el-tag>
                          <el-tag type="warning" size="small">
                            结构差异 {{ responseDiffAssessment.stats.modified }}
                          </el-tag>
                          <el-tag type="info" size="small">
                            新增属性 {{ responseDiffAssessment.stats.added }}
                          </el-tag>
                          <el-tag type="danger" size="small">
                            缺失属性 {{ responseDiffAssessment.stats.deleted }}
                          </el-tag>
                        </template>
                      </template>
                    </div>
                  </div>
                  <div class="response-split-toolbar__actions">
                    <el-tooltip content="真实数据响应和mock数据差异比对" placement="top">
                      <span class="response-split-toolbar__tooltip-wrap">
                        <el-button
                          size="small"
                          :disabled="!canCompareResponse"
                          @click="openResponseCompare"
                        >
                          <el-icon class="mr-[10px]"><View /></el-icon>
                          差异详细比对
                        </el-button>
                      </span>
                    </el-tooltip>
                  </div>
                </div>
                <div class="response-split">
                  <div class="response-split__pane response-split__pane--real">
                    <div class="response-split__header">
                      <span class="response-split__title">响应</span>
                      <div v-if="activeSession.responseResult" class="response-meta">
                        <el-tag v-if="activeSession.responseFromMock" type="warning" size="small">
                          Mock
                        </el-tag>
                        <el-tag
                          v-if="activeSession.responseResult.status"
                          :type="
                            activeSession.responseResult.status >= 200 &&
                            activeSession.responseResult.status < 300
                              ? 'success'
                              : 'danger'
                          "
                          size="small"
                        >
                          {{ activeSession.responseResult.status }}
                          {{ activeSession.responseResult.statusText || '' }}
                        </el-tag>
                        <span v-if="activeSession.responseResult.duration != null">
                          {{ activeSession.responseResult.duration }}ms
                        </span>
                        <span v-if="activeSession.responseResult.size != null">
                          {{ formatSize(activeSession.responseResult.size) }}
                        </span>
                      </div>
                    </div>
                    <el-tabs
                      v-model="activeSession.responseTab"
                      v-loading="sending"
                      element-loading-text="请求中..."
                      element-loading-background="rgba(0, 0, 0, 0.35)"
                      class="response-tabs"
                    >
                      <el-tab-pane label="Body" name="body">
                        <div class="response-body-panel">
                          <div
                            v-if="getSessionResponseBody(activeSession)"
                            class="response-body-toolbar"
                          >
                            <el-button
                              link
                              type="primary"
                              size="small"
                              @click="
                                copyResponseBody(getSessionResponseBody(activeSession), '响应')
                              "
                            >
                              <el-icon><CopyDocument /></el-icon>
                              复制
                            </el-button>
                            <el-button link type="danger" size="small" @click="clearResponseBody">
                              清空
                            </el-button>
                          </div>
                          <div v-if="activeSession.responseError" class="response-error">
                            {{ activeSession.responseError }}
                          </div>
                          <JsonMonacoEditor
                            v-else-if="getSessionResponseBody(activeSession)"
                            :key="`${activeSession.id}-response-body`"
                            :model-value="getSessionResponseBody(activeSession)"
                            read-only
                            class="response-monaco-editor"
                          />
                          <el-empty v-else description="点击发送后查看响应" />
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="Headers" name="headers">
                        <pre
                          v-if="getSessionResponseHeaders(activeSession)"
                          class="response-body"
                          >{{ getSessionResponseHeaders(activeSession) }}</pre
                        >
                        <el-empty v-else description="暂无响应头" />
                      </el-tab-pane>
                    </el-tabs>
                  </div>

                  <div class="response-split__pane response-split__pane--mock">
                    <div class="response-split__header">
                      <span class="response-split__title">Mock</span>
                      <div v-if="activeSession.mockResponseResult" class="response-meta">
                        <el-tag type="warning" size="small">Mock</el-tag>
                        <el-tag
                          v-if="activeSession.mockResponseResult.status"
                          :type="
                            activeSession.mockResponseResult.status >= 200 &&
                            activeSession.mockResponseResult.status < 300
                              ? 'success'
                              : 'danger'
                          "
                          size="small"
                        >
                          {{ activeSession.mockResponseResult.status }}
                          {{ activeSession.mockResponseResult.statusText || '' }}
                        </el-tag>
                        <span v-if="activeSession.mockResponseResult.duration != null">
                          {{ activeSession.mockResponseResult.duration }}ms
                        </span>
                        <span v-if="activeSession.mockResponseResult.size != null">
                          {{ formatSize(activeSession.mockResponseResult.size) }}
                        </span>
                      </div>
                      <div class="response-split__actions">
                        <div class="mock-switch">
                          <span class="mock-switch__label">Mock</span>
                          <el-switch
                            v-model="activeSession.mockEnabled"
                            size="small"
                            :before-change="beforeMockEnabledChange"
                            @change="handleMockEnabledChange"
                          />
                        </div>
                        <el-button size="small" @click="toggleMockPanel">Mock配置</el-button>
                      </div>
                    </div>
                    <el-tabs v-model="activeSession.mockResponseTab" class="response-tabs">
                      <el-tab-pane label="Body" name="body">
                        <div class="response-body-panel">
                          <div
                            v-if="getSessionMockResponseBody(activeSession)"
                            class="response-body-toolbar"
                          >
                            <el-button
                              link
                              type="primary"
                              size="small"
                              @click="
                                copyResponseBody(getSessionMockResponseBody(activeSession), 'Mock')
                              "
                            >
                              <el-icon><CopyDocument /></el-icon>
                              复制
                            </el-button>
                            <el-button
                              link
                              type="danger"
                              size="small"
                              @click="clearMockResponseBody"
                            >
                              清空
                            </el-button>
                          </div>
                          <div v-if="activeSession.mockResponseError" class="response-error">
                            {{ activeSession.mockResponseError }}
                          </div>
                          <JsonMonacoEditor
                            v-else-if="getSessionMockResponseBody(activeSession)"
                            :key="`${activeSession.id}-mock-response-body`"
                            :model-value="getSessionMockResponseBody(activeSession)"
                            read-only
                            class="response-monaco-editor"
                          />
                          <el-empty v-else :description="'请配置并应用 Mock数据'" />
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="Headers" name="headers">
                        <pre
                          v-if="getSessionMockResponseHeaders(activeSession)"
                          class="response-body"
                          >{{ getSessionMockResponseHeaders(activeSession) }}</pre
                        >
                        <el-empty v-else description="暂无 Mock 响应头" />
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="main-empty">
          <el-empty description="请选择或新建一个接口">
            <el-button type="primary" @click="addBlankTab">新建标签页</el-button>
          </el-empty>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <div
          v-if="contextMenu.node?.type === 'folder'"
          class="context-menu-item"
          @click="handleAddFolder(contextMenu.node.id)"
        >
          新建子目录
        </div>
        <div
          v-if="contextMenu.node?.type === 'folder'"
          class="context-menu-item"
          @click="handleAddApi(contextMenu.node.id)"
        >
          新建接口
        </div>
        <div
          v-if="contextMenu.node?.type === 'api'"
          class="context-menu-item"
          @click="
            () => {
              openApiInTab(contextMenu.node, { forceNew: true })
              closeContextMenu()
            }
          "
        >
          在新标签页打开
        </div>
        <div class="context-menu-item" @click="openRenameDialog">重命名</div>
        <div class="context-menu-item delete" @click="handleDeleteNode">删除</div>
      </div>
    </Teleport>

    <el-dialog
      v-model="responseCompareVisible"
      :title="responseCompareTitle"
      width="90vw"
      top="5vh"
      fullscreen
      class="response-compare-dialog"
      append-to-body
    >
      <div class="response-compare-dialog__content">
        <JsonGitDiff
          :left-json="responseCompareData.leftJson"
          :right-json="responseCompareData.mockJson"
          :left-label="responseCompareLeftLabel"
          :right-label="responseCompareMockLabel"
        />
      </div>
      <template #footer>
        <el-button @click="responseCompareVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renameDialogVisible" title="重命名" width="420px">
      <el-input v-model="renameInput" placeholder="请输入名称" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    shallowRef,
    watch,
  } from 'vue'
  import { debounce } from 'lodash'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Close,
    CopyDocument,
    Folder,
    FolderAdd,
    Plus,
    Search,
    View,
  } from '@element-plus/icons-vue'
  import draggable from 'vuedraggable'
  import KeyValueTable from './components/KeyValueTable.vue'
  import MockPanel from './components/MockPanel.vue'
  import JsonMonacoEditor from './components/JsonMonacoEditor.vue'
  import JsonGitDiff from '@/views/tools/routePage/compare/JsonGitDiff.vue'
  import { buildJsonDiffAssessment } from '@/views/tools/routePage/compare/jsonStructuralDiff'
  import SystemProxyBar from '@/views/switchProxy/components/SystemProxyBar.vue'
  import { systemProxyToggleLoading } from '@/views/switchProxy/useSystemProxy'
  import { getSystemProxyStatus } from '@/views/switchProxy/proxyService'
  import { SYSTEM_PROXY_CHANGED_EVENT } from '@/views/switchProxy/constants'
  import { apiDebugService, buildTreeData, loadApiDebugList } from './apiDebugService'
  import { loadSessionCache, saveSessionCache } from './sessionCacheService'
  import { formatResponseBody, formatSize, sendHttpRequest } from './sendApiRequest'
  import { copyToClipboard } from '@/utils'
  import {
    HTTP_METHODS,
    createDefaultApi,
    createDefaultFolder,
    createEmptyKeyValue,
    createSessionTab,
    ensureMockCases,
  } from './types'

  const SIDEBAR_WIDTH_KEY = 'apiDebugSidebarWidth'
  const SIDEBAR_MIN_WIDTH = 200
  const SIDEBAR_MAX_WIDTH = 520
  const SIDEBAR_DEFAULT_WIDTH = 230

  const REQUEST_SECTION_HEIGHT_KEY = 'apiDebugRequestSectionHeight'
  const REQUEST_SECTION_MIN = 160
  const RESPONSE_SECTION_MIN = 120
  const REQUEST_SECTION_DEFAULT = 220

  const apiDebugRef = ref(null)
  const sessionWorkspaceRef = ref(null)
  const sidebarWidth = ref(SIDEBAR_DEFAULT_WIDTH)
  const requestSectionHeight = ref(REQUEST_SECTION_DEFAULT)
  const isSidebarResizing = ref(false)
  const isPanelResizing = ref(false)
  const mockPanelVisible = ref(false)
  const responseCompareVisible = ref(false)
  const responseCompareData = ref({
    leftJson: '',
    mockJson: '',
  })

  const loading = ref(false)
  const saving = ref(false)
  const sending = ref(false)
  const searchKeyword = ref('')
  const nodeList = ref([])
  const sessionTabs = ref([])
  const activeTabId = ref('')
  const workspaceTabsRef = ref(null)
  const treeRef = ref(null)
  const skipPersist = ref(false)

  const renameDialogVisible = ref(false)
  const renameInput = ref('')
  const renameTargetId = ref('')
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  })

  const treeProps = {
    children: 'children',
    label: 'name',
  }

  const activeSession = computed(
    () => sessionTabs.value.find(tab => tab.tabId === activeTabId.value) || null
  )

  const canShowDiffAssessment = computed(() => {
    const session = activeSession.value
    if (!session) {
      return false
    }
    return Boolean(
      getSessionResponseBody(session)?.trim() && getSessionMockResponseBody(session)?.trim()
    )
  })

  const canCompareResponse = computed(() => {
    const session = activeSession.value
    if (!session) {
      return false
    }
    return Boolean(getLeftJsonForCompare(session) && getMockJsonForCompare(session))
  })

  const responseDiffAssessment = computed(() => {
    const session = activeSession.value
    if (!session || !canShowDiffAssessment.value) {
      return null
    }
    return buildJsonDiffAssessment(
      getSessionResponseBody(session),
      getSessionMockResponseBody(session)
    )
  })

  const responseCompareTitle = computed(() => {
    const name = activeSession.value?.api?.name || '接口响应'
    return `响应比对: ${name}`
  })

  const responseCompareLeftLabel = computed(() => {
    const session = activeSession.value
    if (!session) {
      return '响应'
    }
    return session.responseFromMock ? '响应 (Mock)' : '真实响应'
  })

  const responseCompareMockLabel = computed(() => {
    const session = activeSession.value
    if (!session) {
      return 'Mock 数据'
    }
    const mockCase = getActiveMockCase(session)
    return mockCase?.name ? `Mock (${mockCase.name})` : 'Mock 数据'
  })

  const displayTreeData = shallowRef([])

  const treeStructureKey = computed(() => {
    const keyword = searchKeyword.value.trim()
    const signature = nodeList.value
      .map(item =>
        [
          item.id,
          item.type,
          item.parentId ?? '',
          item.name ?? '',
          item.type === 'api' ? (item.method ?? '') : '',
        ].join(':')
      )
      .join('|')
    return `${keyword}::${signature}`
  })

  function rebuildDisplayTree() {
    const keyword = searchKeyword.value.trim().toLowerCase()
    const base = buildTreeData(nodeList.value, null)
    displayTreeData.value = keyword ? filterTree(base, keyword) : base
  }

  watch(treeStructureKey, rebuildDisplayTree, { immediate: true })

  function getSessionResponseBody(session) {
    if (!session?.responseResult || session.responseResult.code !== 0) {
      return ''
    }
    return formatResponseBody(session.responseResult.data)
  }

  function getSessionResponseHeaders(session) {
    if (!session?.responseResult?.headers) {
      return ''
    }
    return JSON.stringify(session.responseResult.headers, null, 2)
  }

  function getSessionMockResponseBody(session) {
    if (!session?.mockResponseResult || session.mockResponseResult.code !== 0) {
      return ''
    }
    return formatResponseBody(session.mockResponseResult.data)
  }

  function getSessionMockResponseHeaders(session) {
    if (!session?.mockResponseResult?.headers) {
      return ''
    }
    return JSON.stringify(session.mockResponseResult.headers, null, 2)
  }

  /** 左侧响应区当前展示的内容（含 Mock 发送时的左侧数据） */
  function getLeftJsonForCompare(session) {
    return getSessionResponseBody(session)
  }

  function getMockJsonForCompare(session) {
    const fromResponse = getSessionMockResponseBody(session)
    if (fromResponse) {
      return fromResponse
    }
    const mockCase = getActiveMockCase(session)
    if (!mockCase?.body?.trim()) {
      return ''
    }
    try {
      return JSON.stringify(JSON.parse(mockCase.body), null, 2)
    } catch {
      return mockCase.body
    }
  }

  function openResponseCompare() {
    const session = activeSession.value
    if (!session) {
      return
    }
    const leftJson = getLeftJsonForCompare(session)
    const mockJson = getMockJsonForCompare(session)
    if (!leftJson) {
      ElMessage.warning('请先发送请求，左侧响应区需有内容')
      return
    }
    if (!mockJson) {
      ElMessage.warning('请先配置并应用 Mock 场景，或开启 Mock 后预览右侧数据')
      return
    }
    responseCompareData.value = { leftJson, mockJson }
    responseCompareVisible.value = true
  }

  async function copyResponseBody(text, label = '响应') {
    const content = String(text || '').trim()
    if (!content) {
      ElMessage.warning('暂无内容可复制')
      return
    }
    try {
      await copyToClipboard(content)
      ElMessage.success(`${label} Body 已复制`)
    } catch {
      ElMessage.error('复制失败')
    }
  }

  async function clearResponseBody() {
    const session = activeSession.value
    if (!session) {
      return
    }
    if (!getSessionResponseBody(session) && !session.responseError) {
      ElMessage.warning('暂无响应内容可清空')
      return
    }
    clearSessionResponse(session)
    await flushSessionCache()
    ElMessage.success('响应已清空')
  }

  async function clearMockResponseBody() {
    const session = activeSession.value
    if (!session) {
      return
    }
    if (!getSessionMockResponseBody(session)) {
      ElMessage.warning('暂无 Mock 内容可清空')
      return
    }
    clearSessionMockResponse(session)
    await flushSessionCache()
    ElMessage.success('Mock 响应已清空')
  }

  function filterTree(nodes, keyword) {
    const result = []
    nodes.forEach(node => {
      if (node.type === 'folder') {
        const children = filterTree(node.children || [], keyword)
        if (children.length || node.name.toLowerCase().includes(keyword)) {
          result.push({ ...node, children })
        }
        return
      }
      const text = `${node.name} ${node.method || ''} ${node.url || ''}`.toLowerCase()
      if (text.includes(keyword)) {
        result.push({ ...node })
      }
    })
    return result
  }

  function cloneApi(node) {
    return JSON.parse(JSON.stringify(node))
  }

  function buildSavedResponseSnapshot(session) {
    return {
      responseResult: session.responseResult ? cloneApi(session.responseResult) : null,
      responseError: session.responseError || '',
      responseFromMock: Boolean(session.responseFromMock),
      mockResponseResult: session.mockResponseResult ? cloneApi(session.mockResponseResult) : null,
      mockResponseError: session.mockResponseError || '',
    }
  }

  function applySavedResponseToSession(session, node, options = {}) {
    const { onlyIfEmpty = false } = options
    const saved = node?.savedResponse
    if (!saved || !session) {
      return
    }
    const hasLeft = Boolean(session.responseResult || session.responseError)
    const hasRight = Boolean(session.mockResponseResult || session.mockResponseError)
    if (onlyIfEmpty && (hasLeft || hasRight)) {
      return
    }
    session.responseResult = saved.responseResult ?? null
    session.responseError = saved.responseError ?? ''
    session.responseFromMock = saved.responseFromMock ?? false
    session.mockResponseResult = saved.mockResponseResult ?? null
    session.mockResponseError = saved.mockResponseError ?? ''
  }

  function ensureKeyValueList(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return [createEmptyKeyValue()]
    }
    return list
  }

  function prepareApiNode(node) {
    const api = cloneApi(node)
    api.queryParams = ensureKeyValueList(api.queryParams)
    api.headers = ensureKeyValueList(api.headers)
    api.mockCases = ensureMockCases(api.mockCases)
    return api
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function buildMockUrlPattern(url) {
    const value = String(url || '').trim()
    if (!value) {
      return ''
    }
    const suffix = value.includes('?') ? '' : '(?:\\?.*)?'
    return `^${escapeRegExp(value)}${suffix}$`
  }

  function ensureMockUrlPattern(session) {
    if (!session?.api || String(session.api.mockUrlPattern || '').trim()) {
      return
    }
    session.api.mockUrlPattern = buildMockUrlPattern(session.api.url)
  }

  function validateMockUrlPattern(pattern) {
    const value = String(pattern || '').trim()
    if (!value) {
      return ''
    }
    try {
      new RegExp(value)
      return ''
    } catch (error) {
      return error?.message || '正则表达式错误'
    }
  }

  function toggleMockPanel() {
    mockPanelVisible.value = !mockPanelVisible.value
    if (mockPanelVisible.value && activeSession.value) {
      activeSession.value.api.mockCases = ensureMockCases(activeSession.value.api.mockCases)
      if (!activeSession.value.activeMockCaseId) {
        activeSession.value.activeMockCaseId = activeSession.value.api.mockCases[0]?.id || ''
      }
      ensureMockUrlPattern(activeSession.value)
    }
  }

  function getActiveMockCase(session) {
    if (!session?.api?.mockCases?.length) {
      return null
    }
    return (
      session.api.mockCases.find(item => item.id === session.activeMockCaseId) ||
      session.api.mockCases[0]
    )
  }

  function buildResponseFromMockCase(mockCase) {
    const parsed = JSON.parse(mockCase.body)
    const bodyStr = JSON.stringify(parsed)
    return {
      code: 0,
      status: mockCase.statusCode || 200,
      statusText: 'OK',
      data: parsed,
      duration: mockCase.delay || 0,
      size: new Blob([bodyStr]).size,
      headers: { 'content-type': 'application/json' },
    }
  }

  function setMockResponseFromCase(session, mockCase) {
    if (!session || !mockCase) {
      return
    }
    try {
      session.mockResponseResult = buildResponseFromMockCase(mockCase)
      session.mockResponseError = ''
      session.mockResponseTab = 'body'
    } catch (error) {
      session.mockResponseResult = null
      session.mockResponseError = error?.message || 'Mock 数据无效'
    }
  }

  function setResponseFromMockCase(session, mockCase) {
    if (!session || !mockCase) {
      return
    }
    try {
      session.responseResult = buildResponseFromMockCase(mockCase)
      session.responseError = ''
      session.responseTab = 'body'
      session.responseFromMock = true
    } catch (error) {
      session.responseResult = null
      session.responseError = error?.message || 'Mock 数据无效'
      session.responseFromMock = false
    }
  }

  function refreshAppliedMockResponse(session) {
    if (!session?.mockEnabled) {
      return
    }
    if (session.api?.savedResponse?.mockResponseResult) {
      return
    }
    const mockCase = getActiveMockCase(session)
    if (!mockCase) {
      return
    }
    setMockResponseFromCase(session, mockCase)
  }

  function refreshAllAppliedMockResponses() {
    sessionTabs.value.forEach(tab => refreshAppliedMockResponse(tab))
  }

  async function beforeMockEnabledChange() {
    const session = activeSession.value
    if (!session || session.mockEnabled) {
      return true
    }

    try {
      const status = await getSystemProxyStatus()
      if (status?.enabled) {
        return true
      }
    } catch (error) {
      ElMessage.error('获取系统代理状态失败')
      return false
    }

    await ElMessageBox.alert(
      '请先开启顶部的「全局系统代理」，Mock 拦截才会生效。',
      '无法开启 Mock',
      { type: 'warning', confirmButtonText: '知道了' }
    )
    return false
  }

  function clearSessionResponse(session) {
    if (!session) {
      return
    }
    session.responseResult = null
    session.responseError = ''
    session.responseFromMock = false
  }

  function clearSessionMockResponse(session) {
    if (!session) {
      return
    }
    session.mockResponseResult = null
    session.mockResponseError = ''
  }

  function handleMockEnabledChange(enabled) {
    const session = activeSession.value
    if (!session) {
      return
    }
    session.api.mockEnabled = enabled
    if (enabled) {
      session.api.mockCases = ensureMockCases(session.api.mockCases)
      ensureMockUrlPattern(session)
      const patternError = validateMockUrlPattern(session.api.mockUrlPattern)
      if (patternError) {
        ElMessage.error(`Mock 匹配规则无效：${patternError}`)
        session.mockEnabled = false
        session.api.mockEnabled = false
        return
      }
      if (!session.activeMockCaseId) {
        session.activeMockCaseId = session.api.mockCases[0]?.id || ''
      }
      // refreshAppliedMockResponse(session)
    } else {
      // clearSessionMockResponse(session)
      if (session.responseFromMock) {
        session.responseResult = null
        session.responseError = ''
        session.responseFromMock = false
      }
    }
    persistMockSettingsDebounced()
  }

  async function persistMockSettings() {
    const session = activeSession.value
    if (!session || String(session.apiId).startsWith('draft-')) {
      return
    }

    session.api.mockEnabled = session.mockEnabled
    session.api.activeMockCaseId = session.activeMockCaseId
    session.api.mockCases = cloneApi(session.api.mockCases || [])
    if (session.api.mockEnabled) {
      ensureMockUrlPattern(session)
    }
    const patternError = validateMockUrlPattern(session.api.mockUrlPattern)
    if (patternError) {
      return
    }

    const index = nodeList.value.findIndex(item => item.id === session.apiId)
    if (index === -1) {
      return
    }

    nodeList.value[index] = {
      ...nodeList.value[index],
      method: session.api.method,
      url: session.api.url,
      mockEnabled: session.api.mockEnabled,
      activeMockCaseId: session.api.activeMockCaseId,
      mockUrlPattern: session.api.mockUrlPattern,
      mockCases: session.api.mockCases,
      updateTime: new Date().toISOString(),
    }
    await persistList()
  }

  const persistMockSettingsDebounced = debounce(persistMockSettings, 400)

  async function applyMockResponse(session, mockCase) {
    if (mockCase.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, mockCase.delay))
    }
    setMockResponseFromCase(session, mockCase)
  }

  async function handleApplyMock(mockCase) {
    const session = activeSession.value
    if (!session || !mockCase) {
      return
    }
    sending.value = true
    try {
      JSON.parse(mockCase.body)
      ensureMockUrlPattern(session)
      const patternError = validateMockUrlPattern(session.api.mockUrlPattern)
      if (patternError) {
        ElMessage.error(`Mock 匹配规则无效：${patternError}`)
        return
      }
      session.activeMockCaseId = mockCase.id
      session.api.activeMockCaseId = mockCase.id
      // if (session.mockEnabled) {
      //   await applyMockResponse(session, mockCase)
      // } else if (session.mockResponseResult) {
      //   clearSessionMockResponse(session)
      // }
      await applyMockResponse(session, mockCase)

      await persistMockSettings()
      await flushSessionCache()
      mockPanelVisible.value = false
      // ElMessage.success(
      //   session.mockEnabled
      //     ? `已应用 Mock：${mockCase.name}`
      //     : `已选择 Mock 场景：${mockCase.name}，开启 Mock 开关后生效`,
      // )
      ElMessage.success(`已应用 Mock：${mockCase.name}`)
    } catch (error) {
      ElMessage.error(error?.message || 'Mock 数据无效')
    } finally {
      sending.value = false
    }
  }

  async function handleSaveMock() {
    await handleSave()
  }

  function normalizeSessionTab(tab) {
    const api = prepareApiNode(tab.api)
    const mockCases = ensureMockCases(api.mockCases)
    api.mockCases = mockCases
    const resolvedActiveMockCaseId =
      api.activeMockCaseId || tab.activeMockCaseId || mockCases[0]?.id || ''
    api.activeMockCaseId = resolvedActiveMockCaseId
    const normalized = {
      ...tab,
      api,
      mockEnabled: tab.mockEnabled ?? api.mockEnabled ?? false,
      activeMockCaseId: resolvedActiveMockCaseId,
      mockResponseResult: tab.mockResponseResult ?? null,
      mockResponseError: tab.mockResponseError ?? '',
      mockResponseTab: tab.mockResponseTab || 'body',
      responseFromMock: tab.responseFromMock ?? false,
    }
    return normalized
  }

  function syncTabMockFromNodeList(tab) {
    const normalized = normalizeSessionTab(tab)
    const node = nodeList.value.find(item => item.id === tab.apiId && item.type === 'api')
    if (!node) {
      return normalized
    }

    const api = normalized.api
    if (node.mockCases?.length) {
      api.mockCases = ensureMockCases(node.mockCases)
    }
    api.mockUrlPattern = node.mockUrlPattern ?? api.mockUrlPattern
    const resolvedActiveMockCaseId =
      node.activeMockCaseId ||
      api.activeMockCaseId ||
      normalized.activeMockCaseId ||
      api.mockCases[0]?.id ||
      ''
    api.activeMockCaseId = resolvedActiveMockCaseId
    api.mockEnabled = node.mockEnabled ?? normalized.mockEnabled ?? false
    api.name = node.name ?? api.name

    return {
      ...normalized,
      mockEnabled: node.mockEnabled ?? normalized.mockEnabled ?? false,
      activeMockCaseId: resolvedActiveMockCaseId,
      api,
    }
  }

  function restoreSavedResponsesForEmptyTabs() {
    sessionTabs.value.forEach(tab => {
      const node = nodeList.value.find(item => item.id === tab.apiId && item.type === 'api')
      applySavedResponseToSession(tab, node, { onlyIfEmpty: true })
    })
  }

  function openApiInTab(node, options = { forceNew: false }) {
    if (!node || node.type !== 'api') {
      return
    }

    if (!options.forceNew) {
      const existing = sessionTabs.value.find(tab => tab.apiId === node.id)
      if (existing) {
        switchTab(existing.tabId)
        return
      }
    }

    const tab = createSessionTab(prepareApiNode(node))
    sessionTabs.value.push(tab)
    switchTab(tab.tabId)
  }

  function addBlankTab() {
    const api = prepareApiNode(createDefaultApi(null, '未命名接口'))
    api.id = `draft-${Date.now()}`
    const tab = createSessionTab(api)
    sessionTabs.value.push(tab)
    switchTab(tab.tabId)
  }

  function switchTab(tabId) {
    const tab = sessionTabs.value.find(item => item.tabId === tabId)
    if (!tab) {
      return
    }
    activeTabId.value = tabId
    nextTick(() => {
      treeRef.value?.setCurrentKey(tab.apiId)
      scrollTabIntoView(tabId)
    })
    void flushSessionCache()
  }

  function scrollTabIntoView(tabId) {
    nextTick(() => {
      const container = workspaceTabsRef.value?.$el ?? workspaceTabsRef.value
      if (!container) {
        return
      }
      const tabEl = container.querySelector(`[data-tab-id="${tabId}"]`)
      if (!tabEl) {
        return
      }

      const tabLeft = tabEl.offsetLeft
      const tabRight = tabLeft + tabEl.offsetWidth
      const { scrollLeft, clientWidth } = container

      if (tabLeft < scrollLeft) {
        container.scrollLeft = tabLeft
      } else if (tabRight > scrollLeft + clientWidth) {
        container.scrollLeft = tabRight - clientWidth
      }
    })
  }

  function onTabDragEnd() {
    void flushSessionCache()
  }

  function closeTab(tabId) {
    const index = sessionTabs.value.findIndex(tab => tab.tabId === tabId)
    if (index === -1) {
      return
    }
    sessionTabs.value.splice(index, 1)
    if (activeTabId.value !== tabId) {
      void flushSessionCache()
      return
    }
    if (sessionTabs.value.length === 0) {
      activeTabId.value = ''
      treeRef.value?.setCurrentKey(null)
      void flushSessionCache()
      return
    }
    switchTab(sessionTabs.value[Math.min(index, sessionTabs.value.length - 1)].tabId)
  }

  async function persistSessionCache() {
    if (skipPersist.value) {
      return
    }
    try {
      await saveSessionCache({
        activeTabId: activeTabId.value,
        tabs: JSON.parse(JSON.stringify(sessionTabs.value)),
      })
    } catch (error) {
      console.warn('[apiDebug] 保存 Tab 缓存失败:', error)
    }
  }

  const persistSessionCacheDebounced = debounce(persistSessionCache, 300)

  function flushSessionCache() {
    persistSessionCacheDebounced.cancel()
    return persistSessionCache()
  }

  async function disableAllMocksWhenProxyOff() {
    let proxyEnabled = false
    try {
      const status = await getSystemProxyStatus()
      proxyEnabled = Boolean(status?.enabled)
    } catch (error) {
      console.warn('[apiDebug] getSystemProxyStatus failed:', error)
      return
    }

    if (proxyEnabled) {
      return
    }

    let listChanged = false
    nodeList.value = nodeList.value.map(item => {
      if (item.type === 'api' && item.mockEnabled) {
        listChanged = true
        return {
          ...item,
          mockEnabled: false,
          updateTime: new Date().toISOString(),
        }
      }
      return item
    })

    sessionTabs.value.forEach(tab => {
      tab.mockEnabled = false
      tab.api.mockEnabled = false
    })

    if (listChanged) {
      await persistList()
    }
  }

  async function loadList() {
    loading.value = true
    skipPersist.value = true
    try {
      nodeList.value = await loadApiDebugList()
      const cache = await loadSessionCache()

      if (cache.tabs.length > 0) {
        sessionTabs.value = cache.tabs.map(syncTabMockFromNodeList)
        activeTabId.value = cache.activeTabId
        await nextTick()
        const activeTab = sessionTabs.value.find(tab => tab.tabId === activeTabId.value)
        if (activeTab?.apiId) {
          treeRef.value?.setCurrentKey(activeTab.apiId)
        }
        scrollTabIntoView(activeTabId.value)
      } else {
        sessionTabs.value = []
        activeTabId.value = ''
        const firstApi = nodeList.value.find(item => item.type === 'api')
        if (firstApi) {
          openApiInTab(firstApi)
        }
      }

      await disableAllMocksWhenProxyOff()
      restoreSavedResponsesForEmptyTabs()
      refreshAllAppliedMockResponses()
    } catch (error) {
      ElMessage.error(error?.message || '加载接口列表失败')
    } finally {
      skipPersist.value = false
      loading.value = false
    }
  }

  function selectApi(node) {
    openApiInTab(node)
  }

  function handleNodeClick(node) {
    if (node.type === 'api') {
      selectApi(node)
    }
  }

  async function persistList() {
    await apiDebugService.writeAll(nodeList.value)
  }

  async function handleSave() {
    const session = activeSession.value
    if (!session) {
      return
    }
    saving.value = true
    try {
      session.api.updateTime = new Date().toISOString()
      session.api.mockEnabled = session.mockEnabled
      session.api.activeMockCaseId = session.activeMockCaseId
      const patternError = validateMockUrlPattern(session.api.mockUrlPattern)
      if (patternError) {
        ElMessage.error(`Mock 匹配规则无效：${patternError}`)
        return
      }
      session.api.savedResponse = buildSavedResponseSnapshot(session)
      const savedApi = cloneApi(session.api)
      const index = nodeList.value.findIndex(item => item.id === savedApi.id)
      if (index === -1) {
        nodeList.value.push(savedApi)
      } else {
        nodeList.value[index] = savedApi
      }
      session.apiId = savedApi.id
      await persistList()
      await flushSessionCache()
      ElMessage.success('保存成功')
    } catch (error) {
      ElMessage.error(error?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  async function handleSend() {
    const session = activeSession.value
    if (!session) {
      return
    }
    sending.value = true
    session.responseResult = null
    session.responseError = ''
    session.responseFromMock = false
    try {
      if (session.mockEnabled) {
        const mockCase = getActiveMockCase(session)
        if (!mockCase) {
          ElMessage.error('请先配置 Mock 场景')
          return
        }
        if (mockCase.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, mockCase.delay))
        }
        setResponseFromMockCase(session, mockCase)
        if (session.responseError) {
          ElMessage.error(session.responseError)
          return
        }
        ElMessage.success(`Mock 响应：${mockCase.name}`)
        return
      }

      const result = await sendHttpRequest(session.api)
      session.responseResult = result
      session.responseFromMock = false
      if (result.code !== 0) {
        session.responseError = result.message || '请求失败'
        ElMessage.error(session.responseError)
        return
      }
      if (result.status && result.status >= 400) {
        ElMessage.warning(`HTTP ${result.status}`)
      }
    } catch (error) {
      session.responseError = error?.message || '请求失败'
      session.responseFromMock = false
      ElMessage.error(session.responseError)
    } finally {
      sending.value = false
      await flushSessionCache()
    }
  }

  async function handleAddFolder(parentId) {
    closeContextMenu()
    const folder = createDefaultFolder(parentId)
    nodeList.value.push(folder)
    await persistList()
    ElMessage.success('目录已创建')
  }

  async function handleAddApi(parentId) {
    closeContextMenu()
    const api = createDefaultApi(parentId)
    nodeList.value.push(api)
    await persistList()
    selectApi(api)
  }

  function handleNodeContextMenu(event, node) {
    event.preventDefault()
    contextMenu.visible = true
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.node = node
  }

  function closeContextMenu() {
    contextMenu.visible = false
    contextMenu.node = null
  }

  function openRenameDialog() {
    if (!contextMenu.node) {
      return
    }
    renameTargetId.value = contextMenu.node.id
    renameInput.value = contextMenu.node.name
    renameDialogVisible.value = true
    closeContextMenu()
  }

  async function confirmRename() {
    const name = renameInput.value.trim()
    if (!name || !renameTargetId.value) {
      ElMessage.warning('请输入名称')
      return
    }
    const node = nodeList.value.find(item => item.id === renameTargetId.value)
    if (node) {
      node.name = name
      sessionTabs.value.forEach(tab => {
        if (tab.apiId === node.id) {
          tab.api.name = name
        }
      })
      await persistList()
    }
    renameDialogVisible.value = false
    renameTargetId.value = ''
  }

  async function handleDeleteNode() {
    const node = contextMenu.node
    closeContextMenu()
    if (!node) {
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除「${node.name}」吗？`, '提示', { type: 'warning' })
    } catch {
      return
    }

    const idsToDelete = new Set([node.id])
    if (node.type === 'folder') {
      const collect = parentId => {
        nodeList.value.forEach(item => {
          if (item.parentId === parentId) {
            idsToDelete.add(item.id)
            if (item.type === 'folder') {
              collect(item.id)
            }
          }
        })
      }
      collect(node.id)
    }

    nodeList.value = nodeList.value.filter(item => !idsToDelete.has(item.id))
    sessionTabs.value = sessionTabs.value.filter(tab => !idsToDelete.has(tab.apiId))
    if (sessionTabs.value.length === 0) {
      activeTabId.value = ''
    } else if (!sessionTabs.value.some(tab => tab.tabId === activeTabId.value)) {
      switchTab(sessionTabs.value[0].tabId)
    }
    await persistList()
    ElMessage.success('删除成功')
  }

  watch(renameDialogVisible, visible => {
    if (!visible) {
      renameTargetId.value = ''
    }
  })

  watch(
    sessionTabs,
    () => {
      persistSessionCacheDebounced()
    },
    { deep: true }
  )

  watch(activeTabId, () => {
    mockPanelVisible.value = false
    persistSessionCacheDebounced()
  })

  watch(
    () => {
      const session = activeSession.value
      if (!session) {
        return null
      }
      return [
        session.mockEnabled,
        session.activeMockCaseId,
        session.api.mockUrlPattern,
        JSON.stringify(session.api.mockCases || []),
      ]
    },
    () => {
      persistMockSettingsDebounced()
    }
  )

  const startSidebarResize = event => {
    event.preventDefault()
    isSidebarResizing.value = true
    const initialX = event.clientX
    const initialWidth = sidebarWidth.value
    const containerWidth = apiDebugRef.value?.offsetWidth || 0

    const updateSize = moveEvent => {
      const deltaX = moveEvent.clientX - initialX
      const maxWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, containerWidth - 320)
      )
      sidebarWidth.value = Math.max(SIDEBAR_MIN_WIDTH, Math.min(maxWidth, initialWidth + deltaX))
    }

    const stopResize = () => {
      isSidebarResizing.value = false
      document.removeEventListener('mousemove', updateSize)
      document.removeEventListener('mouseup', stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth.value))
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', updateSize)
    document.addEventListener('mouseup', stopResize)
  }

  const startPanelResize = event => {
    event.preventDefault()
    isPanelResizing.value = true
    const initialY = event.clientY
    const initialHeight = requestSectionHeight.value
    const workspaceHeight = sessionWorkspaceRef.value?.offsetHeight || 0
    const resizerHeight = 4

    const updateSize = moveEvent => {
      const deltaY = moveEvent.clientY - initialY
      const maxHeight = workspaceHeight - RESPONSE_SECTION_MIN - resizerHeight
      requestSectionHeight.value = Math.max(
        REQUEST_SECTION_MIN,
        Math.min(maxHeight, initialHeight + deltaY)
      )
    }

    const stopResize = () => {
      isPanelResizing.value = false
      document.removeEventListener('mousemove', updateSize)
      document.removeEventListener('mouseup', stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      localStorage.setItem(REQUEST_SECTION_HEIGHT_KEY, String(requestSectionHeight.value))
    }

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', updateSize)
    document.addEventListener('mouseup', stopResize)
  }

  async function handleSystemProxyChanged(event) {
    if (event?.detail?.enabled !== false) {
      return
    }

    persistMockSettingsDebounced.cancel()
    const list = await loadApiDebugList()
    nodeList.value = list
    sessionTabs.value.forEach(tab => {
      tab.mockEnabled = false
      tab.api.mockEnabled = false
      const node = list.find(item => item.id === tab.apiId && item.type === 'api')
      if (node) {
        tab.api.mockCases = ensureMockCases(node.mockCases ?? tab.api.mockCases)
        tab.api.activeMockCaseId = node.activeMockCaseId ?? tab.api.activeMockCaseId
      }
      applySavedResponseToSession(tab, node, { onlyIfEmpty: true })
    })
    void flushSessionCache()
  }

  function handlePageHide() {
    persistSessionCacheDebounced.flush()
  }

  onBeforeUnmount(() => {
    window.removeEventListener(SYSTEM_PROXY_CHANGED_EVENT, handleSystemProxyChanged)
    window.removeEventListener('pagehide', handlePageHide)
    persistSessionCacheDebounced.flush()
    persistMockSettingsDebounced.flush()
  })

  onMounted(() => {
    window.addEventListener(SYSTEM_PROXY_CHANGED_EVENT, handleSystemProxyChanged)
    window.addEventListener('pagehide', handlePageHide)
    const savedWidth = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY))
    if (savedWidth >= SIDEBAR_MIN_WIDTH && savedWidth <= SIDEBAR_MAX_WIDTH) {
      sidebarWidth.value = savedWidth
    }
    const savedHeight = Number(localStorage.getItem(REQUEST_SECTION_HEIGHT_KEY))
    if (savedHeight >= REQUEST_SECTION_MIN && savedHeight !== 320) {
      requestSectionHeight.value = savedHeight
    }
    loadList()
  })
</script>

<style scoped lang="scss">
  .api-debug {
    --ad-bg: #121212;
    --ad-bg-elevated: #1a1a1a;
    --ad-bg-panel: #1e1e1e;
    --ad-border: #2e2e2e;
    --ad-text: #e0e0e0;
    --ad-text-muted: #bdbdbd;
    --ad-text-dim: #9e9e9e;
    --ad-accent: #90caf9;
    --ad-accent-soft: #1e3a5f;
    --ad-hover: #252525;
    --ad-radius: 8px;
    --ad-radius-sm: 6px;
    --ad-transition: 0.18s ease;

    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
    background: var(--ad-bg);
    color: var(--ad-text);
    overflow: hidden;
  }

  .api-debug__global-proxy {
    flex-shrink: 0;
    border-bottom: 1px solid var(--ad-border);
    background: var(--ad-bg-elevated);
  }

  .api-debug__body {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    overflow: hidden;
  }

  .api-debug__sidebar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--ad-bg-elevated);
    border-right: 1px solid var(--ad-border);
  }

  .api-debug__resizer {
    flex-shrink: 0;
    width: 4px;
    cursor: col-resize;
    user-select: none;
    background: var(--ad-border);
    transition: background var(--ad-transition);

    &:hover,
    &--active {
      background: #64b5f6;
    }
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 16px 12px;
  }

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    color: #f0f0f0;
    letter-spacing: 0.02em;
  }

  .sidebar-actions {
    display: flex;
    gap: 4px;

    :deep(.el-button) {
      color: #64b5f6;

      &:hover {
        color: var(--ad-accent);
      }
    }
  }

  .sidebar-search {
    padding: 0 12px 12px;

    :deep(.el-input__wrapper) {
      background: var(--ad-hover);
      box-shadow: none;
      border-radius: var(--ad-radius-sm);
      transition: background var(--ad-transition);

      &:hover,
      &.is-focus {
        background: #2a2a2a;
        box-shadow: none;
      }
    }

    :deep(.el-input__inner) {
      color: var(--ad-text);
    }
  }

  .sidebar-tree {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 10px 16px;

    :deep(.el-tree) {
      background: transparent;
      color: var(--ad-text-muted);
    }

    :deep(.el-tree-node__content) {
      height: 32px;
      border-radius: var(--ad-radius-sm);
      transition:
        background var(--ad-transition),
        color var(--ad-transition);

      &:hover {
        background: var(--ad-hover);
      }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background: var(--ad-accent-soft);
      color: var(--ad-accent);
      font-weight: 600;
    }

    :deep(.el-tree-node__expand-icon) {
      color: var(--ad-text-dim);
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding-right: 8px;
  }

  .tree-node__icon {
    flex-shrink: 0;
    color: var(--el-color-warning);
  }

  .tree-node__method {
    flex-shrink: 0;
    width: 42px;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
  }

  .method-get {
    color: #49aa19;
  }

  .method-post {
    color: #d89614;
  }

  .method-put {
    color: #177ddc;
  }

  .method-delete {
    color: #a61d24;
  }

  .method-patch {
    color: #642ab5;
  }

  .tree-node__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .api-debug__main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 12px 12px;
    gap: 10px;
    background: var(--ad-bg);
  }

  .workspace-tabs {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    margin: 0 -12px;
    padding: 8px 8px 0;
    border-bottom: 1px solid var(--ad-border);
    background: var(--ad-bg-elevated);
  }

  .workspace-tabs__scroll {
    display: flex;
    align-items: stretch;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 4px;

    &::-webkit-scrollbar {
      height: 4px;
    }
  }

  .workspace-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 220px;
    padding: 0 12px;
    height: 32px;
    border-radius: var(--ad-radius-sm) var(--ad-radius-sm) 0 0;
    cursor: grab;
    color: var(--ad-text-muted);
    background: transparent;
    flex-shrink: 0;
    user-select: none;
    transition:
      background var(--ad-transition),
      color var(--ad-transition);

    &:active {
      cursor: grabbing;
    }

    &--ghost {
      opacity: 0.45;
      background: var(--ad-hover);
    }

    &--dragging {
      cursor: grabbing;
      background: var(--ad-bg-panel);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    &:hover {
      background: var(--ad-hover);
      color: var(--ad-accent);
    }

    &--active {
      background: var(--ad-bg);
      color: var(--ad-accent);
      font-weight: 600;
      box-shadow: none;
    }

    &__method {
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 700;
    }

    &__name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
    }

    &__close {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--ad-text-dim);
      border-radius: 4px;
      cursor: pointer;
      transition:
        color var(--ad-transition),
        background var(--ad-transition);

      &:hover {
        color: var(--ad-text);
        background: var(--ad-hover);
      }
    }
  }

  .workspace-tabs__add {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    margin-left: 4px;
    border: none;
    border-radius: var(--ad-radius-sm);
    background: transparent;
    color: #64b5f6;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    transition:
      background var(--ad-transition),
      color var(--ad-transition);

    &:hover {
      background: var(--ad-hover);
      color: var(--ad-accent);
    }
  }

  .request-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 4px 0;
    flex-shrink: 0;

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      background: var(--ad-hover);
      box-shadow: none;
      border-radius: var(--ad-radius-sm);
      transition: background var(--ad-transition);

      &:hover,
      &.is-focus {
        background: #2a2a2a;
        box-shadow: none;
      }
    }

    :deep(.el-button--primary) {
      border-radius: var(--ad-radius-sm);
      border: none;
    }

    :deep(.el-button:not(.el-button--primary)) {
      border-radius: var(--ad-radius-sm);
      background: var(--ad-hover);
      border-color: var(--ad-border);
      color: var(--ad-text-muted);

      &:hover {
        background: #2a2a2a;
        color: var(--ad-text);
      }
    }
  }

  .method-select {
    width: 110px;
    flex-shrink: 0;
  }

  .url-input {
    flex: 1;
  }

  .session-workspace {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .request-section {
    flex-shrink: 0;
    min-height: 160px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-resizer {
    flex-shrink: 0;
    height: 4px;
    cursor: row-resize;
    user-select: none;
    background: var(--ad-border);
    border-radius: 2px;
    margin: 2px 0;
    transition: background var(--ad-transition);

    &:hover,
    &--active {
      background: #64b5f6;
    }
  }

  .request-tabs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      background-color: var(--ad-border);
      height: 1px;
    }

    :deep(.el-tabs__item) {
      color: var(--ad-text-dim);
      transition: color var(--ad-transition);

      &:hover {
        color: var(--ad-accent);
      }

      &.is-active {
        color: var(--ad-accent);
      }
    }

    :deep(.el-tabs__active-bar) {
      background-color: var(--ad-accent);
      height: 2px;
      border-radius: 2px;
    }

    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 8px 4px 12px;
    }
  }

  .body-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .body-editor {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .response-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--ad-bg-elevated);
    border-radius: var(--ad-radius);
    overflow: hidden;
  }

  .response-split-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 8px;
    gap: 8px;
  }

  .response-split-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 4px 0 4px 8px;
    flex-shrink: 0;

    &__actions {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    &__tooltip-wrap {
      display: inline-flex;
    }

    :deep(.el-button) {
      border-radius: 6px;
      background: #252525;
      border-color: #2e2e2e;
      color: #bdbdbd;
      transition:
        background 0.18s ease,
        color 0.18s ease;

      &:hover:not(.is-disabled) {
        background: #2a2a2a;
        color: #90caf9;
        border-color: #3a3a3a;
      }

      &.is-disabled {
        opacity: 0.45;
      }
    }
  }

  .response-diff-assessment {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    flex: 1;

    &__label {
      font-size: 12px;
      font-weight: 600;
      color: #bdbdbd;
      flex-shrink: 0;
      cursor: help;
    }

    &__placeholder {
      font-size: 12px;
      color: #757575;
    }

    :deep(.el-tag) {
      border-radius: 4px;
    }
  }

  .response-split {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 8px;
    overflow: hidden;
  }

  .response-split__pane {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--ad-bg-panel);
    border-radius: var(--ad-radius-sm);

    &--mock {
      border-left: none;
    }
  }

  .response-split__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--ad-border);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;

    &--mock-panel {
      justify-content: space-between;
      background: var(--ad-bg-elevated);
      border-bottom: 1px solid var(--ad-border);
      border-radius: var(--ad-radius-sm) var(--ad-radius-sm) 0 0;
    }
  }

  .response-split__title {
    font-weight: 600;
    font-size: 13px;
    color: #f0f0f0;
    flex-shrink: 0;
  }

  .response-split__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    flex-shrink: 0;

    :deep(.el-button) {
      border-radius: 6px;
      background: #252525;
      border-color: #2e2e2e;
      color: #bdbdbd;

      &:hover {
        background: #2a2a2a;
        color: #90caf9;
      }
    }
  }

  .response-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-lighter);
  }

  .response-title {
    font-weight: 600;
  }

  .response-toolbar__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mock-switch {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px;
  }

  .mock-switch__label {
    font-size: 12px;
    color: var(--ad-text-dim);
  }

  .response-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: var(--ad-text-dim);
  }

  .response-tabs {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      padding-left: 12px;
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      background-color: var(--ad-border);
      height: 1px;
    }

    :deep(.el-tabs__item) {
      color: var(--ad-text-dim);
      font-size: 13px;
      transition: color var(--ad-transition);

      &:hover {
        color: var(--ad-accent);
      }

      &.is-active {
        color: var(--ad-accent);
      }
    }

    :deep(.el-tabs__active-bar) {
      background-color: var(--ad-accent);
      height: 2px;
      border-radius: 2px;
    }

    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  .response-body-panel {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .response-body-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-bottom: 1px solid var(--ad-border);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;
  }

  .response-monaco-editor {
    flex: 1;
    min-height: 0;
  }

  .response-body {
    margin: 0;
    padding: 14px;
    flex: 1;
    min-height: 0;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    background: #1e1e1e;
    color: #d4d4d4;
  }

  .response-error {
    padding: 14px;
    color: var(--el-color-danger);
  }

  .main-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .context-menu {
    position: fixed;
    z-index: 3000;
    min-width: 140px;
    background: #252525;
    border: 1px solid #3a3a3a;
    border-radius: var(--ad-radius-sm);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    padding: 4px 0;
  }

  .context-menu-item {
    padding: 8px 18px;
    cursor: pointer;
    font-size: 14px;
    color: var(--ad-text);
    transition: background var(--ad-transition);

    &:hover {
      background: #333;
    }

    &.delete {
      color: #ef5350;
    }
  }
</style>

<style lang="scss">
  .response-compare-dialog.el-dialog.is-fullscreen {
    --el-dialog-margin-top: 37px;
    margin-top: 37px !important;
    height: calc(100vh - 37px) !important;
    margin-bottom: 0;
  }

  .response-compare-dialog {
    .el-dialog__body {
      padding: 20px;
      height: calc(100vh - 48px - 118px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .response-compare-dialog__content {
      flex: 1;
      min-height: 0;
      overflow: hidden;

      .json-git-diff {
        height: 100%;
      }
    }
  }
</style>
