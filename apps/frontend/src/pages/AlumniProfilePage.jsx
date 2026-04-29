import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Card, PageHero } from '../components/UI'
import { api } from '../api'

const SOCIAL_LABELS = {
  linkedin: 'LinkedIn', github: 'GitHub', telegram: 'Telegram',
  vk: 'ВКонтакте', instagram: 'Instagram', website: 'Личный сайт'
}

const SOCIAL_ABBR = {
  linkedin: 'in', github: 'gh', telegram: 'tg', vk: 'vk', instagram: 'ig', website: '🌐'
}

export function AlumniProfilePage() {
  const { id, lang = 'ru' } = useParams()
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/alumni/${id}`)
      .then(({ data }) => setProfile(data))
      .catch(() => setError('Профиль не найден'))
  }, [id])

  if (error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!profile) return <Card><p className="text-ink/72">{t('common.loading')}</p></Card>

  const skills = Array.isArray(profile.skills) ? profile.skills.filter(Boolean) : []
  const socialLinks = profile.socialLinks && typeof profile.socialLinks === 'object'
    ? profile.socialLinks
    : {}
  const hasSocials = Object.values(socialLinks).some(Boolean)

  return (
    <div className="space-y-6">
      <Link to={`/${lang}/alumni`} className="inline-flex items-center gap-2 font-bold text-moss hover:text-moss/70 transition-colors">
        ← {t('directory.title')}
      </Link>

      {/* Заголовок профиля */}
      <PageHero>
        <div className="flex flex-wrap items-start gap-6">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.fullName}
              className="h-24 w-24 shrink-0 rounded-md object-cover bg-[#eefbfc]"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-moss text-4xl font-bold text-white">
              {profile.fullName?.[0] || 'В'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">{profile.fullName}</h1>
            <p className="mt-3 text-xl font-semibold text-white/90">
              {profile.graduationYear} {t('profile.graduationYear')} · {profile.specialty}
            </p>
            <p className="mt-2 text-white/78">
              {[profile.groupName, [profile.city, profile.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.isMentor && <Badge>{t('profile.mentor')}</Badge>}
              {profile.canHelpStudents && <Badge tone="gold">{t('profile.helpStudents')}</Badge>}
              {profile.isSponsor && <Badge tone="gold">{t('profile.sponsor')}</Badge>}
              {!profile.isMentor && !profile.canHelpStudents && !profile.isSponsor && (
                <Badge tone="clay">{t('profile.graduate')}</Badge>
              )}
            </div>
          </div>
        </div>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Основное содержимое */}
        <div className="space-y-6 lg:col-span-2">
          {/* Биография */}
          <Card>
            <h2 className="font-display text-3xl font-bold">{t('profile.about')}</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-ink/75">
              {profile.bio || t('profile.noInfo')}
            </p>
          </Card>

          {/* Достижения */}
          {profile.achievements && (
            <Card>
              <h2 className="font-display text-3xl font-bold">{t('profile.achievements')}</h2>
              <p className="mt-4 whitespace-pre-line leading-8 text-ink/75">{profile.achievements}</p>
            </Card>
          )}

          {/* Навыки */}
          {skills.length > 0 && (
            <Card>
              <h2 className="font-display text-3xl font-bold">{t('profile.skills')}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded bg-moss/10 px-4 py-2 text-sm font-semibold text-moss"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Менторство */}
          {profile.isMentor && (profile.mentorArea || profile.mentorFormat || profile.mentorAvailability || profile.bio) && (
            <Card>
              <h2 className="font-display text-3xl font-bold">{t('mentorship.info')}</h2>
              <div className="mt-4 space-y-3 text-ink/80">
                {profile.mentorArea && (
                  <div>
                    <span className="font-bold">{t('mentorship.area')}:</span>{' '}
                    <span>{profile.mentorArea}</span>
                  </div>
                )}
                {profile.mentorFormat && (
                  <div>
                    <span className="font-bold">{t('mentorship.format')}:</span>{' '}
                    <span>{t(`mentorship.${profile.mentorFormat}`) || profile.mentorFormat}</span>
                  </div>
                )}
                {profile.mentorAvailability && (
                  <div>
                    <span className="font-bold">{t('mentorship.availability')}:</span>{' '}
                    <span>{profile.mentorAvailability}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Карьера и контакты */}
          <Card>
            <h2 className="font-display text-3xl font-bold">{t('profile.career')}</h2>
            <div className="mt-4 space-y-1">
              <p className="text-xl font-bold">{profile.position || t('profile.noPosition')}</p>
              <p className="text-ink/72">{profile.company || t('profile.noCompany')}</p>
            </div>

            {(profile.showEmail && profile.user?.email) || (profile.showPhone && profile.phone)
              ? (
                <div className="mt-5 border-t border-ink/10 pt-4 space-y-2 text-sm">
                  <p className="font-bold text-ink">{t('profile.contacts')}</p>
                  {profile.showEmail && profile.user?.email && (
                    <p className="text-ink/82">
                      <span className="font-semibold">{t('profile.email')}:</span>{' '}
                      <a href={`mailto:${profile.user.email}`} className="text-moss hover:underline">
                        {profile.user.email}
                      </a>
                    </p>
                  )}
                  {profile.showPhone && profile.phone && (
                    <p className="text-ink/82">
                      <span className="font-semibold">{t('profile.phone')}:</span>{' '}
                      <a href={`tel:${profile.phone}`} className="hover:underline">{profile.phone}</a>
                    </p>
                  )}
                </div>
              )
              : null
            }
          </Card>

          {/* Социальные сети */}
          {hasSocials && (
            <Card>
              <h2 className="font-display text-3xl font-bold">{t('profile.socialLinks')}</h2>
              <div className="mt-4 space-y-2">
                {Object.entries(socialLinks).map(([key, url]) =>
                  url ? (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-md bg-moss/5 px-4 py-3 text-sm font-semibold hover:bg-moss/10 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-moss/10 text-xs font-bold text-moss uppercase">
                        {SOCIAL_ABBR[key] || key.slice(0, 2)}
                      </span>
                      <span>{SOCIAL_LABELS[key] || key}</span>
                    </a>
                  ) : null
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
