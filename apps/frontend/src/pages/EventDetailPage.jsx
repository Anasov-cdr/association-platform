import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { useAppStore } from '../store'

const statusLabels = {
  upcoming: 'Предстоящее',
  ongoing: 'Идет сейчас',
  past: 'Завершено',
  cancelled: 'Отменено'
}

export function EventDetailPage() {
  const { id, lang = 'ru' } = useParams()
  const { i18n } = useTranslation()
  const [event, setEvent] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const accessToken = useAppStore((state) => state.accessToken)

  const loadEvent = () => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data)).catch(() => setError('Мероприятие не найдено'))
  }

  useEffect(() => { loadEvent() }, [id])

  const register = async () => {
    if (!accessToken) {
      setError('Войдите в кабинет, чтобы зарегистрироваться.')
      return
    }
    setError('')
    try {
      await api.post(`/events/${id}/register`)
      setNotice('Вы зарегистрированы на мероприятие.')
      loadEvent()
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось зарегистрироваться')
    }
  }

  if (!event && error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!event) return <Card><p className="text-ink/72">Загрузка...</p></Card>

  return (
    <div className="space-y-6">
      <Link to={`/${lang}/events`} className="font-bold text-moss">← Все мероприятия</Link>
      {(notice || error) && <Card className={error ? 'border-red-200 bg-red-50 text-red-800' : 'border-moss/20 bg-moss/10 text-green-900'}>{error || notice}</Card>}
      <PageHero>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white/78">
          <span>{new Date(event.startsAt).toLocaleDateString('ru-RU')}</span>
          <span>{new Date(event.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="rounded bg-white/18 px-3 py-1">{statusLabels[event.status] || event.status}</span>
        </div>
        <h1 className="mt-5 font-display text-5xl font-bold">{getLocalized(event.title, i18n.language)}</h1>
        <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/86">{getLocalized(event.description, i18n.language)}</p>
        <div className="mt-6 rounded-md bg-[#eefbfc] p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-ink/45">Место проведения</p>
          <p className="mt-2 text-xl font-bold">{event.location}</p>
        </div>
        <button onClick={register} className="mt-6 rounded bg-moss px-6 py-3 font-bold text-white">Зарегистрироваться</button>
      </PageHero>
    </div>
  )
}
