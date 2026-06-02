import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Card, PageHero } from '../components/UI'
import { api } from '../api'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'
import { filterPublicAlumniProfiles } from '../alumniVisibility'

function FilterInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss"
      />
    </div>
  )
}

export function AlumniDirectoryPage() {
  const { t } = useTranslation()
  useSEO({ title: t('seo.alumni.title'), description: t('seo.alumni.desc') })
  const { lang = 'ru' } = useParams()
  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [city, setCity] = useState('')
  const [mentorOnly, setMentorOnly] = useState(false)
  const [employerOnly, setEmployerOnly] = useState(false)
  const [sortBy, setSortBy] = useState('featured')

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
      .then(({ data }) => setAlumni(filterPublicAlumniProfiles(data)))
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
    setSortBy('featured')
  }

  const hasFilters = query || year || specialty || city || mentorOnly || employerOnly || sortBy !== 'featured'

  const sortedAlumni = [...alumni].sort((a, b) => {
    if (sortBy === 'featured') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
    if (sortBy === 'year_desc') return (b.graduationYear || 0) - (a.graduationYear || 0)
    if (sortBy === 'year_asc') return (a.graduationYear || 0) - (b.graduationYear || 0)
    if (sortBy === 'name_asc') return (a.fullName || '').localeCompare(b.fullName || '', 'ru')
    if (sortBy === 'name_desc') return (b.fullName || '').localeCompare(a.fullName || '', 'ru')
    return 0
  })

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
            className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss"
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
            placeholder={t('directory.specialtyPlaceholder')}
          />
          <FilterInput
            label={t('directory.filterCity')}
            value={city}
            onChange={setCity}
            placeholder={t('directory.cityPlaceholder')}
          />
        </div>

        {/* Сортировка + чекбоксы */}
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-moss"
          >
            <option value="featured">⭐ {t('directory.sortFeatured')}</option>
            <option value="year_desc">{t('directory.sortYearDesc')}</option>
            <option value="year_asc">{t('directory.sortYearAsc')}</option>
            <option value="name_asc">{t('directory.sortNameAsc')}</option>
            <option value="name_desc">{t('directory.sortNameDesc')}</option>
          </select>
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

        {!loading && sortedAlumni.map((item) => (
          <div key={item.id} className={`relative flex flex-col rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(8,121,168,0.18)] ${item.isFeatured ? 'ring-amber-400/50' : 'ring-ink/[0.06]'}`}>

            {/* Тонкая цветная полоса сверху */}
            <div className={`h-10 rounded-t-2xl shrink-0 relative ${item.isFeatured ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-[#0879a8] to-[#3bc4c7]'}`}>
              {item.isFeatured && (
                <span className="absolute right-3 top-2 rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-black text-amber-900">⭐ {t('directory.featured')}</span>
              )}
            </div>

            {/* Аватар по центру, под полосой, над именем */}
            <div className="flex justify-center pt-4">
              {item.photoUrl ? (
                <img
                  src={toAbsoluteUploadUrl(item.photoUrl)}
                  alt={item.fullName}
                  className={`h-28 w-28 rounded-full object-cover ring-4 shadow-lg ${item.isFeatured ? 'ring-amber-400' : 'ring-[#3bc4c7]/60'}`}
                />
              ) : (
                <div className={`flex h-28 w-28 items-center justify-center rounded-full text-3xl font-black text-white ring-4 shadow-lg ${item.isFeatured ? 'ring-amber-400 bg-gradient-to-br from-amber-400 to-amber-600' : 'ring-[#3bc4c7]/60 bg-gradient-to-br from-[#0879a8] to-[#3bc4c7]'}`}>
                  {item.fullName[0]}
                </div>
              )}
            </div>

            {/* Контент */}
            <div className="flex flex-1 flex-col px-5 pb-5 pt-3 text-center">
              <h2 className="text-lg font-bold leading-tight text-ink">{item.fullName}</h2>
              <p className="mt-0.5 text-xs text-ink/50">{item.graduationYear}{item.specialty ? ` · ${item.specialty}` : ''}</p>

              {(item.featuredTitle || item.position || item.company) && (
                <div className="mt-3 rounded-xl bg-[#f0fbfd] px-3 py-2.5">
                  {(item.featuredTitle || item.position) && (
                    <p className="text-sm font-semibold text-ink leading-snug">{item.featuredTitle || item.position}</p>
                  )}
                  {item.company && <p className="text-xs text-ink/55 mt-0.5">{item.company}</p>}
                </div>
              )}

              {[item.city, item.country].filter(Boolean).length > 0 && (
                <p className="mt-2 text-xs text-ink/45">📍 {[item.city, item.country].filter(Boolean).join(', ')}</p>
              )}

              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {item.isMentor && <Badge>{t('profile.mentor')}</Badge>}
                {item.canHelpStudents && <Badge tone="gold">{t('profile.helpStudents')}</Badge>}
                {item.isSponsor && <Badge tone="gold">{t('profile.sponsor')}</Badge>}
                {!item.isMentor && !item.canHelpStudents && !item.isSponsor && !item.isFeatured && (
                  <Badge tone="clay">{t('profile.graduate')}</Badge>
                )}
              </div>

              <div className="mt-4">
                <Link
                  to={`/${lang}/alumni/${item.id}`}
                  className={`inline-flex w-full justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity ${item.isFeatured ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0879a8] to-[#3bc4c7]'}`}
                >
                  {t('directory.profile')}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {!loading && sortedAlumni.length === 0 && (
          <Card>
            <p className="text-ink/72">{t('directory.empty')}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
