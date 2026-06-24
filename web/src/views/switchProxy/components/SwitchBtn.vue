<template>
  <div class="switch-btn" :class="{ checked: modelValue }" @click="toggle">
    <div class="switch-handle"></div>
  </div>
</template>

<script setup>
  const props = defineProps({
    modelValue: Boolean,
  })
  const emit = defineEmits(['update:modelValue'])

  function toggle() {
    emit('update:modelValue', !props.modelValue)
  }
</script>

<style scoped>
  .switch-btn {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: #424242;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
    box-sizing: border-box;
    display: inline-block;
    vertical-align: middle;
  }
  .switch-btn.checked {
    background: #1976d2;
  }
  .switch-handle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 0.2s;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
  .switch-btn.checked .switch-handle {
    left: 18px;
  }
</style>
