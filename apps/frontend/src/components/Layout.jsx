import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { io } from 'socket.io-client'
import { languages } from '../i18n'
import { useAppStore } from '../store'
import { api } from '../api'
import { ErrorBoundary } from './ErrorBoundary'
import { SupportWidget } from './SupportWidget'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'

const roleLabels = {
  GUEST: 'Гость',
  ALUMNI: 'Выпускник',
  MODERATOR: 'Модератор',
  ADMIN: 'Администратор'
}

const fallbackSite = {
  name: 'Бишкекский финансово-экономический техникум им. А. Токтоналиева',
  address: 'Кыргызская Республика, г. Бишкек, пр. Чуй, 269',
  phones: ['(0312) 39 15 41', '(0312) 39 21 66'],
  email: 'vypuskniki.finteha@gmail.com',
  website: 'https://bfet.kg',
  workingHours: 'Пн-Пт 09:00-18:00'
}

const hasBrokenText = (value) => typeof value === 'string' && /\?{3,}/.test(value)
const keepText = (value, fallback) => {
  if (Array.isArray(value)) return value.length && !value.some(hasBrokenText) ? value : fallback
  return value && !hasBrokenText(value) ? value : fallback
}

export function Layout() {
  const { lang = 'ru' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const role = useAppStore((state) => state.role)
  const accessToken = useAppStore((state) => state.accessToken)
  const logout = useAppStore((state) => state.logout)
  const unreadCount = useAppStore((state) => state.unreadCount)
  const unreadDms = useAppStore((state) => state.unreadDms)
  const setUnreadCount = useAppStore((state) => state.setUnreadCount)
  const setUnreadDms = useAppStore((state) => state.setUnreadDms)
  const incrementUnread = useAppStore((state) => state.incrementUnread)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [site, setSite] = useState(fallbackSite)

  useEffect(() => {
    if (languages.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!accessToken) {
      setUnreadCount(0)
      setUnreadDms(0)
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const fetchCounts = () => {
      api.get('/notifications/unread-count')
        .then(({ data }) => setUnreadCount(data.count || 0))
        .catch(() => {})
      api.get('/chat/direct')
        .then(({ data }) => {
          const total = (data || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)
          setUnreadDms(total)
        })
        .catch(() => {})
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)

    // Delay connection so React dev-mode effect cleanup does not close a half-open websocket.
    const s = io(SOCKET_URL, { autoConnect: false, transports: ['polling', 'websocket'] })
    socketRef.current = s
    s.on('connect', () => s.emit('auth:register', { token: accessToken }))
    s.on('notification:new', () => incrementUnread())
    const connectTimer = setTimeout(() => s.connect(), 100)

    return () => {
      clearInterval(interval)
      clearTimeout(connectTimer)
      s.disconnect()
      socketRef.current = null
    }
  }, [accessToken])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsServicesOpen(false)
    setIsAccountOpen(false)
  }, [location.pathname])

  useEffect(() => {
    api.get('/site')
      .then(({ data }) => setSite({
        ...fallbackSite,
        ...data,
        name: keepText(data.name, fallbackSite.name),
        address: keepText(data.address, fallbackSite.address),
        phones: keepText(data.phones, fallbackSite.phones),
        email: keepText(data.email, fallbackSite.email),
        website: keepText(data.website, fallbackSite.website),
        workingHours: keepText(data.workingHours, fallbackSite.workingHours)
      }))
      .catch(() => setSite(fallbackSite))
  }, [])

  const changeLanguage = (nextLang) => {
    i18n.changeLanguage(nextLang)
    const path = window.location.pathname.replace(/^\/(ru|ky|en)/, `/${nextLang}`)
    navigate(path === window.location.pathname ? `/${nextLang}` : path)
  }

  const nav = [
    ['home', `/${lang}`],
    ['alumni', `/${lang}/alumni`],
    ['jobs', `/${lang}/jobs`],
    ['mentorship', `/${lang}/mentorship`],
    ['donations', `/${lang}/donations`],
    ['events', `/${lang}/events`],
    ['news', `/${lang}/news`],
    ['docs', `/${lang}/documents`],
    ['companies', `/${lang}/companies`],
    ['chat', `/${lang}/chat`],
    ['notifications', `/${lang}/notifications`],
    ['cabinet', `/${lang}/cabinet`],
    ['admin', `/${lang}/admin`]
  ]
  const primaryNav = [
    ['home', `/${lang}`],
    ['alumni', `/${lang}/alumni`],
    ['jobs', `/${lang}/jobs`],
    ['events', `/${lang}/events`],
    ['news', `/${lang}/news`],
    ['donations', `/${lang}/donations`],
    ['about', `/${lang}/about`]
  ]
  const servicesNav = [
    ['mentorship', `/${lang}/mentorship`],
    ['docs', `/${lang}/documents`],
    ['companies', `/${lang}/companies`],
    ['chat', `/${lang}/chat`],
  ]
  const accountNav = [
    ['notifications', `/${lang}/notifications`],
    ['cabinet', `/${lang}/cabinet`],
    ['admin', `/${lang}/admin`]
  ]
  const footerPlatformNav = [
    ['alumni', `/${lang}/alumni`],
    ['jobs', `/${lang}/jobs`],
    ['events', `/${lang}/events`],
    ['news', `/${lang}/news`],
    ['donations', `/${lang}/donations`],
    ['about', `/${lang}/about`]
  ]
  const footerServiceNav = [
    ['mentorship', `/${lang}/mentorship`],
    ['docs', `/${lang}/documents`],
    ['companies', `/${lang}/companies`],
    ['chat', `/${lang}/chat`],
    ['notifications', `/${lang}/notifications`]
  ]
  const isGroupActive = (items) => items.some(([, href]) => location.pathname === href || location.pathname.startsWith(`${href}/`))
  const navLinkClass = ({ isActive }) => `rounded px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-moss text-white shadow-sm' : 'text-ink/76 hover:bg-[#e8fbfc] hover:text-moss'}`
  const dropdownLinkClass = ({ isActive }) => `block rounded-md px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-[#e9fbfc] text-moss' : 'text-ink/75 hover:bg-[#eefbfc] hover:text-moss'}`
  const footerLinkClass = 'block w-fit text-sm font-semibold text-white/78 transition hover:text-white'
  const footerPhones = Array.isArray(site.phones) ? site.phones.filter(Boolean) : []

  return (
    <div className="min-h-screen pattern">
      <header className="sticky top-0 z-20 border-b border-[#d9eef5] bg-gradient-to-r from-white/96 via-[#eefbfc]/96 to-[#d8f5f7]/96 text-ink shadow-lg shadow-moss/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
          <Link to={`/${lang}`} className="flex flex-none items-center" title={t('brand')}>
            <img src="/logo.png" alt="Логотип БФЭТ" className="h-14 w-14 flex-none object-contain md:h-16 md:w-16" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {primaryNav.map(([key, href]) => (
              <NavLink key={key} to={href} end={key === 'home'} className={navLinkClass}>
                <span className="inline-flex items-center gap-2">
                  {t(`nav.${key}`)}
                </span>
              </NavLink>
            ))}
            <div className="relative" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
              <button
                type="button"
                onClick={() => setIsServicesOpen((value) => !value)}
                className={`rounded px-3 py-2 text-sm font-bold transition ${isGroupActive(servicesNav) || isServicesOpen ? 'bg-moss text-white shadow-sm' : 'text-ink/76 hover:bg-[#e8fbfc] hover:text-moss'}`}
              >
                {t('layout.services')}
                {unreadDms > 0 && <span className="ml-2 rounded bg-moss px-2 py-0.5 text-[10px] font-black text-white">{unreadDms}</span>}
              </button>
              {isServicesOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-56 rounded-md border-2 border-[#c9e9f2] bg-[#f8fdff] p-2 text-ink shadow-[0_18px_44px_rgba(15,126,168,0.2)]">
                    {servicesNav.map(([key, href]) => (
                      <NavLink key={key} to={href} className={dropdownLinkClass}>
                        <span className="inline-flex items-center gap-2">
                          {t(`nav.${key}`)}
                          {key === 'chat' && unreadDms > 0 && (
                            <span className="rounded bg-moss px-2 py-0.5 text-[10px] font-black text-white">{unreadDms}</span>
                          )}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative" onMouseEnter={() => setIsAccountOpen(true)} onMouseLeave={() => setIsAccountOpen(false)}>
              <button
                type="button"
                onClick={() => setIsAccountOpen((value) => !value)}
                className={`rounded px-3 py-2 text-sm font-bold transition ${isGroupActive(accountNav) || isAccountOpen ? 'bg-moss text-white shadow-sm' : 'text-ink/76 hover:bg-[#e8fbfc] hover:text-moss'}`}
              >
                {t('layout.account')}
                {unreadCount > 0 && <span className="ml-2 rounded bg-clay px-2 py-0.5 text-[10px] font-black text-white">{unreadCount}</span>}
              </button>
              {isAccountOpen && (
                <div className="absolute right-0 top-full pt-2">
                  <div className="w-56 rounded-md border-2 border-[#c9e9f2] bg-[#f8fdff] p-2 text-ink shadow-[0_18px_44px_rgba(15,126,168,0.2)]">
                    {accountNav.map(([key, href]) => (
                      <NavLink key={key} to={href} className={dropdownLinkClass}>
                        <span className="inline-flex items-center gap-2">
                          {t(`nav.${key}`)}
                          {key === 'notifications' && unreadCount > 0 && (
                            <span className="rounded bg-clay px-2 py-0.5 text-[10px] font-black text-white">{unreadCount}</span>
                          )}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
          <div className="flex items-center gap-2">
            {accessToken ? (
              <>
                <button
                  onClick={() => { logout(); navigate(`/${lang}`) }}
                  className="hidden rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 hover:bg-red-100 transition-colors md:block"
                >
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <Link
                to={`/${lang}/cabinet`}
                className="hidden rounded bg-moss px-4 py-1.5 text-xs font-black text-white hover:bg-moss/90 transition-colors md:block"
              >
                {t('auth.login')}
              </Link>
            )}
            <div className="hidden rounded border border-[#cdeff3] bg-white/70 p-1 sm:flex">
              {languages.map((item) => (
                <button key={item} onClick={() => changeLanguage(item)} className={`rounded px-3 py-1 text-xs font-black uppercase ${lang === item ? 'bg-moss text-white' : 'text-ink/45 hover:text-moss'}`}>
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#cdeff3] bg-white/70 text-moss shadow-sm lg:hidden"
              aria-label={isMenuOpen ? t('layout.closeMenu') : t('layout.openMenu')}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">{isMenuOpen ? t('layout.closeMenu') : t('layout.openMenu')}</span>
              <span className="space-y-1.5">
                <span className={`block h-0.5 w-5 rounded bg-moss transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`block h-0.5 w-5 rounded bg-moss transition ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-5 rounded bg-moss transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="border-t border-[#d9eef5] bg-gradient-to-r from-white/98 via-[#eefbfc]/98 to-[#d8f5f7]/98 px-4 pb-4 lg:hidden">
            <div className="mx-auto max-w-7xl">
              <div className="mb-3 flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-2">
                  {accessToken ? (
                    <button onClick={() => { logout(); navigate(`/${lang}`); setIsMenuOpen(false) }}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100 transition-colors">
                      {t('auth.logout')}
                    </button>
                  ) : (
                    <Link to={`/${lang}/cabinet`} onClick={() => setIsMenuOpen(false)}
                      className="rounded bg-moss px-3 py-1 text-xs font-black text-white hover:bg-moss/90 transition-colors">
                      {t('auth.login')}
                    </Link>
                  )}
                </div>
                <div className="flex rounded border border-[#cdeff3] bg-white/70 p-1">
                  {languages.map((item) => (
                    <button key={item} onClick={() => changeLanguage(item)} className={`rounded px-3 py-1 text-xs font-black uppercase ${lang === item ? 'bg-moss text-white' : 'text-ink/45'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <nav className="grid grid-cols-2 gap-2">
                {nav.map(([key, href]) => (
                  <NavLink key={key} to={href} end={key === 'home'} className={({ isActive }) => `rounded-md px-4 py-3 text-sm font-bold ${isActive ? 'bg-moss text-white shadow-sm' : 'bg-white/70 text-ink/76 hover:bg-[#e8fbfc] hover:text-moss'}`}>
                    <span className="inline-flex items-center gap-2">
                      {t(`nav.${key}`)}
                      {key === 'notifications' && unreadCount > 0 && (
                        <span className="rounded bg-clay px-2 py-0.5 text-[10px] font-black text-white">{unreadCount}</span>
                      )}
                      {key === 'chat' && unreadDms > 0 && (
                        <span className="rounded bg-moss px-2 py-0.5 text-[10px] font-black text-white">{unreadDms}</span>
                      )}
                    </span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>
      <main className={
        location.pathname === `/${lang}` || location.pathname === `/${lang}/` ||
        location.pathname === `/${lang}/about`
          ? ''
          : 'mx-auto max-w-7xl px-4 py-6 sm:py-8'
      }>
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="mt-8 border-t border-[#72dce1]/60 bg-gradient-to-r from-[#0879a8] via-[#1d9fbd] to-[#3bc4c7] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.35fr_0.9fr_0.9fr_1.05fr]">
          <section>
            <Link to={`/${lang}`} className="inline-flex items-center gap-4">
              <img src="/logo.png" alt="Логотип БФЭТ" className="h-16 w-16 object-contain" />
              <span className="font-display text-xl font-bold leading-tight">{t('footer.title')}</span>
            </Link>
            <p className="mt-4 max-w-md text-sm font-medium leading-7 text-white/78">
              {t('footer.description')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/${lang}/register`} className="rounded bg-white px-4 py-2 text-sm font-bold text-moss">{t('join')}</Link>
              <Link to={`/${lang}/donations`} className="rounded border border-white/45 px-4 py-2 text-sm font-bold text-white hover:bg-white/12">{t('footer.support')}</Link>
            </div>
            {(site.instagram || site.youtube || site.facebook) && (
              <div className="mt-5 flex items-center gap-3">
                {site.instagram && (
                  <a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                )}
                {site.youtube && (
                  <a href={site.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.6 5 12 5 12 5s-4.6 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.9C6.8 19 12 19 12 19s4.6 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8z" />
                      <polygon points="10,8.5 10,15.5 16,12" fill="white" />
                    </svg>
                  </a>
                )}
                {site.facebook && (
                  <a href={site.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white/58">{t('footer.platform')}</h2>
            <nav className="mt-4 space-y-3">
              {footerPlatformNav.map(([key, href]) => (
                <Link key={key} to={href} className={footerLinkClass}>{t(`nav.${key}`)}</Link>
              ))}
            </nav>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white/58">{t('layout.services')}</h2>
            <nav className="mt-4 space-y-3">
              {footerServiceNav.map(([key, href]) => (
                <Link key={key} to={href} className={footerLinkClass}>{t(`nav.${key}`)}</Link>
              ))}
            </nav>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white/58">{t('footer.contacts')}</h2>
            <div className="mt-4 space-y-3 text-sm font-medium leading-6 text-white/80">
              <p className="font-bold text-white">{site.name}</p>
              <p>{site.address}</p>
              {footerPhones.length > 0 && <p>{footerPhones.join(', ')}</p>}
              {site.email && <a href={`mailto:${site.email}`} className={footerLinkClass}>{site.email}</a>}
              <a href="tel:+996550229720" className={footerLinkClass}>0550 22 97 20</a>
              <a href="tel:+996709229720" className={footerLinkClass}>0709 22 97 20</a>
              {site.website && <a href={site.website} target="_blank" rel="noreferrer" className={footerLinkClass}>{t('footer.officialSite')}</a>}
              {site.workingHours && <p>{site.workingHours}</p>}
            </div>
          </section>
        </div>
        <div className="border-t border-white/16">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm font-semibold text-white/62 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} {t('footer.copyright')}</span>
            <a href="https://stqr.ru/6990-4-101" target="_blank" rel="noreferrer" className="text-white/50 no-underline hover:underline">{t('footer.developer')}</a>
            <span>{t('footer.adminManaged')}</span>
          </div>
        </div>
      </footer>
      <SupportWidget />
    </div>
  )
}
