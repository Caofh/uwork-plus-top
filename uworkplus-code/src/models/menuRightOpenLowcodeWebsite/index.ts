import * as vscode from "vscode";
import { showInfo } from "../../utils/utils";
import { getLowcodeEditorUrl } from "../../config";

function getMenuRightOpenLowcodeWebsite(context: vscode.ExtensionContext) {
  const downCpt = vscode.commands.registerCommand(
    "extension.openLowcodeWebsite",
    (uri) => {
      // 处理文件夹右键事件
      let path: string;

      if (uri && uri.fsPath) {
        path = uri.fsPath;
      } else {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
          path = workspaceFolder.uri.fsPath;
        } else {
          showInfo("请先选择一个文件夹或打开工作区");
          return;
        }
      }

      console.log("选择的文件夹路径:", path);

      const url = getLowcodeEditorUrl();
      if (!url) {
        showInfo("请先在 VS Code 设置中配置 uworkplus.lowcodeEditorUrl 或 uworkplus.remoteOrigin");
        return;
      }
      vscode.env.openExternal(vscode.Uri.parse(url)).then(
        () => {
          showInfo("已打开低代码编辑器");
        },
        (error: unknown) => {
          console.error("打开网页失败:", error);
          showInfo("打开网页失败，请手动访问: " + url);
        }
      );
    }
  );

  return downCpt;
}

export { getMenuRightOpenLowcodeWebsite };
