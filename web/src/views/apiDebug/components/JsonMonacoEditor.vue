<template>
  <div ref="containerRef" class="json-monaco-editor"></div>
</template>

<script setup>
  import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { monaco } from '../monacoSetup'

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: 'json',
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const containerRef = ref(null)
  let monacoInstance = null
  let resizeObserver = null
  let isUpdatingFromProp = false

  function destroyEditor() {
    resizeObserver?.disconnect()
    resizeObserver = null
    if (monacoInstance) {
      monacoInstance.dispose()
      monacoInstance = null
    }
  }

  function layout() {
    monacoInstance?.layout()
  }

  function setEditorValue(value) {
    if (!monacoInstance) {
      return
    }
    const nextValue = value ?? ''
    if (monacoInstance.getValue() === nextValue) {
      return
    }
    isUpdatingFromProp = true
    monacoInstance.setValue(nextValue)
    isUpdatingFromProp = false
  }

  function mountEditor() {
    if (!containerRef.value) {
      return
    }

    destroyEditor()

    monacoInstance = monaco.editor.create(containerRef.value, {
      value: props.modelValue || '',
      language: props.language,
      readOnly: props.readOnly,
      theme: 'vs-dark',
      fontSize: 13,
      lineNumbers: 'on',
      lineNumbersMinChars: 4,
      lineDecorationsWidth: 12,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'off',
      folding: true,
      foldingStrategy: 'auto',
      foldingHighlight: true,
      showFoldingControls: 'always',
      unfoldOnClickAfterEndOfLine: false,
      matchBrackets: 'always',
      tabSize: 2,
      renderWhitespace: 'selection',
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12,
      },
    })

    if (!props.readOnly) {
      monacoInstance.onDidChangeModelContent(() => {
        if (isUpdatingFromProp) {
          return
        }
        emit('update:modelValue', monacoInstance.getValue())
      })
    }

    monacoInstance.layout()
    resizeObserver = new ResizeObserver(() => {
      monacoInstance?.layout()
    })
    resizeObserver.observe(containerRef.value)
  }

  watch(
    () => props.modelValue,
    value => {
      setEditorValue(value)
    },
  )

  watch(
    () => props.readOnly,
    async () => {
      await nextTick()
      mountEditor()
    },
  )

  onMounted(async () => {
    await nextTick()
    await new Promise(resolve => requestAnimationFrame(resolve))
    mountEditor()
  })

  onUnmounted(destroyEditor)

  defineExpose({
    layout,
    getValue: () => monacoInstance?.getValue() ?? '',
    setValue: setEditorValue,
  })
</script>

<style scoped lang="scss">
  .json-monaco-editor {
    flex: 1;
    min-height: 0;
    width: 100%;
    background: #1e1e1e;
  }

  :deep(.monaco-editor) {
    height: 100% !important;
  }

  /* Monaco 默认折叠图标 opacity:0，需 always + 强制可见 */
  :deep(.monaco-editor .margin-view-overlays .codicon-folding-expanded),
  :deep(.monaco-editor .margin-view-overlays .codicon-folding-collapsed),
  :deep(.monaco-editor .margin-view-overlays .codicon-folding-manual-expanded),
  :deep(.monaco-editor .margin-view-overlays .codicon-folding-manual-collapsed),
  :deep(.monaco-editor .margin-view-overlays .codicon.alwaysShowFoldIcons),
  :deep(.monaco-editor .cldr.codicon-folding-expanded),
  :deep(.monaco-editor .cldr.codicon-folding-collapsed) {
    opacity: 1 !important;
    cursor: pointer;
    color: #c5c5c5 !important;
  }

  :deep(.monaco-editor .margin-view-overlays .codicon-folding-expanded:hover),
  :deep(.monaco-editor .margin-view-overlays .codicon-folding-collapsed:hover) {
    color: #fff !important;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  :deep(.monaco-editor .folded-background) {
    background: rgba(128, 128, 128, 0.15);
  }
</style>
