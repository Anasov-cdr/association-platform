import React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'

export function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const { i18n } = useTranslation()

  useEffect(() => {
    api.get('/documents').then(({ data }) => setDocuments(data)).catch(() => setDocuments([]))
  }, [])

  return (
    <div className="space-y-5">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">Отчеты и документы</h1>
        <p className="mt-3 max-w-3xl text-white/86">Документы, отчеты и материалы ассоциации выпускников.</p>
      </PageHero>
      {documents.map((item) => (
        <Card key={item.id} className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-moss">{item.category} · {new Date(item.publishedAt || item.date).toLocaleDateString()}</p>
            <h2 className="mt-2 text-2xl font-bold">{getLocalized(item.title, i18n.language)}</h2>
            {item.description && <p className="mt-2 text-ink/78">{getLocalized(item.description, i18n.language)}</p>}
          </div>
          <a href={toAbsoluteUploadUrl(item.fileUrl) || '#'} target="_blank" rel="noreferrer" className="rounded bg-gold px-5 py-3 font-bold text-ink">Скачать {item.fileType || item.type}</a>
        </Card>
      ))}
    </div>
  )
}
