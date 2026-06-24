// EventBus 事件总线工具类
type EventHandler = (...args: any[]) => void

class EventBus {
  private events: Map<string, EventHandler[]> = new Map()

  // 订阅事件
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)
  }

  // 取消订阅事件
  off(event: string, handler?: EventHandler): void {
    if (!this.events.has(event)) return

    if (handler) {
      const handlers = this.events.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.events.delete(event)
    }
  }

  // 发布事件
  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return

    const handlers = this.events.get(event)!
    handlers.forEach(handler => {
      try {
        handler(...args)
      } catch (error) {
        console.error(`EventBus: Error in event handler for ${event}:`, error)
      }
    })
  }

  // 只订阅一次事件
  once(event: string, handler: EventHandler): void {
    const onceHandler = (...args: any[]) => {
      handler(...args)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  // 清空所有事件
  clear(): void {
    this.events.clear()
  }

  // 获取事件数量
  getEventCount(event?: string): number {
    if (event) {
      return this.events.get(event)?.length || 0
    }
    return this.events.size
  }
}

// 创建全局单例
const eventBus = new EventBus()

export default eventBus
export { EventBus }
