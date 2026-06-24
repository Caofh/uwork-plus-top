import { h } from 'vue'

/**
[{
    iconClass: "pi pi-home",
    label: "首页",
    path: "/home",
}]
 */
function tabBar(tabBarList, setCarousel) {
  const items = tabBarList
    .filter(item => item.afterVersion === undefined || item.afterVersion === true)
    .map(item => {
      return {
        ...item,
        badge: item.badge,
        icon: () => {
          let cpt = null
          // 如果iconClassByImage存在，则使用图片作为图标
          if (item.iconClassByImage) {
            cpt = h('img', {
              style: {
                width: '100%',
                height: '100%',
                'border-radius': '50%',
                'object-fit': 'cover',
              },
              src: item.iconClassByImage,
            })
          } else {
            cpt = h('i', {
              class: item.iconClass,
            })
          }
          return cpt
        },
        label: item.label,
        onClick: () => {
          if (item.onClick) {
            item.onClick()
          } else {
            // 设置轮播
            setCarousel(item.path)
          }
        },
      }
    })
  return items

  //       icon: () =>
  //         h("i", {
  //           class: "pi pi-home",
  //           style: { fontSize: "18px", color: "white" },
  //         }),
  //       label: "首页",
  //       onClick: () => {
  //         // 设置轮播
  //         setCarousel("/home");
  //       },
  //     },
  //     {
  //       icon: () =>
  //         h("i", {
  //           class: "pi pi-inbox",
  //           style: { fontSize: "18px", color: "white" },
  //         }),
  //       label: "sh脚本",
  //       onClick: () => {
  //         // 设置轮播
  //         setCarousel("/sh");
  //       },
  //     },
  //     {
  //       icon: () =>
  //         h("i", {
  //           class: "pi pi-info",
  //           style: { fontSize: "18px", color: "white" },
  //         }),
  //       label: "关于",
  //       onClick: () => {
  //         // 设置轮播
  //         setCarousel("/about");
  //       },
  //     },
  //     // {
  //     //   icon: () =>
  //     //     h("i", {
  //     //       class: "pi pi-cog",
  //     //       style: { fontSize: "18px", color: "white" },
  //     //     }),
  //     //   label: "设置",
  //     //   onClick: () => {
  //     //     router.push("/setting");
  //     //   },
  //     // },
  //   ];
}

export { tabBar }
