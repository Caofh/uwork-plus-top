import { formatContents, Title } from "@/utils/format-contents";
import { Anchor } from "antd";
import { FC, useEffect, useMemo, useState } from "react";
import { useEditorContentStore } from "@/store/editor";
import { CLASS_PREFIX } from "@/common";

const Contents: FC = () => {
  const previewView = useEditorContentStore((state) => state.previewView);
  const [titles, setTitles] = useState<Title[]>([]);
  const [activeLink, setActiveLink] = useState<string>("");
  let preview: any = document.querySelector(".markdown-editor-preview") as HTMLElement | null;
  // const [preview, setPreview] = useState<any>(document.querySelector(".markdown-editor-preview"));
  const getRootElement = () => {
    return preview?.querySelectorAll("h1, h2, h3, h4, h5, h6") as NodeListOf<HTMLElement>;
  };

  const [refresh, setRefresh] = useState(true);
  const rootElement = useMemo(getRootElement, [preview, refresh]);
  
  // 获取 preview 容器的标题节点
  const addAnchor = () => {
    if (!rootElement) return [];
    rootElement.forEach((node) => {
      const line = node.getAttribute("data-line");
      if (!line) return;
      node.setAttribute("id", line);
    });
    return formatContents(rootElement);
  };

  useEffect(() => {
    if (!preview) return;

    // 初始化时立即执行一次
    if (rootElement.length > 0) {
      const initialTitles = addAnchor();
      setTitles(initialTitles);
      if (initialTitles.length > 0) {
        setActiveLink(initialTitles[0].href);
      }
    }

    const observer = new MutationObserver(() => {
      // 再获取一次元素，防止更新不及时
      const elements = getRootElement();
      if (elements && elements.length > 0) {
        requestAnimationFrame(() => {
          const newTitles = formatContents(elements);
          setTitles(newTitles);
          if (newTitles.length > 0 && !activeLink) {
            setActiveLink(newTitles[0].href);
          }

          setRefresh(false);
          setTimeout(() => {
            setRefresh(true);
          }, 300);
        });
      }
    });

    observer.observe(preview, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [preview, rootElement, refresh]);

  // 监听滚动更新高亮
  useEffect(() => {
    if (!preview) return;

    const handleScroll = () => {
      const elements = getRootElement();
      if (!elements) return;

      // 找到当前视口中最靠近顶部的标题
      let closestTitle = null;
      let minDistance = Infinity;

      elements.forEach((element) => {
        // 判断哪个标题离视口顶部最近
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top);
        if (distance < minDistance) {
          minDistance = distance;
          closestTitle = element;
        }
      });

      if (closestTitle) {
        const line = (closestTitle as HTMLElement).getAttribute("data-line");
        if (line) {
          setActiveLink(`#${line}`);
        }
      }
    };

    preview.addEventListener("scroll", handleScroll);
    return () => preview.removeEventListener("scroll", handleScroll);
  }, [preview, refresh]);

  // 自定义高亮锚点
  const getCurrentAnchor = () => {
    return activeLink;
  };

  const handleClickAnchor = (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    link: {
      title: React.ReactNode;
      href: string;
    },
  ) => {
    e.preventDefault();
    if (link.href && previewView) {
      // 从href中提取data-line值
      const dataLine = link.href.replace("#", "");
      const targetElement = previewView.querySelector(`[data-line="${dataLine}"]`);
      if (targetElement) {
        setActiveLink(link.href);
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  };

  const handleChange = (link: string) => {
    console.log("link");
    console.log(link);

    // setActiveLink(link);
  };

  return titles.length > 0 && preview ? (
    // <Anchor
    //   style={{
    //     // position: "fixed",
    //     // maxHeight: "300px",
    //     // width: "300px",
    //     // overflowY: "auto",
    //   }}
    //   affix={false}
    //   items={titles}
    //   getCurrentAnchor={getCurrentAnchor}
    //   getContainer={() => preview}
    //   onClick={handleClickAnchor}
    //   onChange={handleChange}
    //   className={`${CLASS_PREFIX}-sidebar-contents`}
    // />

    <Anchor
      affix={false}
      getContainer={() => preview}
      onChange={handleChange}
      onClick={handleClickAnchor}
      items={titles}
      className={`${CLASS_PREFIX}-sidebar-contents`}
    />
  ) : null;
};

export default Contents;
