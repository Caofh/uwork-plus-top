const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const INSTALL_PATH = "/usr/local/bin/uwork-hosts-write";
const SUDOERS_FILE = "/etc/sudoers.d/uworkplus-hosts";
const BUNDLED_SCRIPT_NAME = "uwork-hosts-write.sh";

function getBundledScriptPath() {
  try {
    const { app } = require("electron");
    if (app?.isPackaged) {
      return path.join(process.resourcesPath, "scripts", BUNDLED_SCRIPT_NAME);
    }
  } catch (_) {
    // ignore
  }
  return path.join(__dirname, "scripts", BUNDLED_SCRIPT_NAME);
}

function shellEscape(value) {
  return String(value).replace(/'/g, "'\\''");
}

function runAdminShell(command) {
  const result = spawnSync(
    "osascript",
    [
      "-e",
      `do shell script "${command.replace(/"/g, '\\"')}" with administrator privileges`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    const err = result.stderr || result.stdout || "管理员授权失败";
    throw new Error(String(err).trim());
  }
}

function canWriteWithoutPassword() {
  if (process.platform !== "darwin") {
    return false;
  }
  if (!fs.existsSync(INSTALL_PATH)) {
    return false;
  }
  const result = spawnSync("sudo", ["-n", INSTALL_PATH, "--check"], {
    encoding: "utf8",
  });
  return result.status === 0;
}

function installPrivilegedWriter() {
  const bundledScript = getBundledScriptPath();
  if (!fs.existsSync(bundledScript)) {
    throw new Error(`缺少安装脚本: ${bundledScript}`);
  }

  const username = os.userInfo().username;
  const installCmd = [
    `install -m 755 '${shellEscape(bundledScript)}' '${INSTALL_PATH}'`,
    `printf '%s\\n' '${shellEscape(
      username
    )} ALL=(ALL) NOPASSWD: ${INSTALL_PATH}' > '${SUDOERS_FILE}'`,
    `chmod 440 '${SUDOERS_FILE}'`,
    `/usr/sbin/visudo -c -f '${SUDOERS_FILE}'`,
  ].join(" && ");

  runAdminShell(installCmd);

  if (!canWriteWithoutPassword()) {
    throw new Error("hosts 免密写入安装失败，请重试");
  }
}

function ensurePrivilegedWriter() {
  if (!canWriteWithoutPassword()) {
    installPrivilegedWriter();
  }
}

function forceReinstallPrivilegedWriter() {
  installPrivilegedWriter();
}

function writeWithPrivilegedScript(tmpFile) {
  const result = spawnSync("sudo", ["-n", INSTALL_PATH, tmpFile], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const err = result.stderr || result.stdout || "写入 hosts 失败";
    throw new Error(String(err).trim());
  }
}

function writeSystemHostsDarwin(content) {
  const installedBefore = canWriteWithoutPassword();
  const tmpFile = path.join(os.tmpdir(), `uwork-hosts-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, content, "utf8");
  try {
    ensurePrivilegedWriter();
    try {
      writeWithPrivilegedScript(tmpFile);
    } catch (firstError) {
      forceReinstallPrivilegedWriter();
      writeWithPrivilegedScript(tmpFile);
    }
    return { firstInstall: !installedBefore };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch (_) {
      // ignore
    }
  }
}

module.exports = {
  INSTALL_PATH,
  canWriteWithoutPassword,
  ensurePrivilegedWriter,
  writeSystemHostsDarwin,
};
