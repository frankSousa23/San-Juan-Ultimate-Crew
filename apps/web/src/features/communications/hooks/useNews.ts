import { useState, useEffect } from 'react'
import { newsApi } from '../../../lib/api'
import { NewsPost } from '../../../types/news'
import { useToast } from '../../../hooks/useToast'
import { useApi } from '../../../hooks/useApi'

export function useNews(tab: string) {
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([])
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null)
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null)
  const [newsCategory, setNewsCategory] = useState<string>('all')
  const [newsPage, setNewsPage] = useState(1)
  const [newsTotal, setNewsTotal] = useState(0)
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => void } | null>(null)
  
  const toasts = useToast()

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

  return {
    state: {
      newsPosts, selectedPost, newsLoading, newsError, showNewsForm,
      editingPost, newsCategory, newsPage, newsTotal, confirmState
    },
    actions: {
      setSelectedPost, setNewsError, setShowNewsForm, setEditingPost,
      setNewsCategory, setNewsPage, setConfirmState, loadNews,
      createNewsPost, updateNewsPost, deleteNewsPost
    }
  }
}
