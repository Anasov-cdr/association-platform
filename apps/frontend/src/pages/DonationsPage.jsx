import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'

export function DonationsPage() {
  const { t, i18n } = useTranslation()
  const { lang = 'ru' } = useParams()
  const [campaigns, setCampaigns] = useState([])
  const [form, setForm] = useState({ campaignId: '', amount: 1000, donorName: '', anonymous: false })

  const loadCampaigns = () => {
    api.get('/donations/campaigns').then(({ data }) => {
      setCampaigns(data)
      setForm((prev) => ({ ...prev, campaignId: prev.campaignId || data[0]?.id || '' }))
    }).catch(() => setCampaigns([]))
  }

  useEffect(() => { loadCampaigns() }, [])

  const donate = async (event) => {
    event.preventDefault()
    try {
      await api.post('/donations/donate', { ...form, amount: Number(form.amount) })
      alert('Спасибо за вашу помощь! Пожертвование отправлено на подтверждение.')
      setForm((prev) => ({ ...prev, amount: 1000, donorName: '' }))
      loadCampaigns()
    } catch (error) {
      alert(error.response?.data?.error || 'Не удалось отправить пожертвование')
    }
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('nav.donations')}</h1>
        <p className="mt-3 max-w-3xl text-white/86">Платформа поддерживает кампании пожертвований с ручным подтверждением администратором.</p>
      </PageHero>
      <div className="grid gap-6 md:grid-cols-2">
        {campaigns.map((item) => {
          const goal = Number(item.goalAmount)
          const raised = Number(item.raisedAmount)
          const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
          return (
            <Card key={item.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink/82">{getLocalized(item.description, i18n.language)}</p>
                  <h2 className="mt-3 text-2xl font-bold">{getLocalized(item.title, i18n.language)}</h2>
                </div>
                <div className="text-right text-sm text-ink/72">{percent}%</div>
              </div>
              <div className="mt-4 h-3 rounded bg-moss/10">
                <div className="h-3 rounded bg-moss" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-ink/72">
                <span>{raised.toLocaleString()} KGS</span>
                <span>{goal.toLocaleString()} KGS</span>
              </div>
              <Link to={`/${lang}/donations/${item.id}`} className="mt-5 inline-flex rounded bg-moss px-5 py-3 text-sm font-bold text-white">Подробнее</Link>
            </Card>
          )
        })}
        {campaigns.length === 0 && <Card><p className="text-ink/72">Кампании пока не добавлены.</p></Card>}
      </div>
      <Card>
        <h2 className="font-display text-3xl font-bold">Сделать пожертвование</h2>
        <form onSubmit={donate} className="mt-6 grid gap-4 md:grid-cols-2">
          <select value={form.campaignId} onChange={(e) => setForm((prev) => ({ ...prev, campaignId: e.target.value }))} className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none">
            {campaigns.map((item) => <option key={item.id} value={item.id}>{getLocalized(item.title, i18n.language)}</option>)}
          </select>
          <input value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} type="number" min="1" placeholder="Сумма" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none" />
          <input value={form.donorName} onChange={(e) => setForm((prev) => ({ ...prev, donorName: e.target.value }))} placeholder="Имя донора" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none" />
          <label className="flex items-center gap-3 rounded-md bg-[#eefbfc] px-4 py-3 font-semibold"><input checked={form.anonymous} onChange={(e) => setForm((prev) => ({ ...prev, anonymous: e.target.checked }))} type="checkbox" /> Анонимно</label>
          <button type="submit" className="rounded bg-moss px-6 py-3 font-bold text-white md:col-span-2">Отправить</button>
        </form>
      </Card>
    </div>
  )
}
