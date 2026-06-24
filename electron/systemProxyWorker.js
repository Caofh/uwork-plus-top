const path = require("path");
const Proxy = require("http-mitm-proxy");
const { getMitmCaDir } = require("./mitmCaManager");
const {
  loadSystemMockRules,
  matchMockRule,
  buildRequestUrlFromParts,
} = require("./apiDebugMockStore");

const PORT = 7035;
const HEALTH_PATH = "/__system_proxy_health";

let mitmProxy = null;
let routes = [];
const certErrorLogAt = new Map();
const CERT_ERROR_LOG_INTERVAL_MS = 10000;

function sendToParent(payload) {
  if (typeof process.send === "function") {
    process.send(payload);
  }
}

function buildFullUrl(ctx) {
  const req = ctx.clientToProxyRequest;
  const host = req.headers.host || "";
  const protocol = ctx.isSSL ? "https:" : "http:";
  return buildRequestUrlFromParts(protocol, host, req.url);
}

function writeMockToContext(ctx, mockCase) {
  let bodyStr = String(mockCase.body || "");
  try {
    bodyStr = JSON.stringify(JSON.parse(bodyStr));
  } catch (_err) {
    // keep raw body
  }

  const statusCode = Number(mockCase.statusCode) || 200;
  const delay = Number(mockCase.delay) || 0;

  const send = () => {
    ctx.proxyToClientResponse.writeHead(statusCode, {
      "content-type": "application/json; charset=utf-8",
      "x-uwork-mock": "1",
      "access-control-allow-origin": "*",
    });
    ctx.proxyToClientResponse.end(bodyStr);
  };

  if (delay > 0) {
    setTimeout(send, delay);
    return;
  }
  send();
}

function stopServer(callback) {
  if (!mitmProxy?.httpServer) {
    mitmProxy = null;
    callback();
    return;
  }

  const server = mitmProxy.httpServer;
  mitmProxy = null;
  server.close(() => callback());
}

function listen(nextRoutes = []) {
  routes = Array.isArray(nextRoutes) ? nextRoutes : [];

  if (mitmProxy?.httpServer) {
    stopServer(() => listen(nextRoutes));
    return;
  }

  mitmProxy = Proxy();

  mitmProxy.onError((ctx, err, kind) => {
    const message = err?.message || String(err);
    const isCertError =
      kind === "HTTPS_CLIENT_ERROR" &&
      /CERTIFICATE|SSLV3_ALERT|alert number 46/i.test(message);

    if (isCertError) {
      const key = kind;
      const now = Date.now();
      const lastAt = certErrorLogAt.get(key) || 0;
      if (now - lastAt < CERT_ERROR_LOG_INTERVAL_MS) {
        return;
      }
      certErrorLogAt.set(key, now);
      console.warn(
        `[system-proxy-worker] ${kind}: 客户端未信任 MITM 根证书，请在 UworkPlus 点击「安装证书」并重启浏览器/Apifox`
      );
      return;
    }

    const url = ctx?.clientToProxyRequest?.url || "";
    console.warn(`[system-proxy-worker] ${kind || "error"} ${url}:`, message);
  });

  mitmProxy.onRequest((ctx, callback) => {
    const req = ctx.clientToProxyRequest;

    if (req.method === "GET" && req.url === HEALTH_PATH) {
      ctx.proxyToClientResponse.writeHead(200, { "content-type": "application/json" });
      ctx.proxyToClientResponse.end(
        JSON.stringify({
          ok: true,
          port: PORT,
          routes: routes.length,
          mitm: true,
          mockRules: loadSystemMockRules().length,
        })
      );
      return;
    }

    const fullUrl = buildFullUrl(ctx);
    const mockCase = matchMockRule(req.method, fullUrl, loadSystemMockRules());
    if (mockCase) {
      writeMockToContext(ctx, mockCase);
      return;
    }

    callback();
  });

  const sslCaDir = getMitmCaDir();
  mitmProxy.listen({ host: "127.0.0.1", port: PORT, sslCaDir }, (err) => {
    if (err) {
      console.error("[system-proxy-worker] listen error:", err.message);
      sendToParent({
        type: "error",
        message: err.message,
        code: err.code || "",
      });
      return;
    }

    console.log(`[system-proxy-worker] MITM listening on 127.0.0.1:${PORT}`);
    sendToParent({
      type: "ready",
      port: PORT,
      mitm: true,
      caPath: path.join(sslCaDir, "certs", "ca.pem"),
    });
  });
}

function handleStart(nextRoutes = []) {
  listen(nextRoutes);
}

function handleRestart(nextRoutes = []) {
  stopServer(() => listen(nextRoutes));
}

process.on("message", (message = {}) => {
  const { type, routes: nextRoutes = [] } = message;

  if (type === "start") {
    handleStart(nextRoutes);
    return;
  }

  if (type === "restart") {
    handleRestart(nextRoutes);
    return;
  }

  if (type === "shutdown") {
    stopServer(() => process.exit(0));
  }
});

process.on("uncaughtException", (err) => {
  console.error("[system-proxy-worker] uncaughtException:", err);
  sendToParent({ type: "error", message: err.message || String(err) });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[system-proxy-worker] unhandledRejection:", reason);
  sendToParent({
    type: "error",
    message: reason?.message || String(reason),
  });
  process.exit(1);
});
