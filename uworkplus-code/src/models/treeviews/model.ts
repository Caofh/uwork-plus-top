import { getSvgPath, readFile } from "../../utils/utils";

// 从本地文件获取代码数据
async function getCodeDataFromFile(context: any) {
  const dir = context.globalState.get("uworkplus-code-base-dir", "");
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

  return fileCodeDataPathJson;
}

// 从本地文件获取组件模块数据
async function getCptModuleDataFromFile(context: any) {
  const dir = context.globalState.get("uworkplus-code-base-dir", "");
  //  代码分组数据文件
  const fileGroupPath = `${dir}/dataSql/codeDirList.json`;
  const fileGroupPathJson: any = await readFile(fileGroupPath);

  // 组件模块数据
  let result: any = [];
  if (fileGroupPathJson && fileGroupPathJson.length) {
    fileGroupPathJson.forEach((item: any) => {
      item.projectData.forEach((item2: any) => {
        item2.name = item.name;
        result.push(item2);
      });
    });
  }

  return result;
}

export { getCodeDataFromFile, getCptModuleDataFromFile };
