import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl, uploadFile } from '../uploads'
import { useSEO } from '../hooks/useSEO'

const tabs = ['dashboard', 'site', 'users', 'alumni', 'pending', 'news', 'events', 'documents', 'campaigns', 'companies', 'jobs', 'applications', 'mentorship', 'chat', 'audit', 'import', 'backup']

const roleLabels = {
  GUEST: 'Гость',
  ALUMNI: 'Выпускник',
  MODERATOR: 'Модератор',
  ADMIN: 'Администратор'
}

const statusLabels = {
  ACTIVE: 'Активен',
  BLOCKED: 'Заблокирован',
  DRAFT: 'Черновик',
  PENDING: 'На проверке',
  APPROVED: 'Подтвержден',
  REJECTED: 'Отклонен',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'В архиве',
  CLOSED: 'Закрыта',
  SENT: 'Отправлен',
  VIEWED: 'Просмотрен',
  INVITED: 'Приглашен',
  ACCEPTED: 'Принят',
  upcoming: 'Предстоящее',
  ongoing: 'Идет сейчас',
  past: 'Завершено',
  cancelled: 'Отменено',
  pending: 'Ожидает подтверждения',
  completed: 'Подтверждено',
  rejected: 'Отклонено',
  active: 'Активно',
  resolved: 'Закрыто',
  news: 'Новость',
  event: 'Мероприятие',
  job: 'Вакансия',
  chat: 'Чат',
  campaigns: 'Кампании'
}

const labelRole = (value) => roleLabels[value] || value || 'Не указано'
const labelStatus = (value) => statusLabels[value] || value || 'Не указано'

const alumniPlaceholders = {
  fullName: 'ФИО',
  email: 'Электронная почта',
  password: 'Пароль минимум 8 символов',
  graduationYear: 'Год выпуска',
  specialty: 'Специальность',
  group: 'Группа',
  city: 'Город',
  country: 'Страна',
  company: 'Место работы',
  position: 'Должность',
  phone: 'Телефон'
}

const companyPlaceholders = {
  name: 'Название компании',
  description: 'Описание',
  website: 'Сайт',
  city: 'Город',
  country: 'Страна',
  logoUrl: 'URL логотипа'
}

const jobPlaceholders = {
  type: 'Тип вакансии',
  format: 'Формат работы',
  city: 'Город',
  country: 'Страна',
  salary: 'Зарплата',
  contacts: 'Контакты'
}

const emptyLocalized = () => ({ ru: '', ky: '', en: '' })
const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''
const toIso = (value) => value ? new Date(value).toISOString() : new Date().toISOString()

function Field({ label, children }) {
  return <label className="space-y-2"><span className="text-sm font-bold text-ink/78">{label}</span>{children}</label>
}

function Input(props) {
  return <input {...props} className={`w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss ${props.className || ''}`} />
}

function Textarea(props) {
  return <textarea {...props} className={`w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss ${props.className || ''}`} />
}

function FileInput({ folder, onUploaded, label }) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded border border-ink/20 px-5 py-3 text-sm font-bold text-ink hover:bg-moss/5">
      {uploading ? t('common.loading') : (label || t('admin.uploadFile'))}
      <input
        type="file"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setUploading(true)
          try {
            const uploaded = await uploadFile(file, folder)
            onUploaded(uploaded)
          } finally {
            setUploading(false)
            event.target.value = ''
          }
        }}
      />
    </label>
  )
}

function LocalizedFields({ label, value, onChange, textarea = false }) {
  const Control = textarea ? Textarea : Input
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {['ru', 'ky', 'en'].map((lang) => (
        <Field key={lang} label={`${label} ${lang.toUpperCase()}`}>
          <Control value={value[lang] || ''} rows={textarea ? 5 : undefined} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} required={lang === 'ru'} />
        </Field>
      ))}
    </div>
  )
}

function PublicationStatusField({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <Field label={t('admin.publicationStatus')}>
      <select value={value || 'PUBLISHED'} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss">
        <option value="PUBLISHED">{t('statuses.PUBLISHED')}</option>
        <option value="DRAFT">{t('statuses.DRAFT')}</option>
        <option value="ARCHIVED">{t('statuses.ARCHIVED')}</option>
      </select>
    </Field>
  )
}

export function AdminPage() {
  const { t, i18n } = useTranslation()
  useSEO({ title: t('seo.admin.title') })
  const auth = useAppStore((state) => state)
  const setAuth = useAppStore((state) => state.setAuth)
  const logout = useAppStore((state) => state.logout)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [data, setData] = useState({ analytics: null, site: null, users: [], alumni: [], pending: [], news: [], events: [], documents: [], campaigns: [], donations: [], companies: [], jobs: [], applications: [], mentorships: [], chatReports: [], chatRooms: [], auditLogs: [] })

  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'ALUMNI', status: 'ACTIVE', fullName: '' })
  const [passwordReset, setPasswordReset] = useState({})
  const [showPassword, setShowPassword] = useState({})
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const USER_PAGE_SIZE = 10
  const [siteForm, setSiteForm] = useState({ name: '', parentOrganization: '', website: '', foundedYear: 1931, staffCount: '', studentCount: '', address: '', phonesText: '', email: '', workingHours: '', mission: '', specialtiesText: '', instagram: '', youtube: '', facebook: '' })
  const [newsForm, setNewsForm] = useState({ title: emptyLocalized(), body: emptyLocalized(), imageUrl: '', status: 'PUBLISHED' })
  const [eventForm, setEventForm] = useState({ title: emptyLocalized(), description: emptyLocalized(), startsAt: '', location: '', status: 'upcoming', publicationStatus: 'PUBLISHED' })
  const [documentForm, setDocumentForm] = useState({ title: emptyLocalized(), description: emptyLocalized(), category: 'Финансовые отчеты', fileUrl: '#', fileType: 'PDF', publicationStatus: 'PUBLISHED' })
  const [campaignForm, setCampaignForm] = useState({ title: emptyLocalized(), description: emptyLocalized(), goalAmount: 100000, publicationStatus: 'PUBLISHED' })
  const [companyForm, setCompanyForm] = useState({ name: '', description: '', website: '', city: '', country: 'Кыргызстан', logoUrl: '' })
  const [jobForm, setJobForm] = useState({ title: '', companyId: '', description: '', requirements: '', duties: '', type: 'стажировка', format: 'гибрид', city: 'Бишкек', country: 'Кыргызстан', salary: '', deadline: '', contacts: '' })
  const [alumniForm, setAlumniForm] = useState({ fullName: '', email: '', password: '', graduationYear: new Date().getFullYear(), specialty: '', group: '', city: '', country: 'Кыргызстан', company: '', position: '', phone: '', bio: '', isMentor: false, canHelpStudents: false, isSponsor: false, showEmail: true })
  const labelRoleText = (value) => t(`cabinet.roles.${value}`) || value || t('admin.notSpecified')
  const labelStatusText = (value) => {
    if (!value) return t('admin.notSpecified')
    const admin = t(`admin.statuses.${value}`)
    if (admin !== `admin.statuses.${value}`) return admin
    const common = t(`statuses.${value}`)
    return common !== `statuses.${value}` ? common : value
  }
  const statusBadge = (value) => {
    const text = labelStatusText(value)
    const v = (value || '').toUpperCase()
    const cls = v === 'APPROVED' || v === 'PUBLISHED' || v === 'ACTIVE' || v === 'ACCEPTED'
      ? 'bg-green-100 text-green-700'
      : v === 'PENDING' || v === 'DRAFT' || v === 'SENT' || v === 'VIEWED'
      ? 'bg-amber-100 text-amber-700'
      : v === 'REJECTED' || v === 'BLOCKED'
      ? 'bg-red-100 text-red-700'
      : 'bg-moss/10 text-moss'
    return <span className={`rounded px-2 py-1 text-xs font-bold ${cls}`}>{text}</span>
  }

  const counts = useMemo(() => ({
    alumni: data.alumni.length,
    pending: data.pending.length,
    news: data.news.length,
    events: data.events.length,
    documents: data.documents.length,
    campaigns: data.campaigns.length,
    donations: data.donations.length,
    companies: data.companies.length,
    jobs: data.jobs.length
    ,
    chatReports: data.chatReports.length
  }), [data])

  const loadAll = async () => {
    if (!auth.accessToken || !['ADMIN', 'MODERATOR'].includes(auth.role)) return
    const safe = async (key, request) => {
      try {
        const response = await request()
        setData((prev) => ({ ...prev, [key]: response.data }))
      } catch {
        setData((prev) => ({ ...prev, [key]: [] }))
      }
    }
    await Promise.all([
      safe('pending', () => api.get('/alumni/admin/pending')),
      safe('site', () => api.get('/site')),
      safe('users', () => api.get('/users')),
      safe('analytics', () => api.get('/admin/analytics')),
      safe('alumni', () => api.get('/alumni/admin/all')),
      safe('news', () => api.get('/news/admin/all')),
      safe('events', () => api.get('/events/admin/all')),
      safe('documents', () => api.get('/documents/admin/all')),
      safe('campaigns', () => api.get('/donations/admin/campaigns')),
      safe('donations', () => api.get('/donations/admin/donations')),
      safe('companies', () => api.get('/companies')),
      safe('jobs', () => api.get('/jobs/my')),
      safe('applications', () => api.get('/jobs/applications/my')),
      safe('mentorships', () => api.get('/mentorship/my')),
      safe('chatReports', () => api.get('/chat/reports')),
      safe('chatRooms', () => api.get('/chat/rooms')),
      safe('auditLogs', () => api.get('/admin/audit'))
    ])
  }

  useEffect(() => { loadAll() }, [auth.accessToken])

  useEffect(() => {
    if (!data.site) return
    setSiteForm({
      name: data.site.name || '',
      parentOrganization: data.site.parentOrganization || '',
      website: data.site.website || '',
      foundedYear: data.site.foundedYear || 1931,
      staffCount: data.site.staffCount || '',
      studentCount: data.site.studentCount || '',
      address: data.site.address || '',
      phonesText: (data.site.phones || []).join(', '),
      email: data.site.email || '',
      workingHours: data.site.workingHours || '',
      mission: data.site.mission || '',
      specialtiesText: (data.site.specialties || []).join('\n'),
      instagram: data.site.instagram || '',
      youtube: data.site.youtube || '',
      facebook: data.site.facebook || ''
    })
  }, [data.site])

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await api.post('/auth/login', credentials)
      setAuth({ user: response.data.user, accessToken: response.data.accessToken, refreshToken: response.data.refreshToken })
      setNotice(t('admin.loginSuccess'))
    } catch {
      setError(t('admin.loginError'))
    }
  }

  const run = async (action, success) => {
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(success)
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.error || t('admin.operationFailed'))
    }
  }

  const moderateProfile = (id, status) => run(() => api.post(status === 'APPROVED' ? `/alumni/admin/${id}/approve` : `/alumni/admin/${id}/reject`), 'Статус профиля обновлен')
  const setProfileStatus = (id, status) => run(() => api.patch(`/alumni/admin/${id}/status`, { status }), 'Статус выпускника обновлен')
  const toggleFeatured = (item) => {
    const isFeatured = !item.isFeatured
    if (isFeatured) {
      const featuredTitle = window.prompt('Заголовок для главной (должность / достижение):', item.position || '') ?? ''
      run(() => api.put(`/alumni/admin/${item.id}`, { isFeatured, featuredTitle }), isFeatured ? 'Выпускник добавлен на главную' : 'Выпускник убран с главной')
    } else {
      run(() => api.put(`/alumni/admin/${item.id}`, { isFeatured: false, featuredTitle: '' }), 'Выпускник убран с главной')
    }
  }
  const moderateJob = (id, status) => run(() => api.post(status === 'PUBLISHED' ? `/jobs/${id}/approve` : `/jobs/${id}/reject`), 'Статус вакансии обновлен')
  const setApplicationStatus = (id, status) => run(() => api.patch(`/jobs/applications/${id}/status`, { status }), 'Статус отклика обновлен')
  const setMentorshipStatus = (id, status) => run(() => api.patch(`/mentorship/${id}/status`, { status }), 'Статус менторства обновлен')
  const setDonationStatus = (id, status) => run(() => api.patch(`/donations/admin/donations/${id}/status`, { status }), 'Статус взноса обновлён')
  const deleteChatMessage = (id) => run(() => api.delete(`/chat/messages/${id}`), 'Сообщение удалено')
  const deleteChatRoom = (id, name) => {
    if (!window.confirm(`Удалить комнату «${name}»? Все сообщения в ней останутся в базе, но комната исчезнет из чата.`)) return
    run(() => api.delete(`/chat/rooms/${id}`), `Комната «${name}» удалена`)
  }
  const createChatRoom = (e) => {
    e.preventDefault()
    const name = e.target.roomName.value.trim()
    if (!name) return
    run(() => api.post('/chat/rooms', { name }), `Комната «${name}» создана`)
    e.target.reset()
  }
  const setChatReportStatus = (id, status) => run(() => api.patch(`/chat/reports/${id}/status`, { status }), 'Статус жалобы обновлен')
  const blockUserFromReport = (report) => {
    const authorId = report.message?.authorId
    const authorName = report.message?.author || report.message?.authorEmail || 'этого пользователя'
    if (!authorId) { setError('Не удалось определить автора сообщения'); return }
    if (!window.confirm(`Заблокировать ${authorName}? Это действие нельзя отменить без снятия блокировки вручную.`)) return
    run(async () => {
      await Promise.all([
        api.patch(`/users/${authorId}/status`, { status: 'BLOCKED' }),
        api.patch(`/chat/reports/${report.id}/status`, { status: 'resolved' }),
        report.messageId ? api.delete(`/chat/messages/${report.messageId}`) : Promise.resolve()
      ])
    }, `${authorName} заблокирован, сообщение удалено, жалоба закрыта`)
  }
  const setUserRole = (id, role) => run(() => api.patch(`/users/${id}/role`, { role }), 'Роль обновлена')
  const setUserStatus = (id, status) => run(() => api.patch(`/users/${id}/status`, { status }), status === 'BLOCKED' ? 'Пользователь заблокирован' : 'Пользователь разблокирован')
  const deleteUser = (user) => {
    if (!window.confirm(`Удалить пользователя ${user.email}? Это действие необратимо.`)) return
    run(() => api.delete(`/users/${user.id}`), `Пользователь ${user.email} удалён`)
  }
  const saveUserPassword = (id) => {
    const password = passwordReset[id]
    if (!password || password.length < 8) { setError('Пароль должен быть минимум 8 символов'); return }
    run(() => api.patch(`/users/${id}/password`, { password }), 'Пароль обновлён')
    setPasswordReset((prev) => ({ ...prev, [id]: '' }))
  }
  const generatePassword = (id) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setPasswordReset((prev) => ({ ...prev, [id]: pwd }))
    setShowPassword((prev) => ({ ...prev, [id]: true }))
  }

  const resetEditing = () => setEditing(null)

  const editNews = (item) => {
    setEditing({ type: 'news', id: item.id })
    setNewsForm({ title: item.title || emptyLocalized(), body: item.body || emptyLocalized(), imageUrl: item.imageUrl || '', status: item.status || 'PUBLISHED' })
  }

  const editEvent = (item) => {
    setEditing({ type: 'events', id: item.id })
    setEventForm({ title: item.title || emptyLocalized(), description: item.description || emptyLocalized(), startsAt: toDateInput(item.startsAt), location: item.location || '', status: item.status || 'upcoming', publicationStatus: item.publicationStatus || 'PUBLISHED' })
  }

  const editDocument = (item) => {
    setEditing({ type: 'documents', id: item.id })
    setDocumentForm({ title: item.title || emptyLocalized(), description: item.description || emptyLocalized(), category: item.category || '', fileUrl: item.fileUrl || '#', fileType: item.fileType || 'PDF', publicationStatus: item.publicationStatus || 'PUBLISHED' })
  }

  const editCampaign = (item) => {
    setEditing({ type: 'campaigns', id: item.id })
    setCampaignForm({ title: item.title || emptyLocalized(), description: item.description || emptyLocalized(), goalAmount: Number(item.goalAmount || 0), publicationStatus: item.publicationStatus || 'PUBLISHED' })
  }

  const editCompany = (item) => {
    setEditing({ type: 'companies', id: item.id })
    setCompanyForm({ name: item.name || '', description: item.description || '', website: item.website || '', city: item.city || '', country: item.country || 'Кыргызстан', logoUrl: item.logoUrl || '' })
  }

  const editJob = (item) => {
    setEditing({ type: 'jobs', id: item.id })
    setJobForm({
      title: item.title || '',
      companyId: item.companyId || item.company?.id || '',
      description: item.description || '',
      requirements: item.requirements || '',
      duties: item.duties || '',
      type: item.type || 'стажировка',
      format: item.format || 'гибрид',
      city: item.city || 'Бишкек',
      country: item.country || 'Кыргызстан',
      salary: item.salary || '',
      deadline: toDateInput(item.deadline),
      contacts: item.contacts || ''
    })
  }

  const editAlumni = (item) => {
    setEditing({ type: 'alumni', id: item.id })
    setAlumniForm({
      fullName: item.fullName || '',
      email: item.user?.email || '',
      password: '',
      graduationYear: item.graduationYear || new Date().getFullYear(),
      specialty: item.specialty || '',
      group: item.groupName || '',
      city: item.city || '',
      country: item.country || 'Кыргызстан',
      company: item.company || '',
      position: item.position || '',
      phone: item.phone || '',
      bio: item.bio || '',
      isMentor: Boolean(item.isMentor),
      canHelpStudents: Boolean(item.canHelpStudents),
      isSponsor: Boolean(item.isSponsor),
      showEmail: Boolean(item.showEmail)
    })
  }

  if (!auth.accessToken) {
    return (
      <div className="space-y-6">
        <PageHero>
          <h1 className="font-display text-4xl font-bold">{t('admin.title')}</h1>
          <p className="mt-3 text-white/86">{t('admin.loginDesc')}</p>
        </PageHero>
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('admin.loginTitle')}</h2>
          <form onSubmit={handleLogin} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input value={credentials.email} onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))} placeholder={t('profile.email')} type="email" />
            <Input value={credentials.password} onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))} placeholder={t('cabinet.password')} type="password" />
            <button type="submit" className="rounded bg-moss px-6 py-3 font-bold text-white md:col-span-2">{t('common.signIn')}</button>
          </form>
          {error && <p className="mt-4 text-red-700">{error}</p>}
        </Card>
      </div>
    )
  }

  if (!['ADMIN', 'MODERATOR'].includes(auth.role)) {
    return (
      <div className="space-y-6">
        <PageHero>
          <h1 className="font-display text-4xl font-bold">{t('admin.title')}</h1>
        </PageHero>
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display text-2xl font-bold">{t('admin.accessDenied')}</h2>
          <p className="mt-3 text-ink/65">{t('admin.accessDeniedDesc')}</p>
          <button onClick={logout} className="mt-6 rounded border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-ink/5 transition-colors">
            {t('cabinet.logout')}
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">{t('admin.contentTitle')}</h1>
            <p className="mt-2 text-white/86">{t('admin.contentDesc')}</p>
            <p className="mt-1 text-sm text-white/70">{auth.email} · {labelRoleText(auth.role)}</p>
          </div>
          <button onClick={logout} className="rounded border border-white/45 bg-white/12 px-5 py-3 text-sm font-semibold text-white hover:bg-white/22">{t('cabinet.logout')}</button>
        </div>
      </PageHero>

      {(notice || error) && <Card className={error ? 'border-red-200 bg-red-50' : 'border-moss/20 bg-moss/10'}>{error || notice}</Card>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((key) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded px-4 py-2 text-sm font-bold ${activeTab === key ? 'bg-moss text-white' : 'bg-white/70 text-ink/82'}`}>{t(`admin.tabs.${key}`)}</button>)}
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard analytics={data.analytics} fallbackCounts={counts} />
      )}

      {activeTab === 'site' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Данные колледжа на платформе</h2>
          <p className="mt-2 text-ink/72">Эти данные отображаются на главной странице и используются как официальный профиль БФЭТ. Админ может обновлять их без изменения кода.</p>
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = {
              name: siteForm.name,
              parentOrganization: siteForm.parentOrganization,
              website: siteForm.website,
              foundedYear: Number(siteForm.foundedYear) || 1931,
              staffCount: siteForm.staffCount,
              studentCount: siteForm.studentCount,
              address: siteForm.address,
              phones: siteForm.phonesText.split(',').map((item) => item.trim()).filter(Boolean),
              email: siteForm.email,
              workingHours: siteForm.workingHours,
              mission: siteForm.mission,
              specialties: siteForm.specialtiesText.split('\n').map((item) => item.trim()).filter(Boolean),
              instagram: siteForm.instagram,
              youtube: siteForm.youtube,
              facebook: siteForm.facebook
            }
            run(() => api.put('/site', payload), 'Данные колледжа обновлены')
          }} className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Полное название колледжа"><Input value={siteForm.name} onChange={(e) => setSiteForm((p) => ({ ...p, name: e.target.value }))} required /></Field>
            <Field label="Головная организация"><Input value={siteForm.parentOrganization} onChange={(e) => setSiteForm((p) => ({ ...p, parentOrganization: e.target.value }))} /></Field>
            <Field label="Сайт"><Input value={siteForm.website} onChange={(e) => setSiteForm((p) => ({ ...p, website: e.target.value }))} /></Field>
            <Field label="Год основания"><Input type="number" value={siteForm.foundedYear} onChange={(e) => setSiteForm((p) => ({ ...p, foundedYear: e.target.value }))} /></Field>
            <Field label="Количество сотрудников"><Input value={siteForm.staffCount} onChange={(e) => setSiteForm((p) => ({ ...p, staffCount: e.target.value }))} /></Field>
            <Field label="Количество студентов"><Input value={siteForm.studentCount} onChange={(e) => setSiteForm((p) => ({ ...p, studentCount: e.target.value }))} /></Field>
            <Field label="Адрес"><Input value={siteForm.address} onChange={(e) => setSiteForm((p) => ({ ...p, address: e.target.value }))} /></Field>
            <Field label="Телефоны через запятую"><Input value={siteForm.phonesText} onChange={(e) => setSiteForm((p) => ({ ...p, phonesText: e.target.value }))} /></Field>
            <Field label="Электронная почта"><Input value={siteForm.email} onChange={(e) => setSiteForm((p) => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="Режим работы"><Input value={siteForm.workingHours} onChange={(e) => setSiteForm((p) => ({ ...p, workingHours: e.target.value }))} /></Field>
            <Field label="Instagram (ссылка)"><Input value={siteForm.instagram} onChange={(e) => setSiteForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="https://instagram.com/..." /></Field>
            <Field label="YouTube (ссылка)"><Input value={siteForm.youtube} onChange={(e) => setSiteForm((p) => ({ ...p, youtube: e.target.value }))} placeholder="https://youtube.com/..." /></Field>
            <Field label="Facebook (ссылка)"><Input value={siteForm.facebook} onChange={(e) => setSiteForm((p) => ({ ...p, facebook: e.target.value }))} placeholder="https://facebook.com/..." /></Field>
            <Field label="Миссия"><Textarea value={siteForm.mission} onChange={(e) => setSiteForm((p) => ({ ...p, mission: e.target.value }))} rows={5} className="md:col-span-2" /></Field>
            <Field label="Специальности, каждая с новой строки"><Textarea value={siteForm.specialtiesText} onChange={(e) => setSiteForm((p) => ({ ...p, specialtiesText: e.target.value }))} rows={9} /></Field>
            <div className="flex items-end">
              <button className="w-full rounded bg-moss px-6 py-3 font-bold text-white">Сохранить данные колледжа</button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'users' && (
        <div className="space-y-5">
          <Card>
            <h2 className="font-display text-3xl font-bold">Управление пользователями</h2>
            <p className="mt-2 text-ink/72">Назначайте роли, сбрасывайте пароли, блокируйте и удаляйте пользователей.</p>
            {auth.role !== 'ADMIN' && <div className="mt-5 rounded-md bg-red-50 p-4 font-semibold text-red-800">Этот раздел доступен только главному администратору.</div>}
            {auth.role === 'ADMIN' && (
              <form onSubmit={(e) => {
                e.preventDefault()
                run(() => api.post('/users', userForm), 'Пользователь создан')
                setUserForm({ email: '', password: '', role: 'ALUMNI', status: 'ACTIVE', fullName: '' })
              }} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="Электронная почта" type="email" required />
                <Input value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} placeholder="Пароль (мин. 8 символов)" required />
                <Input value={userForm.fullName} onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="ФИО (если выпускник)" />
                <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))} className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss">
                  <option value="ALUMNI">Выпускник</option>
                  <option value="MODERATOR">Модератор</option>
                  <option value="ADMIN">Администратор</option>
                </select>
                <button className="rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/80 transition-colors">+ Создать</button>
              </form>
            )}
          </Card>

          {auth.role === 'ADMIN' && (() => {
            const q = userSearch.trim().toLowerCase()
            const filtered = q
              ? data.users.filter((u) => u.email.toLowerCase().includes(q) || (u.profile?.fullName || '').toLowerCase().includes(q))
              : data.users
            const totalPages = Math.ceil(filtered.length / USER_PAGE_SIZE)
            const page = Math.min(userPage, totalPages || 1)
            const paged = filtered.slice((page - 1) * USER_PAGE_SIZE, page * USER_PAGE_SIZE)

            return (
              <Card>
                {/* Шапка: поиск + счётчик */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="relative flex-1 min-w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
                    <input
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
                      placeholder="Поиск по имени или email"
                      className="w-full rounded-md border border-ink/10 bg-white pl-9 pr-4 py-2.5 text-sm outline-none focus:border-moss"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink/50">{filtered.length} пользователей</span>
                    <select
                      value={USER_PAGE_SIZE}
                      className="rounded-md border border-ink/10 bg-white px-3 py-2 text-sm outline-none"
                      disabled
                    >
                      <option>{USER_PAGE_SIZE}</option>
                    </select>
                  </div>
                </div>

                {/* Таблица */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[800px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#8edfe7] bg-[#eefbfc]">
                        <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-ink/50 w-10">№</th>
                        <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-ink/50">Пользователь</th>
                        <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-ink/50">Роль</th>
                        <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-ink/50">Статус</th>
                        <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-ink/50">Пароль</th>
                        <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-ink/50">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/6">
                      {paged.map((item, idx) => (
                        <tr key={item.id} className={`transition-colors hover:bg-[#f5fdff] ${item.status === 'BLOCKED' ? 'opacity-60' : ''}`}>
                          <td className="px-3 py-3 text-ink/40 font-semibold">{(page - 1) * USER_PAGE_SIZE + idx + 1}</td>
                          <td className="px-3 py-3">
                            <p className="font-bold text-ink leading-tight">{item.profile?.fullName || '—'}</p>
                            <p className="text-xs text-ink/50 mt-0.5">{item.email}</p>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={item.role}
                              onChange={(e) => setUserRole(item.id, e.target.value)}
                              className="rounded border border-ink/15 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-moss"
                            >
                              <option value="ALUMNI">Выпускник</option>
                              <option value="MODERATOR">Модератор</option>
                              <option value="ADMIN">Администратор</option>
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`rounded px-2 py-1 text-xs font-bold ${item.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-moss/10 text-moss'}`}>
                              {item.status === 'BLOCKED' ? 'Заблокирован' : 'Активен'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <input
                                  type={showPassword[item.id] ? 'text' : 'password'}
                                  value={passwordReset[item.id] || ''}
                                  onChange={(e) => setPasswordReset((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                  placeholder="Новый пароль"
                                  className="w-32 rounded border border-ink/15 bg-white px-2 py-1.5 text-xs outline-none focus:border-moss pr-6"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((p) => ({ ...p, [item.id]: !p[item.id] }))}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/80 text-xs"
                                  title={showPassword[item.id] ? 'Скрыть' : 'Показать'}
                                >
                                  {showPassword[item.id] ? '🙈' : '👁'}
                                </button>
                              </div>
                              <button
                                onClick={() => generatePassword(item.id)}
                                className="rounded bg-[#eefbfc] border border-[#8edfe7] p-1.5 text-moss hover:bg-moss/10 transition-colors"
                                title="Сгенерировать пароль"
                              >
                                🔀
                              </button>
                              <button
                                onClick={() => saveUserPassword(item.id)}
                                disabled={!passwordReset[item.id]}
                                className="rounded bg-moss p-1.5 text-white hover:bg-moss/80 disabled:opacity-30 transition-colors"
                                title="Сохранить пароль"
                              >
                                💾
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {item.status === 'BLOCKED' ? (
                                <button
                                  onClick={() => setUserStatus(item.id, 'ACTIVE')}
                                  className="rounded bg-moss/10 border border-moss/30 px-2.5 py-1.5 text-xs font-bold text-moss hover:bg-moss/20 transition-colors"
                                  title="Разблокировать"
                                >
                                  ✓ Разблок.
                                </button>
                              ) : (
                                <button
                                  onClick={() => setUserStatus(item.id, 'BLOCKED')}
                                  className="rounded bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                                  title="Заблокировать"
                                >
                                  🚫 Блок.
                                </button>
                              )}
                              <button
                                onClick={() => deleteUser(item)}
                                className="rounded bg-red-50 border border-red-200 p-1.5 text-red-700 hover:bg-red-100 transition-colors"
                                title="Удалить пользователя"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paged.length === 0 && (
                    <p className="py-8 text-center text-sm text-ink/50">{userSearch ? 'Пользователей не найдено.' : 'Нет пользователей.'}</p>
                  )}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-2">
                    <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="rounded border border-ink/15 px-3 py-1.5 text-sm font-bold text-ink disabled:opacity-30 hover:bg-moss/5 transition-colors">← Назад</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setUserPage(n)}
                        className={`rounded border px-3 py-1.5 text-sm font-bold transition-colors ${n === page ? 'border-moss bg-moss text-white' : 'border-ink/15 text-ink hover:bg-moss/5'}`}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="rounded border border-ink/15 px-3 py-1.5 text-sm font-bold text-ink disabled:opacity-30 hover:bg-moss/5 transition-colors">Вперёд →</button>
                  </div>
                )}
              </Card>
            )
          })()}
        </div>
      )}

      {activeTab === 'alumni' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Выпускники</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = {
              ...alumniForm,
              graduationYear: Number(alumniForm.graduationYear),
              groupName: alumniForm.group
            }
            const action = editing?.type === 'alumni'
              ? () => api.put(`/alumni/admin/${editing.id}`, payload)
              : () => api.post('/alumni/register', payload)
            run(action, editing?.type === 'alumni' ? 'Профиль выпускника обновлен' : 'Выпускник добавлен в заявки')
            if (editing?.type === 'alumni') resetEditing()
            setAlumniForm({ fullName: '', email: '', password: '', graduationYear: new Date().getFullYear(), specialty: '', group: '', city: '', country: 'Кыргызстан', company: '', position: '', phone: '', bio: '', isMentor: false, showEmail: true })
          }} className="mt-6 grid gap-3 md:grid-cols-2">
            {['fullName', 'email', 'password', 'graduationYear', 'specialty', 'group', 'city', 'country', 'company', 'position', 'phone'].map((key) => (
              <Input key={key} value={alumniForm[key]} type={key === 'email' ? 'email' : key === 'password' ? 'password' : key === 'graduationYear' ? 'number' : 'text'} onChange={(e) => setAlumniForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={alumniPlaceholders[key] || key} required={['fullName', 'email', 'graduationYear'].includes(key) || (!editing && key === 'password')} />
            ))}
            <Textarea value={alumniForm.bio} onChange={(e) => setAlumniForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Биография" className="md:col-span-2" />
            <div className="flex flex-wrap gap-4 md:col-span-2">
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={alumniForm.isMentor} onChange={(e) => setAlumniForm((p) => ({ ...p, isMentor: e.target.checked }))} /> Ментор</label>
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={alumniForm.canHelpStudents} onChange={(e) => setAlumniForm((p) => ({ ...p, canHelpStudents: e.target.checked }))} /> Помогает студентам</label>
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={alumniForm.isSponsor} onChange={(e) => setAlumniForm((p) => ({ ...p, isSponsor: e.target.checked }))} /> Спонсор</label>
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={alumniForm.showEmail} onChange={(e) => setAlumniForm((p) => ({ ...p, showEmail: e.target.checked }))} /> Показывать email</label>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'alumni' ? 'Сохранить выпускника' : 'Добавить выпускника'}</button>
              {editing?.type === 'alumni' && <button type="button" onClick={() => { resetEditing(); setAlumniForm({ fullName: '', email: '', password: '', graduationYear: new Date().getFullYear(), specialty: '', group: '', city: '', country: 'Кыргызстан', company: '', position: '', phone: '', bio: '', isMentor: false, canHelpStudents: false, isSponsor: false, showEmail: true }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.alumni} render={(item) => (
            <>
              <div className="flex items-center gap-3">
                {item.photoUrl
                  ? <img src={toAbsoluteUploadUrl(item.photoUrl)} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                  : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">{item.fullName?.[0]}</div>
                }
                <div>
                  <b className="flex items-center gap-1">{item.fullName} {item.isFeatured && <span title="На главной">⭐</span>}</b>
                  <p className="text-xs text-ink/72">{item.graduationYear} · {item.specialty} · {item.user?.email}</p>
                </div>
              </div>
              {statusBadge(item.status)}
              <button onClick={() => editAlumni(item)} className="text-moss">Редактировать</button>
              <button
                onClick={() => toggleFeatured(item)}
                className={item.isFeatured ? 'text-amber-600 font-bold' : 'text-ink/60'}
                title={item.isFeatured ? 'Убрать с главной' : 'Добавить на главную'}
              >
                {item.isFeatured ? '⭐ На главной' : '☆ На главную'}
              </button>
              <button onClick={() => setProfileStatus(item.id, 'APPROVED')} className="text-moss">Опубликовать</button>
              <button onClick={() => setProfileStatus(item.id, 'BLOCKED')} className="text-red-700">Заблокировать</button>
            </>
          )} />
        </Card>
      )}

      {activeTab === 'pending' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Заявки выпускников</h2>
          <div className="mt-5 space-y-4">
            {data.pending.map((item) => <div key={item.id} className="rounded-md border border-ink/10 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-xl font-bold">{item.fullName}</h3><p className="text-ink/72">{item.graduationYear} · {item.specialty} · {item.city}</p></div><div className="flex gap-2"><button onClick={() => moderateProfile(item.id, 'APPROVED')} className="rounded bg-moss px-4 py-2 font-bold text-white">Подтвердить</button><button onClick={() => moderateProfile(item.id, 'REJECTED')} className="rounded border border-red-300 px-4 py-2 font-bold text-red-700">Отклонить</button></div></div></div>)}
            {data.pending.length === 0 && <p className="text-ink/72">Нет заявок.</p>}
          </div>
        </Card>
      )}

      {activeTab === 'news' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Новости</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const action = editing?.type === 'news' ? () => api.put(`/news/${editing.id}`, newsForm) : () => api.post('/news', newsForm)
            run(action, editing?.type === 'news' ? 'Новость обновлена' : 'Новость добавлена')
            resetEditing()
            setNewsForm({ title: emptyLocalized(), body: emptyLocalized(), imageUrl: '', status: 'PUBLISHED' })
          }} className="mt-6 space-y-4">
            <LocalizedFields label="Заголовок" value={newsForm.title} onChange={(title) => setNewsForm((p) => ({ ...p, title }))} />
            <LocalizedFields label="Текст" value={newsForm.body} onChange={(body) => setNewsForm((p) => ({ ...p, body }))} textarea />
            <div className="flex flex-wrap items-center gap-3">
              <Input value={newsForm.imageUrl} onChange={(e) => setNewsForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="URL фото или загрузите файл" className="flex-1" />
              <FileInput folder="images" label="Загрузить фото" onUploaded={(file) => setNewsForm((p) => ({ ...p, imageUrl: file.url }))} />
            </div>
            <Field label="Статус публикации">
              <select value={newsForm.status} onChange={(e) => setNewsForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss">
                <option value="PUBLISHED">Опубликовано</option>
                <option value="DRAFT">Черновик</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </Field>
            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'news' ? 'Сохранить новость' : 'Добавить новость'}</button>
              {editing?.type === 'news' && <button type="button" onClick={() => { resetEditing(); setNewsForm({ title: emptyLocalized(), body: emptyLocalized(), imageUrl: '', status: 'PUBLISHED' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.news} render={(item) => <><b>{getLocalized(item.title)}</b><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatusText(item.status || 'PUBLISHED')}</span><button onClick={() => editNews(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/news/${item.id}`, { status: (item.status || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус новости обновлен')} className="text-ink/72">{(item.status || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/news/${item.id}`), 'Новость удалена')} className="text-red-700">Удалить</button></>} />
        </Card>
      )}

      {activeTab === 'events' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Мероприятия</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = { ...eventForm, startsAt: toIso(eventForm.startsAt) }
            const action = editing?.type === 'events' ? () => api.put(`/events/${editing.id}`, payload) : () => api.post('/events', payload)
            run(action, editing?.type === 'events' ? 'Мероприятие обновлено' : 'Мероприятие добавлено')
            resetEditing()
            setEventForm({ title: emptyLocalized(), description: emptyLocalized(), startsAt: '', location: '', status: 'upcoming', publicationStatus: 'PUBLISHED' })
          }} className="mt-6 space-y-4">
            <LocalizedFields label="Название" value={eventForm.title} onChange={(title) => setEventForm((p) => ({ ...p, title }))} />
            <LocalizedFields label="Описание" value={eventForm.description} onChange={(description) => setEventForm((p) => ({ ...p, description }))} textarea />
            <div className="grid gap-3 md:grid-cols-3"><Input type="datetime-local" value={eventForm.startsAt} onChange={(e) => setEventForm((p) => ({ ...p, startsAt: e.target.value }))} /><Input value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} placeholder="Место" /><select value={eventForm.status} onChange={(e) => setEventForm((p) => ({ ...p, status: e.target.value }))} className="rounded-md border border-ink/10 bg-white px-4 py-3"><option value="upcoming">Предстоящее</option><option value="past">Завершенное</option><option value="cancelled">Отмененное</option></select></div>
            <PublicationStatusField value={eventForm.publicationStatus} onChange={(publicationStatus) => setEventForm((p) => ({ ...p, publicationStatus }))} />
            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'events' ? 'Сохранить мероприятие' : 'Добавить мероприятие'}</button>
              {editing?.type === 'events' && <button type="button" onClick={() => { resetEditing(); setEventForm({ title: emptyLocalized(), description: emptyLocalized(), startsAt: '', location: '', status: 'upcoming', publicationStatus: 'PUBLISHED' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.events} render={(item) => <><b>{getLocalized(item.title)}</b><span>{toDateInput(item.startsAt)}</span><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatusText(item.publicationStatus || 'PUBLISHED')}</span><button onClick={() => editEvent(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/events/${item.id}`, { publicationStatus: (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус мероприятия обновлен')} className="text-ink/72">{(item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/events/${item.id}`), 'Мероприятие удалено')} className="text-red-700">Удалить</button></>} />
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Документы</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const action = editing?.type === 'documents' ? () => api.put(`/documents/${editing.id}`, documentForm) : () => api.post('/documents', documentForm)
            run(action, editing?.type === 'documents' ? 'Документ обновлен' : 'Документ добавлен')
            resetEditing()
            setDocumentForm({ title: emptyLocalized(), description: emptyLocalized(), category: 'Финансовые отчеты', fileUrl: '#', fileType: 'PDF', publicationStatus: 'PUBLISHED' })
          }} className="mt-6 space-y-4">
            <LocalizedFields label="Название" value={documentForm.title} onChange={(title) => setDocumentForm((p) => ({ ...p, title }))} />
            <LocalizedFields label="Описание" value={documentForm.description} onChange={(description) => setDocumentForm((p) => ({ ...p, description }))} textarea />
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={documentForm.category} onChange={(e) => setDocumentForm((p) => ({ ...p, category: e.target.value }))} placeholder="Категория" />
              <Input value={documentForm.fileType} onChange={(e) => setDocumentForm((p) => ({ ...p, fileType: e.target.value }))} placeholder="PDF / DOCX / XLSX" />
            </div>

            {/* Загрузка файла */}
            <div className="rounded-md border-2 border-dashed border-ink/20 bg-[#f8fdfe] p-5 transition-colors hover:border-moss/40">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-white text-2xl ring-1 ring-ink/10">
                  {documentForm.fileUrl && documentForm.fileUrl !== '#' ? '📄' : '📁'}
                </div>
                <div className="min-w-0 flex-1">
                  {documentForm.fileUrl && documentForm.fileUrl !== '#' ? (
                    <div className="space-y-1">
                      <p className="truncate text-sm font-bold text-ink">{documentForm.fileUrl.split('/').pop()}</p>
                      <p className="text-xs text-ink/50">{documentForm.fileType} · загружен</p>
                      <a href={toAbsoluteUploadUrl(documentForm.fileUrl)} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold text-moss hover:underline">Открыть файл ↗</a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-ink">Файл не выбран</p>
                      <p className="text-xs text-ink/45">PDF, DOCX, XLSX — до 10 МБ</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <FileInput folder="documents" label="📁 Загрузить с компьютера"
                    onUploaded={(file) => setDocumentForm((p) => ({
                      ...p,
                      fileUrl: file.url,
                      fileType: file.originalName.split('.').pop()?.toUpperCase() || p.fileType
                    }))}
                  />
                  {documentForm.fileUrl && documentForm.fileUrl !== '#' && (
                    <button type="button" onClick={() => setDocumentForm((p) => ({ ...p, fileUrl: '#' }))}
                      className="rounded border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                      Удалить файл
                    </button>
                  )}
                </div>
              </div>
              {/* Ввод URL вручную */}
              <div className="mt-3 border-t border-ink/10 pt-3">
                <p className="mb-1.5 text-xs font-semibold text-ink/45">или вставьте ссылку на файл</p>
                <Input value={documentForm.fileUrl === '#' ? '' : documentForm.fileUrl}
                  onChange={(e) => setDocumentForm((p) => ({ ...p, fileUrl: e.target.value || '#' }))}
                  placeholder="https://bfetassociation.kg/document.pdf" />
              </div>
            </div>
            <PublicationStatusField value={documentForm.publicationStatus} onChange={(publicationStatus) => setDocumentForm((p) => ({ ...p, publicationStatus }))} />
            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'documents' ? 'Сохранить документ' : 'Добавить документ'}</button>
              {editing?.type === 'documents' && <button type="button" onClick={() => { resetEditing(); setDocumentForm({ title: emptyLocalized(), description: emptyLocalized(), category: 'Финансовые отчеты', fileUrl: '#', fileType: 'PDF', publicationStatus: 'PUBLISHED' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.documents} render={(item) => <><b>{getLocalized(item.title)}</b><span>{item.category}</span><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatusText(item.publicationStatus || 'PUBLISHED')}</span><button onClick={() => editDocument(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/documents/${item.id}`, { publicationStatus: (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус документа обновлен')} className="text-ink/72">{(item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/documents/${item.id}`), 'Документ удален')} className="text-red-700">Удалить</button></>} />
        </Card>
      )}

      {activeTab === 'campaigns' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Кампании поддержки</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = { ...campaignForm, goalAmount: Number(campaignForm.goalAmount) }
            const action = editing?.type === 'campaigns' ? () => api.put(`/donations/campaigns/${editing.id}`, payload) : () => api.post('/donations/campaigns', payload)
            run(action, editing?.type === 'campaigns' ? 'Кампания обновлена' : 'Кампания добавлена')
            resetEditing()
            setCampaignForm({ title: emptyLocalized(), description: emptyLocalized(), goalAmount: 100000, publicationStatus: 'PUBLISHED' })
          }} className="mt-6 space-y-4">
            <LocalizedFields label="Название" value={campaignForm.title} onChange={(title) => setCampaignForm((p) => ({ ...p, title }))} />
            <LocalizedFields label="Описание" value={campaignForm.description} onChange={(description) => setCampaignForm((p) => ({ ...p, description }))} textarea />
            <Input type="number" value={campaignForm.goalAmount} onChange={(e) => setCampaignForm((p) => ({ ...p, goalAmount: e.target.value }))} placeholder="Цель сбора" />
            <PublicationStatusField value={campaignForm.publicationStatus} onChange={(publicationStatus) => setCampaignForm((p) => ({ ...p, publicationStatus }))} />
            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'campaigns' ? 'Сохранить кампанию' : 'Добавить кампанию'}</button>
              {editing?.type === 'campaigns' && <button type="button" onClick={() => { resetEditing(); setCampaignForm({ title: emptyLocalized(), description: emptyLocalized(), goalAmount: 100000, publicationStatus: 'PUBLISHED' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.campaigns} render={(item) => <><b>{getLocalized(item.title)}</b><span>{Number(item.raisedAmount).toLocaleString()} / {Number(item.goalAmount).toLocaleString()} KGS</span><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatusText(item.publicationStatus || 'PUBLISHED')}</span><button onClick={() => editCampaign(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/donations/campaigns/${item.id}`, { publicationStatus: (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус кампании обновлен')} className="text-ink/72">{(item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/donations/campaigns/${item.id}`), 'Кампания удалена')} className="text-red-700">Удалить</button></>} />
          <h3 className="mt-8 text-2xl font-bold">Взносы на подтверждение</h3>
          <List items={data.donations} render={(item) => (
            <>
              <div>
                <b>{item.anonymous ? 'Анонимно' : item.donorName || 'Донор'}</b>
                <p className="text-ink/72">{getLocalized(item.campaignTitle || item.campaign?.title)} · {Number(item.amount).toLocaleString()} KGS</p>
              </div>
              {statusBadge(item.status || 'pending')}
              {item.id && <button onClick={() => setDonationStatus(item.id, 'completed')} className="text-moss">Подтвердить</button>}
              {item.id && <button onClick={() => setDonationStatus(item.id, 'rejected')} className="text-red-700">Отклонить</button>}
            </>
          )} />
        </Card>
      )}

      {activeTab === 'companies' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Компании</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const action = editing?.type === 'companies' ? () => api.put(`/companies/${editing.id}`, companyForm) : () => api.post('/companies', companyForm)
            run(action, editing?.type === 'companies' ? 'Компания обновлена' : 'Компания добавлена')
            resetEditing()
            setCompanyForm({ name: '', description: '', website: '', city: '', country: 'Кыргызстан', logoUrl: '' })
          }} className="mt-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(companyForm).filter(([key]) => key !== 'logoUrl').map(([key, value]) => (
                <Input key={key} value={value} onChange={(e) => setCompanyForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={companyPlaceholders[key] || key} required={key === 'name'} />
              ))}
            </div>

            {/* Загрузка логотипа */}
            <div className="flex flex-wrap items-center gap-4 rounded-md border border-ink/10 bg-[#f8fdfe] p-4">
              {companyForm.logoUrl ? (
                <img src={toAbsoluteUploadUrl(companyForm.logoUrl)} alt="Логотип" className="h-16 w-16 rounded-md object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-dashed border-ink/20 bg-white text-2xl text-ink/30">🏢</div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-widest text-ink/45">Логотип компании</span>
                <div className="flex flex-wrap gap-2">
                  <FileInput folder="logos" label="📁 Загрузить с компьютера" onUploaded={(file) => setCompanyForm((p) => ({ ...p, logoUrl: file.url }))} />
                  {companyForm.logoUrl && (
                    <button type="button" onClick={() => setCompanyForm((p) => ({ ...p, logoUrl: '' }))}
                      className="rounded border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                      Удалить лого
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'companies' ? 'Сохранить компанию' : 'Добавить компанию'}</button>
              {editing?.type === 'companies' && <button type="button" onClick={() => { resetEditing(); setCompanyForm({ name: '', description: '', website: '', city: '', country: 'Кыргызстан', logoUrl: '' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.companies} render={(item) => <>
            <div className="flex items-center gap-3">
              {item.logoUrl
                ? <img src={toAbsoluteUploadUrl(item.logoUrl)} alt={item.name} className="h-10 w-10 rounded-md object-contain" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#eefbfc] text-lg">🏢</div>
              }
              <b>{item.name}</b>
            </div>
            <span>{item.city}, {item.country}</span>
            <button onClick={() => editCompany(item)} className="text-moss">Редактировать</button>
            <button onClick={() => run(() => api.delete(`/companies/${item.id}`), 'Компания удалена')} className="text-red-700">Удалить</button>
          </>} />
        </Card>
      )}

      {activeTab === 'jobs' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Вакансии</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = { ...jobForm, deadline: toIso(jobForm.deadline), companyId: jobForm.companyId || undefined }
            const action = editing?.type === 'jobs' ? () => api.put(`/jobs/${editing.id}`, payload) : () => api.post('/jobs', payload)
            run(action, editing?.type === 'jobs' ? 'Вакансия обновлена' : 'Вакансия добавлена')
            resetEditing()
            setJobForm({ title: '', companyId: '', description: '', requirements: '', duties: '', type: 'стажировка', format: 'гибрид', city: 'Бишкек', country: 'Кыргызстан', salary: '', deadline: '', contacts: '' })
          }} className="mt-6 grid gap-3 md:grid-cols-2">
            <Input value={jobForm.title} onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))} placeholder="Название" required />
            <select value={jobForm.companyId} onChange={(e) => setJobForm((p) => ({ ...p, companyId: e.target.value }))} className="rounded-md border border-ink/10 bg-white px-4 py-3"><option value="">Без компании</option>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            {['type', 'format', 'city', 'country', 'salary', 'contacts'].map((key) => <Input key={key} value={jobForm[key]} onChange={(e) => setJobForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={jobPlaceholders[key] || key} />)}
            <Input type="datetime-local" value={jobForm.deadline} onChange={(e) => setJobForm((p) => ({ ...p, deadline: e.target.value }))} />
            <Textarea value={jobForm.description} onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))} placeholder="Описание" required className="md:col-span-2" />
            <Textarea value={jobForm.requirements} onChange={(e) => setJobForm((p) => ({ ...p, requirements: e.target.value }))} placeholder="Требования" />
            <Textarea value={jobForm.duties} onChange={(e) => setJobForm((p) => ({ ...p, duties: e.target.value }))} placeholder="Обязанности" />
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'jobs' ? 'Сохранить вакансию' : 'Добавить вакансию'}</button>
              {editing?.type === 'jobs' && <button type="button" onClick={() => { resetEditing(); setJobForm({ title: '', companyId: '', description: '', requirements: '', duties: '', type: 'стажировка', format: 'гибрид', city: 'Бишкек', country: 'Кыргызстан', salary: '', deadline: '', contacts: '' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.jobs} render={(item) => <><b>{item.title}</b><span>{labelStatusText(item.status)}</span><button onClick={() => editJob(item)} className="text-moss">Редактировать</button><button onClick={() => moderateJob(item.id, 'PUBLISHED')} className="text-moss">Опубликовать</button><button onClick={() => run(() => api.post(`/jobs/${item.id}/close`), 'Вакансия закрыта')} className="text-ink/72">Закрыть</button><button onClick={() => moderateJob(item.id, 'REJECTED')} className="text-red-700">Отклонить</button><button onClick={() => run(() => api.delete(`/jobs/${item.id}`), 'Вакансия удалена')} className="text-red-700">Удалить</button></>} />
        </Card>
      )}

      {activeTab === 'applications' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Отклики на вакансии</h2>
          <List items={data.applications} render={(item) => (
            <>
              <div>
                <b>{item.job?.title || item.jobId}</b>
                <p className="text-ink/72">{item.user?.profile?.fullName || item.user?.email || item.userId}</p>
                {item.cvUrl && <a href={toAbsoluteUploadUrl(item.cvUrl)} target="_blank" rel="noreferrer" className="text-moss">Резюме</a>}
              </div>
              {statusBadge(item.status)}
              {['VIEWED', 'INVITED', 'ACCEPTED', 'REJECTED'].map((status) => <button key={status} onClick={() => setApplicationStatus(item.id, status)} className={status === 'REJECTED' ? 'text-red-700' : 'text-moss'}>{labelStatusText(status)}</button>)}
            </>
          )} />
        </Card>
      )}

      {activeTab === 'mentorship' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Запросы менторства</h2>
          <List items={data.mentorships} render={(item) => (
            <>
              <div>
                <b>{item.mentor?.fullName || item.mentor?.profile?.fullName || item.mentorId}</b>
                <p className="text-ink/72">Студент: {item.student?.fullName || item.student?.profile?.fullName || item.studentId}</p>
                <p className="text-ink/72">{item.goals}</p>
              </div>
              {statusBadge(item.status)}
              <button onClick={() => setMentorshipStatus(item.id, 'active')} className="text-moss">Принять</button>
              <button onClick={() => setMentorshipStatus(item.id, 'completed')} className="text-ink/72">Завершить</button>
              <button onClick={() => setMentorshipStatus(item.id, 'rejected')} className="text-red-700">Отклонить</button>
            </>
          )} />
        </Card>
      )}

      {activeTab === 'chat' && (
        <>
        {/* Управление комнатами */}
        <Card>
          <h2 className="font-display text-3xl font-bold">Комнаты чата</h2>
          <form onSubmit={createChatRoom} className="mt-4 flex gap-3">
            <input
              name="roomName"
              placeholder="Название новой комнаты"
              className="flex-1 rounded-md border border-ink/10 bg-white px-4 py-2.5 outline-none focus:border-moss"
              required
            />
            <button className="rounded bg-moss px-5 py-2.5 font-bold text-white hover:bg-moss/80 transition-colors">
              + Создать
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {data.chatRooms.length === 0 && <p className="text-ink/72 text-sm">Комнат нет.</p>}
            {data.chatRooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between rounded-md border border-ink/10 bg-white px-4 py-3">
                <div>
                  <span className="font-semibold">{room.name}</span>
                  {room.type && room.type !== 'custom' && (
                    <span className="ml-2 text-xs text-ink/50">[{room.type}]</span>
                  )}
                </div>
                <button
                  onClick={() => deleteChatRoom(room.id, room.name)}
                  className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-3xl font-bold">Модерация чата</h2>
          <p className="mt-2 text-ink/72">Жалобы пользователей на сообщения. Заблокированный пользователь не сможет войти на платформу.</p>
          {data.chatReports.length === 0 && <p className="mt-6 text-ink/72">Жалоб нет.</p>}
          <Paginated items={data.chatReports} pageSize={10}>
            {(paged) => <div className="mt-6 space-y-4">{paged.map((item) => (
              <div key={item.id} className="rounded-lg border border-ink/10 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{item.reason}</p>
                    <p className="text-sm text-ink/60 mt-0.5">
                      Комната: <b>{item.roomId}</b> · Жалоба от: <b>{item.reporterEmail}</b>
                    </p>
                    {(item.message?.author || item.message?.authorEmail) && (
                      <p className="text-sm text-ink/60">
                        Автор: <b className="text-red-700">{item.message.author}{item.message.authorEmail ? ` (${item.message.authorEmail})` : ''}</b>
                      </p>
                    )}
                  </div>
                  {statusBadge(item.status)}
                </div>

                <div className="rounded-md bg-[#eefbfc] px-3 py-2 text-sm text-ink/82 italic">
                  {item.message?.text || '(сообщение удалено)'}
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.messageId && item.message && !item.message.deleted && (
                    <button
                      onClick={() => deleteChatMessage(item.messageId)}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                    >
                      Удалить сообщение
                    </button>
                  )}
                  {item.status !== 'resolved' && (
                    <button
                      onClick={() => setChatReportStatus(item.id, 'resolved')}
                      className="rounded border border-moss/30 bg-moss/5 px-3 py-1.5 text-xs font-bold text-moss hover:bg-moss/10 transition-colors"
                    >
                      Закрыть жалобу
                    </button>
                  )}
                  {item.status !== 'rejected' && item.status !== 'resolved' && (
                    <button
                      onClick={() => setChatReportStatus(item.id, 'rejected')}
                      className="rounded border border-ink/15 bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink/60 hover:bg-ink/10 transition-colors"
                    >
                      Отклонить жалобу
                    </button>
                  )}
                  {auth.role === 'ADMIN' && item.message?.authorId && item.status !== 'resolved' && (
                    <button
                      onClick={() => blockUserFromReport(item)}
                      className="rounded border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700 transition-colors"
                    >
                      Заблокировать автора + удалить
                    </button>
                  )}
                </div>
              </div>
            ))}</div>}
          </Paginated>
        </Card>
        </>
      )}

      {activeTab === 'audit' && <AuditLog logs={data.auditLogs} auth={auth} />}

      {activeTab === 'import' && <ImportExport auth={auth} />}

      {activeTab === 'backup' && <BackupManager auth={auth} />}
    </div>
  )
}

function Pager({ page, total, setPage, itemCount, pageSize }) {
  if (total <= 1) return null
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, itemCount)
  const delta = 2
  const pages = []
  for (let i = Math.max(0, page - delta); i <= Math.min(total - 1, page + delta); i++) pages.push(i)
  const btn = (label, onClick, disabled, active) => (
    <button onClick={onClick} disabled={disabled}
      className={`rounded px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-30 ${active ? 'bg-moss text-white' : 'text-ink/70 hover:bg-moss/10'}`}>
      {label}
    </button>
  )
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4">
      <span className="text-xs text-ink/45">{from}–{to} из {itemCount}</span>
      <div className="flex flex-wrap items-center gap-0.5">
        {btn('‹', () => setPage(p => Math.max(0, p - 1)), page === 0, false)}
        {pages[0] > 0 && <>{btn('1', () => setPage(0), false, false)}{pages[0] > 1 && <span className="px-1 text-ink/40 text-sm">…</span>}</>}
        {pages.map(i => btn(i + 1, () => setPage(i), false, page === i))}
        {pages[pages.length - 1] < total - 1 && <><span className="px-1 text-ink/40 text-sm">…</span>{btn(total, () => setPage(total - 1), false, false)}</>}
        {btn('›', () => setPage(p => Math.min(total - 1, p + 1)), page === total - 1, false)}
      </div>
    </div>
  )
}

function Paginated({ items, children, pageSize = 10 }) {
  const [page, setPage] = useState(0)
  const total = Math.ceil((items.length || 1) / pageSize)
  const paged = items.slice(page * pageSize, (page + 1) * pageSize)
  useEffect(() => { setPage(0) }, [items.length])
  return (
    <>
      {children(paged)}
      <Pager page={page} total={total} setPage={setPage} itemCount={items.length} pageSize={pageSize} />
    </>
  )
}

function List({ items, render, pageSize = 10 }) {
  const [page, setPage] = useState(0)
  const total = Math.ceil((items.length || 1) / pageSize)
  const paged = items.slice(page * pageSize, (page + 1) * pageSize)
  useEffect(() => { setPage(0) }, [items.length])
  return (
    <div className="mt-6">
      <div className="space-y-3">
        {paged.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-4 text-sm">{render(item)}</div>)}
        {items.length === 0 && <p className="text-ink/72">Нет данных.</p>}
      </div>
      <Pager page={page} total={total} setPage={setPage} itemCount={items.length} pageSize={pageSize} />
    </div>
  )
}

function Dashboard({ analytics, fallbackCounts }) {
  const { t } = useTranslation()
  const labelStatusText = (value) => {
    if (!value) return '—'
    const common = t(`statuses.${value}`)
    if (common !== `statuses.${value}`) return common
    const admin = t(`admin.statuses.${value}`)
    return admin !== `admin.statuses.${value}` ? admin : value
  }
  const totals = analytics?.totals || fallbackCounts
  const kpis = [
    ['Выпускники', totals.alumni || 0],
    ['На проверке', totals.pendingProfiles || totals.pending || 0],
    ['Менторы', totals.mentors || 0],
    ['Вакансии', totals.jobs || 0],
    ['Отклики', totals.applications || 0],
    ['Собрано KGS', Number(analytics?.donations?.raised || 0).toLocaleString()],
    ['Мероприятия', totals.events || 0],
    ['Жалобы чата', totals.chatReports || 0]
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm uppercase tracking-[0.18em] text-ink/45">{label}</p>
            <p className="mt-3 text-4xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AnalyticsBlock title="Статусы профилей" items={analytics?.statuses?.profiles} formatLabel={labelStatusText} />
        <AnalyticsBlock title="Статусы вакансий" items={analytics?.statuses?.jobs} formatLabel={labelStatusText} />
        <AnalyticsBlock title="Вклад выпускников" items={{ pending: analytics?.donations?.pending || 0, completed: analytics?.donations?.completed || 0, campaigns: analytics?.donations?.campaigns || 0 }} formatLabel={labelStatusText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopList title="Топ специальностей" items={analytics?.topSpecialties || []} />
        <TopList title="Топ городов" items={analytics?.topCities || []} />
      </div>

      <Card>
        <h2 className="font-display text-3xl font-bold">Последняя активность</h2>
        <Paginated items={analytics?.activity || []} pageSize={10}>
          {(paged) => (
            <div className="mt-5 space-y-3">
              {paged.map((item, index) => (
                <div key={`${item.type}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#eefbfc] px-4 py-3">
                  <div>
                    <b>{item.title}</b>
                    <p className="text-sm text-ink/82">{labelStatusText(item.type)}</p>
                  </div>
                  <span className="text-sm text-ink/82">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {(!analytics?.activity || analytics.activity.length === 0) && <p className="text-ink/72">Пока нет активности.</p>}
            </div>
          )}
        </Paginated>
      </Card>
    </div>
  )
}

function AnalyticsBlock({ title, items = {}, formatLabel = (v) => v }) {
  const entries = Object.entries(items || {})
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0) || 1
  return (
    <Card>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-5 space-y-4">
        {entries.map(([label, value]) => {
          const percent = Math.round((Number(value) / total) * 100)
          return (
            <div key={label}>
              <div className="flex justify-between text-sm font-bold"><span>{formatLabel(label)}</span><span>{value}</span></div>
              <div className="mt-2 h-2 rounded bg-moss/10"><div className="h-2 rounded bg-moss" style={{ width: `${percent}%` }} /></div>
            </div>
          )
        })}
        {entries.length === 0 && <p className="text-ink/72">Нет данных.</p>}
      </div>
    </Card>
  )
}

function TopList({ title, items }) {
  return (
    <Card>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between rounded-md bg-[#eefbfc] px-4 py-3 font-semibold">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-ink/72">Нет данных.</p>}
      </div>
    </Card>
  )
}

function AuditLog({ logs, auth }) {
  const { t } = useTranslation()
  const labelRoleText = (value) => t(`cabinet.roles.${value}`) || value || t('admin.notSpecified')
  if (auth.role !== 'ADMIN') {
    return (
      <Card>
        <h2 className="font-display text-3xl font-bold">Журнал действий</h2>
        <p className="mt-3 rounded-md bg-red-50 p-4 font-semibold text-red-800">Журнал доступен только главному администратору.</p>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="font-display text-3xl font-bold">Журнал действий</h2>
      <p className="mt-2 text-ink/72">Здесь фиксируются успешные изменения, выполненные администраторами и модераторами. Пароли и токены скрываются автоматически.</p>
      <Paginated items={logs} pageSize={20}>
        {(paged) => (
          <div className="mt-6 overflow-hidden rounded-md border border-ink/10">
            <div className="hidden grid-cols-[160px_180px_100px_1fr] gap-3 bg-moss px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-white md:grid">
              <span>Время</span>
              <span>Пользователь</span>
              <span>Метод</span>
              <span>Маршрут</span>
            </div>
            <div className="divide-y divide-ink/10 bg-white/70">
              {paged.map((item) => (
                <div key={item.id} className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[160px_180px_100px_1fr] md:items-start">
                  <span className="font-semibold text-ink/82">{new Date(item.createdAt).toLocaleString('ru-RU')}</span>
                  <span>
                    <b>{item.actorEmail}</b>
                    <span className="block text-xs font-bold uppercase text-ink/45">{labelRoleText(item.actorRole)}</span>
                  </span>
                  <span className="w-fit rounded bg-[#eefbfc] px-3 py-1 text-xs font-black">{item.method}</span>
                  <span className="break-all font-mono text-xs text-ink/82">{item.path}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="p-5 text-ink/72">Пока нет записей.</p>}
            </div>
          </div>
        )}
      </Paginated>
    </Card>
  )
}

function BackupManager({ auth }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [schedule, setSchedule] = useState('weekly')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [msg, setMsg] = useState(null)

  const loadStatus = async () => {
    try {
      const res = await api.get('/admin/backup/status')
      setStatus(res.data)
      setSchedule(res.data.schedule || 'weekly')
    } catch {
      setMsg({ ok: false, text: 'Ошибка загрузки данных' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStatus() }, [])

  const createNow = async () => {
    setCreating(true)
    setMsg(null)
    try {
      const res = await api.post('/admin/backup/create')
      setMsg({ ok: true, text: `Создана: ${res.data.filename} (${(res.data.sizeBytes / 1024 / 1024).toFixed(2)} МБ)` })
      await loadStatus()
    } catch {
      setMsg({ ok: false, text: 'Ошибка создания резервной копии' })
    } finally {
      setCreating(false)
    }
  }

  const saveSchedule = async () => {
    setSavingSchedule(true)
    setMsg(null)
    try {
      await api.put('/admin/backup/schedule', { schedule })
      setMsg({ ok: true, text: 'Расписание сохранено' })
    } catch {
      setMsg({ ok: false, text: 'Ошибка сохранения расписания' })
    } finally {
      setSavingSchedule(false)
    }
  }

  const downloadBackup = (filename) => {
    const a = document.createElement('a')
    a.href = `${api.defaults.baseURL}/admin/backup/download/${encodeURIComponent(filename)}`
    a.setAttribute('download', filename)
    // Pass auth header via hidden form trick isn't possible for downloads,
    // so we open via window with token in query (backend should verify via query token)
    // Instead: fetch as blob
    api.get(`/admin/backup/download/${encodeURIComponent(filename)}`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => setMsg({ ok: false, text: 'Ошибка скачивания' }))
  }

  const removeBackup = async (filename) => {
    if (!window.confirm(`Удалить резервную копию ${filename}?`)) return
    try {
      await api.delete(`/admin/backup/${encodeURIComponent(filename)}`)
      setMsg({ ok: true, text: 'Удалено' })
      await loadStatus()
    } catch {
      setMsg({ ok: false, text: 'Ошибка удаления' })
    }
  }

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`
  }

  const fmtDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.zip')) {
      setMsg({ ok: false, text: 'Выберите ZIP-файл резервной копии (bfet-backup-*.zip)' })
      e.target.value = ''
      return
    }
    if (!window.confirm(`Восстановить платформу из файла «${file.name}»?\n\nВСЕ ТЕКУЩИЕ ДАННЫЕ БУДУТ ЗАМЕНЕНЫ данными из резервной копии. Это действие нельзя отменить.`)) {
      e.target.value = ''
      return
    }
    setRestoring(true)
    setMsg(null)
    try {
      const formData = new FormData()
      formData.append('backup', file)
      const res = await api.post('/admin/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      })
      setMsg({ ok: true, text: `✓ ${res.data.message} · Пользователей: ${res.data.usersCount}, выпускников: ${res.data.alumniCount}, файлов: ${res.data.filesRestored}` })
      await loadStatus()
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Ошибка восстановления' })
    } finally {
      setRestoring(false)
      e.target.value = ''
    }
  }

  const scheduleLabels = {
    daily:    'Ежедневно (каждый день в 03:00)',
    weekly:   'Еженедельно (каждое воскресенье в 03:00)',
    monthly:  'Ежемесячно (1-го числа в 03:00)',
    disabled: 'Отключено (только вручную)'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Резервное копирование</h2>
            <p className="mt-1 text-sm text-ink/60">
              Полная копия платформы: база данных + загруженные файлы (фото, документы). Последняя копия: <b>{fmtDate(status?.lastBackupAt)}</b>
            </p>
          </div>
          <button
            onClick={createNow}
            disabled={creating}
            className="shrink-0 rounded-full bg-moss px-6 py-3 font-bold text-white shadow-md shadow-moss/20 hover:bg-moss/80 disabled:opacity-50 transition-colors"
          >
            {creating ? '⏳ Создание…' : '💾 Создать сейчас'}
          </button>
        </div>

        {msg && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${msg.ok ? 'border-moss/20 bg-moss/5 text-moss' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}
      </Card>

      {/* Schedule */}
      <Card>
        <h3 className="font-display text-xl font-bold mb-4">Автоматическое расписание</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="flex-1 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
          >
            {Object.entries(scheduleLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            className="rounded-full bg-ink px-6 py-3 font-bold text-sand hover:bg-ink/80 disabled:opacity-50 transition-colors"
          >
            {savingSchedule ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
        <p className="mt-3 text-xs text-ink/40">
          Резервные копии создаются автоматически по серверному времени (Бишкек, UTC+6). Хранится не более 20 копий — старые удаляются автоматически.
        </p>
      </Card>

      {/* Backup list */}
      <Card>
        <h3 className="font-display text-xl font-bold mb-4">
          Доступные резервные копии
          {status?.backups?.length > 0 && <span className="ml-2 text-base font-normal text-ink/40">({status.backups.length})</span>}
        </h3>

        {loading && <p className="text-sm text-ink/50">Загрузка…</p>}

        {!loading && (!status?.backups?.length) && (
          <div className="rounded-2xl border-2 border-dashed border-ink/15 p-8 text-center">
            <p className="text-2xl mb-2">📦</p>
            <p className="text-sm font-semibold text-ink/50">Резервных копий пока нет</p>
            <p className="text-xs text-ink/35 mt-1">Нажмите «Создать сейчас» или настройте расписание</p>
          </div>
        )}

        {!loading && status?.backups?.length > 0 && (
          <div className="space-y-2">
            {status.backups.map((backup, i) => (
              <div
                key={backup.filename}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${i === 0 ? 'border-moss/30 bg-moss/5' : 'border-ink/10 bg-white/60'}`}
              >
                <span className="text-xl shrink-0">{i === 0 ? '🟢' : '📦'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{backup.filename}</p>
                  <p className="text-xs text-ink/50">{fmtDate(backup.createdAt)} · {fmtSize(backup.sizeBytes)}</p>
                </div>
                {i === 0 && <span className="shrink-0 rounded-full bg-moss/15 px-2.5 py-0.5 text-xs font-bold text-moss">Последняя</span>}
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => downloadBackup(backup.filename)}
                    className="rounded-full border border-moss/30 bg-moss/5 px-3 py-1.5 text-xs font-bold text-moss hover:bg-moss/15 transition-colors"
                  >
                    ↓ Скачать
                  </button>
                  <button
                    onClick={() => removeBackup(backup.filename)}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Restore */}
      <Card>
        <h3 className="font-display text-xl font-bold mb-1">Восстановление из резервной копии</h3>
        <p className="text-sm text-ink/60 mb-5">
          Загрузите ZIP-файл резервной копии — платформа автоматически восстановит базу данных и все загруженные файлы. Перезапуск сервера не требуется.
        </p>

        <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50/60 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-3">⚠ Внимание — необратимое действие</p>
          <p className="text-sm text-ink/70 mb-4">
            Все текущие данные будут <b>полностью заменены</b> данными из выбранного архива. Перед восстановлением рекомендуется создать текущую резервную копию.
          </p>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors ${restoring ? 'bg-ink/10 text-ink/40 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
            {restoring ? '⏳ Восстановление…' : '↑ Загрузить резервную копию для восстановления'}
            <input type="file" accept=".zip" className="hidden" disabled={restoring} onChange={handleRestore} />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-ink/10 bg-white/60 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-ink/40 mb-3">Что находится внутри ZIP-архива</p>
          <div className="space-y-1.5 text-sm text-ink/65 font-mono">
            <p>📄 <span className="text-moss font-bold">db.json</span> — база данных (пользователи, выпускники, новости…)</p>
            <p>📁 <span className="text-moss font-bold">uploads/</span> — все загруженные файлы (фото, документы, CV)</p>
            <p>📄 backup-info.json — дата и версия архива</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ImportExport({ auth }) {
  const { t } = useTranslation()
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const exportFile = async (url, filename, type = 'blob') => {
    try {
      const res = await api.get(url, { responseType: 'blob' })
      downloadBlob(new Blob([res.data]), filename)
    } catch {
      alert('Ошибка экспорта')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/admin/import/alumni', formData, {
        headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'multipart/form-data' }
      })
      setImportResult({ ok: true, message: res.data.message, details: res.data })
    } catch (err) {
      setImportResult({ ok: false, message: err.response?.data?.error || 'Ошибка импорта' })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const exportPdf = async (url, title) => {
    try {
      const res = await api.get(url, { responseType: 'blob' })
      const text = await new Response(res.data).text()
      const rows = text.split('\n').slice(1).filter(Boolean).map((row) =>
        row.split(';').map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"'))
      )
      const headers = text.split('\n')[0].split(';').map((h) => h.replace(/^"|"$/g, ''))
      const date = new Date().toLocaleDateString('ru-RU')
      const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
        <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
        h1{font-size:16px;margin-bottom:4px}p{color:#666;margin-bottom:16px}
        table{border-collapse:collapse;width:100%}
        th{background:#0c2a35;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
        td{border:1px solid #ddd;padding:5px 8px}tr:nth-child(even){background:#f5fdff}
        @media print{@page{margin:1cm}}</style></head>
        <body><h1>${esc(title)}</h1><p>Экспорт: ${esc(date)} · Ассоциация выпускников БФЭТ</p>
        <table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></body></html>`
      const w = window.open('', '_blank', 'width=900,height=700')
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 500)
    } catch {
      alert('Ошибка генерации PDF')
    }
  }

  const exportGroups = [
    {
      titleKey: 'admin.tabs.alumni',
      items: [
        { labelKey: 'admin.export.excel', icon: '📊', action: () => exportFile('/admin/export/alumni', `alumni-${new Date().toISOString().slice(0,10)}.xlsx`) },
        { labelKey: 'admin.export.csv',   icon: '📄', action: () => exportFile('/admin/export/alumni/csv', `alumni-${new Date().toISOString().slice(0,10)}.csv`) },
        { labelKey: 'admin.export.pdf',   icon: '🖨️', action: () => exportPdf('/admin/export/alumni/csv', t('admin.tabs.alumni')) }
      ]
    },
    {
      titleKey: 'admin.tabs.jobs',
      items: [
        { labelKey: 'admin.export.csv', icon: '📄', action: () => exportFile('/admin/export/jobs/csv', `jobs-${new Date().toISOString().slice(0,10)}.csv`) },
        { labelKey: 'admin.export.pdf', icon: '🖨️', action: () => exportPdf('/admin/export/jobs/csv', t('admin.tabs.jobs')) }
      ]
    },
    {
      titleKey: 'admin.tabs.campaigns',
      items: [
        { labelKey: 'admin.export.csv', icon: '📄', action: () => exportFile('/admin/export/donations/csv', `donations-${new Date().toISOString().slice(0,10)}.csv`) },
        { labelKey: 'admin.export.pdf', icon: '🖨️', action: () => exportPdf('/admin/export/donations/csv', t('admin.tabs.campaigns')) }
      ]
    },
    {
      titleKey: 'admin.tabs.events',
      items: [
        { labelKey: 'admin.export.csv', icon: '📄', action: () => exportFile('/admin/export/events/csv', `events-${new Date().toISOString().slice(0,10)}.csv`) },
        { labelKey: 'admin.export.pdf', icon: '🖨️', action: () => exportPdf('/admin/export/events/csv', t('admin.tabs.events')) }
      ]
    },
    {
      titleKey: 'admin.tabs.mentorship',
      items: [
        { labelKey: 'admin.export.csv', icon: '📄', action: () => exportFile('/admin/export/mentorship/csv', `mentorship-${new Date().toISOString().slice(0,10)}.csv`) },
        { labelKey: 'admin.export.pdf', icon: '🖨️', action: () => exportPdf('/admin/export/mentorship/csv', t('admin.tabs.mentorship')) }
      ]
    },
    {
      titleKey: 'nav.admin',
      items: [
        { labelKey: 'admin.export.json', icon: '💾', action: () => exportFile('/admin/export/content', `bfet-backup-${new Date().toISOString().slice(0,10)}.json`) }
      ]
    }
  ]

  return (
    <Card>
      <h2 className="font-display text-3xl font-bold">{t('admin.export.title')}</h2>
      <p className="mt-2 text-sm text-ink/60">{t('admin.export.desc')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {exportGroups.map((group) => (
          <div key={group.titleKey} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-ink/40 mb-3">{t(group.titleKey)}</p>
            <div className="space-y-2">
              {group.items.map((item) => (
                <button
                  key={item.labelKey}
                  onClick={item.action}
                  className="flex w-full items-center gap-3 rounded-xl bg-sand/60 px-4 py-2.5 text-sm font-bold hover:bg-moss/10 hover:text-moss transition-colors text-left"
                >
                  <span>{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/15 p-5">
        <p className="text-xs font-black uppercase tracking-widest text-ink/40 mb-3">{t('admin.export.importTitle')}</p>
        <p className="text-sm text-ink/60 mb-4">{t('admin.export.importDesc')}</p>
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors ${importing ? 'bg-ink/10 text-ink/40' : 'bg-ink text-sand hover:bg-ink/80'}`}>
          {importing ? t('admin.export.importing') : `↑ ${t('admin.export.chooseFile')}`}
          <input type="file" accept=".xlsx,.xls" className="hidden" disabled={importing} onChange={handleImport} />
        </label>
        {importResult && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${importResult.ok ? 'border-moss/20 bg-moss/5 text-moss' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {importResult.message}
            {importResult.details?.errors?.length > 0 && (
              <ul className="mt-2 space-y-1 font-normal">
                {importResult.details.errors.slice(0, 5).map((err, i) => <li key={i} className="text-xs">• {err}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}




