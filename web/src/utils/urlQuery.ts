/* eslint-disable */

/*
  将url的传参参数形式的字符串转化为json对象格式

  let param = 'school=gongda&hobby=skating&number=3'
  let jsonObj = queryToObj(param)

  console.log(jsonObj)
  输出：{
          school: 'gongda',
          hobby: 'skaing',
          number: '3'
        }
*/
function queryToObj(str: string) {
  var theRequest = {} as Record<string, any>
  if (str) {
    var strs = str.includes('&') ? str.split('&') : ('&' + str).split('&')
    for (let i = 0; i < strs.length; i++) {
      if (strs[i].includes('=')) {
        theRequest[strs[i].split('=')[0]] = strs[i].split('=')[1]
      }
    }
  }
  return theRequest
}

/*
 * 将obj转换成url参数形式
 * toQueryString({a:1,b:2})  =>   a=1&b=2
 *
 * */
function toQueryPair(key: string, value: string) {
  if (typeof value == 'undefined') {
    return key
  }
  return key + '=' + encodeURIComponent(value === null ? '' : String(value))
}

function toQueryString<T extends Record<string, any>>(obj: T) {
  let ret = [] as Array<string>
  for (let key in obj) {
    key = encodeURIComponent(key) as Extract<keyof T, string>
    const values = obj[key]
    if (values && Array.isArray(values)) {
      //数组
      const queryValues = <Array<string>>[]
      for (let i = 0, len = values.length, value; i < len; i++) {
        value = values[i]
        queryValues.push(toQueryPair(key, value))
      }
      ret = [...ret, ...queryValues]
    } else {
      //字符串
      ret.push(toQueryPair(key, values))
    }
  }
  return ret.join('&')
}

/*
    直接取url中的参数转为json（或者不转）
     用法1：
     let para = urlToJson()
     console.log(para)
  
     用法2：
     let para = urlToJson('https://www.baidu.com?a=1&b=2')
     console.log(para)
  
  * */
function urlToJson(selfUrl?: string) {
  const url = selfUrl ? selfUrl : window.location.href

  const reg = /\?.*$/ // 正则取'？后的参数'
  const urlMatch = url.match(reg)

  // 匹配去掉？的纯参数(正则精髓，贪婪永远匹配最后一个？后的参数)
  const param = urlMatch && urlMatch.length ? urlMatch[0].replace(/^\?*.*\?/, '') : ''

  const output = {
    paramStr: param,
    paramJson: queryToObj(param),
  }

  return output
}

/*
    直接取url中的某个参数
    用法：
     let deviceType = getQueryString('deviceType')
     console.log(deviceType)
  
  * */
function getQueryString(name: string, url: string) {
  url = url || window.location.href
  var str = url.match(new RegExp('([?&#])' + name.replace('#', '') + '=([^#&?]*)(\\s||$)', 'gi'))
  return str ? decodeURIComponent(str[0].split('=')[1]) : ''
}

/*
    更改url中的某个参数，返回更改后的最终带参数url
    参数解析：
    json: 更改参数的json对象
    originUrl：预置的网站地址
  
    用法一：
    let resultUrl = setUrl({id: 1, name: '测试页面'})
    console.log(resultUrl) // 输出：https://********.html?id=1&name=测试页面
  
    用法二：
    let resultUrl = setUrl({id: 3, name: '哈哈哈'}, 'https://www.baidu.com')
    console.log(resultUrl) // 输出：https://www.baidu.com?id=3&name=哈哈哈
  
  * */
function setUrl(json: Record<string, any>, originUrl = '') {
  let paramJson = urlToJson(originUrl).paramJson
  // 新的参数
  let newJson = {
    ...paramJson,
    ...json,
  }

  // 参数对象 =》get参数
  let paramStr = toQueryString(newJson)

  // url的origin + pathname
  let oPath = originUrl ? originUrl : window.location.href
  const rootPath = oPath.split('?')[0] // 获取url中 ？之前的部分

  let resultUrl = rootPath + '?' + paramStr
  // console.log(resultUrl)

  return resultUrl
}

/**
   * 制定不替换url已经存在的某个字段
   * @param {*} json
   * @param {*} originUrl
   * @param {*} unfields
   * @returns
   示例：
    const targetUrl = setUrlWidthUnField(
      { title: '123'},
      'https://www.baidu.com?title=666',
      ["title"],
    );
   */
function setUrlWidthUnField<T extends Record<string, any>>(
  json: T,
  originUrl = '',
  unfields = [] as Array<keyof T>
) {
  let { paramJson } = urlToJson(originUrl)

  if (unfields.length) {
    for (const key in json) {
      if (paramJson[key] && json[key] && unfields.includes(key)) {
        delete json[key]
      }
    }
  }

  let resultUrl = setUrl(json, originUrl)
  return resultUrl
}

export { queryToObj, toQueryString, urlToJson, getQueryString, setUrl, setUrlWidthUnField }
