import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Badge, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'
import { filterPublicAlumniProfiles } from '../alumniVisibility'

function MentorRequestModal({ mentor, onClose, onSent }) {
  const { t } = useTranslation()
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post(`/mentorship/${mentor.userId}/request`, { goals })
      onSent()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось отправить запрос')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-bold">{t('mentorship.requestTitle')}</h2>
        <p className="mt-2 text-ink/78">Ментор: <b>{mentor.fullName}</b></p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2 block">
              {t('mentorship.goalsLabel')}
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder={t('mentorship.goalsPlaceholder')}
              rows={4}
              required
              className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/80 disabled:opacity-50 transition-colors"
            >
              {loading ? t('common.loading') : t('mentorship.sendRequest')}
            </button>
            <button type="button" onClick={onClose} className="rounded border border-ink/10 px-6 py-3 font-semibold hover:bg-moss/5 transition-colors">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function MentorshipPage() {
  const { t } = useTranslation()
  useSEO({ title: t('seo.mentorship.title'), description: t('seo.mentorship.desc') })
  const { lang = 'ru' } = useParams()
  const [mentors, setMentors] = useState([])
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [sentIds, setSentIds] = useState([])
  const accessToken = useAppStore((state) => state.accessToken)

  useEffect(() => {
    api.get('/alumni', { params: { mentor: true, status: 'APPROVED' } })
      .then(({ data }) => setMentors(filterPublicAlumniProfiles(data)))
      .catch(() => setMentors([]))
  }, [])

  const handleRequest = (mentor) => {
    if (!accessToken) {
      alert(t('mentorship.loginRequired'))
      return
    }
    setSelectedMentor(mentor)
  }

  const handleSent = (mentorId) => {
    setSentIds((prev) => [...prev, mentorId])
    alert(t('mentorship.requestSent'))
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('mentorship.title')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">{t('mentorship.subtitle')}</p>
      </PageHero>

      {mentors.length === 0 && (
        <Card><p className="text-ink/72">{t('mentorship.noMentors')}</p></Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mentors.map((item) => (
          <Card key={item.id} className="flex flex-col">
            {/* Шапка карточки */}
            <div className="flex items-start gap-4">
              {item.photoUrl ? (
                <img src={toAbsoluteUploadUrl(item.photoUrl)} alt={item.fullName} className="h-14 w-14 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-moss text-xl font-bold text-white">
                  {item.fullName[0]}
                </div>
              )}
              <div className="min-w-0">
                <Link to={`/${lang}/alumni/${item.id}`} className="font-bold text-lg hover:text-moss transition-colors leading-tight">
                  {item.fullName}
                </Link>
                <p className="text-sm text-ink/78 mt-0.5">{item.specialty}</p>
              </div>
            </div>

            {/* Карьера */}
            {(item.position || item.company) && (
              <div className="mt-3">
                {item.position && <p className="font-semibold text-sm">{item.position}</p>}
                {item.company && <p className="text-sm text-ink/72">{item.company}</p>}
              </div>
            )}

            {/* Местоположение */}
            {(item.city || item.country) && (
              <p className="mt-2 text-sm text-ink/72">
                📍 {[item.city, item.country].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Менторство */}
            <div className="mt-4 space-y-2 rounded-md bg-moss/5 p-3 text-sm">
              {item.mentorArea && (
                <p><span className="font-semibold text-moss">{t('mentorship.area')}:</span> {item.mentorArea}</p>
              )}
              {item.mentorFormat && (
                <p>
                  <span className="font-semibold text-moss">{t('mentorship.format')}:</span>{' '}
                  {t(`mentorship.${item.mentorFormat}`) || item.mentorFormat}
                </p>
              )}
              {item.mentorAvailability && (
                <p><span className="font-semibold text-moss">{t('mentorship.availability')}:</span> {item.mentorAvailability}</p>
              )}
              {!item.mentorArea && !item.mentorFormat && item.bio && (
                <p className="text-ink/78 line-clamp-2">{item.bio}</p>
              )}
            </div>

            {/* Бейджи */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{t('profile.mentor')}</Badge>
              {item.canHelpStudents && <Badge tone="gold">{t('profile.helpStudents')}</Badge>}
            </div>

            {/* Кнопка */}
            <div className="mt-auto pt-5">
              {sentIds.includes(item.id) ? (
                <span className="inline-flex items-center gap-2 rounded bg-green-100 px-5 py-3 text-sm font-bold text-green-700">
                  ✓ {t('mentorship.requestSent')}
                </span>
              ) : (
                <button
                  onClick={() => handleRequest(item)}
                  className="rounded bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-moss/80 transition-colors"
                >
                  {t('mentorship.sendRequest')}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedMentor && (
        <MentorRequestModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onSent={() => handleSent(selectedMentor.id)}
        />
      )}
    </div>
  )
}
