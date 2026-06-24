<template>
  <div class="webview-manager">
    <aside class="webview-manager-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">地址管理</span>
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon style="color: #ffffff"><Plus /></el-icon>
          新增
        </el-button>
      </div>

      <div v-loading="loading" class="sidebar-list">
        <div
          v-for="(item, index) in listData"
          :key="item.id"
          class="sidebar-item"
          :class="{ active: activeId === item.id }"
          @click="handleSelect(item)"
        >
          <div class="item-main">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-url">{{ item.url }}</div>
          </div>
          <div class="item-actions" @click.stop>
            <el-button
              link
              type="primary"
              :disabled="index === 0 || orderSaving"
              title="上移"
              @click="handleMove(index, 'up')"
            >
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              link
              type="primary"
              :disabled="index === listData.length - 1 || orderSaving"
              title="下移"
              @click="handleMove(index, 'down')"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-tooltip content="浏览器打开" placement="top">
              <el-button link type="primary" @click="handleOpenExternal(item)">
                <el-icon><TopRight /></el-icon>
              </el-button>
            </el-tooltip>
            <el-button link type="primary" title="编辑" @click="handleEdit(item)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button link type="danger" title="删除" @click="handleDelete(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <el-empty v-if="!loading && listData.length === 0" description="暂无地址，点击新增" />
      </div>
    </aside>

    <section class="webview-manager-preview">
      <div v-if="activeUrl" class="preview-toolbar">
        <span class="preview-url">{{ activeUrl }}</span>
        <el-button size="small" @click="reloadIframe">刷新</el-button>
      </div>
      <div v-if="activeUrl" class="preview-body">
        <iframe
          v-show="!iframeLoadFailed && !iframeLoading"
          ref="iframeRef"
          :key="iframeKey"
          class="preview-iframe"
          :src="activeUrl"
          frameborder="0"
          allow="clipboard-read; clipboard-write; fullscreen"
          allowfullscreen
          @load="onIframeLoad"
          @error="onIframeError"
        />
        <div v-if="iframeLoading" class="preview-loading" v-loading="true" />
        <div v-if="iframeLoadFailed" class="preview-failed">
          <el-icon class="preview-failed-icon"><CircleCloseFilled /></el-icon>
          <p class="preview-failed-title">页面无法访问</p>
          <p class="preview-failed-hint">{{ previewFailHint }}</p>
          <div class="preview-failed-actions">
            <el-button size="small" @click="reloadIframe">重试</el-button>
            <el-button size="small" type="primary" @click="handleOpenActiveExternal">浏览器打开</el-button>
          </div>
        </div>
      </div>
      <div v-else class="preview-empty">
        <el-empty description="请选择左侧地址进行预览" />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑地址' : '新增地址'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="72px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="地址" prop="url">
          <el-input v-model="formData.url" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="可选"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Edit, Delete, ArrowUp, ArrowDown, TopRight, CircleCloseFilled } from '@element-plus/icons-vue'
  import SqlOperate from '@/utils/sqlOperate'
  import { openExternal, isInElectron, jsBridge } from '@/utils/electron'

  const SQL_FILE = 'dataSql/webview-manager.json'
  const sqlClient = new SqlOperate(SQL_FILE)

  const listData = ref([])
  const loading = ref(false)
  const orderSaving = ref(false)
  const activeId = ref(null)
  const activeUrl = ref('')
  const iframeKey = ref(0)
  const iframeRef = ref(null)
  const iframeLoading = ref(false)
  const iframeLoadFailed = ref(false)
  const previewFailReason = ref('network')

  const previewFailHint = computed(() => {
    if (previewFailReason.value === 'empty') {
      return '页面已响应但内容为空，请检查服务是否已启动'
    }
    if (previewFailReason.value === 'timeout') {
      return '加载超时，请检查地址、网络或服务是否已启动'
    }
    return '请检查地址或网络连接，确认目标服务可访问'
  })

  const IFRAME_LOAD_TIMEOUT = 5000
  let iframeLoadTimer = null
  let iframeVerifyTimer = null
  let previewSessionId = 0

  function clearIframeVerifyTimer() {
    if (iframeVerifyTimer) {
      clearTimeout(iframeVerifyTimer)
      iframeVerifyTimer = null
    }
  }

  function clearIframeLoadTimer() {
    if (iframeLoadTimer) {
      clearTimeout(iframeLoadTimer)
      iframeLoadTimer = null
    }
  }

  function markPreviewFailed(reason = 'network') {
    previewFailReason.value = reason
    iframeLoadFailed.value = true
    // iframeLoading.value = false
    clearIframeLoadTimer()
    clearIframeVerifyTimer()
  }

  function resetPreviewState() {
    clearIframeLoadTimer()
    clearIframeVerifyTimer()
    // iframeLoading.value = false
    iframeLoadFailed.value = false
    previewFailReason.value = 'network'
  }

  /** 仅探测网络可达性；是否允许 iframe 嵌入交给浏览器 */
  async function probeUrlReachable(url) {
    if (isInElectron()) {
      let result = await jsBridge.registerSync({
        method: 'sendApiRequest',
        json: { method: 'HEAD', url, timeout: 10000 },
      })
      if (result?.code !== 0) {
        return { ok: false, reason: 'network', message: result?.message }
      }
      if (result.status === 405) {
        result = await jsBridge.registerSync({
          method: 'sendApiRequest',
          json: { method: 'GET', url, timeout: 10000 },
        })
        if (result?.code !== 0) {
          return { ok: false, reason: 'network', message: result?.message }
        }
      }
      if (!result.status || result.status >= 400) {
        return { ok: false, reason: 'network', message: `HTTP ${result.status}` }
      }
      return { ok: true }
    }

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      clearTimeout(timer)
      return { ok: true }
    } catch {
      return { ok: false, reason: 'network' }
    }
  }

  function verifyIframeContent(url, session) {
    clearIframeVerifyTimer()
    iframeVerifyTimer = setTimeout(() => {
      if (session !== previewSessionId || activeUrl.value !== url || iframeLoadFailed.value) {
        return
      }

      const iframe = iframeRef.value
      if (!iframe) {
        return
      }

      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc) {
          return
        }

        const body = doc.body
        const html = doc.documentElement
        const text = (body?.textContent || html?.textContent || '').trim()
        const hasVisual =
          (body?.children?.length || 0) > 0 ||
          text.length > 0 ||
          !!body?.querySelector('iframe, img, canvas, video, svg, main, #app, #root')

        if (!hasVisual) {
          markPreviewFailed('empty')
        }
      } catch {
        // 跨域无法读取内容，由浏览器自行处理嵌入限制
      }
    }, 900)
  }

  function beginIframeLoad(url = activeUrl.value) {
    previewSessionId += 1
    const session = previewSessionId

    iframeLoadFailed.value = false
    previewFailReason.value = 'network'
    clearIframeLoadTimer()
    clearIframeVerifyTimer()

    if (!url) {
      return
    }

    iframeLoading.value = Boolean(url)

    // iframeLoadTimer = setTimeout(() => {
    //   if (session !== previewSessionId || iframeLoadFailed.value) {
    //     return
    //   }
    //   markPreviewFailed('timeout')
    // }, IFRAME_LOAD_TIMEOUT)

    // probeUrlReachable(url).then(result => {
    //   if (session !== previewSessionId || activeUrl.value !== url) {
    //     return
    //   }
    //   if (!result.ok) {
    //     markPreviewFailed(result.reason || 'network')
    //   }
    // })
  }

  function onIframeLoad() {
    if (iframeLoadFailed.value) {
      return
    }

    clearIframeLoadTimer()
    // iframeLoading.value = false
    verifyIframeContent(activeUrl.value, previewSessionId)
  }

  function onIframeError() {
    markPreviewFailed('network')
  }

  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const submitLoading = ref(false)
  const formRef = ref(null)

  const formData = reactive({
    id: null,
    name: '',
    url: '',
    description: '',
  })

  const formRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
    ],
    url: [
      { required: true, message: '请输入地址', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          const normalized = normalizeUrl(value)
          if (!normalized) {
            callback(new Error('请输入合法的 http/https 地址'))
            return
          }
          callback()
        },
        trigger: 'blur',
      },
    ],
    description: [{ max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }],
  }

  function normalizeUrl(raw = '') {
    const value = String(raw).trim()
    if (!value) {
      return ''
    }
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    try {
      const url = new URL(withProtocol)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return ''
      }
      return url.toString()
    } catch {
      return ''
    }
  }

  function formatDate(date) {
    const d = new Date(date)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  async function loadData() {
    loading.value = true
    try {
      const data = await sqlClient.readAll()
      listData.value = Array.isArray(data) ? data : []
      if (activeId.value && !listData.value.some(item => item.id === activeId.value)) {
        activeId.value = null
        activeUrl.value = ''
        resetPreviewState()
      }
    } catch (error) {
      console.error('[WebviewManager] 加载失败:', error)
      ElMessage.error('加载地址列表失败')
    } finally {
      loading.value = false
    }
  }

  const showLoadingLoop = null
  function handleSelect(item) {
    activeId.value = item.id
    activeUrl.value = normalizeUrl(item.url)
    iframeKey.value += 1
    // beginIframeLoad(activeUrl.value)

    clearTimeout(showLoadingLoop)
    iframeLoading.value = true
    showLoadingLoop = setTimeout(() => {
      iframeLoading.value = false
    }, 800)
  }

  function reloadIframe() {
    iframeKey.value += 1
    // beginIframeLoad(activeUrl.value)

    activeUrl.value = normalizeUrl(activeUrl.value)

    clearTimeout(showLoadingLoop)
    iframeLoading.value = true
    showLoadingLoop = setTimeout(() => {
      iframeLoading.value = false
    }, 800)
  }

  function handleOpenActiveExternal() {
    const url = normalizeUrl(activeUrl.value)
    if (!url) {
      ElMessage.warning('地址无效')
      return
    }
    if (isInElectron()) {
      openExternal(url)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleOpenExternal(item) {
    const url = normalizeUrl(item.url)
    if (!url) {
      ElMessage.warning('地址无效')
      return
    }
    if (isInElectron()) {
      openExternal(url)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function persistListOrder(items) {
    orderSaving.value = true
    try {
      await sqlClient.writeAll(items)
    } catch (error) {
      console.error('[WebviewManager] 保存排序失败:', error)
      ElMessage.error('保存排序失败')
      await loadData()
      throw error
    } finally {
      orderSaving.value = false
    }
  }

  async function handleMove(index, direction) {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= listData.value.length) {
      return
    }

    const newList = [...listData.value]
    const [movedItem] = newList.splice(index, 1)
    newList.splice(targetIndex, 0, movedItem)

    listData.value = newList
    try {
      await persistListOrder(newList)
    } catch {
      // loadData 已在 persistListOrder 失败时触发
    }
  }

  function resetForm() {
    formData.id = null
    formData.name = ''
    formData.url = ''
    formData.description = ''
    formRef.value?.clearValidate()
  }

  function handleAdd() {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }

  function handleEdit(item) {
    isEdit.value = true
    formData.id = item.id
    formData.name = item.name
    formData.url = item.url
    formData.description = item.description || ''
    dialogVisible.value = true
  }

  async function handleDelete(item) {
    try {
      await ElMessageBox.confirm(`确定要删除「${item.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await sqlClient.remove(item.id)
      if (activeId.value === item.id) {
        activeId.value = null
        activeUrl.value = ''
        resetPreviewState()
      }
      await loadData()
      ElMessage.success('删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('[WebviewManager] 删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
  }

  async function handleSubmit() {
    if (!formRef.value) {
      return
    }

    await formRef.value.validate(async valid => {
      if (!valid) {
        return
      }

      submitLoading.value = true
      try {
        const payload = {
          name: formData.name.trim(),
          url: normalizeUrl(formData.url),
          description: formData.description.trim(),
        }

        if (isEdit.value) {
          await sqlClient.update(formData.id, payload)
          if (activeId.value === formData.id) {
            activeUrl.value = payload.url
            iframeKey.value += 1
            beginIframeLoad(payload.url)
          }
          ElMessage.success('编辑成功')
        } else {
          await sqlClient.create({
            ...payload,
            createTime: formatDate(new Date()),
          })
          ElMessage.success('新增成功')
        }

        await loadData()
        dialogVisible.value = false
      } catch (error) {
        console.error('[WebviewManager] 保存失败:', error)
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      } finally {
        submitLoading.value = false
      }
    })
  }

  onMounted(() => {
    loadData()
  })

  onUnmounted(() => {
    clearIframeLoadTimer()
    clearIframeVerifyTimer()
  })
</script>

<style lang="scss" scoped>
  .webview-manager {
    --wv-bg: #121212;
    --wv-bg-elevated: #1a1a1a;
    --wv-bg-panel: #1e1e1e;
    --wv-border: #2e2e2e;
    --wv-text: #e0e0e0;
    --wv-text-muted: #bdbdbd;
    --wv-accent: #90caf9;
    --wv-accent-soft: #1e3a5f;
    --wv-hover: #252525;
    --wv-radius: 8px;
    --wv-radius-sm: 6px;
    --wv-transition: 0.18s ease;

    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    gap: 10px;
    padding: 10px 12px 12px;
    background: var(--wv-bg);
    color: var(--wv-text);
    border-radius: var(--wv-radius);
    box-sizing: border-box;
  }

  .webview-manager-sidebar {
    flex-shrink: 0;
    width: 300px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--wv-border);
    border-radius: var(--wv-radius);
    background: var(--wv-bg-elevated);
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--wv-border);
    background: var(--wv-bg-panel);
    flex-shrink: 0;
  }

  .sidebar-title {
    font-size: 14px;
    font-weight: 600;
    color: #f0f0f0;
  }

  .sidebar-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 10px;

    :deep(.el-empty__description) {
      color: var(--wv-text-muted);
    }
  }

  .sidebar-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px;
    margin-bottom: 6px;
    border-radius: var(--wv-radius-sm);
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    transform: translateY(0);
    transition:
      background var(--wv-transition),
      border-color var(--wv-transition),
      transform 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

    &:hover {
      background: var(--wv-hover);

      .item-name {
        color: var(--wv-accent);
      }
    }

    &.active {
      background: var(--wv-accent-soft);
      border-color: #234a75;

      .item-name {
        color: var(--wv-accent);
        font-weight: 600;
      }

      .item-url {
        color: #9eafc7;
      }
    }
  }

  .item-main {
    flex: 1;
    min-width: 0;
  }

  .item-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--wv-text-muted);
    margin-bottom: 4px;
    word-break: break-all;
    transition: color var(--wv-transition);
  }

  .item-url {
    font-size: 12px;
    color: #757575;
    word-break: break-all;
    line-height: 1.4;
  }

  .item-actions {
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0;
    max-width: 110px;

    :deep(.el-button.is-link) {
      color: #757575;
      padding: 4px;

      &:hover:not(.is-disabled) {
        color: var(--wv-accent);
      }

      &.el-button--danger:hover:not(.is-disabled) {
        color: #ef5350;
      }
    }
  }

  .webview-manager-preview {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--wv-border);
    border-radius: var(--wv-radius);
    overflow: hidden;
    background: var(--wv-bg-elevated);
  }

  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--wv-border);
    background: var(--wv-bg-panel);
    flex-shrink: 0;

    :deep(.el-button) {
      background: var(--wv-hover);
      border-color: var(--wv-border);
      color: var(--wv-text-muted);
      border-radius: var(--wv-radius-sm);

      &:hover {
        background: #2a2a2a;
        color: var(--wv-text);
      }
    }
  }

  .preview-url {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: #9e9e9e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .preview-body {
    flex: 1;
    min-height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--wv-bg-panel);
  }

  .preview-iframe {
    flex: 1;
    width: 100%;
    min-height: 0;
    border: none;
    // background: #fff;
    color-scheme: normal;
  }

  .preview-loading {
    position: absolute;
    inset: 0;
    z-index: 1;
    // background: rgba(30, 30, 30, 0.35);
  }

  .preview-failed {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    background: var(--wv-bg-panel);
    text-align: center;

    .preview-failed-icon {
      font-size: 56px;
      color: #ef5350;
      opacity: 0.9;
    }

    .preview-failed-title {
      margin: 4px 0 0;
      font-size: 15px;
      font-weight: 600;
      color: #f0f0f0;
    }

    .preview-failed-hint {
      margin: 0;
      max-width: 320px;
      font-size: 12px;
      line-height: 1.5;
      color: #9e9e9e;
    }

    .preview-failed-actions {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }
  }

  .preview-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--wv-bg-panel);

    :deep(.el-empty__description) {
      color: var(--wv-text-muted);
    }
  }

  :deep(.el-dialog) {
    background: var(--wv-bg-elevated);
    border: 1px solid var(--wv-border);
    border-radius: var(--wv-radius);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);

    .el-dialog__header {
      border-bottom: 1px solid var(--wv-border);
      padding: 14px 20px;

      .el-dialog__title {
        color: #f0f0f0;
        font-weight: 600;
        font-size: 15px;
      }
    }

    .el-dialog__body {
      padding: 20px;
    }

    .el-dialog__footer {
      border-top: 1px solid var(--wv-border);
      padding: 12px 20px;
    }

    .el-form-item__label {
      color: var(--wv-text-muted);
    }

    .el-input__wrapper,
    .el-textarea__inner {
      background: var(--wv-hover);
      box-shadow: none;
      border-radius: var(--wv-radius-sm);
    }

    .el-input__wrapper:hover,
    .el-input__wrapper.is-focus,
    .el-textarea__inner:hover,
    .el-textarea__inner:focus {
      background: #2a2a2a;
      box-shadow: none;
    }

    .el-input__inner,
    .el-textarea__inner {
      color: var(--wv-text);
    }

    .el-button:not(.el-button--primary) {
      background: var(--wv-hover);
      border-color: var(--wv-border);
      color: var(--wv-text-muted);
      border-radius: var(--wv-radius-sm);

      &:hover {
        background: #2a2a2a;
        color: var(--wv-text);
      }
    }
  }
</style>
