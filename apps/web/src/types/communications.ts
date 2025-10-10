export interface Channel {
  id: number
  name: string
  eventId?: number | null
  createdAt: string
  messages?: Array<Message>
  _count?: { messages: number }
}

export interface Message {
  id: number
  channelId: number
  authorId?: number | null
  content: string
  createdAt: string
}

export type CreateChannelInput = { name: string; eventId?: number }
export type CreateMessageInput = { channelId: number; authorId?: number; content: string }
