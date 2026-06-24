<template>
  <div class="home-charts-container flex flex-col">
    <div class="home-title">{{ title }}</div>
    <div class="home-charts c-flex-x-center">
      <div ref="chartRef" class="chart-container"></div>
      <div class="home-charts-line"></div>
      <div ref="chartRightRef" class="chart-container-right"></div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, reactive, inject, watch } from 'vue'
  import { option as bingtuOption, optionRight as zhuzhuangtuOption } from './echartOptins'

  import * as echarts from 'echarts'
  import { openExternal } from '@/utils/electron'

  const props = defineProps({
    title: {
      type: String,
      default: '',
    },
  })

  // 所有逻辑集中在最顶层处理 接受父组件的provide方法
  const parentProvide = inject('parentProvide')
  let hotNewsList = ref([])
  let isLoading = ref(true)

  const chartRef = ref(null)
  let chartInstance = null
  let chartOption = bingtuOption
  function initChart() {
    chartInstance = echarts.init(chartRef.value)
    chartOption && chartInstance.setOption(chartOption)

    // 多系列点击事件
    chartInstance.on('click', function (params) {
      echartClick(params)
    })
  }

  const chartRightRef = ref(null)
  let chartRightInstance = null
  let chartRightOption = zhuzhuangtuOption
  function initRightChart() {
    chartRightInstance = echarts.init(chartRightRef.value)
    chartRightOption && chartRightInstance.setOption(chartRightOption)

    // 多系列点击事件
    chartRightInstance.on('click', function (params) {
      echartClick(params)
    })
  }
  function echartClick(params) {
    const chooseData = hotNewsList.value[params.dataIndex]
    const { html_url } = chooseData
    openExternal(html_url)
  }
  function getHotData(data) {
    return data.baiduHotData.value.gitHubHot
  }

  const handleResize = () => {
    if (chartInstance) {
      chartInstance.resize()
    }
    if (chartRightInstance) {
      chartRightInstance.resize()
    }
  }

  function getBingtuOption(option, data) {
    const dataResult = data.map(item => {
      return {
        value: item.stargazers_count,
        // name: item.full_name,
        name: item.name,
      }
    })

    option.series[0].data = dataResult
    return option
  }

  function getZhuzhuangtuOption(option, data) {
    const xAxisData = []
    const seriesData = []
    data.map(item => {
      xAxisData.push(item.name)
      seriesData.push(item.stargazers_count)
    })

    option.xAxis[0].data = xAxisData
    option.series[0].data = seriesData
    return option
  }

  watch(
    () => parentProvide,
    async (newValue, oldValue) => {
      // isLoading.value = true;
      const resultData = getHotData(newValue)

      // 获取 github 热点数据
      hotNewsList.value = resultData || []
      // console.log("gitHub获取到数据：", hotNewsList.value);
      const bingtuOption = getBingtuOption(chartOption, hotNewsList.value)
      const zhuzhuangtuOption = getZhuzhuangtuOption(chartRightOption, hotNewsList.value)

      // 设置新图表数据
      chartInstance && chartInstance.setOption(bingtuOption)
      chartRightInstance && chartRightInstance.setOption(zhuzhuangtuOption)

      setTimeout(() => {
        isLoading.value = false
      }, 1000)
    },
    { immediate: true, deep: true }
  )

  // 挂载时的操作
  onMounted(() => {
    console.log('组件已挂载')

    initChart(chartOption)
    initRightChart(chartRightOption)

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  })

  // 卸载时的操作
  onUnmounted(() => {
    // console.log('组件已卸载');
    if (chartInstance) {
      chartInstance.dispose()
    }
    window.removeEventListener('resize', handleResize)
  })
</script>

<style lang="scss" scoped>
  .home-charts-container {
    height: 100%;

    .home-charts {
      width: 100%;
      height: calc(100% - 24px);

      .chart-container {
        width: calc((100vh - 40px) / 2 - 80px - 40px);
        height: calc((100vh - 40px) / 2 - 80px - 40px);
      }

      .home-charts-line {
        width: 1px;
        height: 150px;
        margin: 0 26px;
        background-color: rgba(255, 255, 255, 0.08);
      }

      .chart-container-right {
        width: calc(((100vh - 40px) / 2 - 80px - 40px) * 1.6);
        height: calc((100vh - 40px) / 2);
        top: -30px;
      }
    }
  }
</style>
