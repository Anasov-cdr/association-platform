import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'

export function NewsPage() {
  const [news, setNews] = useState([])
  const [search, setSearch] = useState('')
  const { t, i18n } = useTranslation()
  useSEO({ title: t('seo.news.title'), description: t('seo.news.desc') })
  const { lang = 'ru' } = useParams()

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {}
      if (search.trim()) params.query = search.trim()
      api.get('/news', { params }).then(({ data }) => setNews(data)).catch(() => setNews([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="space-y-5">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('news.title')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">{t('news.subtitle')}</p>
        <div className="mt-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('news.search')}
            className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss"
          />
        </div>
      </PageHero>

      {news.map((item) => (
        <Card key={item.id}>
          {item.imageUrl && (
            <img
              src={toAbsoluteUploadUrl(item.imageUrl)}
              alt={getLocalized(item.title, i18n.language)}
              className="mb-5 w-full rounded-md object-contain"
            />
          )}
          <p className="text-sm font-semibold text-moss">
            {new Date(item.publishedAt || item.date).toLocaleDateString('ru-RU')} · {item.authorName || item.author || 'Ассоциация'}
          </p>
          <h2 className="mt-2 text-2xl font-bold">{getLocalized(item.title, i18n.language)}</h2>
          <p className="mt-3 line-clamp-3 text-ink/82">{getLocalized(item.body || item.text, i18n.language)}</p>
          <Link to={`/${lang}/news/${item.slug || item.id}`} className="mt-5 inline-flex rounded bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-moss/80 transition-colors">
            {t('common.learnMore')}
          </Link>
        </Card>
      ))}
      {news.length === 0 && (
        <Card>
          <p className="text-ink/72">{search ? t('news.noResults') : t('news.empty')}</p>
        </Card>
      )}
    </div>
  )
}
