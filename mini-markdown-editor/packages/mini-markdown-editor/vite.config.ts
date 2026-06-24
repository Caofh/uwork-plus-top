/// <reference types="vitest/config" />
// 与测试用同一配置

import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
// 打包后生成d.ts文件
import dts from "vite-plugin-dts";
import qiankun from "vite-plugin-qiankun";

const MICRO_APP_NAME = "uworkplusMarkdown";
const DEV_HOST = "127.0.0.1";
const DEV_PORT = 5176;

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const useDevMode = !isProd;
  const devOrigin = `http://${DEV_HOST}:${DEV_PORT}`;

  return {
    // 开发环境使用完整 origin，避免 qiankun 把资源解析到主应用端口
    base: useDevMode ? `${devOrigin}/${MICRO_APP_NAME}/` : `/${MICRO_APP_NAME}/`,
    plugins: [
      ...(isProd ? [react() as PluginOption, dts({ tsconfigPath: "./tsconfig.app.json", include: ["src/**"] })] : []),
      qiankun("react-app", {
        // 微应用名字，与主应用注册的微应用名字保持一致
        useDevMode,
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      outDir: "dist",
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      // lib: {
      //   entry: "src/index.tsx",
      //   name: "mini-markdown-editor",
      //   fileName: "mini-markdown-editor",
      // },
      rollupOptions: {
        // external: ["react", "react-dom", "highlight.js"],
        output: {
          chunkFileNames: `dist/chunks/[name].js`,
          inlineDynamicImports: true,
          // globals: {
          //   react: "React",
          //   "react-dom": "ReactDOM",
          //   "highlight.js": "hljs",
          // },
        },
      },
    },
    server: {
      host: DEV_HOST,
      port: DEV_PORT,
      cors: true,
      origin: devOrigin,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },

    // 单元测试
    test: {
      name: "editor-unit-test",
      environment: "jsdom",
      globals: true,
      setupFiles: "./test/unit/unit-setup.ts",
      include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
      coverage: {
        include: ["src/components/**", "src/hooks/**", "src/utils/**", "src/store/**"],
      },
    },
  };
});
