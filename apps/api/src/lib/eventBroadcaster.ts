import { EventEmitter } from 'events'

class MatchEventBroadcaster extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  broadcast(eventId: number, type: string, payload: any) {
    this.emit(`event:${eventId}`, { type, payload, timestamp: new Date().toISOString() })
  }
}

export const matchBroadcaster = new MatchEventBroadcaster()
