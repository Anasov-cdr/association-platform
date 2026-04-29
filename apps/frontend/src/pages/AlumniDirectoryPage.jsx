import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Card, PageHero } from '../components/UI'
import { api } from '../api'

function FilterInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
      />
    </div>
  )
}

export function AlumniDirectoryPage() {
  const { t } = useTranslation()
  const { lang = 'ru' } = useParams()
  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [city, setCity] = useState('')
  const [mentorOnly, setMentorOnly] = useState(false)
  const [employerOnly, setEmployerOnly] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { status: 'APPROVED' }
    if (query.trim()) params.query = query.trim()
    if (year) params.graduationYear = year
    if (specialty.trim()) params.specialty = specialty.trim()
    if (city.trim()) params.city = city.trim()
    if (mentorOnly) params.mentor = true
    if (employerOnly) params.employer = true

    api.get('/alumni', { params })
      .then(({ data }) => setAlumni(data))
      .catch(() => setAlumni([]))
      .finally(() => setLoading(false))
  }, [query, year, specialty, city, mentorOnly, employerOnly])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [load])

  const resetFilters = () => {
    setQuery('')
    setYear('')
    setSpecialty('')
    setCity('')
    setMentorOnly(false)
    setEmployerOnly(false)
  }

  const hasFilters = query || year || specialty || city || mentorOnly || employerOnly

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('directory.title')}</h1>

        {/* Строка поиска */}
        <div className="mt-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('directory.search')}
            className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
          />
        </div>

        {/* Фильтры */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FilterInput
            label={t('directory.filterYear')}
            value={year}
            onChange={setYear}
            type="number"
            placeholder="2020"
          />
          <FilterInput
            label={t('directory.filterSpecialty')}
            value={specialty}
            onChange={setSpecialty}
            placeholder="Финансы, IT..."
          />
          <FilterInput
            label={t('directory.filterCity')}
            value={city}
            onChange={setCity}
            placeholder="Бишкек..."
          />
        </div>

        {/* Чекбоксы */}
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-md bg-white/90 px-4 py-3 font-semibold text-ink hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={mentorOnly}
              onChange={(e) => setMentorOnly(e.target.checked)}
              className="h-4 w-4 accent-moss"
            />
            {t('directory.filterMentor')}
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md bg-white/90 px-4 py-3 font-semibold text-ink hover:bg-white transition-colors">
            <input
              type="checkbox"
              checked={employerOnly}
              onChange={(e) => setEmployerOnly(e.target.checked)}
              className="h-4 w-4 accent-moss"
            />
            {t('directory.filterEmployer')}
          </label>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="rounded-md border border-white/50 px-4 py-3 text-sm font-semibold text-white hover:bg-white/12 transition-colors"
            >
              {t('directory.resetFilters')}
            </button>
          )}
        </div>

        {/* Счётчик */}
        {!loading && alumni.length > 0 && (
          <p className="mt-3 text-sm text-white/76">
            {t('directory.results')}: <b>{alumni.length}</b>
          </p>
        )}
      </PageHero>

      {/* Список */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <Card><p className="text-ink/72">{t('common.loading')}</p></Card>
        )}

        {!loading && alumni.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <div className="flex items-center gap-4">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.fullName}
                  className="h-16 w-16 shrink-0 rounded-md object-cover bg-[#eefbfc]"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-moss text-2xl font-bold text-white">
                  {item.fullName[0]}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold">{item.fullName}</h2>
                <p className="text-sm text-ink/78">{item.graduationYear} · {item.specialty}</p>
              </div>
            </div>

            <p className="mt-3 text-sm text-ink/78">{[item.city, item.country].filter(Boolean).join(', ')}</p>
            {(item.position || item.company) && (
              <div className="mt-2">
                {item.position && <p className="font-semibold text-sm">{item.position}</p>}
                {item.company && <p className="text-sm text-ink/72">{item.company}</p>}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {item.isMentor && <Badge>{t('profile.mentor')}</Badge>}
              {item.canHelpStudents && <Badge tone="gold">{t('profile.helpStudents')}</Badge>}
              {item.isSponsor && <Badge tone="gold">{t('profile.sponsor')}</Badge>}
              {!item.isMentor && !item.canHelpStudents && !item.isSponsor && (
                <Badge tone="clay">{t('profile.graduate')}</Badge>
              )}
            </div>

            <div className="mt-auto pt-5">
              <Link
                to={`/${lang}/alumni/${item.id}`}
                className="inline-flex rounded bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-moss/90 transition-colors"
              >
                {t('directory.profile')}
              </Link>
            </div>
          </Card>
        ))}

        {!loading && alumni.length === 0 && (
          <Card>
            <p className="text-ink/72">{t('directory.empty')}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
