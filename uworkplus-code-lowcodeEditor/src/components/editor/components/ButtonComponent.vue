<template>
  <div class="button-component">
    <el-button :type="props.type" :size="props.size">
      {{ props.text }}
    </el-button>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  text: string
  type: string
  size: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '按钮',
  type: 'primary',
  size: 'default'
})
</script>

<style lang="scss" scoped>
.button-component {
  // padding: 8px;
  // display: inline-block;
}
</style>
