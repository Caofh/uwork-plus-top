import * as vscode from "vscode";
import { getInput, showInfo, inputBox } from "../../utils/utils";
const exec = require("child_process").exec;
const fs = require("fs");
import {
  generateTemplateFromComponentList,
  generateStyle,
  generateScript,
} from "./utils";
// import { jsonSchema } from "./utils/mock";

function getMenuRightDownLowcode(context: vscode.ExtensionContext) {
  const downCpt = vscode.commands.registerCommand(
    "extension.downLowcode",
    (uri) => {
      // 处理文件夹右键事件
      let path: string;

      if (uri && uri.fsPath) {
        // 如果右键点击的是文件夹，使用文件夹路径
        path = uri.fsPath;
      } else {
        // 如果没有选择文件夹，使用当前工作区路径
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
          path = workspaceFolder.uri.fsPath;
        } else {
          showInfo("请先选择一个文件夹或打开工作区");
          return;
        }
      }

      console.log("选择的文件夹路径:", path);

      // 获取用户输入
      getInput("请输入jsonschema低代码结构").then((jsonSchema: any) => {
        if (!jsonSchema) {
          showInfo(`请输入jsonschema低代码结构`);
          return;
        }

        const lowcodeDir = `${path}/lowcode`;
        const vueFile = `${lowcodeDir}/LowcodeView.vue`;

        let parsedSchema;
        try {
          parsedSchema = JSON.parse(jsonSchema);
          // 验证解析后的数据结构
          if (!Array.isArray(parsedSchema)) {
            showInfo("JSON Schema 必须是数组格式");
            return;
          }
        } catch (parseError) {
          showInfo(`JSON 解析失败: ${parseError}`);
          return;
        }

        const dataObject = {
          component: "ContainerComponent",
          props: {
            classNameMain: "lowcode-main",
          },
          componentList: parsedSchema,
        };
        // 生成模板
        const template = generateTemplateFromComponentList(dataObject as any);
        // 生成样式
        const { outFilesStyles, style } = generateStyle(dataObject as any, {
          useScopedStyles: true,
        });
        // 生成js
        const script = generateScript(dataObject as any, {
          componentName: "ContainerComponent",
          useCompositionAPI: true,
          useTypeScript: true,
          includeLifecycle: true,
        });

        // 验证生成的内容
        if (!template || !script || !style) {
          showInfo("生成Vue组件内容失败，请检查输入的JSON Schema格式");
          return;
        }

        const fileContent = `${template}\n\n${script}\n\n${style}`;
        // 写入vue文件
        try {
          const command = `mkdir -p ${lowcodeDir}`;
          exec(command, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error(`执行命令时出错: ${error}`);
              showInfo(`创建 lowcode 目录失败: ${error.message}`);
              return;
            }

            // 使用异步方式写入文件，避免阻塞
            fs.writeFile(
              vueFile,
              fileContent,
              { encoding: "utf8" },
              (writeError: any) => {
                if (writeError) {
                  console.error("写入文件失败:", writeError);
                  showInfo(`写入文件失败: ${writeError.message}`);
                  return;
                }

                // 延迟显示成功消息，让文件系统完全写入并避免扩展冲突
                setTimeout(() => {
                  showInfo(`已在 ${lowcodeDir} 下创建 LowcodeView.vue`);
                }, 200);
              }
            );
          });
        } catch (err: any) {
          console.error("创建 lowcode/index.vue 时出错:", err);
          showInfo(`创建 lowcode/index.vue 失败: ${err?.message || err}`);
        }

        // 写入样式文件
        try {
          const command = `mkdir -p ${lowcodeDir}/styles`;
          exec(command, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error(`执行命令时出错: ${error}`);
              showInfo(`创建 lowcode 目录失败: ${error.message}`);
              return;
            }
            fs.writeFile(
              `${lowcodeDir}/styles/index.scss`,
              outFilesStyles,
              { encoding: "utf8" },
              (writeError: any) => {
                if (writeError) {
                  console.error("写入文件失败:", writeError);
                  showInfo(`写入文件失败: ${writeError.message}`);
                  return;
                }
                showInfo(`已在 ${lowcodeDir}/styles 下创建 index.scss`);
              }
            );
          });
        } catch (err: any) {
          console.error("创建 lowcode/styles/index.scss 时出错:", err);
          showInfo(
            `创建 lowcode/styles/index.scss 失败: ${err?.message || err}`
          );
        }

        // 文件路径是否存在
        // const isexist = fs.existsSync(originPath);
        // if (isexist) {
        //   const command = `cp -rf ${originPath} ${path}`;
        //   exec(command, (error: any, stdout: any, stderr: any) => {
        //     if (error) {
        //       console.error(`执行命令时出错: ${error}`);
        //       showInfo(`组件生成失败: ${error.message}`);
        //       return;
        //     }
        //     if (stderr) {
        //       console.error(`命令执行警告: ${stderr}`);
        //     }
        //     showInfo(`组件生成成功`);
        //   });
        // } else {
        //   showInfo(`组件路径不存在；当前组件路径：${originPath}`);
        // }
      });
    }
  );

  return downCpt;
}

export { getMenuRightDownLowcode };
