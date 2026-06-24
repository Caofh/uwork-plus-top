import { InnerTypes } from './type'

//返回传递给他的任意对象的类(返回：array、object、number、string)
function isClass(o: unknown): InnerTypes {
  if (o === null) return 'Null'
  if (o === undefined) return 'Undefined'

  return Object.prototype.toString.call(o).slice(8, -1).toLowerCase() as InnerTypes
}

/* 设置本地存储(示例如下)
1. setStorage('20191111_game_v1', '哈哈哈')
2. setStorage('20191111_game_v1', {a:1, b:2})
*/
function setStorage(key: string, value: any) {
  const v = isClass(value) === 'string' ? value : JSON.stringify(value) || ''
  localStorage.setItem(key, v)
}

/* 删除本地存储(示例如下)
  removeStorage('20191111_game_v1')
  */
function removeStorage(key: string) {
  localStorage.getItem(key) && localStorage.removeItem(key)
}

/* 获取本地存储(示例如下)
  1. let data = getStorage('20191111_game_v1')
  2. let data = getStorage('20191111_game_v1', 'deviceId')
  console.log(data)
  */
function getStorage(key: string, subKey?: string) {
  let res: Record<string, any> | string = ''
  const stringLocal = localStorage.getItem(key) || ''
  let parseLocal: Record<string, any> | string = ''

  try {
    parseLocal = JSON.parse(stringLocal)
  } catch (error) {
    parseLocal = stringLocal
  }

  // 区分是否有subKey
  if (!subKey) {
    res = parseLocal
  } else if (typeof parseLocal === 'object' && isClass(parseLocal) === 'object') {
    res = parseLocal[subKey] || ''
  }

  return res
}

export { setStorage, removeStorage, getStorage }
