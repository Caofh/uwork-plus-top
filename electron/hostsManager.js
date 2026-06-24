const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const hostsSudoInstall = require("./hostsSudoInstall.js");

const MARKER_START = "# --- UWORK_HOSTS_CONTENT_START ---";
const MARKER_END = "# --- UWORK_HOSTS_CONTENT_END ---";

function getHostsPath() {
  if (process.platform === "win32") {
    return "C:\\Windows\\System32\\drivers\\etc\\hosts";
  }
  return "/etc/hosts";
}

function readSystemHosts() {
  const hostsPath = getHostsPath();
  return fs.readFileSync(hostsPath, "utf8");
}

function extractBaseContent(content) {
  const startIdx = content.indexOf(MARKER_START);
  const endIdx = content.indexOf(MARKER_END);

  if (startIdx === -1 && endIdx === -1) {
    return content.trimEnd();
  }

  const before = startIdx >= 0 ? content.slice(0, startIdx) : content;
  const after =
    endIdx >= 0 ? content.slice(endIdx + MARKER_END.length) : "";

  return (before + after).trimEnd();
}

function buildAggregatedContent(profiles) {
  const lines = [];
  (profiles || []).forEach((profile) => {
    if (!profile?.inUse) {
      return;
    }
    const body = String(profile.hostsContent || "").trim();
    if (!body) {
      return;
    }
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(`# [${profile.hostsName || "未命名"}]`);
    lines.push(body);
  });
  return lines.join("\n");
}

function buildFullHostsContent(baseContent, injectedContent) {
  const parts = [String(baseContent || "").trimEnd()];
  if (injectedContent && injectedContent.trim()) {
    parts.push("");
    parts.push(MARKER_START);
    parts.push(injectedContent.trim());
    parts.push(MARKER_END);
  }
  parts.push("");
  return parts.join("\n");
}

function writeSystemHostsLegacy(content) {
  const hostsPath = getHostsPath();
  const tmpFile = path.join(os.tmpdir(), `uwork-hosts-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, content, "utf8");
  const result = spawnSync("pkexec", ["cp", tmpFile, hostsPath], {
    encoding: "utf8",
  });
  try {
    fs.unlinkSync(tmpFile);
  } catch (_) {
    // ignore
  }
  if (result.status !== 0) {
    const err = result.stderr || result.stdout || "写入 hosts 失败";
    throw new Error(String(err).trim());
  }
}

function writeSystemHosts(content) {
  if (process.platform === "darwin") {
    return hostsSudoInstall.writeSystemHostsDarwin(content);
  }

  if (process.platform === "win32") {
    throw new Error("暂不支持在 Windows 上写入 hosts");
  }

  writeSystemHostsLegacy(content);
  return { firstInstall: false };
}

function applyHostsProfiles(profiles) {
  const current = readSystemHosts();
  const base = extractBaseContent(current);
  const injected = buildAggregatedContent(profiles);
  const full = buildFullHostsContent(base, injected);
  const writeMeta = writeSystemHosts(full) || {};
  return { ok: true, content: full, ...writeMeta };
}

module.exports = {
  MARKER_START,
  MARKER_END,
  getHostsPath,
  readSystemHosts,
  extractBaseContent,
  buildAggregatedContent,
  buildFullHostsContent,
  applyHostsProfiles,
  canWriteHostsWithoutPassword: hostsSudoInstall.canWriteWithoutPassword,
};
