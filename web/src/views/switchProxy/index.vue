<template>
  <div class="hosts-container" @click="closeContextMenu">
    <aside class="sidebar">
      <div class="sidebar-title">
        <div class="sidebar-title-left">
          <span class="sidebar-title-text">🖥️ SwitchProxy</span>
          <APlus
            v-if="docUrls.switchProxyGuide"
            class="guide-link"
            :url="docUrls.switchProxyGuide"
          >
            查看指引
          </APlus>
        </div>
        <span class="add-icon" @click="addTab" title="添加新板块">+</span>
      </div>
      <ul class="group-list">
        <!-- 聚合所有配置 -->
        <li
          :class="['group-item', activeTab === 9999 ? 'active' : '']"
          @click="activeTab = 9999"
        >
          <span class="group-label bold">{{ "系统代理" }}</span>
          <span class="readonly-tag">只读</span>
        </li>
        <li
          v-for="(item, index) in dataSqlList"
          :key="index"
          :class="['group-item', activeTab === index ? 'active' : '']"
          @click="itemClick(index)"
          @contextmenu.prevent="showContextMenu($event, index, item)"
        >
          <span class="group-label">{{ item.proxyName || "" }}</span>
          <SwitchBtn v-model="item.inUse" @click.stop="switchToggle(item)" />
        </li>
      </ul>
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div
          class="context-menu-item"
          @click="handleEdit(contextMenu.index, contextMenu.item)"
        >
          编辑
        </div>
        <div
          class="context-menu-item delete"
          @click="showDeleteDialog(contextMenu.index, contextMenu.item)"
        >
          删除
        </div>
      </div>
    </aside>
    <main class="main-content">
      <div class="main-title">
        <div class="main-title-hosts" v-if="activeTab === 9999">
          <div class="tab">
            <div class="main-title-btn-group">
              <button
                class="main-title-btn"
                :class="{ active: mainTab === 'all' }"
                @click="switchMainTab('all')"
              >
                配置
              </button>
              <button
                class="main-title-btn"
                :class="{ active: mainTab === 'custom' }"
                @click="switchMainTab('custom')"
              >
                视图
              </button>
            </div>
          </div>
          <span class="main-title-text"> 系统代理 </span>
          <span class="readonly c-flex-x-center">只读</span>
        </div>
        <div>
          <span class="main-title-text">
            {{ dataSqlList[activeTab]?.proxyName || "" }}
          </span>
        </div>

        <el-icon v-if="titleLoading" class="main-title-loading">
          <Loading />
        </el-icon>
      </div>

      <div class="editor-panel">
        <HostsMapping
          v-if="activeTab === 9999 && mainTab === 'custom'"
          :mappings="dataSqlAll"
        />
        <div
          v-else
          ref="editorContainer"
          class="monaco-editor-container"
        ></div>
      </div>
    </main>

    <!-- 弹窗 -->
    <el-dialog
      v-model="showDeleteConfirmDialog"
      title="确认删除"
      width="320px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="cancelDelete"
    >
      <div>确定要删除该代理吗？</div>
      <template #footer>
        <el-button @click="cancelDelete">取消</el-button>
        <el-button type="primary" @click="confirmDelete">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="showAddTabDialog"
      :title="editDialogMode === 'edit' ? '编辑代理' : '添加代理'"
      width="320px"
      @close="handleAddTabCancel"
    >
      <el-input v-model="newTabName" placeholder="请输入代理名称" autofocus />
      <template #footer>
        <el-button @click="handleAddTabCancel">取消</el-button>
        <el-button
          type="primary"
          @click="
            editDialogMode === 'edit'
              ? handleEditTabConfirm()
              : handleAddTabConfirm()
          "
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, toRaw } from "vue";
import SwitchBtn from "./components/SwitchBtn.vue";
import { ElMessage } from "element-plus";
import { Loading } from "@element-plus/icons";
import HostsMapping from "./HostsMapping.vue";
import { isInElectron } from "@/utils/electron";
import { docUrls } from "@/config/docs";
import {
  proxyService,
  startExpressApp,
  restartExpressApp,
  getSystemProxyStatus,
  updateSystemProxyRoutes,
} from "./proxyService";

let dataSqlAll = ref([]);
let dataSqlList = ref([]);

const editorContainer = ref(null);

let monacoInstance = null;
let editorResizeObserver = null;

const activeTab = ref(9999);
const dynamicTabs = ref([]);

const hostsContent = ref(
  `##\n# Host Database\n#\n# localhost is used to configure the loopback interface\n# when the system is booting.  Do not change this entry.\n##\n127.0.0.1       localhost\n255.255.255.255 broadcasthost\n::1            localhost`
);
const testContent = ref(hostsContent.value);
const jsonContents = ref({});
const jsonContent = ref('{\n  "key": "value"\n}');

const hostsSwitch = ref(false);
const testSwitch = ref(false);
const tabSwitches = ref({});

const showAddTabDialog = ref(false);
const newTabName = ref("");
const editDialogMode = ref("add");
let editIndex = ref(null);

let titleLoading = ref(false);
const mainTab = ref("all");

// 右键菜单相关
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  index: null,
  item: null,
});

const showDeleteConfirmDialog = ref(false);
let deleteIndex = ref(null);
let deleteItem = ref(null);

function addTab() {
  editDialogMode.value = "add";
  showAddTabDialog.value = true;
}

// 根据id，检索index
function findIndex(id) {
  let index = 0;
  for (let i = 0; i < dataSqlList.value.length; i++) {
    if (dataSqlList.value[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
}
async function handleAddTabConfirm() {
  const name = newTabName.value.trim();
  if (!name) return;

  const addData = {
    proxyName: name,
    inUse: false,
    proxyData: [
      {
        path: "/test-api",
        proxyConfig: {
          target: "https://test-api.com/server4/",
          changeOrigin: true,
          secure: false,
        },
      },
    ],
  };
  // 更新数据库
  const res = await proxyService.create(addData);
  const id = res.id;

  // 获取sql中的全部数据
  await getAllSqlList();

  const index = findIndex(id);
  // 控制，展示新增加的代理菜单
  activeTab.value = index;

  // 还原弹窗控制标识
  showAddTabDialog.value = false;
  newTabName.value = "";
  ElMessage.success("操作成功，已切换至新增项目");
}

function handleEdit(index, item) {
  editDialogMode.value = "edit";
  editIndex.value = index;
  newTabName.value = item.proxyName || "";
  showAddTabDialog.value = true;
  closeContextMenu();
}

function handleEditTabConfirm() {
  const name = newTabName.value.trim();
  if (!name) return;
  // 当前点击的item的index
  const index = editIndex.value;
  if (index !== null && dataSqlList.value[index]) {
    // 更新本地
    dataSqlList.value[index].proxyName = name;
    // 更新数据库
    proxyService.update(dataSqlList.value[index].id, { proxyName: name });
    ElMessage.success("编辑成功");
  }
  showAddTabDialog.value = false;
  newTabName.value = "";
  editDialogMode.value = "add";
  editIndex.value = null;
}

function handleAddTabCancel() {
  showAddTabDialog.value = false;
  newTabName.value = "";
  editDialogMode.value = "add";
  editIndex.value = null;
}

function destroyEditor() {
  editorResizeObserver?.disconnect();
  editorResizeObserver = null;
  if (monacoInstance) {
    monacoInstance.dispose();
    monacoInstance = null;
  }
}

function isReadOnlyEditor() {
  return activeTab.value === 9999 && mainTab.value === "all";
}

function getEditorValue() {
  if (activeTab.value === 9999) {
    return JSON.stringify(dataSqlAll.value, null, 2);
  }
  return JSON.stringify(dataSqlList.value[activeTab.value]?.proxyData ?? [], null, 2);
}

async function mountEditor() {
  if (activeTab.value === 9999 && mainTab.value === "custom") {
    destroyEditor();
    return;
  }

  await nextTick();
  await new Promise(resolve => requestAnimationFrame(resolve));

  if (!editorContainer.value) {
    return;
  }

  destroyEditor();

  const monaco = await import("monaco-editor");
  monacoInstance = monaco.editor.create(editorContainer.value, {
    value: getEditorValue(),
    language: "json",
    readOnly: isReadOnlyEditor(),
    theme: "vs-dark",
    fontSize: 15,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
  });

  if (!isReadOnlyEditor()) {
    monacoInstance.onDidBlurEditorWidget(() => {
      saveCurrentEditorContent();
    });
  }

  monacoInstance.layout();
  editorResizeObserver = new ResizeObserver(() => {
    monacoInstance?.layout();
  });
  editorResizeObserver.observe(editorContainer.value);
}

// 当前index的数据是否是被选中状态：inUse = true
function isChoosed(index) {
  const currentData = dataSqlList.value[index];
  return currentData.inUse;
}
async function syncSystemProxyRoutes() {
  try {
    const status = await getSystemProxyStatus();
    if (!status.enabled) {
      return;
    }
    const result = await updateSystemProxyRoutes(dataSqlAll.value);
    if (result?.code !== 0) {
      throw new Error(result?.message || "更新系统代理规则失败");
    }
  } catch (error) {
    ElMessage.error(error?.message || "更新系统代理规则失败");
  }
}

async function switchToggle(data) {
  // restart原生的 express 服务
  restartServer(dataSqlList.value);

  // 更新原生数据库
  const id = data.id;
  const item = {
    inUse: data.inUse,
  };
  await proxyService.update(id, item);

  // 更新"系统 Hosts"的聚合配置
  await getUsedSqlList();
  await syncSystemProxyRoutes();
  ElMessage.success("切换成功");
}
function itemClick(index) {
  activeTab.value = index;
  mainTab.value = "all";
}

// 当前 json失去焦点
async function saveCurrentEditorContent() {
  if (!monacoInstance || isReadOnlyEditor()) {
    return;
  }

  const currentJsonValue = monacoInstance.getValue();

  try {
    // 更新核心数据
    const index = activeTab.value;
    dataSqlList.value[index].proxyData = JSON.parse(currentJsonValue);

    // 更新原生数据库
    const currentData = dataSqlList.value[index];
    const id = currentData.id;
    const item = {
      proxyData: toRaw(currentData.proxyData),
    };
    proxyService.update(id, item);
    // ElMessage.success("更新成功");
    // loading交互
    loadingAni();

    // 如果是选中状态，更新 node 服务
    if (isChoosed(index)) {
      // restart原生的 express 服务
      restartServer(dataSqlList.value);

      // 更新"系统 Hosts"的聚合配置
      await getUsedSqlList();
    }
  } catch (error) {
    console.log("error");
    console.log(error);

    ElMessage.error(error?.message || "出错啦！请检查json格式");
  }
}

function loadingAni() {
  titleLoading.value = true;
  setTimeout(() => {
    titleLoading.value = false;
  }, 200);
}

watch([activeTab, mainTab], () => {
  mountEditor();
});

// 数据处理
function handleServerData(data) {
  let result = [];
  data.map((item) => {
    if (item.inUse) {
      const itemData = toRaw(item.proxyData);
      result = result.concat(itemData);
    }
  });

  return result;
}
// restart原生的 express 服务
function restartServer(data) {
  const expressDefaultConfig = handleServerData(data);
  restartExpressApp(expressDefaultConfig);
}

function initServer(data) {
  const expressDefaultConfig = handleServerData(data);
  startExpressApp(expressDefaultConfig);
}

function showContextMenu(e, index, item) {
  contextMenu.value.visible = false;
  nextTick(() => {
    contextMenu.value.x = e.clientX;
    contextMenu.value.y = e.clientY;
    contextMenu.value.index = index;
    contextMenu.value.item = item;
    contextMenu.value.visible = true;
  });
}

function closeContextMenu() {
  contextMenu.value.visible = false;
}

function showDeleteDialog(index, item) {
  showDeleteConfirmDialog.value = true;
  deleteIndex.value = index;
  deleteItem.value = item;
  closeContextMenu();
}

function cancelDelete() {
  showDeleteConfirmDialog.value = false;
  deleteIndex.value = null;
  deleteItem.value = null;
}

function confirmDelete() {
  if (deleteIndex.value !== null && deleteItem.value) {
    handleDeleteTab(deleteIndex.value, deleteItem.value);
  }
  showDeleteConfirmDialog.value = false;
  deleteIndex.value = null;
  deleteItem.value = null;
}

function handleDeleteTab(index, item) {
  proxyService.remove(item.id).then(async () => {
    dataSqlList.value.splice(index, 1);
    if (activeTab.value === index) {
      activeTab.value = dataSqlList.value.length ? 0 : "";
    }
    closeContextMenu();

    // 更新"系统 Hosts"的聚合配置
    await getUsedSqlList();
    ElMessage.success("删除成功");
  });
}

// 获取所有数据
async function getAllSqlList() {
  const sqlList = await proxyService.readAll();
  dataSqlList.value = sqlList || [];
}

async function getUsedSqlList() {
  const sqlList = await proxyService.readAll();

  let result = [];
  (sqlList || []).map((item) => {
    if (item.inUse) {
      result = result.concat(item.proxyData);
    }
  });
  dataSqlAll.value = result;

  if (activeTab.value === 9999 && mainTab.value === "all") {
    await mountEditor();
  }

  await syncSystemProxyRoutes();
}

function switchMainTab(tab) {
  mainTab.value = tab;
  // if (tab === "all") {
  //   activeTab.value = 9999;
  // } else if (tab === "custom") {
  //   if (dataSqlList.value.length > 0) {
  //     activeTab.value = 0;
  //   }
  // }
}

onMounted(async () => {
  if (!isInElectron()) {
    ElMessage.warning("接口代理需要在桌面客户端中使用");
    return;
  }

  await getAllSqlList();
  await getUsedSqlList();
  initServer(dataSqlList.value);
  await mountEditor();
});

onUnmounted(() => {
  destroyEditor();
});
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
.sidebar-title-text {
  line-height: 1.2;
}
.guide-link {
  font-size: 12px;
  font-weight: normal;
  color: #90caf9;
  text-decoration: none;
}
.guide-link:hover {
  color: #bbdefb;
}
.add-icon {
  margin-left: 8px;
  font-size: 20px;
  color: #64b5f6;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
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
  padding: 8px 10px 8px 10px;
  font-size: 16px;
  color: #bdbdbd;
  display: flex;
  align-items: center;
  cursor: pointer;
  justify-content: space-between;
  border-radius: 6px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  position: relative;
  overflow: hidden;
}
.group-item.active {
  font-weight: bold;
  color: #90caf9;
  background: #1e3a5f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.group-item:hover {
  background: #252525;
  color: #90caf9;
}
/* 点击波纹效果 */
.group-item:active::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120%;
  height: 120%;
  background: rgba(100, 181, 246, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  pointer-events: none;
  animation: group-item-ripple 0.4s;
}
@keyframes group-item-ripple {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}
.switch {
  margin-left: 8px;
  width: 32px;
  height: 18px;
  background: #424242;
  border-radius: 9px;
  display: inline-block;
}
.main-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #121212;
}
.main-title {
  font-size: 20px;
  font-weight: bold;
  /* margin: 5px 0; */
  padding: 10px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  color: #f0f0f0;
  border-bottom: 1px solid #2e2e2e;
  flex-shrink: 0;
}
.editor-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1e1e1e;
}
.main-title-hosts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: center;
}
.readonly {
  font-size: 14px;
  color: #9e9e9e;
  margin-left: 8px;
  background: #2a2a2a;
  border-radius: 4px;
  padding: 2px 8px;
}
.monaco-editor-container {
  flex: 1;
  min-height: 0;
  width: 100%;
  background: #1e1e1e;
}

:deep(.monaco-editor) {
  height: 100% !important;
}

:deep(.monaco-editor .monaco-scrollable-element) {
  overflow: auto !important;
}
.group-label {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
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
.readonly {
  font-size: 13px;
  color: #9e9e9e;
  background: #2a2a2a;
  border-radius: 4px;
  padding: 2px 8px;
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
  font-size: 15px;
  color: #e0e0e0;
  transition: background 0.2s;
}
.context-menu-item:hover {
  background: #333;
}
.context-menu-item.delete {
  color: #ef5350;
}
/* @media (max-width: 900px) {
  .hosts-container {
    height: auto;
    min-height: 100vh;
    flex-direction: column;
    width: 100vw;
  }
  .main-content {
    padding: 16px 8px;
  }
  .monaco-editor-container {
    height: 220px;
  }
} */
/* @media (max-width: 600px) {
  .hosts-container {
    height: auto;
    min-height: 100vh;
    flex-direction: column;
    width: 100vw;
    padding: 0;
  }
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    padding: 12px 0 0 0;
  }
  .main-content {
    padding: 8px 4px;
  }
  .monaco-editor-container {
    height: 140px;
  }
} */
:deep(.el-dialog__title) {
  font-weight: bold;
}
.main-title-loading {
  margin-left: 8px;
  font-size: 18px;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  color: #90caf9;
}
.main-title-loading svg {
  animation: main-title-spin 1s linear infinite;
}
@keyframes main-title-spin {
  100% {
    transform: rotate(360deg);
  }
}
.main-title .tab {
  margin-right: 16px;
  min-width: 120px;
}
.main-title-text {
  display: inline-block;
  min-width: 60px;
  font-weight: bold;
  color: #f0f0f0;
}
.main-title-btn-group {
  display: flex;
  gap: 8px;
}
.main-title-btn {
  padding: 4px 18px;
  border: 1px solid #3a3a3a;
  background: #252525;
  color: #bdbdbd;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: background 0.2s, color 0.2s, border 0.2s;
}
.main-title-btn.active {
  background: #1e3a5f;
  color: #90caf9;
  border: 1px solid #64b5f6;
}
.main-title-btn:active {
  background: #2a2a2a;
}
</style>
