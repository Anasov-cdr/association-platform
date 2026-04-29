import React, { useEffect, useMemo, useState } from 'react'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl, uploadFile } from '../uploads'

const tabs = [
  ['dashboard', 'Обзор'],
  ['site', 'Данные колледжа'],
  ['users', 'Пользователи'],
  ['alumni', 'Выпускники'],
  ['pending', 'Заявки выпускников'],
  ['news', 'Новости'],
  ['events', 'Мероприятия'],
  ['documents', 'Документы'],
  ['campaigns', 'Пожертвования'],
  ['companies', 'Компании'],
  ['jobs', 'Вакансии'],
  ['applications', 'Отклики'],
  ['mentorship', 'Менторство'],
  ['chat', 'Чат'],
  ['audit', 'Журнал действий'],
  ['import', 'Импорт / экспорт']
]

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
  return <input {...props} className={`w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss ${props.className || ''}`} />
}

function Textarea(props) {
  return <textarea {...props} className={`w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss ${props.className || ''}`} />
}

function FileInput({ folder, onUploaded, label = 'Загрузить файл' }) {
  const [uploading, setUploading] = useState(false)
  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded border border-ink/20 px-5 py-3 text-sm font-bold text-ink hover:bg-moss/5">
      {uploading ? 'Загрузка...' : label}
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
  return (
    <Field label="Статус публикации">
      <select value={value || 'PUBLISHED'} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss">
        <option value="PUBLISHED">Опубликовано</option>
        <option value="DRAFT">Черновик</option>
        <option value="ARCHIVED">Архив</option>
      </select>
    </Field>
  )
}

export function AdminPage() {
  const auth = useAppStore((state) => state)
  const setAuth = useAppStore((state) => state.setAuth)
  const logout = useAppStore((state) => state.logout)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [data, setData] = useState({ analytics: null, site: null, users: [], alumni: [], pending: [], news: [], events: [], documents: [], campaigns: [], donations: [], companies: [], jobs: [], applications: [], mentorships: [], chatReports: [], auditLogs: [] })

  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'ALUMNI', status: 'ACTIVE', fullName: '' })
  const [passwordReset, setPasswordReset] = useState({})
  const [siteForm, setSiteForm] = useState({ name: '', parentOrganization: '', website: '', foundedYear: 1931, staffCount: '', studentCount: '', address: '', phonesText: '', email: '', workingHours: '', mission: '', specialtiesText: '' })
  const [newsForm, setNewsForm] = useState({ title: emptyLocalized(), body: emptyLocalized(), imageUrl: '', status: 'PUBLISHED' })
  const [eventForm, setEventForm] = useState({ title: emptyLocalized(), description: emptyLocalized(), startsAt: '', location: '', status: 'upcoming', publicationStatus: 'PUBLISHED' })
  const [documentForm, setDocumentForm] = useState({ title: emptyLocalized(), description: emptyLocalized(), category: 'Финансовые отчеты', fileUrl: '#', fileType: 'PDF', publicationStatus: 'PUBLISHED' })
  const [campaignForm, setCampaignForm] = useState({ title: emptyLocalized(), description: emptyLocalized(), goalAmount: 100000, publicationStatus: 'PUBLISHED' })
  const [companyForm, setCompanyForm] = useState({ name: '', description: '', website: '', city: '', country: 'Кыргызстан', logoUrl: '' })
  const [jobForm, setJobForm] = useState({ title: '', companyId: '', description: '', requirements: '', duties: '', type: 'стажировка', format: 'гибрид', city: 'Бишкек', country: 'Кыргызстан', salary: '', deadline: '', contacts: '' })
  const [alumniForm, setAlumniForm] = useState({ fullName: '', email: '', password: '', graduationYear: new Date().getFullYear(), specialty: '', group: '', city: '', country: 'Кыргызстан', company: '', position: '', phone: '', bio: '', isMentor: false, showEmail: true })

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
    if (!auth.accessToken) return
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
      specialtiesText: (data.site.specialties || []).join('\n')
    })
  }, [data.site])

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await api.post('/auth/login', credentials)
      setAuth({ user: response.data.user, accessToken: response.data.accessToken, refreshToken: response.data.refreshToken })
      setNotice('Вход выполнен')
    } catch {
      setError('Неверные данные или сервер недоступен')
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
      setError(err.response?.data?.error || 'Операция не выполнена')
    }
  }

  const moderateProfile = (id, status) => run(() => api.post(status === 'APPROVED' ? `/alumni/admin/${id}/approve` : `/alumni/admin/${id}/reject`), 'Статус профиля обновлен')
  const setProfileStatus = (id, status) => run(() => api.patch(`/alumni/admin/${id}/status`, { status }), 'Статус выпускника обновлен')
  const moderateJob = (id, status) => run(() => api.post(status === 'PUBLISHED' ? `/jobs/${id}/approve` : `/jobs/${id}/reject`), 'Статус вакансии обновлен')
  const setApplicationStatus = (id, status) => run(() => api.patch(`/jobs/applications/${id}/status`, { status }), 'Статус отклика обновлен')
  const setMentorshipStatus = (id, status) => run(() => api.patch(`/mentorship/${id}/status`, { status }), 'Статус менторства обновлен')
  const setDonationStatus = (id, status) => run(() => api.patch(`/donations/admin/donations/${id}/status`, { status }), 'Статус пожертвования обновлен')
  const deleteChatMessage = (id) => run(() => api.delete(`/chat/messages/${id}`), 'Сообщение удалено')
  const setChatReportStatus = (id, status) => run(() => api.patch(`/chat/reports/${id}/status`, { status }), 'Статус жалобы обновлен')
  const setUserRole = (id, role) => run(() => api.patch(`/users/${id}/role`, { role }), 'Роль пользователя обновлена')
  const setUserStatus = (id, status) => run(() => api.patch(`/users/${id}/status`, { status }), 'Статус пользователя обновлен')
  const resetUserPassword = (id) => {
    const password = passwordReset[id]
    if (!password || password.length < 8) {
      setError('Новый пароль должен быть минимум 8 символов')
      return
    }
    run(() => api.patch(`/users/${id}/password`, { password }), 'Пароль пользователя обновлен')
    setPasswordReset((prev) => ({ ...prev, [id]: '' }))
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
      showEmail: Boolean(item.showEmail)
    })
  }

  if (!auth.accessToken) {
    return (
      <div className="space-y-6">
        <PageHero>
          <h1 className="font-display text-4xl font-bold">Админ-панель</h1>
          <p className="mt-3 text-white/86">Войдите, чтобы управлять всеми разделами платформы.</p>
        </PageHero>
        <Card>
          <h2 className="font-display text-3xl font-bold">Вход для администратора</h2>
          <form onSubmit={handleLogin} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input value={credentials.email} onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))} placeholder="Электронная почта" type="email" />
            <Input value={credentials.password} onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))} placeholder="Пароль" type="password" />
            <button type="submit" className="rounded bg-moss px-6 py-3 font-bold text-white md:col-span-2">Войти</button>
          </form>
          {error && <p className="mt-4 text-red-700">{error}</p>}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Админ-панель управления контентом</h1>
            <p className="mt-2 text-white/86">Контент заполняется здесь: новости, мероприятия, документы, кампании, компании, вакансии и заявки.</p>
            <p className="mt-1 text-sm text-white/70">{auth.email} · {labelRole(auth.role)}</p>
          </div>
          <button onClick={logout} className="rounded border border-white/45 bg-white/12 px-5 py-3 text-sm font-semibold text-white hover:bg-white/22">Выйти</button>
        </div>
      </PageHero>

      {(notice || error) && <Card className={error ? 'border-red-200 bg-red-50' : 'border-moss/20 bg-moss/10'}>{error || notice}</Card>}

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded px-4 py-2 text-sm font-bold ${activeTab === key ? 'bg-moss text-white' : 'bg-white/70 text-ink/82'}`}>{label}</button>)}
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
              specialties: siteForm.specialtiesText.split('\n').map((item) => item.trim()).filter(Boolean)
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
            <Field label="Миссия"><Textarea value={siteForm.mission} onChange={(e) => setSiteForm((p) => ({ ...p, mission: e.target.value }))} rows={5} className="md:col-span-2" /></Field>
            <Field label="Специальности, каждая с новой строки"><Textarea value={siteForm.specialtiesText} onChange={(e) => setSiteForm((p) => ({ ...p, specialtiesText: e.target.value }))} rows={9} /></Field>
            <div className="flex items-end">
              <button className="w-full rounded bg-moss px-6 py-3 font-bold text-white">Сохранить данные колледжа</button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Пользователи и роли</h2>
          <p className="mt-2 text-ink/72">Только администратор может создавать пользователей, назначать роли и блокировать доступ. Модератор управляет контентом, но не управляет пользователями.</p>
          {auth.role !== 'ADMIN' && <div className="mt-5 rounded-md bg-red-50 p-4 font-semibold text-red-800">Этот раздел доступен только главному администратору.</div>}
          {auth.role === 'ADMIN' && (
            <>
              <form onSubmit={(e) => {
                e.preventDefault()
                run(() => api.post('/users', userForm), 'Пользователь создан')
                setUserForm({ email: '', password: '', role: 'ALUMNI', status: 'ACTIVE', fullName: '' })
              }} className="mt-6 grid gap-3 md:grid-cols-5">
                <Input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} placeholder="Электронная почта" type="email" required />
                <Input value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} placeholder="Пароль" required />
                <Input value={userForm.fullName} onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="ФИО, если выпускник" />
                <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))} className="rounded-md border border-ink/10 bg-white px-4 py-3">
                  <option value="ALUMNI">Выпускник</option>
                  <option value="MODERATOR">Модератор</option>
                  <option value="ADMIN">Администратор</option>
                </select>
                <button className="rounded bg-moss px-6 py-3 font-bold text-white">Создать</button>
              </form>
              <List items={data.users} render={(item) => (
                <>
                  <div>
                    <b>{item.email}</b>
                    <p className="text-ink/72">{item.profile?.fullName || 'Без профиля'} · создан: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ru-RU') : '-'}</p>
                  </div>
                  <span className={`rounded px-3 py-1 font-bold ${item.status === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-moss/10 text-moss'}`}>{labelStatus(item.status || 'ACTIVE')}</span>
                  <select value={item.role} onChange={(e) => setUserRole(item.id, e.target.value)} className="rounded-md border border-ink/10 bg-white px-3 py-2">
                    <option value="ALUMNI">Выпускник</option>
                    <option value="MODERATOR">Модератор</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                  {item.status === 'BLOCKED'
                    ? <button onClick={() => setUserStatus(item.id, 'ACTIVE')} className="text-moss">Разблокировать</button>
                    : <button onClick={() => setUserStatus(item.id, 'BLOCKED')} className="text-red-700">Заблокировать</button>}
                  <div className="flex min-w-64 gap-2">
                    <Input value={passwordReset[item.id] || ''} onChange={(e) => setPasswordReset((prev) => ({ ...prev, [item.id]: e.target.value }))} placeholder="Новый пароль" type="password" />
                    <button onClick={() => resetUserPassword(item.id)} className="whitespace-nowrap text-moss">Сбросить пароль</button>
                  </div>
                </>
              )} />
            </>
          )}
        </Card>
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
            <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={alumniForm.isMentor} onChange={(e) => setAlumniForm((p) => ({ ...p, isMentor: e.target.checked }))} /> Ментор</label>
            <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={alumniForm.showEmail} onChange={(e) => setAlumniForm((p) => ({ ...p, showEmail: e.target.checked }))} /> Показывать электронную почту</label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'alumni' ? 'Сохранить выпускника' : 'Добавить выпускника'}</button>
              {editing?.type === 'alumni' && <button type="button" onClick={() => { resetEditing(); setAlumniForm({ fullName: '', email: '', password: '', graduationYear: new Date().getFullYear(), specialty: '', group: '', city: '', country: 'Кыргызстан', company: '', position: '', phone: '', bio: '', isMentor: false, showEmail: true }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.alumni} render={(item) => (
            <>
              <div>
                <b>{item.fullName}</b>
                <p className="text-ink/72">{item.graduationYear} · {item.specialty} · {item.user?.email}</p>
              </div>
              <span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.status)}</span>
              <button onClick={() => editAlumni(item)} className="text-moss">Редактировать</button>
              <button onClick={() => setProfileStatus(item.id, 'APPROVED')} className="text-moss">Опубликовать</button>
              <button onClick={() => setProfileStatus(item.id, 'BLOCKED')} className="text-red-700">Заблокировать</button>
              <button onClick={() => setProfileStatus(item.id, 'PENDING')} className="text-ink/72">На проверку</button>
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
          <List items={data.news} render={(item) => <><b>{getLocalized(item.title)}</b><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.status || 'PUBLISHED')}</span><button onClick={() => editNews(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/news/${item.id}`, { status: (item.status || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус новости обновлен')} className="text-ink/72">{(item.status || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/news/${item.id}`), 'Новость удалена')} className="text-red-700">Удалить</button></>} />
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
          <List items={data.events} render={(item) => <><b>{getLocalized(item.title)}</b><span>{toDateInput(item.startsAt)}</span><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.publicationStatus || 'PUBLISHED')}</span><button onClick={() => editEvent(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/events/${item.id}`, { publicationStatus: (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус мероприятия обновлен')} className="text-ink/72">{(item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/events/${item.id}`), 'Мероприятие удалено')} className="text-red-700">Удалить</button></>} />
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
            <div className="grid gap-3 md:grid-cols-3"><Input value={documentForm.category} onChange={(e) => setDocumentForm((p) => ({ ...p, category: e.target.value }))} placeholder="Категория" /><Input value={documentForm.fileUrl} onChange={(e) => setDocumentForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="URL файла или загрузите файл" /><Input value={documentForm.fileType} onChange={(e) => setDocumentForm((p) => ({ ...p, fileType: e.target.value }))} placeholder="PDF/DOCX/XLSX" /></div>
            <FileInput folder="documents" label="Загрузить документ" onUploaded={(file) => setDocumentForm((p) => ({ ...p, fileUrl: file.url, fileType: file.originalName.split('.').pop()?.toUpperCase() || p.fileType }))} />
            <PublicationStatusField value={documentForm.publicationStatus} onChange={(publicationStatus) => setDocumentForm((p) => ({ ...p, publicationStatus }))} />
            <div className="flex flex-wrap gap-3">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'documents' ? 'Сохранить документ' : 'Добавить документ'}</button>
              {editing?.type === 'documents' && <button type="button" onClick={() => { resetEditing(); setDocumentForm({ title: emptyLocalized(), description: emptyLocalized(), category: 'Финансовые отчеты', fileUrl: '#', fileType: 'PDF', publicationStatus: 'PUBLISHED' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.documents} render={(item) => <><b>{getLocalized(item.title)}</b><span>{item.category}</span><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.publicationStatus || 'PUBLISHED')}</span><button onClick={() => editDocument(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/documents/${item.id}`, { publicationStatus: (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус документа обновлен')} className="text-ink/72">{(item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/documents/${item.id}`), 'Документ удален')} className="text-red-700">Удалить</button></>} />
        </Card>
      )}

      {activeTab === 'campaigns' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Кампании пожертвований</h2>
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
          <List items={data.campaigns} render={(item) => <><b>{getLocalized(item.title)}</b><span>{Number(item.raisedAmount).toLocaleString()} / {Number(item.goalAmount).toLocaleString()} KGS</span><span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.publicationStatus || 'PUBLISHED')}</span><button onClick={() => editCampaign(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.put(`/donations/campaigns/${item.id}`, { publicationStatus: (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }), 'Статус кампании обновлен')} className="text-ink/72">{(item.publicationStatus || 'PUBLISHED') === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button><button onClick={() => run(() => api.delete(`/donations/campaigns/${item.id}`), 'Кампания удалена')} className="text-red-700">Удалить</button></>} />
          <h3 className="mt-8 text-2xl font-bold">Пожертвования на подтверждение</h3>
          <List items={data.donations} render={(item) => (
            <>
              <div>
                <b>{item.anonymous ? 'Анонимно' : item.donorName || 'Донор'}</b>
                <p className="text-ink/72">{getLocalized(item.campaignTitle || item.campaign?.title)} · {Number(item.amount).toLocaleString()} KGS</p>
              </div>
              <span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.status || 'pending')}</span>
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
          }} className="mt-6 grid gap-3 md:grid-cols-2">
            {Object.entries(companyForm).map(([key, value]) => <Input key={key} value={value} onChange={(e) => setCompanyForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={companyPlaceholders[key] || key} required={key === 'name'} />)}
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="rounded bg-moss px-6 py-3 font-bold text-white">{editing?.type === 'companies' ? 'Сохранить компанию' : 'Добавить компанию'}</button>
              {editing?.type === 'companies' && <button type="button" onClick={() => { resetEditing(); setCompanyForm({ name: '', description: '', website: '', city: '', country: 'Кыргызстан', logoUrl: '' }) }} className="rounded border border-ink/10 px-6 py-3 font-bold">Отмена</button>}
            </div>
          </form>
          <List items={data.companies} render={(item) => <><b>{item.name}</b><span>{item.city}, {item.country}</span><button onClick={() => editCompany(item)} className="text-moss">Редактировать</button><button onClick={() => run(() => api.delete(`/companies/${item.id}`), 'Компания удалена')} className="text-red-700">Удалить</button></>} />
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
          <List items={data.jobs} render={(item) => <><b>{item.title}</b><span>{labelStatus(item.status)}</span><button onClick={() => editJob(item)} className="text-moss">Редактировать</button><button onClick={() => moderateJob(item.id, 'PUBLISHED')} className="text-moss">Опубликовать</button><button onClick={() => run(() => api.post(`/jobs/${item.id}/close`), 'Вакансия закрыта')} className="text-ink/72">Закрыть</button><button onClick={() => moderateJob(item.id, 'REJECTED')} className="text-red-700">Отклонить</button><button onClick={() => run(() => api.delete(`/jobs/${item.id}`), 'Вакансия удалена')} className="text-red-700">Удалить</button></>} />
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
              <span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.status)}</span>
              {['VIEWED', 'INVITED', 'ACCEPTED', 'REJECTED'].map((status) => <button key={status} onClick={() => setApplicationStatus(item.id, status)} className={status === 'REJECTED' ? 'text-red-700' : 'text-moss'}>{labelStatus(status)}</button>)}
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
              <span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.status)}</span>
              <button onClick={() => setMentorshipStatus(item.id, 'active')} className="text-moss">Принять</button>
              <button onClick={() => setMentorshipStatus(item.id, 'completed')} className="text-ink/72">Завершить</button>
              <button onClick={() => setMentorshipStatus(item.id, 'rejected')} className="text-red-700">Отклонить</button>
            </>
          )} />
        </Card>
      )}

      {activeTab === 'chat' && (
        <Card>
          <h2 className="font-display text-3xl font-bold">Модерация чата</h2>
          <p className="mt-2 text-ink/72">Жалобы пользователей на сообщения и действия модератора.</p>
          <List items={data.chatReports} render={(item) => (
            <>
              <div>
                <b>{item.reason}</b>
                <p className="text-ink/72">Комната: {item.roomId} · Жалоба от: {item.reporterEmail}</p>
                <p className="mt-2 rounded-md bg-[#eefbfc] px-3 py-2 text-ink/82">{item.message?.text || 'Сообщение удалено'}</p>
              </div>
              <span className="rounded bg-[#eefbfc] px-3 py-1 font-bold">{labelStatus(item.status)}</span>
              {item.messageId && <button onClick={() => deleteChatMessage(item.messageId)} className="text-red-700">Удалить сообщение</button>}
              <button onClick={() => setChatReportStatus(item.id, 'resolved')} className="text-moss">Закрыть</button>
              <button onClick={() => setChatReportStatus(item.id, 'rejected')} className="text-ink/72">Отклонить</button>
            </>
          )} />
        </Card>
      )}

      {activeTab === 'audit' && <AuditLog logs={data.auditLogs} auth={auth} />}

      {activeTab === 'import' && <ImportExport auth={auth} />}
    </div>
  )
}

function List({ items, render }) {
  return <div className="mt-6 space-y-3">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-4 text-sm">{render(item)}</div>)}{items.length === 0 && <p className="text-ink/72">Нет данных.</p>}</div>
}

function Dashboard({ analytics, fallbackCounts }) {
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
        <AnalyticsBlock title="Статусы профилей" items={analytics?.statuses?.profiles} />
        <AnalyticsBlock title="Статусы вакансий" items={analytics?.statuses?.jobs} />
        <AnalyticsBlock title="Пожертвования" items={{ pending: analytics?.donations?.pending || 0, completed: analytics?.donations?.completed || 0, campaigns: analytics?.donations?.campaigns || 0 }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopList title="Топ специальностей" items={analytics?.topSpecialties || []} />
        <TopList title="Топ городов" items={analytics?.topCities || []} />
      </div>

      <Card>
        <h2 className="font-display text-3xl font-bold">Последняя активность</h2>
        <div className="mt-5 space-y-3">
          {(analytics?.activity || []).map((item, index) => (
            <div key={`${item.type}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#eefbfc] px-4 py-3">
              <div>
                <b>{item.title}</b>
                <p className="text-sm text-ink/82">{labelStatus(item.type)}</p>
              </div>
              <span className="text-sm text-ink/82">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {(!analytics?.activity || analytics.activity.length === 0) && <p className="text-ink/72">Пока нет активности.</p>}
        </div>
      </Card>
    </div>
  )
}

function AnalyticsBlock({ title, items = {} }) {
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
              <div className="flex justify-between text-sm font-bold"><span>{labelStatus(label)}</span><span>{value}</span></div>
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
      <div className="mt-6 overflow-hidden rounded-md border border-ink/10">
        <div className="hidden grid-cols-[160px_180px_100px_1fr] gap-3 bg-moss px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-white md:grid">
          <span>Время</span>
          <span>Пользователь</span>
          <span>Метод</span>
          <span>Маршрут</span>
        </div>
        <div className="divide-y divide-ink/10 bg-white/70">
          {logs.map((item) => (
            <div key={item.id} className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[160px_180px_100px_1fr] md:items-start">
              <span className="font-semibold text-ink/82">{new Date(item.createdAt).toLocaleString('ru-RU')}</span>
              <span>
                <b>{item.actorEmail}</b>
                <span className="block text-xs font-bold uppercase text-ink/45">{labelRole(item.actorRole)}</span>
              </span>
              <span className="w-fit rounded bg-[#eefbfc] px-3 py-1 text-xs font-black">{item.method}</span>
              <span className="break-all font-mono text-xs text-ink/82">{item.path}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="p-5 text-ink/72">Пока нет записей.</p>}
        </div>
      </div>
    </Card>
  )
}

function ImportExport({ auth }) {
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <h2 className="font-display text-3xl font-bold">Импорт / экспорт данных</h2>
      <p className="mt-2 text-ink/72">
        Excel используется для массовой загрузки выпускников. JSON-экспорт выгружает контент платформы без хэшей паролей: данные колледжа, новости, мероприятия, документы, кампании, компании и вакансии.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button onClick={async () => {
          const res = await api.get('/admin/export/alumni', { responseType: 'blob' })
          downloadBlob(new Blob([res.data]), 'alumni.xlsx')
        }} className="rounded bg-moss px-6 py-3 font-bold text-white">Экспорт Excel</button>
        <button onClick={async () => {
          const res = await api.get('/admin/export/content', { responseType: 'blob' })
          const date = new Date().toISOString().slice(0, 10)
          downloadBlob(new Blob([res.data], { type: 'application/json' }), `bfet-alumni-content-${date}.json`)
        }} className="rounded bg-moss px-6 py-3 font-bold text-white">Экспорт всей платформы JSON</button>
        <label className="rounded border border-ink/20 px-6 py-3 font-bold text-ink cursor-pointer">Импорт Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const formData = new FormData()
          formData.append('file', file)
          const res = await api.post('/admin/import/alumni', formData, { headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'multipart/form-data' } })
          alert(res.data.message)
        }} /></label>
      </div>
    </Card>
  )
}


