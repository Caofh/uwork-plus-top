const option = {
  grid: {
    width: '100%', // 相对于容器宽度
    height: '100%', // 相对于容器高度
  },
  tooltip: {
    trigger: 'item',
    position: function (point, params, dom, rect, size) {
      const x = point[0]
      const y = point[1]
      const tooltipWidth = size.contentSize[0]
      const tooltipHeight = size.contentSize[1]
      const viewWidth = size.viewSize[0]
      const viewHeight = size.viewSize[1]

      // 智能定位：优先右侧，空间不够时调整
      let posX = x + 15
      let posY = y - tooltipHeight / 2

      // 右侧空间不够，显示在左侧
      if (posX + tooltipWidth > viewWidth) {
        posX = x - tooltipWidth - 15
      }

      // 确保不超出上下边界
      if (posY < 10) {
        posY = 10
      }
      if (posY + tooltipHeight > viewHeight - 10) {
        posY = viewHeight - tooltipHeight - 10
      }

      // return [posX, posY];
      return [posX + 150, -10]
    },
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    textStyle: {
      color: '#fff',
      fontSize: 12,
    },
    extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);',
    // formatter: function (params) {
    //   let result = `<div>stars: ${params?.data?.value || ''}</div>`;
    //   return result;
    // },
  },
  legend: {
    show: false, // 是否显示图例
    textStyle: {
      // 图例文字样式
      color: '#fff',
      fontSize: 12,
      fontWeight: 'normal',
    },
    formatter: function (name) {
      // 自定义图例文字格式
      return name + ' (热门)'
    },
  },
  series: [
    {
      name: 'gitHub 热门项目【star 排行】',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
        position: 'center',
        textStyle: {
          color: '#fff',
        },
      },
      emphasis: {
        label: {
          show: false,
          fontSize: 40,
          fontWeight: 'bold',
        },
      },
      labelLine: {
        show: false,
      },
      data: [
        { value: 1048, name: 'Search Engine' },
        { value: 735, name: 'Direct' },
        { value: 580, name: 'Email' },
        { value: 484, name: 'Union Ads' },
        { value: 300, name: 'Video Ads' },
      ],
    },
  ],
}

const optionRight = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: [
    {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLabel: {
        rotate: 45,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
  ],
  yAxis: [
    {
      type: 'value',
    },
  ],
  series: [
    {
      name: 'star',
      type: 'bar',
      barWidth: '60%',
      data: [10, 52, 200, 334, 390, 330, 220],
    },
  ],
}

export { option, optionRight }
