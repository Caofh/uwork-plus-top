const proxyServerManager = require("./proxyServerManager");
const systemProxyManager = require("./systemProxyManager");

module.exports = {
  startExpressApp: proxyServerManager.startExpressApp,
  restartExpressApp: proxyServerManager.restartExpressApp,
  shutdownProxyServer: proxyServerManager.shutdownProxyServer,
  checkHealth: proxyServerManager.checkHealth,
  enableSystemProxy: systemProxyManager.enableSystemProxy,
  disableSystemProxy: systemProxyManager.disableSystemProxy,
  updateSystemProxyRoutes: systemProxyManager.updateSystemProxyRoutes,
  getSystemProxyStatus: systemProxyManager.getSystemProxyStatus,
  installMitmCa: systemProxyManager.installMitmCa,
  revealMitmCa: systemProxyManager.revealMitmCa,
  shutdownSystemProxy: systemProxyManager.shutdownSystemProxy,
};
