const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

function getMitmCaDir() {
  try {
    const { getRootConfigPath } = require(path.join(__dirname, "resources", "util.js"));
    return path.join(os.homedir(), getRootConfigPath(), "mitm-certs");
  } catch (_err) {
    const projectPath =
      process.env.NODE_ENV === "development" ? "UWORK-PLUS-dev" : "UWORK-PLUS";
    return path.join(os.homedir(), projectPath, "mitm-certs");
  }
}

function getCaCertPath() {
  return path.join(getMitmCaDir(), "certs", "ca.pem");
}

function caCertExists() {
  return fs.existsSync(getCaCertPath());
}

function getLoginKeychainPath() {
  return path.join(os.homedir(), "Library", "Keychains", "login.keychain-db");
}

function isCaInKeychain() {
  try {
    execSync(
      `security find-certificate -c "NodeMITMProxyCA" "${getLoginKeychainPath()}"`,
      { stdio: "pipe" }
    );
    return true;
  } catch (_err) {
    return false;
  }
}

function isCaListedInTrustSettings() {
  const commands = ["security dump-trust-settings", "security dump-trust-settings -d"];

  return commands.some((command) => {
    try {
      const output = execSync(command, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return /NodeMITMProxyCA/i.test(String(output || ""));
    } catch (_err) {
      return false;
    }
  });
}

function findLeafCertForVerify() {
  const certsDir = path.join(getMitmCaDir(), "certs");
  if (!fs.existsSync(certsDir)) {
    return null;
  }

  const preferred = path.join(certsDir, "mitm-ca.pem");
  if (fs.existsSync(preferred)) {
    return preferred;
  }

  const leaf = fs
    .readdirSync(certsDir)
    .find((name) => name.endsWith(".pem") && name !== "ca.pem");

  return leaf ? path.join(certsDir, leaf) : null;
}

function isCaTrustedByLeafCert() {
  const leafPath = findLeafCertForVerify();
  if (!leafPath) {
    return false;
  }

  try {
    execSync(`security verify-cert -c "${leafPath}" -p ssl`, { stdio: "pipe" });
    return true;
  } catch (_err) {
    return false;
  }
}

function isCaTrusted() {
  if (!caCertExists()) {
    return false;
  }

  if (isCaTrustedByLeafCert()) {
    return true;
  }

  return isCaInKeychain() && isCaListedInTrustSettings();
}

function getCaTrustStatus() {
  if (!caCertExists()) {
    return { exists: false, inKeychain: false, trusted: false };
  }

  const inKeychain = isCaInKeychain();
  const trusted = isCaTrusted();

  return { exists: true, inKeychain, trusted };
}

function installCaTrusted() {
  if (process.platform !== "darwin") {
    throw new Error("证书安装仅支持 macOS");
  }

  const caPath = getCaCertPath();
  if (!fs.existsSync(caPath)) {
    throw new Error("CA 证书尚未生成，请先开启系统代理");
  }

  if (isCaTrusted()) {
    return { installed: true, alreadyTrusted: true, caPath };
  }

  // inherit: 弹出 macOS 密码框，否则 pipe 模式下可能静默失败
  execSync(
    `security add-trusted-cert -d -r trustRoot -k "${getLoginKeychainPath()}" "${caPath}"`,
    { stdio: "inherit" }
  );

  if (!isCaTrusted()) {
    throw new Error("证书已导入但未设置为信任，请在钥匙串中手动信任 NodeMITMProxyCA");
  }

  return { installed: true, alreadyTrusted: false, caPath };
}

function openCaCertInFinder() {
  const caPath = getCaCertPath();
  if (!fs.existsSync(caPath)) {
    throw new Error("CA 证书不存在");
  }
  execSync(`open -R "${caPath}"`);
  return caPath;
}

module.exports = {
  getMitmCaDir,
  getCaCertPath,
  caCertExists,
  isCaTrusted,
  getCaTrustStatus,
  installCaTrusted,
  openCaCertInFinder,
};
