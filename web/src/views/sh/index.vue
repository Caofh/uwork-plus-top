<template>
  <div class="home c-flex-x-between">
    <div
      :class="[
        'always-use c-flex-y-start c-animation-transition',
        { 'always-use-show': alwaysUseList.length > 0 },
      ]"
    >
      <div class="always-use-title">常用</div>
      <div :class="['always-use-content', 'c-flex-y-start']">
        <div
          class="always-use-item"
          v-for="item in alwaysUseList"
          :key="item"
          @click="executeAlways(item)"
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
                  @mouseleave="alwaysMouseLeave(item)"
                  class="always-use-item-title c-ellipsis-single c-cursor c-animation-transition c-animation-moveup"
                >
                  {{ item.text }}

                  <div
                    v-if="item.alwaysHover"
                    class="always-use-item-run c-flex-x-center"
                    v-loading="item.alwaysUseNumHover"
                  >
                    执行
                  </div>
                </div>
                <span v-if="item.alwaysUseNum" class="num-count c-flex-x-center">
                  {{ item.alwaysUseNum }}
                </span>
              </div>
            </template>
            <template #content>
              <div class="custom-tooltip-content">
                <div class="always-tooltip-title">{{ item.text }}</div>
                <div
                  v-if="item.detail"
                  class="always-tooltip-detail"
                  v-html="handleText(item.detail)"
                ></div>
                <div class="tooltip-info">
                  <span>类型: {{ typeLabelMap[item.type] || item.type }}</span>
                  <span>使用次数: {{ item.alwaysUseNum || 0 }}</span>
                </div>
                <div class="tooltip-desc">点击执行此脚本</div>
              </div>
            </template>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div class="home-group-list c-flex-y-start">
      <div class="header-row">
        <div class="c-flex-x-start">
          <div class="title">脚本分组列表</div>
          <VanishingInput
            class="search-input-vanishing"
            v-model="inputText"
            :placeholders="['搜索']"
            @submit="handleSearch"
          ></VanishingInput>
          <a
            v-if="docUrls.voiceWakeup"
            class="voice-wakeup-intro-link"
            :href="docUrls.voiceWakeup"
            @click.prevent="openVoiceWakeupIntro"
          >
            语音唤起功能介绍
          </a>
        </div>
        <RippleButton @click="addGroup">添加分组</RippleButton>
      </div>

      <div class="type-list-container">
        <div class="type-list">
          <div
            class="list-item c-flex-x-center"
            :class="[{ hover: itemApp.hover, 'no-margin-right': index % 6 === 5 }]"
            @mouseenter="itemApp.hover = true"
            @mouseleave="itemApp.hover = false"
            v-for="(itemApp, index) in groupedItems"
            :key="index"
          >
            <div class="app-icon c-flex-x-center">
              <el-icon :size="30">
                <component :is="itemApp.appIcon || 'Document'" />
              </el-icon>
            </div>
            <div class="app-detail c-flex-y-center">
              <div class="app-name c-ellipsis-single">
                {{ itemApp.text || '' }}
              </div>
              <div class="app-introduce">{{ itemApp.appIntroduce || '' }}</div>
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
                <div class="hover-add" @click="openDrawer(itemApp)">进入分组</div>
              </div>
            </div>

            <div class="app-btns c-flex-x-end" v-if="itemApp.hover">
              <el-icon class="icon-edit" :size="20" @click="editGroup(itemApp)">
                <Edit />
              </el-icon>
              <el-icon :size="20" @click="deleteGroup(itemApp)">
                <Delete />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerType ? typeLabelMap[drawerType] || drawerType : ''"
      size="80%"
      direction="rtl"
      :with-header="true"
      class="sh-drawer-container"
      :append-to-body="true"
      :before-close="handleClose"
    >
      <template #header>
        <h4>{{ editGroupDetail.text }}</h4>
      </template>
      <template #default>
        <div class="c-flex-x-start">
          <RippleButton class="add-btn mr-[10px]" @click="addModal()">添加指令</RippleButton>
          <template v-if="items?.length >= 2">
            <RippleButton class="add-btn" @click="moveOperation = true" v-if="!moveOperation">
              批量操作
            </RippleButton>
            <RippleButton class="add-btn" @click="closeMoveOperation" v-else>取消选择</RippleButton>
          </template>
          <RippleButton v-if="moveOperation" class="add-btn ml-[10px]" @click="moveToGroupBatch">
            开始批量迁移
          </RippleButton>
        </div>
        <draggable
          v-model="items"
          group="edit-list"
          item-key="id"
          @end="onEditListDragEnd"
          class="edit-list"
          handle=".drag-handle"
        >
          <template #item="{ element: item, index: idx }">
            <div class="c-flex-x-start">
              <div
                v-if="moveOperation"
                class="check-icon w-[30px] h-[30px] mr-[10px] mb-[10px] bg-[#00283a] rounded-[4px] c-flex-x-center cursor-pointer"
                @click="checkItem(item)"
              >
                <div v-if="item.checked">✅</div>
              </div>
              <li :key="item.id">
                <!-- 拖拽icon -->
                <span class="drag-handle" style="cursor: grab; margin-right: 8px">☰</span>

                <el-tooltip
                  placement="left"
                  :show-arrow="false"
                  popper-class="item-text-tooltip-popper"
                  effect="customized"
                >
                  <span class="item-text c-ellipsis-single">{{ item.text }}</span>
                  <template #content>
                    <div class="custom-tooltip-content">
                      <div class="tooltip-title">{{ item.text }}</div>
                      <div class="tooltip-detail" v-html="handleText(item.detail)"></div>
                    </div>
                  </template>
                </el-tooltip>
                <span class="item-type">{{ typeLabelMap[item.type] || item.type }}</span>
                <div class="btn-group">
                  <div class="c-flex-x-start">
                    <!-- loading -->
                    <el-icon :class="['btn-loading', { show: item.executeLoading }]">
                      <Loading />
                    </el-icon>
                    <el-button size="small" @click="execute(item, 'usually')">执行</el-button>
                  </div>
                  <el-button size="small" @click="moveToGroup(idx, item)">迁移</el-button>
                  <el-button size="small" @click="startCopyModal(idx, item)">创建副本</el-button>
                  <el-button size="small" @click="startEditInDrawer(idx, item)">编辑</el-button>
                  <el-button size="small" @click="removeInDrawer(idx, item)">删除</el-button>
                </div>

                <div v-if="!drawerVisibleAllow" class="item-line-cover"></div>
              </li>
            </div>
          </template>
        </draggable>
      </template>

      <template #footer>
        <div style="flex: auto">
          <el-button @click="handleClose">返回</el-button>
        </div>
      </template>
    </el-drawer>
    <!-- 添加指令 -->
    <el-dialog
      class="add-command-dialog"
      v-model="showModal"
      title="添加指令"
      width="520px"
      :close-on-click-modal="false"
      :append-to-body="true"
    >
      <div class="modal-body">
        <div class="form-row">
          <label>名称：</label>
          <el-input class="dislog-input" v-model="modalName" placeholder="请输入名称" clearable />
        </div>
        <div class="form-row">
          <label class="voice-index-label">
            <el-tooltip effect="customized" popper-class="item-text-tooltip-popper" placement="top">
              <template #content>
                <div class="custom-tooltip-content">
                  <div class="tooltip-title">语音识别KEY</div>
                  <div class="tooltip-detail voice-index-tooltip-detail">
                    用于语音命令匹配的关键词。
                    <br />
                    可填多个，使用“;”分隔。
                    <br />
                    语音匹配时会优先按此 KEY 匹配，命中其中一个即可。
                    <br />
                    如果都没命中，再降级使用名称匹配。
                  </div>
                </div>
              </template>
              <span>
                语音识别KEY
                <span class="voice-index-help">?</span>
                ：
              </span>
            </el-tooltip>
          </label>
          <el-input
            class="dislog-input"
            v-model="modalVoiceIndexKey"
            placeholder="选填。语音识别KEY，用于语音识别。“;”分隔多个关键词"
            clearable
          />
        </div>
        <div class="form-row">
          <label>类型：</label>
          <el-select
            class="dislog-select"
            v-model="modalType"
            placeholder="请选择类型"
            :teleported="true"
            popper-class="my-select-popper"
          >
            <!-- <el-option label="打开软件" value="打开软件" />
            <el-option label="打开浏览器" value="打开浏览器" /> -->
            <el-option label="sh脚本" value="sh脚本" />
          </el-select>
        </div>
        <div class="form-row">
          <label>终端交互：</label>
          <el-select
            class="dislog-select"
            v-model="modalTerminalInteractive"
            placeholder="请选择"
            :teleported="true"
            popper-class="my-select-popper"
            @change="
              () => {
                if (modalTerminalInteractive !== '3') {
                  shMode = 1
                }
              }
            "
          >
            <el-option label="不需要终端" value="2" />
            <el-option label="需要单终端" value="1" />
            <el-option label="需要多终端" value="3" />
          </el-select>
        </div>
        <div class="form-row">
          <label style="align-self: flex-start">详细：</label>
          <el-input
            v-if="showModal"
            class="dislog-textarea"
            v-model="modalDetail"
            type="textarea"
            placeholder="请输入详细描述；支持markdown语法；支持html标签"
            :rows="5"
            maxlength="10000"
            show-word-limit
          />
        </div>
        <div class="form-row">
          <a class="markdown-document-url" @click.prevent="openMarkdownDocument">
            markdown语法参考
          </a>
        </div>
        <div class="form-row">
          <label style="align-self: flex-start">sh脚本：</label>
          <div class="dislog-monacoEditor-part">
            <div
              v-if="modalTerminalInteractive === '3'"
              class="dislog-monacoEditor-select mb-[10px] w-[200px]"
              :class="tailWind.flexRowStart"
            >
              <el-select
                class="dislog-select"
                v-model="shMode"
                placeholder="请选择"
                :teleported="true"
                popper-class="my-select-popper"
              >
                <el-option label="单终端模式" :value="1" />
                <el-option label="多终端模式" :value="2" />
              </el-select>

              <!-- 多终端模式-添加按钮 -->
              <div
                v-if="shMode === 2"
                class="add-sh-mode-btn ml-[10px] w-[30px] h-[30px] cursor-pointer"
                :class="tailWind.flexRowCenter"
                @click="addShModeList"
              >
                <el-icon size="20">
                  <Plus />
                </el-icon>
              </div>
            </div>
            <!-- 单终端模式 -->
            <div v-show="shMode === 1" class="dislog-monacoEditor" style="position: relative">
              <MonacoEditor
                ref="monacoRef"
                v-model="editModalSh"
                language="shell"
                theme="vs-dark"
                height="120"
                :options="{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }"
              />
              <el-button
                class="editor-full-btn"
                circle
                size="small"
                style="position: absolute; top: 8px; right: 8px; z-index: 2"
                @click="openFullEditor('edit')"
              >
                <el-icon>
                  <FullScreen />
                </el-icon>
              </el-button>
            </div>
            <!-- 多终端模式-列表 -->
            <div
              v-show="shMode === 2"
              class="dislog-monacoEditor-list w-full h-[120px] overflow-y-auto p-[10px] bg-[#1E1E1E]"
              style="position: relative"
            >
              <div
                v-for="(item, idx) in editModalItem.shModeList || []"
                :key="item.id"
                class="dislog-monacoEditor-list-item w-full mb-[10px] last:mb-0 w-[200px] bg-[rgba(0,0,0,0.5)] p-[10px] rounded-[6px]"
                :class="tailWind.flexRowBetween"
              >
                <div>{{ item.name }}</div>
                <div>
                  <el-button size="small" @click="editShModeList(item)">编辑</el-button>
                  <el-button size="small" @click="removeShModeList(item, idx)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button class="black-btn" @click="handleAdd">确定</el-button>
        <el-button @click="showModal = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 添加分组 -->
    <el-dialog
      v-model="showModalGroup"
      :title="modalGroupStatus === 'add' ? '添加分组' : '编辑分组'"
      width="520px"
      :close-on-click-modal="false"
      :append-to-body="true"
    >
      <div class="modal-body">
        <div class="form-row">
          <label>名称：</label>
          <el-input v-model="modalNameGroup" placeholder="请输入名称" clearable />
        </div>
        <div class="form-row">
          <label>icon：</label>
          <div class="form-row-field">
            <el-input
              v-model="modalAppIconGroup"
              placeholder="请输入icon; 从element-plus官网获取; 如: Notebook"
              clearable
              @input="validateIconInput"
              @keypress="preventNumberInput"
            />
            <a class="element-url" @click.prevent="goElement">element-plus的icon地址</a>
          </div>
        </div>
        <div class="form-row">
          <label>描述：</label>
          <el-input v-model="modalAppIntroduceGroup" placeholder="请输入描述" clearable />
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

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="showDeleteConfirm"
      title="确认删除"
      width="300px"
      :close-on-click-modal="false"
      :show-close="false"
      :append-to-body="true"
    >
      <span>确定要删除该项吗？</span>
      <template #footer>
        <el-button @click="cancelDelete">取消</el-button>
        <el-button class="black-btn" @click="confirmDelete">删除</el-button>
      </template>
    </el-dialog>

    <!-- 终端弹窗展示结果 -->
    <el-dialog
      v-model="showExecModal"
      title="执行输出"
      width="700px"
      :close-on-click-modal="true"
      @closed="onExecModalClosed"
      :append-to-body="true"
    >
      <div ref="xtermContainer" style="width: 100%; height: 400px"></div>
      <template #footer>
        <el-button @click="showExecModal = false" :disabled="execRunning">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog
      class="edit-command-dialog"
      v-model="showEditModal"
      title="编辑指令"
      width="520px"
      :close-on-click-modal="false"
      :append-to-body="true"
    >
      <div class="modal-body">
        <div class="form-row">
          <label>名称：</label>
          <el-input
            class="dislog-input"
            v-model="editModalName"
            placeholder="请输入名称"
            clearable
          />
        </div>
        <div class="form-row">
          <label class="voice-index-label">
            <el-tooltip effect="customized" popper-class="item-text-tooltip-popper" placement="top">
              <template #content>
                <div class="custom-tooltip-content">
                  <div class="tooltip-title">语音识别KEY</div>
                  <div class="tooltip-detail voice-index-tooltip-detail">
                    用于语音命令匹配的关键词。
                    <br />
                    可填多个，使用“;”分隔。
                    <br />
                    语音匹配时会优先按此 KEY 匹配，命中其中一个即可。
                    <br />
                    如果都没命中，再降级使用名称匹配。
                  </div>
                </div>
              </template>
              <span>
                语音识别KEY
                <span class="voice-index-help">?</span>
                ：
              </span>
            </el-tooltip>
          </label>
          <el-input
            class="dislog-input"
            v-model="editModalVoiceIndexKey"
            placeholder="选填。语音识别KEY，用于语音识别。“;”分隔多个关键词"
            clearable
          />
        </div>
        <div class="form-row">
          <label>类型：</label>
          <el-select
            class="dislog-select"
            v-model="editModalType"
            placeholder="请选择类型"
            :teleported="true"
            popper-class="my-select-popper"
          >
            <el-option label="sh脚本" value="sh脚本" />
          </el-select>
        </div>
        <div class="form-row">
          <label>终端交互：</label>
          <el-select
            class="dislog-select"
            v-model="editModalTerminalInteractive"
            placeholder="请选择"
            :teleported="true"
            popper-class="my-select-popper"
            @change="
              () => {
                if (editModalTerminalInteractive !== '3') {
                  shMode = 1
                }
              }
            "
          >
          <el-option label="不需要终端" value="2" />
            <el-option label="需要单终端" value="1" />
            <el-option label="需要多终端" value="3" />
          </el-select>
        </div>
        <div class="form-row">
          <label style="align-self: flex-start">详细：</label>
          <el-input
            v-if="showEditModal"
            class="dislog-textarea"
            v-model="editModalDetail"
            type="textarea"
            placeholder="请输入详细描述；支持markdown语法；支持html标签"
            :rows="5"
            maxlength="10000"
            show-word-limit
          />
        </div>
        <div class="form-row">
          <a class="markdown-document-url" @click.prevent="openMarkdownDocument">
            markdown语法参考
          </a>
        </div>

        <div class="form-row">
          <label style="align-self: flex-start">sh脚本：</label>
          <div class="dislog-monacoEditor-part">
            <div
              v-if="editModalTerminalInteractive === '3'"
              class="dislog-monacoEditor-select mb-[10px] w-[200px]"
              :class="tailWind.flexRowStart"
            >
              <el-select
                class="dislog-select"
                v-model="shMode"
                placeholder="请选择"
                :teleported="true"
                popper-class="my-select-popper"
              >
                <el-option label="单终端模式" :value="1" />
                <el-option label="多终端模式" :value="2" />
              </el-select>

              <!-- 多终端模式-添加按钮 -->
              <div
                v-if="shMode === 2"
                class="add-sh-mode-btn ml-[10px] w-[30px] h-[30px] cursor-pointer"
                :class="tailWind.flexRowCenter"
                @click="addShModeList"
              >
                <el-icon size="20">
                  <Plus />
                </el-icon>
              </div>
            </div>
            <!-- 单终端模式 -->
            <div v-show="shMode === 1" class="dislog-monacoEditor" style="position: relative">
              <MonacoEditor
                ref="editModalMonacoRef"
                v-model="editModalSh"
                language="shell"
                theme="vs-dark"
                height="200"
                :options="{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }"
              />
              <el-button
                class="editor-full-btn"
                circle
                size="small"
                style="position: absolute; top: 8px; right: 8px; z-index: 2"
                @click="openFullEditor('edit')"
              >
                <el-icon>
                  <FullScreen />
                </el-icon>
              </el-button>
            </div>
            <!-- 多终端模式-列表 -->
            <div
              v-show="shMode === 2"
              class="dislog-monacoEditor-list w-full h-[120px] overflow-y-auto p-[10px] bg-[#1E1E1E]"
              style="position: relative"
            >
              <div
                v-for="(item, idx) in editModalItem.shModeList || []"
                :key="item.id"
                class="dislog-monacoEditor-list-item w-full mb-[10px] last:mb-0 w-[200px] bg-[rgba(0,0,0,0.5)] p-[10px] rounded-[6px]"
                :class="tailWind.flexRowBetween"
              >
                <div>{{ item.name }}</div>
                <div>
                  <el-button size="small" @click="editShModeList(item)">编辑</el-button>
                  <el-button size="small" @click="removeShModeList(item, idx)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button class="black-btn" @click="saveEditModal">保存</el-button>
        <el-button @click="cancelEditModal">取消</el-button>
      </template>
    </el-dialog>

    <!-- 全屏幕编辑弹窗 -->
    <el-dialog
      v-model="showFullEditor"
      title="放大编辑"
      width="90vw"
      top="2vh"
      :close-on-click-modal="false"
      fullscreen
      :append-to-body="true"
      class="sh-full-dialog"
    >
      <div class="dislog-monacoEditor-full">
        <MonacoEditor
          ref="fullEditorRef"
          class="fullEditorRef"
          v-model="fullEditorContent"
          language="shell"
          theme="vs-dark"
          :options="{
            minimap: { enabled: false },
            fontSize: 16,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }"
        />
      </div>
      <template #footer>
        <el-button class="black-btn" @click="saveFullEditor">保存</el-button>
        <el-button @click="cancelFullEditor">取消</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="drawerSearchVisible"
      direction="btt"
      title="搜索结果"
      :with-header="false"
      :append-to-body="true"
      class="search-drawer-search"
    >
      <div class="drawer-container">
        <div>
          <div class="center-title">搜索结果</div>
        </div>
        <div class="drawer-content-content c-flex-x-center">
          <div class="image-show">
            <div class="text-content">
              <VedioText :src="vedioUrl">Uwork</VedioText>
            </div>
            <div class="text-content">
              <VedioText :src="vedioUrl">Plus</VedioText>
            </div>
          </div>
          <div class="edit-list">
            <li v-for="item in dataDataAllFilterByInputText" :key="item.id">
              <!-- 拖拽icon -->
              <span class="drag-handle-icon" style="margin-right: 8px">☰</span>
              <el-tooltip
                placement="left"
                :show-arrow="false"
                popper-class="item-text-tooltip-popper"
                effect="customized"
              >
                <span class="item-text c-ellipsis-single">
                  【组：{{ item.groupName }}】 - {{ item.text }}
                </span>
                <template #content>
                  <div class="custom-tooltip-content">
                    <div class="tooltip-title">【组：{{ item.groupName }}】 - {{ item.text }}</div>
                    <div class="tooltip-detail" v-html="handleText(item.detail)"></div>
                  </div>
                </template>
              </el-tooltip>
              <span class="item-type">{{ typeLabelMap[item.type] || item.type }}</span>
              <div class="btn-group">
                <div class="c-flex-x-start">
                  <!-- loading -->
                  <el-icon :class="['btn-loading', { show: item.executeLoading }]">
                    <Loading />
                  </el-icon>
                  <el-button size="small" @click="execute(item, 'usually')">执行</el-button>
                </div>
                <!-- <el-button size="small" @click="startCopyModal(idx, item)">创建副本</el-button> -->
                <el-button size="small" @click="startEditInDrawer(idx, item)">编辑</el-button>
                <!-- <el-button size="small" @click="removeInDrawer(idx, item)">删除</el-button> -->
              </div>
            </li>
          </div>
        </div>

        <div>
          <div class="drawer-footer-content c-flex-x-center">
            <Button @click="drawerSearchVisible = false">Cancel</Button>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 多终端模式-添加弹窗 -->
    <el-dialog
      v-model="shModeDialogAddVisible"
      :title="shModeIsEdit ? '编辑终端指令' : '添加终端指令'"
      width="520px"
      :close-on-click-modal="false"
      :append-to-body="true"
    >
      <el-input
        class="mb-[10px]"
        v-model="shModeDialogAddName"
        placeholder="请输入终端指令名称"
        clearable
      />
      <MonacoEditor
        ref="shModeMonacoRef"
        v-model="shModeDialogAddSh"
        language="shell"
        theme="vs-dark"
        height="120"
        :options="{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }"
      />
      <template #footer>
        <el-button v-if="shModeIsEdit" class="black-btn" @click="editShModeListConfirm">
          保存
        </el-button>
        <el-button v-else class="black-btn" @click="addShModeListConfirm">保存</el-button>
        <el-button @click="shModeDialogAddVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 迁移弹窗 -->
    <CommonDialog
      v-model="moveCacheDialogVisible"
      :appendToBody="true"
      title="迁移到其他分组"
      width="500px"
    >
      <el-select v-model="moveCacheGroupId" placeholder="请选择目标分组">
        <el-option
          v-for="item in groupedItems"
          :key="item.id"
          :label="item.text"
          :value="item.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="moveToGroupCancel">取消</el-button>
        <el-button @click="moveToGroupConfirm">确认</el-button>
      </template>
    </CommonDialog>

    <TerminalCpt ref="terminalCptRef" />
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, nextTick, reactive, computed, toRaw } from 'vue'
  import {
    ElSelect,
    ElOption,
    ElInput,
    ElButton,
    ElDrawer,
    ElMessage,
    ElMessageBox,
    ElTooltip,
  } from 'element-plus'
  import { jsBridge, openExternal } from '@/utils/electron'
  import { Terminal } from 'xterm'
  import { FitAddon } from 'xterm-addon-fit'
  import 'xterm/css/xterm.css'
  import MonacoEditor from 'monaco-editor-vue3'
  import { FullScreen } from '@element-plus/icons-vue'
  import draggable from 'vuedraggable'
  import RippleButton from '@/components/buttons/RippleButton.vue'
  import VanishingInput from '@/components/input/VanishingInput.vue'
  import { Button } from '@/components/ui/button'
  import { cloneDeep } from 'lodash'
  import { marked } from 'marked'
  import { v4 as uuidv4 } from 'uuid'
  import { docUrls } from '@/config/docs'
  import { remoteUrl } from '@/config/remote'

  import VedioText from '@/components/ui/VedioText/VedioText.vue'
  // 终端组件
  import TerminalCpt from '@/components/terminal/Terminal.vue'

  // 样式
  import '@/assets/flex.scss'

  // 自定义tailwind样式
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

  const typeLabelMap = {
    脚本: '打开软件',
    命令: '打开浏览器',
    工具: 'sh脚本',
  }
  const items = ref([])
  const newItem = ref('')
  const editIndex = ref(-1)
  const editValue = ref('')
  let nextId = 4

  const terminalCptRef = ref(null)

  // vedio
  const vedioUrl = remoteUrl('/resource/assets/vedio/ocean-small.webm')

  // 添加分组
  const showModalGroup = ref(false)
  const modalNameGroup = ref('')
  const modalAppIconGroup = ref('')
  const modalAppIntroduceGroup = ref('')
  const modalGroupStatus = ref('add')

  // 当前点击分组的详情
  const editGroupDetail = ref({})

  // 弹窗相关
  const showModal = ref(false)
  const modalName = ref('')
  const modalType = ref('sh脚本')
  const modalSh = ref('')
  const modalDetail = ref('')
  const modalVoiceIndexKey = ref('')
  const modalTerminalInteractive = ref('2')

  // 编辑相关
  const editValueName = ref('')
  const editValueType = ref('')
  const editValueSh = ref('')
  const editValueDetail = ref({})

  // 新增：编辑弹窗相关
  const showEditModal = ref(false)
  const editModalName = ref('')
  const editModalType = ref('')
  const editModalSh = ref('')
  const editModalDetail = ref('')
  const editModalVoiceIndexKey = ref('')
  const editModalIdx = ref(-1)
  const editModalDetailObj = ref({})
  const editModalMonacoRef = ref(null)
  const editModalTerminalInteractive = ref('2')
  const editModalItem = ref({})

  // 单、多终端模式相关-start
  const shModeIsEdit = ref(false)
  const shMode = ref(1) // 单、多终端模式-当前模式
  const shModeDialogAddVisible = ref(false)
  const shModeMonacoRef = ref(null) // 多终端模式-添加弹窗-monaco编辑器实例
  const shModeDialogAddId = ref('') // 多终端模式-添加弹窗-id
  const shModeDialogAddName = ref('') // 多终端模式-添加弹窗-名称
  const shModeDialogAddSh = ref('') // 多终端模式-添加弹窗-sh脚本
  function addShModeList() {
    shModeIsEdit.value = false
    shModeDialogAddVisible.value = true
  }
  function addShModeListConfirm() {
    const shModeList = {
      id: uuidv4(),
      name: shModeDialogAddName.value,
      sh: shModeMonacoRef.value.editor.getValue(),
    }
    if (!editModalItem.value.shModeList) {
      editModalItem.value.shModeList = []
    }
    editModalItem.value.shModeList.push(shModeList)

    resetShModeDialogAdd()
    shModeDialogAddVisible.value = false
  }
  function editShModeListConfirm() {
    const id = shModeDialogAddId.value
    // 更新原 items
    editModalItem.value.shModeList.forEach(item => {
      if (item.id === id) {
        item.name = shModeDialogAddName.value
        item.sh = shModeMonacoRef.value.editor.getValue()
      }
    })
    resetShModeDialogAdd()
    shModeDialogAddVisible.value = false
  }
  function editShModeList(item) {
    shModeIsEdit.value = true
    shModeDialogAddId.value = item.id
    shModeDialogAddName.value = item.name
    shModeDialogAddSh.value = item.sh
    shModeDialogAddVisible.value = true
    nextTick(() => {
      if (
        shModeMonacoRef.value &&
        shModeMonacoRef.value.editor &&
        typeof shModeMonacoRef.value.editor.setValue === 'function'
      ) {
        shModeMonacoRef.value.editor.setValue(item.sh)
      }
    })
  }
  async function removeShModeList(item, idx) {
    await ElMessageBox.confirm('确定删除该终端指令吗？（保存生效）', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    editModalItem.value.shModeList.splice(idx, 1)
  }
  function resetShModeDialogAdd() {
    shModeDialogAddName.value = ''
    shModeDialogAddSh.value = ''
    shModeMonacoRef.value.editor.setValue('')
  }
  // 单、多终端模式相关-end

  // 删除确认弹窗
  const showDeleteConfirm = ref(false)
  const deleteIdx = ref(-1)

  // 执行输出弹窗
  const showExecModal = ref(false)
  let term = null
  let fitAddon = null
  const xtermContainer = ref(null)
  let removeTerminalListener = null
  const execRunning = ref(false)
  const terminalInput = ref('')
  const monacoRef = ref(null)
  const editMonacoRefs = reactive({})
  const hoveredGroup = ref(null)

  // script 部分新增
  const showFullEditor = ref(false)
  const fullEditorContent = ref('')
  const fullEditorRef = ref(null)
  const fullEditorTarget = ref('') // 'add' or 'edit'

  // 搜索
  const inputText = ref('')
  const dataDataAll = ref([])
  // 过滤搜索数据
  const dataDataAllFilterByInputText = ref([])
  const drawerSearchVisible = ref(false)

  // 常用
  const alwaysUseList = ref([])

  function openFullEditor(target) {
    if (target === 'add') {
      // fullEditorContent.value = modalSh.value;
      fullEditorContent.value = monacoRef.value.editor.getValue()
    } else {
      // fullEditorContent.value = editModalSh.value;
      fullEditorContent.value = editModalMonacoRef.value.editor.getValue()
    }
    fullEditorTarget.value = target
    showFullEditor.value = true

    nextTick(() => {
      if (
        fullEditorRef.value &&
        fullEditorRef.value.editor &&
        typeof fullEditorRef.value.editor.focus === 'function'
      ) {
        fullEditorRef.value.editor.setValue(fullEditorContent.value)
        fullEditorRef.value.editor.focus()
      }
    })
  }
  function saveFullEditor() {
    if (fullEditorTarget.value === 'add') {
      // modalSh.value = fullEditorContent.value;
      if (
        monacoRef.value &&
        monacoRef.value.editor &&
        typeof monacoRef.value.editor.setValue === 'function'
      ) {
        const nowFullContent = fullEditorRef.value.editor.getValue()
        monacoRef.value.editor.setValue(nowFullContent)
      }
    } else {
      // editModalSh.value = fullEditorContent.value;
      if (
        editModalMonacoRef.value &&
        editModalMonacoRef.value.editor &&
        typeof editModalMonacoRef.value.editor.setValue === 'function'
      ) {
        const nowFullContent = fullEditorRef.value.editor.getValue()
        editModalMonacoRef.value.editor.setValue(nowFullContent)
      }
    }
    showFullEditor.value = false
  }
  function cancelFullEditor() {
    showFullEditor.value = false
  }

  // group卡片列表数据
  const cardList = reactive([
    {
      app_name: '百度',
      app_introduce: '百度app',
      app_address: 'https://www.baidu.com',
      // hoverBtn: true,
      // hover: true,
    },
  ])

  // 类型分组
  // const groupedItems = computed(() => {
  //   const groups = {};
  //   for (const item of items.value) {
  //     if (!groups[item.type]) groups[item.type] = [];
  //     groups[item.type].push(item);
  //   }
  //   return groups;
  // });
  let groupedItems = reactive([])
  const drawerVisible = ref(false)
  const drawerVisibleAllow = ref(false)
  const drawerType = ref('')
  const editTypeInDrawer = ref('')
  function openDrawer(item) {
    editGroupDetail.value = item
    items.value = item.children
    drawerVisible.value = true
    setTimeout(() => {
      drawerVisibleAllow.value = true
    }, 400)
  }

  function handleSearch(text) {
    ElMessage.success('搜索成功')

    dataDataAllFilterByInputText.value = dataDataAll.value.filter(item => {
      return item.text.toLowerCase().includes(text.toLowerCase())
    })

    // 添加 groupName（分组名称） 字段
    dataDataAllFilterByInputText.value.map(item => {
      const currentGroup = groupedItems.find(group => group.id === item.typeId)
      if (currentGroup) {
        item.groupName = currentGroup.text
      }
    })

    // 打开底部抽屉
    drawerSearchVisible.value = true
  }

  function goElement() {
    openExternal('https://element-plus.org/zh-CN/component/icon.html#icon-collection')
  }

  function openVoiceWakeupIntro() {
    if (!docUrls.voiceWakeup) {
      return
    }
    openExternal(docUrls.voiceWakeup)
  }

  // 按照 sortOrder 字段排序
  function sortItems(arr) {
    return arr.sort((a, b) => {
      return a.sortOrder - b.sortOrder
    })
  }
  // 刷新抽屉数据
  function refreshItemsData() {
    const currentID = editGroupDetail.value.id
    groupedItems.map(item => {
      if (item.id === currentID) {
        items.value = item.children
      }
    })

    // console.log(items.value);
  }
  function startCopyModal(idx, item) {
    const newItem = cloneDeep(item)
    newItem.text += '_副本'

    modalName.value = newItem.text
    modalSh.value = newItem.sh
    modalType.value = newItem.type
    modalDetail.value = newItem.detail || ''
    modalVoiceIndexKey.value = newItem.voiceIndexKey || ''
    modalTerminalInteractive.value = newItem.terminalInteractive
    showModal.value = true
    shMode.value = newItem.shMode || 1 // 单、多终端模式-当前模式
    editModalItem.value = cloneDeep(newItem)
    nextTick(() => {
      if (
        monacoRef.value &&
        monacoRef.value.editor &&
        typeof monacoRef.value.editor.setValue === 'function'
      ) {
        monacoRef.value.editor.setValue(newItem.sh)
      }
    })
  }
  // 迁移到其他分组-start
  const moveOperation = ref(false) // 批量迁移操作标识
  const checkedCacheItems = ref([]) // 缓存批量迁移数据（多个）
  const moveCacheData = ref({}) // 缓存迁移数据（单个）
  const moveCacheDialogVisible = ref(false) // 弹窗是否显示
  const moveCacheGroupId = ref('') // 选择的目标分组id
  async function moveToGroup(idx, item) {
    moveCacheData.value = item
    moveCacheDialogVisible.value = true
  }
  async function moveToGroupConfirm() {
    // 区分单个还是批量
    if (moveOperation.value) {
      for (let i = 0; i < checkedCacheItems.value.length; i++) {
        const item = checkedCacheItems.value[i]
        await moveToGroupConfirmNext(item)
      }
      // 还原批量迁移数据
      moveOperation.value = false
      checkedCacheItems.value = []
      items.value.forEach(item => {
        delete item.checked
      })
    } else {
      const item = cloneDeep(moveCacheData.value)
      await moveToGroupConfirmNext(item)

      // 清空缓存数据
      moveCacheData.value = {}
    }

    ElMessage.success('迁移成功')

    // 关闭弹窗
    moveCacheDialogVisible.value = false
    moveCacheGroupId.value = ''

    // 初始化
    await init()
    refreshItemsData()
  }
  async function moveToGroupConfirmNext(item) {
    const id = item.id
    const typeId = moveCacheGroupId.value

    const json = {
      ...item,
      typeId,
      sortOrder: 0, // 排序
    }
    delete json.id
    delete json.checked
    // 将当前数据，新增到其他分组
    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'create',
        data: { item: json, sql: 'data' },
      },
    })

    // 删除当前数据
    await jsBridge.registerSync({
      method: 'proxySql',
      json: {
        methods: 'remove',
        data: { id, sql: 'data' },
      },
    })
  }
  function moveToGroupCancel() {
    moveCacheDialogVisible.value = false
    moveCacheData.value = {}
    moveCacheGroupId.value = ''
  }
  function checkItem(item) {
    item.checked = !item.checked
  }
  function moveToGroupBatch() {
    const checkedItems = filterCheckedItems()
    if (!checkedItems.length) {
      ElMessage.error('请选择批量执行的条目')
      return
    }
    checkedCacheItems.value = checkedItems
    moveCacheDialogVisible.value = true
  }
  function filterCheckedItems() {
    return items.value.filter(item => item.checked)
  }
  // 取消批量选择操作
  function closeMoveOperation() {
    moveOperation.value = false
    items.value.forEach(item => {
      item.checked = false
    })
  }
  // 迁移到其他分组-end

  function startEditInDrawer(idx, item) {
    // 打开编辑弹窗，填充内容
    editModalIdx.value = idx
    editModalDetailObj.value = item
    editModalName.value = item.text
    editModalType.value = item.type
    editModalSh.value = item.sh || ''
    editModalDetail.value = item.detail || ''
    editModalVoiceIndexKey.value = item.voiceIndexKey || ''
    editModalTerminalInteractive.value = item.terminalInteractive || '2'
    showEditModal.value = true
    shMode.value = item.shMode || 1 // 单、多终端模式-当前模式
    editModalItem.value = cloneDeep(item)
    nextTick(() => {
      if (
        editModalMonacoRef.value &&
        editModalMonacoRef.value.editor &&
        typeof editModalMonacoRef.value.editor.setValue === 'function'
      ) {
        editModalMonacoRef.value.editor.setValue(editModalSh.value)
      }
    })
  }

  async function saveEditModal() {
    if (!editModalName.value.trim()) {
      ElMessage.error('请输入名称')
      return
    }
    let shContent = editModalSh.value
    if (
      editModalMonacoRef.value &&
      editModalMonacoRef.value.editor &&
      typeof editModalMonacoRef.value.editor.getValue === 'function'
    ) {
      shContent = editModalMonacoRef.value.editor.getValue()
    }

    if (!editModalName.value.trim()) {
      ElMessage.error('请输入名称')
      return
    }
    if (!editModalType.value.trim()) {
      ElMessage.error('请选择类型')
      return
    }
    if (shMode.value === 1) {
      if (!shContent) {
        ElMessage.error('请输入sh脚本')
        return
      }
    } else if (shMode.value === 2) {
      if (!editModalItem.value?.shModeList?.length) {
        ElMessage.error('请添加终端指令')
        return
      }
    }

    // 如果终端交互式 否，进行二次提示
    if (editModalTerminalInteractive.value === '2') {
      await ElMessageBox.confirm(`当前脚本不包含“终端交互”，请二次确认`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '去修改',
        type: 'warning',
      })
    }

    const id = editModalDetailObj.value.id
    if (id) {
      const newItem = {
        id,
        text: editModalName.value.trim(),
        type: editModalType.value.trim(),
        sh: shContent,
        detail: editModalDetail.value.trim(),
        voiceIndexKey: editModalVoiceIndexKey.value.trim(),
        terminalInteractive: editModalTerminalInteractive.value,
        shMode: shMode.value,
        shModeList: toRaw(editModalItem.value.shModeList),
      }

      // 更新原 items
      const realIdx = items.value.findIndex(it => it.id === id)
      if (realIdx !== -1) items.value[realIdx] = newItem

      // 删除不需要的字段
      delete newItem.executeLoading

      jsBridge.register({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id, item: newItem, sql: 'data' },
        },
        callback: async res => {
          await init()
          refreshItemsData()

          // 如果有搜索内容，则更新搜索内容
          updateSearchData(id, newItem)
        },
      })
    }
    showEditModal.value = false
    editModalTerminalInteractive.value = '2'
    editModalDetail.value = ''
  }
  // 如果有搜索内容，则更新搜索内容
  function updateSearchData(id, newItem) {
    if (!dataDataAllFilterByInputText.value.length) return
    for (let i = 0; i < dataDataAllFilterByInputText.value.length; i++) {
      const item = dataDataAllFilterByInputText.value[i]
      if (item.id === id) {
        dataDataAllFilterByInputText.value.splice(i, 1, newItem)
      }
    }
  }
  function cancelEditModal() {
    showEditModal.value = false
    editModalTerminalInteractive.value = '2'
    editModalDetail.value = ''
  }
  function removeInDrawer(idx, item) {
    // const group = groupedItems.value[drawerType.value] || [];
    // const item = group[idx];
    // if (!item) return;
    editValueDetail.value = item
    showDeleteConfirm.value = true
    // remove();
  }

  function handleClose() {
    drawerVisible.value = false
    drawerVisibleAllow.value = false
  }

  function add() {
    if (newItem.value.trim()) {
      items.value.push({ id: nextId++, text: newItem.value.trim(), type: '' })
      newItem.value = ''
    }
  }
  function remove(idx) {
    showDeleteConfirm.value = true
    deleteIdx.value = idx
  }
  function confirmDelete() {
    // const idx = deleteIdx.value;
    const id = editValueDetail.value.id
    if (id) {
      // items.value.splice(idx, 1);
      // 调用electron curd删除
      jsBridge.register({
        method: 'proxySql',
        json: {
          methods: 'remove',
          data: { id, sql: 'data' },
        },
        callback: async res => {
          // 初始化
          await init()
          refreshItemsData()
        },
      })
    }
    showDeleteConfirm.value = false
    deleteIdx.value = -1
  }
  function cancelDelete() {
    showDeleteConfirm.value = false
    deleteIdx.value = -1
  }
  function startEdit(idx, item) {
    editIndex.value = idx
    editValueName.value = item.text
    editValueType.value = item.type
    editValueSh.value = item.sh || ''
    nextTick(() => {
      if (
        editMonacoRefs[idx] &&
        editMonacoRefs[idx].editor &&
        typeof editMonacoRefs[idx].editor.setValue === 'function'
      ) {
        editMonacoRefs[idx].editor.setValue(editValueSh.value)
      }
    })
  }
  function saveEdit(idx) {
    let shContent = editValueSh.value
    if (
      editMonacoRefs[idx] &&
      editMonacoRefs[idx].editor &&
      typeof editMonacoRefs[idx].editor.getValue === 'function'
    ) {
      shContent = editMonacoRefs[idx].editor.getValue()
    }
    if (editValueName.value.trim()) {
      const id = items.value[idx].id
      const newItem = {
        id,
        text: editValueName.value.trim(),
        type: editValueType.value.trim(),
        sh: shContent,
      }
      items.value[idx] = newItem
      // 调用electron curd update
      jsBridge.register({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id, item: newItem, sql: 'dataGroup' },
        },
        callback: res => {
          // 可选：处理回调
        },
      })
    }
    cancelEdit()
  }
  function cancelEdit() {
    editIndex.value = -1
    editValueName.value = ''
    editValueType.value = ''
    editValueSh.value = ''
  }

  function handleAddGroup() {
    if (!modalNameGroup.value.trim()) {
      ElMessage.error('请输入分组名称')
      return
    }

    // 验证icon只能包含字母
    if (modalAppIconGroup.value && !/^[a-zA-Z]+$/.test(modalAppIconGroup.value)) {
      ElMessage.error('Icon名称只能包含字母')
      return
    }

    const newItem = {
      text: modalNameGroup.value.trim(),
      appIcon: modalAppIconGroup.value.trim(),
      appIntroduce: modalAppIntroduceGroup.value.trim(),
    }

    // 调用electron curd新增
    jsBridge.register({
      method: 'proxySql',
      json: {
        methods: 'create',
        data: { item: newItem, sql: 'dataGroup' },
      },
      callback: async res => {
        await init()
      },
    })

    modalNameGroup.value = ''
    modalAppIconGroup.value = ''
    modalAppIntroduceGroup.value = ''
    showModalGroup.value = false
  }
  function handleEditGroup() {
    if (!modalNameGroup.value.trim()) {
      ElMessage.error('请输入分组名称')
      return
    }

    // 验证icon只能包含字母
    if (modalAppIconGroup.value && !/^[a-zA-Z]+$/.test(modalAppIconGroup.value)) {
      ElMessage.error('Icon名称只能包含字母')
      return
    }

    const data = {
      id: editGroupDetail.value.id,
      text: modalNameGroup.value,
      appIcon: modalAppIconGroup.value,
      appIntroduce: modalAppIntroduceGroup.value,
    }

    jsBridge.register({
      method: 'proxySql',
      json: {
        methods: 'update',
        data: { id: data.id, item: data, sql: 'dataGroup' },
      },
      callback: async res => {
        modalNameGroup.value = ''
        modalAppIconGroup.value = ''
        modalAppIntroduceGroup.value = ''
        showModalGroup.value = false

        // 可选：处理回调
        await init()
      },
    })
  }

  function addGroup() {
    modalGroupStatus.value = 'add'
    showModalGroup.value = true
  }

  function addModal() {
    showModal.value = true
    shMode.value = 1
    editModalItem.value = {}
    modalVoiceIndexKey.value = ''
  }
  async function handleAdd() {
    // 当前 groupId
    const id = editGroupDetail.value.id

    let shContent = modalSh.value
    if (
      monacoRef.value &&
      monacoRef.value.editor &&
      typeof monacoRef.value.editor.getValue === 'function'
    ) {
      shContent = monacoRef.value.editor.getValue()
    }
    console.log('shContent', shContent)

    if (!modalName.value.trim()) {
      ElMessage.error('请输入名称')
      return
    }
    if (!modalType.value.trim()) {
      ElMessage.error('请选择类型')
      return
    }
    if (shMode.value === 1) {
      if (!shContent) {
        ElMessage.error('请输入sh脚本')
        return
      }
    } else if (shMode.value === 2) {
      if (!editModalItem.value.shModeList.length) {
        ElMessage.error('请添加终端指令')
        return
      }
    }

    // 如果终端交互式 否，进行二次提示
    if (modalTerminalInteractive.value === '2') {
      await ElMessageBox.confirm(`当前脚本不包含“终端交互”，请二次确认`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '去修改',
        type: 'warning',
      })
    }

    // 组织接口数据
    const newItem = {
      text: modalName.value.trim(),
      type: modalType.value.trim(),
      sh: shContent,
      detail: modalDetail.value.trim(),
      voiceIndexKey: modalVoiceIndexKey.value.trim(),
      terminalInteractive: modalTerminalInteractive.value,
      typeId: id,
      alwaysUseNum: 0,
      sortOrder: 0, // 排序
      shMode: shMode.value,
      shModeList: toRaw(editModalItem.value.shModeList),
    }
    items.value.push({ id: nextId++, ...newItem })
    console.log('items')
    console.log(items.value)
    // 调用electron curd新增
    jsBridge.register({
      method: 'proxySql',
      json: {
        methods: 'create',
        data: { item: newItem, sql: 'data' },
      },
      callback: async res => {
        // 初始化
        await init()
        refreshItemsData()
      },
    })
    modalName.value = ''
    modalType.value = ''
    modalSh.value = ''
    modalDetail.value = ''
    modalVoiceIndexKey.value = ''
    modalTerminalInteractive.value = '2'
    if (
      monacoRef.value &&
      monacoRef.value.editor &&
      typeof monacoRef.value.editor.setValue === 'function'
    ) {
      monacoRef.value.editor.setValue('')
    }
    showModal.value = false
  }
  function executeAlways(item) {
    item.alwaysUseNumHover = true
    // 增加常用次数
    // setTimeout(() => {
    //   item.alwaysUseNumHover = false;
    // }, 300);

    execute(item, 'always')
  }

  // fromType: 执行来源： usually: 抽屉和下拉窗点击来源； always: 常用列表点击来源
  async function execute(item, fromType = '') {
    // console.log("fromType");
    // console.log(fromType);

    // 取sh脚本内容，优先用item.sh（monaco-editor内容）
    const shContent = item.sh || ''
    const shMode = item.shMode || 1 // 1: 单终端；2: 多终端
    const shModeList = item.shModeList || [] // 多终端列表

    if (shMode === 1) {
      // 没有可执行的sh脚本
      if (!shContent) {
        alert('单终端-没有可执行的sh脚本')
        return
      }
    } else if (shMode === 2) {
      if (!shModeList.length) {
        alert('多终端-没有可执行的sh脚本')
        return
      }
    }

    // loading启动
    item.executeLoading = true

    // 如果需要终端交互，才显示终端 和 终端相关交互
    if (item.terminalInteractive === '1') {
      // 带终端执行sh脚本
      // executeWithModal(shContent, item, fromType)
      // 带外部终端执行sh脚本；执行单终端
      executeWithModalMacTerminal(shContent, item, fromType)
    } else if (item.terminalInteractive === '2') {
      // 不带终端执行sh脚本
      executeWithoutModal(shContent, item, fromType)
    } else if (item.terminalInteractive === '3') {
      // 外部终端；区分单终端和多终端
      if (shMode === 1) {
        // 带外部终端执行sh脚本；执行单终端
        executeWithModalMacTerminal(shContent, item, fromType)
      } else if (shMode === 2) {
        // 执行多终端
        for (let i = 0; i < shModeList.length; i++) {
          console.log('shModeList[i].sh', shModeList[i].sh)
          executeWithModalMacTerminal(shModeList[i].sh, item, fromType)
          // 等待1.5秒
          // await sleep(1500)
        }
      }
    }

    addAlwaysUseNum(item)
  }

  function sleep(duration = 500) {
    return new Promise(resolve => setTimeout(resolve, duration))
  }

  // 增加常用次数
  function addAlwaysUseNum(item) {
    // 增加常用次数
    if (item.alwaysUseNum !== undefined) {
      item.alwaysUseNum++
    }

    // 清除alwaysHover
    const itemRaw = cloneDeep(toRaw(item))
    delete itemRaw.alwaysHover
    delete itemRaw.executeLoading
    delete itemRaw.alwaysUseNumHover

    jsBridge.register({
      method: 'proxySql',
      json: {
        methods: 'update',
        data: { id: item.id, item: itemRaw, sql: 'data' },
      },
    })
  }

  async function executeWithModalMacTerminal(shContent, itemData, fromType = '') {
    await terminalCptRef.value.executeWithModalMacTerminal(shContent)
    ElMessage.success('执行成功')
    itemData.executeLoading = false
    itemData.alwaysUseNumHover = false
    if (removeTerminalListener) removeTerminalListener()

    if (fromType === 'usually') {
      handleAlwaysUseList()
    }
  }
  // 带终端执行sh脚本
  function executeWithModal(shContent, itemData, fromType = '') {
    showExecModal.value = true
    execRunning.value = true

    nextTick(() => {
      if (term) {
        term.dispose()
        term = null
      }
      term = new Terminal({ fontSize: 14, theme: { background: '#222' } })
      fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(xtermContainer.value)
      fitAddon.fit()
      term.onData(input => {
        // console.log("input");
        // console.log(input);

        window.electronAPI.sendTerminalInput(input)
      })
    })

    if (removeTerminalListener) removeTerminalListener()
    removeTerminalListener = window.electronAPI.onTerminalOutput(data => {
      console.log('每次返回data-2')

      if (data.type === 'stdout' || data.type === 'stderr') {
        term && term.write(data.data)
      }
      if (data.type === 'close') {
        term && term.write(`\r\n[进程已结束，退出码：${data.code}]\r\n`)
        execRunning.value = false
        itemData.executeLoading = false
        itemData.alwaysUseNumHover = false
        if (removeTerminalListener) removeTerminalListener()

        if (fromType === 'usually') {
          handleAlwaysUseList()
        }
      }
    })

    setTimeout(() => {
      itemData.executeLoading = false
    }, 300)

    // 发送命令（sh脚本内容）
    window.electronAPI.runTerminalCommandStream(shContent)
  }
  // 不带终端执行sh脚本
  function executeWithoutModal(shContent, itemData, fromType = '') {
    if (removeTerminalListener) removeTerminalListener()
    removeTerminalListener = window.electronAPI.onTerminalOutput(data => {
      console.log('每次返回data-1')

      if (data.type === 'close') {
        ElMessage.success('执行成功')
        itemData.executeLoading = false
        itemData.alwaysUseNumHover = false
        if (removeTerminalListener) removeTerminalListener()

        if (fromType === 'usually') {
          handleAlwaysUseList()
        }
      }
    })
    // 发送命令（sh脚本内容）
    window.electronAPI.runTerminalCommandStream(shContent)
  }

  function onExecModalClosed() {
    if (term) {
      term.dispose()
      term = null
    }
    if (removeTerminalListener) removeTerminalListener()
  }

  function sendTerminalInput() {
    //   if (terminalInput.value && window.electronAPI && execRunning.value) {
    window.electronAPI.sendTerminalInput(terminalInput.value + '\n')
    terminalInput.value = ''
    //   }
  }

  // 获取数据
  async function getData(sqlName = 'data') {
    return new Promise((resolve, reject) => {
      jsBridge.register({
        method: 'proxySql',
        json: {
          methods: 'readAll',
          data: {
            sql: sqlName,
          },
        },
        callback: res => {
          let arr = []
          try {
            arr = typeof res === 'string' ? JSON.parse(res) : res
          } catch (e) {
            arr = []
          }

          resolve(arr)
        },
      })
    })
  }

  function makeChildren(dataData, id) {
    const childrenData = []
    dataData.map(itemSon => {
      if (itemSon.typeId === id) {
        childrenData.push(itemSon)
      }
    })
    // 按照 sortOrder 字段排序
    const childrenDataResult = sortItems(childrenData)
    return childrenDataResult
  }

  function editGroup(group) {
    // TODO: 实现分组编辑弹窗逻辑
    editGroupDetail.value = group
    modalNameGroup.value = group.text || ''
    modalAppIconGroup.value = group.appIcon || ''
    modalAppIntroduceGroup.value = group.appIntroduce || ''

    modalGroupStatus.value = 'edit'
    showModalGroup.value = true
  }
  function deleteGroup(group) {
    ElMessageBox.confirm(
      `确定要删除分组“${group.text}”吗？删除后，该分组下的所有sh脚本都将删除，请谨慎操作！`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        // 用户点击了确定
        jsBridge.register({
          method: 'proxySql',
          json: {
            methods: 'remove',
            data: { id: group.id, sql: 'dataGroup' },
          },
          callback: async res => {
            // 删除分组后，删除分组下的所有数据
            await removeItemInGroup(group)
            await init()
            ElMessage.success('分组删除成功')
          },
          error: () => {
            ElMessage.error('删除失败')
          },
        })
      })
      .catch(() => {
        // 用户点击了取消
        ElMessage.info('已取消删除')
      })
  }
  async function removeItemInGroup(group) {
    // 删除分组下的所有数据
    for (let i = 0; i < group.children.length; i++) {
      const item = group.children[i]
      await jsBridge.registerSync({
        method: 'proxySql',
        json: { methods: 'remove', data: { id: item.id, sql: 'data' } },
      })
    }
  }

  // dragger组件，拖拽之后回调函数
  async function onEditListDragEnd(event) {
    if (event.oldIndex === event.newIndex) {
      console.log('顺序没发生变化')
      return
    }
    ElMessage.success('操作成功')

    for (let i = 0; i < items.value.length; i++) {
      const item = items.value[i]
      // 更新当前新的排序字段：sortOrder
      item.sortOrder = i + 1
      const itemRaw = toRaw(item) // proxy对象转普通对象

      await jsBridge.registerSync({
        method: 'proxySql',
        json: {
          methods: 'update',
          data: { id: itemRaw.id, item: itemRaw, sql: 'data' },
        },
      })
    }

    // 重新初始化数据
    await init()
    refreshItemsData()
  }

  // 初始化
  async function init() {
    const dataGroupData = await getData('dataGroup')
    const dataData = await getData('data')

    // 存储所有数据
    dataDataAll.value = dataData

    // 覆盖 groupedItems
    groupedItems.splice(0, groupedItems.length, ...dataGroupData)
    // 组装分组数据
    groupedItems.map(item => {
      const id = item.id
      item.children = makeChildren(dataData, id)
    })

    // 处理常用列表数据
    setTimeout(() => {
      handleAlwaysUseList()
    }, 300)
  }
  // 处理常用列表数据
  function handleAlwaysUseList() {
    const alwaysList = dataDataAll.value
      .sort((a, b) => b.alwaysUseNum - a.alwaysUseNum)
      .filter(item => item.alwaysUseNum > 0)
      .slice(0, 10)
    alwaysUseList.value = alwaysList
  }
  function alwaysMouseLeave(item) {
    item.alwaysHover = false
    handleAlwaysUseList()
  }

  // 获取任意第三方地址的favicon.ico图标
  function getFavicon(url) {
    let reg = /http(s)?.*\.(com|net|cn|lu|im|org|xyz|top|tech|gov|edu|ink|int|mil|pub|hk)/g

    let src = ''
    if (reg.test(url)) {
      src = url.match(reg)[0] + '/favicon.ico'
    } else {
      src = this.defaultAppIcon
    }

    return src
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

  // 处理Markdown链接点击事件
  function handleMarkdownLinkClick(event) {
    if (event.target.classList.contains('markdown-link')) {
      event.preventDefault()
      event.stopPropagation()

      const href = event.target.getAttribute('href')
      if (href) {
        try {
          // 使用Electron的openExternal方法打开链接
          openExternal(href)
        } catch (error) {
          console.error('Failed to open external link:', error)
          // 如果Electron方法失败，回退到默认浏览器
          window.open(href, '_blank')
        }
      }
    }
  }

  function openMarkdownDocument() {
    // 使用Electron的openExternal方法打开链接
    openExternal('https://markdown.com.cn/basic-syntax/')
  }

  // 验证icon输入，只允许字母字符串
  function validateIconInput(value) {
    if (value) {
      // 只保留字母字符
      const cleanValue = value.replace(/[^a-zA-Z]/g, '')
      if (cleanValue !== value) {
        modalAppIconGroup.value = cleanValue
        ElMessage.warning('Icon名称只能包含字母')
      }
    }
  }

  // 阻止非字母字符输入
  function preventNumberInput(event) {
    const charCode = event.charCode || event.keyCode
    const key = event.key

    // 只允许字母字符 (A-Z, a-z)
    if (!/^[a-zA-Z]$/.test(key)) {
      event.preventDefault()
      ElMessage.warning('Icon名称只能包含字母')
    }
  }

  onMounted(async () => {
    // 初始化
    await init()

    // 添加Markdown链接点击事件监听器
    document.addEventListener('click', handleMarkdownLinkClick)
  })

  // 组件卸载时移除事件监听器
  onUnmounted(() => {
    document.removeEventListener('click', handleMarkdownLinkClick)
  })
</script>

<style lang="scss" scoped>
  .home {
    --sh-bg: #121212;
    --sh-panel: #1a1a1a;
    --sh-panel-soft: #202020;
    --sh-border: #2e2e2e;
    --sh-border-soft: rgba(255, 255, 255, 0.08);
    --sh-text: #e0e0e0;
    --sh-text-muted: #9a9a9a;
    --sh-primary: #42b983;
    --sh-primary-soft: rgba(66, 185, 131, 0.16);
    --sh-shadow-soft: 0 18px 42px -34px rgba(0, 0, 0, 0.75);

    position: relative;
    width: 100%;
    max-width: 100%;
    min-height: 0;
    margin: 0 auto;
    align-items: flex-start;
    color: var(--sh-text);

    .always-use {
      margin-right: 16px;
      background: var(--sh-panel);
      height: calc(100vh - 40px - 48px);
      padding: 12px 0;
      border: 1px solid var(--sh-border);
      border-radius: 14px;
      width: 0;
      overflow: hidden;
      box-shadow: var(--sh-shadow-soft);

      &.always-use-show {
        width: 98px;
      }

      .always-use-title {
        position: relative;
        width: 98px;
        margin-bottom: 10px;
        padding: 2px 0 12px;
        border-bottom: 1px solid var(--sh-border);
        color: var(--sh-text-muted);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-align: center;
      }

      .always-use-content {
        width: 100%;
        overflow-y: auto;
        padding-top: 7px;

        .always-use-item {
          margin-bottom: 10px;

          .always-use-item-content {
            position: relative;

            .always-use-item-title {
              width: 48px;
              height: 48px;
              padding: 10px;
              border: 1px solid var(--sh-border-soft);
              border-radius: 14px;
              background: var(--sh-panel-soft);
              box-shadow: none;
              color: var(--sh-text);
              font-size: 13px;
              line-height: 28px;
              text-align: center;

              &:hover {
                border-color: rgba(66, 185, 131, 0.36);
                background: #252525;
              }

              .always-use-item-run {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                border-radius: inherit;
                background: rgba(66, 185, 131, 0.9);
                color: #fff;
              }
            }

            .num-count {
              position: absolute;
              right: -2px;
              top: -6px;
              min-width: 20px;
              height: 20px;
              padding: 0 6px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              border-radius: 999px;
              background: #2a2a2a;
              color: var(--sh-text);
              font-size: 11px;
              font-weight: 500;
            }
          }
        }
      }
    }

    .home-group-list {
      flex: 1;
      height: calc(100vh - 40px - 48px);
      min-width: 0;
      padding: 0 2px;
    }
  }

  @keyframes voice-wakeup-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  .header-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--sh-border);

    .title {
      margin-right: 20px;
      color: var(--sh-text);
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .search-input-vanishing {
      width: 200px;
      height: 39px;
    }

    .voice-wakeup-intro-link {
      display: inline-block;
      margin-left: 16px;
      color: #6bcf9d;
      font-size: 13px;
      text-decoration: none;
      white-space: nowrap;
      animation: voice-wakeup-float 2.2s ease-in-out infinite;

      &:hover {
        color: #8ee0b6;
        text-decoration: none;
        animation-play-state: paused;
      }
    }
  }

  .add-btn {
    margin-bottom: 10px;
  }

  .edit-list {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .edit-list li {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
    padding: 11px 14px;
    box-sizing: border-box;
    border: 1px solid var(--sh-border);
    border-radius: 10px;
    background: #1a1a1a;
    color: var(--sh-text);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;

    .item-line-cover {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
    }
  }

  .edit-list li:hover {
    border-color: rgba(66, 185, 131, 0.28);
    background: #202020;
    box-shadow: 0 14px 30px -26px rgba(0, 0, 0, 0.9);
    transform: translateX(4px);
  }

  .item-text {
    flex: 1;
    color: var(--sh-text);
    word-break: break-all;
  }

  .item-text-cover {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .item-type {
    display: inline-block;
    margin-left: 16px;
    margin-right: 10px;
    color: var(--sh-text-muted);
    font-size: 12px;
  }

  .btn-group {
    display: flex;
    gap: 6px;

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    :deep(.btn-loading) {
      margin-right: 10px;
      opacity: 0;
      color: var(--sh-primary);
      animation: rotate 1s linear infinite;

      &.show {
        opacity: 1;
      }
    }

    :deep(.el-button) {
      margin: 0 6px 0 0;
      border: 1px solid var(--sh-border);
      border-radius: 8px;
      background: #242424;
      box-shadow: none;
      color: var(--sh-text);
      transition:
        background 0.18s ease,
        border-color 0.18s ease,
        color 0.18s ease;

      &:hover {
        border-color: rgba(66, 185, 131, 0.45);
        background: var(--sh-primary-soft);
        color: #7ee2ad;
      }
    }
  }

  .form-row {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }

  .form-row label {
    width: 42px;
    flex-shrink: 0;
    color: var(--sh-text-muted);
    font-size: 13px;
    text-align: right;
  }

  .form-row .el-input,
  .form-row .el-select {
    flex: 1;
  }

  .form-row-field {
    flex: 1;
    min-width: 0;

    .el-input {
      width: 100%;
    }

    .element-url {
      display: inline-block;
      margin-top: 6px;
      color: #7ee2ad;
      font-size: 12px;
      line-height: 1.4;
      text-decoration: none;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .voice-index-label {
    cursor: help;
  }

  .voice-index-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--sh-primary-soft);
    color: #7ee2ad;
    font-size: 12px;
    font-weight: 600;
  }

  .markdown-document-url {
    margin-left: 42px;
    color: #6bcf9d;
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      color: #8ee0b6;
    }
  }

  .add-sh-mode-btn {
    border: 1px solid var(--sh-border);
    border-radius: 8px;
    background: #242424;
    color: var(--sh-text);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;

    &:hover {
      border-color: rgba(66, 185, 131, 0.45);
      background: var(--sh-primary-soft);
      color: #7ee2ad;
    }
  }

  .modal-mask {
    position: fixed;
    z-index: 2000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.42);
  }

  .modal-container {
    min-width: 360px;
    padding: 24px 28px;
    border: 1px solid var(--sh-border);
    border-radius: 16px;
    background: #1a1a1a;
    color: var(--sh-text);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
  }

  .modal-header {
    margin-bottom: 18px;
    color: var(--sh-text);
    font-size: 17px;
    font-weight: 600;
    text-align: center;
  }

  .modal-body {
    margin-bottom: 20px;

    .dislog-monacoEditor-part {
      width: calc(100% - 42px);
    }

    .dislog-monacoEditor {
      width: 100%;
      min-height: 220px;
      overflow: hidden;
      border: 1px solid var(--sh-border);
      border-radius: 12px;
      background: #1e1e1e;
    }

    .dislog-monacoEditor-list {
      border: 1px solid var(--sh-border) !important;
      border-radius: 12px !important;
      background: #1e1e1e !important;
    }

    .dislog-monacoEditor-list-item {
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 10px !important;
      background: #252525 !important;
    }
  }

  .dislog-input,
  .dislog-select,
  .dislog-textarea {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-select__wrapper) {
      border: 1px solid var(--sh-border);
      border-radius: 10px;
      background: #202020;
      box-shadow: none;
      color: var(--sh-text);
    }

    :deep(.el-input__wrapper:hover),
    :deep(.el-textarea__inner:hover),
    :deep(.el-select__wrapper:hover),
    :deep(.el-input__wrapper.is-focus),
    :deep(.el-select__wrapper.is-focused) {
      border-color: rgba(66, 185, 131, 0.45);
      box-shadow: none;
    }
  }

  .voice-index-tooltip-detail {
    line-height: 1.6;
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .black-btn {
    border: 1px solid rgba(66, 185, 131, 0.38) !important;
    border-radius: 9px !important;
    background: rgba(66, 185, 131, 0.88) !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .black-btn:hover,
  .black-btn:focus {
    border-color: rgba(66, 185, 131, 0.58) !important;
    background: #42b983 !important;
    color: #fff !important;
  }

  .type-list-container {
    width: 100%;
    height: calc(100% - 54px);
    overflow-y: auto;
    padding-right: 2px;

    .type-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px;
      padding: 2px 2px 16px;

      .list-item {
        position: relative;
        width: 100%;
        min-width: 0;
        height: 155px;
        margin: 0;
        flex-direction: column;
        justify-content: flex-start;
        overflow: hidden;
        border: 1px solid var(--sh-border);
        border-radius: 14px;
        background: #1a1a1a;
        box-shadow: none;
        color: var(--sh-text);
        cursor: pointer;
        transition:
          background 0.18s ease,
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.18s ease;

        &:hover,
        &.hover {
          border-color: rgba(66, 185, 131, 0.28);
          background: #202020;
          box-shadow: 0 18px 42px -34px rgba(0, 0, 0, 0.95);
          transform: translateY(-2px);
        }

        .app-icon {
          width: 44px;
          height: 44px;
          margin-top: 18px;
          border: 1px solid rgba(66, 185, 131, 0.2);
          border-radius: 14px;
          background: var(--sh-primary-soft);
          color: #7ee2ad;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;

          :deep(.el-icon) {
            color: inherit;
          }
        }

        .app-detail {
          width: calc(100% - 28px);
          margin-top: 12px;
          padding: 0 14px;
          box-sizing: border-box;
          transition: opacity 0.18s ease;

          .app-name {
            width: 100%;
            color: var(--sh-text);
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            text-align: center;
          }

          .app-introduce {
            width: 100%;
            margin-top: 6px;
            color: var(--sh-text-muted);
            font-size: 12px;
            line-height: 18px;
            opacity: 1;
            text-align: center;
            transition: opacity 0.18s ease;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        }

        .app-btns {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          padding: 4px 6px;
          border: 1px solid var(--sh-border-soft);
          border-radius: 999px;
          background: rgba(36, 36, 36, 0.92);
          color: var(--sh-text-muted);
          cursor: pointer;
          opacity: 0.96;

          :deep(.el-icon) {
            color: inherit;
            transition: color 0.18s ease;

            &:hover {
              color: #7ee2ad;
            }
          }

          .icon-edit {
            margin-right: 2px;
          }
        }

        .hover-show {
          position: absolute;
          right: 0;
          bottom: -46px;
          width: 100%;
          height: 42px;
          padding-right: 10px;
          box-sizing: border-box;
          background: rgba(32, 32, 32, 0.96);
          border-top: 1px solid var(--sh-border);
          transition: bottom 0.2s ease;

          .btn {
            .hover-icon {
              margin-right: 5px;

              :deep(.el-icon) {
                color: var(--sh-text-muted);
              }
            }

            .hover-add {
              color: var(--sh-text);
              font-size: 13px;
              font-weight: 600;
            }

            &.active {
              .hover-add {
                color: #7ee2ad;
              }

              :deep(.el-icon) {
                color: #7ee2ad;
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

  .type-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 0;
    background: #202020;
    color: var(--sh-text);
    font-size: 20px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .type-btn:hover {
    background: var(--sh-primary-soft);
    color: #7ee2ad;
  }

  .type-group-mask {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.28);
    transition: opacity 0.2s;
  }

  :deep(.el-dialog) {
    padding: 22px;
    border: 1px solid var(--sh-border);
    border-radius: 18px;
    background: #1a1a1a;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);

    .el-dialog__title {
      color: var(--sh-text);
      font-weight: 600;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: var(--sh-text-muted);
    }
  }

  :deep(.mask-btn) {
    display: flex;
    align-items: center;
    height: 38px;
    margin-left: 8px !important;
    padding: 6px 18px !important;
    border: 1px solid var(--sh-border) !important;
    border-radius: 8px !important;
    background: #242424 !important;
    box-shadow: none;
    color: var(--sh-text) !important;
    font-size: 15px !important;
    font-weight: 500;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
  }

  :deep(.mask-btn):first-child {
    margin-left: 0 !important;
  }

  :deep(.mask-btn):hover {
    border-color: rgba(66, 185, 131, 0.45) !important;
    background: var(--sh-primary-soft) !important;
    color: #7ee2ad !important;
  }

  .editor-full-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    opacity: 0.72;

    &:hover {
      opacity: 1;
    }
  }
</style>
<style lang="scss">
  // ------------------------- 覆盖element-ui样式 -------------------------
  // 覆盖element-ui抽屉弹窗样式
  .sh-drawer-container {
    // background: #151e12 !important;
    .el-drawer__header {
      margin-bottom: 18px;
      margin-top: 10px;
    }

    .el-drawer__body {
      padding-top: 0;
    }
  }

  // tool-tip 覆盖样式
  .el-popper.is-customized {
    /* Set padding to ensure the height is 32px */
    padding: 10px;
    background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
  }

  .el-popper.is-customized .el-popper__arrow::before {
    background: linear-gradient(45deg, #b2e68d, #bce689);
    right: 0;
  }

  // 自定义 tooltip 内容样式
  .custom-tooltip-content {
    background-color: #2c3e50;
    padding: 10px;

    .always-tooltip-detail {
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      max-width: 1000px !important;
      margin-bottom: 6px;
      padding-bottom: 4px;
    }

    .tooltip-title,
    .always-tooltip-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 4px;
    }

    .tooltip-detail,
    .always-tooltip-detail {
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
        color: #67c23a !important;
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

  // tool-tip 覆盖样式

  .item-text-tooltip-popper {
    // transform: translateX(100px);
    // margin-left: 100px;
    margin-right: 36px;

    .custom-tooltip-content {
      width: 200px;
    }
  }

  .sh-full-dialog {
    padding-top: 48px !important;

    .el-dialog__title {
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 30px;
    }

    .dislog-monacoEditor-full {
      height: calc(100vh - 40px - 160px);

      .fullEditorRef {
        height: 100%;
      }
    }
  }

  .search-drawer-search {
    height: 80vh !important;

    .drawer-container {
      // width: 100vw;
      // height: calc(100% - 30px);
      // overflow-y: auto;
      .center-title {
        text-align: center;
        margin-bottom: 15px;
      }

      .drawer-content-content {
        width: 100%;
        height: calc(80vh - 130px);
        // overflow-y: auto;
        padding: 10px 20px 20px 20px;
        margin-bottom: 15px;
        align-items: flex-start;

        .image-show {
          // width: calc(100% - 60% - 20px);
          max-width: 380px;
          width: 30%;
          height: 100%;
          // background-color: #fff;
          margin-right: 20px;

          .text-content {
            width: 100%;
            height: 72px;
          }
        }

        .edit-list {
          // width: 60%;
          // width: calc(100% - 380px - 20px);
          flex: 1;
          height: 100%;
          overflow-y: auto;

          li {
            width: calc(100% - 20px);
          }
        }
      }

      .drawer-footer-content {
        width: 100%;

        .submit-btn {
          margin-bottom: 10px;
        }
      }
    }
  }

  // 覆盖弹窗样式
  .add-command-dialog {
    margin-top: 80px !important;
  }

  .edit-command-dialog {
    margin-top: 80px !important;
  }
</style>
