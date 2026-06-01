import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Briefcase, CalendarDays, GraduationCap, HeartHandshake, MapPin, MessageCircle, Star, Users } from 'lucide-react'
import { api } from '../api'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'

const fallbackCollege = {
  name: 'Бишкекский финансово-экономический техникум им. А. Токтоналиева',
  foundedYear: 1931,
  staffCount: '176+',
  studentCount: '2268+',
  address: 'Кыргызская Республика, г. Бишкек, пр. Чуй, 269',
  phones: ['(0312) 39 15 41', '(0312) 39 21 66'],
  mission: 'Обеспечение современного качественного образования, ориентированного на подготовку конкурентоспособных кадров нового поколения через сохранение традиций и внедрение инноваций.',
  specialties: [
    'Экономика и бухгалтерский учет', 'Финансы: бюджет и бюджетный учет',
    'Финансы предприятий', 'Банковское дело', 'Страховое дело',
    'Налоги и налогообложение', 'Менеджмент', 'Маркетинг',
    'Операционная деятельность в логистике'
  ]
}

function WaterRipple() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const SCALE = 2
    let W, H, buf1, buf2, animId

    const init = () => {
      W = Math.max(1, Math.floor(canvas.offsetWidth / SCALE))
      H = Math.max(1, Math.floor(canvas.offsetHeight / SCALE))
      canvas.width = W
      canvas.height = H
      buf1 = new Float32Array(W * H)
      buf2 = new Float32Array(W * H)
    }
    init()

    const disturb = (px, py) => {
      const cx = Math.floor(px / SCALE)
      const cy = Math.floor(py / SCALE)
      const r = 4
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue
          const nx = cx + dx, ny = cy + dy
          if (nx >= 1 && nx < W - 1 && ny >= 1 && ny < H - 1)
            buf1[ny * W + nx] += 360
        }
    }

    // Blinn-Phong: precompute half-vector H = normalize(L + V), V=(0,0,1)
    const Lx = 0.45, Ly = -0.55, Lz = 0.70
    const HLen = Math.sqrt(Lx*Lx + Ly*Ly + (Lz+1)*(Lz+1))
    const HNx = Lx/HLen, HNy = Ly/HLen, HNz = (Lz+1)/HLen

    const render = () => {
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const p = y * W + x
          buf2[p] = (buf1[p - 1] + buf1[p + 1] + buf1[p - W] + buf1[p + W]) * 0.46 - buf2[p]
          buf2[p] *= 0.991
        }

      const id = ctx.createImageData(W, H)
      const d = id.data

      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const p = y * W + x
          const h = buf2[p]

          // Surface normal from height-field gradients
          const dnx = buf2[p - 1] - buf2[p + 1]
          const dny = buf2[p - W]  - buf2[p + W]
          const dnz = 42
          const nLen = Math.sqrt(dnx*dnx + dny*dny + dnz*dnz)
          const nnx = dnx/nLen, nny = dny/nLen, nnz = dnz/nLen

          // Diffuse (Lambert)
          const diff = Math.max(0, nnx*Lx + nny*Ly + nnz*Lz)

          // Specular (Blinn-Phong, sharp shininess = 88)
          const spec = Math.pow(Math.max(0, nnx*HNx + nny*HNy + nnz*HNz), 88)

          // Fresnel: grazing angles are brighter (edges of ripples)
          const fres = Math.pow(1 - Math.abs(nnz), 2.5)

          // Color: dark-blue troughs → light-cyan crests
          const wt = Math.min(1, Math.max(0, h / 200 + 0.5))
          let cr =  15 + 115 * wt + spec * 240
          let cg =  65 + 155 * wt + spec * 240
          let cb = 168 +  72 * wt + spec * 240

          // Fresnel brightening on wave edges
          const fb = fres * Math.abs(h) * 0.5
          cr += fb; cg += fb; cb += fb

          // Alpha: calm water is invisible; waves + specular make it appear
          const alpha = Math.min(228, Math.abs(h) * 5.5 + spec * 235 + fres * Math.abs(h) * 3)

          const i = (y * W + x) * 4
          d[i]     = Math.min(255, cr)
          d[i + 1] = Math.min(255, cg)
          d[i + 2] = Math.min(255, cb)
          d[i + 3] = alpha
        }

      ctx.putImageData(id, 0, 0)
      const tmp = buf1; buf1 = buf2; buf2 = tmp
      animId = requestAnimationFrame(render)
    }
    render()

    const hero = canvas.closest('section')
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      disturb(e.clientX - rect.left, e.clientY - rect.top)
    }
    hero?.addEventListener('mousemove', onMove)
    window.addEventListener('resize', init)
    return () => {
      cancelAnimationFrame(animId)
      hero?.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', init)
    }
  }, [])
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ mixBlendMode: 'overlay', opacity: 0.6 }}
    />
  )
}

function useTypewriter(words, speed = 75) {
  const [idx, setIdx] = useState(0)
  const [sub, setSub] = useState(0)
  const [del, setDel] = useState(false)
  const [text, setText] = useState('')
  useEffect(() => {
    if (!del && sub === words[idx].length + 1) { const t = setTimeout(() => setDel(true), 1600); return () => clearTimeout(t) }
    if (del && sub === 0) { setDel(false); setIdx((p) => (p + 1) % words.length); return }
    const t = setTimeout(() => { setText(words[idx].substring(0, sub)); setSub((p) => p + (del ? -1 : 1)) }, del ? speed / 2 : speed)
    return () => clearTimeout(t)
  }, [sub, idx, del, words, speed])
  return text
}

function AnimatedStat({ value, label, icon: Icon }) {
  const [shown, setShown] = useState('0')
  useEffect(() => {
    const m = value.match(/^([\d\s]+)(.*)$/)
    if (!m) { setShown(value); return }
    const num = parseInt(m[1].replace(/\s/g, ''))
    const suf = m[2]
    const steps = 45
    let c = 0
    const id = setInterval(() => {
      c++; const v = Math.round((num / steps) * c)
      setShown(v.toLocaleString('ru') + suf)
      if (c >= steps) clearInterval(id)
    }, 1400 / steps)
    return () => clearInterval(id)
  }, [value])
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm hover:bg-white/15 transition-colors">
      <Icon size={18} className="mb-2 text-white/70" />
      <div className="font-display text-2xl font-black">{shown}</div>
      <div className="mt-0.5 text-xs font-semibold text-white/70">{label}</div>
    </div>
  )
}

const hasBrokenText = (v) => typeof v === 'string' && /\?{3,}/.test(v)
const keep = (next, fb) => {
  if (Array.isArray(next)) return next.some(hasBrokenText) ? fb : next
  return hasBrokenText(next) || next == null || next === '' ? fb : next
}
const normalizeCollege = (d = {}) => ({
  ...fallbackCollege, ...d,
  name: keep(d.name, fallbackCollege.name),
  address: keep(d.address, fallbackCollege.address),
  workingHours: keep(d.workingHours, fallbackCollege.workingHours),
  mission: keep(d.mission, fallbackCollege.mission),
  specialties: keep(d.specialties, fallbackCollege.specialties)
})

export function HomePage() {
  const { lang = 'ru' } = useParams()
  const { t, i18n } = useTranslation()
  useSEO({ title: t('seo.home.title'), description: t('seo.home.desc') })
  const [college, setCollege] = useState(fallbackCollege)
  const [homeData, setHomeData] = useState({ news: [], campaigns: [], events: [] })
  const [featuredAlumni, setFeaturedAlumni] = useState([])
  const scrollRef = useRef(null)
  const isPaused = useRef(false)
  const newsScrollRef = useRef(null)
  const newsIsPaused = useRef(false)
  const heroRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 28,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 18,
    })
  }

  const typeWords = ['Банковское дело', 'Финансы', 'Менеджмент', 'Маркетинг', 'Бухгалтерский учёт', 'Налоги']
  const typeText = useTypewriter(typeWords)

  const particles = useMemo(() => Array.from({ length: 38 }, (_, i) => ({
    id: i,
    left: `${2 + (i * 2.57) % 96}%`,
    top: `${2 + (i * 7.43) % 94}%`,
    delay: `${(i * 0.19) % 5}s`,
    dur: `${2.0 + (i * 0.29) % 3.5}s`,
    size: i % 5 === 0 ? 6 : i % 3 === 0 ? 4 : 3,
  })), [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const interval = setInterval(() => {
      if (isPaused.current) return
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollLeft = 0
      else el.scrollLeft += 1
    }, 20)
    return () => clearInterval(interval)
  }, [featuredAlumni])

  useEffect(() => {
    const el = newsScrollRef.current
    if (!el) return
    const interval = setInterval(() => {
      if (newsIsPaused.current) return
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollLeft = 0
      else el.scrollLeft += 1
    }, 22)
    return () => clearInterval(interval)
  }, [homeData.news])

  useEffect(() => {
    api.get('/site').then(({ data }) => setCollege(normalizeCollege(data))).catch(() => {})
    Promise.allSettled([
      api.get('/news'),
      api.get('/donations/campaigns'),
      api.get('/events'),
      api.get('/alumni', { params: { status: 'APPROVED' } })
    ]).then(([newsRes, campRes, evRes, featRes]) => {
      setHomeData({
        news: newsRes.status === 'fulfilled' ? newsRes.value.data : [],
        campaigns: campRes.status === 'fulfilled' ? campRes.value.data.slice(0, 3) : [],
        events: evRes.status === 'fulfilled' ? evRes.value.data.slice(0, 3) : []
      })
      setFeaturedAlumni(featRes.status === 'fulfilled' ? featRes.value.data.slice(0, 8) : [])
    })
  }, [])

  const stats = [
    { label: t('home.stats.alumni'), value: college.studentCount || '2268+', icon: Users },
    { label: t('home.stats.donations'), value: '363 000 KGS', icon: HeartHandshake },
    { label: t('home.stats.jobs'), value: '38', icon: Briefcase },
    { label: t('home.stats.mentors'), value: '24+', icon: Star }
  ]

  const features = [
    {
      icon: '🎓', title: t('home.features.directory.title'), text: t('home.features.directory.text'),
      href: `/${lang}/alumni`, cta: t('home.features.directory.cta'),
      from: '#0879a8', to: '#3bc4c7', light: '#ddf4fb'
    },
    {
      icon: '💼', title: t('home.features.jobs.title'), text: t('home.features.jobs.text'),
      href: `/${lang}/jobs`, cta: t('home.features.jobs.cta'),
      from: '#6d28d9', to: '#a78bfa', light: '#ede9fe'
    },
    {
      icon: '🤝', title: t('home.features.mentorship.title'), text: t('home.features.mentorship.text'),
      href: `/${lang}/mentorship`, cta: t('home.features.mentorship.cta'),
      from: '#047857', to: '#34d399', light: '#d1fae5'
    },
    {
      icon: '💬', title: t('home.features.chat.title'), text: t('home.features.chat.text'),
      href: `/${lang}/chat`, cta: t('home.features.chat.cta'),
      from: '#0369a1', to: '#38bdf8', light: '#e0f2fe'
    },
    {
      icon: '📅', title: t('home.features.events.title'), text: t('home.features.events.text'),
      href: `/${lang}/events`, cta: t('home.features.events.cta'),
      from: '#b45309', to: '#fbbf24', light: '#fef3c7'
    },
    {
      icon: '❤️', title: t('home.features.donations.title'), text: t('home.features.donations.text'),
      href: `/${lang}/donations`, cta: t('home.features.donations.cta'),
      from: '#be123c', to: '#fb7185', light: '#ffe4e6'
    }
  ]

  return (
    <div className="space-y-0">

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg,#065f82,#0879a8,#1298bb,#3bc4c7,#0e9aa7,#0879a8)', backgroundSize: '300% 300%', animation: 'hero-grad 12s ease infinite' }}
      >

        <style>{`
          @keyframes ring-spin-cw   { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          @keyframes ring-spin-ccw  { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }
          @keyframes ring-float     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-18px) } }
          @keyframes ring-pulse-s   { 0%,100% { transform: scale(1); opacity:.12 } 50% { transform: scale(1.08); opacity:.22 } }
          @keyframes sparkle        { 0%,100% { opacity:0; transform: scale(0) } 50% { opacity:1; transform: scale(1) } }
          @keyframes btn-glow       { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,.5) } 60% { box-shadow: 0 0 0 10px rgba(255,255,255,0) } }
          @keyframes cursor-blink   { 0%,100% { opacity:1 } 50% { opacity:0 } }
          @keyframes hero-grad      { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
          @keyframes underline-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
          .ring-cw  { animation: ring-spin-cw  18s linear infinite }
          .ring-ccw { animation: ring-spin-ccw 24s linear infinite }
          .ring-fl  { animation: ring-float    6s ease-in-out infinite }
          .ring-ps  { animation: ring-pulse-s  4s ease-in-out infinite }
          .sparkle  { animation: sparkle var(--dur, 3s) var(--delay, 0s) ease-in-out infinite }
          .btn-glow { animation: btn-glow 2.2s ease-in-out infinite }
          .tw-cursor { animation: cursor-blink .75s step-end infinite }
        `}</style>

        {/* Параллакс-слой 1 — кольца (медленно) */}
        <div className="pointer-events-none absolute inset-0" style={{ transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.25}px)`, transition: 'transform 0.25s ease-out' }}>
          <div className="ring-cw absolute -right-24 -top-24 h-96 w-96 rounded-full border-2 border-dashed border-white/15" />
          <div className="ring-ccw absolute -right-10 -top-10 h-64 w-64 rounded-full border border-white/10" />
          <div className="ring-fl absolute -right-4 top-10 h-40 w-40 rounded-full border border-white/8" />
          <div className="ring-cw absolute -left-32 bottom-8 h-80 w-80 rounded-full border-2 border-dashed border-white/12" style={{ animationDuration: '22s' }} />
          <div className="ring-ccw absolute -left-16 bottom-16 h-52 w-52 rounded-full border border-white/10" style={{ animationDuration: '16s' }} />
          <div className="ring-ps absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
          <div className="absolute right-1/4 top-0 h-64 w-64 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#3bc4c7]/20 blur-3xl" />

          {/* Академические иконки */}
          {[
            { x:'5%',  y:'7%',  s:86, r:-18, op:.10, icon:'cap'    },
            { x:'82%', y:'5%',  s:72, r:14,  op:.09, icon:'scroll' },
            { x:'87%', y:'50%', s:62, r:22,  op:.08, icon:'cap'    },
            { x:'9%',  y:'58%', s:68, r:-12, op:.08, icon:'book'   },
            { x:'51%', y:'3%',  s:54, r:6,   op:.07, icon:'star'   },
            { x:'2%',  y:'34%', s:48, r:-25, op:.07, icon:'scroll' },
            { x:'67%', y:'66%', s:64, r:18,  op:.08, icon:'book'   },
            { x:'35%', y:'74%', s:50, r:-8,  op:.07, icon:'star'   },
            { x:'57%', y:'56%', s:44, r:10,  op:.06, icon:'cap'    },
            { x:'43%', y:'86%', s:40, r:-15, op:.06, icon:'scroll' },
            { x:'73%', y:'30%', s:46, r:8,   op:.07, icon:'star'   },
            { x:'22%', y:'20%', s:52, r:-20, op:.07, icon:'cap'    },
            { x:'78%', y:'80%', s:44, r:16,  op:.06, icon:'book'   },
            { x:'30%', y:'48%', s:38, r:-6,  op:.06, icon:'scroll' },
            { x:'63%', y:'14%', s:42, r:12,  op:.06, icon:'star'   },
          ].map((d, i) => (
            <div key={i} className="absolute pointer-events-none" style={{ left: d.x, top: d.y, opacity: d.op, transform: `rotate(${d.r}deg)`, width: d.s, height: d.s }}>
              {d.icon === 'cap' && (
                <svg viewBox="0 0 48 48" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="24,2 46,13 24,24 2,13" />
                  <rect x="15" y="21" width="18" height="14" rx="2" opacity=".75" />
                  <ellipse cx="15" cy="35" rx="3" ry="3" opacity=".75" />
                  <line x1="46" y1="13" x2="46" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="46" cy="30" r="2.5" />
                </svg>
              )}
              {d.icon === 'scroll' && (
                <svg viewBox="0 0 48 48" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="8" width="36" height="30" rx="3" opacity=".85" />
                  <ellipse cx="24" cy="8" rx="18" ry="4" />
                  <ellipse cx="24" cy="38" rx="18" ry="4" opacity=".7" />
                  <line x1="12" y1="18" x2="36" y2="18" stroke="rgba(8,121,168,0.35)" strokeWidth="1.5" fill="none" />
                  <line x1="12" y1="24" x2="36" y2="24" stroke="rgba(8,121,168,0.35)" strokeWidth="1.5" fill="none" />
                  <line x1="12" y1="30" x2="28" y2="30" stroke="rgba(8,121,168,0.35)" strokeWidth="1.5" fill="none" />
                </svg>
              )}
              {d.icon === 'book' && (
                <svg viewBox="0 0 48 48" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="4" width="20" height="40" rx="2" />
                  <rect x="26" y="4" width="20" height="40" rx="2" opacity=".75" />
                  <path d="M22 5 Q24 8 22 11 Q24 14 22 17 Q24 20 22 23 Q24 26 22 29 Q24 32 22 35 Q24 38 22 41 Q24 44 22 44" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
                </svg>
              )}
              {d.icon === 'star' && (
                <svg viewBox="0 0 48 48" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="24,3 28,17 43,17 32,26 36,41 24,32 12,41 16,26 5,17 20,17" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Параллакс-слой 2 — частицы (быстро, в другую сторону) */}
        <div className="pointer-events-none absolute inset-0" style={{ transform: `translate(${mousePos.x * -0.55}px, ${mousePos.y * -0.4}px)`, transition: 'transform 0.15s ease-out' }}>
          {particles.map((p) => (
            <div key={p.id} className="sparkle absolute rounded-full bg-white"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size, '--dur': p.dur, '--delay': p.delay }} />
          ))}
        </div>

        {/* Рябь воды — реагирует на движение мыши */}
        <WaterRipple />

        <div className="relative mx-auto max-w-7xl px-6 pt-12 md:px-10">
          {/* Текст по центру */}
          <div className="mx-auto max-w-3xl text-center">

            {/* Бейдж */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 ring-1 ring-white/25 backdrop-blur-sm">
              <span className="text-sm">🎓</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">{college.name}</span>
            </div>

            <h1 className="font-display text-2xl font-black leading-[1.12] tracking-tight text-white md:text-3xl xl:text-4xl">
              {(() => {
                const title = t('heroTitle')
                const hl = t('heroHighlight')
                const idx = title.indexOf(hl)
                if (idx === -1) return title
                return (
                  <>
                    {title.slice(0, idx)}
                    <span className="relative inline-block">
                      <span className="text-[#ffd166]">{hl}</span>
                      <span className="absolute bottom-0 left-0 h-[3px] w-full origin-left rounded-full bg-[#ffd166]/60" style={{ animation: 'underline-grow 1s cubic-bezier(.22,1,.36,1) 0.3s both' }} />
                    </span>
                    {title.slice(idx + hl.length)}
                  </>
                )
              })()}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85">
              {t('heroText')}
            </p>

            {/* Печатающий текст */}
            <p className="mt-4 text-sm font-semibold text-white/60">
              Специальность:{' '}
              <span className="text-white/90">{typeText}</span>
              <span className="tw-cursor ml-0.5 text-white/90">|</span>
            </p>

            {/* CTA кнопки */}
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to={`/${lang}/register`}
                className="btn-glow inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-moss shadow-lg shadow-ink/15 hover:bg-white/90 hover:-translate-y-0.5 transition-all">
                {t('home.join')} <ArrowRight size={16} />
              </Link>
              <Link to={`/${lang}/alumni`}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                {t('find')}
              </Link>
            </div>

            {/* Аватар-стек — социальное доказательство */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex -space-x-3">
                {featuredAlumni.slice(0, 5).map((a, i) => (
                  a.photoUrl ? (
                    <img key={a.id} src={toAbsoluteUploadUrl(a.photoUrl)} alt={a.fullName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                      style={{ zIndex: 5 - i }} />
                  ) : (
                    <div key={a.id} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-sm font-bold ring-2 ring-white"
                      style={{ zIndex: 5 - i }}>
                      {a.fullName?.[0]}
                    </div>
                  )
                ))}
              </div>
              <p className="text-sm font-semibold text-white/80">
                {t('home.stats.alumni')} уже в сети
              </p>
            </div>

          </div>

          {/* Статистика с анимацией */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <AnimatedStat key={label} value={value} label={label} icon={Icon} />
            ))}
          </div>

          {/* Стрелка скролла */}
          <div className="mt-6 flex justify-center pb-2">
            <div className="flex flex-col items-center gap-1 text-white/40">
              <span className="text-[10px] font-bold uppercase tracking-widest">Листать</span>
              <svg className="animate-bounce" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Нижняя волна-овал */}
        <div className="relative mt-2 h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="absolute bottom-0 h-full w-full" fill="#f4fafc">
            <ellipse cx="720" cy="64" rx="900" ry="64" />
          </svg>
        </div>
      </section>

      {/* ── 2. ЧТО ДАЁТ ПЛАТФОРМА ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f4fafc] px-6 py-16 md:px-10">
        {/* dot-grid overlay */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, #aadcee 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.45 }} />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-moss">{t('home.featureEyebrow')}</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">
              {t('home.featureTitle')}
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm leading-7 text-ink/55">
              {t('home.featureText')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Link key={f.title} to={f.href}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_56px_rgba(0,0,0,0.14)]">

                {/* цветная шапка */}
                <div className="relative flex h-36 items-center justify-center overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${f.from} 0%, ${f.to} 100%)` }}>
                  {/* номер-watermark */}
                  <span className="pointer-events-none absolute right-3 top-0 select-none font-display text-9xl font-black leading-none text-white/[0.12]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {/* декоративный круг сзади */}
                  <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
                  {/* иконка */}
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl ring-2 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    {f.icon}
                  </div>
                </div>

                {/* контент */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-bold text-ink">{f.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-ink/55">{f.text}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-sm font-bold transition-all duration-200 group-hover:gap-3"
                    style={{ color: f.from }}>
                    {f.cta} <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. ГОРДОСТЬ БФЭТ ────────────────────────────────────────────── */}
      {featuredAlumni.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0c2a35] via-[#0d3545] to-[#0c2a35] px-6 py-14 md:px-10">
          <div className="pointer-events-none absolute inset-0 opacity-15"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, #3bc4c7 0%, transparent 55%), radial-gradient(circle at 85% 20%, #0879a8 0%, transparent 45%)' }} />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#3bc4c7]">⭐ {t('home.pride')}</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">{t('home.alumniTitle')}</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">
                  {t('home.alumniText')}
                </p>
              </div>
              <Link to={`/${lang}/alumni`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                {t('home.allAlumni')} <ArrowRight size={16} />
              </Link>
            </div>

            <div className="relative">
              {/* Fade-маски по краям */}
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#0c2a35] to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#0c2a35] to-transparent" />

              <div
                ref={scrollRef}
                onMouseEnter={() => { isPaused.current = true }}
                onMouseLeave={() => { isPaused.current = false }}
                className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {featuredAlumni.map((a) => (
                  <Link key={a.id} to={`/${lang}/alumni/${a.id}`}
                    className="group flex w-52 shrink-0 snap-start flex-col rounded-2xl bg-white/8 ring-1 ring-white/12 hover:bg-white/14 hover:ring-[#3bc4c7]/60 transition-all overflow-hidden">

                    {/* Тонкая цветная полоска сверху */}
                    <div className="h-10 shrink-0 bg-gradient-to-r from-[#0879a8]/70 to-[#3bc4c7]/70" />

                    {/* Аватар по центру */}
                    <div className="flex justify-center pt-4">
                      {a.photoUrl ? (
                        <img src={toAbsoluteUploadUrl(a.photoUrl)} alt={a.fullName}
                          className="h-24 w-24 rounded-full object-cover ring-2 ring-[#3bc4c7]/70 shadow-[0_0_20px_rgba(59,196,199,0.3)]" />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0879a8] to-[#3bc4c7] ring-2 ring-[#3bc4c7]/70 text-2xl font-black text-white shadow-[0_0_20px_rgba(59,196,199,0.3)]">
                          {a.fullName?.[0]}
                        </div>
                      )}
                    </div>

                    {/* Контент */}
                    <div className="flex flex-1 flex-col px-4 pb-5 pt-3 text-center">
                      <p className="text-xs font-bold text-[#3bc4c7]">{a.graduationYear}</p>
                      <h3 className="mt-0.5 font-bold leading-snug text-white group-hover:text-[#3bc4c7] transition-colors">{a.fullName}</h3>
                      {(a.featuredTitle || a.position) && (
                        <p className="mt-2 text-xs font-semibold leading-snug text-white/75">{a.featuredTitle || a.position}</p>
                      )}
                      {a.company && <p className="mt-0.5 text-xs text-white/40">{a.company}</p>}
                      {a.city && (
                        <p className="mt-auto flex items-center justify-center gap-1 pt-3 text-xs text-white/30">
                          <MapPin size={11} />{a.city}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. НОВОСТИ ──────────────────────────────────────────────────── */}
      <section className="bg-[#f4fafc] px-6 py-14 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-moss">{t('home.actual')}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('sections.latestNews')}</h2>
            </div>
            <Link to={`/${lang}/news`}
              className="inline-flex items-center gap-2 rounded-xl border border-moss/30 px-5 py-2.5 text-sm font-bold text-moss hover:bg-moss hover:text-white transition-all">
              {t('home.allNews')} <ArrowRight size={15} />
            </Link>
          </div>

          {homeData.news.length > 0 ? (
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#f4fafc] to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#f4fafc] to-transparent" />
              <div
                ref={newsScrollRef}
                onMouseEnter={() => { newsIsPaused.current = true }}
                onMouseLeave={() => { newsIsPaused.current = false }}
                className="flex gap-5 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {homeData.news.map((item) => (
                  <Link key={item.id} to={`/${lang}/news/${item.id}`}
                    className="group flex w-72 shrink-0 flex-col rounded-2xl bg-white shadow-sm ring-1 ring-ink/[0.07] hover:shadow-[0_12px_36px_rgba(15,126,168,0.14)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="relative h-44 overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={toAbsoluteUploadUrl(item.imageUrl)} alt={getLocalized(item.title, lang)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e5f6fb] to-[#b8ebf5]">
                          <span className="text-5xl opacity-50">📰</span>
                        </div>
                      )}
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-ink/65 shadow-sm backdrop-blur-sm">
                        <CalendarDays size={11} />
                        {new Date(item.publishedAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-bold text-ink leading-snug group-hover:text-moss transition-colors line-clamp-2">
                        {getLocalized(item.title, lang)}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-ink/55 line-clamp-3">
                        {getLocalized(item.body, lang)}
                      </p>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-moss">
                        {t('home.readMore')} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-ink/15 px-6 py-12 text-center">
              <p className="text-4xl mb-3">📰</p>
              <p className="text-sm text-ink/50">{t('home.newsEmpty')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. МЕРОПРИЯТИЯ + КАМПАНИИ ───────────────────────────────────── */}
      <section className="bg-white px-6 py-14 md:px-10">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">

          {/* Мероприятия */}
          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-moss">{t('home.community')}</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-ink">{t('home.upcomingEvents')}</h2>
              </div>
              <Link to={`/${lang}/events`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-moss hover:underline">
                {t('home.allEvents')} <ArrowRight size={14} />
              </Link>
            </div>

            {homeData.events.length > 0 ? (
              <div className="space-y-3">
                {homeData.events.map((ev) => {
                  const d = new Date(ev.startsAt)
                  return (
                    <Link key={ev.id} to={`/${lang}/events/${ev.id}`}
                      className="group flex gap-4 rounded-2xl bg-[#f4fafc] p-4 ring-1 ring-ink/[0.07] hover:bg-white hover:shadow-[0_8px_28px_rgba(15,126,168,0.12)] hover:-translate-y-0.5 transition-all duration-300">
                      {/* date block */}
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#0879a8] to-[#3bc4c7] py-3 text-white shadow-sm">
                        <span className="text-2xl font-black leading-none">{d.getDate()}</span>
                        <span className="mt-0.5 text-[11px] font-bold uppercase opacity-90">
                          {d.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', '')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <h3 className="font-bold text-ink leading-snug group-hover:text-moss transition-colors line-clamp-1">
                          {getLocalized(ev.title, lang)}
                        </h3>
                        {ev.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink/45">
                            <MapPin size={11} className="shrink-0" />{ev.location}
                          </p>
                        )}
                        <p className="mt-1.5 text-xs leading-5 text-ink/55 line-clamp-2">
                          {getLocalized(ev.description, lang)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/15 px-6 py-12 text-center">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-ink/50">{t('home.eventsEmpty')}</p>
              </div>
            )}
          </div>

          {/* Кампании поддержки */}
          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-moss">{t('home.support')}</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-ink">{t('sections.campaigns')}</h2>
              </div>
              <Link to={`/${lang}/donations`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-moss hover:underline">
                {t('home.allCampaigns')} <ArrowRight size={14} />
              </Link>
            </div>

            {homeData.campaigns.length > 0 ? (
              <div className="space-y-3">
                {homeData.campaigns.map((item) => {
                  const goal = Number(item.goalAmount || 0)
                  const raised = Number(item.raisedAmount || 0)
                  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
                  return (
                    <Link key={item.id} to={`/${lang}/donations/${item.id}`}
                      className="group block rounded-2xl bg-[#f4fafc] p-5 ring-1 ring-ink/[0.07] hover:bg-white hover:shadow-[0_8px_28px_rgba(15,126,168,0.12)] hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-base">
                          ❤️
                        </div>
                        <h3 className="flex-1 font-bold text-ink leading-snug group-hover:text-moss transition-colors">
                          {getLocalized(item.title, lang)}
                        </h3>
                      </div>
                      <div className="mt-4">
                        <div className="h-2.5 overflow-hidden rounded-full bg-ink/8">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#0879a8] to-[#3bc4c7] transition-all duration-700"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink/55">
                            {raised.toLocaleString()} KGS
                          </span>
                          <span className="rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-black text-moss">
                            {pct}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink/35">
                          {t('home.goal', { amount: goal.toLocaleString() })} KGS
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/15 px-6 py-12 text-center">
                <p className="text-3xl mb-2">❤️</p>
                <p className="text-sm text-ink/50">{t('home.campaignsEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. МИССИЯ + СПЕЦИАЛЬНОСТИ ───────────────────────────────────── */}
      <section className="bg-[#f4fafc] px-6 py-14 md:px-10">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">

          {/* Миссия */}
          <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0879a8] via-[#0f8fbb] to-[#3bc4c7] p-8 text-white shadow-[0_8px_32px_rgba(8,121,168,0.35)]">
            {/* decorative blurs */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-4 h-32 w-32 rounded-full bg-[#3bc4c7]/30 blur-2xl" />
            <p className="relative text-xs font-black uppercase tracking-[0.3em] text-white/60">{t('home.missionEyebrow')}</p>
            <h2 className="relative mt-4 font-display text-2xl font-bold leading-snug">
              {t('home.missionTitle')}
            </h2>
            <p className="relative mt-4 text-sm font-medium leading-7 text-white/85">{college.mission}</p>
            <div className="relative mt-6 flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 text-sm font-bold ring-1 ring-white/20">
              <GraduationCap size={18} className="shrink-0 text-white/80" />
              {t('home.founded', { year: college.foundedYear })}
            </div>
          </div>

          {/* Специальности */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-moss">{t('home.education')}</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink">{t('home.specialties')}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {(college.specialties || []).map((s, i) => {
                const hues = ['#ddf4fb','#ede9fe','#d1fae5','#e0f2fe','#fef3c7','#ffe4e6','#fce7f3','#e0e7ff','#f0fdf4']
                return (
                  <span key={s}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/80 ring-1 ring-ink/10 transition-shadow hover:shadow-sm"
                    style={{ background: hues[i % hues.length] }}>
                    {s}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. ФИНАЛЬНЫЙ CTA ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0c2a35] to-[#0d3f50] px-6 py-14 text-center text-white md:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#3bc4c7]">{t('home.ctaEyebrow')}</p>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            {t('home.ctaTitle')}
          </h2>
          <p className="mt-4 text-base text-white/65 leading-7">
            {t('home.ctaText')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to={`/${lang}/register`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3bc4c7] px-8 py-4 text-base font-black text-ink hover:bg-[#4dd0d3] transition-colors shadow-lg shadow-ink/20">
              {t('home.createProfile')} <ArrowRight size={18} />
            </Link>
            <Link to={`/${lang}/alumni`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-colors">
              {t('home.viewAlumni')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
