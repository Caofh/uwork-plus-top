const vscode = require("vscode");
import { join as pathJoin } from "path";
const fs = require("fs");
const child_process = require("child_process");
const os = require("os");

// 获取用户输入字符串方法
function getInput(placeHolder = "请输入") {
  return new Promise((resolve, reject) => {
    vscode.window
      .showInputBox({
        // 这个对象中所有参数都是可选参数
        password: false, // 输入内容是否是密码
        ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
        placeHolder: placeHolder, // 在输入框内的提示信息
        // prompt: '请输入', // 在输入框下方的提示信息
      })
      .then(function (name: any) {
        resolve(name);
      });
  });
}

function showInfo(msg: string = "") {
  vscode.window.showInformationMessage(msg);
}

interface DialogOptions {
  width?: number; // 宽度（暂未实现）
  height?: number; // 高度
  showLineNumbers?: boolean; // 是否显示行号
  lineHeight?: string | number; // 行高
  wordWrap?: boolean; // 是否自动换行
  readonly?: boolean; // 是否只读（暂未实现）
}
// 显示多文本弹窗
/**
 * 
 * @param title 
 * @param content 
 * @param options 
 * @returns 
  showMultiTextDialog("标题", "内容", {
    height: 400,
    wordWrap: true
  });
*/
function showMultiTextDialog(
  title: string,
  content: string | string[],
  options?: DialogOptions
) {
  return new Promise((resolve, reject) => {
    // 创建WebView面板
    const panel = vscode.window.createWebviewPanel(
      "multiTextDialog",
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // 处理多行文本内容
    let textContent = "";
    if (Array.isArray(content)) {
      textContent = content.join("\n");
    } else {
      textContent = content;
    }

    // 生成HTML内容
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 100%;
            margin: 0 auto;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            color: var(--vscode-titleBar-activeForeground);
            margin: 0;
          }
          .content {
            background-color: var(--vscode-textBlockQuote-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: ${options?.height || 400}px;
            overflow-y: auto;
            font-family: ${options?.showLineNumbers ? "monospace" : "inherit"};
            font-size: ${options?.showLineNumbers ? "13px" : "inherit"};
            line-height: ${options?.lineHeight || "1.4"};
          }
          .buttons {
            margin-top: 20px;
            text-align: right;
          }
          .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            margin-left: 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }
          .line-numbers {
            counter-reset: line;
          }
          .line-numbers .line {
            counter-increment: line;
            position: relative;
            padding-left: 3em;
          }
          .line-numbers .line:before {
            content: counter(line);
            position: absolute;
            left: 0;
            top: 0;
            width: 2em;
            text-align: right;
            color: var(--vscode-editorLineNumber-foreground);
            font-size: 12px;
            padding-right: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">${title}</h1>
          </div>
          <div class="content ${
            options?.showLineNumbers ? "line-numbers" : ""
          }" 
               style="word-wrap: ${
                 options?.wordWrap ? "break-word" : "normal"
               };">
            ${textContent
              .split("\n")
              .map((line, index) => `<div class="line">${line}</div>`)
              .join("\n")}
          </div>
          <div class="buttons">
            <button class="btn btn-secondary" onclick="copyToClipboard()">复制内容</button>
            <button class="btn" onclick="closeDialog()">关闭</button>
          </div>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function copyToClipboard() {
            const content = \`${textContent
              .replace(/`/g, "\\`")
              .replace(/\$/g, "\\$")}\`;
            navigator.clipboard.writeText(content).then(() => {
              vscode.postMessage({
                command: 'showInfo',
                text: '内容已复制到剪贴板'
              });
            }).catch(err => {
              vscode.postMessage({
                command: 'showError',
                text: '复制失败: ' + err.message
              });
            });
          }
          
          function closeDialog() {
            vscode.postMessage({
              command: 'close'
            });
          }
          
          // 监听来自VSCode的消息
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'updateContent':
                const contentElement = document.querySelector('.content');
                if (contentElement) {
                  contentElement.textContent = message.content;
                }
                break;
            }
          });
        </script>
      </body>
      </html>
    `;

    panel.webview.html = html;

    // 处理来自WebView的消息
    panel.webview.onDidReceiveMessage(
      (message: any) => {
        switch (message.command) {
          case "showInfo":
            vscode.window.showInformationMessage(message.text);
            break;
          case "showError":
            vscode.window.showErrorMessage(message.text);
            break;
          case "close":
            panel.dispose();
            resolve("closed");
            break;
        }
      },
      undefined,
      []
    );

    // 面板关闭时的处理
    panel.onDidDispose(() => {
      resolve("disposed");
    });
  });
}

// 显示代码弹窗（带行号）
/**
 * 
 * @param title 
 * @param code 
 * @param language 
 * @returns 
 showCodeDialog("代码标题", codeString);
*/
function showCodeDialog(title: string, code: string, language?: string) {
  return showMultiTextDialog(title, code, {
    showLineNumbers: true,
    wordWrap: false,
    height: 500,
  });
}

// 显示日志弹窗
/**
 * 
 * @param title 
 * @param logs 
 * @returns
 showLogDialog("日志标题", logArray);
*/
function showLogDialog(title: string, logs: string[]) {
  return showMultiTextDialog(title, logs, {
    showLineNumbers: true,
    wordWrap: true,
    height: 600,
  });
}

function inputBox(placeHolder: string) {
  return new Promise((resolve, reject) => {
    vscode.window
      .showInputBox({
        // 这个对象中所有参数都是可选参数
        password: false, // 输入内容是否是密码
        ignoreFocusOut: false, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
        placeHolder: placeHolder || "", // 在输入框内的提示信息
      })
      .then(function (msg: string) {
        resolve(msg);
      });
  });
}

/**
 *
 * @param name string resources文件夹中的svg文件名
 * @returns
 */
const getSvgPath = (name: string) => {
  const icn = pathJoin(
    __filename,
    "..",
    "..",
    "..",
    "resources",
    `${name}.svg`
  );
  return icn;
};

// 获取当前插件版本号
function getPluginVersion() {
  try {
    const packageJson = require("../../package.json");
    return packageJson.version;
  } catch (err) {
    console.error("无法读取 package.json 文件或解析版本号", err);
    return null;
  }
}

// 执行一行cmd命令
function cmd(text: string) {
  const encoding = "cp936";
  const binaryEncoding = "binary";

  return new Promise(async (resolve, reject) => {
    // 判断是否使用了nvm，将环境变量追加到指令之前
    const NVM_DIR = `${os.homedir()}/.nvm`;
    if (await exiteDir(NVM_DIR)) {
      text = `[ -s "${NVM_DIR}/nvm.sh" ] &&. "${NVM_DIR}/nvm.sh" && ` + text;
    }

    child_process.exec(
      text,
      { encoding: binaryEncoding },
      (err = "", stdout = "", stderr = "") => {
        if (err) {
          resolve({
            res: err,
            type: "error",
          });
          return;
        }
        resolve({
          res: stdout,
          type: "success",
        });
      }
    );
  });
}

// 校验文件夹/文件是否存在
function exiteDir(dirPath: string) {
  return new Promise((resolve, reject) => {
    // 检查文件夹是否存在
    fs.access(dirPath, fs.constants.F_OK, (err: any) => {
      if (err) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

// 读取文件数据
function readFile(filePath: string) {
  return new Promise(async (resolve, reject) => {
    if (!(await exiteDir(filePath))) {
      reject("文件不存在");
      return;
    }

    // 读取文件内容
    fs.readFile(filePath, "utf8", (err: any, data: any) => {
      if (err) {
        console.error("读取文件时出错:", err);
        return;
      }

      let result = "";
      try {
        // 将 JSON 字符串解析为对象
        const jsonData = JSON.parse(data);
        result = jsonData;
      } catch (err) {
        result = data;
      }

      resolve(result);
    });
  });
}

// 写入文件数据
function writeFile(filePath: string, data: any) {
  let result = "";
  try {
    // 将数据转换为 JSON 字符串
    const dataStr = JSON.stringify(data);
    result = dataStr;
  } catch (err: any) {
    result = data;
  }

  return new Promise((resolve, reject) => {
    // 写入文件
    fs.writeFile(filePath, result, "utf8", (err: any) => {
      if (err) {
        console.error("写入文件时出错:", err);
        reject(err);
        return;
      }
      // console.log("数据已成功写入文件");
      resolve("success");
    });
  });
}

//返回传递给他的任意对象的类(返回： array 、 object 、 number 、 string)
function isClass<T>(o: T) {
  if (o === null) {
    return "Null";
  }
  if (o === undefined) {
    return "Undefined";
  }

  return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
}

export {
  getInput,
  showInfo,
  showMultiTextDialog,
  showCodeDialog,
  showLogDialog,
  inputBox,
  getSvgPath,
  getPluginVersion,
  cmd,
  exiteDir,
  readFile,
  writeFile,
  isClass,
};
