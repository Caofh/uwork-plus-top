<template>
  <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.index">
    <template #title>
      <el-icon v-if="item.customIcon">
        <component :is="item.customIcon" :color="getColor(item)" :style="style" />
      </el-icon>
      <el-icon v-else-if="item.icon">
        <component :is="item.icon" :color="getColor(item)" :style="style" />
      </el-icon>
      <span>{{ item.title }}</span>
    </template>
    <RecursiveMenuItem
      v-for="child in item.children"
      :key="child.index"
      :item="child"
      :default-active="defaultActive"
    />
  </el-sub-menu>
  <el-menu-item v-else :index="item.index" :disabled="item.disabled">
    <el-icon v-if="item.customIcon">
      <component :is="item.customIcon" :color="getColor(item)" :style="style" />
    </el-icon>
    <el-icon v-else-if="item.icon">
      <component :is="item.icon" :color="getColor(item)" :style="style" />
    </el-icon>
    <span>{{ item.title }}</span>
  </el-menu-item>
</template>

<script lang="ts">
  interface MenuItem {
    index: string
    title: string
    customIcon?: string
    icon?: string
    disabled?: boolean
    path?: string
    children?: MenuItem[]
  }

  export default {
    name: 'RecursiveMenuItem',
    props: {
      item: {
        type: Object as () => MenuItem,
        required: true,
      },
      defaultActive: {
        type: String,
        required: true,
      },
    },
    setup(props: { item: MenuItem }) {
      const style: any = {
        width: '18px',
        height: '18px',
      }

      const getColor = (item: MenuItem) => {
        return item.index === props.defaultActive ? `#42b983` : `#fff`
      }

      return {
        style,
        getColor,
      }
    },
  }
</script>
