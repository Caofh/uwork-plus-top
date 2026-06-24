const express = require('express');
const cors = require('cors');
const BaiduSpider = require('./spider_crawler.js');

const router = express.Router();
const spider = new BaiduSpider();

// 启用CORS
router.use(cors());

/**
 * 获取热门搜索
 * GET /api/hot-search
 */
router.get('/hot-search', async (req, res) => {
    try {
        console.log('API: 获取热门搜索请求');
        
        // 检查是否有缓存数据
        const cachedData = await spider.getLatestData();
        if (cachedData && cachedData.hotSearch && cachedData.hotSearch.length > 0) {
            // 检查缓存是否在5分钟内
            const cacheTime = new Date(cachedData.timestamp);
            const now = new Date();
            const diffMinutes = (now - cacheTime) / (1000 * 60);
            
            if (diffMinutes < 5) {
                console.log('返回缓存的热门搜索数据');
                return res.json({
                    success: true,
                    data: cachedData.hotSearch,
                    timestamp: cachedData.timestamp,
                    fromCache: true
                });
            }
        }

        // 爬取新数据
        const hotSearch = await spider.crawlHotSearch();
        
        res.json({
            success: true,
            data: hotSearch,
            timestamp: new Date().toISOString(),
            fromCache: false
        });

    } catch (error) {
        console.error('API错误 - 热门搜索:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取热点新闻
 * GET /api/hot-news
 */
router.get('/hot-news', async (req, res) => {
    try {
        console.log('API: 获取热点新闻请求');
        
        // 检查是否有缓存数据
        const cachedData = await spider.getLatestData();
        if (cachedData && cachedData.hotNews && cachedData.hotNews.length > 0) {
            // 检查缓存是否在5分钟内
            const cacheTime = new Date(cachedData.timestamp);
            const now = new Date();
            const diffMinutes = (now - cacheTime) / (1000 * 60);
            
            if (diffMinutes < 5) {
                console.log('返回缓存的热点新闻数据');
                return res.json({
                    success: true,
                    data: cachedData.hotNews,
                    timestamp: cachedData.timestamp,
                    fromCache: true
                });
            }
        }

        // 爬取新数据
        const hotNews = await spider.crawlHotNews();
        
        res.json({
            success: true,
            data: hotNews,
            timestamp: new Date().toISOString(),
            fromCache: false
        });

    } catch (error) {
        console.error('API错误 - 热点新闻:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取抖音热搜
 * GET /api/douyin-hot
 */
router.get('/douyin-hot', async (req, res) => {
    try {
        console.log('API: 获取抖音热搜请求');
        
        // 检查是否有缓存数据
        const cachedData = await spider.getLatestData();
        if (cachedData && cachedData.douyinHot && cachedData.douyinHot.length > 0) {
            // 检查缓存是否在5分钟内
            const cacheTime = new Date(cachedData.timestamp);
            const now = new Date();
            const diffMinutes = (now - cacheTime) / (1000 * 60);
            
            if (diffMinutes < 5) {
                console.log('返回缓存的抖音热搜数据');
                return res.json({
                    success: true,
                    data: cachedData.douyinHot,
                    timestamp: cachedData.timestamp,
                    fromCache: true
                });
            }
        }

        // 爬取新数据
        const douyinHot = await spider.crawlDouyinHotSearch();
        
        res.json({
            success: true,
            data: douyinHot,
            timestamp: new Date().toISOString(),
            fromCache: false
        });

    } catch (error) {
        console.error('API错误 - 抖音热搜:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取微博热搜
 * GET /api/weibo-hot
 */
router.get('/weibo-hot', async (req, res) => {
    try {
        console.log('API: 获取微博热搜请求');
        
        // 检查是否有缓存数据
        const cachedData = await spider.getLatestData();
        if (cachedData && cachedData.weiboHot && cachedData.weiboHot.length > 0) {
            // 检查缓存是否在5分钟内
            const cacheTime = new Date(cachedData.timestamp);
            const now = new Date();
            const diffMinutes = (now - cacheTime) / (1000 * 60);
            
            if (diffMinutes < 5) {
                console.log('返回缓存的微博热搜数据');
                return res.json({
                    success: true,
                    data: cachedData.weiboHot,
                    timestamp: cachedData.timestamp,
                    fromCache: true
                });
            }
        }

        // 爬取新数据
        const weiboHot = await spider.crawlWeiboHotSearch();
        
        res.json({
            success: true,
            data: weiboHot,
            timestamp: new Date().toISOString(),
            fromCache: false
        });

    } catch (error) {
        console.error('API错误 - 微博热搜:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取所有热门信息
 * GET /api/all
 */
router.get('/all', async (req, res) => {
    try {
        console.log('API: 获取所有热门信息请求');
        
        // 检查是否有缓存数据
        const cachedData = await spider.getLatestData();
        if (cachedData && cachedData.timestamp) {
            // 检查缓存是否在5分钟内
            const cacheTime = new Date(cachedData.timestamp);
            const now = new Date();
            const diffMinutes = (now - cacheTime) / (1000 * 60);
            
            if (diffMinutes < 5) {
                console.log('返回缓存的所有数据');
                return res.json({
                    success: true,
                    data: cachedData,
                    fromCache: true
                });
            }
        }

        // 爬取新数据
        const allData = await spider.crawlAll();
        
        res.json({
            success: true,
            data: allData,
            fromCache: false
        });

    } catch (error) {
        console.error('API错误 - 所有数据:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 强制刷新数据
 * POST /api/refresh
 */
router.post('/refresh', async (req, res) => {
    try {
        console.log('API: 强制刷新数据请求');
        
        const allData = await spider.crawlAll();
        
        res.json({
            success: true,
            data: allData,
            message: '数据刷新成功',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API错误 - 刷新数据:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取API状态
 * GET /api/status
 */
router.get('/status', async (req, res) => {
    try {
        const cachedData = await spider.getLatestData();
        
        res.json({
            success: true,
            status: 'running',
            lastUpdate: cachedData ? cachedData.timestamp : null,
            dataAvailable: !!cachedData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API错误 - 状态检查:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 