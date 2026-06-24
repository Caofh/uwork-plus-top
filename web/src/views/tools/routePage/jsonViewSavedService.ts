import { CodeDirListService } from '@/utils/sqlOperate'
import { isInElectron } from '@/utils/electron'
import { getStorage, setStorage } from '@/utils/storage'

const SQL_FILE = 'dataSql/jsonViewSaved.json'
const LS_KEY = 'jsonViewSaved'

export type SavedJsonRecord = {
  id: number | string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

const electronService = new CodeDirListService(SQL_FILE)

async function readAll(): Promise<SavedJsonRecord[]> {
  if (isInElectron()) {
    try {
      const list = await electronService.readAll()
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }
  const list = getStorage(LS_KEY)
  return Array.isArray(list) ? list : []
}

async function create(record: Omit<SavedJsonRecord, 'id'>): Promise<SavedJsonRecord> {
  if (isInElectron()) {
    try {
      return (await electronService.create(record)) as SavedJsonRecord
    } catch {
      const item: SavedJsonRecord = { ...record, id: Date.now() }
      await electronService.writeAll([item])
      return item
    }
  }
  const list = await readAll()
  const item: SavedJsonRecord = { ...record, id: Date.now() }
  list.unshift(item)
  setStorage(LS_KEY, list)
  return item
}

async function remove(id: number | string): Promise<void> {
  if (isInElectron()) {
    await electronService.remove(id)
    return
  }
  const list = (await readAll()).filter(item => String(item.id) !== String(id))
  setStorage(LS_KEY, list)
}

export const jsonViewSavedService = {
  readAll,
  create,
  remove,
}
