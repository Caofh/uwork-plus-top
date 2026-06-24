/* eslint-disable */
// @ts-nocheck

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// import "@/assets/styles/reset.css";
import { renderWithQiankun, qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { eventBus } from "./utils/EventBus";
import { useEditorContentStore } from "@/store/editor";

// 动态注入 CSS 内容
function injectStyles(cssContent: string) {
  const style = document.createElement("style");
  style.textContent = cssContent;
  style.setAttribute("data-app", "mini-markdown-editor"); // 标识样式来源
  document.head.appendChild(style);
}
const initQianKun = () => {
  renderWithQiankun({
    // 当前应用在主应用中的生命周期
    // 文档 https://qiankun.umijs.org/zh/guide/getting-started#

    mount(props) {
      const resetCSS = `
    /* 重置样式 */
    * {
        box-sizing: border-box;
    }

    .ant-tooltip {
        z-index: 3000;
    }
    .ant-dropdown {
        z-index: 3000;
    }
    
    /* 其他重置样式... */
  `;

      injectStyles(resetCSS);

      // 在 react 渲染后，发送eventBus
      render(props.container, () => {
        console.log("子应用 【main.tsx】 接收到 主应用 初始化传参", props?.msg);
        // 通过 eventBus 传递 props，让组件内部处理
        eventBus.emit("sendMessage", props?.msg);
        eventBus.emit("qiankunProps", props);
        eventBus.emit("qiankunMount", true);

        // 通知主应用 乾坤加载完成
        props.onMessage({
          type: "complete",
        });
      });
      //  可以通过props读取主应用的参数：msg
      // 监听主应用传值
      props.onGlobalStateChange((res) => {
        console.log("子应用 【main.tsx】 接收到 主应用 传参", res);

        // 通过 eventBus 传递 props，让组件内部处理
        eventBus.emit("sendMessage", res);
        // eventBus.emit("qiankunProps", res);
        eventBus.emit("qiankunMount", true);

        // 通知主应用 乾坤加载完成
        res.onMessage({
          type: "complete",
        });

        // 通知主应用 乾坤加载完成
        // res.onMessage({
        //   type: "complete",
        // });

        // setTimeout(() => {
        //   console.log("子应用：1s");
        //   props.onMessage({
        //     miniToMain: "接收消息吧",
        //   });
        // }, 1000);
      });
    },
    bootstrap() {},
    unmount() {
      eventBus.emit("qiankunMount", false);
      console.log("unmount-外部");
    },
  });
};

const render = (container, callback) => {
  // 如果是在主应用的环境下就挂载主应用的节点，否则挂载到本地
  const appDom = container ? container : document.getElementById("root");
  createRoot(appDom).render(<App />);

  // 执行回调，在渲染后
  setTimeout(() => {
    callback && callback();
  });
};

// 判断当前应用是否在主应用中
qiankunWindow.__POWERED_BY_QIANKUN__ ? initQianKun() : render();
