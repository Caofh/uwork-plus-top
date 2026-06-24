<template>
  <div class="home c-flex-x-between">
    <!-- 分组-start -->
    <div
      :class="[
        'always-use c-flex-y-start c-animation-transition',
        { 'always-use-show': typeList.length > 0 },
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
          @contextmenu.prevent="showContextMenu($event, item)"
        >
          <el-tooltip
            placement="right"
            :show-arrow="true"
            class="custom-tooltip"
            effect="customized"
          >
            <template #default>
              <div class="always-use-item-content">
                <div
                  @mouseenter="item.alwaysHover = true"
                  @mouseleave="item.alwaysHover = false"
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
            </template>
            <template #content>
              <div class="custom-tooltip-content">
                <div class="app-tooltip-title">{{ item.type_name }}</div>
              </div>
            </template>
          </el-tooltip>
        </div>
      </div>
    </div>
    <!-- 分组-end -->

    <!-- 应用列表-start -->
    <div class="home-group-list c-flex-y-start">
      <div class="header-row">
        <div class="c-flex-x-start">
          <div class="title">应用列表</div>
          <!-- <VanishingInput
            class="search-input-vanishing"
            v-model="searchInput"
            :placeholders="['搜索']"
            @submit="handleSearch"
          >
          </VanishingInput> -->
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
          <el-button class="app-header-btn" type="primary" @click="handleSearch">搜索</el-button>
        </div>
        <template v-if="!isSearchStatus">
          <el-button v-if="!typeList.length" class="app-header-btn" type="primary" @click="addGroup">
            添加应用分组
          </el-button>
          <el-button
            v-if="typeList.length && currentClickTypeGroup && !currentClickTypeGroup.isOfficial"
            class="app-header-btn"
            type="primary"
            @click="addApp"
          >
            添加应用
          </el-button>
        </template>
      </div>

      <div class="type-list-container" v-loading="dataListLoading">
        <div class="type-list">
          <div
            class="list-item c-flex-x-center"
            :class="[{ hover: itemApp.hover, 'no-margin-right': index % 6 === 5 }]"
            @mouseenter="itemApp.hover = true"
            @mouseleave="itemApp.hover = false"
            v-for="(itemApp, index) in dataList"
            :key="index"
          >
            <div class="app-icon c-flex-x-center">
              <el-icon :size="30">
                <!-- <component :is="itemApp.appIcon || 'Document'" /> -->
                <img :src="itemApp.app_iconUrl || getFavicon(itemApp.app_address)" alt="app-icon" />
              </el-icon>
            </div>
            <div class="app-detail c-flex-y-center">
              <div class="app-name c-ellipsis-single">
                {{ itemApp.app_name || '' }}
              </div>
              <div class="app-introduce">{{ itemApp.app_introduce || '' }}</div>
            </div>

            <!-- 悬浮显示dom -->
            <div class="hover-show c-flex-x-end">
              <div
                class="btn c-hover c-flex-x-center"
                :class="[{ active: itemApp.hoverBtn }]"
                @mouseenter="itemApp.hoverBtn = true"
                @mouseleave="itemApp.hoverBtn = false"
              >
                <div class="hover-icon c-flex-x-start">
                  <el-icon>
                    <FolderOpened />
                  </el-icon>
                </div>
                <div class="hover-add" @click="openApp(itemApp)">打开应用</div>
              </div>
            </div>

            <template v-if="currentClickTypeGroup && !currentClickTypeGroup.isOfficial">
              <div class="app-btns c-flex-x-end" v-if="itemApp.hover">
                <el-icon class="icon-edit" :size="20" @click="editAppClick(itemApp)">
                  <Edit />
                </el-icon>
                <el-icon :size="20" @click="deleteAppClick(itemApp, index)">
                  <Delete />
                </el-icon>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <!-- 应用列表-end -->

    <!-- 添加分组弹窗-start -->
    <CommonDialog v-model="addGroupVisible" :title="isEdit ? '编辑分组' : '添加分组'" width="500px">
      <div class="addGroup-content">
        <el-input v-model="addGroupInput" placeholder="请输入分组名称" />
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
      :title="isDataEdit ? '编辑应用' : '添加应用'"
      width="500px"
    >
      <div :class="['addApp-content', tailWind.flexColCenter, 'items-start', 'gap-[10px]']">
        <el-input v-model="addAppForm.app_name" placeholder="请输入应用名称" />
        <el-input v-model="addAppForm.app_address" placeholder="请输入应用线上地址" />
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
        </div>
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
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref } from 'vue'
  import { ElInput, ElButton, ElMessage, ElTooltip } from 'element-plus'
  import { Search } from '@element-plus/icons-vue'
  import { openExternal, isInElectron } from '@/utils/electron'
  import 'xterm/css/xterm.css'
  // import VanishingInput from "@/components/input/VanishingInput.vue";

  // 工具
  import { getFavicon, searchAndGroupByType, getDataTypeByGroupsWithStats } from './utils/helper'

  // tailwindcss样式
  const tailWind = {
    flexRowCenter: 'flex flex-row justify-center items-center', // 横向水平居中
    flexRowStart: 'flex flex-row justify-start items-center', // 横向水平靠左
    flexRowBetween: 'flex flex-row justify-between items-center', // 横向水平靠两边
    flexRowEnd: 'flex flex-row justify-end items-center', // 横向水平靠右
    flexColCenter: 'flex flex-col justify-center items-center', // 纵向水平居中
    flexColStart: 'flex flex-col justify-start items-center', // 纵向水平靠上
    flexColBetween: 'flex flex-col justify-between items-center', // 纵向水平靠上下两边
    flexColEnd: 'flex flex-col justify-end items-center', // 纵向水平靠下
  }
  // 样式
  import '@/assets/flex.scss'

  // 数据列表hook
  import { useDataListHook } from './hooks/useDataListHook'
  const {
    isDataEdit,
    dataListAll,
    getDataListAll,
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
  const inputUpload = ref(null)
  const { pasteDataReault } = useClipboardHook({
    domRef: inputUpload,
    callback: clipboardData => {
      if (clipboardData.url) {
        addAppForm.value.app_iconUrl = clipboardData.url
        ElMessage.success('icon上传成功')
      }
    },
  })

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
      await getDataList({ appType, typeList: typeList.value })
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
      const searchData = searchAndGroupByType(text, dataListAll.value)
      searchAndGrouped.value = searchData

      // 更新类型列表
      const { groups } = searchData
      const dataTypes = getDataTypeByGroupsWithStats(groups, typeListAll.value)

      // 更新类型列表
      typeList.value = dataTypes.dataTypes
      if (typeList.value.length) {
        currentClickType.value = typeList.value[0].id
        currentClickTypeGroup.value = typeList.value[0]

        dataList.value = groups[currentClickType.value] || []
      } else {
        dataList.value = []
      }
    } else {
      isSearchStatus.value = false
      searchAndGrouped.value = []

      typeList.value = typeListAll.value
      await loadAppList()
    }
  }
  async function handleSearchClear() {
    await handleSearch()
  }
  // 搜索-end

  function openApp(item) {
    if (isInElectron()) {
      openExternal(item.app_address)
    } else {
      window.open(item.app_address, '_blank')
    }
  }
  function editClick() {
    editGroup(currentContextItem.value)
  }
  async function deleteClick() {
    // 如果删除的是当前分组，则清空当前分组
    if (currentContextItem.value.id === currentClickType.value) {
      currentClickType.value = null
      currentClickTypeGroup.value = null
    }
    await deleteGroup(currentContextItem.value)
    await loadAppList()
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

  async function addAppConfirmClick() {
    addAppForm.value.app_type = currentClickType.value
    await addAppConfirm()
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
  async function deleteAppClick(item, index) {
    addAppForm.value = {
      ...addAppForm.value,
      ...item,
    }
    await deleteApp(item, isSearchStatus.value)
    await getDataListAll()
  }

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
    } else {
      ElMessage.info('请先添加应用分组')
    }
  }
  async function init() {
    // 获取全部应用数据(不加await，并行调度)
    getDataListAll()

    // 获取应用分组数据(加await，串行调度)
    await getDataTypeList()
    // 加载应用列表（默认加载第一个分组的应用列表）
    await loadAppList()
  }

  onMounted(async () => {
    // 初始化
    await init()
  })

  // 组件卸载时移除事件监听器
  onUnmounted(() => {})
</script>

<style lang="scss" scoped>
  .home {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0 auto;
    align-items: stretch;
    background: #121212;
    color: #e0e0e0;
    overflow: hidden;
    box-sizing: border-box;

    /* 右键菜单 */
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
        padding: 8px 16px;
        cursor: pointer;
        transition: background 0.18s ease;

        &:hover {
          background: #333;

          span,
          .el-icon {
            color: #e0e0e0;
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
      flex-shrink: 0;
      margin-right: 0;
      background: #1a1a1a;
      border-right: 1px solid #2e2e2e;
      height: 100%;
      padding: 16px 0 0;
      border-radius: 0;
      width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;

      &.always-use-show {
        width: 130px;
        min-width: 130px;
      }

      .always-use-title {
        position: relative;
        font-size: 16px;
        font-weight: 600;
        color: #f0f0f0;
        width: 100%;
        padding: 0 16px 12px;
        margin-bottom: 8px;
        border-bottom: 1px solid #2e2e2e;
        box-sizing: border-box;

        .add-group-btn {
          cursor: pointer;
          width: 24px;
          height: 24px;
          color: #64b5f6;
          transition: color 0.18s ease;

          &:hover {
            color: #90caf9;
          }
        }
      }

      .always-use-content {
        overflow-y: auto;
        padding: 4px 10px 12px;
        width: 100%;
        flex: 1;
        min-height: 0;

        .always-use-item {
          width: 100%;
          margin-bottom: 4px;

          &.isOfficial {
            position: relative;
            margin-bottom: 16px;

            &::after {
              content: '';
              width: calc(100% - 16px);
              height: 1px;
              background: #2e2e2e;
              position: absolute;
              bottom: -8px;
              left: 8px;
            }

            .always-use-item-content {
              .always-use-item-title {
                border: 1px solid #3a3a3a;
                border-radius: 6px;
                padding: 8px 10px;
                line-height: 1.4;
                background: #252525;
                color: #9e9e9e;
              }
            }
          }

          &.active {
            .always-use-item-content {
              .always-use-item-title {
                background: #1e3a5f;
                color: #90caf9;
                font-weight: 600;
                border-color: transparent;
                box-shadow: none;
              }
            }
          }

          .always-use-item-content {
            position: relative;

            .always-use-item-title {
              font-size: 14px;
              color: #bdbdbd;
              width: 100%;
              min-height: 40px;
              border-radius: 6px;
              text-align: center;
              padding: 8px 10px;
              background: transparent;
              box-shadow: none;

              &:hover {
                background: #252525;
                color: #90caf9;
              }
            }
          }
        }
      }
    }

    .home-group-list {
      flex: 1;
      min-width: 0;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 16px 16px;
      background: #121212;
      box-sizing: border-box;
    }

    :deep(.preview-icon-container) {
      color: #bdbdbd;

      .preview-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        border: 1px solid #2e2e2e;
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
    padding: 12px 0;
    flex-shrink: 0;

    .title {
      font-weight: 600;
      color: #f0f0f0;
      font-size: 16px;
      margin-right: 16px;
    }

    .search-input {
      margin-right: 8px;
    }

    :deep(.search-input .el-input__wrapper) {
      background: #252525;
      border: 1px solid #2e2e2e;
      box-shadow: none;
      transition:
        border-color 0.18s ease,
        background 0.18s ease;
    }

    :deep(.search-input .el-input__wrapper:hover),
    :deep(.search-input .el-input__wrapper.is-focus) {
      border-color: #3a3a3a;
      box-shadow: none;
    }

    :deep(.search-input .el-input__inner) {
      color: #e0e0e0;
    }

    :deep(.search-input .el-input__inner::placeholder) {
      color: #757575;
    }

    :deep(.search-input .el-input__prefix .el-icon) {
      color: #9e9e9e;
    }

    :deep(.app-header-btn.el-button--primary) {
      background: #1e3a5f;
      border-color: #2563eb;
      color: #90caf9;
      border-radius: 6px;
      transition:
        background 0.18s ease,
        border-color 0.18s ease;

      &:hover {
        background: #2563eb;
        border-color: #3b82f6;
        color: #fff;
      }
    }
  }

  .type-list-container {
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    .type-list {
      width: 100%;

      &::after {
        content: '';
        display: block;
        clear: both;
      }

      .list-item {
        float: left;
        position: relative;
        overflow: hidden;
        margin-right: 10px;
        margin-bottom: 14px;
        border-radius: 8px;
        background: #1e1e1e;
        border: 1px solid #2e2e2e;
        width: calc((100% - 50px) / 6);
        height: 96px;
        padding: 12px 14px;
        box-sizing: border-box;
        cursor: pointer;
        transition:
          background 0.18s ease,
          border-color 0.18s ease,
          transform 0.18s ease;

        &:hover {
          background: #252525;
          border-color: #3a3a3a;
        }

        .app-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          box-sizing: border-box;
          border-radius: 8px;
          border: 1px solid #3a3a3a;
          margin-right: 12px;
          background: #252525;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 7px;
          }
        }

        .app-detail {
          flex: 1;
          min-width: 0;
          align-items: flex-start;
          justify-content: center;
          gap: 4px;

          .app-name {
            font-size: 14px;
            font-weight: 600;
            color: #f0f0f0;
            line-height: 22px;
            width: 100%;
            text-align: left;
          }

          .app-introduce {
            line-height: 20px;
            font-size: 12px;
            color: #9e9e9e;
            max-height: 40px;
            opacity: 1;
            text-align: left;
            transition: opacity 0.18s ease;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        }

        .app-btns {
          position: absolute;
          top: 4px;
          right: 6px;
          cursor: pointer;
          background: rgba(30, 30, 30, 0.92);
          border-radius: 6px;
          padding: 2px 4px;
          border: 1px solid #3a3a3a;

          :deep(.el-icon) {
            color: #bdbdbd;
            transition: color 0.18s ease;

            &:hover {
              color: #90caf9;
            }
          }

          .icon-edit {
            margin-right: 4px;
          }
        }

        .hover-show {
          position: absolute;
          right: 0;
          bottom: -50px;
          width: 100%;
          height: 40px;
          transition: bottom 0.18s ease;
          background: rgba(26, 26, 26, 0.96);
          border-top: 1px solid #2e2e2e;
          padding-right: 10px;

          .btn {
            .hover-icon {
              margin-right: 5px;

              :deep(.el-icon) {
                color: #bdbdbd;
              }
            }

            .hover-add {
              font-size: 13px;
              font-weight: 500;
              color: #bdbdbd;
            }

            &.active {
              .hover-add {
                color: #90caf9;
              }

              :deep(.el-icon) {
                color: #90caf9;
              }
            }
          }
        }

        &.no-margin-right {
          margin-right: 0;
        }

        &.hover {
          .app-detail {
            .app-introduce {
              opacity: 0;
            }
          }

          .hover-show {
            bottom: 0;
          }
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
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: opacity 0.18s ease;
  }
</style>
