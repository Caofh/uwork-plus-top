import { axios } from "../../utils/api";
import { isClass, cmd, exiteDir, readFile, writeFile } from "../../utils/utils";
import { cloneDeep } from "lodash";
import {
  languages,
  TextDocument,
  Position,
  CancellationToken,
  CompletionContext,
  CompletionItem,
  ExtensionContext,
} from "vscode";

// 获取vscode规定的代码片段实例数组
async function getSnippets(context: ExtensionContext, dir: string) {
  // 获取代码数据，并经过数据转换
  const codeData = await getCodeData(context, dir);
  let snippets: any = [];
  // console.log("languages");
  // console.log(await languages.getLanguages());
  // console.log(codeData);
  codeData.map((item, index) => {
    // 代码片段
    const snippetContainer = languages.registerCompletionItemProvider(
      item.contentType,
      {
        provideCompletionItems(
          document: TextDocument,
          position: Position,
          token: CancellationToken,
          context: CompletionContext
        ) {
          const commandCompletion = new CompletionItem(item.name || "");
          commandCompletion.insertText = item.content || "";
          return [commandCompletion];
        },
      }
    );
    // 追加vscode功能
    snippets.push(snippetContainer);
  });
  return snippets;
}

// 代码片段数据改从本地 dataSql 文件读取
async function getCodeData(context: ExtensionContext, dir: string) {
  //  代码分组数据文件
  const fileGroupPath = `${dir}/dataSql/dataSnippetType.json`;
  const fileCodeDataPath = `${dir}/dataSql/dataSnippet.json`;
  const fileGroupPathJson: any = await readFile(fileGroupPath);
  const fileCodeDataPathJson: any = await readFile(fileCodeDataPath);

  // 代码分组数据
  const fileGroupMap: any = {};
  if (fileGroupPathJson && fileGroupPathJson.length) {
    fileGroupPathJson.forEach((item: any) => {
      fileGroupMap[item.id] = item.type_name;
    });
  }

  // 代码数据追加分组名称
  fileCodeDataPathJson.forEach((item: any) => {
    item.code_type_name = fileGroupMap[item.code_type] || "默认分类";
  });
  // console.log("fileCodeDataPathJson");
  // console.log(fileCodeDataPathJson);

  // 数据处理
  let data = await handleData(fileCodeDataPathJson);
  return data;
}
async function handleData(data: any): Promise<any[]> {
  // console.log(data);
  // 最终的language数据
  let arr: Array<any> = [];

  // return;
  // const langusgeLists = await languages.getLanguages();

  // 常见前端语言
  const frontendLanguages = [
    "html", // 网页结构
    "css", // 样式设计
    "vue", // 前端框架
    "javascriptreact", // React with JavaScript
    "typescriptreact", // React with TypeScript
    "scss", // CSS预处理器
    "less", // CSS预处理器
    "handlebars", // 模板引擎
  ];

  // 常见后端语言
  const backendLanguages = [
    "java", // 企业级后端
    "python", // 全栈开发
    "go", // 高性能后端
    "csharp", // .NET生态
    "php", // Web开发
    "ruby", // Web开发
    "rust", // 系统编程
    "c", // 系统级开发
    "cpp", // 系统级开发
    "shellscript", // 系统运维
  ];

  // 常见全栈语言（包含前后端通用语言）
  const fullstackLanguages = [
    "javascript", // 全栈语言
    "typescript", // 全栈语言
    "json", // 数据交换
    "yaml", // 配置文件
    "dockerfile", // 容器化
    "dockercompose", // 容器编排
    "markdown", // 文档编写
    "sql", // 数据库
  ];

  // 汇总常见语言
  const langusgeList = [
    ...frontendLanguages,
    ...backendLanguages,
    ...fullstackLanguages,
  ];
  // console.log("langusgeList");
  // console.log(langusgeList);

  data = data.map((item: any) => {
    let obj: any = {
      content: transContent(item.article_content),
      contentType: "", // 语言：如：vue
      created: item.create_time || "",
      name:
        item.code_type_name && item.article_name
          ? `${item.code_type_name}_${item.article_name}`
          : "",
      tags: item.id ? [item.id] : [],
    };

    // 根据语言区分代码数据
    if (langusgeList && langusgeList.length) {
      langusgeList.forEach((codeType: string) => {
        const objNew = cloneDeep(obj);
        objNew.contentType = codeType;
        arr.push(objNew);
      });
    }
  });
  // console.log(arr);
  return arr;
}
function transContent(article_content: string) {
  const entitys = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    '<pre class="ql-syntax" spellcheck="false">': "",
    "</pre>": "",
  };
  // html实体还原
  const content: string = article_content
    ? convert(entitys, article_content)
    : "";
  return content;
}
/**
 * 字符串替换方法
 * @param {*} entitys 实体列表
 * @param {*} str 需要替换的原字符串
 * @returns
 */
/*  调用示例
      cosnt entitys = {
          '&' : '&amp;',
          '<' : '&lt;',
          '>' : '&gt;',
          '"' : '&quot;',
          "'" : '&apos;'
      }
      const result = convert(entitys, 'a&b<c>d') // 输出：a&amp;b&lt;c&gt;d
  */
function convert(entitys: any, str: string) {
  var regexp = new RegExp("(" + Object.keys(entitys).join("|") + ")", "g");
  return str.replace(regexp, function (matched) {
    return entitys[matched];
  });
}

export { getSnippets, transContent };
