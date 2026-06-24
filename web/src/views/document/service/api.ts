import { http } from '@/utils/axios'

export interface ApiResponse<T = any> {
  code: number
  msg?: string
  message?: string
  data: T
  total?: number
}

export interface ArticleListParams {
  article_type: number
  limit?: number
  page?: number
}

export interface ArticlePayload {
  article_id?: number | string
  article_name?: string
  article_content?: string
  article_address?: string
  article_iconUrl?: string
  article_type?: number
}

export const onlineDocApi = {
  getArticleList: (params: ArticleListParams) => {
    return http.get<ApiResponse>(`/articleList/getArticleList?r=${Date.now()}`, {
      params: {
        limit: 20,
        page: 1,
        ...params,
      },
    })
  },
  addArticle: (params: ArticlePayload) => {
    return http.post<ApiResponse>(`/articleList/addArticle`, { ...params })
  },
  updateArticle: (params: ArticlePayload) => {
    return http.post<ApiResponse>(`/articleList/updateArticle`, { ...params })
  },
  removeArticle: (params: { article_id: number | string }) => {
    return http.post<ApiResponse>(`/articleList/removeArticle`, { ...params })
  },
  searchArticle: (params: { keyword: string }) => {
    return http.get<ApiResponse>(`/articleList/searchArticle?r=${Date.now()}`, {
      params,
    })
  },
}
