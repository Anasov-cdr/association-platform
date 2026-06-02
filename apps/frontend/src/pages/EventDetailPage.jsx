import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { useAppStore } from '../store'
import { useSEO } from '../hooks/useSEO'

export function EventDetailPage() {
  const { id, lang = 'ru' } = useParams()
  const { t, i18n } = useTranslation()
  const [event, setEvent] = useState(null)
  useSEO({ title: event ? getLocalized(event.title, i18n.language) : t('events.title') })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const auth = useAppStore((state) => state)

  const loadEvent = () => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data)).catch(() => setError(t('events.notFound')))
  }

  useEffect(() => { loadEvent() }, [id, t])

  const myUserId = auth.user?.id
  const isRegistered = myUserId && event?.registrations?.some((r) => r.userId === myUserId)

  const register = async () => {
    if (!auth.accessToken) { setError(t('events.loginRequired')); return }
    setError('')
    setLoading(true)
    try {
      await api.post(`/events/${id}/register`)
      setNotice(t('events.registerSuccess'))
      loadEvent()
    } catch (err) {
      setError(err.response?.data?.error || t('events.registerError'))
    } finally {
      setLoading(false)
    }
  }

  const unregister = async () => {
    if (!window.confirm(t('events.cancelRegistrationLongConfirm'))) return
    setError('')
    setLoading(true)
    try {
      await api.delete(`/events/${id}/register`)
      setNotice(t('events.cancelSuccess'))
      loadEvent()
    } catch (err) {
      setError(err.response?.data?.error || t('events.cancelError'))
    } finally {
      setLoading(false)
    }
  }

  if (!event && error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!event) return <Card><p className="text-ink/72">{t('common.loading')}</p></Card>

  const isCancelled = event.status === 'cancelled' || event.status === 'past'
  const regCount = event.registrations?.length || 0

  return (
    <div className="space-y-6">
      <Link to={`/${lang}/events`} className="font-bold text-moss">← {t('events.allEvents')}</Link>
      {(notice || error) && (
        <Card className={error ? 'border-red-200 bg-red-50 text-red-800' : 'border-moss/20 bg-moss/10 text-green-900'}>
          {error || notice}
        </Card>
      )}
      <PageHero>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white/78">
          <span>{new Date(event.startsAt).toLocaleDateString(i18n.language)}</span>
          <span>{new Date(event.startsAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="rounded bg-white/18 px-3 py-1">{t(`events.statuses.${event.status}`) || event.status}</span>
        </div>
        <h1 className="mt-5 font-display text-5xl font-bold">{getLocalized(event.title, i18n.language)}</h1>
        <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/86">{getLocalized(event.description, i18n.language)}</p>

        <div className="mt-6 rounded-md bg-[#eefbfc] p-5 text-ink">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-ink/45">{t('events.location')}</p>
          <p className="mt-2 text-xl font-bold">{event.location}</p>
        </div>

        {regCount > 0 && (
          <p className="mt-4 text-sm font-semibold text-white/70">
            {t('events.participants')}: {regCount}
          </p>
        )}

        {!isCancelled && (
          <div className="mt-6">
            {isRegistered ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded bg-moss px-4 py-2 text-sm font-bold text-white">✓ {t('events.registered')}</span>
                <button
                  onClick={unregister}
                  disabled={loading}
                  className="rounded border border-white/40 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-60"
                >
                  {loading ? t('events.canceling') : t('events.cancelRegistration')}
                </button>
              </div>
            ) : (
              <button
                onClick={register}
                disabled={loading}
                className="rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/90 transition-colors disabled:opacity-60"
              >
                {loading ? t('events.registering') : t('events.register')}
              </button>
            )}
          </div>
        )}
      </PageHero>
    </div>
  )
}
