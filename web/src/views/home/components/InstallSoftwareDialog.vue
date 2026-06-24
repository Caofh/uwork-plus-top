<template>
  <el-dialog
    v-model="visible"
    width="520px"
    class="install-software-dialog"
    destroy-on-close
    :append-to-body="true"
  >
    <template #header>
      <div class="install-software-header c-flex-x-start">
        <span class="install-software-title">{{ title }}</span>
        <a
          v-if="headerLinkUrl && headerLinkText"
          class="install-software-header-link"
          href="#"
          @click.prevent="emit('headerLinkClick', headerLinkUrl)"
        >
          {{ headerLinkText }}
        </a>
      </div>
    </template>
    <div v-if="batchSelectable && list.length" class="install-software-toolbar c-flex-x-between">
      <el-checkbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        :disabled="isBusy || !selectableList.length"
        @change="toggleSelectAll"
      >
        全选
      </el-checkbox>
      <el-button
        type="primary"
        size="small"
        :disabled="isBusy || !selectedItems.length"
        :loading="isBatchInstalling"
        @click="handleBatchInstall"
      >
        批量安装{{ selectedItems.length ? ` (${selectedItems.length})` : '' }}
      </el-button>
    </div>

    <div class="install-software-list">
      <div
        v-for="item in list"
        :key="itemKey(item)"
        class="install-software-item c-flex-x-between"
        :class="{ 'is-selectable': batchSelectable && isSelectable(item) }"
        @click="batchSelectable && isSelectable(item) && !isBusy ? toggleItem(item) : undefined"
      >
        <div class="install-software-item-left c-flex-x-start">
          <el-checkbox
            v-if="batchSelectable && isSelectable(item)"
            :model-value="isSelected(item)"
            :disabled="isBusy"
            class="install-software-checkbox"
            @click.stop
            @change="(checked: boolean | string | number) => setItemSelected(item, Boolean(checked))"
          />
          <span class="install-software-name">{{ item.name }}</span>
        </div>
        <el-button
          type="primary"
          size="small"
          :disabled="isBusy && installingName !== item.name"
          @click.stop="emit('install', item)"
        >
          安装
        </el-button>
      </div>
      <el-empty v-if="!list.length" :description="emptyText" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'

  export interface InstallListItem {
    id?: number | string
    name: string
    type?: string
  }

  const props = withDefaults(
    defineProps<{
      modelValue: boolean
      title?: string
      emptyText?: string
      list: InstallListItem[]
      installingName?: string
      batchSelectable?: boolean
      isBatchInstalling?: boolean
      headerLinkText?: string
      headerLinkUrl?: string
    }>(),
    {
      title: '安装软件',
      emptyText: '暂无可用项',
      batchSelectable: false,
      isBatchInstalling: false,
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    install: [item: InstallListItem]
    batchInstall: [items: InstallListItem[]]
    headerLinkClick: [url: string]
  }>()

  const selectedKeys = ref<Set<string>>(new Set())

  const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const isBusy = computed(() => Boolean(props.installingName) || props.isBatchInstalling)

  function itemKey(item: InstallListItem) {
    return String(item.id ?? item.name)
  }

  function isSelectable(item: InstallListItem) {
    return item.type !== 'document'
  }

  const selectableList = computed(() => props.list.filter(isSelectable))

  const selectedItems = computed(() =>
    selectableList.value.filter(item => selectedKeys.value.has(itemKey(item)))
  )

  const isAllSelected = computed(
    () =>
      selectableList.value.length > 0 &&
      selectableList.value.every(item => selectedKeys.value.has(itemKey(item)))
  )

  const isIndeterminate = computed(
    () => selectedItems.value.length > 0 && !isAllSelected.value
  )

  function isSelected(item: InstallListItem) {
    return selectedKeys.value.has(itemKey(item))
  }

  function toggleItem(item: InstallListItem) {
    if (!isSelectable(item) || isBusy.value) {
      return
    }

    setItemSelected(item, !isSelected(item))
  }

  function setItemSelected(item: InstallListItem, selected: boolean) {
    if (!isSelectable(item) || isBusy.value) {
      return
    }

    const key = itemKey(item)
    const next = new Set(selectedKeys.value)
    if (selected) {
      next.add(key)
    } else {
      next.delete(key)
    }
    selectedKeys.value = next
  }

  function toggleSelectAll(checked: boolean | string | number) {
    if (isBusy.value) {
      return
    }

    if (checked) {
      selectedKeys.value = new Set(selectableList.value.map(itemKey))
    } else {
      selectedKeys.value = new Set()
    }
  }

  function handleBatchInstall() {
    if (!selectedItems.value.length || isBusy.value) {
      return
    }
    emit('batchInstall', [...selectedItems.value])
  }

  function resetSelection() {
    selectedKeys.value = new Set()
  }

  watch(
    () => props.modelValue,
    open => {
      if (!open) {
        resetSelection()
      }
    }
  )
</script>

<style lang="scss" scoped>
  .install-software-toolbar {
    margin-bottom: 12px;
    padding: 0 2px;
  }

  .install-software-header {
    gap: 12px;
    flex-wrap: wrap;
    padding-right: 28px;
  }

  .install-software-title {
    color: #f0f0f0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
  }

  .install-software-header-link {
    color: #67c23a;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #85ce61;
      text-decoration: underline;
    }
  }

  .install-software-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 120px;
    max-height: min(480px, 60vh);
    overflow-y: auto;
    padding-right: 4px;
  }

  .install-software-item {
    padding: 12px 14px;
    border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);

    &.is-selectable {
      cursor: pointer;
    }
  }

  .install-software-item-left {
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .install-software-checkbox {
    flex-shrink: 0;
  }

  .install-software-name {
    color: #e8e8e8;
    font-size: 14px;
    font-weight: 500;
  }
</style>

<style lang="scss">
  .install-software-dialog {
    .el-dialog {
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      background: #1a1a1a;
    }

    .el-dialog__title {
      color: #f0f0f0;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: #aaa;
    }

    .install-software-toolbar .el-checkbox__label {
      color: #d8d8d8;
    }

    .install-software-list {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.22) transparent;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.22);
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }
  }
</style>
