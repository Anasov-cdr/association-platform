import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'

const emptyProfile = {
  fullName: '', graduationYear: new Date().getFullYear(),
  specialty: '', groupName: '', city: '', country: 'Кыргызстан',
  company: '', position: '', phone: '', bio: '', achievements: '',
  skills: [], photoUrl: '',
  socialLinks: { linkedin: '', github: '', telegram: '', website: '' },
  showEmail: false, showPhone: false,
  isMentor: false, canHelpStudents: false,
  mentorArea: '', mentorFormat: 'online', mentorAvailability: ''
}

const emptyJob = {
  title: '', description: '', requirements: '', duties: '',
  type: 'стажировка', format: 'гибрид',
  city: 'Бишкек', country: 'Кыргызстан', salary: '', deadline: '', contacts: ''
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{label}</label>}
      <input
        {...props}
        className={`w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss ${props.className || ''}`}
      />
    </div>
  )
}

function Textarea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{label}</label>}
      <textarea
        {...props}
        className={`w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss ${props.className || ''}`}
      />
    </div>
  )
}

function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{label}</label>}
      <select
        {...props}
        className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
      >
        {children}
      </select>
    </div>
  )
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md bg-[#eefbfc] px-4 py-3 font-semibold hover:bg-[#e2f7fa] transition-colors">
      <input type="checkbox" checked={Boolean(checked)} onChange={onChange} className="h-4 w-4 accent-moss" />
      {label}
    </label>
  )
}

const STATUS_COLORS = {
  APPROVED: 'text-green-700 bg-green-100',
  PENDING: 'text-yellow-700 bg-yellow-100',
  REJECTED: 'text-red-700 bg-red-100',
  BLOCKED: 'text-gray-700 bg-gray-100',
  DRAFT: 'text-ink/72 bg-[#eefbfc]'
}

const APP_STATUS_LABELS = {
  SENT: 'Отправлен', VIEWED: 'Просмотрен', INVITED: 'Приглашен',
  REJECTED: 'Отклонен', ACCEPTED: 'Принят'
}

const ROLE_LABELS = {
  GUEST: 'Гость',
  ALUMNI: 'Выпускник',
  MODERATOR: 'Модератор',
  ADMIN: 'Администратор'
}

const PROFILE_STATUS_LABELS = {
  DRAFT: 'Черновик',
  PENDING: 'На проверке',
  APPROVED: 'Подтвержден',
  REJECTED: 'Отклонен',
  BLOCKED: 'Заблокирован'
}

const JOB_STATUS_LABELS = {
  DRAFT: 'Черновик',
  PENDING: 'На проверке',
  PUBLISHED: 'Опубликовано',
  REJECTED: 'Отклонена',
  CLOSED: 'Закрыта'
}

const MENTORSHIP_STATUS_LABELS = {
  active: 'Активно',
  pending: 'Ожидает ответа',
  completed: 'Завершено',
  rejected: 'Отклонено'
}

const HERO_STATUS_COLORS = {
  APPROVED: 'bg-white text-green-700',
  PENDING: 'bg-white text-yellow-700',
  REJECTED: 'bg-white text-red-700',
  BLOCKED: 'bg-white text-gray-700',
  DRAFT: 'bg-white text-moss'
}

export function CabinetPage() {
  const { t } = useTranslation()
  const auth = useAppStore((state) => state)
  const setAuth = useAppStore((state) => state.setAuth)
  const logout = useAppStore((state) => state.logout)

  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [profile, setProfile] = useState(emptyProfile)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [mentorships, setMentorships] = useState([])
  const [notifications, setNotifications] = useState([])
  const [jobForm, setJobForm] = useState(emptyJob)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [skillsInput, setSkillsInput] = useState('')

  const showMsg = (msg, isError = false) => {
    if (isError) { setError(msg); setNotice('') }
    else { setNotice(msg); setError('') }
  }

  const loadCabinet = async () => {
    if (!auth.accessToken) return
    const [profileRes, jobsRes, applicationsRes, mentorshipsRes, notificationsRes] = await Promise.allSettled([
      api.get('/alumni/profile/me'),
      api.get('/jobs/my'),
      api.get('/jobs/applications/my'),
      api.get('/mentorship/my'),
      api.get('/notifications')
    ])
    if (profileRes.status === 'fulfilled') {
      const p = { ...emptyProfile, ...profileRes.value.data }
      if (!p.socialLinks || typeof p.socialLinks !== 'object') p.socialLinks = emptyProfile.socialLinks
      setProfile(p)
      setSkillsInput(Array.isArray(p.skills) ? p.skills.join(', ') : '')
    }
    if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data)
    if (applicationsRes.status === 'fulfilled') setApplications(applicationsRes.value.data)
    if (mentorshipsRes.status === 'fulfilled') setMentorships(mentorshipsRes.value.data)
    if (notificationsRes.status === 'fulfilled') setNotifications(notificationsRes.value.data)
  }

  useEffect(() => { loadCabinet() }, [auth.accessToken])

  const login = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', credentials)
      setAuth({ user: res.data.user, accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
      showMsg('Вход выполнен')
    } catch (err) {
      showMsg(err.response?.data?.error || 'Не удалось войти', true)
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
      const payload = {
        ...profile,
        graduationYear: Number(profile.graduationYear),
        skills,
        socialLinks: profile.socialLinks
      }
      await api.put('/alumni/profile/me', payload)
      showMsg(t('cabinet.profileSaved'))
      await loadCabinet()
    } catch (err) {
      showMsg(err.response?.data?.error || 'Не удалось сохранить профиль', true)
    }
  }

  const createJob = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/jobs', {
        ...jobForm,
        deadline: jobForm.deadline ? new Date(jobForm.deadline).toISOString() : undefined
      })
      setJobForm(emptyJob)
      showMsg(t('cabinet.jobCreated'))
      await loadCabinet()
    } catch (err) {
      showMsg(err.response?.data?.error || 'Не удалось создать вакансию', true)
    }
  }

  const markNotificationRead = async (id) => {
    await api.patch(`/notifications/${id}/read`)
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }

  const markAllNotificationsRead = async () => {
    await api.patch('/notifications/read-all')
    setNotifications((items) => items.map((item) => ({ ...item, read: true })))
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/change-password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      showMsg(t('cabinet.passwordUpdated'))
    } catch (err) {
      showMsg(err.response?.data?.error || 'Не удалось обновить пароль', true)
    }
  }

  const setSocialLink = (key, value) =>
    setProfile((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: value } }))

  if (!auth.accessToken) {
    return (
      <div className="space-y-6">
        <PageHero>
          <h1 className="font-display text-4xl font-bold">{t('cabinet.title')}</h1>
          <p className="mt-3 text-white/86">{t('cabinet.loginDesc')}</p>
        </PageHero>
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('cabinet.loginTitle')}</h2>
          <form onSubmit={login} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input
              value={credentials.email}
              onChange={(e) => setCredentials((p) => ({ ...p, email: e.target.value }))}
              type="email"
              label="Электронная почта"
              required
            />
            <Input
              value={credentials.password}
              onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))}
              type="password"
              label="Пароль"
              placeholder="Пароль"
              required
            />
            <button className="rounded bg-moss px-6 py-3 font-bold text-white md:col-span-2 hover:bg-moss/90 transition-colors">
              {t('cabinet.loginTitle')}
            </button>
          </form>
          {error && <p className="mt-4 text-red-700">{error}</p>}
        </Card>
      </div>
    )
  }

  const statusCls = STATUS_COLORS[profile.status] || STATUS_COLORS.DRAFT

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <PageHero>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">{t('cabinet.title')}</h1>
            <p className="mt-2 text-white/82">{auth.email} · {ROLE_LABELS[auth.role] || auth.role}</p>
            <span className={`mt-2 inline-block rounded px-3 py-1 text-xs font-bold shadow-sm ${HERO_STATUS_COLORS[profile.status || 'DRAFT'] || HERO_STATUS_COLORS.DRAFT}`}>
              {PROFILE_STATUS_LABELS[profile.status || 'DRAFT'] || profile.status || 'Черновик'}
            </span>
          </div>
          <button onClick={logout} className="rounded border border-white/45 bg-white/12 px-5 py-3 text-sm font-semibold text-white hover:bg-white/22 transition-colors">
            {t('cabinet.logout')}
          </button>
        </div>
      </PageHero>

      {/* Уведомления об успехе/ошибке */}
      {(notice || error) && (
        <Card className={error ? 'border-red-200 bg-red-50 text-red-800' : 'border-moss/20 bg-moss/10 text-green-900'}>
          {error || notice}
        </Card>
      )}

      {/* Профиль */}
      <Card>
        <h2 className="font-display text-3xl font-bold">{t('cabinet.profileTitle')}</h2>
        <form onSubmit={saveProfile} className="mt-6 space-y-6">
          {/* Основные данные */}
          <div className="grid gap-4 md:grid-cols-2">
            <Input label={t('cabinet.fields.fullName')} value={profile.fullName || ''} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} required />
            <Input label={t('cabinet.fields.graduationYear')} type="number" value={profile.graduationYear || ''} onChange={(e) => setProfile((p) => ({ ...p, graduationYear: e.target.value }))} />
            <Input label={t('cabinet.fields.specialty')} value={profile.specialty || ''} onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))} />
            <Input label={t('cabinet.fields.groupName')} value={profile.groupName || ''} onChange={(e) => setProfile((p) => ({ ...p, groupName: e.target.value }))} />
            <Input label={t('cabinet.fields.city')} value={profile.city || ''} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
            <Input label={t('cabinet.fields.country')} value={profile.country || ''} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))} />
            <Input label={t('cabinet.fields.company')} value={profile.company || ''} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} />
            <Input label={t('cabinet.fields.position')} value={profile.position || ''} onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))} />
            <Input label={t('cabinet.fields.phone')} value={profile.phone || ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className="md:col-span-1" />
            <Input label="URL фотографии" value={profile.photoUrl || ''} onChange={(e) => setProfile((p) => ({ ...p, photoUrl: e.target.value }))} placeholder="https://..." />
          </div>

          {/* Биография и достижения */}
          <div className="grid gap-4 md:grid-cols-2">
            <Textarea label={t('cabinet.fields.bio')} value={profile.bio || ''} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={4} />
            <Textarea label={t('cabinet.fields.achievements')} value={profile.achievements || ''} onChange={(e) => setProfile((p) => ({ ...p, achievements: e.target.value }))} rows={4} />
          </div>

          {/* Навыки */}
          <Input
            label={t('cabinet.fields.skills')}
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="Python, Excel, Управление проектами..."
          />
          {skillsInput && (
            <div className="flex flex-wrap gap-2 -mt-2">
              {skillsInput.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                <span key={s} className="rounded bg-moss/10 px-3 py-1 text-sm font-semibold text-moss">{s}</span>
              ))}
            </div>
          )}

          {/* Социальные сети */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3">{t('profile.socialLinks')}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label={t('cabinet.fields.linkedin')} value={profile.socialLinks?.linkedin || ''} onChange={(e) => setSocialLink('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
              <Input label={t('cabinet.fields.github')} value={profile.socialLinks?.github || ''} onChange={(e) => setSocialLink('github', e.target.value)} placeholder="https://github.com/..." />
              <Input label={t('cabinet.fields.telegram')} value={profile.socialLinks?.telegram || ''} onChange={(e) => setSocialLink('telegram', e.target.value)} placeholder="https://t.me/..." />
              <Input label={t('cabinet.fields.website')} value={profile.socialLinks?.website || ''} onChange={(e) => setSocialLink('website', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Настройки приватности */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3">Настройки приватности</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CheckField label={t('cabinet.fields.showEmail')} checked={profile.showEmail} onChange={(e) => setProfile((p) => ({ ...p, showEmail: e.target.checked }))} />
              <CheckField label={t('cabinet.fields.showPhone')} checked={profile.showPhone} onChange={(e) => setProfile((p) => ({ ...p, showPhone: e.target.checked }))} />
              <CheckField label={t('cabinet.fields.isMentor')} checked={profile.isMentor} onChange={(e) => setProfile((p) => ({ ...p, isMentor: e.target.checked }))} />
              <CheckField label={t('cabinet.fields.canHelpStudents')} checked={profile.canHelpStudents} onChange={(e) => setProfile((p) => ({ ...p, canHelpStudents: e.target.checked }))} />
            </div>
          </div>

          {/* Дополнительные поля ментора */}
          {profile.isMentor && (
            <div className="rounded-md border border-moss/20 bg-moss/5 p-5">
              <p className="font-bold text-moss mb-4">Настройки ментора</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label={t('cabinet.fields.mentorArea')} value={profile.mentorArea || ''} onChange={(e) => setProfile((p) => ({ ...p, mentorArea: e.target.value }))} placeholder="IT, Финансы, Бухгалтерия..." />
                <Select label={t('cabinet.fields.mentorFormat')} value={profile.mentorFormat || 'online'} onChange={(e) => setProfile((p) => ({ ...p, mentorFormat: e.target.value }))}>
                  <option value="online">{t('mentorship.online')}</option>
                  <option value="offline">{t('mentorship.offline')}</option>
                  <option value="both">{t('mentorship.both')}</option>
                </Select>
                <Input label={t('cabinet.fields.mentorAvailability')} value={profile.mentorAvailability || ''} onChange={(e) => setProfile((p) => ({ ...p, mentorAvailability: e.target.value }))} placeholder="Пн-Пт 18:00-20:00" className="md:col-span-2" />
              </div>
            </div>
          )}

          <button className="w-full rounded bg-moss px-6 py-4 font-bold text-white hover:bg-moss/80 transition-colors md:w-auto">
            {t('common.save')}
          </button>
        </form>
      </Card>

      {/* Смена пароля */}
      <Card>
        <h2 className="font-display text-3xl font-bold">{t('cabinet.security')}</h2>
        <p className="mt-2 text-sm text-ink/72">{t('cabinet.securityDesc')}</p>
        <form onSubmit={changePassword} className="mt-5 grid gap-4 md:grid-cols-3">
          <Input type="password" label={t('cabinet.currentPassword')} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
          <Input type="password" label={t('cabinet.newPassword')} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} required />
          <div className="flex items-end">
            <button className="w-full rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/90 transition-colors">
              {t('cabinet.updatePassword')}
            </button>
          </div>
        </form>
      </Card>

      {/* Мои вакансии */}
      <Card>
        <h2 className="font-display text-3xl font-bold">{t('cabinet.myJobs')}</h2>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold text-moss hover:underline">+ Добавить вакансию</summary>
          <form onSubmit={createJob} className="mt-5 grid gap-4 md:grid-cols-2">
            <Input label="Название" value={jobForm.title} onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))} required />
            <Select label="Тип" value={jobForm.type} onChange={(e) => setJobForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="стажировка">Стажировка</option>
              <option value="работа">Работа</option>
              <option value="практика">Практика</option>
              <option value="волонтер">Волонтёрство</option>
            </Select>
            <Select label="Формат" value={jobForm.format} onChange={(e) => setJobForm((p) => ({ ...p, format: e.target.value }))}>
              <option value="офис">Офис</option>
              <option value="удаленно">Удалённо</option>
              <option value="гибрид">Гибрид</option>
            </Select>
            <Input label="Город" value={jobForm.city} onChange={(e) => setJobForm((p) => ({ ...p, city: e.target.value }))} />
            <Input label="Зарплата" value={jobForm.salary} onChange={(e) => setJobForm((p) => ({ ...p, salary: e.target.value }))} placeholder="50 000 KGS" />
            <Input label="Дедлайн" type="datetime-local" value={jobForm.deadline} onChange={(e) => setJobForm((p) => ({ ...p, deadline: e.target.value }))} />
            <Textarea label="Описание" value={jobForm.description} onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))} required className="md:col-span-2" rows={3} />
            <Textarea label="Требования" value={jobForm.requirements} onChange={(e) => setJobForm((p) => ({ ...p, requirements: e.target.value }))} rows={2} />
            <Textarea label="Обязанности" value={jobForm.duties} onChange={(e) => setJobForm((p) => ({ ...p, duties: e.target.value }))} rows={2} />
            <Input label="Контакты" value={jobForm.contacts} onChange={(e) => setJobForm((p) => ({ ...p, contacts: e.target.value }))} className="md:col-span-2" />
            <button className="rounded bg-moss px-6 py-3 font-bold text-white md:col-span-2 hover:bg-moss/90 transition-colors">
              Создать вакансию
            </button>
          </form>
        </details>
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-md border border-ink/10 bg-white p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <b>{job.title}</b>
                <span className={`rounded px-3 py-1 text-xs font-bold ${STATUS_COLORS[job.status] || 'bg-[#eefbfc] text-ink/72'}`}>
                  {JOB_STATUS_LABELS[job.status] || job.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink/72">{t('jobs.applications')}: {job.applications?.length || 0}</p>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-ink/72">{t('jobs.noJobs')}</p>}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Мои отклики */}
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('cabinet.myApplications')}</h2>
          <div className="mt-5 space-y-3">
            {applications.map((item) => (
              <div key={item.id} className="rounded-md border border-ink/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <b className="text-sm">{item.job?.title || item.jobId}</b>
                  <span className={`rounded px-3 py-1 text-xs font-bold ${STATUS_COLORS[item.status] || 'bg-[#eefbfc] text-ink/72'}`}>
                    {APP_STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
                {item.message && <p className="mt-2 text-sm text-ink/72">{item.message}</p>}
              </div>
            ))}
            {applications.length === 0 && <p className="text-ink/72">{t('cabinet.noApplications')}</p>}
          </div>
        </Card>

        {/* Менторство */}
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('cabinet.myMentorships')}</h2>
          <div className="mt-5 space-y-3">
            {mentorships.map((item) => (
              <div key={item.id} className="rounded-md border border-ink/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <b className="text-sm">
                    {item.mentor?.profile?.fullName || item.mentor?.fullName || item.mentorId}
                  </b>
                  <span className={`rounded px-3 py-1 text-xs font-bold ${STATUS_COLORS[item.status?.toUpperCase()] || 'bg-[#eefbfc] text-ink/72'}`}>
                    {MENTORSHIP_STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
                {item.goals && <p className="mt-2 text-sm text-ink/72">{item.goals}</p>}
              </div>
            ))}
            {mentorships.length === 0 && <p className="text-ink/72">{t('cabinet.noMentorships')}</p>}
          </div>
        </Card>
      </section>

      {/* Уведомления */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-bold">{t('cabinet.notifications')}</h2>
            <p className="mt-1 text-sm text-ink/72">
              {t('cabinet.unread')}: <b>{notifications.filter((item) => !item.read).length}</b>
            </p>
          </div>
          <button onClick={markAllNotificationsRead} className="rounded bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-moss/80 transition-colors">
            {t('cabinet.markAllRead')}
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {notifications.slice(0, 8).map((item) => (
            <div key={item.id} className={`rounded-md border p-4 ${item.read ? 'border-ink/10 bg-white' : 'border-gold/50 bg-gold/10'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {!item.read && (
                      <span className="rounded bg-moss px-2 py-0.5 text-xs font-bold text-white">
                        {t('notifications.new')}
                      </span>
                    )}
                    <b className="text-sm">{item.title}</b>
                  </div>
                  <p className="text-sm text-ink/72">{item.message}</p>
                </div>
                {!item.read && (
                  <button onClick={() => markNotificationRead(item.id)} className="rounded bg-moss px-4 py-2 text-xs font-bold text-white hover:bg-moss/90 transition-colors">
                    {t('notifications.markRead')}
                  </button>
                )}
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-ink/72">{t('cabinet.noNotifications')}</p>}
        </div>
      </Card>
    </div>
  )
}
