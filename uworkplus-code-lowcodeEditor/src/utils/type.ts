type PushAllInfoReceiveResult = {
  successCbJson: string
}

export type PushAllInfoReceive = (res: PushAllInfoReceiveResult) => void

export type MapType = Record<string, any>

export type AnyFunction<T = unknown, R = void> = (...args: T[]) => R

export type InnerTypes =
  | 'Null'
  | 'Undefined'
  | Lowercase<
      | 'Array'
      | 'Object'
      | 'Number'
      | 'String'
      | 'Boolean'
      | 'Function'
      | 'Symbol'
      | 'BigInt'
      | 'Date'
      | 'RegExp'
      | 'Error'
      | 'Promise'
      | 'Map'
      | 'Set'
      | 'WeakMap'
      | 'WeakSet'
      | 'HTMLCollection'
      | 'NodeList'
      | 'FileList'
      | 'File'
      | 'Blob'
      | 'FormData'
      | 'URLSearchParams'
      | 'URL'
    >

export type CookieRecord<K extends string, V extends string> = {
  path?: string
  expires?: Date
  domain?: string
  secure?: boolean
  samesite?: string
  httponly?: boolean
} & Record<K, V>

export enum LoadTypes {
  Serial = 1,
  Parallel = 2,
}

export interface LoadResourceType {
  global: string
  src: string
  async: string
  name?: string
}

export interface CreateCtxBaseOptions {
  dom: string
  attrs: Record<string, string>
  fatherDom?: Element
  callBack: () => void
}
