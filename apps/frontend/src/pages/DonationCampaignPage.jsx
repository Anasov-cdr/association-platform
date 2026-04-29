import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'

export function DonationCampaignPage() {
  const { id, lang = 'ru' } = useParams()
  const { t, i18n } = useTranslation()
  const [campaign, setCampaign] = useState(null)
  const [form, setForm] = useState({ amount: 1000, donorName: '', anonymous: false })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const loadCampaign = () => {
    api.get(`/donations/campaigns/${id}`)
      .then(({ data }) => setCampaign(data))
      .catch(() => setError('Кампания не найдена'))
  }

  useEffect(() => { loadCampaign() }, [id])

  const donate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/donations/donate', {
        campaignId: id, ...form, amount: Number(form.amount)
      })
      setNotice(t('donations.sent'))
      setForm({ amount: 1000, donorName: '', anonymous: false })
      loadCampaign()
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось отправить пожертвование')
    }
  }

  if (!campaign && error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!campaign) return <Card><p className="text-ink/72">{t('common.loading')}</p></Card>

  const goal = Number(campaign.goalAmount || 0)
  const raised = Number(campaign.raisedAmount || 0)
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0

  const donors = (campaign.donations || []).filter((d) => d.status !== 'rejected')

  return (
    <div className="space-y-6">
      <Link to={`/${lang}/donations`} className="inline-flex items-center gap-2 font-bold text-moss hover:text-moss/70 transition-colors">
        ← {t('donations.backToCampaigns')}
      </Link>

      {(notice || error) && (
        <Card className={error ? 'border-red-200 bg-red-50 text-red-800' : 'border-moss/20 bg-moss/10 text-green-900'}>
          {error || notice}
        </Card>
      )}

      {/* Основная информация */}
      <PageHero>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-white/70">
          {t('sections.campaigns')}
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
          {getLocalized(campaign.title, i18n.language)}
        </h1>
        <p className="mt-5 text-lg leading-8 text-white/86">
          {getLocalized(campaign.description, i18n.language)}
        </p>

        {/* Прогресс */}
        <div className="mt-8">
          <div className="flex justify-between text-sm font-semibold text-white/78 mb-2">
            <span>{t('donations.raised')}</span>
            <span>{t('donations.goal')}</span>
          </div>
          <div className="flex justify-between font-bold text-xl">
            <span className="text-moss">{raised.toLocaleString()} KGS</span>
            <span>{goal.toLocaleString()} KGS</span>
          </div>
          <div className="mt-3 h-4 rounded bg-moss/10">
            <div
              className="h-4 rounded bg-moss transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-ink/72">{percent}% {t('donations.percent')}</p>
        </div>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Форма пожертвования */}
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('donations.donate')}</h2>
          <form onSubmit={donate} className="mt-6 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-widest text-ink/50">
                {t('donations.amount')}
              </label>
              <input
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                type="number"
                min="1"
                required
                className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-widest text-ink/50">
                {t('donations.donorName')}
              </label>
              <input
                value={form.donorName}
                onChange={(e) => setForm((prev) => ({ ...prev, donorName: e.target.value }))}
                placeholder={t('donations.donorName')}
                className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md bg-[#eefbfc] px-4 py-3 font-semibold hover:bg-[#e2f7fa] transition-colors">
              <input
                checked={form.anonymous}
                onChange={(e) => setForm((prev) => ({ ...prev, anonymous: e.target.checked }))}
                type="checkbox"
                className="h-4 w-4 accent-moss"
              />
              {t('donations.anonymous')}
            </label>
            <button className="w-full rounded bg-moss px-6 py-4 font-bold text-white hover:bg-moss/80 transition-colors">
              {t('donations.donateCta')}
            </button>
          </form>
        </Card>

        {/* Реквизиты для перевода */}
        <Card>
          <h2 className="font-display text-3xl font-bold">{t('donations.bankDetails')}</h2>
          <div className="mt-5 space-y-4 rounded-md bg-[#eefbfc] p-5 text-sm">
            <div>
              <p className="font-bold text-ink/50 uppercase text-xs tracking-widest mb-1">{t('donations.bankName')}</p>
              <p className="font-semibold">БФЭТ им. А. Токтоналиева</p>
            </div>
            <div>
              <p className="font-bold text-ink/50 uppercase text-xs tracking-widest mb-1">{t('donations.accountNumber')}</p>
              <p className="font-mono font-semibold select-all">KG — уточните у администратора</p>
            </div>
            <div className="border-t border-ink/10 pt-4">
              <p className="font-bold text-ink/50 uppercase text-xs tracking-widest mb-2">{t('donations.orQr')}</p>
              <div className="flex h-24 w-24 items-center justify-center rounded-md bg-moss/10 text-xs text-ink/40 font-semibold">
                QR-код
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink/72 leading-6">{t('donations.manualConfirm')}</p>
        </Card>
      </div>

      {/* Список доноров */}
      <Card>
        <h2 className="font-display text-3xl font-bold">{t('donations.donorsList')}</h2>
        <p className="mt-1 text-sm text-ink/72">{donors.length} {donors.length === 1 ? 'донор' : 'доноров'}</p>
        {donors.length === 0 ? (
          <p className="mt-5 text-ink/72">{t('donations.noDonors')}</p>
        ) : (
          <div className="mt-5 divide-y divide-ink/5">
            {donors.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-moss/10 text-sm font-bold text-moss">
                    {d.anonymous ? '?' : (d.donorName?.[0] || '?')}
                  </div>
                  <span className="font-semibold">
                    {d.anonymous ? t('donations.anonymousDonor') : (d.donorName || t('donations.anonymousDonor'))}
                  </span>
                </div>
                <span className="font-bold text-moss whitespace-nowrap">
                  {Number(d.amount).toLocaleString()} KGS
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
