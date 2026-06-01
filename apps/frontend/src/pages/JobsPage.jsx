import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { toAbsoluteUploadUrl, uploadFile } from '../uploads'
import { useSEO } from '../hooks/useSEO'

const appStatusConfig = {
  SENT:     { cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  VIEWED:   { cls: 'bg-ink/5 text-ink/60 border-ink/10' },
  INVITED:  { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED: { cls: 'bg-moss/10 text-moss border-moss/20' },
  REJECTED: { cls: 'bg-red-50 text-red-700 border-red-200' },
  PENDING:  { cls: 'bg-amber-50 text-amber-700 border-amber-200' }
}

const emptyEditForm = { title: '', description: '', requirements: '', duties: '', type: 'стажировка', format: 'гибрид', city: 'Бишкек', country: 'Кыргызстан', salary: '', deadline: '', contacts: '' }

export function JobsPage() {
  const { lang = 'ru' } = useParams()
  const { t } = useTranslation()
  useSEO({ title: t('seo.jobs.title'), description: t('seo.jobs.desc') })
  const [activeTab, setActiveTab] = useState('all')
  const [jobs, setJobs] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [cvUrl, setCvUrl] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [uploadingCv, setUploadingCv] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [editingJob, setEditingJob] = useState(null) // job object being edited
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [saving, setSaving] = useState(false)
  const auth = useAppStore((state) => state)

  const loadJobs = useCallback(() => {
    const params = {}
    if (search.trim()) params.query = search.trim()
    if (typeFilter) params.type = typeFilter
    if (formatFilter) params.format = formatFilter
    api.get('/jobs', { params }).then(({ data }) => setJobs(data)).catch(() => setJobs([]))
  }, [search, typeFilter, formatFilter])

  const loadMyJobs = useCallback(() => {
    api.get('/jobs/my').then(({ data }) => setMyJobs(data)).catch(() => setMyJobs([]))
  }, [])

  useEffect(() => {
    if (activeTab === 'all') {
      const timer = setTimeout(loadJobs, 300)
      return () => clearTimeout(timer)
    }
    if (activeTab === 'my' && auth.accessToken) loadMyJobs()
    if (activeTab === 'applications' && auth.accessToken) {
      api.get('/jobs/applications/my').then(({ data }) => setMyApplications(data)).catch(() => setMyApplications([]))
    }
  }, [activeTab, auth.accessToken, loadJobs, loadMyJobs])

  const handleApply = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/jobs/${applyingJobId}/apply`, { cvUrl, message: applyMessage })
      alert(t('jobs.applicationSubmitSuccess'))
      setApplyingJobId(null)
      setCvUrl('')
      setApplyMessage('')
    } catch (err) {
      alert(err.response?.data?.error || t('jobs.applicationSubmitError'))
    }
  }

  const startEdit = (job) => {
    setEditingJob(job)
    setEditForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      duties: job.duties || '',
      type: job.type || 'стажировка',
      format: job.format || 'гибрид',
      city: job.city || 'Бишкек',
      country: job.country || 'Кыргызстан',
      salary: job.salary || '',
      deadline: job.deadline ? job.deadline.slice(0, 10) : '',
      contacts: job.contacts || ''
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...editForm, deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : undefined }
      await api.put(`/jobs/${editingJob.id}`, payload)
      setEditingJob(null)
      loadMyJobs()
    } catch (err) {
      alert(err.response?.data?.error || t('jobs.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const deleteJob = async (job) => {
    if (!window.confirm(t('jobs.deleteConfirm', { title: job.title }))) return
    try {
      await api.delete(`/jobs/${job.id}`)
      setMyJobs((prev) => prev.filter((j) => j.id !== job.id))
    } catch (err) {
      alert(err.response?.data?.error || t('jobs.deleteError'))
    }
  }

  const setAppStatus = async (appId, status, jobId) => {
    try {
      await api.patch(`/jobs/applications/${appId}/status`, { status })
      setMyJobs((prev) => prev.map((job) =>
        job.id === jobId
          ? { ...job, applications: job.applications.map((a) => a.id === appId ? { ...a, status } : a) }
          : job
      ))
    } catch (err) {
      alert(err.response?.data?.error || t('jobs.changeStatusError'))
    }
  }

  const tabs = [
    { id: 'all', label: t('jobs.allJobs') },
    ...(auth.accessToken ? [
      { id: 'my', label: t('jobs.myJobs') },
      { id: 'applications', label: t('jobs.myResponses') }
    ] : [])
  ]

  return (
    <div className="space-y-6">
      <PageHero>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">{t('jobs.title')}</h1>
            <p className="mt-3 max-w-3xl text-white/86">{t('jobs.subtitle')}</p>
          </div>
          {auth.accessToken && (
            <div className="flex rounded bg-white/14 p-1 shrink-0">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`rounded px-4 py-2 text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-white text-ink shadow' : 'text-white/80 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'all' && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('jobs.search')}
              className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss">
              <option value="">{t('jobs.allTypes')}</option>
              {['стажировка', 'работа', 'подработка', 'проект'].map((type) => <option key={type} value={type}>{t(`jobs.types.${type}`)}</option>)}
            </select>
            <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}
              className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss">
              <option value="">{t('jobs.allFormats')}</option>
              {['офис', 'удаленно', 'гибрид'].map((format) => <option key={format} value={format}>{t(`jobs.formats.${format}`)}</option>)}
            </select>
          </div>
        )}
      </PageHero>

      {/* ── Все вакансии ── */}
      {activeTab === 'all' && (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
                <span className="rounded bg-moss/10 px-2 py-0.5 text-xs font-bold text-moss">{t(`jobs.types.${job.type}`) || job.type}</span>
                <span>{t(`jobs.formats.${job.format}`) || job.format}</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold">{job.title}</h2>
              <p className="mt-2 text-ink/82">{(job.company && job.company.name) || t('jobs.private')} · {job.city}, {job.country}</p>
              {job.salary && <p className="mt-1 text-sm text-ink/72">{job.salary}</p>}
              {job.deadline && <p className="mt-1 text-xs text-ink/50">{t('jobs.until')} {new Date(job.deadline).toLocaleDateString(lang)}</p>}

              {applyingJobId === job.id ? (
                <form onSubmit={handleApply} className="mt-5 space-y-3 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap gap-3">
                    <input value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} type="text"
                      placeholder={t('jobs.cvOrUpload')}
                      className="min-w-0 flex-1 rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                    <label className="cursor-pointer rounded border border-ink/20 px-4 py-3 text-sm font-bold text-ink hover:bg-moss/5 transition-colors">
                      {uploadingCv ? t('common.loading') : t('jobs.upload')}
                      <input type="file" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return
                        setUploadingCv(true)
                        try { const u = await uploadFile(file, 'cv'); setCvUrl(u.url) }
                        finally { setUploadingCv(false); e.target.value = '' }
                      }} />
                    </label>
                  </div>
                  <textarea required value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder={t('jobs.coverLetter')} rows="3"
                    className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                  <div className="flex gap-3">
                    <button type="submit" className="rounded bg-moss px-5 py-2 font-bold text-white hover:bg-moss/80 transition-colors">{t('common.send')}</button>
                    <button type="button" onClick={() => setApplyingJobId(null)} className="rounded border border-ink/20 px-5 py-2 font-bold text-ink hover:bg-moss/5 transition-colors">{t('common.cancel')}</button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/${lang}/jobs/${job.id}`} className="rounded bg-moss px-5 py-2 text-sm font-semibold text-white hover:bg-moss/80 transition-colors">{t('common.learnMore')}</Link>
                    {job.status === 'PUBLISHED' && auth.accessToken && (
                      <button onClick={() => setApplyingJobId(job.id)} className="rounded bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold/80 transition-colors">{t('jobs.apply')}</button>
                    )}
                  </div>
                  <span className="text-xs text-ink/50">{t(`jobs.jobStatuses.${job.status}`) || job.status}</span>
                </div>
              )}
            </Card>
          ))}
          {jobs.length === 0 && <Card><p className="text-ink/72">{t('jobs.noJobsFound')}</p></Card>}
        </div>
      )}

      {/* ── Мои вакансии (работодатель) ── */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {editingJob && (
            <Card>
              <h2 className="font-display text-2xl font-bold">{t('jobs.editJob')}</h2>
              <form onSubmit={saveEdit} className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{t('jobs.titleField')} *</label>
                  <input required value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{t('jobs.description')} *</label>
                  <textarea required rows="3" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{t('jobs.requirements')}</label>
                  <textarea rows="2" value={editForm.requirements} onChange={(e) => setEditForm((p) => ({ ...p, requirements: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{t('jobs.duties')}</label>
                  <textarea rows="2" value={editForm.duties} onChange={(e) => setEditForm((p) => ({ ...p, duties: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                </div>
                {[
                  [t('jobs.allTypes'), 'type', ['стажировка','работа','подработка','проект'], 'types'],
                  [t('jobs.allFormats'), 'format', ['офис','удаленно','гибрид'], 'formats']
                ].map(([lbl, key, opts, scope]) => (
                  <div key={key}>
                    <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{lbl}</label>
                    <select value={editForm[key]} onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss">
                      {opts.map((o) => <option key={o} value={o}>{t(`jobs.${scope}.${o}`) || o}</option>)}
                    </select>
                  </div>
                ))}
                {[[t('cabinet.fields.city'), 'city'], [t('jobs.salary'), 'salary'], [t('jobs.contacts'), 'contacts']].map(([lbl, key]) => (
                  <div key={key}>
                    <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{lbl}</label>
                    <input value={editForm[key]} onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{t('jobs.deadline')}</label>
                  <input type="date" value={editForm.deadline} onChange={(e) => setEditForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss" />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" disabled={saving} className="rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/80 disabled:opacity-50 transition-colors">
                    {saving ? t('jobs.saving') : t('common.save')}
                  </button>
                  <button type="button" onClick={() => setEditingJob(null)} className="rounded border border-ink/20 px-6 py-3 font-bold text-ink hover:bg-moss/5 transition-colors">{t('common.cancel')}</button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {myJobs.map((job) => (
              <Card key={job.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold">{job.title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold border ${
                        job.status === 'PUBLISHED' ? 'bg-moss/10 text-moss border-moss/20' :
                        job.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-ink/5 text-ink/60 border-ink/10'
                      }`}>{t(`jobs.jobStatuses.${job.status}`) || job.status}</span>
                      <span>{t('jobs.applications')}: {job.applications?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(job)}
                      className="rounded border border-moss/30 bg-moss/5 px-3 py-1.5 text-xs font-bold text-moss hover:bg-moss/10 transition-colors">
                      {t('common.edit')}
                    </button>
                    <button onClick={() => deleteJob(job)}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors">
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

                {job.applications && job.applications.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                    <h3 className="text-sm font-bold text-ink">{t('jobs.candidates')}</h3>
                    {job.applications.map((app) => {
                      const cfg = appStatusConfig[app.status] || appStatusConfig.SENT
                      return (
                        <div key={app.id} className="rounded-md border border-ink/8 bg-white p-3 text-sm space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold">{app.user?.profile?.fullName || app.user?.email}</p>
                            <span className={`rounded border px-2 py-0.5 text-xs font-bold ${cfg.cls}`}>{t(`jobs.appStatuses.${app.status}`) || app.status}</span>
                          </div>
                          {app.cvUrl && (
                            <a href={toAbsoluteUploadUrl(app.cvUrl)} target="_blank" rel="noreferrer"
                              className="block text-xs text-moss hover:underline">{t('jobs.openCv')} →</a>
                          )}
                          {app.message && <p className="text-xs text-ink/60 italic">"{app.message}"</p>}
                          {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => setAppStatus(app.id, 'ACCEPTED', job.id)}
                                className="rounded bg-moss px-3 py-1 text-xs font-bold text-white hover:bg-moss/80 transition-colors">
                                ✓ {t('jobs.accept')}
                              </button>
                              <button onClick={() => setAppStatus(app.id, 'REJECTED', job.id)}
                                className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors">
                                ✗ {t('jobs.reject')}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            ))}
            {myJobs.length === 0 && <Card><p className="text-ink/72">{t('jobs.noMyJobs')}</p></Card>}
          </div>
        </div>
      )}

      {/* ── Мои отклики (соискатель) ── */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 && <Card><p className="text-ink/72">{t('jobs.noApplications')}</p></Card>}
          {myApplications.map((app) => {
            const cfg = appStatusConfig[app.status] || appStatusConfig.SENT
            return (
              <Card key={app.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold">{app.job?.title || t('jobs.deletedJob')}</h2>
                    <p className="mt-1 text-sm text-ink/60">
                      {app.job?.company?.name || t('jobs.private')}
                      {app.createdAt && ` · ${new Date(app.createdAt).toLocaleDateString(lang)}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded border px-3 py-1 text-xs font-bold ${cfg.cls}`}>{t(`jobs.appStatuses.${app.status}`) || app.status}</span>
                </div>
                <div className="mt-4 space-y-1 text-sm text-ink/72">
                  {app.cvUrl && (
                    <p><span className="font-semibold text-ink">{t('jobs.openCv')}: </span>
                      <a href={toAbsoluteUploadUrl(app.cvUrl)} target="_blank" rel="noreferrer" className="text-moss hover:underline">{t('common.view')}</a>
                    </p>
                  )}
                  {app.message && <p><span className="font-semibold text-ink">{t('jobs.coverLetter')}: </span><span className="italic">"{app.message}"</span></p>}
                </div>
                {app.job?.id && (
                  <div className="mt-4 border-t border-ink/10 pt-3">
                    <Link to={`/${lang}/jobs/${app.job.id}`} className="text-sm font-semibold text-moss hover:underline">{t('jobs.openJob')} →</Link>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
