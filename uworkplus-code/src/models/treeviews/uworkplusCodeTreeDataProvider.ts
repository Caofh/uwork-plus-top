import * as vscode from "vscode";

// api
import { axios } from "../../utils/api";
import { isClass } from "../../utils/utils";
import { getSvgPath, readFile, showMultiTextDialog } from "../../utils/utils";
import { getCodeDataFromFile } from "./model";

// 本地方法
import { transContent } from "../code";

// 点击views中的code，命令名称
const COMMANDNAME = "chooseCode";

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

class MyTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
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
          item.code_type_name && item.article_name
            ? `${item.code_type_name}_${item.article_name}`
            : ``;
        // 转译代码实体
        const content = item.article_content
          ? transContent(item.article_content)
          : "";
        // views视图中code的icon
        const icn = getSvgPath("code-item");

        let parent = new LeafTreeItem(
          parentName,
          {
            command: COMMANDNAME, // 注册的命令
            arguments: [content],
          },
          icn
        );

        result.push(parent);
      });

      return Promise.resolve(result);
    } else if (element instanceof ParentTreeItem) {
      return Promise.resolve(element.children);
    }
    return Promise.resolve([]);
  }
}

// 代码片段数据改从本地 dataSql 文件读取
async function getCodeData(context: vscode.ExtensionContext) {
  const codeData = await getCodeDataFromFile(context);
  return codeData;
}

// 点击views中的code
const chooseViewCode = (code: string) => {
  // 显示代码弹窗
  showMultiTextDialog("代码详情", code, {
    showLineNumbers: true,
    lineHeight: 0.8,
    wordWrap: false,
    height: 500,
  });

  // const editor = vscode.window.activeTextEditor;
  // if (editor) {
  //   const position = editor?.selection.active;
  //   editor.edit((edit) => {
  //     edit.insert(position, code || "");
  //   });
  // }
};
const getChooseViewCodeData = () => {
  return vscode.commands.registerCommand(COMMANDNAME, chooseViewCode);
};

export { MyTreeDataProvider, getChooseViewCodeData };
