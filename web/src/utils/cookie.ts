import { CookieRecord } from './type'
import Cookies from 'js-cookie' // 第三方cookie插件：文档地址：https://github.com/js-cookie/js-cookie

// 第三方cookie插件：首页地址：https://github.com/component/cookie#readme
/* 设置cookie
  用法一：
  setCookie('topay_cli_manage_name', '123')
  用法二：
  var in15Minutes = new Date(new Date().getTime() + 15 * 60 * 1000);
  setCookie('topay_cli_manage_name', '123', {
    path: '/about',
    expires: in15Minutes, // 过期时间（毫秒）
  })
*/

function setCookie<K extends string, V extends string>(
  key: K,
  value: V,
  config: CookieRecord<never, never> = {} as CookieRecord<never, never>
) {
  const defaultConfig = { path: '/' } as CookieRecord<K, V>
  Object.assign(defaultConfig, config)
  Cookies.set(key, value, defaultConfig)
}

/*
  用法一：
  removeCookie('topay_cli_manage_name')
  用法二：
  removeCookie('topay_cli_manage_name', {
    path: /about,
  })
*/
function removeCookie(key: string, config?: object) {
  const defaultConfig = {
    path: '/',
  }
  Object.assign(defaultConfig, config)
  Cookies.remove(key, defaultConfig) // removed!
}

/* 获取cookie
  用法一：
  getCookie('cookieName')
  用法二：
  getCookie('cookieName', {
    path: /about,
  })
*/
function getCookie(key: string, config?: Record<string, string>) {
  const defaultConfig = {
    path: '/',
  }
  Object.assign(defaultConfig, config)
  // @ts-ignore
  return Cookies.get(key, defaultConfig)
}

export { setCookie, removeCookie, getCookie }
