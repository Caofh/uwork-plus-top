const axios = require("axios");

function calcSize(data, headers) {
  if (data == null) {
    return 0;
  }
  if (typeof data === "string") {
    return Buffer.byteLength(data, "utf8");
  }
  if (Buffer.isBuffer(data)) {
    return data.length;
  }
  try {
    return Buffer.byteLength(JSON.stringify(data), "utf8");
  } catch {
    return 0;
  }
}

function normalizeHeaders(headers = {}) {
  const result = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (key && value !== undefined && value !== null && value !== "") {
      result[key] = String(value);
    }
  });
  return result;
}

async function sendApiRequest(options = {}) {
  const {
    method = "GET",
    url = "",
    headers = {},
    params = {},
    data,
    timeout = 60000,
  } = options;

  if (!url || !String(url).trim()) {
    return { code: -1, message: "URL 不能为空" };
  }

  const start = Date.now();

  try {
    const response = await axios({
      method: String(method || "GET").toUpperCase(),
      url: String(url).trim(),
      headers: normalizeHeaders(headers),
      params,
      data,
      timeout,
      validateStatus: () => true,
      maxRedirects: 5,
      responseType: "text",
      transformResponse: [(body) => body],
    });

    let responseData = response.data;
    const contentType = response.headers["content-type"] || "";

    if (typeof responseData === "string" && contentType.includes("application/json")) {
      try {
        responseData = JSON.parse(responseData);
      } catch {
        // keep raw string
      }
    }

    return {
      code: 0,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData,
      duration: Date.now() - start,
      size: calcSize(response.data, response.headers),
    };
  } catch (error) {
    const response = error.response;
    if (response) {
      return {
        code: 0,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration: Date.now() - start,
        size: calcSize(response.data, response.headers),
        message: error.message,
      };
    }

    return {
      code: -1,
      message: error.message || "请求失败",
      duration: Date.now() - start,
    };
  }
}

module.exports = {
  sendApiRequest,
};
