const { execSync } = require("child_process");

const PROXY_HOST = "127.0.0.1";

function runNetworkSetup(args) {
  const output = execSync(`networksetup ${args}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return String(output || "").trim();
}

function listNetworkServices() {
  const output = runNetworkSetup("-listallnetworkservices");
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("*") && !line.includes("An asterisk"));
}

function getPrimaryNetworkService() {
  const services = listNetworkServices();
  const wifi = services.find((name) => /wi-?fi/i.test(name));
  return wifi || services[0] || "";
}

function parseProxyBlock(text = "") {
  const result = {
    enabled: false,
    server: "",
    port: 0,
    authenticated: false,
  };

  text.split("\n").forEach((line) => {
    const [rawKey, ...rest] = line.split(":");
    const key = String(rawKey || "").trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "enabled") {
      result.enabled = value.toLowerCase() === "yes";
    } else if (key === "server") {
      result.server = value;
    } else if (key === "port") {
      result.port = Number(value) || 0;
    } else if (key === "authenticated proxy enabled") {
      result.authenticated = value === "1" || value.toLowerCase() === "yes";
    }
  });

  return result;
}

function getProxyBypassDomains(service) {
  const output = runNetworkSetup(`-getproxybypassdomains "${service}"`);
  if (!output || /There aren't any/i.test(output)) {
    return [];
  }
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readProxySnapshot(service) {
  return {
    service,
    web: parseProxyBlock(runNetworkSetup(`-getwebproxy "${service}"`)),
    secure: parseProxyBlock(runNetworkSetup(`-getsecurewebproxy "${service}"`)),
    bypassDomains: getProxyBypassDomains(service),
  };
}

function setProxyBypassDomains(service, domains = []) {
  if (!domains.length) {
    runNetworkSetup(`-setproxybypassdomains "${service}" Empty`);
    return;
  }
  const domainArgs = domains.map((item) => `"${item}"`).join(" ");
  runNetworkSetup(`-setproxybypassdomains "${service}" ${domainArgs}`);
}

function enableMacSystemProxy(port) {
  if (process.platform !== "darwin") {
    throw new Error("系统代理仅支持 macOS");
  }

  const service = getPrimaryNetworkService();
  if (!service) {
    throw new Error("未找到可用的网络服务");
  }

  const snapshot = readProxySnapshot(service);

  runNetworkSetup(`-setwebproxy "${service}" ${PROXY_HOST} ${port}`);
  runNetworkSetup(`-setsecurewebproxy "${service}" ${PROXY_HOST} ${port}`);
  runNetworkSetup(`-setwebproxystate "${service}" on`);
  runNetworkSetup(`-setsecurewebproxystate "${service}" on`);

  const bypassDomains = Array.from(
    new Set([
      ...snapshot.bypassDomains,
      "127.0.0.1",
      "localhost",
      "*.local",
      "<local>",
    ])
  );
  setProxyBypassDomains(service, bypassDomains);

  return {
    service,
    host: PROXY_HOST,
    port,
    snapshot,
  };
}

function disableMacSystemProxy(backup) {
  if (process.platform !== "darwin") {
    return;
  }

  const service = backup?.service || getPrimaryNetworkService();
  if (!service) {
    return;
  }

  const restore = backup?.snapshot;
  if (restore?.web) {
    if (restore.web.enabled && restore.web.server && restore.web.port) {
      runNetworkSetup(
        `-setwebproxy "${service}" ${restore.web.server} ${restore.web.port}`
      );
      runNetworkSetup(`-setwebproxystate "${service}" on`);
    } else {
      runNetworkSetup(`-setwebproxystate "${service}" off`);
    }
  } else {
    runNetworkSetup(`-setwebproxystate "${service}" off`);
  }

  if (restore?.secure) {
    if (restore.secure.enabled && restore.secure.server && restore.secure.port) {
      runNetworkSetup(
        `-setsecurewebproxy "${service}" ${restore.secure.server} ${restore.secure.port}`
      );
      runNetworkSetup(`-setsecurewebproxystate "${service}" on`);
    } else {
      runNetworkSetup(`-setsecurewebproxystate "${service}" off`);
    }
  } else {
    runNetworkSetup(`-setsecurewebproxystate "${service}" off`);
  }

  if (restore?.bypassDomains) {
    setProxyBypassDomains(service, restore.bypassDomains);
  }
}

function getMacSystemProxyStatus() {
  if (process.platform !== "darwin") {
    return { supported: false, enabled: false };
  }

  const service = getPrimaryNetworkService();
  if (!service) {
    return { supported: true, enabled: false, service: "" };
  }

  const snapshot = readProxySnapshot(service);
  const enabled =
    snapshot.web.enabled &&
    snapshot.web.server === PROXY_HOST &&
    snapshot.secure.enabled &&
    snapshot.secure.server === PROXY_HOST &&
    snapshot.web.port === snapshot.secure.port;

  return {
    supported: true,
    enabled,
    service,
    host: snapshot.web.server,
    port: snapshot.web.port,
  };
}

module.exports = {
  PROXY_HOST,
  enableMacSystemProxy,
  disableMacSystemProxy,
  getMacSystemProxyStatus,
  getPrimaryNetworkService,
};
