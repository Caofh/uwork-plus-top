import { cmd, exiteDir, readFile, writeFile } from "../../utils/utils";

async function createVscodePluginInfo(dir: string, version: string) {
  // const vscodeDir = `${baseDir}/vscode`;
  // createVscodePluginInfo(baseDir, "base-info.json", version);

  // console.log("666");
  // console.log(dir);
  console.log(`当前插件版本: ${version}`);

  const vscodePluginDir = `vscode-plugin`;
  const vscodePluginFileName = `uworkplus-code.json`;

  await createDir(dir);
  await createDir(`${dir}/${vscodePluginDir}`);

  const filePath = `${dir}/${vscodePluginDir}/${vscodePluginFileName}`;
  await createFile(filePath);

  const pluginJson: any = await readFile(filePath);
  let writeData: any = {};
  if (pluginJson) {
    writeData = {
      ...pluginJson,
      version: version,
    };
  } else {
    writeData.version = version;
  }
  await writeFile(filePath, writeData);
}

async function createDir(dir: string) {
  if (await exiteDir(dir)) {
    return dir;
  } else {
    await cmd(`mkdir ${dir}`);
  }
}
async function createFile(file: string) {
  if (await exiteDir(file)) {
    return file;
  } else {
    await cmd(`touch ${file}`);
  }
}

export { createVscodePluginInfo };
