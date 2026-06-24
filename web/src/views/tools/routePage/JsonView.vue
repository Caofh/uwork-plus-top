<template>
  <div class="json-view-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button @click="formatJson" :icon="MagicStick">格式化</el-button>
          <el-button @click="compressJson" :icon="Compass">压缩</el-button>
          <el-button @click="clearJson" :icon="Delete">清空</el-button>
        </el-button-group>

        <el-button-group style="margin-left: 10px">
          <el-button @click="copyJson" :icon="CopyDocument">复制</el-button>
          <el-button @click="downloadJson" :icon="Download">下载</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-select v-model="theme" placeholder="选择主题" style="width: 120px">
          <el-option label="浅色" value="light" />
          <el-option label="深色" value="dark" />
        </el-select>

        <el-select
          v-model="fontSize"
          placeholder="字体大小"
          style="width: 100px; margin-left: 10px"
        >
          <el-option label="12px" value="12" />
          <el-option label="14px" value="14" />
          <el-option label="16px" value="16" />
          <el-option label="18px" value="18" />
        </el-select>

        <el-button :loading="savingJson" :icon="FolderChecked" @click="saveJsonToLocal">保存</el-button>
        <el-button :type="savedListVisible ? 'primary' : 'default'" :icon="List" @click="toggleSavedList">
          记录
        </el-button>
      </div>
    </div>

    <div v-show="savedListVisible" class="saved-json-panel">
      <div v-if="savedJsonList.length" class="saved-json-list">
        <div
          v-for="item in savedJsonList"
          :key="item.id"
          class="saved-json-item"
          :class="{ 'saved-json-item--active': activeSavedRecord?.id === item.id }"
          @click="loadSavedJson(item)"
        >
          <div class="saved-json-item__main">
            <span class="saved-json-item__name">{{ item.name }}</span>
            <span class="saved-json-item__time">{{ formatSavedTime(item.updatedAt) }}</span>
          </div>
          <el-button
            link
            type="danger"
            class="saved-json-item__delete"
            @click.stop="deleteSavedJson(item)"
          >
            删除
          </el-button>
        </div>
      </div>
      <el-empty v-else description="暂无保存记录" :image-size="56" />
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content" ref="mainContentRef">
      <!-- 左侧JSON编辑器 -->
      <div class="editor-section" :style="{ width: leftWidth + 'px' }">
        <div class="section-header">
          <div class="c-flex-x-start">
            <h3 class="section-header-title">JSON输入</h3>
            <span
              v-if="activeSavedRecord"
              class="section-header-record"
              :title="activeSavedRecord.name"
            >
              {{ activeSavedRecord.name }}
            </span>
            <div v-if="leftWidth > 307" class="section-header-switch c-flex-x-start">
              <div class="section-header-switch-text">自动格式化</div>
              <el-switch v-model="isShowJsonStatus" />
            </div>
          </div>
          <div v-if="leftWidth > 307" class="section-header-right c-flex-x-start">
            <el-button size="small" @click="restoreDefaultJson">恢复默认</el-button>
            <el-tag v-if="jsonStatus" :type="jsonStatus.type" size="small">
              {{ jsonStatus.message }}
            </el-tag>
          </div>
        </div>
        <div class="editor-container">
          <MonacoEditor
            ref="inputEditorRef"
            language="plaintext"
            :theme="monacoTheme"
            :options="editorOptions"
          />
          <el-button class="editor-full-btn" circle size="small" @click="openFullEditor('input')">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 可拖拽分隔线 -->
      <div class="resizer" @mousedown="startResize" :class="{ resizing: isResizing }"></div>

      <!-- 右侧转换结果 -->
      <div class="result-section" :style="{ width: rightWidth + 'px' }">
        <div class="section-header">
          <h3>转换结果</h3>
          <div v-if="rightWidth > 300">
            <el-button @click="copyResult" size="small" :icon="CopyDocument">复制结果</el-button>
          </div>
        </div>
        <div class="result-container">
          <MonacoEditor
            ref="resultEditorRef"
            language="plaintext"
            :theme="monacoTheme"
            :options="resultEditorOptions"
          />
          <el-button class="editor-full-btn" circle size="small" @click="openFullEditor('result')">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部工具面板 -->
    <div class="tools-panel">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="JSON转其他格式" name="convert">
          <div class="convert-tools">
            <el-button @click="convertToXml">JSON转XML</el-button>
            <el-button @click="convertToYaml">JSON转YAML</el-button>
            <el-button @click="convertToCsv">JSON转CSV</el-button>
            <el-button @click="convertToSql">JSON转SQL</el-button>
            <el-button @click="convertToJava">JSON转Java</el-button>
            <el-button @click="convertToTypeScript">JSON转TypeScript</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="其他格式转JSON" name="parse">
          <div class="parse-tools">
            <el-button @click="parseFromXml">XML转JSON</el-button>
            <el-button @click="parseFromYaml">YAML转JSON</el-button>
            <el-button @click="parseFromCsv">CSV转JSON</el-button>
            <el-button @click="parseFromUrl">URL参数转JSON</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="JSON工具" name="tools">
          <div class="json-tools">
            <el-button @click="sortJson">JSON排序</el-button>
            <el-button @click="escapeJson">JSON转义</el-button>
            <el-button @click="unescapeJson">JSON反转义</el-button>
            <el-button @click="validateJson">JSON验证</el-button>
            <el-button @click="generateRandomJson">生成随机JSON</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 全屏幕编辑弹窗 -->
    <el-dialog
      v-model="showFullEditor"
      :title="fullEditorTarget === 'input' ? 'JSON输入 - 全屏编辑' : '转换结果 - 全屏编辑'"
      width="90vw"
      top="2vh"
      :close-on-click-modal="false"
      fullscreen
      class="json-full-dialog"
    >
      <div class="dislog-monacoEditor-full">
        <MonacoEditor
          ref="fullEditorRef"
          v-model="fullEditorContent"
          class="fullEditorRef"
          language="plaintext"
          :theme="monacoTheme"
          :options="{
            ...editorOptions,
            scrollBeyondLastLine: isFullType === 'input',
            readOnly: isFullType === 'result',
            fontSize: fontSize,
          }"
        />
      </div>
      <template #footer>
        <el-button v-if="isFullType === 'input'" class="black-btn" @click="saveFullEditor">
          保存
        </el-button>
        <el-button @click="cancelFullEditor">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick, onUnmounted, inject } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    MagicStick,
    Compass,
    Delete,
    CopyDocument,
    Download,
    FullScreen,
    FolderChecked,
    List,
  } from '@element-plus/icons-vue'
  import MonacoEditor from 'monaco-editor-vue3'
  import { debounce } from 'lodash'
  import {
    jsonViewSavedService,
    type SavedJsonRecord,
  } from './jsonViewSavedService'

  // 响应式数据
  const theme = ref('dark')
  const fontSize = ref('12')
  const activeTab = ref('convert')
  const inputEditorRef = ref(null)
  const resultEditorRef = ref(null)

  const isShowJsonStatus = ref(true)
  const savedListVisible = ref(false)
  const savedJsonList = ref<SavedJsonRecord[]>([])
  const savingJson = ref(false)
  const activeSavedRecord = ref<{ id: string | number; name: string } | null>(null)

  /* 子组件调用 */
  // 所有逻辑集中在最顶层处理 接受父组件的provide方法
  const parentProvide: any = inject('parentProvide')

  watch(
    () => parentProvide.provideIsCollapse,
    (newVal, oldVal) => {
      console.log(newVal.value, oldVal)
      setTimeout(() => {
        newVal.value && initWidths()
      }, 300)
    },
    {
      deep: true,
    }
  )

  // 获取输入内容的函数
  const getInputContent = (): string => {
    if (
      inputEditorRef.value &&
      inputEditorRef.value.editor &&
      typeof inputEditorRef.value.editor.getValue === 'function'
    ) {
      return inputEditorRef.value.editor.getValue()
    }
    return ''
  }

  // 设置输入内容的函数
  const setInputContent = (content: string) => {
    if (
      inputEditorRef.value &&
      inputEditorRef.value.editor &&
      typeof inputEditorRef.value.editor.setValue === 'function'
    ) {
      inputEditorRef.value.editor.setValue(content)
    }
  }

  // 设置结果内容的函数
  const setResultContent = (content: string) => {
    // console.log("setResultContent called with:", content);
    // console.log("resultEditorRef.value:", resultEditorRef.value);

    if (
      resultEditorRef.value &&
      resultEditorRef.value.editor &&
      typeof resultEditorRef.value.editor.setValue === 'function'
    ) {
      // console.log("Setting editor value...");
      resultEditorRef.value.editor.setValue(content)
      // console.log("Editor value set successfully");
    } else {
      // console.log("Editor not ready yet");
    }
  }

  // 获取结果内容的函数
  const getResultContent = (): string => {
    if (
      resultEditorRef.value &&
      resultEditorRef.value.editor &&
      typeof resultEditorRef.value.editor.getValue === 'function'
    ) {
      return resultEditorRef.value.editor.getValue()
    }
    return ''
  }

  // JSON状态
  const jsonStatus = ref<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)

  // Monaco编辑器主题
  const monacoTheme = computed(() => (theme.value === 'dark' ? 'vs-dark' : 'vs'))

  // 编辑器配置
  const editorOptions = computed(() => ({
    minimap: { enabled: false },
    fontSize: Number(fontSize.value),
    lineNumbers: 'on',
    scrollBeyondLastLine: true,
    wordWrap: 'on',
    automaticLayout: true,
    folding: true,
    renderWhitespace: 'selection',
    tabSize: 2,
    // 滚动配置
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 14,
      horizontalScrollbarSize: 14,
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
    },
    // 禁用 worker 和语言服务以避免错误
    worker: null,
    language: 'plaintext',
    // 禁用语法高亮和验证
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    wordBasedSuggestions: false,
    parameterHints: { enabled: false },
    hover: { enabled: false },
    links: false,
    colorDecorators: false,
    lightbulb: { enabled: false },
    codeActionsOnSave: {},
    codeActionsOnSaveTimeout: 750,
    formatOnSave: false,
    formatOnPaste: false,
    formatOnType: false,
    suggest: { showKeywords: false },
    validation: { enabled: false },
    semanticValidation: false,
    syntaxValidation: false,
  }))

  const resultEditorOptions = computed(() => ({
    ...editorOptions.value,
    readOnly: true,
    scrollBeyondLastLine: false,
  }))

  // 示例JSON
  const sampleJson = `{
  "title": "JSON-DEMO",
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com",
  "hobbies": ["读书", "游泳", "编程"],
  "address": {
    "city": "北京",
    "street": "朝阳区",
    "zipCode": "100000"
  },
  "isActive": true,
  "score": 95.5
}`

  // 方法
  const validateJsonInput = () => {
    const content = getInputContent()
    if (!content.trim()) {
      jsonStatus.value = null
      return
    }

    let isAllow = true
    try {
      JSON.parse(content)
      jsonStatus.value = { type: 'success', message: '有效JSON' }
      isAllow = true
    } catch (error) {
      jsonStatus.value = { type: 'error', message: '无效JSON' }
      isAllow = false
    }
    return isAllow
  }

  const formatJson = () => {
    try {
      const content = getInputContent()
      const parsed = JSON.parse(content)
      const formatted = JSON.stringify(parsed, null, 2)
      // setInputContent(formatted);
      setResultContent(formatted)
      // ElMessage.success("JSON格式化成功");
    } catch (error) {
      ElMessage.error('JSON格式错误，无法格式化')
    }
  }

  const compressJson = () => {
    try {
      const content = getInputContent()
      const parsed = JSON.parse(content)
      setResultContent(JSON.stringify(parsed))
      ElMessage.success('JSON压缩成功')
    } catch (error) {
      ElMessage.error('JSON格式错误，无法压缩')
    }
  }

  const clearJson = () => {
    setInputContent('')
    setResultContent('')
    jsonStatus.value = null
    activeSavedRecord.value = null
    ElMessage.info('已清空')
  }

  const restoreDefaultJson = () => {
    setInputContent(sampleJson)
    formatJson()
    validateJsonInput()
    activeSavedRecord.value = null
    ElMessage.info('已恢复默认 JSON')
  }

  const copyJson = async () => {
    try {
      const content = getInputContent()
      await navigator.clipboard.writeText(content)
      ElMessage.success('已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  const copyResult = async () => {
    try {
      const content = getResultContent()
      await navigator.clipboard.writeText(content)
      ElMessage.success('结果已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  const downloadJson = () => {
    const content = getInputContent()
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('文件下载成功')
  }

  async function refreshSavedJsonList() {
    savedJsonList.value = await jsonViewSavedService.readAll()
    savedJsonList.value.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }

  function formatSavedTime(timestamp: number) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  async function toggleSavedList() {
    savedListVisible.value = !savedListVisible.value
    if (savedListVisible.value) {
      await refreshSavedJsonList()
    }
  }

  async function saveJsonToLocal() {
    const content = getInputContent().trim()
    if (!content) {
      ElMessage.warning('请输入要保存的 JSON')
      return
    }

    try {
      JSON.parse(content)
    } catch {
      ElMessage.warning('当前内容不是有效 JSON，请先修正后再保存')
      return
    }

    const defaultName = `JSON ${formatSavedTime(Date.now())}`
    let name = defaultName
    try {
      const { value } = await ElMessageBox.prompt('请输入保存名称', '保存 JSON', {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputValue: defaultName,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      })
      name = String(value || '').trim() || defaultName
    } catch {
      return
    }

    savingJson.value = true
    try {
      const now = Date.now()
      await jsonViewSavedService.create({
        name,
        content,
        createdAt: now,
        updatedAt: now,
      })
      await refreshSavedJsonList()
      savedListVisible.value = true
      ElMessage.success('已保存到本地')
    } catch (error) {
      console.error('[jsonView] 保存失败:', error)
      ElMessage.error('保存失败')
    } finally {
      savingJson.value = false
    }
  }

  function loadSavedJson(item: SavedJsonRecord) {
    activeSavedRecord.value = { id: item.id, name: item.name }
    try {
      const parsed = JSON.parse(item.content)
      const formatted = JSON.stringify(parsed, null, 2)
      setInputContent(formatted)
      setResultContent(isShowJsonStatus.value ? formatted : '')
      jsonStatus.value = { type: 'success', message: '有效JSON' }
      ElMessage.success(`已加载：${item.name}`)
    } catch {
      setInputContent(item.content)
      setResultContent('')
      jsonStatus.value = { type: 'error', message: '无效JSON' }
      ElMessage.warning(`已加载：${item.name}（内容无法格式化）`)
    }
  }

  async function deleteSavedJson(item: SavedJsonRecord) {
    try {
      await ElMessageBox.confirm(`确定删除「${item.name}」吗？`, '删除记录', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }

    try {
      await jsonViewSavedService.remove(item.id)
      if (activeSavedRecord.value?.id === item.id) {
        activeSavedRecord.value = null
      }
      await refreshSavedJsonList()
      ElMessage.success('已删除')
    } catch (error) {
      console.error('[jsonView] 删除失败:', error)
      ElMessage.error('删除失败')
    }
  }

  // 转换方法
  const convertToXml = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const xml = jsonToXml(json, 'root')
      setResultContent(xml)
      ElMessage.success('JSON转XML成功')
    } catch (error) {
      ElMessage.error('转换失败')
    }
  }

  const convertToYaml = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const yaml = jsonToYaml(json)
      setResultContent(yaml)
      ElMessage.success('JSON转YAML成功')
    } catch (error) {
      ElMessage.error('转换失败')
    }
  }

  const convertToCsv = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const csv = jsonToCsv(json)
      setResultContent(csv)
      ElMessage.success('JSON转CSV成功')
    } catch (error) {
      ElMessage.error('转换失败')
    }
  }

  const convertToSql = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const sql = jsonToSql(json)
      setResultContent(sql)
      ElMessage.success('JSON转SQL成功')
    } catch (error) {
      ElMessage.error('转换失败')
    }
  }

  const convertToJava = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const java = jsonToJava(json)
      setResultContent(java)
      ElMessage.success('JSON转Java成功')
    } catch (error) {
      ElMessage.error('转换失败')
    }
  }

  const convertToTypeScript = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const typescript = jsonToTypeScript(json)
      setResultContent(typescript)
      ElMessage.success('JSON转TypeScript成功')
    } catch (error) {
      ElMessage.error('转换失败')
    }
  }

  // 解析方法
  const parseFromXml = () => {
    try {
      const content = getInputContent()
      const json = xmlToJson(content)
      setResultContent(JSON.stringify(json, null, 2))
      ElMessage.success('XML转JSON成功')
    } catch (error) {
      ElMessage.error('解析失败')
    }
  }

  const parseFromYaml = () => {
    try {
      const content = getInputContent()
      const json = yamlToJson(content)
      setResultContent(JSON.stringify(json, null, 2))
      ElMessage.success('YAML转JSON成功')
    } catch (error) {
      ElMessage.error('解析失败')
    }
  }

  const parseFromCsv = () => {
    try {
      const content = getInputContent()
      const json = csvToJson(content)
      setResultContent(JSON.stringify(json, null, 2))
      ElMessage.success('CSV转JSON成功')
    } catch (error) {
      ElMessage.error('解析失败')
    }
  }

  const parseFromUrl = () => {
    try {
      const content = getInputContent()
      const params = new URLSearchParams(content)
      const json: any = {}
      params.forEach((value, key) => {
        json[key] = value
      })
      setResultContent(JSON.stringify(json, null, 2))
      ElMessage.success('URL参数转JSON成功')
    } catch (error) {
      ElMessage.error('解析失败')
    }
  }

  // 工具方法
  const sortJson = () => {
    try {
      const content = getInputContent()
      const json = JSON.parse(content)
      const sorted = sortObjectKeys(json)
      setResultContent(JSON.stringify(sorted, null, 2))
      ElMessage.success('JSON排序成功')
    } catch (error) {
      ElMessage.error('排序失败')
    }
  }

  const escapeJson = () => {
    const content = getInputContent()
    setResultContent(JSON.stringify(content))
    ElMessage.success('JSON转义成功')
  }

  const unescapeJson = () => {
    try {
      const content = getInputContent()
      const unescaped = JSON.parse(content)
      setResultContent(unescaped)
      ElMessage.success('JSON反转义成功')
    } catch (error) {
      ElMessage.error('反转义失败')
    }
  }

  const validateJson = () => {
    try {
      const content = getInputContent()
      JSON.parse(content)
      ElMessage.success('JSON格式有效')
    } catch (error) {
      ElMessage.error('JSON格式无效')
    }
  }

  const generateRandomJson = () => {
    const randomJson = {
      id: Math.floor(Math.random() * 1000),
      name: `用户${Math.floor(Math.random() * 100)}`,
      email: `user${Math.floor(Math.random() * 100)}@example.com`,
      age: Math.floor(Math.random() * 50) + 18,
      isActive: Math.random() > 0.5,
      tags: ['tag1', 'tag2', 'tag3'].slice(0, Math.floor(Math.random() * 3) + 1),
      metadata: {
        createdAt: new Date().toISOString(),
        version: Math.random().toFixed(2),
      },
    }
    const jsonString = JSON.stringify(randomJson, null, 2)
    setInputContent(jsonString)
    ElMessage.success('随机JSON生成成功')
  }

  // 转换函数实现
  const jsonToXml = (obj: any, rootName: string): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`

    const addNode = (obj: any, indent: string = '  ') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          xml += `${indent}<${key}>\n`
          addNode(value, indent + '  ')
          xml += `${indent}</${key}>\n`
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            xml += `${indent}<${key}>\n`
            if (typeof item === 'object' && item !== null) {
              addNode(item, indent + '  ')
            } else {
              xml += `${indent}  ${item}\n`
            }
            xml += `${indent}</${key}>\n`
          })
        } else {
          xml += `${indent}<${key}>${value}</${key}>\n`
        }
      }
    }

    addNode(obj)
    xml += `</${rootName}>`
    return xml
  }

  const jsonToYaml = (obj: any, indent: string = ''): string => {
    let yaml = ''

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${indent}${key}:\n`
        yaml += jsonToYaml(value, indent + '  ')
      } else if (Array.isArray(value)) {
        yaml += `${indent}${key}:\n`
        value.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            yaml += `${indent}  -\n`
            yaml += jsonToYaml(item, indent + '    ')
          } else {
            yaml += `${indent}  - ${item}\n`
          }
        })
      } else {
        yaml += `${indent}${key}: ${value}\n`
      }
    }

    return yaml
  }

  const jsonToCsv = (obj: any): string => {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return ''

      const headers = Object.keys(obj[0])
      let csv = headers.join(',') + '\n'

      obj.forEach(item => {
        const row = headers.map(header => {
          const value = item[header]
          return typeof value === 'string' ? `"${value}"` : value
        })
        csv += row.join(',') + '\n'
      })

      return csv
    }

    return Object.entries(obj)
      .map(([key, value]) => `${key},${value}`)
      .join('\n')
  }

  const jsonToSql = (obj: any): string => {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return ''

      const tableName = 'data_table'
      const columns = Object.keys(obj[0])
      let sql = `CREATE TABLE ${tableName} (\n`
      sql += columns.map(col => `  ${col} VARCHAR(255)`).join(',\n')
      sql += '\n);\n\n'

      obj.forEach(item => {
        const values = columns.map(col => `'${item[col]}'`)
        sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
      })

      return sql
    }

    return '-- 单个对象无法生成SQL表结构'
  }

  const jsonToJava = (obj: any, className: string = 'DataClass'): string => {
    let java = `public class ${className} {\n`

    for (const [key, value] of Object.entries(obj)) {
      const type = getJavaType(value)
      const fieldName = key.charAt(0).toLowerCase() + key.slice(1)
      java += `    private ${type} ${fieldName};\n`
    }

    java += '\n    // Getters and Setters\n'

    for (const [key, value] of Object.entries(obj)) {
      const type = getJavaType(value)
      const fieldName = key.charAt(0).toLowerCase() + key.slice(1)
      const methodName = key.charAt(0).toUpperCase() + key.slice(1)

      java += `    public ${type} get${methodName}() {\n`
      java += `        return ${fieldName};\n`
      java += `    }\n\n`

      java += `    public void set${methodName}(${type} ${fieldName}) {\n`
      java += `        this.${fieldName} = ${fieldName};\n`
      java += `    }\n\n`
    }

    java += '}'
    return java
  }

  const jsonToTypeScript = (obj: any, interfaceName: string = 'DataInterface'): string => {
    let typescript = `interface ${interfaceName} {\n`

    for (const [key, value] of Object.entries(obj)) {
      const type = getTypeScriptType(value)
      typescript += `  ${key}: ${type};\n`
    }

    typescript += '}'
    return typescript
  }

  // 辅助函数
  const getJavaType = (value: any): string => {
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'List<Object>'
    if (typeof value === 'object' && value !== null) return 'Object'
    return 'Object'
  }

  const getTypeScriptType = (value: any): string => {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'any[]'
    if (typeof value === 'object' && value !== null) return 'object'
    return 'any'
  }

  const sortObjectKeys = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj

    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys)
    }

    const sorted: any = {}
    Object.keys(obj)
      .sort()
      .forEach(key => {
        sorted[key] = sortObjectKeys(obj[key])
      })

    return sorted
  }

  // 解析函数实现（简化版）
  const xmlToJson = (xml: string): any => {
    // 简化实现，实际项目中建议使用专门的XML解析库
    return { message: 'XML解析功能需要专门的解析库' }
  }

  const yamlToJson = (yaml: string): any => {
    // 简化实现，实际项目中建议使用js-yaml等库
    return { message: 'YAML解析功能需要专门的解析库' }
  }

  const csvToJson = (csv: string): any => {
    const lines = csv.trim().split('\n')
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const result = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      result.push(obj)
    }

    return result
  }

  // 拖拽相关
  const mainContentRef = ref<HTMLElement | null>(null)
  const leftWidth = ref(0) // 左侧编辑器宽度
  const rightWidth = ref(0) // 右侧结果编辑器宽度
  const isResizing = ref(false)

  // 初始化宽度
  const initWidths = () => {
    if (mainContentRef.value) {
      const containerWidth = mainContentRef.value.offsetWidth - 56 // 减去padding和分隔线宽度
      leftWidth.value = Math.floor(containerWidth / 2)
      rightWidth.value = containerWidth - leftWidth.value
    }
  }

  // 防抖的初始化宽度函数
  const debouncedInitWidths = debounce(initWidths, 100)

  // 全屏编辑相关
  const showFullEditor = ref(false)
  const fullEditorContent = ref('')
  const fullEditorRef = ref(null)
  const fullEditorTarget = ref('') // 'input' or 'result'
  const isFullType = ref('result')

  const openFullEditor = (target: string) => {
    let content = ''

    // 记录是input还是result
    isFullType.value = target

    if (target === 'input') {
      content = getInputContent()
      console.log('Input content:', content)
    } else {
      content = getResultContent()
      console.log('Result content:', content)
    }

    fullEditorContent.value = content
    fullEditorTarget.value = target
    showFullEditor.value = true

    // 等待全屏编辑器初始化完成
    const waitForFullEditor = () => {
      if (
        fullEditorRef.value &&
        fullEditorRef.value.editor &&
        typeof fullEditorRef.value.editor.setValue === 'function'
      ) {
        console.log('Setting full editor content:', content)
        fullEditorRef.value.editor.setValue(content)
        fullEditorRef.value.editor.focus()
      } else {
        console.log('Full editor not ready, retrying...')
        setTimeout(waitForFullEditor, 100)
      }
    }

    nextTick(() => {
      waitForFullEditor()
    })
  }

  const saveFullEditor = () => {
    if (fullEditorRef.value && fullEditorRef.value.editor) {
      const nowFullContent = fullEditorRef.value.editor.getValue()

      if (fullEditorTarget.value === 'input') {
        setInputContent(nowFullContent)
        // 如果是输入编辑器，保存后自动格式化
        validateJsonInput()
      } else {
        setResultContent(nowFullContent)
      }
    }
    showFullEditor.value = false
  }

  const cancelFullEditor = () => {
    showFullEditor.value = false
  }

  const startResize = (event: MouseEvent) => {
    event.preventDefault()
    isResizing.value = true
    const initialX = event.clientX
    const initialLeftWidth = leftWidth.value
    const containerWidth = mainContentRef.value!.offsetWidth - 56 // 减去padding和分隔线宽度

    const updateSize = (event: MouseEvent) => {
      const deltaX = event.clientX - initialX
      const newLeftWidth = Math.max(100, Math.min(containerWidth - 100, initialLeftWidth + deltaX)) // 限制最小和最大宽度
      leftWidth.value = newLeftWidth
      rightWidth.value = containerWidth - newLeftWidth
    }

    const stopResize = () => {
      isResizing.value = false
      document.removeEventListener('mousemove', updateSize)
      document.removeEventListener('mouseup', stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    // 设置全局样式
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', updateSize)
    document.addEventListener('mouseup', stopResize)
  }

  // 初始化
  onMounted(() => {
    // 初始化宽度
    nextTick(() => {
      initWidths()
    })

    // 监听窗口大小变化（防抖）
    window.addEventListener('resize', debouncedInitWidths)

    // 等待编辑器初始化完成
    const waitForEditors = () => {
      if (
        inputEditorRef.value &&
        inputEditorRef.value.editor &&
        typeof inputEditorRef.value.editor.setValue === 'function' &&
        resultEditorRef.value &&
        resultEditorRef.value.editor &&
        typeof resultEditorRef.value.editor.setValue === 'function'
      ) {
        // console.log("Editors are ready, setting initial content");
        setInputContent(sampleJson)
        // setResultContent(sampleJson);
        formatJson()
        validateJsonInput()

        // 添加原生 Monaco Editor 事件监听
        setupEditorEvents()
      } else {
        console.log('Editors not ready, retrying...')
        setTimeout(waitForEditors, 100)
      }
    }

    waitForEditors()
  })

  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('resize', debouncedInitWidths)
  })

  // 设置编辑器事件监听
  const setupEditorEvents = () => {
    if (inputEditorRef.value && inputEditorRef.value.editor) {
      const editor = inputEditorRef.value.editor

      // 监听失焦事件
      editor.onDidBlurEditorWidget(() => {
        // console.log("Editor blur event triggered");
      })

      // 监听获得焦点事件
      editor.onDidFocusEditorWidget(() => {
        // console.log("Editor focus event triggered");
      })

      const debouncedContentChange = () => {
        // console.log("Content changed (debounced)");
        // 内容改变时进行验证
        const isAllow = validateJsonInput()
        // 是合法json，并且开启了自动转换开关
        if (isAllow && isShowJsonStatus.value) {
          formatJson()
        }
      }
      editor.onDidChangeModelContent(() => {
        debouncedContentChange()
      })
    }
  }
</script>

<style lang="scss" scoped>
  .json-view-container {
    --json-bg: #121212;
    --json-bg-elevated: #1a1a1a;
    --json-bg-panel: #1e1e1e;
    --json-border: #2e2e2e;
    --json-text: #e0e0e0;
    --json-text-muted: #bdbdbd;
    --json-accent: #90caf9;
    --json-hover: #252525;
    --json-radius: 8px;
    --json-radius-sm: 6px;
    --json-transition: 0.18s ease;

    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--json-bg);
    color: var(--json-text);
    border-radius: var(--json-radius);
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: var(--json-bg-elevated);
    border-bottom: 1px solid var(--json-border);
    flex-shrink: 0;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    :deep(.el-button-group) {
      .el-button {
        background: var(--json-hover);
        border-color: var(--json-border);
        color: var(--json-text-muted);
        border-radius: 0;
        transition:
          background var(--json-transition),
          color var(--json-transition),
          border-color var(--json-transition);

        &:first-child {
          border-radius: var(--json-radius-sm) 0 0 var(--json-radius-sm);
        }

        &:last-child {
          border-radius: 0 var(--json-radius-sm) var(--json-radius-sm) 0;
        }

        &:hover {
          background: #2a2a2a;
          color: var(--json-text);
          border-color: #3a3a3a;
        }
      }
    }

    :deep(.el-select) {
      .el-select__wrapper {
        background: var(--json-hover);
        box-shadow: none;
        border-radius: var(--json-radius-sm);

        &:hover,
        &.is-focus {
          background: #2a2a2a;
          box-shadow: none;
        }
      }
    }

    :deep(.el-button) {
      background: var(--json-hover);
      border-color: var(--json-border);
      color: var(--json-text-muted);
      border-radius: var(--json-radius-sm);

      &:hover {
        background: #2a2a2a;
        color: var(--json-text);
      }

      &.el-button--primary {
        background: #1e3a5f;
        border-color: #2563eb;
        color: #90caf9;
      }
    }
  }

  .saved-json-panel {
    flex-shrink: 0;
    max-height: 180px;
    overflow: auto;
    padding: 8px 14px;
    background: var(--json-bg-elevated);
    border-bottom: 1px solid var(--json-border);
  }

  .saved-json-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .saved-json-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid var(--json-border);
    border-radius: var(--json-radius-sm);
    background: var(--json-bg-panel);
    cursor: pointer;
    transition: background var(--json-transition), border-color var(--json-transition);

    &:hover {
      background: var(--json-hover);
      border-color: #3a3a3a;
    }

    &--active {
      background: rgba(37, 99, 235, 0.12);
      border-color: #2563eb;

      .saved-json-item__name {
        color: #90caf9;
      }
    }
  }

  .saved-json-item__main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .saved-json-item__name {
    font-size: 13px;
    color: var(--json-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .saved-json-item__time {
    font-size: 11px;
    color: var(--json-text-muted);
  }

  .saved-json-item__delete {
    flex-shrink: 0;
  }

  .main-content {
    flex: 1;
    display: flex;
    padding: 10px 12px;
    min-height: 0;
    gap: 0;
    background: var(--json-bg);
  }

  .editor-section,
  .result-section {
    background: var(--json-bg-elevated);
    border-radius: var(--json-radius);
    border: 1px solid var(--json-border);
    overflow: hidden;
    min-width: 100px;
    display: flex;
    flex-direction: column;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--json-border);
    background: var(--json-bg-panel);
    flex-shrink: 0;

    .section-header-title {
      margin-right: 10px;
    }

    .section-header-record {
      max-width: 180px;
      margin-right: 10px;
      padding: 2px 8px;
      font-size: 12px;
      color: #90caf9;
      background: rgba(37, 99, 235, 0.12);
      border: 1px solid rgba(37, 99, 235, 0.35);
      border-radius: var(--json-radius-sm);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .section-header-switch {
      .section-header-switch-text {
        font-size: 12px;
        margin-right: 6px;
        color: var(--json-text-muted);
      }
    }

    .section-header-right {
      gap: 8px;
    }

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #f0f0f0;
    }

    :deep(.el-button) {
      background: var(--json-hover);
      border-color: var(--json-border);
      color: var(--json-text-muted);
      border-radius: var(--json-radius-sm);

      &:hover {
        background: #2a2a2a;
        color: var(--json-text);
      }
    }
  }

  .editor-container,
  .result-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;
    background: var(--json-bg-panel);
  }

  .editor-full-btn {
    position: absolute;
    top: 8px;
    right: 22px;
    z-index: 2;
    opacity: 0.65;
    background: var(--json-hover) !important;
    border-color: var(--json-border) !important;
    color: var(--json-text-muted) !important;
    transition: opacity var(--json-transition);

    &:hover {
      opacity: 1;
      color: var(--json-accent) !important;
      background: #2a2a2a !important;
    }
  }

  .resizer {
    width: 6px;
    background: var(--json-border);
    cursor: col-resize;
    user-select: none;
    transition: background var(--json-transition);
    position: relative;
    margin: 0 8px;
    border-radius: 3px;
    flex-shrink: 0;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 24px;
      background-color: #555;
      border-radius: 1px;
      transition: background-color var(--json-transition);
    }

    &:hover,
    &.resizing {
      background: #3a3a3a;

      &::before {
        background-color: var(--json-accent);
      }
    }
  }

  .tools-panel {
    border-top: 1px solid var(--json-border);
    background: var(--json-bg-elevated);
    flex-shrink: 0;

    .convert-tools,
    .parse-tools,
    .json-tools {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      :deep(.el-button) {
        background: var(--json-hover);
        border-color: var(--json-border);
        color: var(--json-text-muted);
        border-radius: var(--json-radius-sm);
        margin: 0;
        transition:
          background var(--json-transition),
          color var(--json-transition),
          border-color var(--json-transition),
          transform 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

        &:hover {
          background: #2a2a2a;
          color: var(--json-accent);
          border-color: #3a3a3a;
          transform: translateY(-2px);
        }
      }
    }
  }

  :deep(.el-tabs) {
    padding: 8px 14px 0;

    .el-tabs__header {
      margin: 0;
      border-bottom: 1px solid var(--json-border);
    }

    .el-tabs__nav-wrap::after {
      display: none;
    }

    .el-tabs__item {
      color: var(--json-text-muted);
      border: 1px solid transparent !important;
      border-radius: var(--json-radius-sm) var(--json-radius-sm) 0 0;
      transition:
        color var(--json-transition),
        background var(--json-transition);

      &:hover {
        color: var(--json-accent);
      }

      &.is-active {
        color: var(--json-accent);
        background: var(--json-bg-panel);
        border-color: var(--json-border) !important;
        border-bottom-color: var(--json-bg-panel) !important;
      }
    }

    .el-tabs__content {
      padding: 0 0 12px;
    }
  }

  :deep(.monaco-editor) {
    border-radius: 0 0 var(--json-radius-sm) var(--json-radius-sm);

    .monaco-scrollable-element {
      overflow: auto !important;
    }

    .monaco-scrollable-element .scrollbar {
      background-color: transparent !important;
    }

    .monaco-scrollable-element .slider {
      background-color: rgba(255, 255, 255, 0.2) !important;
      border-radius: 4px;
    }

    .monaco-editor .margin-view-overlays .cgmr {
      background-color: transparent !important;
    }

    .monaco-editor .margin-view-overlays .folding {
      background-color: transparent !important;
    }

    .monaco-editor .margin-view-overlays .margin-view-zones {
      width: 20px !important;
    }
  }

  :deep(.json-full-dialog) {
    .el-dialog {
      background: var(--json-bg-elevated);
      border: 1px solid var(--json-border);
    }

    .el-dialog__header {
      border-bottom: 1px solid var(--json-border);
      padding: 14px 20px;
    }

    .el-dialog__title {
      font-weight: 600;
      color: #f0f0f0;
      font-size: 15px;
    }

    .el-dialog__footer {
      border-top: 1px solid var(--json-border);
    }

    .dislog-monacoEditor-full {
      height: calc(100vh - 170px);

      .fullEditorRef {
        height: 100%;
      }
    }

    .black-btn {
      border-radius: var(--json-radius-sm) !important;
    }
  }
</style>
