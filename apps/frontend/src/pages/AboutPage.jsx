import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Mail, MapPin, Phone, Users, Award, BookOpen, Target, Heart,
  ShieldCheck, Wind, Trophy, GraduationCap, HandCoins, FileText,
  HeartHandshake, Wrench, Handshake, Medal, ClipboardList
} from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

const PHONES   = ['0550 22 97 20', '0709 22 97 20']
const WHATSAPP = '+996 708 007 876'
const EMAIL    = 'vypuskniki.finteha@gmail.com'

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const LEADERSHIP = [
  { role: 'Председатель', name: 'Карачова Нургүл Темирбековна',    Icon: ShieldCheck },
  { role: 'Президент',    name: 'Сабыралиева Айзада Кадырбековна', Icon: Award },
  { role: 'Ревизор',      name: 'Исаева Жамийла Төлөгөновна',      Icon: ClipboardList },
]

const ACHIEVEMENTS = [
  { Icon: Wind,         text: 'Оснащение учебных аудиторий и кабинета директора системой кондиционирования' },
  { Icon: BookOpen,     text: 'Приобретение учебной и методической литературы' },
  { Icon: Trophy,       text: 'Обеспечение спортивной формой футбольной и волейбольной команд техникума' },
  { Icon: Wrench,       text: 'Замена окон в учебных кабинетах, включая кабинет директора' },
  { Icon: HeartHandshake, text: 'Материальная помощь преподавателю в связи с заболеванием' },
  { Icon: Medal,        text: 'Организация и поддержка интеллектуальных и спортивных мероприятий, поощрение призёров' },
  { Icon: GraduationCap, text: 'Назначение именных стипендий двум студентам третьего курса' },
]

const GOALS = [
  { Icon: Target,       text: 'Консолидация усилий выпускников для повышения имиджа и общественной значимости БФЭТ им. А. Токтоналиева' },
  { Icon: Users,        text: 'Развитие корпоративной культуры выпускников' },
  { Icon: BookOpen,     text: 'Развитие материально-технической базы БФЭТ' },
  { Icon: Award,        text: 'Создание условий для повышения качества образовательного процесса' },
]

const FUNDING = [
  { Icon: HandCoins,    text: 'Вступительные и членские взносы' },
  { Icon: HeartHandshake, text: 'Добровольные взносы юридических и физических лиц' },
  { Icon: FileText,     text: 'Гранты, кредиты и спонсорская помощь' },
]

const STATS = [
  { value: '800+', label: 'Членов' },
  { value: '2024', label: 'Год основания' },
  { value: '№303762', label: 'Рег. номер МЮ' },
]

function SectionHeading({ Icon, children }) {
  return (
    <h2 className="font-display text-2xl font-bold text-ink mb-5 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] text-white shadow-sm">
        <Icon size={18} />
      </span>
      {children}
    </h2>
  )
}

export function AboutPage() {
  const { lang = 'ru' } = useParams()
  const { t } = useTranslation()
  useSEO({ title: t('seo.about.title'), description: t('seo.about.desc') })

  return (
    <div className="space-y-0">

      {/* ── HERO — полная ширина, компактный ─────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg,#065f82,#0879a8,#1298bb,#3bc4c7,#0e9aa7,#0879a8)',
          backgroundSize: '300% 300%',
          animation: 'about-grad 12s ease infinite',
        }}
      >
        <style>{`
          @keyframes about-grad    { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
          @keyframes about-cw      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes about-ccw     { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
          @keyframes about-sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
          @keyframes about-pulse   { 0%,100%{opacity:.05;transform:scale(1)} 50%{opacity:.12;transform:scale(1.05)} }
        `}</style>

        {/* Декор */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full border-2 border-dashed border-white/10" style={{ animation: 'about-cw 22s linear infinite' }} />
          <div className="absolute -left-20 -bottom-10 h-64 w-64 rounded-full border-2 border-dashed border-white/8" style={{ animation: 'about-ccw 18s linear infinite' }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full border border-white/5" style={{ animation: 'about-pulse 6s ease-in-out infinite' }} />
          <div className="absolute right-1/3 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-32 w-32 rounded-full bg-[#3bc4c7]/15 blur-2xl" />
          {[...Array(18)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                left: `${4 + (i * 5.3) % 92}%`, top: `${5 + (i * 9.1) % 86}%`,
                width: i % 4 === 0 ? 4.5 : i % 3 === 0 ? 3 : 2,
                height: i % 4 === 0 ? 4.5 : i % 3 === 0 ? 3 : 2,
                animation: `about-sparkle ${2.2 + (i * 0.28) % 3}s ${(i * 0.25) % 4}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        {/* Контент — два столбца */}
        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">

            {/* Левая — текст + кнопки + статы */}
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 ring-1 ring-white/25 backdrop-blur-sm">
                <img src="/logo.png" alt="БФЭТ" className="h-5 w-5 object-contain" />
                <span className="text-xs font-black uppercase tracking-widest text-white/90">Об ассоциации</span>
              </div>
              <h1 className="font-display text-3xl font-black leading-[1.1] md:text-5xl">
                Ассоциация выпускников<br />
                <span className="text-[#ffd166]">«Финтех»</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
                Общественное объединение, зарегистрированное Министерством юстиции КР. Объединяет выпускников БФЭТ им. А. Токтоналиева, содействует развитию техникума и карьерному росту.
              </p>

              {/* Кнопки и статы — в одну строку */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to={`/${lang}/donations`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#0879a8] shadow hover:shadow-lg transition-shadow">
                  <Heart size={15} /> Поддержать
                </Link>
                <Link to={`/${lang}/register`} className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <Users size={15} /> Вступить
                </Link>
                <div className="mx-1 h-8 w-px bg-white/20" />
                {STATS.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm text-center hover:bg-white/15 transition-colors">
                    <div className="font-display text-lg font-black leading-none">{s.value}</div>
                    <div className="mt-0.5 text-[10px] font-semibold text-white/60">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая — иллюстрация */}
            <div className="hidden md:flex md:w-80 lg:w-96 shrink-0 items-center justify-center">
              <img
                src="/graduation.png"
                alt="Graduation cap and diploma"
                className="w-full h-auto"
              />
            </div>

          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        {/* ── Юридическая информация ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-sm">
          <SectionHeading Icon={ShieldCheck}>Юридическая информация</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Полное наименование', 'Общественное объединение «Ассоциация выпускников финтеха»'],
              ['Устав утверждён',     'Министерством юстиции Кыргызской Республики'],
              ['Дата регистрации',    '21 мая 2024 года'],
              ['Рег. номер',          '№ 303762-3301-00'],
              ['Решение собрания',    '30 апреля 2024 года'],
              ['Статус',              'При Министерстве финансов КР'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f0fbfd] p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink/40 mb-1">{label}</p>
                <p className="text-sm font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Цели ──────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-sm">
          <SectionHeading Icon={Target}>Цели деятельности</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {GOALS.map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-[#c9eef7] bg-[#f0fbfd] p-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] text-white shadow-sm">
                  <Icon size={15} />
                </span>
                <p className="text-sm font-medium text-ink leading-6">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Руководство ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-sm">
          <SectionHeading Icon={Users}>Руководство ассоциации</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            {LEADERSHIP.map(({ role, name, Icon }) => (
              <div key={role} className="rounded-2xl border border-[#c9eef7] bg-gradient-to-br from-[#f0fbfd] to-white p-6 text-center hover:shadow-md transition-shadow">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] text-white shadow-lg shadow-[#0879a8]/20">
                  <Icon size={28} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-[#0879a8] mb-2">{role}</p>
                <p className="text-sm font-bold text-ink leading-5">{name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Достижения ────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-sm">
          <SectionHeading Icon={Award}>Основные достижения</SectionHeading>
          <div className="space-y-2">
            {ACHIEVEMENTS.map(({ Icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-ink/6 bg-[#fafffe] px-4 py-3.5 hover:bg-[#f0fbfd] hover:border-[#c9eef7] transition-all group">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] text-white shadow-sm group-hover:shadow-md transition-shadow">
                  <Icon size={17} />
                </span>
                <p className="text-sm font-medium text-ink leading-6">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Финансирование ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-sm">
          <SectionHeading Icon={HandCoins}>Источники финансирования</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            {FUNDING.map(({ Icon, text }) => (
              <div key={text} className="flex flex-col items-center rounded-2xl border border-[#c9eef7] bg-gradient-to-b from-[#f0fbfd] to-white p-6 text-center hover:shadow-md transition-shadow">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] text-white shadow-md shadow-[#0879a8]/20">
                  <Icon size={24} />
                </div>
                <p className="text-sm font-semibold text-ink leading-5">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/40 leading-5">
            Ведение бухгалтерии и финансовой отчётности осуществляется в соответствии с законодательством КР. Ассоциация располагает собственными банковскими счетами.
          </p>
        </section>

        {/* ── Контакты ──────────────────────────────────────────────────────── */}
        <section className="rounded-2xl overflow-hidden shadow-md">
          <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg,#065f82,#0879a8,#3bc4c7)' }}>
            <h2 className="font-display text-2xl font-bold flex items-center gap-3">
              <Phone size={20} /> Контакты ассоциации
            </h2>
            <p className="mt-1 text-sm text-white/70">Мы всегда готовы ответить на ваши вопросы</p>
          </div>

          <div className="bg-white p-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-5">
              {[
                {
                  icon: <Phone size={19} />,
                  bg: 'from-[#0879a8] to-[#3bc4c7]',
                  shadow: 'shadow-[#0879a8]/20',
                  label: 'Телефоны',
                  content: PHONES.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s/g, '')}`}
                      className="block text-base font-bold text-ink hover:text-[#0879a8] transition-colors">{p}</a>
                  )),
                },
                {
                  icon: <WaIcon />,
                  bg: null,
                  bgClass: 'bg-[#25D366]',
                  shadow: 'shadow-[#25D366]/25',
                  label: 'WhatsApp',
                  content: (
                    <a href={`https://wa.me/${WHATSAPP.replace(/[\s+]/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="text-base font-bold text-[#25D366] hover:underline">{WHATSAPP}</a>
                  ),
                },
                {
                  icon: <Mail size={19} />,
                  bg: 'from-[#0879a8] to-[#3bc4c7]',
                  shadow: 'shadow-[#0879a8]/20',
                  label: 'Email',
                  content: (
                    <a href={`mailto:${EMAIL}`}
                      className="text-base font-bold text-[#0879a8] hover:underline break-all">{EMAIL}</a>
                  ),
                },
                {
                  icon: <MapPin size={19} />,
                  bg: 'from-[#0879a8] to-[#3bc4c7]',
                  shadow: 'shadow-[#0879a8]/20',
                  label: 'Адрес',
                  content: (
                    <p className="text-sm font-semibold text-ink leading-6">
                      г. Бишкек, пр. Чуй, 269<br />
                      <span className="text-xs font-normal text-ink/50">БФЭТ им. А. Токтоналиева</span>
                    </p>
                  ),
                },
              ].map(({ icon, bg, bgClass, shadow, label, content }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${shadow} ${bgClass || `bg-gradient-to-br ${bg}`}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-ink/40 mb-1">{label}</p>
                    {content}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#c9eef7] bg-gradient-to-br from-[#f0fbfd] to-white p-5 flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-[#0879a8] mb-3">Режим работы</p>
                <p className="text-sm font-semibold text-ink">Понедельник — Пятница</p>
                <p className="text-sm text-ink/60">08:00 — 17:00</p>
                <p className="mt-2 text-xs text-ink/45">Обед: 12:00 — 13:00</p>
              </div>
              <Link to={`/${lang}/donations`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0879a8] to-[#3bc4c7] px-5 py-4 font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-[#0879a8]/20">
                <Heart size={18} /> Поддержать ассоциацию
              </Link>
              <Link to={`/${lang}/register`}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#0879a8] px-5 py-4 font-bold text-[#0879a8] hover:bg-[#f0fbfd] transition-colors">
                <Users size={18} /> Вступить в ассоциацию
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
