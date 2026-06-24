/**
 * Vue 组件生成器
 * 基于 JSON Schema 生成 Vue 单文件组件
 */

export interface ComponentSchema {
  id: string;
  type: string;
  component: string;
  props: Record<string, any>;
  componentList?: ComponentSchema[];
}

export interface VueComponentOptions {
  componentName?: string;
  useCompositionAPI?: boolean;
  useTypeScript?: boolean;
  useScopedStyles?: boolean;
  includeLifecycle?: boolean;
}

// container唯一性索引
let containerIndex = 0;
// container样式索引
let containerIndexStyles: any = {};

/**
 * 递归生成 template 字符串✅
 * @param schema 组件 schema
 * @param depth 当前深度，用于缩进
 * @returns 生成的 template 字符串
 */
export function generateRecursiveTemplate(
  schema: ComponentSchema,
  depth: number = 0
): string {
  return generateElement(schema, depth);
}

/**
 * 根据 componentList 递归生成完整的 template✅
 * @param schema 根组件 schema
 * @returns 完整的 template 字符串
 */
export function generateTemplateFromComponentList(
  schema: ComponentSchema
): string {
  // 重置container唯一性索引
  containerIndex = 0;
  // 重置container样式索引
  containerIndexStyles = {};

  const template = generateRecursiveTemplate(schema);
  return `<template>\n <div class="lowcode-container">${template}</div>\n</template>`;
}

/**
 * 生成模板部分
 */
// function generateTemplate(schema: ComponentSchema): string {
//   const rootElement = generateElement(schema, 0);
//   return `<template>\n  ${rootElement}\n</template>`;
// }

/**
 * 递归生成元素✅
 */
function generateElement(schema: ComponentSchema, depth: number = 0): string {
  const { component, props, componentList } = schema;

  // 根据组件类型生成不同的元素
  let element: string;

  switch (component) {
    case "TextComponent":
      element = generateTextComponent(props);
      break;
    case "ContainerComponent":
      element = generateContainerComponent(props, componentList, depth);
      break;
    case "ButtonComponent":
      element = generateButtonComponent(props);
      break;
    default:
      element = generateGenericComponent(
        component,
        props,
        componentList,
        depth
      );
  }

  return element;
}

/**
 * 生成文本组件✅
 */
function generateTextComponent(props: Record<string, any>): string {
  const {
    text = "",
    fontSize = 14,
    color = "#333333",
    textAlign = "left",
  } = props;

  const style = `font-size: ${fontSize}px; color: ${color}; text-align: ${textAlign}; padding: 8px; line-height: 1.5;`;

  //   return `<div class="text-component" style="${style}">\n    ${text}\n  </div>`
  return `<div class="text-component">\n    ${text}\n  </div>`;
}

let index = 0;
/**
 * 生成容器组件✅
 */
function generateContainerComponent(
  props: Record<string, any>,
  componentList?: ComponentSchema[],
  depth: number = 0
): string {
  const {
    width = "auto",
    height = "auto",
    padding = 0,
    backgroundColor = "#ffffff",
  } = props;

  //   let flexClass = ''
  //   if (alignType === '1') {
  //     flexClass = 'flex flex-row '
  //     switch (alignType1DetailRow) {
  //       case 'left':
  //         flexClass += 'justify-start items-center'
  //         break
  //       case 'center':
  //         flexClass += 'justify-center items-center'
  //         break
  //       case 'right':
  //         flexClass += 'justify-end items-center'
  //         break
  //     }
  //   }
  const flexClass = transferTailWindString(props);

  let children = "";
  if (componentList && componentList.length > 0) {
    const indent = "  ".repeat(depth + 1);
    children =
      "\n" +
      componentList
        .map(
          (child) =>
            `${indent}${generateElement(child, depth + 1).replace(
              /\n/g,
              "\n" + indent
            )}`
        )
        .join("\n") +
      "\n" +
      "  ".repeat(depth);
  }

  //   return `<div class="container-component ${flexClass}" style="${style}">${children}</div>`

  // 累加container唯一性索引，保证每个container的data-key唯一
  containerIndex++;
  // console.log(containerIndex);

  // 存储container样式
  const style = `width: ${width}; height: ${height}; padding: ${padding}px; background-color: ${backgroundColor}; border: 1px solid #e9ecef; border-radius: 4px; min-height: 50px;`;
  if (!props?.classNameMain) {
    containerIndexStyles[`cpt-${containerIndex}`] = style;
  }

  return `<div class="${
    props?.classNameMain || ""
  } container-component ${flexClass}" data-key="cpt-${containerIndex}">${children}</div>`;
}

/**
 * 生成按钮组件✅
 */
function generateButtonComponent(props: Record<string, any>): string {
  const { text = "按钮", type = "primary", size = "default" } = props;

  return `<div class="button-component">\n    <el-button type="${type}" size="${size}">\n      ${text}\n    </el-button>\n  </div>`;
}

/**
 * 生成通用组件✅
 */
function generateGenericComponent(
  component: string,
  props: Record<string, any>,
  componentList?: ComponentSchema[],
  depth: number = 0
): string {
  const propsStr = Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  let children = "";
  if (componentList && componentList.length > 0) {
    const indent = "  ".repeat(depth + 1);
    children =
      "\n" +
      componentList
        .map(
          (child) =>
            `${indent}${generateElement(child, depth + 1).replace(
              /\n/g,
              "\n" + indent
            )}`
        )
        .join("\n") +
      "\n" +
      "  ".repeat(depth);
  }

  return `<${component.toLowerCase()} ${propsStr}>${children}</${component.toLowerCase()}>`;
}

/**
 * 生成脚本部分✅
 */
export function generateScript(
  schema: ComponentSchema,
  options: {
    componentName: string;
    useCompositionAPI: boolean;
    useTypeScript: boolean;
    includeLifecycle: boolean;
  }
): string {
  const { componentName, useCompositionAPI, useTypeScript, includeLifecycle } =
    options;

  if (useCompositionAPI) {
    return generateCompositionScript(
      schema,
      componentName,
      useTypeScript,
      includeLifecycle
    );
  } else {
    return generateOptionsScript(
      schema,
      componentName,
      useTypeScript,
      includeLifecycle
    );
  }
}

/**
 * 生成 Composition API 脚本✅
 */
function generateCompositionScript(
  schema: ComponentSchema,
  componentName: string,
  useTypeScript: boolean,
  includeLifecycle: boolean
): string {
  const imports = [
    "import { ref, reactive, computed } from 'vue'",
    "import { onMounted, onUnmounted } from 'vue'",
    "import './styles/index.scss'",
  ];

  if (useTypeScript) {
    imports.push("interface Props {", "  [key: string]: any", "}");
  }

  const setupContent = generateSetupContent(
    schema,
    useTypeScript,
    includeLifecycle
  );

  const scriptTag = useTypeScript
    ? '<script setup lang="ts">'
    : "<script setup>";

  return `${scriptTag}
  ${imports.join("\n")}
  
  ${
    useTypeScript
      ? "const props = withDefaults(defineProps<Props>(), {\n  // 默认属性\n})"
      : "const props = defineProps({\n  // 默认属性\n})"
  }
  
  ${setupContent}
  </script>`;
}

/**
 * 生成 setup 内容✅
 */
function generateSetupContent(
  schema: ComponentSchema,
  useTypeScript: boolean,
  includeLifecycle: boolean
): string {
  const content = [];

  // 生成生命周期钩子
  if (includeLifecycle) {
    content.push("");
    content.push("// 生命周期钩子");
    content.push("onMounted(() => {");
    content.push("  console.log('组件已挂载')");
    content.push("})");
    content.push("");
    content.push("onUnmounted(() => {");
    content.push("  console.log('组件已卸载')");
    content.push("})");
  }

  return content.join("\n");
}

/**
 * 生成 Options API 脚本✅
 */
function generateOptionsScript(
  schema: ComponentSchema,
  componentName: string,
  useTypeScript: boolean,
  includeLifecycle: boolean
): string {
  const scriptTag = useTypeScript ? '<script lang="ts">' : "<script>";

  return `${scriptTag}
  export default {
    name: '${componentName}',
    data() {
      return {
        data: {
          id: '${schema.id}',
          type: '${schema.type}',
          component: '${schema.component}',
          props: ${JSON.stringify(schema.props, null, 4)}
        }
      }
    },
    computed: {
      ${
        schema.component === "TextComponent"
          ? `textStyle() {
        return {
          fontSize: \`\${this.data.props.fontSize}px\`,
          color: this.data.props.color,
          textAlign: this.data.props.textAlign,
          padding: '8px',
          lineHeight: 1.5
        }
      }`
          : ""
      }
      ${
        schema.component === "ContainerComponent"
          ? `containerStyle() {
        return {
          width: this.data.props.width || '100%',
          height: this.data.props.height || 'auto',
          padding: \`\${this.data.props.padding || 10}px\`,
          backgroundColor: this.data.props.backgroundColor || '#ffffff',
          border: '1px solid #e9ecef',
          borderRadius: '4px'
        }
      }`
          : ""
      }
    }${
      includeLifecycle
        ? `,
    mounted() {
      console.log('组件已挂载')
    },
    unmounted() {
      console.log('组件已卸载')
    }`
        : ""
    }
  }
  </script>`;
}

/**
 * 生成样式部分✅
 */
export function generateStyle(
  schema: ComponentSchema,
  options: { useScopedStyles: boolean }
): { outFilesStyles: string; style: string } {
  const { useScopedStyles } = options;
  const scoped = useScopedStyles ? " scoped" : "";

  // 生成内部样式文件内容，.vue单文件组件内样式
  let styles = "";
  styles += `.lowcode-container {`;
  // 增加container-component的样式
  styles += `.container-component {
    &:not(.lowcode-main) {
      margin: 2px;
      height: auto;
      padding: 10px;
      background-color: #ffffff;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      min-height: 50px;
    }
  `;
  // 增加text-component的样式
  styles += `.text-component {
    padding: 8px;
    font-size: 14px;
    color: #333333;
    text-align: left;
    padding: 8px;
    line-height: 1.5;
  }`;
  // 增加tag的结尾
  styles += `}}`;

  // 生成外部样式文件内容
  let stylesOutFiles = `.lowcode-container {`;
  Object.entries(containerIndexStyles).forEach(([key, value]) => {
    stylesOutFiles += `[data-key="${key}"] {`;
    stylesOutFiles += value;
    stylesOutFiles += `}`;
  });
  stylesOutFiles += `}`;

  return {
    outFilesStyles: stylesOutFiles,
    style: `<style lang="scss"${scoped}>\n${styles}\n</style>`,
  };
}

export function transferTailWindString(props: Record<string, any>): string {
  // tailwind样式-预置
  const tailWind = {
    flexRowCenter: "flex flex-row justify-center items-center", // 横向水平居中
    flexRowStart: "flex flex-row justify-start items-center", // 横向水平靠左
    flexRowBetween: "flex flex-row justify-between items-center", // 横向水平靠两边
    flexRowEnd: "flex flex-row justify-end items-center", // 横向水平靠右
    flexColCenter: "flex flex-col justify-center items-center", // 纵向水平居中
    flexColStart: "flex flex-col justify-start items-center", // 纵向水平靠上
    flexColBetween: "flex flex-col justify-between items-center", // 纵向水平靠上下两边
    flexColEnd: "flex flex-col justify-end items-center", // 纵向水平靠下
    flexWrap: "flex-wrap",
    flexGap: "gap-[10px]",
  };

  let cssClassStringArr: string[] = [];

  // const props = dataInner.value.props || {}

  if (props?.alignType === "1") {
    if (props?.alignType1DetailRow === "left") {
      cssClassStringArr.push(tailWind.flexRowStart);
    } else if (props?.alignType1DetailRow === "center") {
      cssClassStringArr.push(tailWind.flexRowCenter);
    } else if (props?.alignType1DetailRow === "right") {
      cssClassStringArr.push(tailWind.flexRowEnd);
    } else if (props?.alignType1DetailRow === "justify") {
      cssClassStringArr.push(tailWind.flexRowBetween);
    }

    if (props?.alignType1DetailCol) {
      // 清除掉原有的 'items-center' 类名
      cssClassStringArr = cssClassStringArr.map((item) =>
        item.replace(/items-center/g, "")
      );

      if (props?.alignType1DetailCol === "top") {
        cssClassStringArr.push("items-start");
      } else if (props?.alignType1DetailCol === "center") {
        cssClassStringArr.push("items-center");
      } else if (props?.alignType1DetailCol === "bottom") {
        cssClassStringArr.push("items-end");
      }
    }
  } else if (props?.alignType === "2") {
    if (props?.alignType2DetailRow === "top") {
      cssClassStringArr.push(tailWind.flexColStart);
    } else if (props?.alignType2DetailRow === "center") {
      cssClassStringArr.push(tailWind.flexColCenter);
    } else if (props?.alignType2DetailRow === "bottom") {
      cssClassStringArr.push(tailWind.flexColEnd);
    } else if (props?.alignType2DetailRow === "justify") {
      cssClassStringArr.push(tailWind.flexColBetween);
    }

    if (props?.alignType2DetailCol) {
      // 清除掉原有的 'items-center' 类名
      cssClassStringArr = cssClassStringArr.map((item) =>
        item.replace(/items-center/g, "")
      );

      if (props?.alignType2DetailCol === "left") {
        cssClassStringArr.push("items-start");
      } else if (props?.alignType2DetailCol === "center") {
        cssClassStringArr.push("items-center");
      } else if (props?.alignType2DetailCol === "right") {
        cssClassStringArr.push("items-end");
      }
    }
  }

  // 处理换行tailwind的class类
  if (props?.alignTypeWrap) {
    cssClassStringArr.push("flex-wrap");
  }

  const cssClassString = cssClassStringArr.join(" ");
  return cssClassString;
}
