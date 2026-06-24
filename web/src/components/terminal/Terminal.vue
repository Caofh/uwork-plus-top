<template>
  <!-- 终端弹窗展示结果 -->
  <el-dialog
    v-model="showExecModal"
    title="执行输出"
    width="700px"
    :close-on-click-modal="true"
    @closed="onExecModalClosed"
    :append-to-body="true"
  >
    <div ref="xtermContainer" style="width: 100%; height: 400px"></div>
    <template #footer>
      <el-button @click="showExecModal = false" :disabled="execRunning">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
  import { onMounted, onUnmounted, ref, reactive, nextTick } from 'vue'
  import { Terminal } from 'xterm'
  import { FitAddon } from 'xterm-addon-fit'
  import 'xterm/css/xterm.css'
  import { jsBridge } from '@/utils/electron'

  // 执行输出弹窗
  const showExecModal = ref(false)
  let term = null
  let fitAddon = null
  const xtermContainer = ref(null)
  let removeTerminalListener = null
  const execRunning = ref(false)

  function executeWithModal(shContent) {
    return new Promise((resolve, reject) => {
      let dataRecord = []

      showExecModal.value = true
      execRunning.value = true

      nextTick(() => {
        if (term) {
          term.dispose()
          term = null
        }
        term = new Terminal({ fontSize: 14, theme: { background: '#222' } })
        fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(xtermContainer.value)
        fitAddon.fit()
        term.onData(input => {
          // console.log("input");
          // console.log(input);

          window.electronAPI.sendTerminalInput(input)
        })
      })

      if (removeTerminalListener) removeTerminalListener()
      removeTerminalListener = window.electronAPI.onTerminalOutput(data => {
        if (data.type === 'stdout' || data.type === 'stderr') {
          dataRecord.push(data)
          term && term.write(data.data)
        }
        if (data.type === 'close') {
          term && term.write(`\r\n[进程已结束，退出码：${data.code}]\r\n`)
          execRunning.value = false
          if (removeTerminalListener) removeTerminalListener()

          resolve({
            dataRecord,
            data: data,
          })
        }
      })

      // 发送命令（sh脚本内容）
      window.electronAPI.runTerminalCommandStream(shContent)
    })
  }

  // 不带终端执行 sh（走 child_process.exec，打包环境更稳定）
  function executeWithoutModal(shContent) {
    return new Promise((resolve, reject) => {
      jsBridge.register({
        method: 'runTerminalCommand',
        json: { command: shContent },
        callback: (result = {}) => {
          const dataRecord = []
          if (result.stdout) {
            dataRecord.push({ type: 'stdout', data: result.stdout })
          }
          if (result.stderr) {
            dataRecord.push({ type: 'stderr', data: result.stderr })
          }

          if (result.code === 0) {
            resolve({
              dataRecord,
              data: { type: 'close', code: 0 },
            })
            return
          }

          reject(new Error(result.stderr || result.stdout || '命令执行失败'))
        },
      })
    })
  }

  function onExecModalClosed() {
    // if (term) {
    //   term.dispose();
    //   term = null;
    // }
    // if (removeTerminalListener) removeTerminalListener();
  }

  function executeWithModalMacTerminal(command) {
    return new Promise((resolve, reject) => {
      jsBridge.register({
        method: 'openMacTerminal',
        json: {
          command: command,
        },
        callback: result => {
          console.log('Terminal 打开结果:', result)
          resolve(result)
        },
      })
    })
  }
  // 挂载时的操作
  onMounted(() => {
    // console.log('组件已挂载');
  })

  // 卸载时的操作
  onUnmounted(() => {
    // console.log('组件已卸载');
  })

  // 关键：暴露方法给父组件使用
  defineExpose({
    executeWithModal,
    executeWithoutModal,
    executeWithModalMacTerminal,
    showExecModal,
    execRunning,
  })
</script>

<style lang="scss" scoped></style>
