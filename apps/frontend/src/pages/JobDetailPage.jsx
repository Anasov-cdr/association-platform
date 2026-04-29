import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { uploadFile } from '../uploads'

const jobStatusLabels = {
  PENDING: 'На проверке',
  PUBLISHED: 'Активна',
  REJECTED: 'Отклонена',
  CLOSED: 'Закрыта'
}

export function JobDetailPage() {
  const { id, lang = 'ru' } = useParams()
  const [job, setJob] = useState(null)
  const [cvUrl, setCvUrl] = useState('')
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const auth = useAppStore((state) => state)

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => setJob(data)).catch(() => setError('Вакансия не найдена'))
  }, [id])

  const apply = async (event) => {
    event.preventDefault()
    if (!auth.accessToken) {
      setError('Войдите в кабинет, чтобы откликнуться.')
      return
    }
    setError('')
    try {
      await api.post(`/jobs/${id}/apply`, { cvUrl, message })
      setNotice('Отклик отправлен.')
      setCvUrl('')
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось отправить отклик')
    }
  }

  if (!job && error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!job) return <Card><p className="text-ink/72">Загрузка...</p></Card>

  return (
    <div className="space-y-6">
      <Link to={`/${lang}/jobs`} className="font-bold text-moss">← Все вакансии</Link>
      {(notice || error) && <Card className={error ? 'border-red-200 bg-red-50 text-red-800' : 'border-moss/20 bg-moss/10 text-green-900'}>{error || notice}</Card>}
      <PageHero>
        <div className="flex flex-wrap gap-2 text-sm font-bold text-white/86">
          <span className="rounded bg-white/18 px-3 py-1">{job.type}</span>
          <span className="rounded bg-white/18 px-3 py-1">{job.format}</span>
          <span className="rounded bg-white/18 px-3 py-1">{jobStatusLabels[job.status] || job.status}</span>
        </div>
        <h1 className="mt-5 font-display text-5xl font-bold">{job.title}</h1>
        <p className="mt-3 text-xl font-semibold text-white/90">{job.company?.name || 'Частное лицо'} · {job.city}, {job.country}</p>
        <p className="mt-2 text-white/76">{job.salary || 'Зарплата не указана'} · дедлайн: {job.deadline ? new Date(job.deadline).toLocaleDateString('ru-RU') : 'не указан'}</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <section className="rounded-md bg-[#eefbfc] p-5 lg:col-span-2">
            <h2 className="text-2xl font-bold">Описание</h2>
            <p className="mt-3 whitespace-pre-line text-ink/75">{job.description}</p>
          </section>
          <section className="rounded-md bg-white p-5 ring-1 ring-ink/10">
            <h2 className="text-2xl font-bold">Контакты</h2>
            <p className="mt-3 text-ink/82">{job.contacts || 'Контакты уточняются через администратора.'}</p>
          </section>
          {job.requirements && <section className="rounded-md bg-white p-5 ring-1 ring-ink/10"><h2 className="text-2xl font-bold">Требования</h2><p className="mt-3 whitespace-pre-line text-ink/75">{job.requirements}</p></section>}
          {job.duties && <section className="rounded-md bg-white p-5 ring-1 ring-ink/10 lg:col-span-2"><h2 className="text-2xl font-bold">Обязанности</h2><p className="mt-3 whitespace-pre-line text-ink/75">{job.duties}</p></section>}
        </div>
      </PageHero>
      <Card>
        <h2 className="font-display text-3xl font-bold">Откликнуться</h2>
        <form onSubmit={apply} className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <input required value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} placeholder="Ссылка на резюме или загрузите файл" className="min-w-0 flex-1 rounded-md border border-ink/10 bg-white px-4 py-3 outline-none" />
            <label className="cursor-pointer rounded border border-ink/20 px-5 py-3 text-sm font-bold text-ink">
              {uploading ? 'Загрузка...' : 'Загрузить резюме'}
              <input type="file" className="hidden" onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setUploading(true)
                try {
                  const uploaded = await uploadFile(file, 'cv')
                  setCvUrl(uploaded.url)
                } finally {
                  setUploading(false)
                  event.target.value = ''
                }
              }} />
            </label>
          </div>
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Сопроводительное письмо" className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none" />
          <button className="rounded bg-moss px-6 py-3 font-bold text-white">Отправить отклик</button>
        </form>
      </Card>
    </div>
  )
}
