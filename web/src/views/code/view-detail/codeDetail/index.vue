<template>
  <div class="home">
    <div class="c-flex-x-between">
      <!-- 分组-start -->
      <div
        :class="[
          'always-use c-flex-y-start c-animation-transition',
          { 'always-use-show': typeList.length > 0 && groupShow },
        ]"
      >
        <div class="always-use-title c-flex-x-between">
          <div>分组</div>
          <el-tooltip
            placement="right"
            :show-arrow="true"
            class="custom-tooltip"
            effect="customized"
            :enterable="false"
            :hide-after="0"
          >
            <template #default>
              <div
                v-if="!isSearchStatus"
                class="c-flex-x-end always-use-item-content add-group-btn"
                @click="addGroup"
              >
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
            class="always-use-item"
            v-for="item in typeList"
            :key="item"
            :class="[
              {
                isOfficial: item.isOfficial,
                active: currentClickType === item.id,
              },
            ]"
            @click="executeAlways(item)"
            @contextmenu.prevent="
              $event => {
                contextOrigin = 1
                showContextMenu($event, item)
              }
            "
          >
            <!-- <el-tooltip
            placement="right"
            :show-arrow="true"
            class="custom-tooltip"
            effect="customized"
          >
            <template #default> -->
            <div class="always-use-item-content">
              <div
                class="always-use-item-title c-ellipsis-single c-cursor c-animation-transition c-animation-moveup"
              >
                {{ item.type_name }}

                <!-- <div
                    v-if="item.alwaysHover"
                    class="always-use-item-run c-flex-x-center"
                    v-loading="item.alwaysUseNumHover"
                  >
                    切换分组
                  </div> -->
              </div>
              <!-- <span
                  v-if="item.alwaysUseNum"
                  class="num-count c-flex-x-center"
                  >{{ item.alwaysUseNum }}</span
                > -->
            </div>
            <!-- </template>
            <template #content>
              <div class="custom-tooltip-content">
                <div class="app-tooltip-title">{{ item.type_name }}</div>
              </div>
            </template>
          </el-tooltip> -->
          </div>
        </div>
      </div>
      <!-- 分组-end -->

      <!-- 应用列表-start -->
      <div class="home-group-list c-flex-y-start">
        <div class="header-row">
          <div class="c-flex-x-start">
            <div class="title">代码片段列表</div>
            <el-input
              v-model="searchInput"
              style="width: 250px"
              class="search-input"
              placeholder="搜索"
              :prefix-icon="Search"
              clearable
              @keydown.enter="handleSearch"
              @clear="handleSearchClear"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>

            <!-- <VanishingInput
            class="search-input-vanishing"
            v-model="searchInput"
            :placeholders="['搜索']"
            @submit="handleSearch"
          >
          </VanishingInput> -->
            <!-- <el-input
            v-model="searchInput"
            style="width: 250px"
            class="search-input"
            placeholder="搜索"
            :prefix-icon="Search"
            clearable
            @keydown.enter="handleSearch"
            @clear="handleSearchClear"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button> -->
          </div>
          <template v-if="!isSearchStatus">
            <RippleButton v-if="!typeList.length" @click="addGroup">添加分组</RippleButton>
            <RippleButton
              v-if="typeList.length && currentClickTypeGroup && !currentClickTypeGroup.isOfficial"
              @click="addAppCode"
            >
              添加代码片段
            </RippleButton>
          </template>
        </div>

        <div class="type-list-container" v-loading="dataListLoading">
          <div class="list-item-code" :class="[tailWind.flexRowStart]">
            <CustomScrollbar
              v-if="currentCodeItem"
              class="code-titles w-[200px] h-full border-r-[1px] border-r-white"
              :width="8"
              color="rgba(255, 255, 255, 0.5)"
              :force-show="true"
            >
              <div v-for="item in dataList" :key="item.id">
                <el-tooltip placement="right" :visible="item.visibleTooltip || false">
                  <template #default>
                    <div
                      :class="[
                        'code-titles-item h-auto p-[10px] border-b-[1px] border-b-white bg-[#1E1E1E] cursor-pointer relative',
                        {
                          active: currentCodeItem.id === item.id,
                          last: item.id === dataList[dataList.length - 1].id,
                        },
                      ]"
                      @click="toggleCode(item)"
                      @contextmenu.prevent="
                        $event => {
                          contextOrigin = 2
                          showContextMenu($event, item)
                        }
                      "
                    >
                      {{ item.article_name }}
                      <div class="absolute right-[3px] top-0" @click.stop="toggleToolTip(item)">
                        <el-icon><QuestionFilled color="#fff" /></el-icon>
                      </div>
                    </div>
                  </template>
                  <template #content>
                    <div class="custom-item custom-tooltip-content-code" @click.stop>
                      <div class="custom-item-title w-[300px]">
                        <img v-if="item.code_iconUrl" :src="item.code_iconUrl" alt="icon" />
                        <span v-else class="text-[#fff]">暂无示例图片</span>
                      </div>
                      <div
                        v-if="item.article_name"
                        class="custom-item-detail always-tooltip-title-code w-[300px]"
                      >
                        <span>代码名称：</span>
                        {{ item.article_name }}
                      </div>
                      <div
                        v-if="item.article_editorDescription"
                        class="custom-item-detail always-tooltip-detail-code w-[300px]"
                        v-html="handleText(item.article_editorDescription)"
                      ></div>
                    </div>
                  </template>
                </el-tooltip>
              </div>
            </CustomScrollbar>
            <div class="code-content flex-1 h-full">
              <div v-show="currentCodeItem" class="code-content-content bg-[#1E1E1E]">
                <div
                  class="p-[10px] h-[55px] border-b-[1px] border-b-[#ffffff] mb-[10px]"
                  v-if="currentCodeItem?.editorLanguage"
                >
                  <div :class="[tailWind.flexRowStart]">
                    <div
                      :class="[
                        tailWind.flexRowStart,
                        'pr-[10px]',
                        'border-r-[1px] border-r-[#ffffff]',
                        'mr-[10px]',
                      ]"
                    >
                      <div class="w-[50px]">语言</div>
                      <el-select
                        class="h-full"
                        filterable
                        v-model="editorLanguageCache"
                        placeholder="请选择语言"
                        @change="handleLanguageChange"
                      >
                        <el-option
                          :label="item.label"
                          :value="item.value"
                          v-for="item in getLanguageOptions()"
                          :key="item.value"
                        />
                      </el-select>
                    </div>
                    <div
                      :class="[
                        tailWind.flexRowStart,
                        'pr-[10px]',
                        'border-r-[1px] border-r-[#ffffff]',
                        'mr-[10px]',
                      ]"
                    >
                      <div class="w-[70px]">示例图片</div>
                      <el-tooltip placement="top" content="直接粘贴截图ctrl+v 或 输入icon的线上url地址">
                        <el-icon class="mr-[5px] cursor-pointer">
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                      <el-input
                        ref="inputCodeUpload"
                        class="item-icon-url flex-1 mr-[10px]"
                        placeholder="粘贴截图 或 线上url"
                        v-model="currentCodeItem.code_iconUrl"
                      ></el-input>
                      <el-image
                        v-if="currentCodeItem.code_iconUrl"
                        class="preview-icon w-[30px] h-[30px] border-[3px] border-[var(--el-color-primary)] rounded-full"
                        ref="imageRef"
                        :src="currentCodeItem.code_iconUrl"
                        show-progress
                        :preview-src-list="[currentCodeItem.code_iconUrl]"
                        fit="cover"
                      />
                    </div>
                    <div :class="[tailWind.flexRowStart]">
                      <div class="w-[45px]">描述</div>
                      <el-icon class="mr-[5px] cursor-pointer" @click="toggleFullScreen">
                        <FullScreen />
                      </el-icon>
                      <el-input
                        class="description-textarea h-[30px]"
                        type="textarea"
                        resize="none"
                        placeholder="请输入代码描述"
                        v-model="currentCodeItem.article_editorDescription"
                        @change="handleDescriptionChange"
                      />
                    </div>
                  </div>
                </div>
                <div class="h-[calc(100%-65px)]">
                  <MonacoEditor
                    ref="monacoEditorRef"
                    :language="editorLanguageCache || 'javascript'"
                    :theme="editorTheme"
                    height="100%"
                    @change="handleMonacoChange"
                    :options="{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      automaticLayout: true,
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 应用列表-end -->

      <!-- 添加分组弹窗-start -->
      <CommonDialog
        v-model="addGroupVisible"
        :title="isEdit ? '编辑分组' : '添加分组'"
        width="500px"
      >
        <div class="addGroup-content">
          <el-input
            v-model="addGroupInput"
            placeholder="请输入分组名称(首字母不能是数字)"
            @input="handleGroupInputChange"
          />
        </div>
        <template #footer>
          <el-button @click="closeAddGroupClick">取消</el-button>
          <!-- 编辑状态 | 添加状态 -->
          <el-button v-if="isEdit" @click="editGroupConfirm">确定</el-button>
          <el-button v-else @click="addGroupConfirmClick">确定</el-button>
        </template>
      </CommonDialog>
      <!-- 添加分组弹窗-end -->

      <!-- 添加应用弹窗-start -->
      <CommonDialog
        v-model="addAppVisible"
        :title="isDataEdit ? '编辑代码' : '添加代码'"
        width="500px"
      >
        <div :class="['addApp-content', tailWind.flexColCenter, 'items-start', 'gap-[10px]']">
          <el-input
            v-model="addAppForm.article_name"
            placeholder="请输入代码名称"
            @input="handleAppNameInputChange"
          />
          <!-- <el-input v-model="addAppForm.app_address" placeholder="请输入应用线上地址" />
        <el-input v-model="addAppForm.app_introduce" placeholder="请输入应用描述" />
        <el-input
          ref="inputUpload"
          class="item-icon-url"
          placeholder="直接粘贴截图ctrl+v 或 输入icon的线上url地址"
          v-model="addAppForm.app_iconUrl"
        ></el-input>
        <div class="c-flex-x-start preview-icon-container" v-if="addAppForm.app_iconUrl">
          <span>icon预览：</span>
          <img class="preview-icon" :src="addAppForm.app_iconUrl" alt="icon" />
        </div> -->
        </div>
        <template #footer>
          <el-button @click="closeAddAppClick">取消</el-button>

          <el-button v-if="isDataEdit" @click="editAppConfirmClick">确定</el-button>
          <el-button v-else @click="addAppConfirmClick">确定</el-button>
        </template>
      </CommonDialog>
      <!-- 添加应用弹窗-end -->

      <!-- 分组右键菜单-start -->
      <div
        v-show="contextMenuVisible && !currentContextItem.isOfficial"
        class="context-menu"
        :style="{
          left: contextMenuPosition.x + 'px',
          top: contextMenuPosition.y + 'px',
        }"
        @click="hideContextMenu"
      >
        <div class="context-menu-item" @click="editClick">
          <el-icon>
            <Edit />
          </el-icon>
          <span>编辑</span>
        </div>
        <div class="context-menu-item" @click="deleteClick">
          <el-icon>
            <Delete />
          </el-icon>
          <span>删除</span>
        </div>
      </div>
      <!-- 分组右键菜单-end -->

      <!-- 全屏弹窗-start -->
      <CommonDialog v-model="fullScreenStatus" title="描述" width="500px">
        <div class="full-screen-modal-content">
          <el-input v-model="fullScreenInput" type="textarea" placeholder="请输入全屏内容" />
        </div>
        <template #footer>
          <el-button @click="fullScreenStatus = false">取消</el-button>
          <el-button @click="saveFullScreen">确定</el-button>
        </template>
      </CommonDialog>
      <!-- 全屏弹窗-end -->
    </div>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, watch, nextTick, toRaw } from 'vue'
  import { ElInput, ElButton, ElMessage, ElTooltip } from 'element-plus'
  import { Search } from '@element-plus/icons-vue'
  import { openExternal, isInElectron, jsBridge } from '@/utils/electron'
  import 'xterm/css/xterm.css'
  import RippleButton from '@/components/buttons/RippleButton.vue'
  import MonacoEditor from 'monaco-editor-vue3'
  import CustomScrollbar from '@/components/CustomScrollbar.vue'
  // import VanishingInput from "@/components/input/VanishingInput.vue";
  import { ElMessageBox } from 'element-plus'
  import { tailWind } from '@/utils/tailwind'
  import { marked } from 'marked'
  // 配置marked选项
  marked.setOptions({
    breaks: true, // 允许换行符转换为<br>
    gfm: true, // 启用GitHub风格的Markdown
    headerIds: false, // 禁用标题ID以避免XSS
    mangle: false, // 禁用邮件地址混淆
  })

  // 工具
  import { getFavicon, searchAndGroupByType, getDataTypeByGroupsWithStats } from './utils/helper'
  import { cloneDeep } from 'lodash'

  // 样式
  import '@/assets/flex.scss'
  import { getLanguageOptions } from './utils/language'

  // 数据列表hook
  import { useDataListHook } from './hooks/useDataListHook'
  const {
    isDataEdit,
    dataListAll,
    getDataListAll,
    currentCodeItem,
    dataList,
    getDataList,
    dataListLoading,
    addAppVisible,
    addAppForm,
    addApp,
    addAppConfirm,
    editApp,
    editAppConfirm,
    resetAddAppForm,
    deleteApp,
  } = useDataListHook()

  // 分组列表hook
  import { useTypeListHook } from './hooks/useTypeListHook'
  const {
    isEdit,
    typeListAll,
    typeList,
    getDataTypeList,
    addGroupVisible,
    addGroupInput,
    addGroup,
    addGroupConfirm,
    currentEditGroup,
    editGroup,
    editGroupConfirm,
    deleteGroup,
  } = useTypeListHook()

  // 右键菜单hook
  import { useContextMenu } from './hooks/useContextMenu'
  const {
    contextMenuVisible,
    contextMenuPosition,
    currentContextItem,
    showContextMenu,
    hideContextMenu,
  } = useContextMenu()

  // 剪贴板hook
  import { useClipboardHook } from './hooks/useClipboard'
  const inputCodeUpload = ref(null)
  const { pasteDataReault } = useClipboardHook({
    domRef: inputCodeUpload,
    callback: async clipboardData => {
      const url = clipboardData.url

      if (url) {
        currentCodeItem.value.code_iconUrl = url
        // 更新数据库中的内容
        await updateCodeApi({ code_iconUrl: url })

        ElMessage.success('icon上传成功')
      }
    },
  })

  const tabPosition = ref('code')
  const contextOrigin = ref(1) // 1: 分组, 2: 应用
  const editorLanguageCache = ref('javascript')
  const groupShow = ref(false)
  const fullScreenStatus = ref(false)
  const fullScreenInput = ref('')

  // 切换分组-start
  const currentClickType = ref(null) // 当前点击的分组id
  const currentClickTypeGroup = ref(null) // 当前点击的分组对象数据
  async function executeAlways(item) {
    const appType = item.id
    currentClickType.value = appType
    currentClickTypeGroup.value = item

    // 如果搜索状态，则更新数据列表
    if (isSearchStatus.value) {
      dataList.value = searchAndGrouped.value.groups[appType] || []
    } else {
      await getDataList({ appType, typeList: typeList.value, isFirst: true })

      // 默认切换到第一个代码
      if (dataList.value.length) {
        toggleCode(dataList.value[0])
      }
    }
  }
  // 切换分组-end

  // 搜索-start
  const isSearchStatus = ref(false)
  const searchAndGrouped = ref([]) // 搜索并分组数据
  const searchInput = ref('')
  // 搜索，同时更新搜索状态
  async function handleSearch() {
    const text = searchInput.value
    if (text) {
      isSearchStatus.value = true

      // 搜索并分组（一步完成）
      const searchData = searchAndGroupByType(text, dataListAll.value, [
        'article_name',
        'article_editorDescription',
        'article_content',
      ])

      if (searchData.searchResults.length === 0) {
        ElMessage.error('没有找到相关代码')
        typeList.value = []
        dataList.value = []
        // 清空编辑器内容
        clearEditor()
        return
      }

      searchAndGrouped.value = searchData

      // 搜索类型列表
      const { groups } = searchData
      const dataTypes = getDataTypeByGroupsWithStats(groups, typeListAll.value)
      // console.log('groups')
      // console.log(searchData)
      // console.log(groups)
      // console.log(dataTypes)

      // 更新类型列表
      typeList.value = dataTypes.dataTypes
      if (typeList.value.length) {
        currentClickType.value = typeList.value[0].id
        currentClickTypeGroup.value = typeList.value[0]

        dataList.value = groups[currentClickType.value] || []

        // 切换代码
        currentCodeItem.value = dataList.value[0]
        toggleCode(currentCodeItem.value)
      } else {
        dataList.value = []
      }
    } else {
      isSearchStatus.value = false
      searchAndGrouped.value = []

      typeList.value = typeListAll.value
      await loadAppList()

      // 切换代码
      currentCodeItem.value = dataList.value[0]
      toggleCode(currentCodeItem.value)
    }
  }
  async function handleSearchClear() {
    await handleSearch()
  }
  // 搜索-end

  function clearEditor() {
    currentCodeItem.value = null
    monacoEditorRef.value.editor.setValue('')
  }

  function openApp(item) {
    if (isInElectron()) {
      openExternal(item.app_address)
    } else {
      window.open(item.app_address, '_blank')
    }
  }
  function editClick() {
    if (contextOrigin.value === 1) {
      editGroup(currentContextItem.value)
    } else {
      editAppClick(currentContextItem.value)
    }
  }
  async function deleteClick() {
    if (contextOrigin.value === 1) {
      const chooseId = currentContextItem.value.id

      // 如果删除的是当前分组，则清空当前分组
      if (currentContextItem.value.id === currentClickType.value) {
        currentClickType.value = null
        currentClickTypeGroup.value = null
      }

      // 删除分组
      await deleteGroup(currentContextItem.value)

      // 获取分组下的所有代码数据
      const chooseData = dataListAll.value.filter(item => item.code_type === chooseId)
      // 删除分组下的所有代码
      for (let i = 0; i < chooseData.length; i++) {
        const item = chooseData[i]
        await jsBridge.registerSync({
          method: 'proxySql',
          json: {
            methods: 'remove',
            data: { id: item.id, sql: `dataSql/dataSnippet.json` },
          },
        })
      }

      // 加载应用列表
      await loadAppList()
    } else {
      await deleteCode(currentContextItem.value)
    }
  }
  async function deleteCode(data) {
    await deleteApp(false, data, true, () => {
      toggleCode(currentCodeItem.value)
    })
  }

  async function addGroupConfirmClick() {
    // 添加分组，自动更新 typeList 字段
    await addGroupConfirm()
    // 如果分组列表从0 - 1 的时候，有特殊处理
    if (typeList.value.length === 1) {
      await loadAppList()
    }
  }
  function closeAddGroupClick() {
    addGroupVisible.value = false
    addGroupInput.value = ''
  }

  // 处理分组输入变化，过滤数字
  function handleGroupInputChange(value) {
    const reg = /^[0-9]+/
    // 分组名称不能输入数字
    if (reg.test(value)) {
      // 将首字母数字替换成空字符串
      const filteredValue = value.replace(reg, '')
      addGroupInput.value = filteredValue

      ElMessage.error('分组名称首字母不能是数字')
    }
  }

  // 处理代码名称输入变化，过滤数字
  function handleAppNameInputChange(value) {
    // 只保留中文字符、英文字母、空格、下划线、连字符
    // const filteredValue = value.replace(/[0-9]/g, '')
    // addAppForm.value.article_name = filteredValue
  }

  async function addAppConfirmClick() {
    addAppForm.value.code_type = currentClickType.value
    await addAppConfirm(currentClickTypeGroup.value)
    await getDataListAll()
  }

  function editAppClick(item) {
    addAppForm.value = {
      ...addAppForm.value,
      ...item,
    }

    editApp(addAppForm.value)
  }
  async function editAppConfirmClick() {
    await editAppConfirm(isSearchStatus.value)
    await getDataListAll()
  }
  // async function deleteAppClick(item, index) {
  //   addAppForm.value = {
  //     ...addAppForm.value,
  //     ...item,
  //   }
  //   await deleteApp(item, isSearchStatus.value)
  //   await getDataListAll()
  // }

  function closeAddAppClick() {
    addAppVisible.value = false
    resetAddAppForm()
  }
  // 找到第一个分组, 获取其应用列表, 调用接口
  async function loadAppList() {
    let appType = currentClickType.value
    if (!appType) {
      appType = typeList.value.length ? typeList.value[0].id : null
      currentClickType.value = appType
      currentClickTypeGroup.value = typeList.value[0]
    }

    if (appType) {
      await getDataList({ appType, typeList: typeList.value })

      // 切换代码
      toggleCode(currentCodeItem.value)
    } else {
      dataList.value = []
      currentCodeItem.value = null
      ElMessage.info('请先添加分组')
    }
  }
  async function init() {
    // 获取全部应用数据(不加await，并行调度)
    getDataListAll()

    // 获取应用分组数据(加await，串行调度)
    await getDataTypeList()
    // 加载应用列表（默认加载第一个分组的应用列表）
    await loadAppList()

    setTimeout(() => {
      groupShow.value = true
    }, 300)
  }

  // 切换代码-start
  const monacoEditorRef = ref(null)
  const editorTheme = ref('vs-dark')

  function toggleCode(item) {
    currentCodeItem.value = item

    editorLanguageCache.value = item.editorLanguage

    if (item && item.article_content) {
      monacoEditorRef.value.editor.setValue(item.article_content)
    } else {
      monacoEditorRef.value.editor.setValue('')
    }
  }
  // 切换代码-end

  async function handleMonacoChange(value, editorView) {
    if (!currentCodeItem.value) return

    // 更新数据库中的内容
    await updateCodeApi({ article_content: value })
  }

  // 处理语言切换
  function handleLanguageChange(newLanguage) {
    if (!currentCodeItem.value || !monacoEditorRef.value) return

    // 保存当前编辑器内容
    const currentContent = monacoEditorRef.value.editor.getValue()

    // 更新语言
    // currentCodeItem.value.editorLanguage = editorLanguageCache.value

    // 等待下一个 tick 确保 MonacoEditor 重新渲染
    setTimeout(async () => {
      // 恢复编辑器内容
      if (monacoEditorRef.value && monacoEditorRef.value.editor) {
        monacoEditorRef.value.editor.setValue(currentContent)

        // 设置光标位置到末尾
        // const lineCount = monacoEditorRef.value.editor.getModel().getLineCount()
        // const lastLineLength = monacoEditorRef.value.editor.getModel().getLineMaxColumn(lineCount)
        // monacoEditorRef.value.editor.setPosition({ lineNumber: lineCount, column: lastLineLength })

        // 更新数据库中的内容
        await updateCodeApi({ editorLanguage: newLanguage })
      }
    }, 10)
  }

  function handleDescriptionChange(value) {
    // 更新数据库中的内容
    updateCodeApi({ article_editorDescription: value })
  }

  // 更新数据库中的内容
  async function updateCodeApi(mergeObj) {
    const json = currentCodeItem.value
    delete json.visibleTooltip
    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'update',
        data: {
          id: json.id,
          item: {
            ...json,
            article_content: monacoEditorRef.value.editor.getValue(),
            ...mergeObj,
          },
          sql: `dataSql/dataSnippet.json`,
        },
      },
    })

    // 更新数据
    // await getDataList({ appType: currentClickType.value, isFirst: false })

    // 更新数据列表
    for (let i = 0; i < dataList.value.length; i++) {
      const item = dataList.value[i]
      if (item.id === json.id) {
        dataList.value[i] = {
          ...item,
          ...mergeObj,
        }
      }
    }
    for (let i = 0; i < dataListAll.value.length; i++) {
      const item = dataListAll.value[i]
      if (item.id === json.id) {
        dataListAll.value[i] = {
          ...item,
          ...mergeObj,
        }
      }
    }
  }

  function handleText(text) {
    if (!text) return ''

    try {
      // 配置marked选项
      marked.setOptions({
        breaks: true, // 允许换行符转换为<br>
        gfm: true, // 启用GitHub风格的Markdown
        headerIds: false, // 禁用标题ID以避免XSS
        mangle: false, // 禁用邮件地址混淆
      })

      // 将Markdown转换为HTML
      const html = marked(text)

      // 安全处理：移除潜在的恶意脚本
      const safeHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')

      // 添加样式类，并为链接添加特殊的class和data属性
      const styledHtml = safeHtml
        .replace(
          /<h1>/g,
          '<h1 style="font-size: 16px; font-weight: bold; margin: 8px 0 4px 0; color: #fff;">'
        )
        .replace(
          /<h2>/g,
          '<h2 style="font-size: 15px; font-weight: bold; margin: 6px 0 3px 0; color: #fff;">'
        )
        .replace(
          /<h3>/g,
          '<h3 style="font-size: 14px; font-weight: bold; margin: 4px 0 2px 0; color: #fff;">'
        )
        .replace(
          /<h4>/g,
          '<h4 style="font-size: 13px; font-weight: bold; margin: 3px 0 2px 0; color: #fff;">'
        )
        .replace(
          /<h5>/g,
          '<h5 style="font-size: 12px; font-weight: bold; margin: 2px 0 1px 0; color: #fff;">'
        )
        .replace(
          /<h6>/g,
          '<h6 style="font-size: 11px; font-weight: bold; margin: 2px 0 1px 0; color: #fff;">'
        )
        .replace(/<p>/g, '<p style="margin: 4px 0; color: #bdc3c7;">')
        .replace(
          /<code>/g,
          '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace; color: #42b983; font-size: 11px;">'
        )
        .replace(
          /<pre>/g,
          '<pre style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; overflow-x: auto; margin: 4px 0;">'
        )
        .replace(/<strong>/g, '<strong style="font-weight: bold; color: #42b983;">')
        .replace(/<em>/g, '<em style="font-style: italic; color: #e6a23c;">')
        .replace(/<ul>/g, '<ul style="margin: 4px 0; padding-left: 16px; color: #bdc3c7;">')
        .replace(/<ol>/g, '<ol style="margin: 4px 0; padding-left: 16px; color: #bdc3c7;">')
        .replace(/<li>/g, '<li style="margin: 2px 0; color: #bdc3c7;">')
        .replace(
          /<blockquote>/g,
          '<blockquote style="border-left: 3px solid #42b983; padding-left: 8px; margin: 4px 0; color: #bdc3c7; font-style: italic;">'
        )
        .replace(
          /<a\s+href=/gi,
          '<a class="markdown-link" style="color: #42b983; text-decoration: underline; cursor: pointer;" href='
        )
        .replace(
          /<hr>/g,
          '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 8px 0;">'
        )
        .replace(
          /<table>/g,
          '<table style="border-collapse: collapse; width: 100%; margin: 4px 0;">'
        )
        .replace(
          /<th>/g,
          '<th style="border: 1px solid rgba(255,255,255,0.3); padding: 4px; text-align: left; background: rgba(255,255,255,0.1); color: #fff;">'
        )
        .replace(
          /<td>/g,
          '<td style="border: 1px solid rgba(255,255,255,0.2); padding: 4px; color: #bdc3c7;">'
        )

      return styledHtml
    } catch (error) {
      console.error('Markdown parsing error:', error)
      // 如果解析失败，回退到简单的换行处理
      return text.replace(/\n/g, '<br>')
    }
  }
  function toggleToolTip(item) {
    if (item.visibleTooltip) {
      item.visibleTooltip = false
      delete item.visibleTooltip
    } else {
      hideToolTip()
      item.visibleTooltip = true
    }
  }

  function hideToolTip() {
    dataList.value.forEach(item => {
      item.visibleTooltip = false
      delete item.visibleTooltip
    })
  }

  function toggleFullScreen() {
    fullScreenStatus.value = !fullScreenStatus.value
    fullScreenInput.value = currentCodeItem.value.article_editorDescription
  }

  function saveFullScreen() {
    fullScreenStatus.value = false
    currentCodeItem.value.article_editorDescription = fullScreenInput.value
    updateCodeApi({ article_editorDescription: fullScreenInput.value })
  }

  function addAppCode() {
    if (dataList.value.length === 0) {
      monacoEditorRef.value.editor.setValue('')
    }
    addApp()
  }

  onMounted(async () => {
    // 初始化
    await init()

    document.addEventListener('click', hideToolTip)
  })

  // 组件卸载时移除事件监听器
  onUnmounted(() => {
    document.removeEventListener('click', hideToolTip)
  })
</script>

<style lang="scss" scoped>
  .home {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0 auto;
    align-items: flex-start;
    background: #121212;
    border-radius: 8px;
    overflow: hidden;

    > .c-flex-x-between {
      width: 100%;
      height: 100%;
      min-height: 0;
      align-items: stretch;
    }

    .context-menu {
      position: fixed;
      z-index: 9999;
      background: #252525;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
      min-width: 120px;
      user-select: none;

      .context-menu-item {
        display: flex;
        align-items: center;
        padding: 8px 18px;
        cursor: pointer;
        transition: background 0.18s ease;

        &:hover {
          background: #333;

          span {
            color: #e0e0e0;
          }

          .el-icon {
            color: #90caf9;
          }
        }

        .el-icon {
          margin-right: 8px;
          font-size: 14px;
          color: #bdbdbd;
        }

        span {
          font-size: 14px;
          color: #e0e0e0;
        }
      }
    }

    .always-use {
      margin-right: 12px;
      background-color: #1a1a1a;
      height: 100%;
      padding: 10px 0;
      border-radius: 8px;
      width: 0;
      overflow: hidden;
      border: 1px solid #2e2e2e;
      transition: width 0.3s cubic-bezier(0.45, 0.04, 0.08, 2.29);

      &.always-use-show {
        width: 150px;
      }

      .always-use-title {
        position: relative;
        font-size: 15px;
        font-weight: 600;
        color: #f0f0f0;
        width: 97px;
        text-align: center;
        padding-bottom: 8px;
        padding-top: 3px;
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
        overflow-y: auto;
        padding-top: 7px;
        width: 100%;

        .always-use-item {
          margin-bottom: 8px;
          padding: 0 8px;

          &.isOfficial {
            position: relative;
            margin-bottom: 20px;

            &::after {
              content: '';
              width: 60px;
              height: 1px;
              background: #444;
              position: absolute;
              margin-top: 10px;
              left: 50%;
              transform: translateX(-50%);
            }

            .always-use-item-content {
              .always-use-item-title {
                border: 1px solid #444;
                border-radius: 6px;
                padding: 0;
                line-height: 35px;
              }
            }
          }

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

              .always-use-item-run {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: #1e3a5f;
                color: #90caf9;
              }
            }

            .num-count {
              position: absolute;
              right: 0;
              top: -5px;
              border-radius: 5px;
              padding: 5px;
              height: 20px;
              background-color: #333;
              color: #bdbdbd;
              font-weight: 400;
            }
          }
        }
      }
    }

    .home-group-list {
      flex: 1;
      height: 100%;
      min-width: 0;
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 8px;
      padding: 12px;
    }

    :deep(.preview-icon-container) {
      .preview-icon {
        width: 60px;
        height: 60px;
        border-radius: 6px;
      }
    }

    :deep(.code-titles) {
      border-right-color: #2e2e2e !important;
    }

    :deep(.code-titles-item) {
      border-bottom-color: #2e2e2e !important;
      transition: background 0.18s ease;

      &:hover:not(.active) {
        background-color: #252525 !important;
      }

      &.active {
        background-color: #1e3a5f !important;
        color: #90caf9 !important;
      }
    }

    :deep(.code-content-content) {
      border-radius: 0 6px 6px 0;

      > div:first-child {
        border-bottom-color: #2e2e2e !important;
      }

      [class*='border-r-'] {
        border-right-color: #2e2e2e !important;
      }
    }

    :deep(.el-input__wrapper),
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

    :deep(.el-button:not(.el-button--primary)) {
      background: #252525;
      border-color: #2e2e2e;
      color: #bdbdbd;
      border-radius: 6px;

      &:hover {
        background: #2a2a2a;
        color: #e0e0e0;
      }
    }
  }

  .header-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    border-bottom: 1px solid #2e2e2e;
    padding-bottom: 10px;
    height: 50px;

    .title {
      font-weight: 600;
      color: #f0f0f0;
      font-size: 16px;
      margin-right: 20px;
    }

    .search-input {
      margin-right: 5px;
    }

    .search-input-vanishing {
      height: 39px;
      width: 200px;
    }
  }

  .add-btn {
    margin-bottom: 10px;
  }

  .modal-header {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .type-list-container {
    width: 100%;
    flex: 1;
    overflow-y: auto;
    background: #1e1e1e;
    border-radius: 6px;
    border: 1px solid #2e2e2e;

    .list-item-code {
      width: 100%;
      height: 100%;
      border: none;

      .code-titles {
        position: relative;

        .code-titles-item {
          width: 100%;
          word-break: break-all;
        }
      }
    }
  }

  .type-group-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    // gap: 16px;
    z-index: 2;
    transition: opacity 0.2s;
  }

  // MonacoEditor 样式
  .code-content {
    width: 0;
    .code-content-content {
      height: 100%;
      width: 100%;

      :deep(.monaco-editor) {
        height: 100% !important;
      }
    }
    :deep(.description-textarea) {
      textarea {
        height: 30px;
      }
    }
  }
  :deep(.full-screen-modal-content) {
    textarea {
      height: 300px;
    }
  }
</style>
<style lang="scss">
  // 自定义 tooltip 内容样式
  .custom-tooltip-content-code {
    background-color: #252525;
    border: 1px solid #3a3a3a;
    border-radius: 6px;
    padding: 10px;

    .always-tooltip-title-code {
      font-size: 13px;
      font-weight: 600;
      color: #bdbdbd;
      line-height: 1.4;
      margin-top: 6px;
      max-width: 300px;
      word-wrap: break-word;
      border-bottom: 1px solid #2e2e2e;
      margin-bottom: 6px;
      padding-bottom: 4px;
    }

    .always-tooltip-detail-code {
      border-bottom: 1px solid #2e2e2e;
      max-width: 1000px !important;
      margin-bottom: 6px;
      padding-bottom: 4px;
    }

    .tooltip-detail,
    .always-tooltip-detail-code {
      font-size: 12px;
      color: #bdc3c7;
      line-height: 1.4;
      margin-top: 6px;
      max-width: 300px;
      word-wrap: break-word;

      /* Markdown样式 */
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 8px 0 4px 0;
        color: #fff;
        font-weight: 600;
      }

      p {
        margin: 4px 0;
        color: #bdc3c7;
      }

      code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        color: #42b983;
        font-size: 11px;
      }

      strong {
        font-weight: bold;
        color: #42b983;
      }

      em {
        font-style: italic;
        color: #e6a23c;
      }

      ul,
      ol {
        margin: 4px 0;
        padding-left: 16px;
        color: #bdc3c7;
      }

      li {
        margin: 2px 0;
        color: #bdc3c7;
      }

      blockquote {
        border-left: 3px solid #42b983;
        padding-left: 8px;
        margin: 4px 0;
        color: #bdc3c7;
        font-style: italic;
      }

      /* 限制tooltip内容的最大高度 */
      max-height: 200px;
      overflow-y: auto;

      /* Markdown链接样式 */
      .markdown-link {
        transition: color 0.2s ease;
      }

      .markdown-link:hover {
        color: #90caf9 !important;
        text-decoration: none !important;
      }
    }

    .tooltip-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 6px;

      span {
        font-size: 12px;
        color: #bdc3c7;
      }
    }

    .tooltip-desc {
      font-size: 12px;
      color: #42b983;
      font-style: italic;
    }
  }
</style>
