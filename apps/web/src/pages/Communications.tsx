import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'

import { useChannels } from '../features/communications/hooks/useChannels'
import { useNews } from '../features/communications/hooks/useNews'

import { ChannelSection } from '../features/communications/components/ChannelSection'
import { NewsSection } from '../features/communications/components/NewsSection'
import { NewsPostForm } from '../features/communications/components/NewsPostForm'
import { NewsPostDetail } from '../features/communications/components/NewsPostDetail'

export default function Communications() {
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission('communications:manage')
  const isGuest = !canManage && !user?.roles?.includes('player')
  
  const [params, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<'channels' | 'news'>('channels')

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

  const { state: channelState, actions: channelActions } = useChannels(user, canManage, isGuest)
  const { state: newsState, actions: newsActions } = useNews(tab)

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
      
      {channelState.error && tab === 'channels' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 mb-3 flex items-start justify-between">
          <div className="pr-3">{channelState.error}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => { 
              channelActions.setError(null)
              if (channelState.activeId) { 
                channelActions.loadMessages(channelState.activeId, { limit: 30 })
              } else { 
                channelActions.loadChannels()
              }
            }}>Reintentar</button>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => channelActions.setError(null)}>Ocultar</button>
          </div>
        </div>
      )}

      {newsState.newsError && tab === 'news' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 mb-3 flex items-start justify-between">
          <div className="pr-3">{newsState.newsError}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => { 
              newsActions.setNewsError(null)
              newsActions.loadNews()
            }}>Reintentar</button>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => newsActions.setNewsError(null)}>Ocultar</button>
          </div>
        </div>
      )}
      
      {tab === 'channels' && (
        <ChannelSection
          channels={channelState.channels}
          activeId={channelState.activeId}
          setActiveId={channelActions.setActiveId}
          messages={channelState.messages}
          loading={channelState.loading}
          hasMore={channelState.hasMore}
          loadingOlder={channelState.loadingOlder}
          loadOlder={channelActions.loadOlder}
          listRef={channelState.listRef}
          bottomRef={channelState.bottomRef}
          atBottom={channelState.atBottom}
          composer={channelState.composer}
          setComposer={channelActions.setComposer}
          send={channelActions.send}
          sending={channelState.sending}
          canCreateChannel={channelState.canCreateChannel}
          canSendMessages={channelState.canSendMessages}
          isGuest={isGuest}
          activeChannel={channelState.activeChannel}
          setNewChannelOpen={channelActions.setNewChannelOpen}
          setSearchParams={setSearchParams}
          params={params}
        />
      )}

      {tab === 'news' && (
        <NewsSection
          posts={newsState.newsPosts}
          loading={newsState.newsLoading}
          error={newsState.newsError}
          canManage={canManage}
          selectedPost={newsState.selectedPost}
          onSelectPost={newsActions.setSelectedPost}
          onRefresh={newsActions.loadNews}
          onCreate={() => newsActions.setShowNewsForm(true)}
          onEdit={newsActions.setEditingPost}
          onDelete={(id) => {
            newsActions.setConfirmState({
              message: '¿Eliminar esta noticia?',
              onYes: () => newsActions.deleteNewsPost(id)
            })
          }}
          category={newsState.newsCategory}
          onCategoryChange={newsActions.setNewsCategory}
          page={newsState.newsPage}
          total={newsState.newsTotal}
          onPageChange={newsActions.setNewsPage}
        />
      )}

      {/* News Form Modal */}
      {(newsState.showNewsForm || newsState.editingPost) && canManage && (
        <NewsPostForm
          post={newsState.editingPost}
          onSave={(data) => {
            if (newsState.editingPost) {
              newsActions.updateNewsPost(newsState.editingPost.id, data)
            } else {
              newsActions.createNewsPost(data)
            }
          }}
          onCancel={() => {
            newsActions.setShowNewsForm(false)
            newsActions.setEditingPost(null)
          }}
        />
      )}

      {/* News Post Detail Modal */}
      {newsState.selectedPost && (
        <NewsPostDetail
          post={newsState.selectedPost}
          canManage={canManage}
          onClose={() => newsActions.setSelectedPost(null)}
          onEdit={() => {
            newsActions.setSelectedPost(null)
            newsActions.setEditingPost(newsState.selectedPost)
          }}
          onDelete={() => {
            newsActions.setConfirmState({
              message: '¿Eliminar esta noticia?',
              onYes: () => {
                newsActions.deleteNewsPost(newsState.selectedPost!.id)
                newsActions.setSelectedPost(null)
              }
            })
          }}
        />
      )}

      {/* Create Channel Modal - only for admin and player */}
      {channelState.canCreateChannel && channelState.newChannelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => channelActions.setNewChannelOpen(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
              <div className="text-lg font-bold">Crear Canal</div>
            </div>
            <div className="p-4 space-y-3">
              <input
                autoFocus
                value={channelState.newChannelName}
                onChange={e => channelActions.setNewChannelName(e.target.value)}
                placeholder="Nombre del canal"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={e => {
                  if (e.key === 'Enter' && channelState.newChannelName.trim()) {
                    channelActions.createChannel({ name: channelState.newChannelName.trim() })
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg disabled:opacity-60 hover:bg-purple-700 transition-colors"
                  disabled={!channelState.newChannelName.trim()}
                  onClick={() => channelActions.createChannel({ name: channelState.newChannelName.trim() })}
                >
                  Crear
                </button>
                <button 
                  className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors" 
                  onClick={() => channelActions.setNewChannelOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {newsState.confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={newsState.confirmState.message}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          onCancel={() => newsActions.setConfirmState(null)}
          onConfirm={async () => { await newsState.confirmState!.onYes(); newsActions.setConfirmState(null) }}
        />
      )}
    </div>
  )
}
