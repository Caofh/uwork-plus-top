<template>
  <div class="kv-table">
    <div class="kv-table__head">
      <span class="col col-enable">启用</span>
      <span class="col col-key">参数名</span>
      <span class="col col-value">参数值</span>
      <span v-if="showDescription" class="col col-desc">说明</span>
      <span class="col col-action"></span>
    </div>

    <div v-for="(row, index) in rows" :key="index" class="kv-table__row">
      <el-checkbox v-model="row.enabled" class="col col-enable" />
      <el-input v-model="row.key" placeholder="Key" class="col col-key" />
      <el-input v-model="row.value" placeholder="Value" class="col col-value" />
      <el-input
        v-if="showDescription"
        v-model="row.description"
        placeholder="说明"
        class="col col-desc"
      />
      <div class="col col-action">
        <el-button link type="danger" @click="removeRow(index)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <el-button link type="primary" @click="addRow">
      <el-icon><Plus /></el-icon>
      添加参数
    </el-button>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { Delete, Plus } from '@element-plus/icons-vue'
  import { createEmptyKeyValue } from '../types'

  const props = defineProps({
    modelValue: {
      type: Array,
      default: () => [],
    },
    showDescription: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const rows = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  function addRow() {
    rows.value = [...rows.value, createEmptyKeyValue()]
  }

  function removeRow(index) {
    const next = [...rows.value]
    next.splice(index, 1)
    rows.value = next.length ? next : [createEmptyKeyValue()]
  }
</script>

<style scoped lang="scss">
  .kv-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kv-table__head,
  .kv-table__row {
    display: grid;
    grid-template-columns: 56px 1fr 1fr 44px;
    gap: 8px;
    align-items: center;
  }

  .kv-table__head:has(.col-desc),
  .kv-table__row:has(.col-desc) {
    grid-template-columns: 56px 1fr 1fr 1fr 44px;
  }

  .kv-table__head {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    padding: 0 4px;
  }

  .col-enable {
    justify-self: center;
  }

  .col-action {
    display: flex;
    justify-content: center;
  }
</style>
