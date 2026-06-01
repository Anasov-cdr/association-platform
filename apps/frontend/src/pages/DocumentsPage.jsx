import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'

export function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const { t, i18n } = useTranslation()
  useSEO({ title: t('seo.documents.title'), description: t('seo.documents.desc') })

  useEffect(() => {
    api.get('/documents').then(({ data }) => setDocuments(data)).catch(() => setDocuments([]))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(documents.map((d) => d.category).filter(Boolean))
    return [...set].sort()
  }, [documents])

  const filtered = useMemo(() => {
    let list = documents
    if (category) list = list.filter((d) => d.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((d) => {
        const title = d.title
        if (typeof title === 'string') return title.toLowerCase().includes(q)
        if (typeof title === 'object') return Object.values(title).some((v) => String(v).toLowerCase().includes(q))
        return false
      })
    }
    return list
  }, [documents, search, category])

  return (
    <div className="space-y-5">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('documents.title')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">{t('documents.subtitle')}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('documents.search')}
            className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-moss"
          >
            <option value="">{t('documents.allCategories')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(search || category) && (
          <button onClick={() => { setSearch(''); setCategory('') }}
            className="mt-3 rounded border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
            {t('documents.resetFilters')}
          </button>
        )}
      </PageHero>

      {filtered.map((item) => (
        <Card key={item.id} className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-moss">
              {item.category}{item.category && (item.publishedAt || item.date) ? ' · ' : ''}
              {(item.publishedAt || item.date) ? new Date(item.publishedAt || item.date).toLocaleDateString('ru-RU') : ''}
            </p>
            <h2 className="mt-2 text-2xl font-bold">{getLocalized(item.title, i18n.language)}</h2>
            {item.description && <p className="mt-2 text-ink/78">{getLocalized(item.description, i18n.language)}</p>}
          </div>
          {item.fileUrl ? (
            <a href={toAbsoluteUploadUrl(item.fileUrl)} target="_blank" rel="noreferrer"
              className="shrink-0 rounded bg-gold px-5 py-3 font-bold text-ink hover:bg-gold/80 transition-colors">
              {t('common.download')} {item.fileType || item.type || ''}
            </a>
          ) : (
            <span className="shrink-0 rounded bg-ink/10 px-5 py-3 text-sm font-bold text-ink/40">{t('documents.fileUnavailable')}</span>
          )}
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card>
          <p className="text-ink/72">{search || category ? t('documents.noResults') : t('documents.empty')}</p>
        </Card>
      )}
    </div>
  )
}
