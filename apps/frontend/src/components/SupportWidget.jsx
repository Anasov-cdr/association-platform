import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

// Номер WhatsApp ассоциации (формат: 996XXXXXXXXX без + и пробелов)
const WHATSAPP_NUMBER = '996708007876'

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// Темы обращений: иконка, текст, подсказка для WhatsApp, куда ведёт кнопка платформы
const TOPICS = [
  {
    id: 'register',
    icon: '📋',
    label: 'Регистрация выпускника',
    hint: 'Хочу зарегистрироваться как выпускник БФЭТ, но нужна помощь.',
    platformLink: '/register',
    platformLabel: 'Открыть форму регистрации'
  },
  {
    id: 'password',
    icon: '🔑',
    label: 'Забыл пароль / нет доступа',
    hint: 'Не могу войти в аккаунт, прошу помочь восстановить доступ.',
    platformLink: '/chat',
    platformLabel: 'Написать администратору'
  },
  {
    id: 'jobs',
    icon: '💼',
    label: 'Вакансии и стажировки',
    hint: 'Интересует размещение вакансии или поиск работы на платформе.',
    platformLink: '/jobs',
    platformLabel: 'Перейти к вакансиям'
  },
  {
    id: 'alumni',
    icon: '🎓',
    label: 'Найти выпускника / ментора',
    hint: 'Хочу найти однокурсника или ментора среди выпускников БФЭТ.',
    platformLink: '/alumni',
    platformLabel: 'Открыть каталог'
  },
  {
    id: 'donation',
    icon: '❤️',
    label: 'Помощь / поддержка ассоциации',
    hint: 'Хочу поддержать ассоциацию выпускников БФЭТ — как это сделать?',
    platformLink: '/donations',
    platformLabel: 'Перейти к поддержке'
  },
  {
    id: 'other',
    icon: '💬',
    label: 'Другой вопрос',
    hint: 'Здравствуйте! У меня есть вопрос по платформе выпускников БФЭТ.',
    platformLink: '/chat',
    platformLabel: 'Написать в чат'
  }
]

export function SupportWidget() {
  const { lang = 'ru' } = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const topic = TOPICS.find((t) => t.id === selected)

  const waUrl = topic
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(topic.hint)}`
    : `https://wa.me/${WHATSAPP_NUMBER}`

  const handleClose = () => { setOpen(false); setSelected(null) }

  const handlePlatformLink = () => {
    handleClose()
    navigate(`/${lang}${topic?.platformLink || '/chat'}`)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {open && (
        <div className="w-80 rounded-2xl bg-white shadow-2xl ring-1 ring-ink/10 overflow-hidden animate-fade-in">

          {/* Шапка */}
          <div className="bg-gradient-to-r from-[#0879a8] to-[#3bc4c7] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                  🎓
                </div>
                <div>
                  <p className="text-sm font-black text-white">Ассоциация выпускников</p>
                  <p className="text-xs text-white/75">БФЭТ · Чем можем помочь?</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Тело */}
          <div className="px-4 py-4 space-y-3">

            {!selected ? (
              /* Список тем */
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Выберите тему обращения</p>
                <div className="space-y-1.5">
                  {TOPICS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-[#eefbfc] hover:text-moss transition-colors"
                    >
                      <span className="text-base w-6 text-center shrink-0">{t.icon}</span>
                      {t.label}
                      <span className="ml-auto text-ink/25 text-xs">›</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Выбрана тема — показываем кнопки */
              <>
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-ink/45 hover:text-moss transition-colors"
                >
                  ← Назад
                </button>

                <div className="flex items-center gap-2 rounded-xl bg-[#eefbfc] px-3 py-2.5">
                  <span className="text-lg">{topic.icon}</span>
                  <p className="text-sm font-bold text-ink">{topic.label}</p>
                </div>

                <p className="text-xs text-ink/55 leading-5 px-1">
                  Выберите удобный способ связи — мы ответим как можно скорее.
                </p>

                {/* WhatsApp */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#1ebe5a] transition-colors"
                >
                  <WaIcon />
                  Написать в WhatsApp
                </a>

                {/* Платформа */}
                <button
                  onClick={handlePlatformLink}
                  className="flex w-full items-center gap-3 rounded-xl bg-moss px-4 py-3 text-sm font-bold text-white hover:bg-moss/85 transition-colors"
                >
                  <span className="text-base">💬</span>
                  {topic.platformLabel}
                </button>
              </>
            )}

            <p className="text-center text-xs text-ink/30 pt-1">
              vypuskniki.finteha@gmail.com
            </p>
          </div>
        </div>
      )}

      {/* Кнопка наверх */}
      {showTop && !open && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Наверх"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-moss shadow-lg ring-1 ring-moss/20 transition hover:bg-moss hover:text-white hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* Кнопка-триггер */}
      <button
        onClick={() => { setOpen((p) => !p); if (open) setSelected(null) }}
        className={`group relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
          open ? 'bg-ink/75' : 'bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] hover:scale-110'
        }`}
        title="Нужна помощь?"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[#3bc4c7] animate-ping opacity-30" />
        )}
        <span className="relative text-2xl">{open ? '✕' : '💬'}</span>
      </button>
    </div>
  )
}
