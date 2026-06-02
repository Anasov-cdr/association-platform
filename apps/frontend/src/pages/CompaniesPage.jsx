import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'

function CompanyModal({ company, onClose, lang }) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get(`/companies/${company.id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(company))
  }, [company.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {company.logoUrl ? (
                <img src={toAbsoluteUploadUrl(company.logoUrl)} alt={company.name} className="h-16 w-16 rounded-md object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-moss/5 text-2xl font-bold text-ink/40">
                  {company.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{company.name}</h2>
                <p className="text-sm text-ink/72">{[company.city, company.country].filter(Boolean).join(', ')}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded bg-moss/5 px-3 py-1 text-sm font-bold hover:bg-moss/10 transition-colors">
              ✕
            </button>
          </div>

          {company.description && (
            <p className="mt-5 text-ink/75 leading-7">{company.description}</p>
          )}

          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded bg-moss/10 px-4 py-2 text-sm font-semibold text-moss hover:bg-moss/20 transition-colors">
              🌐 {t('companies.website')}
            </a>
          )}

          {/* Выпускники в компании */}
          <div className="mt-6">
            <h3 className="font-bold text-lg">{t('companies.alumni')}</h3>
            {!detail ? (
              <p className="mt-3 text-ink/72">{t('common.loading')}</p>
            ) : (detail.alumni?.length > 0) ? (
              <div className="mt-3 space-y-3">
                {detail.alumni.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-md bg-[#eefbfc] px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-moss text-sm font-bold text-white">
                      {a.fullName[0]}
                    </div>
                    <div>
                      <Link to={`/${lang}/alumni/${a.id}`} className="font-semibold hover:text-moss transition-colors" onClick={onClose}>
                        {a.fullName}
                      </Link>
                      {a.position && <p className="text-xs text-ink/72">{a.position}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-ink/72">{t('companies.noAlumni')}</p>
            )}
          </div>

          {/* Вакансии */}
          {detail?.jobs?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-lg">Открытые вакансии</h3>
              <div className="mt-3 space-y-2">
                {detail.jobs.map((job) => (
                  <Link key={job.id} to={`/${lang}/jobs/${job.id}`}
                    className="block rounded-md border border-ink/10 bg-white px-4 py-3 hover:border-moss/30 transition-colors" onClick={onClose}>
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-ink/72">{job.type} · {job.format}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CompaniesPage() {
  const { t } = useTranslation()
  useSEO({ title: t('seo.companies.title'), description: t('seo.companies.desc') })
  const { lang = 'ru' } = useParams()
  const [companies, setCompanies] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/companies')
      .then(({ data }) => setCompanies(data))
      .catch(() => setCompanies([]))
  }, [])

  const filtered = search.trim()
    ? companies.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : companies

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('companies.title')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">{t('companies.subtitle')}</p>
        <div className="mt-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('companies.search')}
            className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss"
          />
        </div>
      </PageHero>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => (
          <Card key={company.id} className="flex flex-col">
            <div className="flex items-center gap-4">
              {company.logoUrl ? (
                <img src={toAbsoluteUploadUrl(company.logoUrl)} alt={company.name} className="h-16 w-16 rounded-md object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-moss/5 text-2xl font-bold text-ink/40">
                  {company.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-xl leading-tight">{company.name}</h2>
                <p className="text-sm text-ink/72">{[company.city, company.country].filter(Boolean).join(', ')}</p>
              </div>
            </div>

            {company.description && (
              <p className="mt-4 text-ink/75 flex-1 text-sm leading-6 line-clamp-3">
                {company.description}
              </p>
            )}

            <div className="mt-5 border-t border-ink/10 pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3 text-sm">
                <span className="rounded bg-moss/5 px-3 py-1 font-semibold">
                  {t('companies.jobs')}: {company._count?.jobs || 0}
                </span>
              </div>
              <button
                onClick={() => setSelected(company)}
                className="rounded bg-moss px-4 py-2 text-sm font-bold text-white hover:bg-moss/90 transition-colors"
              >
                {t('common.view')}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><p className="text-ink/72">{search ? t('companies.noResults') : t('common.noData')}</p></Card>
      )}

      {selected && (
        <CompanyModal company={selected} onClose={() => setSelected(null)} lang={lang} />
      )}
    </div>
  )
}
