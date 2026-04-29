import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'

export function NewsPage() {
  const [news, setNews] = useState([])
  const { i18n } = useTranslation()
  const { lang = 'ru' } = useParams()

  useEffect(() => {
    api.get('/news').then(({ data }) => setNews(data)).catch(() => setNews([]))
  }, [])

  return (
    <div className="space-y-5">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">Новости</h1>
        <p className="mt-3 max-w-3xl text-white/86">Официальные новости ассоциации, колледжа и сообщества выпускников.</p>
      </PageHero>
      {news.map((item) => (
        <Card key={item.id}>
          {item.imageUrl && <img src={toAbsoluteUploadUrl(item.imageUrl)} alt={getLocalized(item.title, i18n.language)} className="mb-5 h-56 w-full rounded-md object-cover" />}
          <p className="text-sm font-semibold text-moss">{new Date(item.publishedAt || item.date).toLocaleDateString('ru-RU')} · {item.authorName || item.author || 'Ассоциация'}</p>
          <h2 className="mt-2 text-2xl font-bold">{getLocalized(item.title, i18n.language)}</h2>
          <p className="mt-3 text-ink/82">{getLocalized(item.body || item.text, i18n.language)}</p>
          <Link to={`/${lang}/news/${item.slug || item.id}`} className="mt-5 inline-flex rounded bg-moss px-5 py-3 text-sm font-bold text-white">Подробнее</Link>
        </Card>
      ))}
      {news.length === 0 && <Card><p className="text-ink/72">Новости пока не добавлены.</p></Card>}
    </div>
  )
}
