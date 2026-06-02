import React, { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Card, PageHero } from '../components/UI'
import { useSEO } from '../hooks/useSEO'

export function ResetPasswordPage() {
  const { lang = 'ru' } = useParams()
  const { t } = useTranslation()
  useSEO({ title: t('resetPassword.title') })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      return setError(t('resetPassword.minError'))
    }
    if (newPassword !== confirm) {
      return setError(t('resetPassword.mismatch'))
    }
    if (!token) {
      return setError(t('resetPassword.invalidRequest'))
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      setDone(true)
      setTimeout(() => navigate(`/${lang}/cabinet`), 3000)
    } catch (err) {
      setError(err.response?.data?.error || t('resetPassword.expiredError'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <PageHero>
          <h1 className="font-display text-4xl font-bold">{t('resetPassword.title')}</h1>
        </PageHero>
        <Card className="max-w-md mx-auto text-center space-y-4">
          <div className="text-5xl">!</div>
          <h2 className="font-display text-xl font-bold text-red-700">{t('resetPassword.invalidTitle')}</h2>
          <p className="text-ink/72">{t('resetPassword.invalidText')}</p>
          <Link
            to={`/${lang}/forgot-password`}
            className="inline-block rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/90 transition-colors"
          >
            {t('resetPassword.requestNew')}
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('resetPassword.newTitle')}</h1>
        <p className="mt-3 text-white/86">{t('resetPassword.subtitle')}</p>
      </PageHero>

      <Card className="max-w-md mx-auto">
        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✓</div>
            <h2 className="font-display text-2xl font-bold text-moss">{t('resetPassword.successTitle')}</h2>
            <p className="text-ink/72">{t('resetPassword.successText')}</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-6">{t('resetPassword.formTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-ink/50">
                  {t('resetPassword.newPassword')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder={t('resetPassword.minPlaceholder')}
                  className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-ink/50">
                  {t('resetPassword.repeatPassword')}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder={t('resetPassword.repeatPlaceholder')}
                  className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
                />
              </div>

              {confirm && newPassword !== confirm && (
                <p className="text-amber-600 text-sm">{t('resetPassword.mismatch')}</p>
              )}

              {error && <p className="text-red-700 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || (confirm.length > 0 && newPassword !== confirm)}
                className="w-full rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/90 transition-colors disabled:opacity-60"
              >
                {loading ? t('resetPassword.saving') : t('resetPassword.save')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/50">
              <Link to={`/${lang}/forgot-password`} className="text-moss font-semibold hover:underline">
                {t('resetPassword.requestNew')}
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
