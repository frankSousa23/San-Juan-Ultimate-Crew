import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { channelsApi, messagesApi } from '../../../lib/api'
import { Channel, Message } from '../../../types/communications'
import { useToast } from '../../../hooks/useToast'
import { useApi } from '../../../hooks/useApi'

export function useChannels(user: any, canManage: boolean, isGuest: boolean) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composer, setComposer] = useState('')
  const pollRef = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [newChannelOpen, setNewChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [params, setSearchParams] = useSearchParams()
  const listRef = useRef<HTMLDivElement | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const latestAtRef = useRef<string | undefined>(undefined)
  
  const toasts = useToast()

  const { execute: loadChannels } = useApi(channelsApi.list, {
    onSuccess: (data) => setChannels(data),
    showErrorToast: true
  })

  const { execute: loadMessages, loading } = useApi(
    (channelId: number, params?: any) => messagesApi.list(channelId, params),
    {
      onSuccess: (data) => {
        const asc = [...data].reverse()
        setMessages(asc)
        setHasMore(data.length === 30)
        latestAtRef.current = asc.length ? asc[asc.length - 1].createdAt : undefined
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 0)
      },
      showErrorToast: true
    }
  )

  const { execute: sendMessage } = useApi(messagesApi.create, {
    onSuccess: (real) => {
      setMessages(prev => prev.map(m => (m.id === Math.random() ? real : m)))
      setSending(false)
    },
    onError: () => {
      setMessages(prev => prev.filter(m => m.id !== Math.random()))
      setError('No se pudo enviar el mensaje')
      setSending(false)
    },
    showErrorToast: true
  })

  const { execute: createChannel } = useApi(channelsApi.create, {
    onSuccess: (data) => {
      setChannels(prev => [data, ...prev])
      setNewChannelName('')
      setNewChannelOpen(false)
      setActiveId(data.id)
      const next = new URLSearchParams(params)
      next.set('channelId', String(data.id))
      setSearchParams(next)
      toasts.success('Canal creado')
    },
    showErrorToast: true
  })

  const canCreateChannel = canManage
  const canSendMessages = canManage || (user && user.roles?.includes('player'))

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    const cid = params.get('channelId')
    if (cid) setActiveId(Number(cid))
  }, [params])

  useEffect(() => {
    const current = params.get('channelId')
    if (activeId && current !== String(activeId)) {
      const next = new URLSearchParams(params)
      next.set('channelId', String(activeId))
      setSearchParams(next)
    }
    if (!activeId && current) {
      const next = new URLSearchParams(params)
      next.delete('channelId')
      setSearchParams(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId, { limit: 30 })
    
    if (isGuest) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }
    
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const since = latestAtRef.current
        const chunk = await messagesApi.list(activeId, { since })
        if (chunk.length) {
          const asc = [...chunk].reverse()
          setMessages(prev => {
            const next = [...prev, ...asc]
            latestAtRef.current = next.length ? next[next.length - 1].createdAt : since
            return next
          })
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
        }
      } catch { /* ignore */ }
    }, 8000)
    return () => { if (pollRef.current) window.clearInterval(pollRef.current) }
  }, [activeId, isGuest])

  useEffect(() => {
    latestAtRef.current = messages.length ? messages[messages.length - 1].createdAt : undefined
  }, [messages])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const onScroll = () => {
      const threshold = 24
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      setAtBottom(distance <= threshold)
    }
    onScroll()
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [listRef, messages])

  const loadOlder = async () => {
    if (!activeId || loadingOlder || messages.length === 0) return
    setLoadingOlder(true)
    const oldest = messages[0]
    const el = listRef.current
    const prevHeight = el ? el.scrollHeight : 0
    try {
      const chunk = await messagesApi.list(activeId, { before: oldest.createdAt, limit: 30 })
      const asc = [...chunk].reverse()
      setMessages(prev => [...asc, ...prev])
      setHasMore(chunk.length === 30)
      setTimeout(() => {
        if (el) {
          const newHeight = el.scrollHeight
          el.scrollTop = newHeight - prevHeight
        }
      }, 0)
    } catch {
    } finally {
      setLoadingOlder(false)
    }
  }

  const activeChannel = useMemo(() => channels.find(c => c.id === activeId) || null, [channels, activeId])

  const send = async () => {
    if (!activeId || !composer.trim() || isGuest) return
    setSending(true)
    const optimistic: Message = {
      id: Math.random(),
      channelId: activeId,
      content: composer,
      createdAt: new Date().toISOString(),
      authorId: undefined,
    }
    setMessages(prev => [...prev, optimistic])
    setComposer('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
    
    await sendMessage({ channelId: activeId, content: optimistic.content })
  }

  return {
    state: {
      channels, activeId, messages, sending, error, composer, newChannelOpen,
      newChannelName, hasMore, loadingOlder, atBottom, loading,
      bottomRef, listRef, activeChannel, canCreateChannel, canSendMessages
    },
    actions: {
      setActiveId, setComposer, setNewChannelOpen, setNewChannelName, setError,
      loadOlder, send, createChannel, loadMessages, loadChannels
    }
  }
}
