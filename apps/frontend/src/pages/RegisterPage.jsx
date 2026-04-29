import React from 'react';
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'

export function RegisterPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    fullName: '',
    graduationYear: '',
    specialty: '',
    group: '',
    city: '',
    country: '',
    company: '',
    position: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    isMentor: false,
    showEmail: false,
    showPhone: false
  })
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    try {
      await api.post('/alumni/register', {
        ...form,
        graduationYear: Number(form.graduationYear)
      })
      setMessage('Анкета отправлена. Статус профиля: на проверке.')
      setForm({
        fullName: '',
        graduationYear: '',
        specialty: '',
        group: '',
        city: '',
        country: '',
        company: '',
        position: '',
        email: '',
        password: '',
        phone: '',
        bio: '',
        isMentor: false,
        showEmail: false,
        showPhone: false
      })
    } catch (err) {
      setError('Ошибка отправки. Попробуйте снова.')
    }
  }

  return (
    <Card>
      <PageHero className="-m-6 mb-6">
        <h1 className="font-display text-4xl font-bold">{t('sections.register')}</h1>
        <p className="mt-3 max-w-2xl text-white/86">После отправки анкета получает статус «на проверке». Администратор или модератор подтверждает профиль перед публикацией в каталоге.</p>
      </PageHero>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
        <input value={form.fullName} onChange={handleChange('fullName')} placeholder="ФИО" required className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.graduationYear} onChange={handleChange('graduationYear')} placeholder="Год выпуска" required className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.specialty} onChange={handleChange('specialty')} placeholder="Специальность" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.group} onChange={handleChange('group')} placeholder="Группа" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.city} onChange={handleChange('city')} placeholder="Город" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.country} onChange={handleChange('country')} placeholder="Страна" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.company} onChange={handleChange('company')} placeholder="Место работы" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.position} onChange={handleChange('position')} placeholder="Должность" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.email} onChange={handleChange('email')} placeholder="Электронная почта" type="email" required className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.password} onChange={handleChange('password')} placeholder="Пароль минимум 8 символов" type="password" required minLength={8} className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <input value={form.phone} onChange={handleChange('phone')} placeholder="Телефон" className="rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        <textarea value={form.bio} onChange={handleChange('bio')} placeholder="Биография, достижения, навыки" className="min-h-32 rounded-md border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss md:col-span-2" />
        <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={form.isMentor} onChange={handleChange('isMentor')} /> Готов быть ментором</label>
        <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={form.showEmail} onChange={handleChange('showEmail')} /> Показывать электронную почту</label>
        <label className="flex items-center gap-3 font-semibold"><input type="checkbox" checked={form.showPhone} onChange={handleChange('showPhone')} /> Показывать телефон</label>
        <button type="submit" className="rounded bg-moss px-6 py-3 font-bold text-white md:col-span-2">Отправить на проверку</button>
      </form>
      {message && <p className="mt-5 rounded-md bg-moss/10 px-5 py-4 text-green-900">{message}</p>}
      {error && <p className="mt-5 rounded-md bg-red-100 px-5 py-4 text-red-700">{error}</p>}
    </Card>
  )
}
