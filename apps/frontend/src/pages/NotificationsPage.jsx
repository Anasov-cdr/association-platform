import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

const typeLabels = {
  SYSTEM: 'Система',
  ALUMNI_PENDING: 'Анкета',
  PROFILE_UPDATED: 'Профиль',
  PROFILE_APPROVED: 'Профиль',
  PROFILE_REJECTED: 'Профиль',
  PROFILE_STATUS: 'Профиль',
  JOB_PENDING: 'Вакансии',
  JOB_APPROVED: 'Вакансии',
  JOB_REJECTED: 'Вакансии',
  JOB_CLOSED: 'Вакансии',
  NEW_JOB_APPLICATION: 'Отклики',
  JOB_APPLICATION_STATUS: 'Отклики',
  MENTORSHIP_REQUEST: 'Менторство',
  MENTORSHIP_STATUS: 'Менторство',
  DONATION_PENDING: 'Пожертвования',
  DONATION_STATUS: 'Пожертвования',
  NEWS_PUBLISHED: 'Новости',
  EVENT_CREATED: 'Мероприятия',
  EVENT_REGISTRATION: 'Мероприятия',
  DOCUMENT_PUBLISHED: 'Документы'
}

export function NotificationsPage() {
  const { lang = 'ru' } = useParams()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const accessToken = useAppStore((state) => state.accessToken)

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const loadNotifications = async () => {
    if (!accessToken) {
      setNotifications([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось загрузить уведомления')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNotifications() }, [accessToken])

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`)
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    setNotifications((items) => items.map((item) => ({ ...item, read: true })))
  }

  const removeNotification = async (id) => {
    await api.delete(`/notifications/${id}`)
    setNotifications((items) => items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <PageHero className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70">Центр уведомлений</p>
            <h1 className="mt-3 font-display text-4xl font-bold">Уведомления</h1>
            <p className="mt-3 max-w-3xl text-white">Все действия платформы: модерация, вакансии, отклики, мероприятия, документы, новости и пожертвования.</p>
          </div>
          <div className="rounded-md bg-white/16 px-6 py-4 text-center">
            <div className="font-display text-4xl font-bold">{unreadCount}</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">непрочитано</div>
          </div>
        </div>
      </PageHero>

      {!accessToken && (
        <Card>
          <p className="font-semibold text-ink/82">Войдите в кабинет или админ-панель, чтобы увидеть уведомления.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={`/${lang}/cabinet`} className="rounded bg-moss px-5 py-3 text-sm font-bold text-white">Кабинет выпускника</Link>
            <Link to={`/${lang}/admin`} className="rounded border border-ink/10 px-5 py-3 text-sm font-bold">Админ-панель</Link>
          </div>
        </Card>
      )}

      {accessToken && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink/72">{loading ? 'Загрузка...' : `Всего: ${notifications.length}`}</p>
          <button onClick={markAllRead} disabled={!unreadCount} className="rounded bg-moss px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Отметить все прочитанными</button>
        </div>
      )}

      {error && <Card className="border-red-200 bg-red-50 text-red-800">{error}</Card>}

      <div className="grid gap-4">
        {notifications.map((item) => (
          <Card key={item.id} className={`border ${item.read ? 'border-ink/10 bg-white' : 'border-gold/50 bg-gold/10'}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-moss px-3 py-1 text-xs font-black uppercase text-white">{typeLabels[item.type] || item.type}</span>
                  {!item.read && <span className="rounded bg-clay px-3 py-1 text-xs font-black uppercase text-white">новое</span>}
                  <span className="text-sm font-semibold text-ink/50">{formatDate(item.createdAt)}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold">{item.title}</h2>
                <p className="mt-2 text-ink/78">{item.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!item.read && <button onClick={() => markRead(item.id)} className="rounded bg-moss px-4 py-2 text-sm font-bold text-white">Прочитано</button>}
                <button onClick={() => removeNotification(item.id)} className="rounded border border-ink/10 px-4 py-2 text-sm font-bold">Удалить</button>
              </div>
            </div>
          </Card>
        ))}
        {accessToken && !loading && notifications.length === 0 && (
          <Card>
            <p className="text-ink/72">Уведомлений пока нет.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
