<template>
  <div class="hosts-mapping">
    <div class="h-m-title">配置结果:</div>
    <div class="hosts-mapping-row" v-for="(item, idx) in computedMappings" :key="idx">
      <span class="url local">{{ item?.path }}</span>
      <span class="label">等于</span>
      <span class="url remote">{{ item?.proxyConfig?.target }}</span>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import cloneDeep from 'lodash/cloneDeep'
  import { PROXY_PORT } from './constants'

  const props = defineProps({
    mappings: {
      type: Array,
      required: true,
      default: () => [],
    },
  })

  const computedMappings = computed(() => {
    return cloneDeep(props.mappings).map(item => {
      item.path = `http://127.0.0.1:${PROXY_PORT}${item.path}/`
      return item
    })
  })
</script>

<style scoped>
  .hosts-mapping {
    flex: 1;
    min-height: 0;
    padding: 16px 20px;
    overflow: auto;
    white-space: nowrap;
    background: #1e1e1e;
    color: #e0e0e0;
  }
  .hosts-mapping-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }
  .h-m-title {
    font-weight: bold;
    margin-bottom: 12px;
    color: #f0f0f0;
  }
  .label {
    color: #9e9e9e;
  }
  .url {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 6px;
    font-size: 15px;
    font-family: monospace;
    font-weight: 500;
  }
  .url.local {
    background: #ffe066;
    color: #222;
  }
  .url.remote {
    background: #6ee96e;
    color: #222;
  }
</style>
