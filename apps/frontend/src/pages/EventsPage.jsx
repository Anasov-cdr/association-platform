import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { getLocalized } from '../i18n/localize'
import { useSEO } from '../hooks/useSEO'

const statusColors = {
  upcoming: 'bg-moss/10 text-moss',
  ongoing: 'bg-amber-50 text-amber-700',
  past: 'bg-ink/8 text-ink/50',
  cancelled: 'bg-red-50 text-red-600'
}

export function EventsPage() {
  const { t, i18n } = useTranslation()
  useSEO({ title: t('seo.events.title'), description: t('seo.events.desc') })
  const { lang = 'ru' } = useParams()
  const [events, setEvents] = useState([])
  const auth = useAppStore((state) => state)
  const myUserId = auth.user?.id

  useEffect(() => {
    api.get('/events').then(({ data }) => setEvents(data)).catch(() => setEvents([]))
  }, [])

  const register = async (eventId) => {
    if (!auth.accessToken) {
      alert('Войдите в систему, чтобы зарегистрироваться на мероприятие.')
      return
    }
    try {
      await api.post(`/events/${eventId}/register`)
      setEvents((prev) => prev.map((e) =>
        e.id === eventId
          ? { ...e, registrations: [...(e.registrations || []), { userId: myUserId }] }
          : e
      ))
    } catch (error) {
      alert(error.response?.data?.error || 'Не удалось зарегистрироваться')
    }
  }

  const unregister = async (eventId) => {
    if (!window.confirm(t('events.cancelRegistrationConfirm'))) return
    try {
      await api.delete(`/events/${eventId}/register`)
      setEvents((prev) => prev.map((e) =>
        e.id === eventId
          ? { ...e, registrations: (e.registrations || []).filter((r) => r.userId !== myUserId) }
          : e
      ))
    } catch (error) {
      alert(error.response?.data?.error || 'Не удалось отменить регистрацию')
    }
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('nav.events')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">{t('events.subtitle')}</p>
      </PageHero>

      <div className="grid gap-6 md:grid-cols-2">
        {events.map((event) => {
          const isRegistered = myUserId && (event.registrations || []).some((r) => r.userId === myUserId)
          const isClosed = event.status === 'past' || event.status === 'cancelled'
          const count = event.registrations?.length ?? event._count?.registrations ?? null

          return (
            <Card key={event.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink/60">
                  {new Date(event.startsAt).toLocaleDateString('ru-RU')}
                  {' · '}
                  {new Date(event.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`rounded px-3 py-1 text-xs font-bold ${statusColors[event.status] || 'bg-ink/5 text-ink/60'}`}>
                  {t(`statuses.${event.status}`) || event.status}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold">{getLocalized(event.title, i18n.language)}</h2>
              <p className="mt-2 text-sm text-ink/72 line-clamp-2">{getLocalized(event.description, i18n.language)}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink/50">
                {event.location && <span>📍 {event.location}</span>}
                {count !== null && <span>👥 {count} участников</span>}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
                <Link to={`/${lang}/events/${event.id}`} className="rounded bg-moss px-5 py-2.5 text-sm font-bold text-white hover:bg-moss/80 transition-colors">
                  {t('common.learnMore')}
                </Link>

                {!isClosed && auth.accessToken && (
                  isRegistered ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-moss/10 px-3 py-2 text-xs font-bold text-moss">✓ {t('events.registered')}</span>
                      <button
                        onClick={() => unregister(event.id)}
                        className="text-xs text-ink/50 hover:text-red-600 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => register(event.id)}
                      className="rounded border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink hover:bg-moss/5 transition-colors"
                    >
                      {t('events.register')}
                    </button>
                  )
                )}
              </div>
            </Card>
          )
        })}
        {events.length === 0 && <Card><p className="text-ink/72">{t('events.empty')}</p></Card>}
      </div>
    </div>
  )
}
