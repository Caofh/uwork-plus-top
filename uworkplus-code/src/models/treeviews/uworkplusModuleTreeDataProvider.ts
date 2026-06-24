import * as vscode from "vscode";

// api
import { axios } from "../../utils/api";
import { isClass } from "../../utils/utils";
import { getSvgPath, readFile, showInfo, showMultiTextDialog } from "../../utils/utils";
import { getCptModuleDataFromFile } from "./model";

// 本地方法
import { transContent } from "../code";

const COMMANDMODELENAME = "chooseModule";

class TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly iconPath?: string
  ) {}
}

class ParentTreeItem extends TreeItem {
  children: TreeItem[] = [];

  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
  }
}

class LeafTreeItem extends TreeItem {
  constructor(label: string, command?: any, iconPath?: any) {
    super(label, vscode.TreeItemCollapsibleState.None, command, iconPath);
  }
}

class ModuleTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    // return element;
    // console.log("element");
    // console.log(element);

    return {
      label: element.label,
      collapsibleState: element.collapsibleState,
      command: element.command,
      iconPath: element.iconPath, // 在这里设置图标路径
    };
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const codeData = await getCodeData(this.context);
    if (!element) {
      let result: any = [];
      codeData.map((item: any, index: number) => {
        const parentName =
          item.name && item.modalNameDir
            ? `${item.name}_${item.modalNameDir}`
            : ``;
        // 转译代码实体
        const content = item.modalNameDir
          ? transContent(item.modalNameDir)
          : "";
        // views视图中code的icon
        const icn = getSvgPath("code-item");

        let parent = new LeafTreeItem(
          parentName,
          {
            command: COMMANDMODELENAME, // 注册的命令
            arguments: [
              `${content}；请到“UworkPlus-代码沉淀”中复制链接！`,
            ],
          },
          icn
        );

        result.push(parent);
      });

      // const icn = getSvgPath("code-item");
      // let parent = new LeafTreeItem(
      //   "敬请期待...",
      //   {
      //     command: COMMANDMODELENAME, // 注册的命令
      //     arguments: ["功能尚未完成，敬请期待..."],
      //   },
      //   icn
      // );
      // result.push(parent);

      return Promise.resolve(result);
    } else if (element instanceof ParentTreeItem) {
      return Promise.resolve(element.children);
    }
    return Promise.resolve([]);
  }
}

// 代码片段数据改从本地 dataSql 文件读取
async function getCodeData(context: vscode.ExtensionContext) {
  const codeData = await getCptModuleDataFromFile(context);
  return codeData;
}

// 点击views中的code
const chooseViewCode = (res: string) => {
  showInfo(res);
  // const editor = vscode.window.activeTextEditor;
  // if (editor) {
  //   const position = editor?.selection.active;
  //   editor.edit((edit) => {
  //     edit.insert(position, code || "");
  //   });
  // }
};
const getChooseViewModuleData = () => {
  return vscode.commands.registerCommand(COMMANDMODELENAME, chooseViewCode);
};

export { ModuleTreeDataProvider, getChooseViewModuleData };
