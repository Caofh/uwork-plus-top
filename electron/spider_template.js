const home = `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>百度热门信息爬虫</title>
              <style>
                  body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      max-width: 1200px;
                      margin: 0 auto;
                      padding: 20px;
                      background-color: #f5f5f5;
                  }
                  .container {
                      background: white;
                      border-radius: 10px;
                      padding: 30px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  h1 {
                      color: #333;
                      text-align: center;
                      margin-bottom: 30px;
                  }
                  .api-section {
                      margin-bottom: 30px;
                      padding: 20px;
                      border: 1px solid #e0e0e0;
                      border-radius: 8px;
                      background: #fafafa;
                  }
                  .api-section h3 {
                      color: #2196F3;
                      margin-top: 0;
                  }
                  .endpoint {
                      background: #333;
                      color: #fff;
                      padding: 10px;
                      border-radius: 5px;
                      font-family: monospace;
                      margin: 10px 0;
                  }
                  .description {
                      color: #666;
                      line-height: 1.6;
                  }
                  .status {
                      text-align: center;
                      padding: 20px;
                      background: #e8f5e8;
                      border-radius: 8px;
                      margin: 20px 0;
                  }
                  .status.online {
                      background: #e8f5e8;
                      color: #2e7d32;
                  }
                  .status.offline {
                      background: #ffebee;
                      color: #c62828;
                  }
                  .refresh-btn {
                      background: #2196F3;
                      color: white;
                      border: none;
                      padding: 10px 20px;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 16px;
                  }
                  .refresh-btn:hover {
                      background: #1976D2;
                  }
                  .data-preview {
                      margin-top: 20px;
                      padding: 15px;
                      background: #f8f9fa;
                      border-radius: 5px;
                      border-left: 4px solid #2196F3;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>🔍 百度热门信息爬虫</h1>

                  <div class="status online" id="status">
                      <strong>🟢 服务运行中</strong><br>
                      服务器时间: <span id="serverTime"></span>
                  </div>

                  <div class="api-section">
                      <h3>📊 API 接口</h3>
                      <div class="endpoint">GET /api/hot-search</div>
                      <div class="description">获取百度热门搜索排行榜</div>

                      <div class="endpoint">GET /api/hot-news</div>
                      <div class="description">获取百度热点新闻</div>

                      <div class="endpoint">GET /api/douyin-hot</div>
                      <div class="description">获取抖音热搜榜</div>

                      <div class="endpoint">GET /api/weibo-hot</div>
                      <div class="description">获取微博热搜榜</div>

                      <div class="endpoint">GET /api/all</div>
                      <div class="description">获取所有热门信息（百度 + 抖音 + 微博）</div>

                      <div class="endpoint">POST /api/refresh</div>
                      <div class="description">强制刷新数据</div>

                      <div class="endpoint">GET /api/status</div>
                      <div class="description">获取API状态信息</div>
                  </div>

                  <div class="api-section">
                      <h3>🔄 数据操作</h3>
                      <button class="refresh-btn" onclick="refreshData()">刷新数据</button>
                      <button class="refresh-btn" onclick="checkStatus()">检查状态</button>
                  </div>

                  <div class="data-preview" id="dataPreview">
                      <h4>📈 数据预览</h4>
                      <p>点击上方按钮获取最新数据...</p>
                  </div>
              </div>

              <script>
                  // 更新服务器时间
                  function updateServerTime() {
                      const now = new Date();
                      document.getElementById('serverTime').textContent = now.toLocaleString('zh-CN');
                  }

                  updateServerTime();
                  setInterval(updateServerTime, 1000);

                  // 刷新数据
                  async function refreshData() {
                      try {
                          const response = await fetch('/api/refresh', { method: 'POST' });
                          const data = await response.json();

                          if (data.success) {
                              displayData(data.data);
                          } else {
                              alert('刷新失败: ' + data.error);
                          }
                      } catch (error) {
                          alert('请求失败: ' + error.message);
                      }
                  }

                  // 检查状态
                  async function checkStatus() {
                      try {
                          const response = await fetch('/api/status');
                          const data = await response.json();

                          if (data.success) {
                              const statusDiv = document.getElementById('status');
                              statusDiv.className = 'status online';
                              statusDiv.innerHTML = \`
                                  <strong>🟢 服务运行中</strong><br>
                                  最后更新: \${data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('zh-CN') : '无数据'}<br>
                                  数据可用: \${data.dataAvailable ? '是' : '否'}
                              \`;
                          }
                      } catch (error) {
                          alert('状态检查失败: ' + error.message);
                      }
                  }

                  // 显示数据
                  function displayData(data) {
                      const preview = document.getElementById('dataPreview');

                      let html = '<h4>📈 最新数据</h4>';
                      html += '<p><strong>更新时间:</strong> ' + new Date(data.timestamp).toLocaleString('zh-CN') + '</p>';

                      if (data.hotSearch && data.hotSearch.length > 0) {
                          html += '<h5>🔥 百度热门搜索 (前5条)</h5><ul>';
                          data.hotSearch.slice(0, 5).forEach(item => {
                              html += \`<li>\${item.rank}. \${item.title}</li>\`;
                          });
                          html += '</ul>';
                      }

                      if (data.hotNews && data.hotNews.length > 0) {
                          html += '<h5>📰 百度热点新闻 (前3条)</h5><ul>';
                          data.hotNews.slice(0, 3).forEach(item => {
                              html += \`<li>\${item.rank}. \${item.title}</li>\`;
                          });
                          html += '</ul>';
                      }

                      if (data.douyinHot && data.douyinHot.length > 0) {
                          html += '<h5>🎵 抖音热搜 (前5条)</h5><ul>';
                          data.douyinHot.slice(0, 5).forEach(item => {
                              html += \`<li>\${item.rank}. \${item.title}</li>\`;
                          });
                          html += '</ul>';
                      }

                      if (data.weiboHot && data.weiboHot.length > 0) {
                          html += '<h5>📱 微博热搜 (前5条)</h5><ul>';
                          data.weiboHot.slice(0, 5).forEach(item => {
                              html += \`<li>\${item.rank}. \${item.title}</li>\`;
                          });
                          html += '</ul>';
                      }

                      preview.innerHTML = html;
                  }

                  // 页面加载时检查状态
                  window.onload = function() {
                      checkStatus();
                  };
              </script>
          </body>
          </html>
      `;

const template = {
  home: home,
};

module.exports = template;
