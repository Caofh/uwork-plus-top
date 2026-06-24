const path = require("path");
const { resolveApiDebugListPath } = require("./apiDebugMockStore");

function buildWorkerEnv() {
  return {
    ...process.env,
    UWORK_API_DEBUG_LIST: resolveApiDebugListPath(),
  };
}

module.exports = {
  buildWorkerEnv,
};
