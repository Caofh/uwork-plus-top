import { resolveRemoteOrLocal, remoteOrigin } from '@/config/remote'

/** 线上文档地址 */
export function getDocumentOnlineUrl() {
  const timestamp = Date.now()
  return `${resolveRemoteOrLocal('/uworkplusMarkdown/')}?timestamp=${timestamp}`
}

/** 个人文章公开分享链接（与 iwork Article.vue 保持一致） */
export function buildArticleShareUrl(articleId: string | number) {
  const id = encodeURIComponent(String(articleId))
  if (!remoteOrigin) return ''
  return `${remoteOrigin}/iwork/article?pageType=shareArticle&id=${id}`
}
