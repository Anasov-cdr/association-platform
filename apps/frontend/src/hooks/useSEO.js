import { useEffect } from 'react'

const SITE = 'Ассоциация выпускников БФЭТ'
const DEFAULT_DESCRIPTION = 'Официальная платформа ассоциации выпускников БФЭТ. Каталог выпускников, вакансии, стажировки, события, новости и менторство.'
const DEFAULT_IMAGE = '/hero-graduates.png'

const ensureMeta = (selector, createAttrs) => {
  let tag = document.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    Object.entries(createAttrs).forEach(([key, value]) => tag.setAttribute(key, value))
    document.head.appendChild(tag)
  }
  return tag
}

const ensureLink = (selector, createAttrs) => {
  let tag = document.querySelector(selector)
  if (!tag) {
    tag = document.createElement('link')
    Object.entries(createAttrs).forEach(([key, value]) => tag.setAttribute(key, value))
    document.head.appendChild(tag)
  }
  return tag
}

const absoluteUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || window.location.origin
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
}

export function useSEO({ title, description, image = DEFAULT_IMAGE, noindex = false } = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE}` : SITE
    const pageDescription = description || DEFAULT_DESCRIPTION
    const pageUrl = absoluteUrl(`${window.location.pathname}${window.location.search}`)
    const imageUrl = absoluteUrl(image)

    document.title = pageTitle

    ensureMeta('meta[name="description"]', { name: 'description' }).setAttribute('content', pageDescription)
    ensureMeta('meta[name="robots"]', { name: 'robots' }).setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow')
    ensureLink('link[rel="canonical"]', { rel: 'canonical' }).setAttribute('href', pageUrl)

    ensureMeta('meta[property="og:title"]', { property: 'og:title' }).setAttribute('content', pageTitle)
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }).setAttribute('content', pageDescription)
    ensureMeta('meta[property="og:url"]', { property: 'og:url' }).setAttribute('content', pageUrl)
    ensureMeta('meta[property="og:image"]', { property: 'og:image' }).setAttribute('content', imageUrl)

    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title' }).setAttribute('content', pageTitle)
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description' }).setAttribute('content', pageDescription)
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image' }).setAttribute('content', imageUrl)
  }, [title, description, image, noindex])
}
