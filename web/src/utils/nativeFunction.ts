// jsbridge 文档；记录调用方法

/** 方法1： 方法-使用 打开 Mac 原生 Terminal
jsBridge.register({
    method: "openMacTerminal",
    json: {
        command: "pwd",
    },
    callback: (result) => {
        console.log("Terminal 打开结果:", result);
    },
});
*/

/** 方法2: 组件-调用终端组件
// 终端组件
<template>
    <Terminal ref="terminalRef" />
</template>

<script>
import Terminal from "@/components/terminal/Terminal.vue";
const terminalRef = ref(null);

// 执行命令方法
function handleExecute() {
  // 需要终端
  terminalRef.value.executeWithModal("cd ~/work && pwd");
//   terminalRef.value.executeWithoutModal("cd ~/work && pwd"); // 不需要终端
}
</script>
 */
