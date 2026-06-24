<template>
  <div class="online-doc-panel">
    <div class="online-doc-toolbar">
      <div class="online-doc-toolbar-content c-flex-x-between">
        <el-input
          v-model="searchValue"
          class="online-doc-search-input"
          size="medium"
          placeholder="搜索文章(回车搜索)"
          clearable
          @keydown.enter="searchArticles()"
          @clear="closeSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="online-doc-toolbar-actions">
          <el-button v-if="isPersonalType" type="primary" size="small" @click="addPersonalArticle">
            写文章
          </el-button>
          <el-button v-else type="primary" size="small" @click="openFavoriteDialog">
            添加文章
          </el-button>
        </div>
      </div>
    </div>

    <div class="document-content c-flex-x-start online-doc-main">
      <div :class="['always-use c-flex-y-start c-animation-transition', 'always-use-show']">
        <div class="always-use-title c-flex-x-between">
          <div>分组</div>
        </div>
        <div :class="['always-use-content', 'c-flex-y-start']">
          <div
            v-for="item in documentData"
            :key="item.id"
            class="always-use-item"
            :class="{ active: currentId === item.id }"
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
                    @click="setDocumentDataCurrentById(item.id)"
                    class="always-use-item-title c-ellipsis-single c-cursor"
                  >
                    {{ item.text }}
                  </div>
                </div>
              </template>
              <template #content>
                <div class="custom-tooltip-content">
                  <div class="tooltip-desc">{{ item.description }}</div>
                </div>
              </template>
            </el-tooltip>
          </div>
        </div>
      </div>

    <div class="document-content-list-wrap" v-loading="listLoading">
      <div ref="listBodyRef" class="document-content-list-body">
        <template v-if="articleList.length">
          <div
            class="document-content-item c-flex-x-between"
            v-for="item in articleList"
            :key="getArticleId(item)"
          >
            <div class="document-content-item-main">
              <div class="document-content-item-title">{{ getArticleTitle(item) }}</div>
              <div v-if="getArticleCreateTime(item)" class="document-content-item-time">
                {{ getArticleCreateTime(item) }}
              </div>
            </div>
            <div class="document-content-item-btns c-flex-x-end">
              <template v-if="isPersonalType">
                <el-button class="btn" size="small" @click="lookPersonalArticle(item)">
                  查看
                </el-button>
                <el-button class="btn" size="small" @click="editPersonalArticle(item)">
                  编辑
                </el-button>
                <el-tooltip content="复制分享链接" placement="top">
                  <el-button class="btn" size="small" @click="copyArticleShareLink(item)">
                    分享链接
                  </el-button>
                </el-tooltip>
                <el-button class="btn" size="small" @click="deleteArticle(item)">删除</el-button>
              </template>
              <template v-else>
                <el-button class="btn" size="small" @click="lookFavoriteArticle(item)">
                  查看
                </el-button>
                <el-button class="btn" size="small" @click="editFavoriteArticle(item)">
                  编辑
                </el-button>
                <el-button class="btn" size="small" @click="deleteArticle(item)">删除</el-button>
              </template>
            </div>
          </div>
        </template>
        <div v-else-if="!listLoading" class="document-content-empty">暂无文章</div>
      </div>

      <div v-if="total > pageSize" class="document-content-pagination c-flex-x-end">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          small
          background
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 搜索结果 -->
    <div :class="['search-part', { show: searchShow }]">
      <el-button class="search-part-close" circle @click="closeSearch">
        <el-icon :size="22"><Close /></el-icon>
      </el-button>
      <div
        ref="searchBodyRef"
        class="search-part-body"
        v-loading="searchLoading"
        element-loading-background="rgba(0, 0, 0, 0.25)"
      >
        <template v-if="searchData.length">
          <div
            class="document-content-item c-flex-x-between"
            v-for="item in searchData"
            :key="getArticleId(item)"
          >
            <div class="document-content-item-main">
              <div class="document-content-item-title">{{ getSearchResultTitle(item) }}</div>
              <div v-if="getArticleCreateTime(item)" class="document-content-item-time">
                {{ getArticleCreateTime(item) }}
              </div>
            </div>
            <div class="document-content-item-btns c-flex-x-end">
              <template v-if="isPersonalArticle(item)">
                <el-button class="btn" size="small" @click="lookPersonalArticle(item)">查看</el-button>
                <el-button class="btn" size="small" @click="editPersonalArticle(item)">编辑</el-button>
                <el-tooltip content="复制分享链接" placement="top">
                  <el-button class="btn" size="small" @click="copyArticleShareLink(item)">
                    分享链接
                  </el-button>
                </el-tooltip>
              </template>
              <template v-else>
                <el-button class="btn" size="small" @click="lookFavoriteArticle(item)">进入文章</el-button>
                <el-button class="btn" size="small" @click="editFavoriteArticle(item)">编辑</el-button>
              </template>
            </div>
          </div>
        </template>
        <div v-else-if="!searchLoading" class="document-content-empty">暂无搜索结果</div>
      </div>
    </div>
  </div>

    <!-- 收藏文章：新增 / 编辑弹窗 -->
    <el-dialog
      v-model="favoriteDialogVisible"
      :title="favoriteDialogTitle"
      width="420px"
      @closed="resetFavoriteForm"
    >
      <el-input class="add-item" placeholder="输入文章名称" v-model="favoriteForm.article_name" />
      <el-input
        class="add-item"
        placeholder="输入文章地址"
        v-model="favoriteForm.article_address"
      />
      <!-- <div class="icon-title c-flex-x-start">
        <span>文章 icon（选填）：</span>
        <el-switch v-model="uploadIconType" active-text="上传模式" inactive-text="地址模式" />
      </div> -->
      <!-- <div v-if="uploadIconType">
        <div class="upload-icon-title">请上传 icon 文件（png/jpg/jpeg，≤200KB）</div>
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          accept="image/png,image/jpeg,image/jpg"
          :http-request="handleIconUpload"
        >
          <img
            v-if="favoriteForm.article_iconUrl"
            :src="favoriteForm.article_iconUrl"
            class="avatar"
          />
          <div v-else class="add-icon c-flex-x-center">
            <el-icon><Plus /></el-icon>
          </div>
        </el-upload>
      </div>
      <el-input
        v-else
        class="add-item"
        placeholder="输入文章的 icon 地址"
        v-model="favoriteForm.article_iconUrl"
      /> -->
      <template #footer>
        <el-button @click="favoriteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="favoriteSubmitting" @click="submitFavoriteArticle">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 个人文章：查看 / 编辑抽屉 -->
    <el-drawer
      v-model="editorDrawerVisible"
      :with-header="false"
      direction="rtl"
      size="730px"
      append-to-body
      @closed="handleEditorClosed"
    >
      <div class="online-article-editor">
        <template v-if="personReadOnly">
          <div class="title-part c-flex-x-between">
            <div class="title-text c-ellipsis-single">{{ editorTitle }}</div>
            <el-button link @click="closeEditorDrawer">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div
            class="editor-lookonly ql-snow"
            @click="handleArticleDetailClick"
          >
            <div class="ql-editor" v-html="editorContent"></div>
          </div>
          <div class="btn-groups c-flex-x-end">
            <el-button @click="closeEditorDrawer">返回</el-button>
          </div>
        </template>
        <template v-else>
          <div class="title-part c-flex-x-between">
            <div class="c-flex-x-start title-input-wrap">
              <el-input v-model="editorTitle" placeholder="请输入文章标题" />
              <span v-show="saveTipShow" class="auto-save-tip">
                <span v-if="editorSaving">自动保存中...</span>
                <span v-else class="green">已自动保存</span>
              </span>
            </div>
            <el-button link @click="closeEditorDrawer">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div id="online-doc-quill-editor"></div>
          <div class="btn-groups c-flex-x-end">
            <el-button @click="closeEditorDrawer">取消</el-button>
            <el-button type="primary" :loading="editorSaving" @click="submitPersonalArticle">
              保存
            </el-button>
          </div>
        </template>
      </div>
    </el-drawer>

    <input
      id="online-doc-file-input"
      type="file"
      accept="image/png,image/gif,image/jpeg,image/bmp,image/x-icon"
      @change="onEditorImageChange"
    />

    <Teleport to="body">
      <el-image-viewer
        v-if="previewVisible"
        :url-list="previewUrlList"
        :z-index="4000"
        @close="previewVisible = false"
      />
    </Teleport>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref } from 'vue'
  import { ElImageViewer, ElMessage, ElMessageBox } from 'element-plus'
  import { Close, Plus, Search } from '@element-plus/icons-vue'
  import { debounce } from 'lodash'
  import { onlineDocApi } from '../service/api'
  import { buildArticleShareUrl } from '../documentUrls'
  import { openExternal } from '@/utils/electron'
  import { copyToClipboard } from '@/utils'
  import { appApiCommon } from '@/utils/service'
  import { createQuillEditor, destroyQuillEditor, loadQuill } from '../hooks/useOnlineArticleQuill'

  const documentData = ref([
    { id: 1, text: '个人文章', description: '个人创建的文章', article_type: 1 },
    { id: 2, text: '收藏文章', description: '互联网上的文章', article_type: 2 },
  ])

  const currentId = ref(documentData.value[0]?.id ?? null)
  const articleList = ref([])
  const listLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = 20
  const total = ref(0)
  const listBodyRef = ref(null)
  const searchBodyRef = ref(null)
  const searchValue = ref('')
  const searchShow = ref(false)
  const searchData = ref([])
  const searchLoading = ref(false)

  const favoriteDialogVisible = ref(false)
  const favoriteSubmitting = ref(false)
  const editingFavoriteArticle = ref(null)
  const uploadIconType = ref(false)
  const favoriteForm = ref({
    article_name: '',
    article_address: '',
    article_iconUrl: '',
  })

  const favoriteDialogTitle = computed(() =>
    editingFavoriteArticle.value ? '编辑文章' : '增加文章'
  )

  const editorDrawerVisible = ref(false)
  const personReadOnly = ref(false)
  const editorTitle = ref('')
  const editorContent = ref('')
  const editingArticle = ref(null)
  const editorSaving = ref(false)
  const saveTipShow = ref(false)
  const previewVisible = ref(false)
  const previewUrlList = ref([])
  let quillInstance = null
  let debouncedAutoSave = null

  const documentDataCurrent = computed(() =>
    documentData.value.find(item => item.id === currentId.value)
  )
  const isPersonalType = computed(() => documentDataCurrent.value?.article_type === 1)

  const normalizeArticleList = res => {
    const payload = res?.data ?? res
    if (Array.isArray(payload)) {
      return { list: payload, total: res?.total ?? payload.length }
    }
    if (Array.isArray(payload?.list)) {
      return { list: payload.list, total: payload.total ?? res?.total ?? payload.list.length }
    }
    if (Array.isArray(payload?.rows)) {
      return { list: payload.rows, total: payload.total ?? res?.total ?? payload.rows.length }
    }
    return { list: [], total: 0 }
  }

  const getArticleId = item => item?.article_id ?? item?.id
  const getArticleTitle = item => item?.article_name || item?.title || '未命名文章'

  const formatArticleCreateTime = value => {
    if (value == null || value === '') return ''
    const pad = n => String(n).padStart(2, '0')
    let date
    if (typeof value === 'number') {
      const ts = value < 1e12 ? value * 1000 : value
      date = new Date(ts)
    } else if (typeof value === 'string') {
      const num = Number(value)
      if (!Number.isNaN(num) && /^\d+$/.test(value.trim())) {
        const ts = num < 1e12 ? num * 1000 : num
        date = new Date(ts)
      } else {
        date = new Date(value.replace(/-/g, '/'))
      }
    } else {
      return ''
    }
    if (Number.isNaN(date.getTime())) return ''
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const getArticleCreateTime = item =>
    formatArticleCreateTime(
      item?.create_time ?? item?.article_create_time ?? item?.add_time ?? item?.createTime
    )

  const isPersonalArticle = item => Number(item?.article_type) === 1
  const getSearchResultTitle = item => {
    const name = getArticleTitle(item)
    return isPersonalArticle(item) ? `"个人文章"-${name}` : `"收藏文章"-${name}`
  }

  const copyArticleShareLink = async item => {
    const articleId = getArticleId(item)
    if (!articleId) {
      ElMessage.warning('文章 ID 无效')
      return
    }

    const shareUrl = buildArticleShareUrl(articleId)
    try {
      await copyToClipboard(shareUrl)
      ElMessage.success('复制成功')
    } catch (error) {
      console.error('[OnlineDoc] 复制分享链接失败:', error)
      ElMessage.error('复制失败')
    }
  }

  const searchArticles = async (options = {}) => {
    const silent = options?.silent === true
    const keyword = searchValue.value.trim()
    if (!keyword) {
      closeSearch()
      return
    }

    if (!silent) {
      searchLoading.value = true
    }
    try {
      const res = await onlineDocApi.searchArticle({ keyword })
      searchData.value = Array.isArray(res?.data) ? res.data : []
      searchShow.value = true
    } catch (e) {
      console.error(e)
      searchData.value = []
    } finally {
      if (!silent) {
        searchLoading.value = false
      }
      await nextTick()
      scrollSearchToTop()
    }
  }

  const closeSearch = () => {
    searchShow.value = false
    searchValue.value = ''
    searchData.value = []
  }

  const scrollListToTop = () => {
    listBodyRef.value?.scrollTo({ top: 0 })
  }

  const scrollSearchToTop = () => {
    searchBodyRef.value?.scrollTo({ top: 0 })
  }

  const handlePageChange = async page => {
    currentPage.value = page
    await loadArticleList()
    scrollListToTop()
  }

  const loadArticleList = async (options = {}) => {
    const silent = options?.silent === true
    const group = documentDataCurrent.value
    if (!group?.article_type) {
      articleList.value = []
      total.value = 0
      return
    }

    if (!silent) {
      listLoading.value = true
    }
    try {
      const res = await onlineDocApi.getArticleList({
        article_type: group.article_type,
        limit: pageSize,
        page: currentPage.value,
      })
      const { list, total: count } = normalizeArticleList(res)
      articleList.value = list
      total.value = count
    } catch (e) {
      console.error(e)
      articleList.value = []
      total.value = 0
    } finally {
      if (!silent) {
        listLoading.value = false
      }
    }
  }

  const setDocumentDataCurrentById = id => {
    if (currentId.value === id) return
    closeSearch()
    currentId.value = id
    currentPage.value = 1
    loadArticleList()
  }

  const lookFavoriteArticle = item => {
    const url = item?.article_address
    if (!url) {
      ElMessage.warning('该文章暂无访问链接')
      return
    }
    openExternal(url)
  }

  const openFavoriteDialog = () => {
    editingFavoriteArticle.value = null
    resetFavoriteForm()
    favoriteDialogVisible.value = true
  }

  const editFavoriteArticle = item => {
    editingFavoriteArticle.value = item
    favoriteForm.value = {
      article_name: item?.article_name || '',
      article_address: item?.article_address || '',
      article_iconUrl: item?.article_iconUrl || '',
    }
    favoriteDialogVisible.value = true
  }

  const resetFavoriteForm = () => {
    favoriteForm.value = { article_name: '', article_address: '', article_iconUrl: '' }
    editingFavoriteArticle.value = null
    uploadIconType.value = false
  }

  const handleIconUpload = async ({ file }) => {
    const isLt200k = file.size / 1024 < 200
    if (!isLt200k) {
      ElMessage.warning('上传 icon 图片大小不能超过 200KB')
      return
    }
    try {
      const res = await appApiCommon.uploadImg({ filename: file })
      favoriteForm.value.article_iconUrl = res?.data?.url || ''
    } catch (e) {
      console.error(e)
    }
  }

  const submitFavoriteArticle = async () => {
    if (!favoriteForm.value.article_name.trim()) {
      ElMessage.warning('请输入文章名称')
      return
    }
    if (!favoriteForm.value.article_address.trim()) {
      ElMessage.warning('请输入文章地址')
      return
    }

    favoriteSubmitting.value = true
    try {
      const payload = {
        article_name: favoriteForm.value.article_name.trim(),
        article_address: favoriteForm.value.article_address.trim(),
        article_iconUrl: favoriteForm.value.article_iconUrl,
      }

      if (editingFavoriteArticle.value) {
        const articleId = getArticleId(editingFavoriteArticle.value)
        if (!articleId) return
        await onlineDocApi.updateArticle({
          article_id: articleId,
          ...payload,
        })
      } else {
        await onlineDocApi.addArticle({
          ...payload,
          article_type: 2,
        })
      }

      ElMessage.success('操作成功')
      favoriteDialogVisible.value = false
      if (searchShow.value) {
        loadArticleList({ silent: true })
        await searchArticles({ silent: true })
      } else {
        loadArticleList()
      }
    } catch (e) {
      console.error(e)
    } finally {
      favoriteSubmitting.value = false
    }
  }

  const deleteArticle = async item => {
    const articleId = getArticleId(item)
    if (!articleId) return

    try {
      await ElMessageBox.confirm('此操作将永久删除该文章，是否继续？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await onlineDocApi.removeArticle({ article_id: articleId })
      ElMessage.success('操作成功')
      loadArticleList()
    } catch (e) {
      if (e !== 'cancel') console.error(e)
    }
  }

  const destroyQuill = () => {
    debouncedAutoSave?.cancel?.()
    debouncedAutoSave = null
    destroyQuillEditor(quillInstance, 'online-doc-quill-editor')
    quillInstance = null
  }

  const getQuillHtml = () => {
    if (!quillInstance) return ''
    return quillInstance.root?.innerHTML || ''
  }

  const autoSavePersonalArticle = async html => {
    if (!editingArticle.value?.article_id) return
    editorSaving.value = true
    saveTipShow.value = true
    try {
      await onlineDocApi.updateArticle({
        article_id: editingArticle.value.article_id,
        article_name: editorTitle.value,
        article_content: html,
      })
    } catch (e) {
      console.error(e)
    } finally {
      editorSaving.value = false
      setTimeout(() => {
        saveTipShow.value = false
      }, 1500)
    }
  }

  const initPersonalEditor = async (content = '') => {
    await nextTick()
    destroyQuill()

    debouncedAutoSave = debounce(() => {
      if (editingArticle.value?.article_id) {
        autoSavePersonalArticle(getQuillHtml())
      }
    }, 1000)

    quillInstance = createQuillEditor('#online-doc-quill-editor', {
      content,
      onTextChange: debouncedAutoSave,
      onImageClick: () => document.getElementById('online-doc-file-input')?.click(),
      onContentClick: handleQuillEditorClick,
    })
  }

  const openPersonalEditor = async ({ item = null, readOnly = false } = {}) => {
    personReadOnly.value = readOnly
    editingArticle.value = item
    editorTitle.value = item?.article_name || ''
    editorContent.value = item?.article_content || ''
    editorDrawerVisible.value = true

    if (!readOnly) {
      await nextTick()
      await initPersonalEditor(item?.article_content || '')
    }
  }

  const handleQuillEditorClick = event => {
    const img = event.target?.closest?.('img')
    if (img) {
      const src = img.getAttribute('src')
      if (src) {
        event.preventDefault()
        event.stopPropagation()
        previewUrlList.value = [src]
        previewVisible.value = true
      }
      return
    }

    const previewLink = event.target?.closest?.('.ql-tooltip a.ql-preview')
    if (previewLink) {
      const href = previewLink.getAttribute('href')
      if (href && href !== '#') {
        event.preventDefault()
        event.stopPropagation()
        openExternal(href)
      }
    }
  }

  const handleArticleDetailClick = event => {
    const img = event.target?.closest?.('img')
    if (img) {
      const src = img.getAttribute('src')
      if (src) {
        event.preventDefault()
        event.stopPropagation()
        previewUrlList.value = [src]
        previewVisible.value = true
      }
      return
    }

    const link = event.target?.closest?.('a')
    if (link) {
      if (link.classList.contains('ql-action') || link.classList.contains('ql-remove')) return
      const href = link.getAttribute('href')
      if (href && href !== '#') {
        event.preventDefault()
        event.stopPropagation()
        openExternal(href)
      }
    }
  }

  const lookPersonalArticle = item => openPersonalEditor({ item, readOnly: true })
  const editPersonalArticle = item => openPersonalEditor({ item, readOnly: false })
  const addPersonalArticle = () => openPersonalEditor({ item: null, readOnly: false })

  const onEditorImageChange = async event => {
    const files = event.target?.files
    if (!files?.length || !quillInstance) return
    if (files[0].size > 1024 * 1024 * 2) {
      ElMessage.error('图片大小不能超过 2M')
      return
    }
    try {
      const res = await appApiCommon.uploadImg({ filename: files[0] })
      const url = res?.data?.url
      if (!url) return
      const selection = quillInstance.getSelection(true)
      quillInstance.insertEmbed(selection.index, 'image', url)
      quillInstance.setSelection(selection.index + 1, 0)
    } catch (e) {
      console.error(e)
    } finally {
      event.target.value = ''
    }
  }

  const submitPersonalArticle = async () => {
    const html = getQuillHtml()
    if (html === '<p><br></p>' || !html.trim()) {
      ElMessage.warning('保存的文章内容不可为空')
      return
    }
    if (!editorTitle.value.trim()) {
      ElMessage.warning('请输入文章标题')
      return
    }

    editorSaving.value = true
    try {
      if (editingArticle.value?.article_id) {
        await onlineDocApi.updateArticle({
          article_id: editingArticle.value.article_id,
          article_name: editorTitle.value.trim(),
          article_content: html,
        })
      } else {
        await onlineDocApi.addArticle({
          article_name: editorTitle.value.trim(),
          article_content: html,
          article_type: 1,
        })
      }
      ElMessage.success('保存成功')
      editorDrawerVisible.value = false
      if (searchShow.value) {
        loadArticleList({ silent: true })
        await searchArticles({ silent: true })
      } else {
        loadArticleList()
      }
    } catch (e) {
      console.error(e)
    } finally {
      editorSaving.value = false
    }
  }

  const closeEditorDrawer = () => {
    editorDrawerVisible.value = false
  }

  const handleEditorClosed = () => {
    destroyQuill()
    editingArticle.value = null
    editorTitle.value = ''
    editorContent.value = ''
    personReadOnly.value = false
    saveTipShow.value = false
    previewVisible.value = false
    previewUrlList.value = []
  }

  onMounted(async () => {
    await loadQuill()
    loadArticleList()
  })
</script>

<style lang="scss" scoped>
  .online-doc-panel {
    --doc-bg: #121212;
    --doc-bg-elevated: #1a1a1a;
    --doc-bg-panel: #1e1e1e;
    --doc-border: #2e2e2e;
    --doc-text: #e0e0e0;
    --doc-text-muted: #bdbdbd;
    --doc-text-dim: #9e9e9e;
    --doc-accent: #90caf9;
    --doc-accent-soft: #1e3a5f;
    --doc-hover: #252525;
    --doc-radius: 8px;
    --doc-radius-sm: 6px;
    --doc-transition: 0.18s ease;

    display: flex;
    flex-direction: column;
    width: 100%;
    height: calc(100vh - 180px);

    .online-doc-toolbar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;

      .online-doc-toolbar-content {
        flex: 1;
        min-width: 0;
        align-items: center;
        gap: 12px;
      }

      .online-doc-search-input {
        flex: 1;
        max-width: 500px;

        :deep(.el-input__wrapper) {
          background: var(--doc-hover);
          box-shadow: none;
          border-radius: var(--doc-radius-sm);
        }

        :deep(.el-input__inner) {
          color: var(--doc-text);
        }

        :deep(.el-input__prefix) {
          color: var(--doc-text-dim);
        }
      }

      .online-doc-toolbar-actions {
        flex-shrink: 0;
        margin-left: auto;

        :deep(.el-button) {
          border-radius: var(--doc-radius-sm);
        }
      }
    }

    .online-doc-main {
      flex: 1;
      min-height: 0;
      position: relative;
      align-items: stretch;
      gap: 10px;
    }

    .search-part {
      position: absolute;
      inset: 0;
      z-index: 30;
      overflow: hidden;
      padding: 44px 10px 10px;
      transform: translateY(-110%);
      transition: transform 0.18s ease;
      pointer-events: none;
      background: rgba(18, 18, 18, 0.96);
      border: 1px solid var(--doc-border);
      border-radius: var(--doc-radius);

      &.show {
        transform: translateY(0);
        pointer-events: auto;
      }

      .search-part-close {
        position: absolute;
        top: 6px;
        right: 10px;
        z-index: 3;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 1px solid var(--doc-border);
        background: var(--doc-hover);
        color: var(--doc-text-muted);
        box-shadow: none;

        :deep(.el-icon) {
          font-size: 22px;
        }

        &:hover {
          background: var(--doc-accent-soft);
          border-color: #3d5a80;
          color: var(--doc-accent);
        }
      }

      .search-part-body {
        position: relative;
        z-index: 2;
        height: 100%;
        overflow-y: auto;
        padding: 10px 0;
      }

      .document-content-empty {
        padding: 40px 0;
        text-align: center;
        color: var(--doc-text-dim);
        font-size: 14px;
      }
    }
  }

  .document-content {
    align-items: stretch;
    width: 100%;
    height: 100%;
    gap: 10px;

    .always-use {
      flex-shrink: 0;
      margin-right: 12px;
      background-color: #1a1a1a;
      height: 100%;
      padding: 10px 0;
      border-radius: 8px;
      width: 0;
      overflow: hidden;
      border: 1px solid #2e2e2e;
      transition: width 0.3s cubic-bezier(0.45, 0.04, 0.08, 2.29);
      display: flex;
      flex-direction: column;

      &.always-use-show {
        width: 150px;
      }

      .always-use-title {
        position: relative;
        font-size: 15px;
        font-weight: 600;
        color: #f0f0f0;
        width: 100%;
        padding: 3px 10px 8px;
        margin-bottom: 10px;
        border-bottom: 1px solid #2e2e2e;
      }

      .always-use-content {
        flex: 1;
        overflow-y: auto;
        padding-top: 7px;
        width: 100%;

        .always-use-item {
          margin-bottom: 8px;
          padding: 0 8px;

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
              line-height: 22px;
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
            }
          }
        }
      }
    }

    .document-content-list-wrap {
      flex: 1;
      min-width: 0;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .document-content-list-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 8px 2px 2px 2px;
      }

      .document-content-empty {
        padding: 40px 0;
        text-align: center;
        color: var(--doc-text-dim);
        font-size: 14px;
      }

      .document-content-pagination {
        flex-shrink: 0;
        margin-top: 12px;

        :deep(.el-pagination.is-background .el-pager li) {
          background: var(--doc-hover);
          color: var(--doc-text-muted);
        }

        :deep(.el-pagination.is-background .el-pager li.is-active) {
          background: var(--doc-accent-soft);
          color: var(--doc-accent);
        }
      }

      .document-content-item {
        margin-bottom: 8px;
        padding: 12px 14px;
        background: var(--doc-bg-panel);
        border: 1px solid var(--doc-border);
        border-radius: var(--doc-radius);
        transform: translateY(0);
        transition: all 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

        &:hover {
          border-color: #3a3a3a;
          background: #252525;
          transform: translateY(-4px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
        }

        .document-content-item-main {
          flex: 1;
          min-width: 0;
          margin-right: 12px;
        }

        .document-content-item-title {
          color: var(--doc-text);
          font-size: 14px;
        }

        .document-content-item-time {
          margin-top: 4px;
          font-size: 12px;
          color: var(--doc-text-dim);
        }

        .document-content-item-btns {
          flex-shrink: 0;
          gap: 6px;

          .btn {
            margin: 0;
            background: var(--doc-hover);
            border: 1px solid var(--doc-border);
            border-radius: var(--doc-radius-sm);
            color: var(--doc-text-muted);
            box-shadow: none;
            transition:
              background var(--doc-transition),
              color var(--doc-transition),
              border-color var(--doc-transition);

            &:hover {
              color: var(--doc-accent);
              border-color: #3d5a80;
              background: var(--doc-accent-soft);
            }
          }
        }
      }
    }
  }

  .search-part .document-content-item {
    margin-bottom: 8px;
    padding: 12px 14px;
    background: var(--doc-bg-panel);
    border: 1px solid var(--doc-border);
    border-radius: var(--doc-radius);
    transform: translateY(0);
    transition: all 0.25s cubic-bezier(0.45, 0.04, 0.08, 2.29);

    &:hover {
      border-color: #3a3a3a;
      background: #252525;
      transform: translateY(-4px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
    }

    .document-content-item-title {
      color: var(--doc-text);
    }

    .document-content-item-time {
      margin-top: 4px;
      font-size: 12px;
      color: var(--doc-text-dim);
    }

    .document-content-item-btns .btn {
      margin: 0;
      background: var(--doc-hover);
      border: 1px solid var(--doc-border);
      border-radius: var(--doc-radius-sm);
      color: var(--doc-text-muted);
      box-shadow: none;

      &:hover {
        color: var(--doc-accent);
        border-color: #3d5a80;
        background: var(--doc-accent-soft);
      }
    }
  }

  .add-item {
    margin-bottom: 10px;
  }

  .icon-title {
    margin-bottom: 10px;
    gap: 10px;
    align-items: center;
  }

  .upload-icon-title {
    margin-bottom: 10px;
    font-size: 13px;
    color: var(--doc-text-dim);
  }

  .avatar-uploader {
    .avatar {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--doc-radius-sm);
    }

    .add-icon {
      width: 50px;
      height: 50px;
      border: 1px dashed var(--doc-border);
      border-radius: var(--doc-radius-sm);
    }
  }

  #online-doc-file-input {
    display: none;
  }

  .online-article-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: #e0e0e0;

    .ql-snow {
      color: #e0e0e0;

      &.editor-lookonly {
        color: #e0e0e0;
        font-size: 13px;

        :deep(.ql-editor) {
          img {
            cursor: zoom-in;
          }

          a {
            cursor: pointer;
            color: #90caf9;
            text-decoration: underline;
          }
        }
      }
    }

    .title-part {
      padding: 12px 16px;
      border-bottom: 1px solid #2e2e2e;
      background: #1e1e1e;

      .title-text {
        flex: 1;
        font-size: 18px;
        font-weight: 600;
        margin-right: 12px;
        color: #f0f0f0;
      }

      .title-input-wrap {
        flex: 1;
        gap: 10px;
        margin-right: 12px;

        :deep(.el-input__wrapper) {
          background: #252525;
          box-shadow: none;
          border-radius: 6px;
        }

        :deep(.el-input__inner) {
          color: #e0e0e0;

          &::placeholder {
            color: #ffffff;
          }
        }
      }

      .auto-save-tip {
        font-size: 13px;
        white-space: nowrap;
        color: #9e9e9e;

        .green {
          color: #66bb6a;
        }
      }
    }

    .editor-lookonly {
      flex: 1;
      overflow-y: auto;
      border-bottom: 1px solid #2e2e2e;
      background: #121212;
    }

    #online-doc-quill-editor {
      flex: 1;
      min-height: 0;
      background: #121212;
      border-bottom: 1px solid #2e2e2e;
      color: #e0e0e0;

      :deep(.ql-toolbar) {
        background: #1e1e1e;
        border-color: #2e2e2e;
      }

      :deep(.ql-container) {
        height: calc(100vh - 180px);
        border-color: #2e2e2e;
      }

      :deep(.ql-editor) {
        color: #e0e0e0;

        &.ql-blank::before {
          color: #ffffff;
          font-style: normal;
        }

        img {
          cursor: zoom-in;
        }

        a {
          cursor: pointer;
          color: #90caf9;
          text-decoration: underline;
        }
      }

      :deep(.ql-tooltip) {
        background: #252525;
        border-color: #3a3a3a;
        color: #e0e0e0;

        a.ql-preview {
          cursor: pointer;
          color: #90caf9;
          text-decoration: underline;
        }
      }
    }

    .btn-groups {
      padding: 12px 16px;
      gap: 10px;
      background: #1e1e1e;
      border-top: 1px solid #2e2e2e;
    }
  }

  :deep(.el-button--primary.is-loading) {
    [class*='el-icon'] {
      position: relative;
      z-index: 2;
      color: #fff;
    }

    > span {
      position: relative;
      z-index: 2;
    }
  }
</style>
