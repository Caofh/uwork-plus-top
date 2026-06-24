import * as vscode from "vscode";
const os = require("os");
import { getSnippets } from "./models/code";
import { createVscodePluginInfo } from "./models/createPluginInfo";
import { getPluginVersion, showInfo } from "./utils/utils";
import {
  MyTreeDataProvider,
  getChooseViewCodeData,
} from "./models/treeviews/uworkplusCodeTreeDataProvider";
import {
  ModuleTreeDataProvider,
  getChooseViewModuleData,
} from "./models/treeviews/uworkplusModuleTreeDataProvider";
import { getMenuRight } from "./models/menuRight";
import { getMenuRightDownLowcode } from "./models/menuRightDownLowcode";
import { getMenuRightOpenLowcodeWebsite } from "./models/menuRightOpenLowcodeWebsite";

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "uworkplus-code" is now active!'
  );

  // vscode菜单右键命令-downComponent
  const menuRight = getMenuRight(context);
  context.subscriptions.push(menuRight); // 追加vscode功能

  // vscode菜单右键命令-downLowcode
  const menuRightDownLowcode = getMenuRightDownLowcode(context);
  context.subscriptions.push(menuRightDownLowcode); // 追加vscode功能

  // vscode菜单右键命令-openLowcodeWebsite
  const menuRightOpenLowcodeWebsite = getMenuRightOpenLowcodeWebsite(context);
  context.subscriptions.push(menuRightOpenLowcodeWebsite); // 追加vscode功能

  // 获取用户电脑的根目录路径，并存储到全局变量中
  // const rootPath = `UWORK-PLUS-dev`;
  const rootPath = `UWORK-PLUS`;
  const baseDir = `${os.homedir()}/${rootPath}`; // UworkPlus根目录
  context.globalState.update("uworkplus-code-base-dir", baseDir);

  // mac电脑UworkPlus根目录中创建vscode插件基础数据信息，便于获取
  const version = getPluginVersion();
  createVscodePluginInfo(baseDir, version);

  // vscode追加代码片段功能
  const snippetsData = await getSnippets(context, baseDir);
  context.subscriptions.push(...snippetsData); // 追加vscode功能

  // 创建treeviews视图相关 -----
  const myTreeDataProvider = new MyTreeDataProvider(context);
  vscode.window.registerTreeDataProvider("uworkplusCode", myTreeDataProvider);
  const moduleTreeDataProvider = new ModuleTreeDataProvider(context);
  vscode.window.registerTreeDataProvider(
    "uworkplusCpt",
    moduleTreeDataProvider
  );
  // 创建treeviews视图相关 -----

  // views视图中code的点击事件
  const chooseViewCode = getChooseViewCodeData();
  context.subscriptions.push(chooseViewCode); // 追加vscode功能

  // views视图中module的点击事件
  const chooseViewModule = getChooseViewModuleData();
  context.subscriptions.push(chooseViewModule); // 追加vscode功能
}

// This method is called when your extension is deactivated
export function deactivate() {}
