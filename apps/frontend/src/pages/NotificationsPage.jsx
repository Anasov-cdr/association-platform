import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { useSEO } from '../hooks/useSEO'

const TYPE_COLOR = {
  SYSTEM: 'bg-ink/70',
  ALUMNI_PENDING: 'bg-gold',
  PROFILE_UPDATED: 'bg-moss',
  PROFILE_APPROVED: 'bg-moss',
  PROFILE_REJECTED: 'bg-red-500',
  PROFILE_STATUS: 'bg-moss',
  JOB_PENDING: 'bg-gold',
  JOB_APPROVED: 'bg-moss',
  JOB_REJECTED: 'bg-red-500',
  JOB_CLOSED: 'bg-ink/60',
  NEW_JOB_APPLICATION: 'bg-moss',
  JOB_APPLICATION_STATUS: 'bg-moss',
  MENTORSHIP_REQUEST: 'bg-moss',
  MENTORSHIP_STATUS: 'bg-moss',
  DONATION_PENDING: 'bg-gold',
  DONATION_STATUS: 'bg-moss',
  NEWS_PUBLISHED: 'bg-moss',
  EVENT_CREATED: 'bg-moss',
  EVENT_REGISTRATION: 'bg-moss',
  DOCUMENT_PUBLISHED: 'bg-ink/60'
}

export function NotificationsPage() {
  const { lang = 'ru' } = useParams()
  const { t, i18n } = useTranslation()
  useSEO({ title: t('notifications.title') })
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const accessToken = useAppStore((state) => state.accessToken)
  const clearUnread = useAppStore((state) => state.clearUnread)
  const decrementUnread = useAppStore((state) => state.decrementUnread)

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const loadNotifications = async () => {
    if (!accessToken) { setNotifications([]); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
    } catch (err) {
      setError(err.response?.data?.error || t('notifications.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [accessToken])

  // Автоматически отмечаем все как прочитанные при открытии страницы
  useEffect(() => {
    if (!accessToken) return
    const timer = setTimeout(() => {
      api.patch('/notifications/read-all')
        .then(() => {
          setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
          clearUnread()
        })
        .catch(() => {})
    }, 800) // небольшая задержка чтобы пользователь увидел что было "новое"
    return () => clearTimeout(timer)
  }, [accessToken])

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {})
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item))
    decrementUnread()
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    clearUnread()
  }

  const removeNotification = async (id) => {
    const notif = notifications.find((item) => item.id === id)
    await api.delete(`/notifications/${id}`).catch(() => {})
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    if (notif && !notif.read) decrementUnread()
  }

  return (
    <div className="space-y-6">
      <PageHero className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70">{t('notifications.center')}</p>
            <h1 className="mt-3 font-display text-4xl font-bold">{t('notifications.title')}</h1>
            <p className="mt-3 max-w-3xl text-white/85">
              {t('notifications.subtitle')}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-6 py-4 text-center backdrop-blur-sm">
            <div className="font-display text-4xl font-bold">{unreadCount}</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">{t('notifications.unreadShort')}</div>
          </div>
        </div>
      </PageHero>

      {!accessToken && (
        <Card>
          <p className="font-semibold text-ink/75">{t('notifications.loginRequired')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={`/${lang}/cabinet`} className="rounded-full bg-moss px-5 py-2.5 text-sm font-bold text-white">{t('notifications.alumniCabinet')}</Link>
            <Link to={`/${lang}/admin`} className="rounded-full border border-ink/10 px-5 py-2.5 text-sm font-bold hover:bg-ink/5 transition-colors">{t('notifications.adminPanel')}</Link>
          </div>
        </Card>
      )}

      {accessToken && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink/60">
            {loading ? t('common.loading') : `${t('common.total')}: ${notifications.length}`}
          </p>
          <button
            onClick={markAllRead}
            disabled={!unreadCount}
            className="rounded-full bg-moss px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-moss/80 transition-colors"
          >
            {t('notifications.markAllReadLong')}
          </button>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-800">{error}</Card>
      )}

      <div className="grid gap-3">
        {notifications.map((item) => {
          const color = TYPE_COLOR[item.type] || 'bg-ink/60'
          return (
            <Card
              key={item.id}
              className={`border transition-all ${
                item.read
                  ? 'border-ink/10 bg-white'
                  : 'border-moss/25 bg-moss/5 shadow-sm shadow-moss/10'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full ${color} px-3 py-0.5 text-xs font-black uppercase text-white`}>
                      {t(`notifications.types.${item.type}`) || item.type}
                    </span>
                    {!item.read && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-moss animate-pulse" />
                        <span className="text-xs font-bold text-moss">{t('notifications.new')}</span>
                      </span>
                    )}
                    <span className="text-sm text-ink/45">{new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold leading-snug">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink/70">{item.message}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!item.read && (
                    <button
                      onClick={() => markRead(item.id)}
                      className="rounded-full bg-moss px-4 py-2 text-xs font-bold text-white hover:bg-moss/80 transition-colors"
                    >
                      {t('notifications.markRead')}
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(item.id)}
                    className="rounded-full border border-ink/10 px-4 py-2 text-xs font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                  >
                    {t('notifications.delete')}
                  </button>
                </div>
              </div>
            </Card>
          )
        })}

        {accessToken && !loading && notifications.length === 0 && (
          <Card>
            <div className="py-6 text-center">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-semibold text-ink/50">{t('notifications.emptyLong')}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
