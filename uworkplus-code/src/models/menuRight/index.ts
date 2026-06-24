import * as vscode from "vscode";
import { getInput, showInfo, inputBox } from "../../utils/utils";
const exec = require("child_process").exec;
const fs = require("fs");

function getMenuRight(context: vscode.ExtensionContext) {
  const downCpt = vscode.commands.registerCommand(
    "extension.downComponent",
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
      getInput("请输入组件路径").then((cptPath: any) => {
        if (!cptPath) {
          showInfo(`请输入组件路径`);
          return;
        }

        // const rootPath = context.globalState.get("uworkplus-code-base-dir", null);
        // console.log("rootPath");
        // console.log(rootPath);
        // // 组件目录地址
        // const originPath = `${rootPath}${cptPath}`;

        // 组件目录地址
        const originPath = cptPath;

        // 文件路径是否存在
        const isexist = fs.existsSync(originPath);
        if (isexist) {
          const command = `cp -rf ${originPath} ${path}`;
          exec(command, (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error(`执行命令时出错: ${error}`);
              showInfo(`组件生成失败: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`命令执行警告: ${stderr}`);
            }
            showInfo(`组件生成成功`);
          });
        } else {
          showInfo(`组件路径不存在；当前组件路径：${originPath}`);
        }
      });
    }
  );

  return downCpt;
}

export { getMenuRight };
