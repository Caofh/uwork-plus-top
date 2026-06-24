### 使用示例

```
// 示例数据结构
const menuData = [
  {
    index: "1",
    title: "Navigator One",
    icon: "Location",
    children: [
      {
        index: "1-1",
        title: "item one",
        children: [
          {
            index: "1-1-1",
            title: "Navigator Two-1-1-1",
            icon: "IconMenu",
            children: [],
          },
          {
            index: "1-1-2",
            title: "Navigator Three-1-1-2",
            icon: "Document",
            disabled: true,
            children: [],
          },
        ],
      },
      {
        index: "1-2",
        title: "item two",
        children: [],
      },
    ],
  },
  {
    index: "2",
    title: "Navigator Two",
    icon: "IconMenu",
    children: [],
  },
];

// 使用基础版本
const result = findGroupById(menuData, "1-1-1");
if (result) {
  console.log("父级:", result.parent);        // 包含 "1-1" 的项
  console.log("子项:", result.child);         // 包含 "1-1-1" 的项
  console.log("完整路径:", result.path);      // ["1", "1-1", "1-1-1"]
}

// 使用增强版本
const finder = new GroupFinder(menuData, 'index');

// 查找父级
const parent = finder.findParentById("1-1-1");
console.log("父级:", parent); // 包含 "1-1" 的项

// 查找所有父级路径
const allParents = finder.findAllParents("1-1-1");
console.log("所有父级:", allParents); // ["1", "1-1"]

// 查找兄弟项
const siblings = finder.findSiblings("1-1-1");
console.log("兄弟项:", siblings); // ["1-1-2"]

// 查找根级组
const root = finder.findRootGroup("1-1-1");
console.log("根级组:", root); // 包含 "1" 的项

// 检查是否为叶子节点
const isLeaf = finder.isLeafNode("1-1-1");
console.log("是否为叶子节点:", isLeaf); // true

// 获取节点深度
const depth = finder.getNodeDepth("1-1-1");
console.log("节点深度:", depth); // 3
```
