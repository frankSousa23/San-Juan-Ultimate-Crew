import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { channelsApi, messagesApi } from '../lib/api'
import { Channel, Message } from '../types/communications'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'

export default function Communications() {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const isPlayer = hasRole('player')
  const isGuest = !isAdmin && !isPlayer
  
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

  // API hooks
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

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    // deep link: ?channelId=123
    const cid = params.get('channelId')
    if (cid) setActiveId(Number(cid))
  }, [params])

  // Keep URL param in sync when active channel changes
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
    
    // Only poll for new messages if user can send messages (not guest)
    if (isGuest) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }
    
    // polling new messages
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const since = latestAtRef.current
        const chunk = await messagesApi.list(activeId, { since })
        if (chunk.length) {
          // chunk is desc order; append reversed
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
      // ignore
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

  // Guest users can only view, not interact
  const canCreateChannel = isAdmin || isPlayer
  const canSendMessages = isAdmin || isPlayer

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Comunicaciones</h2>
        {isGuest && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-3 py-2 text-sm">
            <span className="font-medium">Modo de solo lectura:</span> Puedes ver los canales y mensajes, pero necesitas ser jugador o administrador para participar.
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 mb-3 flex items-start justify-between">
          <div className="pr-3">{error}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => { 
              setError(null)
              if (activeId) { 
                loadMessages(activeId, { limit: 30 })
              } else { 
                loadChannels()
              }
            }}>Reintentar</button>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setError(null)}>Ocultar</button>
          </div>
        </div>
      )}
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[600px]">
        {/* Channels list */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-lg shadow p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-700">Canales</div>
            <div className="flex items-center gap-3">
              {canCreateChannel && (
                <button 
                  onClick={() => setNewChannelOpen(true)} 
                  className="text-sm text-purple-700 hover:underline font-medium"
                >
                  + Nuevo
                </button>
              )}
              {!canCreateChannel && (
                <span className="text-xs text-gray-400">Solo lectura</span>
              )}
              <button 
                onClick={() => setActiveId(null)} 
                className="text-xs text-gray-600 hover:underline" 
                title="Limpiar selección"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="overflow-auto divide-y flex-1">
            {channels.map(c => (
              <button 
                key={c.id} 
                className={`w-full text-left px-2 py-2 hover:bg-gray-50 transition-colors ${
                  activeId === c.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''
                }`} 
                onClick={() => { 
                  setActiveId(c.id)
                  const next = new URLSearchParams(params)
                  next.set('channelId', String(c.id))
                  setSearchParams(next)
                }}
              >
                <div className="font-medium text-gray-800 truncate">{c.name}</div>
                <div className="text-xs text-gray-500">{c._count?.messages ?? 0} mensajes</div>
              </button>
            ))}
            {channels.length === 0 && (
              <div className="text-gray-500 text-sm p-2">
                {canCreateChannel ? 'No hay canales. Crea uno nuevo para comenzar.' : 'No hay canales disponibles.'}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="col-span-1 md:col-span-9 bg-white rounded-lg shadow flex flex-col">
          <div className="border-b px-4 py-2 flex items-center justify-between bg-gray-50">
            <div className="font-semibold text-gray-800">
              {activeChannel?.name || 'Selecciona un canal'}
            </div>
            {activeId && (
              <div className="flex items-center gap-2">
                {isGuest && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Solo lectura
                  </span>
                )}
                <button
                  className="text-xs text-gray-600 hover:underline"
                  onClick={() => {
                    try {
                      const url = new URL(window.location.href)
                      url.searchParams.set('channelId', String(activeId))
                      navigator.clipboard.writeText(url.toString())
                      toasts.info('Enlace copiado')
                    } catch { /* ignore */ }
                  }}
                >
                  Copiar enlace
                </button>
              </div>
            )}
          </div>
          
          <div ref={listRef} className="flex-1 overflow-auto px-4 py-3 space-y-2 relative bg-gray-50">
            {hasMore && canSendMessages && (
              <div className="flex justify-center">
                <button 
                  disabled={loadingOlder} 
                  onClick={loadOlder} 
                  className="text-xs text-gray-600 hover:underline disabled:opacity-60"
                >
                  {loadingOlder ? 'Cargando...' : 'Cargar mensajes anteriores'}
                </button>
              </div>
            )}
            {loading && <div className="text-gray-500 text-center py-4">Cargando...</div>}
            {!loading && messages.length === 0 && activeChannel && (
              <div className="text-gray-500 text-center py-4">Sin mensajes aún.</div>
            )}
            {!loading && !activeChannel && (
              <div className="text-gray-500 text-center py-4">
                {canCreateChannel 
                  ? 'Selecciona un canal de la lista para ver los mensajes o crea uno nuevo.'
                  : 'Selecciona un canal de la lista para ver los mensajes.'}
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className="flex">
                <div className="bg-white border border-gray-200 text-gray-800 px-3 py-2 rounded-lg max-w-[80%] shadow-sm">
                  {m.content}
                  {m.createdAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
            {!atBottom && messages.length > 0 && (
              <button
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute right-4 bottom-4 bg-purple-600 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
              >
                Ir al final
              </button>
            )}
          </div>
          
          {/* Message composer - only visible if user can send messages */}
          {canSendMessages && (
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <input
                  value={composer}
                  onChange={e => setComposer(e.target.value)}
                  onKeyDown={e => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault()
                      send()
                    } 
                  }}
                  disabled={!activeId || sending}
                  placeholder={activeId ? 'Escribe un mensaje... (Enter para enviar)' : 'Selecciona un canal para escribir'}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={send} 
                  disabled={!activeId || sending || !composer.trim()} 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}
          
          {/* Guest message composer replacement */}
          {isGuest && activeId && (
            <div className="border-t p-3 bg-gray-50">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-3 py-2 text-sm text-center">
                <span className="font-medium">Solo lectura:</span> Necesitas ser jugador o administrador para enviar mensajes.
                <div className="mt-1">
                  <Link to="/perfil" className="text-blue-600 hover:underline">Solicita acceso de jugador en tu perfil</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Modal - only for admin and player */}
      {canCreateChannel && newChannelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setNewChannelOpen(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
              <div className="text-lg font-bold">Crear Canal</div>
            </div>
            <div className="p-4 space-y-3">
              <input
                autoFocus
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="Nombre del canal"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newChannelName.trim()) {
                    createChannel({ name: newChannelName.trim() })
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg disabled:opacity-60 hover:bg-purple-700 transition-colors"
                  disabled={!newChannelName.trim()}
                  onClick={() => createChannel({ name: newChannelName.trim() })}
                >
                  Crear
                </button>
                <button 
                  className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors" 
                  onClick={() => setNewChannelOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
