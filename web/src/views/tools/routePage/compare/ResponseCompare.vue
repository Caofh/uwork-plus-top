<template>
  <div class="response-compare">
    <!-- 工具栏 -->
    <!-- <div class="toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button @click="formatBothJson" :icon="MagicStick">格式化</el-button>
          <el-button @click="clearBothJson" :icon="Delete">清空</el-button>
          <el-button @click="compareJson" :icon="Search">比对</el-button>
        </el-button-group>

        <el-button-group style="margin-left: 10px">
          <el-button @click="copyLeftJson" :icon="CopyDocument">复制左侧</el-button>
          <el-button @click="copyRightJson" :icon="CopyDocument">复制右侧</el-button>
        </el-button-group>

        <el-button-group style="margin-left: 10px">
          <el-button @click="swapJson" :icon="Switch">交换</el-button>
          <el-button @click="loadSampleData" :icon="DocumentAdd">示例数据</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-select v-model="theme" placeholder="选择主题" style="width: 120px">
          <el-option label="浅色" value="light" />
          <el-option label="深色" value="dark" />
        </el-select>

        <el-select v-model="fontSize" placeholder="字体大小" style="width: 100px; margin-left: 10px">
          <el-option label="12px" value="12" />
          <el-option label="14px" value="14" />
          <el-option label="16px" value="16" />
          <el-option label="18px" value="18" />
        </el-select>

        <el-switch v-model="syncScroll" style="margin-left: 10px" active-text="同步滚动" />
        <el-switch v-model="showDiffList" style="margin-left: 10px" active-text="显示差异列表" />
      </div>
    </div> -->

    <!-- 差异统计信息 -->
    <div v-if="diffStats" class="diff-stats">
      <el-tag type="success" size="small">
        <el-icon><Check /></el-icon>
        相同: {{ diffStats.same }}
      </el-tag>
      <el-tag type="warning" size="small" style="margin-left: 10px">
        <el-icon><Edit /></el-icon>
        修改: {{ diffStats.modified }}
      </el-tag>
      <el-tag type="info" size="small" style="margin-left: 10px">
        <el-icon><Plus /></el-icon>
        新增: {{ diffStats.added }}
      </el-tag>
      <el-tag type="danger" size="small" style="margin-left: 10px">
        <el-icon><Minus /></el-icon>
        删除: {{ diffStats.deleted }}
      </el-tag>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content" ref="mainContentRef">
      <!-- 左侧JSON编辑器 -->
      <div class="editor-section" :style="{ width: leftWidth + 'px' }">
        <div class="section-header">
          <div class="c-flex-x-start">
            <h3 class="section-header-title">JSON 1</h3>
            <el-tag v-if="leftJsonStatus" :type="leftJsonStatus.type" size="small" style="margin-left: 10px">
              {{ leftJsonStatus.message }}
            </el-tag>
          </div>
          <div class="section-header-actions">
            <el-button size="small" @click="formatLeftJson">格式化</el-button>
          </div>
        </div>
        <div class="editor-container">
          <MonacoEditor
            ref="leftEditorRef"
            language="json"
            :theme="monacoTheme"
            :options="leftEditorOptions"
            @change="onLeftEditorChange"
            @editorDidMount="onLeftEditorMount"
          />
        </div>
      </div>

      <!-- 可拖拽分隔线 -->
      <div class="resizer" @mousedown="startResize" :class="{ resizing: isResizing }"></div>

      <!-- 右侧JSON编辑器 -->
      <div class="editor-section" :style="{ width: rightWidth + 'px' }">
        <div class="section-header">
          <div class="c-flex-x-start">
            <h3 class="section-header-title">JSON 2</h3>
            <el-tag v-if="rightJsonStatus" :type="rightJsonStatus.type" size="small" style="margin-left: 10px">
              {{ rightJsonStatus.message }}
            </el-tag>
          </div>
          <div class="section-header-actions">
            <el-button size="small" @click="formatRightJson">格式化</el-button>
          </div>
        </div>
        <div class="editor-container">
          <MonacoEditor
            ref="rightEditorRef"
            language="json"
            :theme="monacoTheme"
            :options="rightEditorOptions"
            @change="onRightEditorChange"
            @editorDidMount="onRightEditorMount"
          />
        </div>
      </div>
    </div>

    <!-- 差异列表展示 -->
    <el-collapse-transition>
      <div v-show="showDiffList && diffList.length > 0" class="diff-list-container">
        <div class="diff-list-header">
          <h3 class="diff-list-title">
            <el-icon><List /></el-icon>
            差异列表 (共 {{ filteredDiffList.length }} 项)
            <span v-if="diffFilter !== 'all'" class="diff-filter-hint">
              / 总计 {{ diffList.length }} 项
            </span>
          </h3>
          <div class="diff-list-actions">
            <el-radio-group v-model="diffFilter" size="small" style="margin-right: 12px">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="added">
                <el-icon><Plus /></el-icon>
                新增 ({{ getDiffCountByType('added') }})
              </el-radio-button>
              <el-radio-button value="modified">
                <el-icon><Edit /></el-icon>
                修改 ({{ getDiffCountByType('modified') }})
              </el-radio-button>
              <el-radio-button value="deleted">
                <el-icon><Minus /></el-icon>
                删除 ({{ getDiffCountByType('deleted') }})
              </el-radio-button>
            </el-radio-group>
            <el-button size="small" @click="exportDiffList">
              <el-icon><Download /></el-icon>
              导出差异
            </el-button>
            <el-button size="small" @click="copyDiffList">
              <el-icon><CopyDocument /></el-icon>
              复制差异
            </el-button>
          </div>
        </div>
        <div class="diff-list-content">
          <el-empty v-if="filteredDiffList.length === 0" description="没有匹配的差异项" />
          <el-table v-else :data="filteredDiffList" style="width: 100%" stripe>
            <el-table-column prop="type" label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.type === 'added' ? 'success' : row.type === 'deleted' ? 'danger' : 'warning'"
                  size="small"
                >
                  <el-icon style="margin-right: 4px">
                    <Plus v-if="row.type === 'added'" />
                    <Minus v-else-if="row.type === 'deleted'" />
                    <Edit v-else />
                  </el-icon>
                  {{ row.type === 'added' ? '新增' : row.type === 'deleted' ? '删除' : '修改' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="path" label="路径" min-width="200">
              <template #default="{ row }">
                <code class="diff-path">{{ row.path || '(根)' }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="oldValue" label="旧值" min-width="250">
              <template #default="{ row }">
                <div v-if="row.type !== 'added'" class="diff-value old-value">
                  <pre>{{ formatDiffValue(row.oldValue) }}</pre>
                </div>
                <span v-else class="diff-empty">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="newValue" label="新值" min-width="250">
              <template #default="{ row }">
                <div v-if="row.type !== 'deleted'" class="diff-value new-value">
                  <pre>{{ formatDiffValue(row.newValue) }}</pre>
                </div>
                <span v-else class="diff-empty">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row, $index }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="scrollToDiff(row, $index)"
                >
                  <el-icon><Position /></el-icon>
                  定位
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    MagicStick,
    Delete,
    CopyDocument,
    Search,
    Switch,
    DocumentAdd,
    Check,
    Edit,
    Plus,
    Minus,
    List,
    Download,
    Position,
  } from '@element-plus/icons-vue'
  import MonacoEditor from 'monaco-editor-vue3'
  import { debounce } from 'lodash'

  // Props
  const props = defineProps({
    initialLeftJson: {
      type: String,
      default: '',
    },
    initialRightJson: {
      type: String,
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  })

  // Emits
  const emit = defineEmits(['update:leftJson', 'update:rightJson'])

  // 响应式数据
  const theme = ref('dark')
  const fontSize = ref('14')
  const leftEditorRef = ref(null)
  const rightEditorRef = ref(null)
  const mainContentRef = ref(null)
  const syncScroll = ref(true)
  const showDiffList = ref(true)
  const diffFilter = ref('all') // 过滤条件：all, added, modified, deleted

  // 差异列表
  const diffList = ref([])

  // 编辑器实例
  let leftEditor = null
  let rightEditor = null
  let monaco = null

  // JSON状态
  const leftJsonStatus = ref(null)
  const rightJsonStatus = ref(null)
  const diffStats = ref(null)

  // 布局相关
  const leftWidth = ref(0)
  const rightWidth = ref(0)
  const isResizing = ref(false)

  // Monaco编辑器主题
  const monacoTheme = computed(() => (theme.value === 'dark' ? 'vs-dark' : 'vs'))

  // 编辑器配置
  const baseEditorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: true,
    wordWrap: 'on',
    automaticLayout: true,
    folding: true,
    renderWhitespace: 'selection',
    tabSize: 2,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 14,
      horizontalScrollbarSize: 14,
    },
    language: 'json',
    formatOnPaste: true,
    formatOnType: true,
  }

  const leftEditorOptions = computed(() => ({
    ...baseEditorOptions,
    fontSize: Number(fontSize.value),
    theme: monacoTheme.value,
    readOnly: props.readonly,
    renderLineHighlight: 'all',
  }))

  const rightEditorOptions = computed(() => ({
    ...baseEditorOptions,
    fontSize: Number(fontSize.value),
    theme: monacoTheme.value,
    readOnly: props.readonly,
    renderLineHighlight: 'all',
  }))

  // 初始化宽度
  const initWidths = () => {
    if (!mainContentRef.value) return
    const containerWidth = mainContentRef.value.clientWidth
    const resizerWidth = 4
    const halfWidth = (containerWidth - resizerWidth) / 2
    leftWidth.value = halfWidth
    rightWidth.value = halfWidth
  }

  // 调整大小
  const startResize = (e) => {
    isResizing.value = true
    const startX = e.clientX
    const startLeftWidth = leftWidth.value

    const doResize = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const newLeftWidth = Math.max(200, Math.min(800, startLeftWidth + deltaX))
      const containerWidth = mainContentRef.value.clientWidth
      const resizerWidth = 4
      leftWidth.value = newLeftWidth
      rightWidth.value = containerWidth - resizerWidth - newLeftWidth
    }

    const stopResize = () => {
      isResizing.value = false
      document.removeEventListener('mousemove', doResize)
      document.removeEventListener('mouseup', stopResize)
    }

    document.addEventListener('mousemove', doResize)
    document.addEventListener('mouseup', stopResize)
  }

  // 编辑器挂载
  const onLeftEditorMount = (editor) => {
    leftEditor = editor
    // 从编辑器实例获取monaco（如果monaco-editor-vue3支持）
    if (!monaco && editor && window.monaco) {
      monaco = window.monaco
    } else if (!monaco && editor && editor.constructor && editor.constructor.Range) {
      // 尝试从编辑器类获取
      monaco = { Range: editor.constructor.Range }
    }
    setupSyncScroll()
  }

  const onRightEditorMount = (editor) => {
    rightEditor = editor
    // 从编辑器实例获取monaco
    if (!monaco && editor && window.monaco) {
      monaco = window.monaco
    } else if (!monaco && editor && editor.constructor && editor.constructor.Range) {
      // 尝试从编辑器类获取
      monaco = { Range: editor.constructor.Range }
    }
    setupSyncScroll()
  }

  // 同步滚动
  let isScrolling = false
  const setupSyncScroll = () => {
    if (!leftEditor || !rightEditor || !syncScroll.value) return

    leftEditor.onDidScrollChange((e) => {
      if (!isScrolling && syncScroll.value) {
        isScrolling = true
        const scrollTop = e.scrollTop
        const scrollLeft = e.scrollLeft
        rightEditor.setScrollTop(scrollTop)
        rightEditor.setScrollLeft(scrollLeft)
        setTimeout(() => {
          isScrolling = false
        }, 10)
      }
    })

    rightEditor.onDidScrollChange((e) => {
      if (!isScrolling && syncScroll.value) {
        isScrolling = true
        const scrollTop = e.scrollTop
        const scrollLeft = e.scrollLeft
        leftEditor.setScrollTop(scrollTop)
        leftEditor.setScrollLeft(scrollLeft)
        setTimeout(() => {
          isScrolling = false
        }, 10)
      }
    })
  }

  watch(syncScroll, (val) => {
    if (val) {
      setupSyncScroll()
    }
  })

  // 获取编辑器内容
  const getLeftContent = () => {
    return leftEditor?.getValue() || ''
  }

  const getRightContent = () => {
    return rightEditor?.getValue() || ''
  }

  // 设置编辑器内容
  const setLeftContent = (content) => {
    if (leftEditor) {
      leftEditor.setValue(content)
    }
  }

  const setRightContent = (content) => {
    if (rightEditor) {
      rightEditor.setValue(content)
    }
  }

  // 验证JSON
  const validateJson = (content, side) => {
    if (!content.trim()) {
      if (side === 'left') {
        leftJsonStatus.value = null
      } else {
        rightJsonStatus.value = null
      }
      return null
    }

    try {
      JSON.parse(content)
      const status = { type: 'success', message: '有效JSON' }
      if (side === 'left') {
        leftJsonStatus.value = status
      } else {
        rightJsonStatus.value = status
      }
      return true
    } catch (error) {
      const status = { type: 'error', message: '无效JSON' }
      if (side === 'left') {
        leftJsonStatus.value = status
      } else {
        rightJsonStatus.value = status
      }
      return false
    }
  }

  // 编辑器内容变化
  const onLeftEditorChange = debounce(() => {
    const content = getLeftContent()
    validateJson(content, 'left')
    compareJson()
    if (!props.readonly) {
      emit('update:leftJson', content)
    }
  }, 300)

  const onRightEditorChange = debounce(() => {
    const content = getRightContent()
    validateJson(content, 'right')
    compareJson()
    if (!props.readonly) {
      emit('update:rightJson', content)
    }
  }, 300)

  // 格式化JSON
  const formatJson = (content) => {
    try {
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch (error) {
      ElMessage.error('JSON格式错误，无法格式化')
      return content
    }
  }

  const formatLeftJson = () => {
    const content = getLeftContent()
    if (!content.trim()) {
      ElMessage.warning('左侧内容为空')
      return
    }
    const formatted = formatJson(content)
    setLeftContent(formatted)
    ElMessage.success('左侧JSON格式化成功')
  }

  const formatRightJson = () => {
    const content = getRightContent()
    if (!content.trim()) {
      ElMessage.warning('右侧内容为空')
      return
    }
    const formatted = formatJson(content)
    setRightContent(formatted)
    ElMessage.success('右侧JSON格式化成功')
  }

  const formatBothJson = () => {
    formatLeftJson()
    setTimeout(() => {
      formatRightJson()
    }, 100)
  }

  // 清空
  const clearBothJson = () => {
    setLeftContent('')
    setRightContent('')
    leftJsonStatus.value = null
    rightJsonStatus.value = null
    diffStats.value = null
    diffList.value = []
    diffFilter.value = 'all'
    clearDiffDecorations()
    ElMessage.success('已清空')
  }

  // 存储装饰ID
  let leftDecorationIds = []
  let rightDecorationIds = []

  // JSON差异比对
  const clearDiffDecorations = () => {
    if (leftEditor && leftDecorationIds.length > 0) {
      leftEditor.deltaDecorations(leftDecorationIds, [])
      leftDecorationIds = []
    }
    if (rightEditor && rightDecorationIds.length > 0) {
      rightEditor.deltaDecorations(rightDecorationIds, [])
      rightDecorationIds = []
    }
  }

  const compareJson = () => {
    const leftContent = getLeftContent().trim()
    const rightContent = getRightContent().trim()

    if (!leftContent || !rightContent) {
      diffStats.value = null
      diffList.value = []
      clearDiffDecorations()
      return
    }

    // 验证JSON
    let leftJson, rightJson
    try {
      leftJson = JSON.parse(leftContent)
      rightJson = JSON.parse(rightContent)
    } catch (error) {
      diffStats.value = null
      diffList.value = []
      clearDiffDecorations()
      return
    }

    // 执行差异比对
    const diffResult = calculateJsonDiff(leftJson, rightJson)
    diffStats.value = diffResult.stats
    diffList.value = diffResult.differences

    // 高亮差异
    highlightDifferences(diffResult, leftContent, rightContent)
  }

  // 计算JSON差异
  const calculateJsonDiff = (obj1, obj2) => {
    const stats = { same: 0, modified: 0, added: 0, deleted: 0 }
    const differences = []

    const traverse = (oldObj, newObj, path = '') => {
      if (oldObj === null || oldObj === undefined) {
        if (newObj !== null && newObj !== undefined) {
          stats.added++
          differences.push({ path, type: 'added', oldValue: null, newValue: newObj })
        }
        return
      }

      if (newObj === null || newObj === undefined) {
        stats.deleted++
        differences.push({ path, type: 'deleted', oldValue: oldObj, newValue: null })
        return
      }

      if (typeof oldObj !== typeof newObj) {
        stats.modified++
        differences.push({ path, type: 'modified', oldValue: oldObj, newValue: newObj })
        return
      }

      if (typeof oldObj !== 'object' || Array.isArray(oldObj) !== Array.isArray(newObj)) {
        if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
          stats.modified++
          differences.push({ path, type: 'modified', oldValue: oldObj, newValue: newObj })
        } else {
          stats.same++
        }
        return
      }

      if (Array.isArray(oldObj)) {
        // 数组比较
        const maxLength = Math.max(oldObj.length, newObj.length)
        for (let i = 0; i < maxLength; i++) {
          const itemPath = path ? `${path}[${i}]` : `[${i}]`
          if (i >= oldObj.length) {
            stats.added++
            differences.push({ path: itemPath, type: 'added', oldValue: null, newValue: newObj[i] })
          } else if (i >= newObj.length) {
            stats.deleted++
            differences.push({ path: itemPath, type: 'deleted', oldValue: oldObj[i], newValue: null })
          } else {
            traverse(oldObj[i], newObj[i], itemPath)
          }
        }
        return
      }

      // 对象比较
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

      for (const key of allKeys) {
        const itemPath = path ? `${path}.${key}` : key

        if (!(key in oldObj)) {
          stats.added++
          differences.push({ path: itemPath, type: 'added', oldValue: null, newValue: newObj[key] })
        } else if (!(key in newObj)) {
          stats.deleted++
          differences.push({ path: itemPath, type: 'deleted', oldValue: oldObj[key], newValue: null })
        } else {
          traverse(oldObj[key], newObj[key], itemPath)
        }
      }
    }

    traverse(obj1, obj2)

    return { stats, differences }
  }

  // 高亮差异
  const highlightDifferences = (diffResult, leftContent, rightContent) => {
    clearDiffDecorations()

    if (!leftEditor || !rightEditor) return

    // 尝试获取monaco Range类
    let Range = null
    if (window.monaco && window.monaco.Range) {
      Range = window.monaco.Range
    } else if (leftEditor && leftEditor.getModel && leftEditor.getModel().constructor) {
      // 备用方案：从编辑器模型获取
      Range = leftEditor.getModel().constructor.Range
    }

    if (!Range) {
      console.warn('无法获取Monaco Range类，差异高亮可能不可用')
      return
    }

    const leftDecorations = []
    const rightDecorations = []

    // 将JSON内容转换为行数组以便查找
    const leftLines = leftContent.split('\n')
    const rightLines = rightContent.split('\n')

    // 根据差异路径查找对应的行并高亮
    diffResult.differences.forEach((diff) => {
      const { path, type } = diff

      // 查找包含该路径的行
      const leftLineIndex = findLineByPath(leftLines, path, diff.oldValue)
      const rightLineIndex = findLineByPath(rightLines, path, diff.newValue)

      // 左侧装饰（删除或修改）
      if (leftLineIndex !== -1 && (type === 'deleted' || type === 'modified')) {
        const line = leftLines[leftLineIndex]
        try {
          const decoration = {
            range: new Range(leftLineIndex + 1, 1, leftLineIndex + 1, line.length + 1),
            options: {
              isWholeLine: true,
              className: type === 'deleted' ? 'diff-deleted-line' : 'diff-modified-line',
              glyphMarginClassName: type === 'deleted' ? 'diff-deleted-glyph' : 'diff-modified-glyph',
            },
          }
          leftDecorations.push(decoration)
        } catch (e) {
          console.error('创建左侧装饰失败:', e)
        }
      }

      // 右侧装饰（新增或修改）
      if (rightLineIndex !== -1 && (type === 'added' || type === 'modified')) {
        const line = rightLines[rightLineIndex]
        try {
          const decoration = {
            range: new Range(rightLineIndex + 1, 1, rightLineIndex + 1, line.length + 1),
            options: {
              isWholeLine: true,
              className: type === 'added' ? 'diff-added-line' : 'diff-modified-line',
              glyphMarginClassName: type === 'added' ? 'diff-added-glyph' : 'diff-modified-glyph',
            },
          }
          rightDecorations.push(decoration)
        } catch (e) {
          console.error('创建右侧装饰失败:', e)
        }
      }
    })

    // 应用装饰
    if (leftDecorations.length > 0) {
      try {
        leftDecorationIds = leftEditor.deltaDecorations(leftDecorationIds, leftDecorations)
      } catch (e) {
        console.error('应用左侧装饰失败:', e)
      }
    }
    if (rightDecorations.length > 0) {
      try {
        rightDecorationIds = rightEditor.deltaDecorations(rightDecorationIds, rightDecorations)
      } catch (e) {
        console.error('应用右侧装饰失败:', e)
      }
    }
  }

  // 根据路径查找行号
  const findLineByPath = (lines, path, value) => {
    const searchKey = path.split('.').pop().split('[')[0]
    const valueStr = value !== null && value !== undefined ? JSON.stringify(value) : ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // 简化查找：查找包含key和value的行
      if (line.includes(`"${searchKey}"`) || (valueStr && line.includes(valueStr))) {
        return i
      }
    }

    // 如果找不到精确匹配，尝试查找key
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${searchKey}"`)) {
        return i
      }
    }

    return -1
  }

  // 复制JSON
  const copyLeftJson = async () => {
    const content = getLeftContent()
    if (!content.trim()) {
      ElMessage.warning('左侧内容为空')
      return
    }
    try {
      await navigator.clipboard.writeText(content)
      ElMessage.success('左侧JSON已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  const copyRightJson = async () => {
    const content = getRightContent()
    if (!content.trim()) {
      ElMessage.warning('右侧内容为空')
      return
    }
    try {
      await navigator.clipboard.writeText(content)
      ElMessage.success('右侧JSON已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  // 交换JSON
  const swapJson = () => {
    const leftContent = getLeftContent()
    const rightContent = getRightContent()
    setLeftContent(rightContent)
    setRightContent(leftContent)
    compareJson()
    ElMessage.success('已交换左右JSON内容')
  }

  // 格式化差异值用于显示
  const formatDiffValue = (value) => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch (e) {
        return String(value)
      }
    }
    return String(value)
  }

  // 定位到差异位置
  const scrollToDiff = (diff, index) => {
    const leftContent = getLeftContent()
    const rightContent = getRightContent()
    const leftLines = leftContent.split('\n')
    const rightLines = rightContent.split('\n')

    // 查找行号
    const leftLineIndex = findLineByPath(leftLines, diff.path, diff.oldValue)
    const rightLineIndex = findLineByPath(rightLines, diff.path, diff.newValue)

    // 滚动到对应位置
    if (leftEditor && (diff.type === 'deleted' || diff.type === 'modified') && leftLineIndex !== -1) {
      leftEditor.revealLineInCenter(leftLineIndex + 1)
      leftEditor.setPosition({ lineNumber: leftLineIndex + 1, column: 1 })
      leftEditor.focus()
    }

    if (rightEditor && (diff.type === 'added' || diff.type === 'modified') && rightLineIndex !== -1) {
      rightEditor.revealLineInCenter(rightLineIndex + 1)
      rightEditor.setPosition({ lineNumber: rightLineIndex + 1, column: 1 })
      rightEditor.focus()
    }

    ElMessage.success(`已定位到第 ${index + 1} 个差异: ${diff.path}`)
  }

  // 复制差异列表
  const copyDiffList = async () => {
    const listToCopy = filteredDiffList.value
    if (listToCopy.length === 0) {
      ElMessage.warning('没有差异数据可复制')
      return
    }

    const filterText = diffFilter.value === 'all' ? '全部' : diffFilter.value === 'added' ? '新增' : diffFilter.value === 'modified' ? '修改' : '删除'
    const diffText = `[${filterText}] 差异列表 (共 ${listToCopy.length} 项)\n\n` + listToCopy
      .map((diff, index) => {
        const typeText = diff.type === 'added' ? '新增' : diff.type === 'deleted' ? '删除' : '修改'
        const oldValueText = diff.oldValue !== null && diff.oldValue !== undefined ? formatDiffValue(diff.oldValue) : '—'
        const newValueText = diff.newValue !== null && diff.newValue !== undefined ? formatDiffValue(diff.newValue) : '—'
        return `[${index + 1}] ${typeText} - 路径: ${diff.path || '(根)'}\n  旧值: ${oldValueText}\n  新值: ${newValueText}`
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(diffText)
      ElMessage.success('差异列表已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  // 获取指定类型的差异数量
  const getDiffCountByType = (type) => {
    return diffList.value.filter((diff) => diff.type === type).length
  }

  // 过滤后的差异列表
  const filteredDiffList = computed(() => {
    if (diffFilter.value === 'all') {
      return diffList.value
    }
    return diffList.value.filter((diff) => diff.type === diffFilter.value)
  })

  // 导出差异列表
  const exportDiffList = () => {
    const listToExport = filteredDiffList.value
    if (listToExport.length === 0) {
      ElMessage.warning('没有差异数据可导出')
      return
    }

    const diffData = {
      summary: {
        total: diffList.value.length,
        filtered: listToExport.length,
        filter: diffFilter.value,
        added: diffStats.value?.added || 0,
        deleted: diffStats.value?.deleted || 0,
        modified: diffStats.value?.modified || 0,
        same: diffStats.value?.same || 0,
      },
      differences: listToExport.map((diff) => ({
        type: diff.type,
        typeText: diff.type === 'added' ? '新增' : diff.type === 'deleted' ? '删除' : '修改',
        path: diff.path || '(根)',
        oldValue: diff.oldValue,
        newValue: diff.newValue,
      })),
      timestamp: new Date().toISOString(),
    }

    const jsonStr = JSON.stringify(diffData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `json-diff-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('差异列表已导出')
  }

  // 加载示例数据
  const loadSampleData = () => {
    const sample1 = {
      name: '张三',
      age: 25,
      email: 'zhangsan@example.com',
      hobbies: ['读书', '游泳', '编程'],
      address: {
        city: '北京',
        street: '朝阳区',
        zipCode: '100000',
      },
      isActive: true,
      score: 95.5,
    }

    const sample2 = {
      name: '张三',
      age: 26,
      email: 'zhangsan@example.com',
      hobbies: ['读书', '游泳', '编程', '旅游'],
      address: {
        city: '北京',
        street: '海淀区',
        zipCode: '100001',
      },
      isActive: true,
      score: 98.0,
      newField: '新增字段',
    }

    setLeftContent(JSON.stringify(sample1, null, 2))
    setRightContent(JSON.stringify(sample2, null, 2))
    nextTick(() => {
      compareJson()
      ElMessage.success('已加载示例数据')
    })
  }

  // 暴露方法供父组件调用
  defineExpose({
    getLeftContent,
    getRightContent,
    setLeftContent,
    setRightContent,
    formatLeftJson,
    formatRightJson,
    compareJson,
  })

  // 生命周期
  onMounted(() => {
    nextTick(() => {
      initWidths()
      window.addEventListener('resize', initWidths)

      // 使用 props 初始化编辑器内容
      if (props.initialLeftJson && leftEditor) {
        leftEditor.setValue(props.initialLeftJson)
      }
      if (props.initialRightJson && rightEditor) {
        rightEditor.setValue(props.initialRightJson)
      }
      // 延迟执行比对，确保编辑器已完全初始化
      setTimeout(() => {
        compareJson()
      }, 500)
    })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', initWidths)
  })

  // 监听 props 变化
  watch(
    () => props.initialLeftJson,
    (newVal) => {
      if (newVal && leftEditor && newVal !== getLeftContent()) {
        leftEditor.setValue(newVal)
      }
    }
  )

  watch(
    () => props.initialRightJson,
    (newVal) => {
      if (newVal && rightEditor && newVal !== getRightContent()) {
        rightEditor.setValue(newVal)
      }
    }
  )
</script>

<style lang="scss" scoped>
  .response-compare {
    --cmp-bg: #121212;
    --cmp-bg-elevated: #1a1a1a;
    --cmp-bg-panel: #1e1e1e;
    --cmp-border: #2e2e2e;
    --cmp-text: #e0e0e0;
    --cmp-text-muted: #bdbdbd;
    --cmp-accent: #90caf9;
    --cmp-hover: #252525;
    --cmp-radius: 8px;
    --cmp-radius-sm: 6px;
    --cmp-transition: 0.18s ease;

    display: flex;
    flex-direction: column;
    height: 94%;
    background: var(--cmp-bg);
    color: var(--cmp-text);
    border-radius: var(--cmp-radius);
    overflow: hidden;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: var(--cmp-bg-elevated);
      border-bottom: 1px solid var(--cmp-border);

      .toolbar-left,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .diff-stats {
      padding: 8px 14px;
      background: var(--cmp-bg-panel);
      border-bottom: 1px solid var(--cmp-border);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .main-content {
      flex: 1;
      display: flex;
      position: relative;
      overflow: hidden;
      min-height: 0;
      padding: 0 2px;
      gap: 0;
    }

    .editor-section {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--cmp-bg-elevated);
      border: 1px solid var(--cmp-border);
      border-radius: var(--cmp-radius);
      overflow: hidden;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: var(--cmp-bg-panel);
        border-bottom: 1px solid var(--cmp-border);
        flex-shrink: 0;

        .section-header-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f0;
        }

        .section-header-actions {
          display: flex;
          gap: 8px;

          :deep(.el-button) {
            background: var(--cmp-hover);
            border-color: var(--cmp-border);
            color: var(--cmp-text-muted);
            border-radius: var(--cmp-radius-sm);

            &:hover {
              background: #2a2a2a;
              color: var(--cmp-text);
            }
          }
        }
      }

      .editor-container {
        flex: 1;
        min-height: 0;
        position: relative;
        background: var(--cmp-bg-panel);
      }
    }

    .resizer {
      width: 6px;
      background: var(--cmp-border);
      cursor: col-resize;
      transition: background var(--cmp-transition);
      border-radius: 3px;
      margin: 0 6px;
      flex-shrink: 0;
      position: relative;

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
        transition: background-color var(--cmp-transition);
      }

      &:hover,
      &.resizing {
        background: #3a3a3a;

        &::before {
          background-color: var(--cmp-accent);
        }
      }
    }

    .c-flex-x-start {
      display: flex;
      align-items: center;
    }

    .diff-list-container {
      border-top: 1px solid var(--cmp-border);
      background: var(--cmp-bg-elevated);
      max-height: 400px;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;

      .diff-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: var(--cmp-bg-panel);
        border-bottom: 1px solid var(--cmp-border);

        .diff-list-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f0;
          display: flex;
          align-items: center;
          gap: 8px;

          .diff-filter-hint {
            font-size: 12px;
            font-weight: normal;
            color: var(--cmp-text-muted);
            margin-left: 4px;
          }
        }

        .diff-list-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;

          :deep(.el-radio-button__inner) {
            background: var(--cmp-hover);
            border-color: var(--cmp-border);
            color: var(--cmp-text-muted);
            box-shadow: none;
          }

          :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
            background: #2a2a2a;
            color: var(--cmp-accent);
            border-color: var(--cmp-border);
          }

          :deep(.el-button) {
            background: var(--cmp-hover);
            border-color: var(--cmp-border);
            color: var(--cmp-text-muted);
            border-radius: var(--cmp-radius-sm);

            &:hover {
              background: #2a2a2a;
              color: var(--cmp-text);
            }
          }
        }
      }

      .diff-list-content {
        overflow-y: auto;
        padding: 0;
        height: 180px;

        :deep(.el-table) {
          --el-table-bg-color: var(--cmp-bg-panel);
          --el-table-tr-bg-color: var(--cmp-bg-panel);
          --el-table-header-bg-color: var(--cmp-hover);
          --el-table-row-hover-bg-color: #2a2a2a;
          --el-table-border-color: var(--cmp-border);
          --el-table-text-color: var(--cmp-text);

          .diff-path {
            background: var(--cmp-hover);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: var(--cmp-accent);
          }

          .diff-value {
            max-width: 100%;
            overflow-x: auto;

            pre {
              margin: 0;
              padding: 4px 8px;
              background: var(--cmp-hover);
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              white-space: pre-wrap;
              word-break: break-all;
              max-height: 100px;
              overflow-y: auto;
            }

            &.old-value pre {
              background: rgba(244, 67, 54, 0.12);
              border-left: 2px solid rgba(244, 67, 54, 0.45);
            }

            &.new-value pre {
              background: rgba(76, 175, 80, 0.12);
              border-left: 2px solid rgba(76, 175, 80, 0.45);
            }
          }

          .diff-empty {
            color: #757575;
            font-style: italic;
          }
        }
      }
    }
  }
</style>

<style lang="scss">
  // 全局样式：差异高亮
  .diff-added-line {
    background-color: rgba(76, 175, 80, 0.1) !important;
    border-left: 3px solid rgba(76, 175, 80, 0.5);
  }

  .diff-deleted-line {
    background-color: rgba(244, 67, 54, 0.1) !important;
    border-left: 3px solid rgba(244, 67, 54, 0.5);
  }

  .diff-modified-line {
    background-color: rgba(255, 152, 0, 0.1) !important;
    border-left: 3px solid rgba(255, 152, 0, 0.5);
  }

  .diff-added-glyph {
    background-color: #4caf50 !important;
    width: 5px !important;
  }

  .diff-deleted-glyph {
    background-color: #f44336 !important;
    width: 5px !important;
  }

  .diff-modified-glyph {
    background-color: #ff9800 !important;
    width: 5px !important;
  }

  // 暗色主题适配
  .vs-dark {
    .diff-added-line {
      background-color: rgba(76, 175, 80, 0.15) !important;
    }

    .diff-deleted-line {
      background-color: rgba(244, 67, 54, 0.15) !important;
    }

    .diff-modified-line {
      background-color: rgba(255, 152, 0, 0.15) !important;
    }
  }
</style>
