import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { channelsApi, messagesApi, newsApi } from '../lib/api'
import { Channel, Message } from '../types/communications'
import { NewsPost, NewsPostFile } from '../types/news'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'

export default function Communications() {
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission('communications:manage')
  
  const [tab, setTab] = useState<'channels' | 'news'>('channels')
  
  // Channels state
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
  
  // News state
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([])
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null)
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null)
  const [newsCategory, setNewsCategory] = useState<string>('all')
  const [newsPage, setNewsPage] = useState(1)
  const [newsTotal, setNewsTotal] = useState(0)
  
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
  const canCreateChannel = canManage
  const canSendMessages = canManage
  const isGuest = !canManage && !user?.roles?.includes('player')

  // News API hooks
  const { execute: loadNews } = useApi(
    () => newsApi.list({ published: true, limit: 20, offset: (newsPage - 1) * 20 }),
    {
      onSuccess: (data) => {
        setNewsPosts(data.items)
        setNewsTotal(data.total)
        setNewsLoading(false)
      },
      onError: () => {
        setNewsError('No se pudo cargar las noticias')
        setNewsLoading(false)
      },
      showErrorToast: true
    }
  )

  const { execute: createNewsPost } = useApi(newsApi.create, {
    onSuccess: () => {
      loadNews()
      setShowNewsForm(false)
      toasts.success('Noticia publicada exitosamente')
    },
    showErrorToast: true
  })

  const { execute: updateNewsPost } = useApi(
    (id: number, data: any) => newsApi.update(id, data),
    {
      onSuccess: () => {
        loadNews()
        setEditingPost(null)
        toasts.success('Noticia actualizada exitosamente')
      },
      showErrorToast: true
    }
  )

  const { execute: deleteNewsPost } = useApi(
    (id: number) => newsApi.remove(id),
    {
      onSuccess: () => {
        loadNews()
        setSelectedPost(null)
        toasts.success('Noticia eliminada exitosamente')
      },
      showErrorToast: true
    }
  )

  useEffect(() => {
    if (tab === 'news') {
      loadNews()
    }
  }, [tab, newsPage, newsCategory])

  useEffect(() => {
    const tabParam = params.get('tab')
    if (tabParam === 'news' || tabParam === 'channels') {
      setTab(tabParam)
    }
  }, [params])

  useEffect(() => {
    const next = new URLSearchParams(params)
    next.set('tab', tab)
    setSearchParams(next)
  }, [tab])

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Comunicaciones</h2>
        {isGuest && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-3 py-2 text-xs sm:text-sm">
            <span className="font-medium">Modo de solo lectura:</span> Puedes ver los canales y mensajes, pero necesitas ser jugador o administrador para participar.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setTab('channels')}
          className={`px-4 py-2 font-medium transition-colors ${
            tab === 'channels'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          💬 Canales
        </button>
        <button
          onClick={() => setTab('news')}
          className={`px-4 py-2 font-medium transition-colors ${
            tab === 'news'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📰 Noticias
        </button>
      </div>
      
      {error && tab === 'channels' && (
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

      {newsError && tab === 'news' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 mb-3 flex items-start justify-between">
          <div className="pr-3">{newsError}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => { 
              setNewsError(null)
              loadNews()
            }}>Reintentar</button>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setNewsError(null)}>Ocultar</button>
          </div>
        </div>
      )}
      
      {tab === 'channels' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[400px] sm:min-h-[600px]">
        {/* Channels list */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-lg shadow p-3 flex flex-col min-h-[300px] sm:min-h-0">
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
              <div className="flex flex-col sm:flex-row gap-2">
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
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                />
                <button 
                  onClick={send} 
                  disabled={!activeId || sending || !composer.trim()} 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors whitespace-nowrap text-sm sm:text-base"
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
      )}

      {tab === 'news' && (
        <NewsSection
          posts={newsPosts}
          loading={newsLoading}
          error={newsError}
          canManage={canManage}
          selectedPost={selectedPost}
          onSelectPost={setSelectedPost}
          onRefresh={loadNews}
          onCreate={() => setShowNewsForm(true)}
          onEdit={setEditingPost}
          onDelete={(id) => {
            if (confirm('¿Eliminar esta noticia?')) {
              deleteNewsPost(id)
            }
          }}
          category={newsCategory}
          onCategoryChange={setNewsCategory}
          page={newsPage}
          total={newsTotal}
          onPageChange={setNewsPage}
        />
      )}

      {/* News Form Modal */}
      {(showNewsForm || editingPost) && canManage && (
        <NewsPostForm
          post={editingPost}
          onSave={(data) => {
            if (editingPost) {
              updateNewsPost(editingPost.id, data)
            } else {
              createNewsPost(data)
            }
          }}
          onCancel={() => {
            setShowNewsForm(false)
            setEditingPost(null)
          }}
        />
      )}

      {/* News Post Detail Modal */}
      {selectedPost && (
        <NewsPostDetail
          post={selectedPost}
          canManage={canManage}
          onClose={() => setSelectedPost(null)}
          onEdit={() => {
            setSelectedPost(null)
            setEditingPost(selectedPost)
          }}
          onDelete={() => {
            if (confirm('¿Eliminar esta noticia?')) {
              deleteNewsPost(selectedPost.id)
              setSelectedPost(null)
            }
          }}
        />
      )}

      {/* Create Channel Modal - only for admin and player */}
      {canCreateChannel && newChannelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setNewChannelOpen(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
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

// News Section Component
function NewsSection({
  posts,
  loading,
  error,
  canManage,
  selectedPost,
  onSelectPost,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  category,
  onCategoryChange,
  page,
  total,
  onPageChange,
}: {
  posts: NewsPost[]
  loading: boolean
  error: string | null
  canManage: boolean
  selectedPost: NewsPost | null
  onSelectPost: (post: NewsPost | null) => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (post: NewsPost) => void
  onDelete: (id: number) => void
  category: string
  onCategoryChange: (cat: string) => void
  page: number
  total: number
  onPageChange: (page: number) => void
}) {
  const categories = useMemo(() => {
    const cats = new Set<string>()
    posts.forEach(p => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (category === 'all') return posts
    return posts.filter(p => p.category === category)
  }, [posts, category])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex-1 flex flex-col min-h-[400px] sm:min-h-[600px]">
      <div className="bg-white rounded-lg shadow flex flex-col flex-1">
        <div className="border-b px-4 py-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-semibold text-gray-800">Noticias y Anuncios</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {canManage && (
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                + Nueva Noticia
              </button>
            )}
            <button
              onClick={onRefresh}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-gray-500 text-center py-8">Cargando noticias...</div>}
          {error && <div className="text-red-600 text-center py-4">{error}</div>}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              {category === 'all' ? 'No hay noticias publicadas' : `No hay noticias en la categoría "${category}"`}
            </div>
          )}
          {!loading && !error && filteredPosts.length > 0 && (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    post.isPinned ? 'bg-yellow-50 border-yellow-300' : ''
                  }`}
                  onClick={() => onSelectPost(post)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && (
                          <span className="text-yellow-600 text-sm">📌</span>
                        )}
                        <h3 className="font-semibold text-gray-900">{post.title}</h3>
                        {post.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {post.category}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {post.content}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.author && (
                          <span>Por #{post.author.number} {post.author.name}</span>
                        )}
                        <span>{new Date(post.createdAt).toLocaleDateString('es-ES')}</span>
                        <span>{post.views} vistas</span>
                        {post.files && post.files.length > 0 && (
                          <span>📎 {post.files.length} archivo{post.files.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEdit(post)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(post.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// News Post Form Component
function NewsPostForm({
  post,
  onSave,
  onCancel,
}: {
  post: NewsPost | null
  onSave: (data: { title: string; content: string; category?: string; isPinned?: boolean; isPublished?: boolean }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [category, setCategory] = useState(post?.category || '')
  const [isPinned, setIsPinned] = useState(post?.isPinned || false)
  const [isPublished, setIsPublished] = useState(post?.isPublished !== false)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<NewsPostFile[]>(post?.files || [])
  const toasts = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toasts.error('Título y contenido son requeridos')
      return
    }
    onSave({ title: title.trim(), content: content.trim(), category: category.trim() || undefined, isPinned, isPublished })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!post?.id) {
      setUploadingFiles(prev => [...prev, ...files])
      return
    }

    for (const file of files) {
      try {
        const uploaded = await newsApi.uploadFile(post.id, file)
        setUploadedFiles(prev => [...prev, uploaded])
        toasts.success(`Archivo "${file.name}" subido exitosamente`)
      } catch (error: any) {
        toasts.error(`Error al subir "${file.name}": ${error?.response?.data?.error || 'Error desconocido'}`)
      }
    }
  }

  const handleFileDelete = async (fileId: number) => {
    if (!post?.id) return
    if (!confirm('¿Eliminar este archivo?')) return
    try {
      await newsApi.deleteFile(post.id, fileId)
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      toasts.success('Archivo eliminado exitosamente')
    } catch (error: any) {
      toasts.error(error?.response?.data?.error || 'Error al eliminar archivo')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
          <div className="text-lg font-bold">{post ? 'Editar' : 'Nueva'} Noticia</div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
              placeholder="Título de la noticia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={10}
              required
              placeholder="Contenido de la noticia (puedes usar Markdown)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: Anuncios, Eventos, General"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Fijar en la parte superior</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Publicar inmediatamente</span>
              </label>
            </div>
          </div>
          {post && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivos Adjuntos</label>
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.originalName}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => newsApi.downloadFile(post.id, file.id, file.originalName)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              {post ? 'Actualizar' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// News Post Detail Component
function NewsPostDetail({
  post,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: {
  post: NewsPost
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold flex items-center gap-2">
              {post.isPinned && <span>📌</span>}
              {post.title}
            </div>
            <div className="text-sm opacity-90 mt-1">
              {post.author && `Por #${post.author.number} ${post.author.name}`} • {new Date(post.createdAt).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                Editar
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {post.category && (
            <div className="mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {post.category}
              </span>
            </div>
          )}
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-700">{post.content}</div>
          </div>
          {post.files && post.files.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Archivos Adjuntos</h4>
              <div className="space-y-2">
                {post.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <div className="font-medium text-gray-800">{file.originalName}</div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.mimeType}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => newsApi.downloadFile(post.id, file.id, file.originalName)}
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 text-sm text-gray-500">
            {post.views} vista{post.views !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="p-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
