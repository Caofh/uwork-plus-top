import { create } from "zustand";

export interface ToolbarStoreType {
  isFullScreen: boolean;
  setIsFullScreen: (isFullScreen: boolean) => void;
  isOnlyWrite: boolean;
  setIsOnlyWrite: () => void;
  isOnlyPreview: boolean;
  setIsOnlyPreview: (payload: boolean) => void;
  isSidebar: boolean;
  sidebarComponent: React.ReactNode | null;
  componentMark: string | null;
  setSidebar: (sidebarComponent: React.ReactNode | null, componentMark: string | null) => void;
  closeSidebar: () => void;
}

const useToolbarStore = create<ToolbarStoreType>((set, get) => ({
  // 全屏
  isFullScreen: false,
  setIsFullScreen: (isFullScreen: boolean) => set({ isFullScreen }),
  // 只写
  isOnlyWrite: false,
  setIsOnlyWrite: () => {
    const { isOnlyWrite } = get();
    set({ isOnlyWrite: !isOnlyWrite, isOnlyPreview: false });
  },
  // 仅预览
  isOnlyPreview: false,
  setIsOnlyPreview: (payload?: boolean) => {
    const { isOnlyPreview } = get();
    if (String(payload) && String(payload) !== "undefined") {
      set({ isOnlyPreview: payload, isOnlyWrite: false });
    } else {
      set({ isOnlyPreview: !isOnlyPreview, isOnlyWrite: false });
    }
  },
  // 侧边栏
  isSidebar: false,
  sidebarComponent: null,
  componentMark: null,
  setSidebar: (sidebarComponent, componentMark) => {
    const { isSidebar, componentMark: oldMark } = get();
    if (componentMark === oldMark) {
      set({ isSidebar: !isSidebar });
    } else {
      set({ isSidebar: true, sidebarComponent, componentMark });
    }
  },
  closeSidebar: () => {
    set({ isSidebar: false });
  },
}));

export { useToolbarStore };
