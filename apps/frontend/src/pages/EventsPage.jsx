import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { getLocalized } from '../i18n/localize'

const statusLabels = {
  upcoming: 'Предстоящее',
  ongoing: 'Идет сейчас',
  past: 'Завершено',
  cancelled: 'Отменено'
}

export function EventsPage() {
  const { t, i18n } = useTranslation()
  const { lang = 'ru' } = useParams()
  const [events, setEvents] = useState([])
  const accessToken = useAppStore((state) => state.accessToken)

  useEffect(() => {
    api.get('/events').then(({ data }) => setEvents(data)).catch(() => setEvents([]))
  }, [])

  const register = async (eventId) => {
    if (!accessToken) {
      alert('Войдите в систему, чтобы зарегистрироваться на мероприятие.')
      return
    }
    try {
      await api.post(`/events/${eventId}/register`)
      alert('Вы зарегистрированы на мероприятие.')
    } catch (error) {
      alert(error.response?.data?.error || 'Не удалось зарегистрироваться')
    }
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('nav.events')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">Смотрите список предстоящих мероприятий, регистрируйтесь и участвуйте в жизни сообщества.</p>
      </PageHero>
      <div className="grid gap-6 md:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex items-center justify-between gap-3 text-sm text-ink/72">
              <span>{new Date(event.startsAt).toLocaleDateString('ru-RU')}</span>
              <span>{new Date(event.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold">{getLocalized(event.title, i18n.language)}</h2>
            <p className="mt-3 text-ink/82">{getLocalized(event.description, i18n.language)}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/72">
              <span>{event.location}</span>
              <span className="rounded bg-[#eefbfc] px-3 py-1 font-semibold">{statusLabels[event.status] || event.status}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to={`/${lang}/events/${event.id}`} className="rounded bg-moss px-5 py-3 font-bold text-white">Подробнее</Link>
              <button onClick={() => register(event.id)} className="rounded border border-ink/10 px-5 py-3 font-bold">Зарегистрироваться</button>
            </div>
          </Card>
        ))}
        {events.length === 0 && <Card><p className="text-ink/72">Мероприятия пока не добавлены.</p></Card>}
      </div>
    </div>
  )
}
