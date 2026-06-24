<template>
  <div class="a-plus cursor-pointer underline hover:text-[var(--el-color-primary)] transition-colors duration-200" @click.stop="handleClick">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
  import { openExternal } from '@/utils/electron'
  import { resolveRemoteOrLocal } from '@/config/remote'

  const props = withDefaults(defineProps<{
    url: string
  }>(), {
    url: resolveRemoteOrLocal('/uworkplus/introduction?origin=custom'),
  })

  function handleClick() {
    if (!props.url?.trim()) {
      return
    }
    openExternal(props.url)
  }
</script>
