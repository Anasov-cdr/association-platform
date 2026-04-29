import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { toAbsoluteUploadUrl, uploadFile } from '../uploads'

const jobStatusLabels = {
  PENDING: 'На проверке',
  PUBLISHED: 'Активна',
  REJECTED: 'Отклонена',
  CLOSED: 'Закрыта'
}

export function JobsPage() {
  const { lang = 'ru' } = useParams()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'my'
  const [jobs, setJobs] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [cvUrl, setCvUrl] = useState('')
  const [message, setMessage] = useState('')
  const [uploadingCv, setUploadingCv] = useState(false)
  const auth = useAppStore((state) => state)

  useEffect(() => {
    if (activeTab === 'all') {
      api.get('/jobs').then(({ data }) => setJobs(data)).catch(() => setJobs([]))
    } else if (auth.accessToken) {
      api.get('/jobs/my')
         .then(({ data }) => setMyJobs(data)).catch(() => setMyJobs([]))
    }
  }, [activeTab, auth.accessToken])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!auth.accessToken) {
      alert('Пожалуйста, авторизуйтесь для отклика на вакансию.')
      return
    }
    try {
      await api.post(`/jobs/${applyingJobId}/apply`, { cvUrl, message })
      alert('Ваша заявка успешно отправлена!')
      setApplyingJobId(null)
      setCvUrl('')
      setMessage('')
    } catch (error) {
      alert(error.response?.data?.error || 'Произошла ошибка')
    }
  }

  return (
    <div className="space-y-6">
      <PageHero className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Вакансии и стажировки</h1>
          <p className="mt-3 max-w-3xl text-white/86">Смотрите актуальные предложения от выпускников и партнеров колледжа.</p>
        </div>
        {auth.accessToken && (
          <div className="flex rounded bg-white/14 p-1">
            <button onClick={() => setActiveTab('all')} className={`rounded px-5 py-2 text-sm font-bold ${activeTab === 'all' ? 'bg-white shadow' : 'text-ink/72'}`}>Все вакансии</button>
            <button onClick={() => setActiveTab('my')} className={`rounded px-5 py-2 text-sm font-bold ${activeTab === 'my' ? 'bg-white shadow' : 'text-ink/72'}`}>Мои вакансии</button>
          </div>
        )}
      </PageHero>

      {activeTab === 'all' && (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/72">
                <span>{job.type}</span>
                <span>{job.format}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold">{job.title}</h2>
              <p className="mt-3 text-ink/82">{(job.company && job.company.name) || 'Частное лицо'} · {job.city}, {job.country}</p>
              <p className="mt-3 text-ink/82">{job.salary} · до {new Date(job.deadline).toLocaleDateString()}</p>
              
              {applyingJobId === job.id ? (
                <form onSubmit={handleApply} className="mt-5 space-y-3 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap gap-3">
                    <input required value={cvUrl} onChange={e => setCvUrl(e.target.value)} type="text" placeholder="Ссылка на резюме или загрузите файл" className="min-w-0 flex-1 rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
                    <label className="cursor-pointer rounded border border-ink/20 px-5 py-3 text-sm font-bold text-ink">
                      {uploadingCv ? 'Загрузка...' : 'Загрузить резюме'}
                      <input type="file" className="hidden" onChange={async (event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        setUploadingCv(true)
                        try {
                          const uploaded = await uploadFile(file, 'cv')
                          setCvUrl(uploaded.url)
                        } finally {
                          setUploadingCv(false)
                          event.target.value = ''
                        }
                      }} />
                    </label>
                  </div>
                  <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Сопроводительное письмо" rows="3" className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"></textarea>
                  <div className="flex gap-3">
                    <button type="submit" className="rounded bg-moss px-5 py-2 font-bold text-ink hover:bg-moss/80">Отправить</button>
                    <button type="button" onClick={() => setApplyingJobId(null)} className="rounded border border-ink/20 px-5 py-2 font-bold text-ink hover:bg-moss/5">Отмена</button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/${lang}/jobs/${job.id}`} className="rounded bg-moss px-5 py-2 font-semibold text-white">Подробнее</Link>
                    <button onClick={() => setApplyingJobId(job.id)} className="rounded bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold/80 transition-colors">Откликнуться</button>
                  </div>
                  <span className="text-sm text-ink/72">{jobStatusLabels[job.status] || job.status}</span>
                </div>
              )}
            </Card>
          ))}
          {jobs.length === 0 && <Card><p className="text-ink/72">Вакансии пока не добавлены.</p></Card>}
        </div>
      )}

      {activeTab === 'my' && (
        <div className="grid gap-6 md:grid-cols-2">
          {myJobs.map((job) => (
            <Card key={job.id} className="border-l-4 border-l-moss border-r border-y border-ink/10 bg-white">
              <h2 className="text-2xl font-bold">{job.title}</h2>
              <div className="mt-2 flex items-center gap-3 text-sm text-ink/72">
                <span className="font-semibold text-ink/80">{jobStatusLabels[job.status] || job.status}</span>
                <span>Откликов: {job.applications?.length || 0}</span>
              </div>
              {job.applications && job.applications.length > 0 && (
                <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
                  <h3 className="font-bold text-ink">Откликнувшиеся кандидаты:</h3>
                  {job.applications.map((app) => (
                    <div key={app.id} className="rounded-md bg-moss/5 p-3 text-sm">
                      <p className="font-bold">{app.user?.profile?.fullName || app.user?.email}</p>
                      {app.cvUrl && (
                        <a href={toAbsoluteUploadUrl(app.cvUrl)} target="_blank" rel="noreferrer" className="text-moss hover:underline">Открыть резюме</a>
                      )}
                      {app.message && <p className="mt-2 text-ink/82">"{app.message}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
