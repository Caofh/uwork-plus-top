const DEFAULT_PROXY_TARGET =
  process.env.UWORK_PROXY_TARGET || "http://127.0.0.1:3000/";

const proxys = [
  {
    path: "/hhApi",
    proxyConfig: {
      target: DEFAULT_PROXY_TARGET,
      changeOrigin: true,
      secure: false,
    },
  },
  {
    path: "/hhApiv1",
    proxyConfig: {
      target: process.env.UWORK_PROXY_TARGET_V1 || DEFAULT_PROXY_TARGET,
      changeOrigin: true,
      secure: false,
    },
  },
];

module.exports = {
  proxys,
};
