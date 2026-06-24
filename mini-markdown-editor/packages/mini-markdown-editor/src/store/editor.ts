import { create } from "zustand";
import type { EditorView } from "@codemirror/view";

interface PageObjType {
  type: "edit" | "look";
  curerntDoc: {
    content: string;
  };
}
interface QiankunProps {
  msg?: string;
  onGlobalStateChange?: (callback: (state: any, prev: any) => void) => void;
  onMessage?: (data: { val: string; view: any }) => void;
  container?: HTMLElement;
}

interface EditorContentStoreType {
  content: string;
  setContent: (content: string) => void;
  scrollWrapper: string;
  setScrollWrapper: (scrollWrapper: string) => void;
  // 编辑区
  editorView: EditorView | null;
  setEditorView: (view: EditorView | null) => void;
  // 预览区
  previewView: HTMLElement | null;
  setPreviewView: (view: HTMLElement | null) => void;
  // 页面类型
  pageObj: PageObjType | null;
  setPage: (pageObj: PageObjType | null) => void;
  qiankunProps: QiankunProps | null;
  setQiankunProps: (props: QiankunProps) => void;
}

// 编辑器内容状态
const useEditorContentStore = create<EditorContentStoreType>((set) => ({
  content: "",
  setContent: (content: string) => {
    return set({ content })
  },
  scrollWrapper: "",
  setScrollWrapper: (scrollWrapper: string) => set({ scrollWrapper }),
  // 编辑区
  editorView: null,
  setEditorView: (view: EditorView | null) => set({ editorView: view }),
  // 预览区
  previewView: null,
  setPreviewView: (view: HTMLElement | null) => set({ previewView: view }),
  // pageType
  pageObj: null,
  setPage: (pageObj: PageObjType | null) => set({ pageObj }),
  // qiankunProps乾坤上下文j
  qiankunProps: null,
  setQiankunProps: (qiankunProps: QiankunProps | null) => set({ qiankunProps }),
}));

export { useEditorContentStore };
