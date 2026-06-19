import React from 'react'
import { Link } from 'react-router-dom'
import { Channel, Message } from '../../../types/communications'
import { useToast } from '../../../hooks/useToast'

export function ChannelSection({
  channels,
  activeId,
  setActiveId,
  messages,
  loading,
  hasMore,
  loadingOlder,
  loadOlder,
  listRef,
  bottomRef,
  atBottom,
  composer,
  setComposer,
  send,
  sending,
  canCreateChannel,
  canSendMessages,
  isGuest,
  activeChannel,
  setNewChannelOpen,
  setSearchParams,
  params
}: {
  channels: Channel[]
  activeId: number | null
  setActiveId: (id: number | null) => void
  messages: Message[]
  loading: boolean
  hasMore: boolean
  loadingOlder: boolean
  loadOlder: () => void
  listRef: React.RefObject<HTMLDivElement>
  bottomRef: React.RefObject<HTMLDivElement>
  atBottom: boolean
  composer: string
  setComposer: (val: string) => void
  send: () => void
  sending: boolean
  canCreateChannel: boolean
  canSendMessages: boolean
  isGuest: boolean
  activeChannel: Channel | null
  setNewChannelOpen: (open: boolean) => void
  setSearchParams: (params: any) => void
  params: any
}) {
  const toasts = useToast()

  return (
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
              onClick={() => {
                setActiveId(null)
                const next = new URLSearchParams(params)
                next.delete('channelId')
                setSearchParams(next)
              }} 
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
  )
}
