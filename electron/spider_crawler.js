const axios = require("axios");
const cheerio = require("cheerio");
// const axios = require("../../node_modules/axios");
// const cheerio = require("../../node_modules/cheerio");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
// 判断当前构建环境
let resourcePath = "";
const Env = process.env.NODE_ENV;
if (Env === "development") {
  resourcePath = "./resources";
} else {
  resourcePath = "../resources";
}

const { getRootConfigPath } = require(path.join(
  __dirname,
  `${resourcePath}/util.js`
));

// 获取根路径path: UWORK-PLUS-dev（开发环境） 或 UWORK-PLUS（线上环境）
const projectPath = getRootConfigPath();

// const dataDir = path.join(__dirname, "../data");
// 爬虫数据存放路径
const dataDir = `${os.homedir()}/${projectPath}/dataSpider/record`;

class BaiduSpider {
  constructor() {
    this.baseUrl = "https://www.baidu.com";
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    };
  }

  /**
   * 使用axios和cheerio爬取百度首页热门搜索
   */
  async crawlHotSearch() {
    try {
      console.log("开始爬取百度热门搜索...");
      const response = await axios.get(this.baseUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const hotSearchList = [];

      // 尝试多种选择器来获取热门搜索
      const selectors = [
        ".s-hotsearch-content .hotsearch-item .title-content-title",
        ".s-hotsearch-content .hotsearch-item",
        ".s_wrap .s_hot",
        "[data-click]",
        ".s-hotsearch-content .hotsearch-item a",
        ".s-hotsearch-content a",
      ];

      let found = false;
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((index, element) => {
            const $el = $(element);
            let title = $el.text().trim();
            let link = $el.attr("href") || $el.find("a").attr("href");

            // 清理标题中的乱码字符
            title = title.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
            title = title.replace(/^\s*[\u0000-\u001F\u007F-\u009F]+\s*/, "");
            title = title.trim();

            // 过滤掉太短的标题
            if (title && title.length > 2 && title.length < 100) {
              hotSearchList.push({
                rank: index + 1,
                title: title,
                link: link
                  ? link.startsWith("http")
                    ? link
                    : `https://www.baidu.com${link}`
                  : null,
                timestamp: new Date().toISOString(),
              });
            }
          });

          if (hotSearchList.length > 0) {
            found = true;
            break;
          }
        }
      }

      console.log(`成功爬取到 ${hotSearchList.length} 条热门搜索`);
      return hotSearchList.slice(0, 10); // 只返回前10条
    } catch (error) {
      console.error("爬取热门搜索失败:", error.message);
    }
  }

  /**
   * 爬取抖音热搜
   */
  async crawlDouyinHotSearchBackup() {
    try {
      console.log("使用备用方法爬取抖音热搜...");

      // 使用百度搜索抖音热搜
      const searchUrl = "https://www.baidu.com/s?wd=抖音热搜榜今日";

      const response = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const hotSearchList = [];

      // 尝试从搜索结果中提取抖音热搜
      $(".result, .c-container").each((index, element) => {
        const $el = $(element);
        let title = $el.find("h3, .t, .c-title").text().trim();
        const link = $el.find("a").attr("href");

        // 清理标题
        title = title.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
        title = title.trim();

        // 过滤抖音相关热搜
        if (
          title &&
          title.length > 3 &&
          title.length < 100 &&
          (title.includes("抖音") ||
            title.includes("热搜") ||
            title.includes("热门"))
        ) {
          hotSearchList.push({
            rank: index + 1,
            title: title,
            link: link,
            timestamp: new Date().toISOString(),
          });
        }
      });

      console.log(`备用方法爬取到 ${hotSearchList.length} 条抖音热搜`);
      return hotSearchList.slice(0, 10);
    } catch (error) {
      console.error("抖音热搜备用方法失败:", error.message);
      return [];
    }
  }

  /**
   * 爬取微博热搜
   */
  async crawlWeiboHotSearch() {
    try {
      console.log("开始爬取微博热搜...");

      // 使用微博热搜API
      const weiboUrl = "https://weibo.com/ajax/side/hotSearch";

      const response = await axios.get(weiboUrl, {
        headers: {
          ...this.headers,
          Referer: "https://weibo.com/",
          Origin: "https://weibo.com",
        },
        timeout: 10000,
      });

      if (response.data && response.data.data && response.data.data.realtime) {
        const hotSearchList = response.data.data.realtime
          .slice(0, 10)
          .map((item, index) => ({
            rank: index + 1,
            title: item.word,
            hotValue: item.num,
            link: `https://s.weibo.com/weibo?q=${encodeURIComponent(
              item.word
            )}`,
            timestamp: new Date().toISOString(),
          }));

        console.log(`成功爬取到 ${hotSearchList.length} 条微博热搜`);
        return hotSearchList;
      }

      // 如果API失败，尝试备用方法
      return await this.crawlWeiboHotSearchBackup();
    } catch (error) {
      console.error("爬取微博热搜失败:", error.message);
      return await this.crawlWeiboHotSearchBackup();
    }
  }

  /**
   * 爬取github热搜
   */
  async crawlGitHubSearch() {
    try {
      console.log("开始爬取github数据...");

      // 使用github API
      const gitHubUrl =
        "https://api.github.com/search/repositories?q=javascript&sort=stars&order=desc&per_page=10&page=1";

      const response = await axios.get(gitHubUrl, {
        headers: {
          ...this.headers,
          Referer: "https://github.com/",
          Origin: "https://github.com",
        },
        timeout: 10000,
      });
      if (response.data && response.data.items) {
        const hotSearchList = response.data.items;

        console.log(`成功爬取到 ${hotSearchList.length} 条github热搜`);
        return hotSearchList;
      }

      return [];

      // 如果API失败，尝试备用方法
      // return await this.crawlWeiboHotSearchBackup();
    } catch (error) {
      console.error("爬取github数据失败:", error.message);
      return getGitHubDataBackup();
    }
  }

  getGitHubDataBackup() {
    const gitHubBackUpData = [
      {
        name: "freeCodeCamp",
        html_url: "https://github.com/freeCodeCamp/freeCodeCamp",
        stargazers_count: 425395,
      },
      {
        name: "project-based-learning",
        html_url:
          "https://github.com/practical-tutorials/project-based-learning",
        stargazers_count: 238402,
      },
      {
        name: "react",
        html_url: "https://github.com/facebook/react",
        stargazers_count: 237982,
      },
      {
        name: "vue",
        html_url: "https://github.com/vuejs/vue",
        stargazers_count: 209246,
      },
      {
        name: "javascript-algorithms",
        html_url: "https://github.com/trekhleb/javascript-algorithms",
        stargazers_count: 192937,
      },
      {
        name: "You-Dont-Know-JS",
        html_url: "https://github.com/getify/You-Dont-Know-JS",
        stargazers_count: 182902,
      },
      {
        name: "bootstrap",
        html_url: "https://github.com/twbs/bootstrap",
        stargazers_count: 172815,
      },
      {
        name: "javascript",
        html_url: "https://github.com/airbnb/javascript",
        stargazers_count: 147243,
      },
      {
        name: "30-seconds-of-code",
        html_url: "https://github.com/Chalarangelo/30-seconds-of-code",
        stargazers_count: 124854,
      },
      {
        name: "electron",
        html_url: "https://github.com/electron/electron",
        stargazers_count: 117811,
      },
    ];
    return gitHubBackUpData;
  }

  /**
   * 微博热搜备用方法
   */
  async crawlWeiboHotSearchBackup() {
    try {
      console.log("使用备用方法爬取微博热搜...");

      // 使用百度搜索微博热搜
      const searchUrl = "https://www.baidu.com/s?wd=微博热搜榜今日";

      const response = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const hotSearchList = [];

      // 尝试从搜索结果中提取微博热搜
      $(".result, .c-container").each((index, element) => {
        const $el = $(element);
        let title = $el.find("h3, .t, .c-title").text().trim();
        const link = $el.find("a").attr("href");

        // 清理标题
        title = title.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
        title = title.trim();

        // 过滤微博相关热搜
        if (
          title &&
          title.length > 3 &&
          title.length < 100 &&
          (title.includes("微博") ||
            title.includes("热搜") ||
            title.includes("热门"))
        ) {
          hotSearchList.push({
            rank: index + 1,
            title: title,
            link: link,
            timestamp: new Date().toISOString(),
          });
        }
      });

      console.log(`备用方法爬取到 ${hotSearchList.length} 条微博热搜`);
      return hotSearchList.slice(0, 10);
    } catch (error) {
      console.error("微博热搜备用方法失败:", error.message);
      return [];
    }
  }

  /**
   * 爬取百度新闻热点
   */
  async crawlHotNews() {
    try {
      console.log("开始爬取百度新闻热点...");
      // 直接使用搜索获取热点新闻
      return await this.crawlNewsFromSearch();
    } catch (error) {
      console.error("爬取新闻失败:", error.message);
      return [];
    }
  }

  /**
   * 从搜索页面爬取新闻
   */
  async crawlNewsFromSearch() {
    try {
      console.log("从搜索页面爬取新闻...");
      // const newsUrl = 'https://www.baidu.com/s?wd=今日热点新闻&rn=20&tn=news';
      const newsUrl = "https://top.baidu.com/board";
      const response = await axios.get(newsUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const newsList = [];

      $(".list_1EDla")
        .find("a")
        .each((index, element) => {
          const $el = $(element);

          const domName = {
            title: ".c-single-text-ellipsis",
            src: "",
            imgUrl: ".active-item-img_3i_Tx",
            rank: ".index_k2hIU",
            hotStatus: ".normal_1fQqB .hot-state_NdlbW",
          };
          let title = $el.find(domName.title).text().trim();
          let src = $el.attr("href");
          let imgUrl = $el.find(domName.imgUrl).attr("src");
          let rank = $el.find(domName.rank).text();
          let hotStatus = $el.find(domName.hotStatus).text();

          newsList.push({
            title,
            src,
            imgUrl,
            rank,
            hotStatus,
          });
        });
      // 获取搜索结果中的新闻
      // $('.result, .c-container, .result-op').each((index, element) => {
      //     const $el = $(element);
      //     let title = $el.find('h3, .t, .c-title, .news-title').text().trim();
      //     const link = $el.find('a').attr('href');
      //     const summary = $el.find('.c-abstract, .content-right_8Zs40, .c-span-last, .c-summary').text().trim();

      //     // 清理标题
      //     title = title.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      //     title = title.replace(/^\s*[\u0000-\u001F\u007F-\u009F]+\s*/, '');
      //     title = title.trim();

      //     // 过滤掉包含特定关键词的标题
      //     const excludeKeywords = ['查看更多', '热搜指数', '百度', '新闻中心', '新闻频道'];
      //     const shouldExclude = excludeKeywords.some(keyword => title.includes(keyword));

      //     if (title && title.length > 5 && title.length < 100 && !shouldExclude) {
      //         newsList.push({
      //             rank: index + 1,
      //             title: title,
      //             link: link,
      //             summary: summary,
      //             timestamp: new Date().toISOString()
      //         });
      //     }
      // });

      // 如果没有获取到足够的新闻，尝试其他关键词
      if (newsList.length < 5) {
        console.log("新闻数量不足，尝试其他关键词...");
        return await this.crawlNewsWithAlternativeKeywords();
      }

      console.log(`从搜索页面爬取到 ${newsList.length} 条新闻`);
      return newsList.slice(0, 10);
    } catch (error) {
      console.error("从搜索页面爬取新闻失败:", error.message);
      return await this.crawlNewsWithAlternativeKeywords();
    }
  }

  /**
   * 使用其他关键词爬取新闻
   */
  async crawlNewsWithAlternativeKeywords() {
    try {
      console.log("使用其他关键词爬取新闻...");
      const keywords = ["热点新闻", "今日要闻", "时事新闻"];

      for (const keyword of keywords) {
        const newsUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(
          keyword
        )}&rn=10&tn=news`;

        const response = await axios.get(newsUrl, {
          headers: this.headers,
          timeout: 10000,
        });

        const $ = cheerio.load(response.data);
        const newsList = [];

        $(".result, .c-container, .result-op").each((index, element) => {
          const $el = $(element);
          let title = $el.find("h3, .t, .c-title, .news-title").text().trim();
          const link = $el.find("a").attr("href");
          const summary = $el
            .find(".c-abstract, .content-right_8Zs40, .c-span-last, .c-summary")
            .text()
            .trim();

          // 清理标题
          title = title.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
          title = title.replace(/^\s*[\u0000-\u001F\u007F-\u009F]+\s*/, "");
          title = title.trim();

          // 过滤掉包含特定关键词的标题
          const excludeKeywords = [
            "查看更多",
            "热搜指数",
            "百度",
            "新闻中心",
            "新闻频道",
          ];
          const shouldExclude = excludeKeywords.some((keyword) =>
            title.includes(keyword)
          );

          if (
            title &&
            title.length > 5 &&
            title.length < 100 &&
            !shouldExclude
          ) {
            newsList.push({
              rank: index + 1,
              title: title,
              link: link,
              summary: summary,
              timestamp: new Date().toISOString(),
            });
          }
        });

        if (newsList.length > 0) {
          console.log(`使用关键词"${keyword}"爬取到 ${newsList.length} 条新闻`);
          return newsList.slice(0, 10);
        }
      }

      console.log("所有关键词都无法获取到新闻");
      return [];
    } catch (error) {
      console.error("使用其他关键词爬取新闻失败:", error.message);
      return [];
    }
  }

  /**
   * 爬取所有热门信息
   */
  async crawlAll() {
    try {
      console.log("开始爬取所有热门信息...");

      const [hotSearch, hotNews, douyinHot, weiboHot, gitHubHot] =
        await Promise.all([
          this.crawlHotSearch(),
          this.crawlHotNews(),
          this.crawlDouyinHotSearchBackup(),
          this.crawlWeiboHotSearch(),
          this.crawlGitHubSearch(),
        ]);

      const result = {
        hotSearch: hotSearch,
        hotNews: hotNews,
        douyinHot: douyinHot,
        weiboHot: weiboHot,
        gitHubHot: gitHubHot,
        timestamp: new Date().toISOString(),
        total: {
          hotSearch: hotSearch.length,
          hotNews: hotNews.length,
          douyinHot: douyinHot.length,
          weiboHot: weiboHot.length,
          gitHubHot: gitHubHot.length,
        },
      };

      // 保存数据到文件
      await this.saveData(result);

      return result;
    } catch (error) {
      console.error("爬取所有信息失败:", error.message);
      return {
        hotSearch: [],
        hotNews: [],
        douyinHot: [],
        weiboHot: [],
        timestamp: new Date().toISOString(),
        total: {
          hotSearch: 0,
          hotNews: 0,
          douyinHot: 0,
          weiboHot: 0,
        },
        error: error.message,
      };
    }
  }

  /**
   * 保存数据到文件
   */
  async saveData(data) {
    try {
      // const dataDir = path.join(__dirname, "../data");
      const filename = `baidu_hot_${
        new Date().toISOString().split("T")[0]
      }.json`;
      const filepath = path.join(dataDir, filename);

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf8");
      console.log(`数据已保存到: ${filepath}`);

      // 同时保存最新数据
      const latestFilepath = path.join(dataDir, "latest.json");
      await fs.writeFile(latestFilepath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.error("保存数据失败:", error.message);
    }
  }

  /**
   * 获取最新数据
   */
  async getLatestData() {
    try {
      // const dataDir = path.join(__dirname, "../data");
      const latestFilepath = path.join(dataDir, "latest.json");

      const data = await fs.readFile(latestFilepath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("获取最新数据失败:", error.message);
      return null;
    }
  }
}

module.exports = BaiduSpider;
