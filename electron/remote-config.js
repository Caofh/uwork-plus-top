function trimSlash(url) {
  return url.replace(/\/+$/, "");
}

function getRemoteOrigin() {
  return (
    process.env.UWORK_REMOTE_ORIGIN ||
    process.env.VITE_REMOTE_ORIGIN ||
    ""
  ).trim();
}

function remoteUrl(path) {
  const origin = getRemoteOrigin();
  if (!origin) return "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimSlash(origin)}${normalizedPath}`;
}

function resolveProductionDocUrl(timestamp) {
  const base = remoteUrl("/uworkplus");
  if (!base) {
    return "http://localhost:5173/uworkplus/";
  }
  return `${base}?r=${timestamp}`;
}

function getUpdatesInfoUrl() {
  const configured = (process.env.UWORK_UPDATES_INFO_URL || "").trim();
  if (configured) return configured;
  return remoteUrl("/updates/update-info-latest.json");
}

module.exports = {
  trimSlash,
  getRemoteOrigin,
  remoteUrl,
  resolveProductionDocUrl,
  getUpdatesInfoUrl,
};
