import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { Card, PageHero } from '../components/UI'
import { useSEO } from '../hooks/useSEO'

export function ForgotPasswordPage() {
  const { lang = 'ru' } = useParams()
  const { t } = useTranslation()
  useSEO({ title: t('forgotPassword.title') })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error || t('forgotPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">{t('forgotPassword.title')}</h1>
        <p className="mt-3 text-white/86">{t('forgotPassword.subtitle')}</p>
      </PageHero>

      <Card className="max-w-md mx-auto">
        {done ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">✉️</div>
            <h2 className="font-display text-2xl font-bold text-moss">{t('forgotPassword.sentTitle')}</h2>
            <p className="text-ink/72 leading-7">{t('forgotPassword.sentText')}</p>
            <div className="rounded-md bg-[#eefbfc] px-5 py-4 text-sm text-ink/65 leading-6">
              {t('forgotPassword.emailText')}{' '}
              <a href="mailto:vypuskniki.finteha@gmail.com" className="font-semibold text-moss hover:underline">
                vypuskniki.finteha@gmail.com
              </a>
            </div>
            <Link
              to={`/${lang}/cabinet`}
              className="inline-block rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/90 transition-colors"
            >
              {t('forgotPassword.signInCabinet')}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-2">{t('forgotPassword.contactTitle')}</h2>
            <p className="text-ink/65 text-sm mb-6">{t('forgotPassword.formHint')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-ink/50">
                  {t('forgotPassword.emailLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="example@mail.com"
                  className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
                />
              </div>

              {error && <p className="text-red-700 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-moss px-6 py-3 font-bold text-white hover:bg-moss/90 transition-colors disabled:opacity-60"
              >
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendBtn')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/50">
              {t('forgotPassword.remembered')}{' '}
              <Link to={`/${lang}/cabinet`} className="font-semibold text-moss hover:underline">
                {t('forgotPassword.signInCabinet')}
              </Link>
            </p>

            <div className="mt-4 rounded-md bg-[#eefbfc] px-5 py-4 text-sm text-ink/65 leading-6">
              {t('forgotPassword.emailText')}{' '}
              <a href="mailto:vypuskniki.finteha@gmail.com" className="font-semibold text-moss hover:underline">
                vypuskniki.finteha@gmail.com
              </a>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
