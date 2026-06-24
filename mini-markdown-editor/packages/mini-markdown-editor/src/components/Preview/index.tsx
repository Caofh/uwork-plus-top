import React, { FC, useEffect, useRef, useCallback } from "react";
import { parseMarkdown, transformHtml } from "@mini-markdown-rc/ast-parser";
import styled from "styled-components";
import { useEditorContentStore } from "@/store/editor";
import { handlePreviewScroll } from "@/utils/handle-scroll";
import { usePreviewTheme } from "@/hooks/use-preview-theme";
import { useCopyCode } from "@/hooks/use-copy-code";
import { useGlobalConfig } from "@/hooks/use-global-config";

const Preview: FC<{ content: string; isSyncScroll: boolean }> = ({ content, isSyncScroll }) => {
  const { scrollWrapper, setScrollWrapper, setPreviewView, editorView } = useEditorContentStore();
  const previewRef = useRef<HTMLDivElement>(null);

  // 更新预览视图
  const updatePreviewView = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        setPreviewView(element);
      }
    },
    [setPreviewView],
  );

  // 渲染 html 节点
  const node = React.useMemo(() => {
    const ast = parseMarkdown(content);
    return transformHtml(ast);
  }, [content]);

  // 更新渲染实例
  useEffect(() => {
    updatePreviewView(previewRef.current);
  }, [updatePreviewView, node]);

  // 处理链接和图片点击事件
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // 处理 copy-btn-pre 点击 - 复制代码到剪贴板
      if (target.classList.contains("copy-btn-pre")) {
        e.preventDefault();
        e.stopPropagation();
        
        // 查找父元素下面的 code 元素
        const parentElement = target.closest(".mini-md-code-container") || target.parentElement;
        if (parentElement) {
          const codeElement = parentElement.querySelector("code");
          if (codeElement && codeElement.textContent) {
            // 复制代码到剪贴板
            navigator.clipboard.writeText(codeElement.textContent).then(() => {
              // 可以添加复制成功的提示
              console.log("代码已复制到剪贴板");
              
              // 可选：临时改变按钮样式表示复制成功
              const originalText = target.textContent;
              target.textContent = "已复制!";
              target.style.color = "#67c23a";
              
              setTimeout(() => {
                target.textContent = originalText;
                target.style.color = "";
              }, 2000);
            }).catch((err) => {
              console.error("复制失败:", err);
            });
          }
        }
        return;
      }
      
      // 处理图片点击 - 放大展示
      if (target.tagName === "IMG") {
        e.preventDefault();
        const imgSrc = target.getAttribute("src");
        const imgAlt = target.getAttribute("alt") || "图片";
        
        if (imgSrc) {
          // 创建图片预览模态框
          const modal = document.createElement("div");
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            cursor: pointer;
          `;
          
          const img = document.createElement("img");
          img.src = imgSrc;
          img.alt = imgAlt;
          img.style.cssText = `
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          `;
          
          modal.appendChild(img);
          document.body.appendChild(modal);
          
          // 点击关闭
          const closeModal = () => {
            document.body.removeChild(modal);
          };
          
          modal.addEventListener("click", closeModal);
          img.addEventListener("click", (e) => e.stopPropagation());
        }
        return;
      }
      
      // 处理链接点击
      if (target.tagName === "A") {
        e.preventDefault(); // 取消默认行为

        const href = target.getAttribute("href");
        const text = target.textContent;

        // 自定义逻辑
        console.log("链接被点击:", { href, text });

        // 例如：在新窗口打开链接
        if (href) {
          // 用electron方法打开链接
          const { openExternal } = (window as any).electronAPI;
          openExternal(href)
        }

        // 或者：发送事件到父组件
        // eventBus.emit('linkClicked', { href, text });
      }
    };

    // 添加事件监听器
    if (previewRef.current) {
      previewRef.current.addEventListener("click", handleLinkClick);
    }

    // 清理函数
    return () => {
      if (previewRef.current) {
        previewRef.current.removeEventListener("click", handleLinkClick);
      }
    };
  }, [node]); // 当内容变化时重新绑定事件

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollWrapper !== "preview") return;
      const previewView = e.currentTarget;
      if (!(editorView && previewView && isSyncScroll)) return;
      handlePreviewScroll({ previewView, editorView });
    },
    [scrollWrapper, editorView, isSyncScroll],
  );

  // 鼠标进入预览区域
  const handleMouseEnter = useCallback(() => {
    setScrollWrapper("preview");
  }, [setScrollWrapper]);

  // 设置css变量
  const { theme } = useGlobalConfig();
  usePreviewTheme(theme as "light" | "dark");

  // copy按钮
  useCopyCode({ previewRef, node });

  return (
    <ScrollWrapper
      className="markdown-editor-preview"
      onScroll={handleScroll}
      onMouseEnter={handleMouseEnter}
      ref={previewRef}
      dangerouslySetInnerHTML={{ __html: node.toString() }}
    />
  );
};

export default React.memo(Preview);

const ScrollWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 10px;
  box-sizing: border-box;
  word-wrap: break-word;
  color: var(--md-preview-color);
  * {
    box-sizing: border-box;
  }

  p {
    line-height: 20px;
    font-size: 14px;
    margin: 5px 0;
  }

  strong {
    font-weight: 700;
  }

  .mini-md-h1,
  .mini-md-h2,
  .mini-md-h3,
  .mini-md-h4,
  .mini-md-h5,
  .mini-md-h6 {
    width: 100%;
    display: block;
    padding: 0 10px;
    word-wrap: break-word;
    /* color: #3f4a54; */
    color: var(--md-preview-special-color);
    margin: 0.8em 0;
    font-weight: 700;
  }

  .mini-md-h1 {
    font-size: 2em;
  }

  .mini-md-h2 {
    font-size: 1.5em;
  }

  .mini-md-h3 {
    font-size: 1.25em;
  }

  .mini-md-h4 {
    font-size: 1em;
  }

  .mini-md-h5 {
    font-size: 0.875em;
  }

  .mini-md-h6 {
    font-size: 0.85em;
  }

  .mini-md-inline-code {
    line-height: 22px;
    padding: 2px 4px;
    /* color: #3594f7; */
    color: var(--md-preview-inlincode-color);
    /* #f1f1f1 */
    /* background-color: rgba(59, 170, 250, 0.1); */
    background-color: var(--md-preview-inlincode-bg-color);
    border-radius: 4px;
  }

  .mini-md-link {
    color: #2d8cf0;
    text-decoration: none;
    transition: color 0.3s;
    cursor: pointer;
  }

  .mini-md-link:hover {
    color: #73d13d;
  }

  .mini-md-image {
    width: 200px;
    height: 160px;
    object-fit: cover;
    /* border: 1px solid #e6e6e6; */
    border: 1px solid var(--md-preview-border-color);
    border-radius: 3px;
    box-sizing: border-box;
    // margin: 0 auto;
    padding: 5px;
  }

  .mini-md-hr {
    border: none;
    border-top: 1px solid var(--md-preview-border-color);
    height: 1px;
    margin: 10px 0;
  }

  .mini-md-blockquote {
    display: block;
    line-height: 2em;
    margin: 20px 0;
    overflow: auto;
    padding: 0 1.2em;
    /* border-left: 5px solid #d0d7de; */
    border-left: 5px solid var(--md-preview-blockquote-border-color);
    color: var(--md-preview-blockquote-color);
  }

  .mini-md-table {
    width: 50%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  .mini-md-th,
  .mini-md-td {
    /* border: 1px solid #ddd; */
    border: 1px solid var(--md-preview-table-border-color);
    padding: 8px;
    text-align: left;
  }

  .mini-md-th {
    /* background-color: #f2f2f2; */
    background-color: var(--md-preview-th-bg-color);
  }

  .mini-md-tr:hover {
    /* background-color: #f5f5f5; */
    background-color: var(--md-preview-table-hover-bg-color);
  }

  .mini-md-ul,
  .mini-md-ol {
    margin: 0.6em 0;
    padding-inline-start: 30px;
    list-style: initial;
    .mini-md-li {
      list-style: initial;
      &::marker {
        color: #1456f0;
      }
    }
  }

  .mini-md-ul > .mini-md-li {
    list-style-type: disc;
  }
  .mini-md-ul .mini-md-ul > .mini-md-li {
    list-style-type: circle;
  }
  .mini-md-ul .mini-md-ul .mini-md-ul > .mini-md-li {
    list-style-type: square;
  }
  .mini-md-ol > .mini-md-li {
    list-style-type: decimal;
  }
  .mini-md-ol .mini-md-ol > .mini-md-li {
    list-style-type: lower-alpha;
  }
  .mini-md-ol .mini-md-ol .mini-md-ol > .mini-md-li {
    list-style-type: lower-roman;
  }

  .mini-md-code-container {
    font-size: 12px;
    line-height: 1;
    margin: 20px 0;
    position: relative;
  }

  .mini-md-code-container .mini-md-code-header {
    background-color: #282c34;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    display: flex;
    font-size: 12px;
    font-weight: 600;
    height: 32px;
    justify-content: space-between;
    margin-bottom: 0;
    width: 100%;
  }

  .mini-md-code-header .mini-md-code-icon {
    display: flex;
    gap: 5px;
    margin-left: 12px;
  }

  .mini-md-code-header .mini-md-code-icon span {
    border-radius: 50%;
    display: inline-block;
    height: 10px;
    margin-top: 10px;
    width: 10px;
  }

  .mini-md-code-icon span:nth-of-type(1) {
    background-color: #ec6a5e;
  }

  .mini-md-code-icon span:nth-of-type(2) {
    background-color: #f4bf4f;
  }

  .mini-md-code-icon span:nth-of-type(3) {
    background-color: #61c554;
  }

  .mini-md-code-right {
    display: flex;
    align-items: center;
    margin-right: 10px;
    color: #a9b7c6;

    .copy-code-button-wrapper {
      margin-left: 5px;
      display: inline-flex;
      align-items: center;
    }
  }

  .mini-md-code-container pre {
    margin: 0;
  }

  .mini-md-code-container pre code {
    background-color: #282c34;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    color: #a9b7c6;
    display: block;
    font-family:
      source-code-pro,
      Menlo,
      Monaco,
      Consolas,
      Courier New,
      monospace;
    font-size: 14px;
    line-height: 1.6;
    overflow: auto;
    padding: 1em;
    max-height: 200px;
  }

  .detail-pre {
    background: #282C34;
    padding:20px;
    border-radius:10px;
    max-height: 200px;
    overflow: auto;
  }

  .copy-btn-pre {
    display: inline-block;
    margin-left: 10px;
    margin-bottom: 5px;
    padding: 2px 4px;
    cursor: pointer;
    color: #42b983;
    border-radius: 4px;
    &:hover {
      background-color: var(--md-preview-inlincode-bg-color);
    }
  }

  summary {
    cursor: pointer;
  }

  .markdown-editor-preview p {
    margin: 0 !important;
  }
`;
