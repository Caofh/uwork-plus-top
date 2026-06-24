const { fork } = require("child_process");
const path = require("path");
const http = require("http");
const { buildWorkerEnv } = require("./proxyWorkerEnv");
const {
  caCertExists,
  getCaCertPath,
  getCaTrustStatus,
  isCaTrusted,
  installCaTrusted,
  openCaCertInFinder,
} = require("./mitmCaManager");
const { loadSystemMockRules, disableAllMockFlags } = require("./apiDebugMockStore");
const {
  enableMacSystemProxy,
  disableMacSystemProxy,
  getMacSystemProxyStatus,
  PROXY_HOST,
} = require("./macSystemProxy");

const SYSTEM_PROXY_PORT = 7035;
const HEALTH_PATH = "/__system_proxy_health";
const WORKER_READY_TIMEOUT_MS = 15000;

let worker = null;
let currentRoutes = [];
let macProxyBackup = null;
let systemProxyEnabled = false;
let shuttingDown = false;

function getWorkerPath() {
  return path.join(__dirname, "systemProxyWorker.js");
}

function log(...args) {
  console.log("[system-proxy-manager]", ...args);
}

function warn(...args) {
  console.warn("[system-proxy-manager]", ...args);
}

function waitForWorkerReady(targetWorker, timeoutMs = WORKER_READY_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("system proxy worker ready timeout"));
    }, timeoutMs);

    const onMessage = (message = {}) => {
      if (message.type === "ready") {
        cleanup();
        resolve(message);
        return;
      }
      if (message.type === "error") {
        cleanup();
        reject(new Error(message.message || "system proxy worker error"));
      }
    };

    const onExit = (code, signal) => {
      cleanup();
      reject(
        new Error(
          `system proxy worker exited before ready (code=${code}, signal=${signal || "none"})`
        )
      );
    };

    const cleanup = () => {
      clearTimeout(timeout);
      targetWorker.removeListener("message", onMessage);
      targetWorker.removeListener("exit", onExit);
    };

    targetWorker.on("message", onMessage);
    targetWorker.once("exit", onExit);
  });
}

function spawnWorker() {
  if (worker && !worker.killed) {
    return Promise.resolve(worker);
  }

  return new Promise((resolve, reject) => {
    const child = fork(getWorkerPath(), [], {
      env: buildWorkerEnv(),
      stdio: "inherit",
    });

    worker = child;

    child.on("exit", (code, signal) => {
      if (worker === child) {
        worker = null;
      }
      if (!shuttingDown && systemProxyEnabled) {
        warn(`worker exited (code=${code}, signal=${signal || "none"})`);
      }
    });

    child.on("error", (err) => {
      warn("worker error:", err.message);
    });

    child.once("spawn", () => resolve(child));
    child.once("error", reject);
  });
}

async function killWorker() {
  if (!worker || worker.killed) {
    worker = null;
    return;
  }

  const targetWorker = worker;

  await new Promise((resolve) => {
    const forceKillTimer = setTimeout(() => {
      if (targetWorker && !targetWorker.killed) {
        targetWorker.kill("SIGKILL");
      }
      resolve();
    }, 5000);

    targetWorker.once("exit", () => {
      clearTimeout(forceKillTimer);
      resolve();
    });

    try {
      targetWorker.send({ type: "shutdown" });
    } catch (_err) {
      clearTimeout(forceKillTimer);
      targetWorker.kill("SIGKILL");
      resolve();
    }
  });

  if (worker === targetWorker) {
    worker = null;
  }
}

async function sendWorkerCommand(type, routes = []) {
  currentRoutes = Array.isArray(routes) ? routes : [];
  const child = await spawnWorker();
  const readyPromise = waitForWorkerReady(child);
  child.send({ type, routes: currentRoutes });
  await readyPromise;
  log(`${type} success, routes=${currentRoutes.length}`);
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: PROXY_HOST,
        port: SYSTEM_PROXY_PORT,
        path: HEALTH_PATH,
        timeout: 3000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve(res.statusCode === 200 && json.ok === true);
          } catch (_err) {
            resolve(false);
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

async function enableSystemProxy(routes = []) {
  if (process.platform !== "darwin") {
    throw new Error("系统代理仅支持 macOS");
  }

  if (systemProxyEnabled) {
    await updateSystemProxyRoutes(routes);
    return getSystemProxyStatus();
  }

  await sendWorkerCommand("start", routes);
  macProxyBackup = enableMacSystemProxy(SYSTEM_PROXY_PORT);
  systemProxyEnabled = true;

  let caTrusted = isCaTrusted();
  if (caCertExists() && !caTrusted) {
    try {
      installCaTrusted();
      caTrusted = isCaTrusted();
    } catch (err) {
      warn("auto install mitm ca failed:", err.message);
    }
  }

  const status = await getSystemProxyStatus();
  return { ...status, caTrusted };
}

async function disableSystemProxy() {
  systemProxyEnabled = false;

  try {
    disableMacSystemProxy(macProxyBackup);
  } catch (err) {
    warn("disable mac system proxy failed:", err.message);
  } finally {
    macProxyBackup = null;
  }

  await killWorker();
  const mockResult = disableAllMockFlags();
  if (mockResult.updated > 0) {
    log(`disabled ${mockResult.updated} mock rule(s)`);
  }
  return getSystemProxyStatus();
}

async function updateSystemProxyRoutes(routes = []) {
  if (!systemProxyEnabled) {
    return getSystemProxyStatus();
  }

  if (!worker || worker.killed) {
    await sendWorkerCommand("start", routes);
  } else {
    await sendWorkerCommand("restart", routes);
  }

  return getSystemProxyStatus();
}

async function getSystemProxyStatus() {
  let macStatus = getMacSystemProxyStatus();

  if (
    !systemProxyEnabled &&
    macStatus.enabled &&
    macStatus.port === SYSTEM_PROXY_PORT
  ) {
    try {
      disableMacSystemProxy(null);
      macStatus = getMacSystemProxyStatus();
    } catch (err) {
      warn("cleanup stale mac proxy failed:", err.message);
    }
  }

  const serverHealthy = systemProxyEnabled ? await checkHealth() : false;

  const caStatus = getCaTrustStatus();

  return {
    supported: macStatus.supported,
    enabled: systemProxyEnabled,
    running: serverHealthy,
    host: PROXY_HOST,
    port: SYSTEM_PROXY_PORT,
    service: macStatus.service || macProxyBackup?.service || "",
    macProxyEnabled: macStatus.enabled,
    routeCount: currentRoutes.length,
    mockRuleCount: loadSystemMockRules().length,
    mitm: true,
    caPath: getCaCertPath(),
    caExists: caStatus.exists,
    caInKeychain: caStatus.inKeychain,
    caTrusted: caStatus.trusted,
  };
}

async function installMitmCa() {
  const result = installCaTrusted();
  return {
    ...result,
    caTrusted: isCaTrusted(),
    caPath: getCaCertPath(),
  };
}

function revealMitmCa() {
  return openCaCertInFinder();
}

async function shutdownSystemProxy() {
  shuttingDown = true;
  if (systemProxyEnabled) {
    await disableSystemProxy();
  } else {
    await killWorker();
  }
  log("system proxy shutdown complete");
}

module.exports = {
  SYSTEM_PROXY_PORT,
  enableSystemProxy,
  disableSystemProxy,
  updateSystemProxyRoutes,
  getSystemProxyStatus,
  installMitmCa,
  revealMitmCa,
  shutdownSystemProxy,
};
