<template>
  <div class="text-component" :style="textStyle">
    {{ dataInner.props.text }}
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import eventBus from '@/utils/eventBus'

interface Props {
  props: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  props: () => ({}),
})

const dataInner: any = ref({})
// 内部缓存数据赋值
watch(
  props,
  newVal => {
    dataInner.value = newVal
  },
  {
    immediate: true,
    deep: true,
  }
)

// 样式
const textStyle = computed(() => ({
  fontSize: `${dataInner.value.props.fontSize}px`,
  color: dataInner.value.props.color,
  textAlign: dataInner.value.props.textAlign as any,
  padding: '8px',
  lineHeight: 1.5,
}))

// const changeTextCptFunc = (changeData: any) => {
//   console.log('changeData-TextComponent', changeData)
//   // dataInner.value = {
//   //   ...dataInner.value,
//   //   ...changeData.props
//   // }
// }
onMounted(() => {
  // (window as any).lowcodeEventBus.on('changeTextCpt', changeTextCptFunc)
})
onUnmounted(() => {
  // eventBus.off('changeTextCpt', changeTextCptFunc)
})
</script>

<style lang="scss" scoped>
.text-component {
  word-wrap: break-word;
  word-break: break-all;
}
</style>
