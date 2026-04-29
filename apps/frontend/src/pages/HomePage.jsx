import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarDays, GraduationCap, HeartHandshake, MapPin, Phone, Users } from 'lucide-react'
import { Card } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'

const fallbackCollege = {
  name: 'Бишкекский финансово-экономический техникум им. А. Токтоналиева',
  foundedYear: 1931,
  staffCount: '176+',
  studentCount: '2268+',
  address: 'Кыргызская Республика, г. Бишкек, пр. Чуй, 269',
  phones: ['(0312) 39 15 41', '(0312) 39 21 66'],
  mission: 'Обеспечение современного качественного образования, ориентированного на подготовку конкурентоспособных кадров нового поколения через сохранение традиций и внедрение инноваций.',
  specialties: [
    'Экономика и бухгалтерский учет',
    'Финансы: бюджет и бюджетный учет',
    'Финансы предприятий',
    'Банковское дело',
    'Страховое дело',
    'Налоги и налогообложение',
    'Менеджмент',
    'Маркетинг',
    'Операционная деятельность в логистике'
  ]
}

const hasBrokenText = (value) => typeof value === 'string' && /\?{3,}/.test(value)
const keepValidText = (next, fallback) => {
  if (Array.isArray(next)) return next.some(hasBrokenText) ? fallback : next
  return hasBrokenText(next) || next === undefined || next === null || next === '' ? fallback : next
}
const normalizeCollege = (data = {}) => ({
  ...fallbackCollege,
  ...data,
  name: keepValidText(data.name, fallbackCollege.name),
  parentOrganization: keepValidText(data.parentOrganization, fallbackCollege.parentOrganization),
  address: keepValidText(data.address, fallbackCollege.address),
  workingHours: keepValidText(data.workingHours, fallbackCollege.workingHours),
  mission: keepValidText(data.mission, fallbackCollege.mission),
  specialties: keepValidText(data.specialties, fallbackCollege.specialties)
})

export function HomePage() {
  const { lang = 'ru' } = useParams()
  const { t } = useTranslation()
  const [college, setCollege] = useState(fallbackCollege)
  const [homeData, setHomeData] = useState({ news: [], campaigns: [], events: [] })

  useEffect(() => {
    api.get('/site').then(({ data }) => setCollege(normalizeCollege(data))).catch(() => setCollege(fallbackCollege))
    Promise.allSettled([api.get('/news'), api.get('/donations/campaigns'), api.get('/events')]).then(([newsRes, campaignsRes, eventsRes]) => {
      setHomeData({
        news: newsRes.status === 'fulfilled' ? newsRes.value.data.slice(0, 3) : [],
        campaigns: campaignsRes.status === 'fulfilled' ? campaignsRes.value.data.slice(0, 2) : [],
        events: eventsRes.status === 'fulfilled' ? eventsRes.value.data.slice(0, 2) : []
      })
    })
  }, [])

  const stats = [
    [t('stats.alumni'), college.studentCount || '2268+', Users],
    [t('stats.donations'), '363 000 KGS', HeartHandshake],
    [t('stats.jobs'), '38', GraduationCap],
    [t('stats.mentors'), college.staffCount || '176+', Users]
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-none bg-gradient-to-r from-[#0879a8] via-[#1d9fbd] to-[#3bc4c7] px-6 py-7 text-white shadow-soft md:px-10 lg:min-h-[420px]">
        <div className="relative grid items-center gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="z-10 max-w-3xl">
            <p className="mb-4 inline-flex rounded-xl bg-white/18 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/30 md:text-sm">{college.name}</p>
            <h1 className="font-display text-3xl font-bold leading-[1.12] tracking-tight md:text-4xl xl:text-[2.85rem]">{t('heroTitle')}</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white md:text-base">{t('heroText')}</p>
            <div className="mt-4 grid gap-2 text-sm font-bold text-white">
              <span className="inline-flex items-center gap-2"><MapPin size={17} /> {college.address}</span>
              <span className="inline-flex items-center gap-2"><Phone size={17} /> {(college.phones || []).join(', ')}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/${lang}/register`} className="inline-flex items-center gap-3 rounded-xl bg-[#39c7ca] px-6 py-3 font-bold text-white shadow-lg shadow-ink/10 hover:bg-[#43d4d6]">
                {t('join')} <ArrowRight size={18} />
              </Link>
              <Link to={`/${lang}/alumni`} className="rounded-xl border border-white/35 px-6 py-3 font-bold text-white hover:bg-white/10">{t('find')}</Link>
            </div>
          </div>

          <div className="relative z-0 min-h-[220px] lg:min-h-[330px]">
            <div className="absolute inset-0 bg-white/8 blur-3xl" />
            <img
              src="/hero-graduates.png"
              alt="Иллюстрация выпускников колледжа"
              className="relative ml-auto h-full max-h-[340px] w-full object-contain object-right drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl border-2 border-white/55 bg-white/16 p-3 shadow-[0_14px_34px_rgba(24,33,63,0.2)] backdrop-blur-sm">
              <Icon className="mb-2 text-white" size={20} />
              <div className="font-display text-xl font-black leading-none md:text-2xl">{value}</div>
              <div className="mt-1 text-xs font-bold leading-5 text-white md:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-gradient-to-br from-moss to-[#38c4c8] text-white">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-white">Миссия БФЭТ</p>
          <h2 className="mt-4 font-display text-3xl font-bold">Современное качественное образование и конкурентоспособные кадры нового поколения</h2>
          <p className="mt-4 font-semibold text-white">{college.mission}</p>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-moss">Образовательные программы</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Специальности БФЭТ</h2>
            </div>
            <span className="rounded bg-gold px-4 py-2 text-sm font-black text-ink">основан в {college.foundedYear}</span>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {(college.specialties || []).map((item) => (
              <div key={item} className="rounded bg-[#eefbfc] px-4 py-3 text-sm font-bold text-ink/90">{item}</div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-3xl font-bold">{t('sections.latestNews')}</h2>
          <div className="mt-5 space-y-4">
            {homeData.news.map((item) => (
              <article key={item.id} className="rounded bg-[#eefbfc] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink/82"><CalendarDays size={16} />{new Date(item.publishedAt).toLocaleDateString('ru-RU')}</div>
                <h3 className="mt-2 text-xl font-bold">{getLocalized(item.title, lang)}</h3>
                <p className="mt-2 font-medium text-ink/82">{getLocalized(item.body, lang)}</p>
              </article>
            ))}
            {homeData.news.length === 0 && <p className="text-ink/72">Новости добавляются администратором.</p>}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('sections.campaigns')}</h2>
          <div className="mt-5 space-y-5">
            {homeData.campaigns.map((item) => {
              const goal = Number(item.goalAmount || 0)
              const raised = Number(item.raisedAmount || 0)
              const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
              return (
                <div key={item.id}>
                  <div className="flex justify-between font-bold"><span>{getLocalized(item.title, lang)}</span><span>{percent}%</span></div>
                  <div className="mt-2 h-3 rounded bg-moss/10"><div className="h-3 rounded bg-moss" style={{ width: `${percent}%` }} /></div>
                  <p className="mt-2 text-sm text-ink/72">{raised.toLocaleString()} / {goal.toLocaleString()} KGS</p>
                </div>
              )
            })}
            {homeData.campaigns.length === 0 && <p className="text-ink/72">Кампании добавляются администратором.</p>}
          </div>
          <Link to={`/${lang}/donations`} className="mt-8 inline-flex items-center gap-2 font-bold text-moss">{t('donate')} <ArrowRight size={18} /></Link>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('nav.jobs')}</h2>
          <p className="mt-4 text-ink/78">Смотрите последние предложения, стажировки и вакансии от компании и выпускников.</p>
          <Link to={`/${lang}/jobs`} className="mt-6 inline-flex items-center gap-2 font-bold text-moss">Перейти к вакансиям <ArrowRight size={18} /></Link>
        </Card>
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('nav.mentorship')}</h2>
          <p className="mt-4 text-ink/78">Найдите ментора среди активных выпускников и отправьте запрос на помощь.</p>
          <Link to={`/${lang}/mentorship`} className="mt-6 inline-flex items-center gap-2 font-bold text-moss">Перейти к менторству <ArrowRight size={18} /></Link>
        </Card>
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('nav.chat')}</h2>
          <p className="mt-4 text-ink/78">Общайтесь с выпускниками, обсуждайте вакансии и делитесь опытом в чате.</p>
          <Link to={`/${lang}/chat`} className="mt-6 inline-flex items-center gap-2 font-bold text-moss">Перейти в чат <ArrowRight size={18} /></Link>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {homeData.events.map((event) => (
          <Card key={event.id} className="space-y-4">
            <div className="flex items-center justify-between gap-4 text-sm text-ink/72">
              <span>{new Date(event.startsAt).toLocaleDateString('ru-RU')}</span>
              <span>{new Date(event.startsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h2 className="text-2xl font-bold">{getLocalized(event.title, lang)}</h2>
            <p className="text-ink/82">{getLocalized(event.description, lang)}</p>
            <div className="flex items-center justify-between text-sm text-ink/72">
              <span>{event.location}</span>
              <Link to={`/${lang}/events`} className="font-semibold text-moss">Подробнее</Link>
            </div>
          </Card>
        ))}
        {homeData.events.length === 0 && <Card><p className="text-ink/72">Мероприятия добавляются администратором.</p></Card>}
      </section>
    </div>
  )
}
