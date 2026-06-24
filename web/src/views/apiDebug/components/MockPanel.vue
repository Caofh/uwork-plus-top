<template>
  <div class="mock-panel">
    <aside class="mock-panel__list">
      <div class="mock-panel__list-header">
        <span class="mock-panel__list-title">Mock 场景</span>
        <el-button link type="primary" @click="addCase">
          <el-icon><Plus /></el-icon>
          新建
        </el-button>
      </div>

      <div class="mock-panel__list-body">
        <div
          v-for="item in cases"
          :key="item.id"
          class="mock-case-item"
          :class="{
            'mock-case-item--active': item.id === editingCaseId,
            'mock-case-item--applied': isAppliedCase(item.id),
          }"
          @click="editingCaseId = item.id"
        >
          <span class="mock-case-item__name" :title="item.name">{{ item.name }}</span>
          <el-tag
            v-if="isAppliedCase(item.id)"
            size="small"
            type="success"
            effect="dark"
            class="mock-case-item__badge"
          >
            应用中
          </el-tag>
          <div class="mock-case-item__actions">
            <el-button link title="复制" @click.stop="duplicateCase(item.id)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button
              link
              type="danger"
              title="删除"
              :disabled="cases.length <= 1"
              @click.stop="removeCase(item.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </aside>

    <section v-if="activeCase" class="mock-panel__editor">
      <div class="mock-panel__toolbar">
        <el-input
          v-model="activeCase.name"
          placeholder="场景名称"
          class="mock-panel__name-input"
        />
        <div class="mock-panel__toolbar-meta">
          <!-- <span class="mock-panel__field-label">状态码</span>
          <el-input-number
            v-model="activeCase.statusCode"
            :min="100"
            :max="599"
            controls-position="right"
            class="mock-panel__status-input"
          /> -->
          <span class="mock-panel__field-label">延迟(ms)</span>
          <el-input-number
            v-model="activeCase.delay"
            :min="0"
            :max="60000"
            controls-position="right"
            class="mock-panel__delay-input"
          />
        </div>
        <div class="mock-panel__toolbar-actions">
          <el-button size="small" @click="formatJson">格式化 JSON</el-button>
          <el-button size="small" @click="emit('save')">仅保存</el-button>
          <el-button size="small" type="primary" @click="applyMock">应用 Mock</el-button>
        </div>
      </div>

      <div class="mock-panel__match-rule">
        <span class="mock-panel__field-label">匹配规则</span>
        <el-input
          v-model="matchPattern"
          class="mock-panel__match-input"
          placeholder="匹配完整请求 URL 的正则表达式"
          clearable
        />
        <el-button size="small" @click="fillPatternFromCurrentUrl">使用当前 URL</el-button>
      </div>
      <div v-if="patternError" class="mock-panel__json-error">{{ patternError }}</div>

      <JsonMonacoEditor
        :key="editingCaseId"
        v-model="activeCase.body"
        class="mock-panel__json-editor"
      />
      <div v-if="jsonError" class="mock-panel__json-error">{{ jsonError }}</div>
    </section>

    <el-empty v-else class="mock-panel__empty" description="请选择或新建 Mock 场景" />
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { CopyDocument, Delete, Plus } from '@element-plus/icons-vue'
  import { createDefaultMockCase, ensureMockCases } from '../types'
  import JsonMonacoEditor from './JsonMonacoEditor.vue'

  const props = defineProps({
    modelValue: {
      type: Array,
      default: () => [],
    },
    activeCaseId: {
      type: String,
      default: '',
    },
    mockEnabled: {
      type: Boolean,
      default: false,
    },
    matchPattern: {
      type: String,
      default: '',
    },
    currentUrl: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits([
    'update:modelValue',
    'update:activeCaseId',
    'update:matchPattern',
    'apply',
    'save',
  ])

  const editingCaseId = ref('')

  const appliedCaseId = computed({
    get: () => props.activeCaseId,
    set: value => emit('update:activeCaseId', value),
  })

  const cases = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const matchPattern = computed({
    get: () => props.matchPattern,
    set: value => emit('update:matchPattern', value),
  })

  const activeCase = computed(() =>
    cases.value.find(item => item.id === editingCaseId.value) || null,
  )

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function buildPatternFromCurrentUrl() {
    const url = props.currentUrl.trim()
    if (!url) {
      return ''
    }
    const suffix = url.includes('?') ? '' : '(?:\\?.*)?'
    return `^${escapeRegExp(url)}${suffix}$`
  }

  function fillPatternFromCurrentUrl() {
    const pattern = buildPatternFromCurrentUrl()
    if (!pattern) {
      ElMessage.warning('请先填写请求 URL')
      return
    }
    matchPattern.value = pattern
  }

  function isAppliedCase(caseId) {
    return props.mockEnabled && Boolean(appliedCaseId.value) && caseId === appliedCaseId.value
  }

  function syncEditingCaseId(preferredId = '') {
    const list = ensureMockCases(cases.value)
    const nextId =
      preferredId
      || appliedCaseId.value
      || list[0]?.id
      || ''
    if (nextId && list.some(item => item.id === nextId)) {
      editingCaseId.value = nextId
      return
    }
    editingCaseId.value = list[0]?.id || ''
  }

  const jsonError = computed(() => {
    if (!activeCase.value?.body?.trim()) {
      return ''
    }
    try {
      JSON.parse(activeCase.value.body)
      return ''
    } catch (error) {
      return error?.message || 'JSON 格式错误'
    }
  })

  const patternError = computed(() => {
    if (!matchPattern.value.trim()) {
      return ''
    }
    try {
      new RegExp(matchPattern.value)
      return ''
    } catch (error) {
      return `匹配规则无效：${error?.message || '正则表达式错误'}`
    }
  })

  watch(
    () => props.modelValue,
    value => {
      const list = ensureMockCases(value)
      if (list !== value) {
        cases.value = list
      }
      syncEditingCaseId(editingCaseId.value)
    },
    { immediate: true, deep: true },
  )

  watch(
    () => props.activeCaseId,
    value => {
      if (value && value !== editingCaseId.value && cases.value.some(item => item.id === value)) {
        editingCaseId.value = value
      }
    },
  )

  function addCase() {
    const nextCase = createDefaultMockCase(`场景 ${cases.value.length + 1}`)
    cases.value = [...cases.value, nextCase]
    editingCaseId.value = nextCase.id
  }

  function removeCase(caseId) {
    if (cases.value.length <= 1) {
      return
    }
    const nextCases = cases.value.filter(item => item.id !== caseId)
    cases.value = nextCases
    if (editingCaseId.value === caseId) {
      syncEditingCaseId()
    }
    if (appliedCaseId.value === caseId) {
      appliedCaseId.value = nextCases[0]?.id || ''
    }
  }

  function duplicateCase(caseId) {
    const source = cases.value.find(item => item.id === caseId)
    if (!source) {
      return
    }
    const copy = {
      ...JSON.parse(JSON.stringify(source)),
      id: createDefaultMockCase().id,
      name: `${source.name} 副本`,
    }
    cases.value = [...cases.value, copy]
    editingCaseId.value = copy.id
  }

  function formatJson() {
    if (!activeCase.value) {
      return
    }
    try {
      const parsed = JSON.parse(activeCase.value.body || '{}')
      activeCase.value.body = `${JSON.stringify(parsed, null, 2)}\n`
      ElMessage.success('格式化成功')
    } catch {
      ElMessage.error('JSON 格式错误，无法格式化')
    }
  }

  function applyMock() {
    if (!activeCase.value) {
      return
    }
    if (jsonError.value) {
      ElMessage.error(jsonError.value)
      return
    }
    if (!matchPattern.value.trim()) {
      fillPatternFromCurrentUrl()
    }
    if (patternError.value) {
      ElMessage.error(patternError.value)
      return
    }
    appliedCaseId.value = activeCase.value.id
    emit('apply', JSON.parse(JSON.stringify(activeCase.value)))
  }
</script>

<style scoped lang="scss">
  .mock-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
    background: #1e1e1e;
  }

  .mock-panel__list {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #2e2e2e;
    background: #1a1a1a;
  }

  .mock-panel__list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #2e2e2e;
  }

  .mock-panel__list-title {
    font-size: 13px;
    font-weight: 600;
    color: #f0f0f0;
  }

  .mock-panel__list-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 8px;
  }

  .mock-case-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    color: #bdbdbd;
    transition:
      background 0.18s ease,
      color 0.18s ease;

    &:hover {
      background: #252525;
      color: #90caf9;
    }

    &--active {
      background: #1e3a5f;
      color: #90caf9;
      font-weight: 600;
    }

    &--applied {
      box-shadow: inset 3px 0 0 #66bb6a;

      &.mock-case-item--active {
        background: linear-gradient(90deg, rgba(102, 187, 106, 0.15) 0%, #1e3a5f 100%);
        color: #e0e0e0;
      }
    }
  }

  .mock-case-item__badge {
    flex-shrink: 0;
  }

  .mock-case-item__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .mock-case-item__actions {
    display: flex;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;

    .mock-case-item:hover &,
    .mock-case-item--active & {
      opacity: 1;
    }
  }

  .mock-panel__editor {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
    gap: 10px;
    background: #1e1e1e;

    :deep(.el-input__wrapper),
    :deep(.el-input-number) {
      background: #252525;
      box-shadow: none;
      border-radius: 6px;
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

    :deep(.el-button--primary) {
      border-radius: 6px;
      border: none;
    }
  }

  .mock-panel__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .mock-panel__match-rule {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mock-panel__match-input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__inner) {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
    }
  }

  .mock-panel__name-input {
    width: 180px;
  }

  .mock-panel__toolbar-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mock-panel__field-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .mock-panel__status-input {
    width: 110px;
  }

  .mock-panel__delay-input {
    width: 120px;
  }

  .mock-panel__toolbar-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .mock-panel__json-editor {
    flex: 1;
    min-height: 180px;
  }

  .mock-panel__json-error {
    font-size: 12px;
    color: var(--el-color-danger);
  }

  .mock-panel__empty {
    flex: 1;
  }
</style>
