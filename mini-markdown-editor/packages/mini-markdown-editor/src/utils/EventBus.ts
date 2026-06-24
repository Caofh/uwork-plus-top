// utils/EventBus.ts
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) return;
    const handlers = this.events.get(event)!;
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;
    this.events.get(event)!.forEach((handler) => handler(...args));
  }

  clear(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
