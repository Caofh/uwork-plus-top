const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const {
  loadLocalProxyMockRules,
  matchMockRule,
  sendMockResponse,
  buildRequestUrlFromParts,
} = require("./apiDebugMockStore");

const PORT = 7030;
const HEALTH_PATH = "/__proxy_health";

let httpServer = null;

function sendToParent(payload) {
  if (typeof process.send === "function") {
    process.send(payload);
  }
}

function stopServer(callback) {
  if (!httpServer) {
    callback();
    return;
  }
  httpServer.close(() => {
    httpServer = null;
    callback();
  });
}

function createApplication(routes = []) {
  const app = express();
  app.use(cors());
  app.get(HEALTH_PATH, (_req, res) => {
    res.status(200).json({ ok: true, port: PORT });
  });

  app.use(async (req, res, next) => {
    try {
      const fullUrl = buildRequestUrlFromParts(
        "http:",
        req.headers.host || `127.0.0.1:${PORT}`,
        req.originalUrl || req.url
      );
      const mockCase = matchMockRule(
        req.method,
        fullUrl,
        loadLocalProxyMockRules()
      );
      if (mockCase) {
        await sendMockResponse(res, mockCase);
        return;
      }
    } catch (err) {
      console.warn("[proxy-worker] mock intercept error:", err.message);
    }
    next();
  });

  routes.forEach((item) => {
    if (item?.path && item?.proxyConfig) {
      app.use(item.path, createProxyMiddleware(item.proxyConfig));
    }
  });

  return app;
}

function listen(routes = []) {
  const app = createApplication(routes);
  httpServer = app.listen(PORT, "127.0.0.1", () => {
    console.log(`[proxy-worker] listening on 127.0.0.1:${PORT}`);
    sendToParent({ type: "ready", port: PORT });
  });

  httpServer.on("error", (err) => {
    console.error("[proxy-worker] listen error:", err.message);
    sendToParent({
      type: "error",
      message: err.message,
      code: err.code || "",
    });
  });
}

function handleStart(routes = []) {
  if (httpServer) {
    handleRestart(routes);
    return;
  }
  listen(routes);
}

function handleRestart(routes = []) {
  stopServer(() => listen(routes));
}

process.on("message", (message = {}) => {
  const { type, routes = [] } = message;

  if (type === "start") {
    handleStart(routes);
    return;
  }

  if (type === "restart") {
    handleRestart(routes);
    return;
  }

  if (type === "shutdown") {
    stopServer(() => process.exit(0));
  }
});

process.on("uncaughtException", (err) => {
  console.error("[proxy-worker] uncaughtException:", err);
  sendToParent({ type: "error", message: err.message || String(err) });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[proxy-worker] unhandledRejection:", reason);
  sendToParent({
    type: "error",
    message: reason?.message || String(reason),
  });
  process.exit(1);
});
