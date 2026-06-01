import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { useSEO } from '../hooks/useSEO'

export function DonationCampaignPage() {
  const { id, lang = 'ru' } = useParams()
  const { t, i18n } = useTranslation()
  const [campaign, setCampaign] = useState(null)
  const [form, setForm] = useState({ amount: 1000, donorName: '', anonymous: false })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useSEO({ title: campaign ? getLocalized(campaign.title, i18n.language) : t('seo.donations.title') })

  const loadCampaign = () => {
    api.get(`/donations/campaigns/${id}`)
      .then(({ data }) => setCampaign(data))
      .catch(() => setError(t('donations.campaignNotFound')))
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
      setError(err.response?.data?.error || t('donations.sendError'))
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
            <span className="text-white">{raised.toLocaleString()} KGS</span>
            <span className="text-white">{goal.toLocaleString()} KGS</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-white/20">
            <div
              className="h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-white/80">{percent}% {t('donations.percent')}</p>
        </div>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Форма взноса */}
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
                className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink outline-none focus:border-moss"
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
                className="rounded-md border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/45 outline-none focus:border-moss"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md bg-[#eefbfc] px-4 py-3 font-semibold text-ink hover:bg-[#e2f7fa] transition-colors">
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
          <div className="mt-5 rounded-md bg-[#eefbfc] p-5 text-sm space-y-0 overflow-x-auto">
            <table className="w-full min-w-[340px] text-sm border-collapse">
              <tbody>
                {[
                  [t('donations.bankFields.clientName'), 'ОО "Ассоциация выпускников финтеха"'],
                  [t('donations.bankFields.settlementAccount'), '1033220002105828'],
                  [t('donations.bankFields.bankBik'), '103032'],
                  [t('donations.bankFields.clientInn'), '02105202410226'],
                  [t('donations.bankFields.bankInn'), '42607201110131'],
                  [t('donations.bankFields.recipientBank'), 'ФИЛИАЛ "МБАНК ПЛАЗА" ОАО "МБАНК"'],
                  [t('donations.bankFields.bankAddress'), 'г. Бишкек, пр. Чуй, дом 127'],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b border-ink/8 last:border-0">
                    <td className="py-2.5 pr-4 font-semibold text-ink/55 whitespace-nowrap align-top">{label}</td>
                    <td className="py-2.5 font-bold text-ink select-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* QR-код МБанк */}
          <div className="mt-5 border-t border-ink/10 pt-5">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3">{t('donations.orQr')}</p>
            <div className="flex items-center gap-4">
              <img
                src="/mbank-qr.png"
                alt="QR-код МБанк для перевода"
                className="h-28 w-28 shrink-0 rounded-lg border border-ink/10 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <p className="text-xs text-ink/55 leading-5">
                {t('donations.qrText')}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-ink/72 leading-6">{t('donations.manualConfirm')}</p>
          <p className="mt-2 text-sm text-ink/60">
            {t('donations.questions')}{' '}
            <a href="mailto:vypuskniki.finteha@gmail.com" className="font-semibold text-moss hover:underline">
              vypuskniki.finteha@gmail.com
            </a>
          </p>
        </Card>
      </div>

      {/* Список доноров */}
      <Card>
        <h2 className="font-display text-3xl font-bold">{t('donations.donorsList')}</h2>
        <p className="mt-1 text-sm text-ink/72">{t('donations.donorCount', { count: donors.length })}</p>
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
