<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, defineComponent, h, watch } from 'vue'
  import { useMotionValue, useSpring, useTransform, type SpringOptions } from 'motion-v'
  import { ElMessage } from 'element-plus'
  import { isInElectron, openModuleWindow } from '@/utils/electron'
  import 'primeicons/primeicons.css'

  export type DockItemData = {
    icon: unknown
    label: unknown
    onClick: () => void
    path?: string
    className?: string
    customClick?: boolean // 是自定义点击事件
    /** 右上角红色角标数字，>0 时展示 */
    badge?: number
  }

  export type DockProps = {
    items: DockItemData[]
    /** 当前激活路由 path，与轮播同步以高亮对应 icon */
    activePath?: string
    className?: string
    distance?: number
    panelHeight?: number
    baseItemSize?: number
    dockHeight?: number
    magnification?: number
    spring?: SpringOptions
  }

  const props = withDefaults(defineProps<DockProps>(), {
    className: '',
    distance: 200,
    panelHeight: 64,
    baseItemSize: 50,
    dockHeight: 256,
    magnification: 70,
    spring: () => ({ mass: 0.1, stiffness: 150, damping: 12 }),
  })

  const mouseX = useMotionValue(Infinity)
  const mouseY = useMotionValue(Infinity)
  const isHovered = useMotionValue(0)
  const currentHeight = ref(props.panelHeight)

  const maxHeight = computed(() =>
    Math.max(props.dockHeight, props.magnification + props.magnification / 2 + 4)
  )

  const heightRow = useTransform(isHovered, [0, 1], [props.panelHeight, maxHeight.value])
  const height = useSpring(heightRow, props.spring)

  let unsubscribeHeight: (() => void) | null = null

  onMounted(() => {
    unsubscribeHeight = height.on('change', (latest: number) => {
      currentHeight.value = latest
    })
  })

  onUnmounted(() => {
    if (unsubscribeHeight) {
      unsubscribeHeight()
    }
  })

  const handleMouseMove = (event: MouseEvent) => {
    isHovered.set(1)
    mouseX.set(event.pageX)
    mouseY.set(event.pageY)
  }

  const handleMouseLeave = () => {
    isHovered.set(0)
    mouseX.set(Infinity)
    mouseY.set(Infinity)
  }

  let activeIndex = ref(0)

  watch(
    () => props.activePath,
    path => {
      if (!path) return
      const index = props.items.findIndex(item => item.path === path)
      if (index >= 0) {
        activeIndex.value = index
      }
    },
    { immediate: true }
  )

  function itemClick(item: DockItemData, index: number) {
    if (item.customClick) {
      item.onClick()
    } else {
      activeIndex.value = index
      item.onClick()
    }
  }

  const emit = defineEmits<{ tip: [] }>()
  function onTipClick() {
    emit('tip')
  }

  const modulePopoutTip =
    '当前模块打开独立窗口，便于更方便的使用高频模块，避免频繁切换，丢失上下文。'

  function buildModuleWindowUrl() {
    const url = new URL(window.location.href)
    const page = (props.activePath || 'home').replace(/^\//, '')
    url.searchParams.set('toPage', page || 'home')
    return url.toString()
  }

  async function onOpenModuleWindow() {
    if (!isInElectron()) {
      ElMessage.warning('请在 Electron 客户端中使用该功能')
      return
    }

    const url = buildModuleWindowUrl()
    try {
      const result = await openModuleWindow({
        url,
        title: 'UworkPlus',
        width: 1200,
        height: 800,
      })
      if (result?.ok === false) {
        ElMessage.error(result.error || '打开独立窗口失败')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '打开独立窗口失败')
    }
  }
</script>

<template>
  <div
    :style="{ scrollbarWidth: 'none' }"
    class="dock-root absolute top-1/2 left-11 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
  >
    <div class="group relative w-[50px]">
      <span class="dock-module-popout-tip" role="tooltip">{{ modulePopoutTip }}</span>
      <button
        type="button"
        class="dock-module-popout flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border-2 border-neutral-700 bg-[#111] shadow-md transition hover:border-neutral-500 hover:bg-neutral-800"
        aria-label="打开独立窗口"
        @click="onOpenModuleWindow"
      >
        <i class="pi pi-window-maximize text-lg text-white" aria-hidden="true" />
      </button>
    </div>
    <div
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      :class="`${props.className} dock-container flex flex-col items-start w-fit gap-4 rounded-2xl border-neutral-700 border-2 pb-5 pt-5 px-2 pr-2`"
      :style="{ width: props.panelHeight + 'px' }"
      role="toolbar"
      aria-label="Application dock"
    >
      <div class="group relative w-full">
        <span
          class="pointer-events-none absolute left-full top-1/2 z-10 ml-2 max-w-[180px] whitespace-nowrap rounded-md border border-neutral-700 bg-[#111] px-2 py-0.5 text-center text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style="transform: translateY(-50%);"
          role="tooltip"
        >你的支持是我前进的动力。</span>
        <button
          type="button"
          class="cursor-pointer w-full rounded-lg border border-neutral-600 bg-neutral-800/80 py-2 text-xs text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-700/80 hover:text-white"
          @click="onTipClick"
        >
          赞助
        </button>
      </div>
      <DockItem
        v-for="(item, index) in props.items"
        :key="index"
        :onClick="() => itemClick(item, index)"
        :className="item.className"
        :activeIndex="activeIndex"
        :index="index"
        :mouseX="mouseX"
        :mouseY="mouseY"
        :spring="props.spring"
        :distance="props.distance"
        :magnification="props.magnification"
        :baseItemSize="props.baseItemSize"
        :item="item"
      />
    </div>
  </div>
</template>

<script lang="ts">
  const DockItem = defineComponent({
    name: 'DockItem',
    props: {
      className: {
        type: String,
        default: '',
      },
      onClick: {
        type: Function,
        default: () => {},
      },
      mouseX: {
        type: Object as () => ReturnType<typeof useMotionValue<number>>,
        required: true,
      },
      mouseY: {
        type: Object as () => ReturnType<typeof useMotionValue<number>>,
        required: true,
      },
      spring: {
        type: Object as () => SpringOptions,
        required: true,
      },
      distance: {
        type: Number,
        required: true,
      },
      baseItemSize: {
        type: Number,
        required: true,
      },
      magnification: {
        type: Number,
        required: true,
      },
      item: {
        type: Object as () => DockItemData,
        required: true,
      },
      activeIndex: {
        type: Number,
      },
      index: {
        type: Number,
      },
    },
    setup(props) {
      const itemRef = ref<HTMLDivElement>()
      const isHovered = useMotionValue(0)
      const currentSize = ref(props.baseItemSize)

      const mouseDistance = useTransform(props.mouseY, (val: number) => {
        const rect = itemRef.value?.getBoundingClientRect() ?? {
          y: 0,
          height: props.baseItemSize,
        }
        return val - rect.y - props.baseItemSize / 2
      })

      const targetSize = useTransform(
        mouseDistance,
        [-props.distance, 0, props.distance],
        [props.baseItemSize, props.magnification, props.baseItemSize]
      )
      const size = useSpring(targetSize, props.spring)

      let unsubscribeSize: (() => void) | null = null

      onMounted(() => {
        unsubscribeSize = size.on('change', (latest: number) => {
          currentSize.value = latest
        })
      })

      onUnmounted(() => {
        if (unsubscribeSize) {
          unsubscribeSize()
        }
      })

      const handleHoverStart = () => isHovered.set(1)
      const handleHoverEnd = () => isHovered.set(0)
      const handleFocus = () => isHovered.set(1)
      const handleBlur = () => isHovered.set(0)

      return {
        itemRef,
        size,
        currentSize,
        isHovered,
        handleHoverStart,
        handleHoverEnd,
        handleFocus,
        handleBlur,
      }
    },
    render() {
      const icon = typeof this.item.icon === 'function' ? this.item.icon() : this.item.icon
      const label = typeof this.item.label === 'function' ? this.item.label() : this.item.label

      return h(
        'div',
        {
          ref: 'itemRef',
          style: {
            width: this.currentSize + 'px',
            height: this.currentSize + 'px',
            backgroundColor: this.activeIndex === this.index ? 'var(--color-neutral-700)' : '#111',
          },
          onMouseenter: this.handleHoverStart,
          onMouseleave: this.handleHoverEnd,
          onFocus: this.handleFocus,
          onBlur: this.handleBlur,
          onClick: this.onClick,
          class: `dock-item relative cursor-pointer inline-flex items-center justify-center rounded-full bg-[#111] border-neutral-700 border-2 shadow-md ${this.className}`,
          tabindex: 0,
          role: 'button',
          'aria-haspopup': 'true',
        },
        [
          h(DockIcon, { activeIndex: this.activeIndex, index: this.index }, () => [icon]),
          this.item.badge && this.item.badge > 0
            ? h(
                'span',
                {
                  class: 'dock-item-badge',
                  'aria-label': `逾期任务 ${this.item.badge} 条`,
                },
                String(this.item.badge)
              )
            : null,
          h(DockLabel, { isHovered: this.isHovered }, () => [
            typeof label === 'string' ? label : label,
          ]),
        ]
      )
    },
  })

  const DockLabel = defineComponent({
    name: 'DockLabel',
    props: {
      className: {
        type: String,
        default: '',
      },
      isHovered: {
        type: Object as () => ReturnType<typeof useMotionValue<number>>,
        required: true,
      },
    },
    setup(props) {
      const isVisible = ref(false)

      let unsubscribe: (() => void) | null = null

      onMounted(() => {
        unsubscribe = props.isHovered.on('change', (latest: number) => {
          isVisible.value = latest === 1
        })
      })

      onUnmounted(() => {
        if (unsubscribe) {
          unsubscribe()
        }
      })

      return {
        isVisible,
      }
    },
    render() {
      return h(
        'div',
        {
          class: `${this.className} absolute -top-8 left-1/2 w-fit whitespace-pre rounded-md border border-neutral-700 bg-[#111] px-2 py-0.5 text-xs text-white transition-all duration-200`,
          role: 'tooltip',
          style: {
            transform: 'translateX(-50%)',
            opacity: this.isVisible ? 1 : 0,
            visibility: this.isVisible ? 'visible' : 'hidden',
          },
        },
        this.$slots.default?.()
      )
    },
  })

  const DockIcon = defineComponent({
    name: 'DockIcon',
    props: {
      className: {
        type: String,
        default: '',
      },
      activeIndex: {
        type: Number,
      },
      index: {
        type: Number,
      },
    },
    render() {
      return h(
        'div',
        {
          class: `flex items-center justify-center ${this.className}`,
          style: {
            color: this.activeIndex === this.index ? 'var(--el-color-primary)' : '#ffffff',
            fontSize: this.activeIndex === this.index ? '26px' : '18px',
            width: '100%',
            height: '100%',
          },
        },
        this.$slots.default?.()
      )
    },
  })

  export default defineComponent({
    name: 'Dock',
    components: {
      DockItem,
    },
  })
</script>
<style scoped>
  .dock-module-popout-tip {
    position: absolute;
    left: calc(100% + 8px);
    top: 50%;
    z-index: 20;
    display: block;
    width: 220px;
    padding: 6px 8px;
    border: 1px solid #404040;
    border-radius: 6px;
    background: #111;
    color: #fff;
    font-size: 12px;
    line-height: 1.5;
    text-align: left;
    white-space: normal;
    word-break: break-word;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-50%);
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }

  .group:hover .dock-module-popout-tip {
    opacity: 1;
    visibility: visible;
  }
</style>
<style>
  .dock-item-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #f56c6c;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    /* line-height: 1; */
    box-shadow: 0 0 0 2px #111;
    pointer-events: none;
  }
</style>
