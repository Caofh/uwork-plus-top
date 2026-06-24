const { fork } = require("child_process");
const path = require("path");
const http = require("http");
const { buildWorkerEnv } = require("./proxyWorkerEnv");

const PROXY_PORT = 7030;
const HEALTH_PATH = "/__proxy_health";
const HEALTH_CHECK_INTERVAL_MS = 15000;
const RESTART_COOLDOWN_MS = 3000;
const WORKER_READY_TIMEOUT_MS = 15000;

let worker = null;
let currentRoutes = [];
let healthTimer = null;
let recoverTimer = null;
let isRestarting = false;
let shuttingDown = false;
let lastRestartAt = 0;

function getWorkerPath() {
  return path.join(__dirname, "proxyServerWorker.js");
}

function log(...args) {
  console.log("[proxy-manager]", ...args);
}

function warn(...args) {
  console.warn("[proxy-manager]", ...args);
}

function waitForWorkerReady(targetWorker, timeoutMs = WORKER_READY_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("proxy worker ready timeout"));
    }, timeoutMs);

    const onMessage = (message = {}) => {
      if (message.type === "ready") {
        cleanup();
        resolve(message);
        return;
      }
      if (message.type === "error") {
        cleanup();
        reject(new Error(message.message || "proxy worker error"));
      }
    };

    const onExit = (code, signal) => {
      cleanup();
      reject(
        new Error(
          `proxy worker exited before ready (code=${code}, signal=${signal || "none"})`
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

function attachWorkerLifecycle(child) {
  child.on("exit", (code, signal) => {
    if (worker === child) {
      worker = null;
    }
    if (shuttingDown) {
      return;
    }
    warn(`worker exited (code=${code}, signal=${signal || "none"})`);
    scheduleRecover("worker-exit");
  });

  child.on("error", (err) => {
    warn("worker error:", err.message);
    scheduleRecover("worker-error");
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
    attachWorkerLifecycle(child);
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

function scheduleRecover(reason) {
  if (shuttingDown || recoverTimer || isRestarting) {
    return;
  }

  recoverTimer = setTimeout(async () => {
    recoverTimer = null;
    try {
      warn(`recovering proxy server (${reason})`);
      await forceRestart("recover");
    } catch (err) {
      warn("recover failed:", err.message);
      scheduleRecover("recover-failed");
    }
  }, RESTART_COOLDOWN_MS);
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: "127.0.0.1",
        port: PROXY_PORT,
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

async function healthCheckTick() {
  if (shuttingDown || isRestarting || !worker) {
    return;
  }

  const healthy = await checkHealth();
  if (!healthy) {
    warn("health check failed, restarting proxy worker");
    try {
      await forceRestart("health-check");
    } catch (err) {
      warn("health restart failed:", err.message);
      scheduleRecover("health-check-failed");
    }
  }
}

function startHealthCheck() {
  stopHealthCheck();
  healthTimer = setInterval(() => {
    healthCheckTick().catch((err) => {
      warn("health check tick error:", err.message);
    });
  }, HEALTH_CHECK_INTERVAL_MS);
}

function stopHealthCheck() {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}

async function sendWorkerCommand(type, routes = []) {
  if (shuttingDown) {
    return;
  }

  currentRoutes = Array.isArray(routes) ? routes : [];

  const now = Date.now();
  if (now - lastRestartAt < RESTART_COOLDOWN_MS && type === "restart") {
    await new Promise((resolve) =>
      setTimeout(resolve, RESTART_COOLDOWN_MS - (now - lastRestartAt))
    );
  }

  isRestarting = true;
  try {
    const child = await spawnWorker();
    const readyPromise = waitForWorkerReady(child);
    child.send({ type, routes: currentRoutes });
    await readyPromise;
    lastRestartAt = Date.now();
    log(`${type} success, routes=${currentRoutes.length}`);
    startHealthCheck();
  } finally {
    isRestarting = false;
  }
}

async function forceRestart(reason = "manual") {
  if (shuttingDown) {
    return;
  }

  isRestarting = true;
  try {
    warn(`force restart (${reason})`);
    await killWorker();
    await sendWorkerCommand("start", currentRoutes);
  } finally {
    isRestarting = false;
  }
}

async function startExpressApp(newRoutes = []) {
  await sendWorkerCommand("start", newRoutes);
}

async function restartExpressApp(newRoutes = []) {
  if (!worker || worker.killed) {
    await sendWorkerCommand("start", newRoutes);
    return;
  }
  await sendWorkerCommand("restart", newRoutes);
}

async function shutdownProxyServer() {
  shuttingDown = true;
  stopHealthCheck();

  if (recoverTimer) {
    clearTimeout(recoverTimer);
    recoverTimer = null;
  }

  await killWorker();
  log("proxy server shutdown complete");
}

module.exports = {
  PROXY_PORT,
  startExpressApp,
  restartExpressApp,
  shutdownProxyServer,
  checkHealth,
};
