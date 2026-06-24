<template>
  <div class="task-list" @click="openDialog">
    <div class="task-list-header c-flex-x-between">
      <div class="list-title c-flex-x-start">
        <span>待办任务列表</span>
        <span
          v-if="overdueCount > 0"
          class="task-title-alert"
          title="逾期未完成（标红）任务数"
          @click.stop
        >
          {{ overdueCount }}
        </span>
      </div>
      <el-badge :value="pendingCount" :hidden="pendingCount === 0" type="primary">
        <el-icon class="task-icon"><List /></el-icon>
      </el-badge>
    </div>
    <div class="task-preview-wrap" v-loading="previewLoading">
      <div class="task-preview">
        <template v-if="previewTasks.length">
          <div
            v-for="item in previewTasks"
            :key="item.id"
            class="task-preview-item"
            :class="getPreviewItemClass(item)"
            @click.stop="handleEdit(item)"
          >
            <div class="task-preview-accent" />
            <div class="task-preview-body">
              <div class="task-preview-top c-flex-x-start">
                <span v-if="isOverdueMoreThanOneDay(item)" class="task-alert-badge" title="逾期超过1天">!</span>
                <span class="task-preview-title c-ellipsis-single">{{ item.title }}</span>
              </div>
              <div class="task-preview-meta c-flex-x-start">
                <span
                  class="meta-chip meta-due c-flex-x-start"
                  :class="{ 'meta-due--overdue': isOverdue(item), 'meta-due--none': !item.dueTime }"
                >
                  <el-icon class="meta-icon"><Clock /></el-icon>
                  <span>{{ item.dueTime ? formatDueTime(item.dueTime) : '无截止' }}</span>
                </span>
                <span class="meta-chip meta-priority" :class="`meta-priority--${item.priority}`">
                  {{ priorityLabel(item.priority) }}
                </span>
                <span class="meta-chip meta-status" :class="`meta-status--${item.status}`">
                  {{ statusLabel(item.status) }}
                </span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="task-empty">暂无任务，点击管理</div>
      </div>
    </div>
    <div class="task-list-footer">共 {{ taskList.length }} 项 · 点击条目编辑 · 空白处查看全部</div>
  </div>

  <el-dialog
    v-model="dialogVisible"
    title="任务列表"
    width="800px"
    class="home-task-dialog"
    destroy-on-close
    @open="onDialogOpen"
  >
    <div class="task-dialog-toolbar c-flex-x-between">
      <div class="task-dialog-filters c-flex-x-start">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务标题"
          clearable
          class="filter-keyword"
          :prefix-icon="Search"
        />
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          class="filter-select"
        >
          <el-option label="待办" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="done" />
        </el-select>
        <el-select
          v-model="filterPriority"
          placeholder="优先级"
          clearable
          class="filter-select"
        >
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </div>
      <button type="button" class="task-add-btn c-flex-x-center" @click.stop="handleAdd">
        <el-icon class="task-add-btn__icon"><Plus color="#000" /></el-icon>
        <span>新增任务</span>
      </button>
    </div>

    <el-table
      v-loading="tableLoading"
      :data="paginatedDialogTasks"
      stripe
      class="task-table"
    >
      <template #empty>
        <div class="task-table-empty">
          <el-empty :description="emptyTableDescription">
            <template #image>
              <div class="task-empty-illus" aria-hidden="true">
                <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="28"
                    y="12"
                    width="104"
                    height="96"
                    rx="12"
                    stroke="oklch(1 0 0 / 18%)"
                    stroke-width="2"
                    fill="oklch(1 0 0 / 4%)"
                  />
                  <rect x="44" y="8" width="40" height="14" rx="6" fill="oklch(0.72 0.17 145 / 25%)" />
                  <circle cx="48" cy="40" r="5" fill="oklch(0.72 0.17 145 / 50%)" />
                  <rect x="60" y="36" width="56" height="8" rx="4" fill="oklch(1 0 0 / 12%)" />
                  <circle cx="48" cy="62" r="5" fill="oklch(1 0 0 / 10%)" />
                  <rect x="60" y="58" width="48" height="8" rx="4" fill="oklch(1 0 0 / 8%)" />
                  <circle cx="48" cy="84" r="5" stroke="oklch(1 0 0 / 15%)" stroke-width="2" />
                  <rect
                    x="60"
                    y="80"
                    width="40"
                    height="8"
                    rx="4"
                    stroke="oklch(1 0 0 / 10%)"
                    stroke-width="1.5"
                    stroke-dasharray="4 3"
                  />
                  <path
                    d="M108 88 L118 98 L132 78"
                    stroke="#56d364"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    opacity="0.35"
                  />
                </svg>
              </div>
            </template>
            <button
              v-if="!hasActiveFilters"
              type="button"
              class="task-empty-add-link"
              @click="handleAdd"
            >
              + 新增第一条任务
            </button>
          </el-empty>
        </div>
      </template>
      <el-table-column label="标题" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="isOverdueMoreThanOneDay(row)" class="task-alert-mark">!</span>
          <span>{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优先级" width="90">
        <template #default="{ row }">
          <span :class="['priority-dot', `priority-${row.priority}`]">{{ priorityLabel(row.priority) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="截止时间" width="170">
        <template #default="{ row }">
          <span v-if="row.dueTime" :class="{ 'due-overdue': isOverdue(row) }">
            {{ formatDueTime(row.dueTime) }}
          </span>
          <span v-else class="due-empty">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="filteredTasks.length > PAGE_SIZE" class="task-table-pagination c-flex-x-end" @click.stop>
      <el-pagination
        v-model:current-page="dialogPage"
        :page-size="PAGE_SIZE"
        :total="filteredTasks.length"
        layout="total, prev, pager, next"
        small
        background
      />
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="formDialogVisible"
    :title="isEdit ? '编辑任务' : '新增任务'"
    width="480px"
    append-to-body
    destroy-on-close
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入任务标题" maxlength="80" show-word-limit />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="选填"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
          <el-option label="待办" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="done" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
        </el-select>
      </el-form-item>
      <el-form-item label="截止时间" prop="dueTime">
        <el-date-picker
          v-model="formData.dueTime"
          type="datetime"
          placeholder="选填"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY-MM-DD HH:mm"
          style="width: 100%"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="formDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, watch } from 'vue'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import { List, Plus, Edit, Delete, Search, Clock } from '@element-plus/icons-vue'
  import { taskApi, type HomeTask, type TaskPriority, type TaskStatus } from '../service/taskApi'
  import { useCommonStore } from '@/store/common'
  import {
    countOverdueTasks,
    isTaskOverdue,
    parseTaskDueTime,
  } from '../utils/taskOverdue'

  const commonStore = useCommonStore()

  const dialogVisible = ref(false)
  const formDialogVisible = ref(false)
  const isEdit = ref(false)
  const tableLoading = ref(false)
  const previewLoading = ref(false)
  const submitLoading = ref(false)
  const searchKeyword = ref('')
  const filterStatus = ref<TaskStatus | ''>('')
  const filterPriority = ref<TaskPriority | ''>('')
  const taskList = ref<HomeTask[]>([])
  const formRef = ref<FormInstance>()
  const PAGE_SIZE = 6
  const dialogPage = ref(1)

  const formData = reactive({
    id: null as number | null,
    title: '',
    description: '',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueTime: '' as string,
  })

  const formRules: FormRules = {
    title: [
      { required: true, message: '请输入任务标题', trigger: 'blur' },
      { min: 1, max: 80, message: '长度 1-80 个字符', trigger: 'blur' },
    ],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  }

  const pendingCount = computed(
    () => taskList.value.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  )

  const hasActiveFilters = computed(
    () =>
      Boolean(
        searchKeyword.value.trim() || filterStatus.value || filterPriority.value
      )
  )

  const emptyTableDescription = computed(() =>
    hasActiveFilters.value ? '未找到匹配的任务' : '暂无任务'
  )

  const statusLabel = (status: TaskStatus) => {
    const map: Record<TaskStatus, string> = {
      pending: '待办',
      in_progress: '进行中',
      done: '已完成',
    }
    return map[status] || status
  }

  const statusTagType = (status: TaskStatus) => {
    const map: Record<TaskStatus, string> = {
      pending: 'info',
      in_progress: 'warning',
      done: 'success',
    }
    return map[status] || 'info'
  }

  const priorityLabel = (priority: TaskPriority) => {
    const map: Record<TaskPriority, string> = { low: '低', medium: '中', high: '高' }
    return map[priority] || priority
  }

  const priorityTagType = (priority: TaskPriority) => {
    const map: Record<TaskPriority, string> = {
      low: 'info',
      medium: 'warning',
      high: 'danger',
    }
    return map[priority] || 'info'
  }

  const getPreviewItemClass = (item: HomeTask) => ({
    [`priority-${item.priority}`]: true,
    'is-done': item.status === 'done',
    'is-overdue': isOverdue(item),
    'is-critical': isOverdueMoreThanOneDay(item),
  })

  const parseDueTime = parseTaskDueTime
  const isOverdue = isTaskOverdue
  const isOverdueMoreThanOneDay = isTaskOverdue

  const syncHomeOverdueBadge = () => {
    commonStore.updateHomeTaskOverdueCount(countOverdueTasks(taskList.value))
  }

  /** 标红（逾期未完成）任务条数 */
  const overdueCount = computed(() => countOverdueTasks(taskList.value))

  /** 标红（逾期）任务置顶，逾期越久越靠前 */
  const sortTasksByAlert = (list: HomeTask[]) => {
    return [...list].sort((a, b) => {
      const aAlert = isOverdue(a) ? 1 : 0
      const bAlert = isOverdue(b) ? 1 : 0
      if (aAlert !== bAlert) return bAlert - aAlert
      if (aAlert && bAlert) {
        const ta = parseDueTime(a.dueTime) ?? Number.MAX_SAFE_INTEGER
        const tb = parseDueTime(b.dueTime) ?? Number.MAX_SAFE_INTEGER
        return ta - tb
      }
      return 0
    })
  }

  const filteredTasks = computed(() => {
    const kw = searchKeyword.value.trim().toLowerCase()
    let list = taskList.value

    if (kw) {
      list = list.filter(
        t =>
          (t.title || '').toLowerCase().includes(kw) ||
          (t.description || '').toLowerCase().includes(kw)
      )
    }
    if (filterStatus.value) {
      list = list.filter(t => t.status === filterStatus.value)
    }
    if (filterPriority.value) {
      list = list.filter(t => t.priority === filterPriority.value)
    }
    return sortTasksByAlert(list)
  })

  const previewTasks = computed(() => sortTasksByAlert(taskList.value))

  const paginatedDialogTasks = computed(() => {
    const start = (dialogPage.value - 1) * PAGE_SIZE
    return filteredTasks.value.slice(start, start + PAGE_SIZE)
  })

  const clampPage = (page: number, total: number) => {
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1)
    return Math.min(Math.max(1, page), maxPage)
  }

  watch([searchKeyword, filterStatus, filterPriority], () => {
    dialogPage.value = 1
  })

  watch(
    () => filteredTasks.value.length,
    len => {
      dialogPage.value = clampPage(dialogPage.value, len)
    }
  )

  const formatDueTime = (dueTime?: string) => {
    if (!dueTime) return ''
    return dueTime.length >= 16 ? dueTime.slice(0, 16) : dueTime
  }

  const formatDate = (date: Date) => {
    const d = date
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const loadTasks = async () => {
    tableLoading.value = true
    try {
      const data = await taskApi.getTaskList()
      taskList.value = Array.isArray(data) ? data : []
      syncHomeOverdueBadge()
    } catch (e) {
      console.error(e)
      ElMessage.error('加载任务失败')
      taskList.value = []
      syncHomeOverdueBadge()
    } finally {
      tableLoading.value = false
    }
  }

  const loadPreview = async () => {
    previewLoading.value = true
    try {
      const data = await taskApi.getTaskList()
      taskList.value = Array.isArray(data) ? data : []
      syncHomeOverdueBadge()
    } catch (e) {
      console.error(e)
      taskList.value = []
      syncHomeOverdueBadge()
    } finally {
      previewLoading.value = false
    }
  }

  const openDialog = () => {
    dialogVisible.value = true
  }

  const onDialogOpen = () => {
    dialogPage.value = 1
    searchKeyword.value = ''
    filterStatus.value = ''
    filterPriority.value = ''
    loadTasks()
  }

  const resetForm = () => {
    formData.id = null
    formData.title = ''
    formData.description = ''
    formData.status = 'pending'
    formData.priority = 'medium'
    formData.dueTime = ''
    formRef.value?.clearValidate()
  }

  const handleAdd = () => {
    isEdit.value = false
    resetForm()
    formDialogVisible.value = true
  }

  const handleEdit = (row: HomeTask) => {
    isEdit.value = true
    formData.id = row.id
    formData.title = row.title
    formData.description = row.description || ''
    formData.status = row.status
    formData.priority = row.priority
    formData.dueTime = row.dueTime || ''
    formDialogVisible.value = true
  }

  const handleDelete = async (row: HomeTask) => {
    try {
      await ElMessageBox.confirm(`确定要删除任务「${row.title}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await taskApi.removeTask(row.id)
      ElMessage.success('删除成功')
      await loadTasks()
      await loadPreview()
    } catch (e) {
      if (e !== 'cancel') {
        console.error(e)
        ElMessage.error('删除失败')
      }
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async valid => {
      if (!valid) return
      submitLoading.value = true
      try {
        const payload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          priority: formData.priority,
          dueTime: formData.dueTime || '',
        }
        if (isEdit.value && formData.id != null) {
          await taskApi.updateTask(formData.id, payload)
          ElMessage.success('编辑成功')
        } else {
          await taskApi.addTask({
            ...payload,
            createTime: formatDate(new Date()),
          })
          ElMessage.success('新增成功')
        }
        formDialogVisible.value = false
        await loadTasks()
        await loadPreview()
      } catch (e) {
        console.error(e)
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      } finally {
        submitLoading.value = false
      }
    })
  }

  onMounted(() => {
    loadPreview()
  })
</script>

<style lang="scss" scoped>
  .task-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: rgba(66, 185, 131, 0.36);
    }

    .task-list-header {
      flex-shrink: 0;
      margin-bottom: 8px;

      .list-title {
        gap: 4px;
        color: #e0e0e0;
        font-size: 16px;
        font-weight: 600;
      }

      .task-title-alert {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        margin-left: 6px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(255, 122, 122, 0.9);
        box-shadow: 0 0 0 1px rgba(255, 122, 122, 0.2);
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
      }

      .task-icon {
        color: #9a9a9a;
        font-size: 20px;
      }
    }

    .task-preview-wrap {
      position: relative;
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
    }

    .task-preview {
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      padding-right: 10px;
      padding-bottom: 8px;
      box-sizing: border-box;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.18);
      }

      .task-preview-item {
        display: flex;
        align-items: stretch;
        gap: 0;
        margin-bottom: 8px;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          border-color: rgba(66, 185, 131, 0.22);
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(4px);
        }

        &.is-done {
          opacity: 0.72;
        }

        &.is-overdue {
          border-color: rgba(255, 122, 122, 0.28);
        }

        &.is-critical {
          border-color: rgba(255, 122, 122, 0.36);
          background: rgba(255, 122, 122, 0.08);
        }

        .task-preview-accent {
          flex-shrink: 0;
          width: 3px;
          margin-right: 10px;
          border-radius: 10px 0 0 10px;
          background: #909399;
        }

        &.priority-high .task-preview-accent {
          background: #ff7a7a;
        }

        &.priority-medium .task-preview-accent {
          background: #e6a23c;
        }

        &.priority-low .task-preview-accent {
          background: #909399;
        }

        .task-preview-body {
          flex: 1;
          min-width: 0;
        }

        .task-preview-top {
          gap: 6px;
          margin-bottom: 8px;
        }

        .task-preview-title {
          flex: 1;
          min-width: 0;
          color: #f0f0f0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
        }

        .task-alert-badge {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255, 122, 122, 0.9);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 18px;
          text-align: center;
        }

        .task-preview-meta {
          flex-wrap: wrap;
          gap: 6px;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          line-height: 1.4;
          white-space: nowrap;
        }

        .meta-icon {
          font-size: 12px;
        }

        .meta-due {
          color: #a8abb2;
          background: rgba(255, 255, 255, 0.06);

          &--overdue {
            color: #ff7a7a;
            background: rgba(255, 122, 122, 0.12);
          }

          &--none {
            color: #666;
          }
        }

        .meta-priority {
          &--high {
            color: #ff7a7a;
            background: rgba(255, 122, 122, 0.1);
          }

          &--medium {
            color: #e6a23c;
            background: rgba(230, 162, 60, 0.1);
          }

          &--low {
            color: #909399;
            background: rgba(255, 255, 255, 0.06);
          }
        }

        .meta-status {
          &--pending {
            color: #a8abb2;
            background: rgba(255, 255, 255, 0.08);
          }

          &--in_progress {
            color: #e6a23c;
            background: rgba(230, 162, 60, 0.1);
          }

          &--done {
            color: #67c23a;
            background: rgba(103, 194, 58, 0.1);
          }
        }
      }

      .task-empty {
        padding: 12px 0;
        color: #666;
        font-size: 13px;
      }
    }

    .task-list-footer {
      flex-shrink: 0;
      margin-top: 8px;
      color: #666;
      font-size: 12px;
    }
  }

  .task-add-btn {
    flex-shrink: 0;
    height: 32px;
    padding: 0 16px;
    gap: 6px;
    border: 1px solid rgba(66, 185, 131, 0.24);
    border-radius: 10px;
    background: rgba(66, 185, 131, 0.14);
    box-shadow: none;
    color: #7ee2ad;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;

    &__icon {
      font-size: 16px;
    }

    &:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px -14px rgba(66, 185, 131, 0.8);
    }
  }

  .task-dialog-toolbar {
    margin-bottom: 16px;
    gap: 12px;
    align-items: center;

    .task-dialog-filters {
      flex: 1;
      flex-wrap: wrap;
      gap: 8px;
      min-width: 0;
    }

    .filter-keyword {
      width: 200px;
    }

    .filter-select {
      width: 110px;
    }
  }

  .task-table-pagination {
    margin-top: 12px;
  }

  .task-table-empty {
    :deep(.el-empty__description) {
      margin-top: 0;
      color: #909399;
      font-size: 14px;
    }

    :deep(.el-empty__bottom) {
      margin-top: 0;
    }
  }

  .task-empty-illus {
    display: flex;
    justify-content: center;
    width: 160px;
    height: 120px;
    margin: 0 auto;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .task-empty-add-link {
    padding: 0;
    border: none;
    background: transparent;
    color: #7ee2ad;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #91e7bd;
      text-decoration: underline;
    }
  }

  .priority-dot {
    font-size: 13px;

    &.priority-high {
      color: #ff7a7a;
    }
    &.priority-medium {
      color: #e6a23c;
    }
    &.priority-low {
      color: #909399;
    }
  }

  .due-overdue {
    color: #ff7a7a;
  }

  .due-empty {
    color: #666;
  }

  .task-alert-mark {
    margin-right: 4px;
    color: #ff7a7a;
    font-weight: 700;
  }
</style>

<style lang="scss">
  .home-task-dialog {
    .el-dialog__body {
      padding-top: 12px;
    }
  }
</style>
