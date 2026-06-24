const fs = require("fs");
const path = require("path");
const os = require("os");

const LOCAL_PROXY_PORT = 7030;

let cachedRules = null;
let cachedMtime = 0;

function getDefaultApiDebugListPath() {
  try {
    const { getRootConfigPath } = require(path.join(__dirname, "resources", "util.js"));
    return path.join(os.homedir(), getRootConfigPath(), "dataSql", "apiDebugList.json");
  } catch (_err) {
    const projectPath =
      process.env.NODE_ENV === "development" ? "UWORK-PLUS-dev" : "UWORK-PLUS";
    return path.join(os.homedir(), projectPath, "dataSql", "apiDebugList.json");
  }
}

function getApiDebugListPath() {
  return process.env.UWORK_API_DEBUG_LIST || getDefaultApiDebugListPath();
}

function resolveApiDebugListPath() {
  return getApiDebugListPath();
}

function invalidateMockCache() {
  cachedRules = null;
  cachedMtime = 0;
}

function normalizePathname(pathname = "/") {
  if (!pathname) {
    return "/";
  }
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function isLocalProxyServiceUrl(urlString = "") {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    const port = url.port || (url.protocol === "https:" ? "443" : "80");
    return (
      (host === "127.0.0.1" || host === "localhost") &&
      String(port) === String(LOCAL_PROXY_PORT)
    );
  } catch (_err) {
    return false;
  }
}

function loadMockRules(force = false) {
  const filePath = getApiDebugListPath();
  if (!fs.existsSync(filePath)) {
    cachedRules = [];
    cachedMtime = 0;
    return cachedRules;
  }

  const stat = fs.statSync(filePath);
  if (!force && cachedRules && stat.mtimeMs === cachedMtime) {
    return cachedRules;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const list = JSON.parse(raw);
    cachedRules = (Array.isArray(list) ? list : [])
      .filter((item) => item?.type === "api" && item.mockEnabled && item.url)
      .map((item) => ({
        method: item.method || "GET",
        url: item.url,
        mockUrlPattern: item.mockUrlPattern || "",
        mockCases: Array.isArray(item.mockCases) ? item.mockCases : [],
        activeMockCaseId:
          item.activeMockCaseId || item.mockCases?.[0]?.id || "",
      }))
      .filter((item) => item.mockCases.length > 0);
    cachedMtime = stat.mtimeMs;
  } catch (err) {
    console.warn("[api-debug-mock] load failed:", err.message);
    cachedRules = [];
    cachedMtime = stat.mtimeMs;
  }

  return cachedRules;
}

function disableAllMockFlags() {
  const filePath = getApiDebugListPath();
  if (!fs.existsSync(filePath)) {
    invalidateMockCache();
    return { updated: 0 };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const list = JSON.parse(raw);
    let updated = 0;
    const nextList = (Array.isArray(list) ? list : []).map((item) => {
      if (item?.type === "api" && item.mockEnabled) {
        updated += 1;
        return {
          ...item,
          mockEnabled: false,
          updateTime: new Date().toISOString(),
        };
      }
      return item;
    });

    if (updated > 0) {
      fs.writeFileSync(filePath, JSON.stringify(nextList, null, 2), "utf8");
    }
    invalidateMockCache();
    return { updated };
  } catch (err) {
    console.warn("[api-debug-mock] disable all mocks failed:", err.message);
    invalidateMockCache();
    return { updated: 0 };
  }
}

function loadSystemMockRules(force = false) {
  return loadMockRules(force).filter((rule) => !isLocalProxyServiceUrl(rule.url));
}

function loadLocalProxyMockRules(force = false) {
  return loadMockRules(force).filter((rule) => isLocalProxyServiceUrl(rule.url));
}

function getActiveMockCase(rule) {
  const mockCase =
    rule.mockCases.find((item) => item.id === rule.activeMockCaseId) ||
    rule.mockCases[0];

  if (!mockCase?.body) {
    return null;
  }

  return mockCase;
}

function matchMockUrlPattern(pattern, urlString) {
  const value = String(pattern || "").trim();
  if (!value) {
    return false;
  }

  try {
    return new RegExp(value).test(urlString);
  } catch (err) {
    console.warn("[api-debug-mock] invalid mock url pattern:", err.message);
    return false;
  }
}

function matchMockRule(method, urlString, rules = loadMockRules()) {
  const reqMethod = String(method || "GET").toUpperCase();
  let reqUrl;

  try {
    reqUrl = new URL(urlString);
  } catch (_err) {
    return null;
  }

  for (const rule of rules) {
    if (String(rule.method || "GET").toUpperCase() !== reqMethod) {
      continue;
    }

    if (matchMockUrlPattern(rule.mockUrlPattern, urlString)) {
      const mockCase = getActiveMockCase(rule);
      if (mockCase) {
        return mockCase;
      }
      continue;
    }

    let apiUrl;
    try {
      apiUrl = new URL(rule.url);
    } catch (_err) {
      continue;
    }

    if (apiUrl.hostname.toLowerCase() !== reqUrl.hostname.toLowerCase()) {
      continue;
    }

    const apiPort = apiUrl.port || (apiUrl.protocol === "https:" ? "443" : "80");
    const reqPort = reqUrl.port || (reqUrl.protocol === "https:" ? "443" : "80");
    if (apiPort !== reqPort) {
      continue;
    }

    if (
      normalizePathname(apiUrl.pathname) !== normalizePathname(reqUrl.pathname)
    ) {
      continue;
    }

    const mockCase = getActiveMockCase(rule);
    if (mockCase) {
      return mockCase;
    }
  }

  return null;
}

function sendMockResponse(res, mockCase) {
  return new Promise((resolve) => {
    const send = () => {
      let bodyStr = String(mockCase.body || "");
      try {
        bodyStr = JSON.stringify(JSON.parse(bodyStr));
      } catch (_err) {
        // keep raw body
      }

      const statusCode = Number(mockCase.statusCode) || 200;
      if (!res.headersSent) {
        res.writeHead(statusCode, {
          "content-type": "application/json; charset=utf-8",
          "x-uwork-mock": "1",
          "access-control-allow-origin": "*",
        });
      }
      res.end(bodyStr);
      resolve();
    };

    const delay = Number(mockCase.delay) || 0;
    if (delay > 0) {
      setTimeout(send, delay);
      return;
    }
    send();
  });
}

function buildRequestUrlFromParts(protocol, host, requestPath) {
  const safeHost = host || "127.0.0.1";
  const safePath = requestPath || "/";
  return `${protocol}//${safeHost}${safePath.startsWith("/") ? safePath : `/${safePath}`}`;
}

module.exports = {
  resolveApiDebugListPath,
  getApiDebugListPath,
  loadMockRules,
  loadSystemMockRules,
  loadLocalProxyMockRules,
  disableAllMockFlags,
  invalidateMockCache,
  matchMockRule,
  sendMockResponse,
  buildRequestUrlFromParts,
};
