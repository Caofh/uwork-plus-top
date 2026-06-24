import FullScreenIcon from "@/assets/images/fullscreen.svg?raw";
import ExitFullScreenIcon from "@/assets/images/exit-fullscreen.svg?raw";
import IconTooltip from "../base/IconTooltip";
import { useToolbarStore } from "@/store/toolbar";
import { Hotkey } from "@/common/hotkeys";
import { t, type TRANSLATION_KEYS } from "@/locales";
import { TOOLBAR_KEYS } from "@/locales/keys";
import { eventBus } from "@/utils/EventBus";
import { useEffect } from "react";

const FullScreen = () => {
  const { isFullScreen, setIsFullScreen, closeSidebar } = useToolbarStore();

  const handleFullScreenToggle = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);

    if (!newFullScreenState) {
      closeSidebar();
    }

    // 触发事件通知 ToolbarConfig
    eventBus.emit("fullscreen-changed", newFullScreenState);
  };

  // useEffect(() => {
  //   setTimeout(() => {
  //     document.querySelectorAll(".ant-tooltip").forEach((item) => {
  //       item.classList.add("ant-tooltip-hidden");
  //     });
  //   }, 300);
  // }, [isFullScreen]);

  return (
    <>
      <IconTooltip
        content={t(TOOLBAR_KEYS.TOOLBAR.fullscreen as TRANSLATION_KEYS)}
        description={Hotkey.FULL_SCREEN.readableCommand}
        placement={isFullScreen ? "bottom" : "top"}
        onClick={handleFullScreenToggle}
      >
        <div
          className="icon"
          dangerouslySetInnerHTML={{ __html: isFullScreen ? ExitFullScreenIcon : FullScreenIcon }}
        ></div>
      </IconTooltip>
    </>
  );
};

export default FullScreen;
