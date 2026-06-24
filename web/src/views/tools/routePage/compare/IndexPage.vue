<template>
  <div class="index-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">列表管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon style="color: #ffffff"><Plus /></el-icon>
          新增
        </el-button>
      </div>
    </div>

    <!-- 列表内容 -->
    <div class="page-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入名称或描述进行搜索"
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table
        ref="tableRef"
        :data="filteredTableData"
        stripe
        border
        style="width: 100%"
        v-loading="loading"
        :header-cell-style="{ background: 'var(--el-table-header-bg-color)' }"
        class="resizable-table"
      >
        <el-table-column
          prop="id"
          label="ID"
          :width="columnWidths.id"
          align="center"
        />
        <el-table-column
          prop="name"
          label="名称"
          :width="columnWidths.name"
          show-overflow-tooltip
        />
        <el-table-column
          prop="description"
          label="描述"
          show-overflow-tooltip
        />
        <el-table-column
          prop="status"
          label="状态"
          :width="columnWidths.status"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          :width="columnWidths.createTime"
          align="center"
        />
        <el-table-column
          label="操作"
          :width="columnWidths.action"
          align="center"
          fixed="right"
        >
          <template #default="{ row, $index }">
            <el-button link type="primary" size="small" @click="handleView(row, $index)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row, $index)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row, $index)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && filteredTableData.length === 0"
        :description="searchKeyword ? '未找到匹配的数据' : '暂无数据'"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑' : '新增'"
      width="90vw"
      top="5vh"
      :close-on-click-modal="false"
      fullscreen
      class="edit-dialog"
    >
      <div class="dialog-content">
        <!-- 基本信息表单 -->
        <el-form :model="formData" :rules="formRules" ref="formRef" label-width="56px" class="form-section">
          <div class="form-section__row">
            <el-form-item label="名称" prop="name" class="form-section__name">
              <el-input v-model="formData.name" placeholder="请输入名称" />
            </el-form-item>
            <el-form-item label="描述" prop="description" class="form-section__desc">
              <el-input v-model="formData.description" placeholder="请输入描述" />
            </el-form-item>
          </div>
        </el-form>

        <!-- JSON比对组件 -->
        <div class="compare-section">
          <h3 class="section-title">{{ formData.name }}-JSON比对</h3>
          <ResponseCompare
            ref="responseCompareRef"
            :initial-left-json="formData.leftJson"
            :initial-right-json="formData.rightJson"
            :readonly="false"
            :hide-diff-list="true"
            :hide-diff-stats="true"
            @update:leftJson="handleLeftJsonUpdate"
            @update:rightJson="handleRightJsonUpdate"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="viewDialogTitle"
      width="90vw"
      top="5vh"
      fullscreen
      class="view-dialog"
    >
      <div class="dialog-content view-dialog-content">
        <JsonGitDiff
          :left-json="viewData.leftJson"
          :right-json="viewData.rightJson"
          :left-label="`变更前 (${viewData.id || '-'})`"
          :right-label="`变更后 (${viewData.name || '-'})`"
        />
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Plus, Edit, Delete, View, Search } from '@element-plus/icons-vue'
  import ResponseCompare from './ResponseCompare.vue'
  import JsonGitDiff from './JsonGitDiff.vue'

  import SqlOperate from '@/utils/sqlOperate'
  const SqlOperateClient = new SqlOperate('dataSql/apiCompareList.json')

  // 列表数据
  const tableData = ref([])
  const loading = ref(false)
  const searchKeyword = ref('')

  // 列宽度配置（可动态调整）
  const columnWidths = reactive({
    id: 200,
    name: 200,
    description: 250,
    status: 100,
    createTime: 180,
    action: 200,
  })

  // 弹窗控制
  const dialogVisible = ref(false)
  const viewDialogVisible = ref(false)
  const isEdit = ref(false)
  const submitLoading = ref(false)
  const formRef = ref(null)

  // 表单数据
  const formData = reactive({
    id: null,
    name: '',
    description: '',
    status: 'active',
    leftJson: '',
    rightJson: '',
  })

  // 查看数据
  const viewData = ref({
    id: '',
    name: '',
    description: '',
    status: '',
    createTime: '',
    leftJson: '',
    rightJson: '',
  })

  // 组件引用
  const responseCompareRef = ref(null)
  const tableRef = ref(null)

  const viewDialogTitle = computed(() => {
    const name = viewData.value.name || viewData.value.id || 'JSON'
    return `版本差异: ${name}`
  })

  // 表单验证规则
  const formRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    ],
    description: [{ max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  }

  // 过滤后的列表数据
  const filteredTableData = computed(() => {
    if (!searchKeyword.value.trim()) {
      return tableData.value
    }
    const keyword = searchKeyword.value.toLowerCase().trim()
    return tableData.value.filter((item) => {
      const name = (item.name || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return name.includes(keyword) || description.includes(keyword)
    })
  })

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // 加载列表数据
  const loadData = async () => {
    loading.value = true
    try {
      // 使用 SqlOperateClient 读取数据
      const data = await SqlOperateClient.readAll()
      tableData.value = Array.isArray(data) ? data : []
      loading.value = false
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
      loading.value = false
    }
  }

  // 新增
  const handleAdd = () => {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }

  // 查看
  const handleView = (row, index) => {
    viewData.value = {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createTime: row.createTime,
      leftJson: row.leftJson || '',
      rightJson: row.rightJson || '',
    }
    viewDialogVisible.value = true
  }

  // 编辑
  const handleEdit = (row, index) => {
    isEdit.value = true
    formData.id = row.id
    formData.name = row.name
    formData.description = row.description
    formData.status = row.status
    formData.leftJson = row.leftJson || ''
    formData.rightJson = row.rightJson || ''
    dialogVisible.value = true
    // 等待弹窗渲染后更新组件数据
    nextTick(() => {
      if (responseCompareRef.value) {
        responseCompareRef.value.setLeftContent(formData.leftJson)
        responseCompareRef.value.setRightContent(formData.rightJson)
      }
    })
  }

  // 删除
  const handleDelete = async (row, index) => {
    try {
      await ElMessageBox.confirm(`确定要删除"${row.name || row.id}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })

      // 使用 SqlOperateClient 删除数据
      await SqlOperateClient.remove(row.id)

      // 重新加载列表数据
      await loadData()

      ElMessage.success('删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
  }

  // JSON更新处理
  const handleLeftJsonUpdate = (json) => {
    formData.leftJson = json
  }

  const handleRightJsonUpdate = (json) => {
    formData.rightJson = json
  }

  // 重置表单
  const resetForm = () => {
    formData.id = null
    formData.name = ''
    formData.description = ''
    formData.status = 'active'
    formData.leftJson = ''
    formData.rightJson = ''
    formRef.value?.clearValidate()
  }

  // 取消
  const handleCancel = () => {
    dialogVisible.value = false
    resetForm()
  }

  // 提交
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      submitLoading.value = true
      try {
        // 获取JSON比对组件的数据
        let leftJson = formData.leftJson
        let rightJson = formData.rightJson
        if (responseCompareRef.value) {
          leftJson = responseCompareRef.value.getLeftContent() || ''
          rightJson = responseCompareRef.value.getRightContent() || ''
        }

        let result
        if (isEdit.value) {
          // 编辑模式：更新数据
          const updateData = {
            ...formData,
            leftJson,
            rightJson,
          }
          result = await SqlOperateClient.update(formData.id, updateData)
          ElMessage.success('编辑成功')
        } else {
          // 新增模式：创建新数据
          const newItem = {
            ...formData,
            leftJson,
            rightJson,
            createTime: formatDate(new Date()),
          }
          result = await SqlOperateClient.create(newItem)
          ElMessage.success('新增成功')
        }

        // 重新加载列表数据
        await loadData()

        submitLoading.value = false
        dialogVisible.value = false
        resetForm()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
        submitLoading.value = false
      }
    })
  }

  // 列宽调整相关
  const resizingColumn = ref(null)
  const resizingStartX = ref(0)
  const resizingStartWidth = ref(0)

  // 初始化列宽拖拽调整
  const initColumnResize = () => {
    nextTick(() => {
      if (!tableRef.value) return

      const tableEl = tableRef.value.$el
      const headerCells = tableEl.querySelectorAll('.el-table__header-wrapper th')

      headerCells.forEach((th, index) => {
        // 跳过最后一列（操作列，fixed）或已存在 resizer 的列
        if (index === headerCells.length - 1 || th.querySelector('.column-resizer')) {
          return
        }

        const resizer = document.createElement('div')
        resizer.className = 'column-resizer'
        resizer.style.cssText = `
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: col-resize;
          z-index: 10;
          background: transparent;
        `
        th.style.position = 'relative'
        th.appendChild(resizer)

        resizer.addEventListener('mousedown', (e) => {
          e.preventDefault()
          e.stopPropagation()

          resizingColumn.value = index
          resizingStartX.value = e.clientX

          const columnKeys = ['id', 'name', 'description', 'status', 'createTime', 'action']
          resizingStartWidth.value = columnWidths[columnKeys[index]] || 200

          document.addEventListener('mousemove', handleResizeMove)
          document.addEventListener('mouseup', handleResizeEnd)

          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        })
      })
    })
  }

  // 处理拖拽移动
  const handleResizeMove = (e) => {
    if (resizingColumn.value === null) return

    const deltaX = e.clientX - resizingStartX.value
    const newWidth = Math.max(50, resizingStartWidth.value + deltaX)

    const columnKeys = ['id', 'name', 'description', 'status', 'createTime', 'action']
    const columnKey = columnKeys[resizingColumn.value]

    if (columnKey && columnWidths[columnKey] !== undefined) {
      columnWidths[columnKey] = newWidth
    }
  }

  // 处理拖拽结束
  const handleResizeEnd = () => {
    if (resizingColumn.value !== null) {
      // 保存到本地存储
      try {
        localStorage.setItem('apiCompare_columnWidths', JSON.stringify(columnWidths))
      } catch (e) {
        console.warn('保存列宽配置失败:', e)
      }
    }

    resizingColumn.value = null
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  // 加载保存的列宽配置
  const loadColumnWidths = () => {
    try {
      const saved = localStorage.getItem('apiCompare_columnWidths')
      if (saved) {
        const savedWidths = JSON.parse(saved)
        Object.assign(columnWidths, savedWidths)
      }
    } catch (e) {
      console.warn('加载列宽配置失败:', e)
    }
  }

  // 初始化
  onMounted(() => {
    loadColumnWidths()
    loadData()

    // 等待DOM渲染完成后初始化列宽调整功能
    nextTick(() => {
      setTimeout(() => {
        initColumnResize()
      }, 300)
    })

    // 监听窗口大小变化，重新初始化
    const handleResize = () => {
      nextTick(() => {
        initColumnResize()
      })
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', initColumnResize)
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  })
</script>

<style lang="scss" scoped>
  .index-page {
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

    padding: 12px 14px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--cmp-bg);
    color: var(--cmp-text);
    border-radius: var(--cmp-radius);
    overflow: hidden;

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--cmp-border);
      flex-shrink: 0;

      .page-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #f0f0f0;
      }

      .header-right {
        display: flex;
        gap: 8px;
      }
    }

    .page-content {
      flex: 1;
      overflow: auto;
      background: var(--cmp-bg-elevated);
      border-radius: var(--cmp-radius);
      border: 1px solid var(--cmp-border);
      padding: 14px;
      display: flex;
      flex-direction: column;

      .search-bar {
        margin-bottom: 12px;
        display: flex;
        align-items: center;

        :deep(.el-input__wrapper) {
          background: var(--cmp-hover);
          box-shadow: none;
          border-radius: var(--cmp-radius-sm);

          &:hover,
          &.is-focus {
            background: #2a2a2a;
            box-shadow: none;
          }
        }
      }

      :deep(.resizable-table) {
        --el-table-bg-color: var(--cmp-bg-panel);
        --el-table-tr-bg-color: var(--cmp-bg-panel);
        --el-table-header-bg-color: var(--cmp-hover);
        --el-table-row-hover-bg-color: #2a2a2a;
        --el-table-border-color: var(--cmp-border);
        --el-table-text-color: var(--cmp-text);
        --el-table-header-text-color: var(--cmp-text-muted);
        border-radius: var(--cmp-radius-sm);
        overflow: hidden;

        .el-table__header-wrapper .el-table__header th {
          position: relative;
          border-color: var(--cmp-border);

          .column-resizer {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            cursor: col-resize;
            z-index: 10;
            background: transparent;
            transition: background var(--cmp-transition);

            &:hover {
              background: var(--cmp-accent);
            }
          }

          &:last-child .column-resizer {
            display: none;
          }
        }

        td.el-table__cell {
          border-color: var(--cmp-border);
        }
      }

      :deep(.el-empty__description) {
        color: var(--cmp-text-muted);
      }
    }
  }

  :deep(.edit-dialog),
  :deep(.view-dialog) {
    .el-dialog {
      background: var(--cmp-bg-elevated, #1a1a1a);
      border: 1px solid var(--cmp-border, #2e2e2e);
    }

    .el-dialog__header {
      border-bottom: 1px solid #2e2e2e;
      padding: 14px 20px;

      .el-dialog__title {
        color: #f0f0f0;
        font-weight: 600;
        font-size: 15px;
      }
    }

    .el-dialog__footer {
      border-top: 1px solid #2e2e2e;
    }

    .el-dialog__body {
      padding: 16px;
      height: calc(100vh - 170px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #121212;
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .form-section {
        background: #1a1a1a;
        padding: 14px 16px;
        border-radius: 8px;
        border: 1px solid #2e2e2e;
        flex-shrink: 0;

        :deep(.el-form-item__label) {
          color: #bdbdbd;
        }

        :deep(.el-input__wrapper) {
          background: #252525;
          box-shadow: none;
          border-radius: 6px;

          &:hover,
          &.is-focus {
            background: #2a2a2a;
            box-shadow: none;
          }
        }

        &__row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        &__name {
          flex: 0 0 280px;
          margin-bottom: 0;
        }

        &__desc {
          flex: 1;
          min-width: 0;
          margin-bottom: 0;
        }
      }

      .info-section {
        background: #1a1a1a;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #2e2e2e;
      }

      .compare-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        background: #1a1a1a;
        border-radius: 8px;
        border: 1px solid #2e2e2e;
        padding: 12px 14px;

        .section-title {
          margin: 0 0 10px;
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f0;
          flex-shrink: 0;
        }

        :deep(.response-compare) {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;

          .main-content {
            flex: 1;
            min-height: 0;
          }
        }
      }
    }

    .view-dialog-content {
      padding: 0;
      overflow: hidden;
      height: 100%;

      :deep(.json-git-diff) {
        height: 100%;
      }
    }
  }
</style>

