import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useSEO } from '../hooks/useSEO'

const SPECIALTIES = [
  'Экономика и бухгалтерский учет',
  'Финансы: бюджет и бюджетный учет',
  'Финансы предприятий',
  'Банковское дело',
  'Страховое дело',
  'Налоги и налогообложение',
  'Менеджмент',
  'Маркетинг',
  'Операционная деятельность в логистике'
]

const STEP_KEYS = [
  { id: 1, key: 'personal' },
  { id: 2, key: 'contacts' },
  { id: 3, key: 'career' },
  { id: 4, key: 'mentorship' }
]

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-ink/40">{hint}</p>}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/10'

function Input(props) {
  return <input className={inputCls} {...props} />
}

function Select({ children, ...props }) {
  return <select className={inputCls} {...props}>{children}</select>
}

function Textarea(props) {
  return <textarea className={`${inputCls} resize-none`} {...props} />
}

function CheckCard({ checked, onChange, title, desc }) {
  return (
    <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition ${checked ? 'border-moss bg-moss/5' : 'border-ink/10 bg-white/60 hover:border-moss/30'}`}>
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${checked ? 'border-moss bg-moss' : 'border-ink/20'}`}>
        {checked && <span className="text-[10px] font-black text-white">✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-ink/50">{desc}</p>
      </div>
    </label>
  )
}

const emptyForm = {
  fullName: '', graduationYear: '', specialty: '', group: '',
  email: '', password: '', passwordConfirm: '', phone: '', city: '', country: 'Кыргызстан',
  company: '', position: '', bio: '', achievements: '', skills: '',
  isMentor: false, canHelpStudents: false, showEmail: false, showPhone: false
}

export function RegisterPage() {
  const { lang = 'ru' } = useParams()
  const { t } = useTranslation()
  useSEO({ title: t('seo.register.title'), description: t('seo.register.desc') })
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!form.fullName.trim()) e.fullName = t('register.validation.fullNameRequired')
      else if (form.fullName.trim().split(' ').filter(Boolean).length < 2) e.fullName = t('register.validation.fullNameParts')
      if (!form.graduationYear) e.graduationYear = t('register.validation.yearRequired')
      else if (Number(form.graduationYear) < 1931 || Number(form.graduationYear) > new Date().getFullYear()) e.graduationYear = t('register.validation.yearInvalid')
      if (!form.specialty) e.specialty = t('register.validation.specialtyRequired')
    }
    if (step === 2) {
      if (!form.email.trim()) e.email = t('register.validation.emailRequired')
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('register.validation.emailInvalid')
      if (!form.password) e.password = t('register.validation.passwordRequired')
      else if (form.password.length < 8) e.password = t('register.validation.passwordMin')
      if (form.password !== form.passwordConfirm) e.passwordConfirm = t('register.validation.passwordMismatch')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep((s) => s + 1) }
  const back = () => setStep((s) => s - 1)

  const submit = async () => {
    setLoading(true)
    setServerError('')
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      await api.post('/alumni/register', {
        fullName: form.fullName.trim(),
        graduationYear: Number(form.graduationYear),
        specialty: form.specialty,
        groupName: form.group.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        company: form.company.trim() || undefined,
        position: form.position.trim() || undefined,
        bio: form.bio.trim() || undefined,
        achievements: form.achievements.trim() || undefined,
        skills: skills.length ? skills : undefined,
        isMentor: form.isMentor,
        canHelpStudents: form.canHelpStudents,
        showEmail: form.showEmail,
        showPhone: form.showPhone
      })
      setSuccess(true)
    } catch (err) {
      setServerError(err.response?.data?.error || t('register.serverError'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-[2rem] border-2 border-[#8edfe7] bg-gradient-to-br from-[#f5fdff] via-[#d9f5f7] to-[#bdeef2] p-10 shadow-[0_18px_46px_rgba(15,126,168,0.16)] text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-moss/10 text-4xl">🎓</div>
          <h2 className="mt-6 font-display text-3xl font-bold">{t('register.successTitle')}</h2>
          <p className="mt-4 leading-7 text-ink/65">
            {t('register.successText')}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to={`/${lang}/alumni`} className="rounded-full bg-moss px-6 py-3 font-bold text-white hover:bg-moss/80 transition-colors">
              {t('register.directory')}
            </Link>
            <Link to={`/${lang}`} className="rounded-full border border-ink/10 px-6 py-3 font-semibold hover:bg-ink/5 transition-colors">
              {t('common.backHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Hero */}
      <section className="rounded-[2rem] border-2 border-[#72dce1] bg-gradient-to-r from-[#0879a8] via-[#1d9fbd] to-[#3bc4c7] px-8 py-8 text-white shadow-[0_20px_50px_rgba(15,126,168,0.28)]">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-white/65">{t('register.eyebrow')}</p>
        <h1 className="mt-3 font-display text-4xl font-bold">{t('register.title')}</h1>
        <p className="mt-3 max-w-lg leading-7 text-white/80">
          {t('register.subtitle')}
        </p>
      </section>

      {/* Step progress */}
      <div className="flex items-center">
        {STEP_KEYS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-all duration-300 ${
                step > s.id ? 'bg-moss text-white shadow-md shadow-moss/30' :
                step === s.id ? 'bg-moss text-white shadow-lg shadow-moss/25 ring-4 ring-moss/20' :
                'bg-ink/8 text-ink/30'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span className={`hidden text-[10px] font-bold uppercase tracking-wide sm:block whitespace-nowrap ${step === s.id ? 'text-moss' : 'text-ink/35'}`}>
                {t(`register.steps.${s.key}`)}
              </span>
            </div>
            {i < STEP_KEYS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full transition-all duration-500 ${step > s.id ? 'bg-moss' : 'bg-ink/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-[2rem] border-2 border-[#8edfe7] bg-gradient-to-br from-[#f5fdff]/96 via-[#d9f5f7]/96 to-[#bdeef2]/96 p-6 shadow-[0_18px_46px_rgba(15,126,168,0.16)] backdrop-blur md:p-8">

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('register.sections.personalTitle')}</h2>
              <p className="mt-1 text-sm text-ink/50">{t('register.sections.personalText')}</p>
            </div>
            <Field label={t('register.fields.fullName')} error={errors.fullName}>
              <Input value={form.fullName} onChange={set('fullName')} placeholder={t('register.placeholders.fullName')} autoFocus />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('register.fields.graduationYear')} error={errors.graduationYear}>
                <Input value={form.graduationYear} onChange={set('graduationYear')} type="number" min="1931" max={new Date().getFullYear()} placeholder={t('register.placeholders.year')} />
              </Field>
              <Field label={t('register.fields.group')}>
                <Input value={form.group} onChange={set('group')} placeholder={t('register.placeholders.group')} />
              </Field>
            </div>
            <Field label={t('register.fields.specialty')} error={errors.specialty}>
              <Select value={form.specialty} onChange={set('specialty')}>
                <option value="">{t('register.placeholders.specialty')}</option>
                {SPECIALTIES.map((spec) => <option key={spec} value={spec}>{t(`register.specialties.${spec}`)}</option>)}
              </Select>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('register.sections.contactsTitle')}</h2>
              <p className="mt-1 text-sm text-ink/50">{t('register.sections.contactsText')}</p>
            </div>
            <Field label={t('register.fields.email')} error={errors.email}>
              <Input value={form.email} onChange={set('email')} type="email" placeholder={t('register.placeholders.email')} autoFocus />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('register.fields.password')} error={errors.password} hint={t('register.hints.password')}>
                <Input value={form.password} onChange={set('password')} type="password" placeholder={t('register.placeholders.password')} />
              </Field>
              <Field label={t('register.fields.repeatPassword')} error={errors.passwordConfirm}>
                <Input value={form.passwordConfirm} onChange={set('passwordConfirm')} type="password" placeholder={t('register.placeholders.password')} />
              </Field>
            </div>
            <Field label={t('register.fields.phone')}>
              <Input value={form.phone} onChange={set('phone')} type="tel" placeholder={t('register.placeholders.phone')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('register.fields.city')}>
                <Input value={form.city} onChange={set('city')} placeholder={t('register.placeholders.city')} />
              </Field>
              <Field label={t('register.fields.country')}>
                <Input value={form.country} onChange={set('country')} placeholder={t('register.placeholders.country')} />
              </Field>
            </div>
            <div className="space-y-3 rounded-2xl bg-white/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">{t('register.sections.privacy')}</p>
              <CheckCard checked={form.showEmail} onChange={set('showEmail')} title={t('register.privacy.showEmailTitle')} desc={t('register.privacy.showEmailDesc')} />
              <CheckCard checked={form.showPhone} onChange={set('showPhone')} title={t('register.privacy.showPhoneTitle')} desc={t('register.privacy.showPhoneDesc')} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('register.sections.careerTitle')}</h2>
              <p className="mt-1 text-sm text-ink/50">{t('register.sections.careerText')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('register.fields.company')}>
                <Input value={form.company} onChange={set('company')} placeholder={t('register.placeholders.company')} />
              </Field>
              <Field label={t('register.fields.position')}>
                <Input value={form.position} onChange={set('position')} placeholder={t('register.placeholders.position')} />
              </Field>
            </div>
            <Field label={t('register.fields.bio')} hint={t('register.hints.bio')}>
              <Textarea value={form.bio} onChange={set('bio')} placeholder={t('register.placeholders.bio')} rows={3} />
            </Field>
            <Field label={t('register.fields.achievements')}>
              <Textarea value={form.achievements} onChange={set('achievements')} placeholder={t('register.placeholders.achievements')} rows={2} />
            </Field>
            <Field label={t('register.fields.skills')} hint={t('register.hints.skills')}>
              <Input value={form.skills} onChange={set('skills')} placeholder={t('register.placeholders.skills')} />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('register.sections.mentorshipTitle')}</h2>
              <p className="mt-1 text-sm text-ink/50">{t('register.sections.mentorshipText')}</p>
            </div>
            <div className="space-y-3">
              <CheckCard checked={form.isMentor} onChange={set('isMentor')} title={t('register.mentorship.mentorTitle')} desc={t('register.mentorship.mentorDesc')} />
              <CheckCard checked={form.canHelpStudents} onChange={set('canHelpStudents')} title={t('register.mentorship.helpTitle')} desc={t('register.mentorship.helpDesc')} />
            </div>
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-5 space-y-2.5">
              <p className="text-sm font-bold text-moss">{t('register.sections.nextTitle')}</p>
              {t('register.nextSteps', { returnObjects: true }).map((text, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-ink/65">
                  <span className="mt-0.5 font-bold text-moss shrink-0">{i + 1}.</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            {serverError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {serverError}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink/8 pt-6">
          <div>
            {step > 1 && (
              <button onClick={back} className="rounded-full border border-ink/10 px-6 py-3 font-bold hover:bg-ink/5 transition-colors">
                ← {t('common.back')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink/30">{step} / {STEP_KEYS.length}</span>
            {step < STEP_KEYS.length ? (
              <button onClick={next} className="rounded-full bg-moss px-7 py-3 font-bold text-white hover:bg-moss/80 transition-colors shadow-md shadow-moss/20">
                {t('register.next')} →
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="rounded-full bg-moss px-7 py-3 font-bold text-white hover:bg-moss/80 disabled:opacity-50 transition-colors shadow-md shadow-moss/20">
                {loading ? t('register.sending') : t('register.submit')}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-ink/40">
        {t('register.alreadyAccount')}{' '}
        <Link to={`/${lang}/cabinet`} className="font-bold text-moss hover:text-moss/70 transition-colors">
          {t('register.signInCabinet')}
        </Link>
      </p>
    </div>
  )
}
