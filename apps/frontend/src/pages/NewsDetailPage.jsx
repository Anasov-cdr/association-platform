import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'

export function NewsDetailPage() {
  const { id, lang = 'ru' } = useParams()
  const { i18n } = useTranslation()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/news/${id}`).then(({ data }) => setPost(data)).catch(() => setError('Новость не найдена'))
  }, [id])

  if (error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!post) return <Card><p className="text-ink/72">Загрузка...</p></Card>

  return (
    <article className="space-y-6">
      <Link to={`/${lang}/news`} className="font-bold text-moss">← Все новости</Link>
      <PageHero className="overflow-hidden">
        {post.imageUrl && <img src={toAbsoluteUploadUrl(post.imageUrl)} alt={getLocalized(post.title, i18n.language)} className="mb-6 h-80 w-full rounded-md object-cover" />}
        <p className="text-sm font-semibold text-white/80">{new Date(post.publishedAt).toLocaleDateString('ru-RU')} · {post.authorName || 'БФЭТ'}</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-bold leading-tight">{getLocalized(post.title, i18n.language)}</h1>
        <div className="mt-6 whitespace-pre-line text-lg leading-8 text-white/86">{getLocalized(post.body, i18n.language)}</div>
      </PageHero>
    </article>
  )
}
