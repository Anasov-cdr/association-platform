import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'
import { getLocalized } from '../i18n/localize'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'

export function NewsDetailPage() {
  const { id, lang = 'ru' } = useParams()
  const { t, i18n } = useTranslation()
  const auth = useAppStore((state) => state)
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const textareaRef = useRef(null)
  useSEO({ title: post ? getLocalized(post.title, i18n.language) : t('news.title') })

  useEffect(() => {
    api.get(`/news/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setError(t('news.notFound')))
  }, [id, t])

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    setCommentError('')
    try {
      const { data: comment } = await api.post(`/news/${id}/comments`, { text: commentText.trim() })
      setPost((prev) => ({ ...prev, comments: [...(prev.comments || []), comment] }))
      setCommentText('')
    } catch (err) {
      setCommentError(err.response?.data?.error || t('news.submitCommentError'))
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId) => {
    if (!window.confirm(t('news.deleteCommentConfirm'))) return
    try {
      await api.delete(`/news/${id}/comments/${commentId}`)
      setPost((prev) => ({ ...prev, comments: (prev.comments || []).filter((c) => c.id !== commentId) }))
    } catch (err) {
      alert(err.response?.data?.error || t('news.deleteCommentError'))
    }
  }

  if (error) return <Card><p className="font-semibold text-red-700">{error}</p></Card>
  if (!post) return <Card><p className="text-ink/72">{t('common.loading')}</p></Card>

  const comments = post.comments || []
  const canDelete = (comment) =>
    auth.accessToken && (comment.author?.id === auth.user?.id || auth.role === 'ADMIN' || auth.role === 'MODERATOR')

  return (
    <article className="space-y-6">
      <Link to={`/${lang}/news`} className="font-bold text-moss hover:text-moss/70 transition-colors">← {t('news.allNews')}</Link>

      <PageHero>
        {post.imageUrl && (
          <img
            src={toAbsoluteUploadUrl(post.imageUrl)}
            alt={getLocalized(post.title, i18n.language)}
            className="mb-6 w-full rounded-md object-contain"
          />
        )}
        <p className="text-sm font-semibold text-white/80">
          {new Date(post.publishedAt).toLocaleDateString(i18n.language)} · {post.authorName || t('news.association')}
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-bold leading-tight">
          {getLocalized(post.title, i18n.language)}
        </h1>
        <div className="mt-6 whitespace-pre-line text-lg leading-8 text-white/86">
          {getLocalized(post.body, i18n.language)}
        </div>
      </PageHero>

      {/* Комментарии */}
      <Card>
        <h2 className="font-display text-3xl font-bold">
          {t('news.comments')}
          {comments.length > 0 && (
            <span className="ml-3 text-xl font-normal text-ink/50">{comments.length}</span>
          )}
        </h2>

        {/* Список комментариев */}
        {comments.length > 0 ? (
          <div className="mt-6 divide-y divide-ink/8">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-4 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss/10 text-sm font-bold text-moss">
                  {(c.author?.email || t('news.user'))[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {c.author?.profile?.fullName || c.author?.email || t('news.user')}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink/40">
                        {new Date(c.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {canDelete(c) && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-xs text-ink/40 hover:text-red-600 transition-colors"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-ink/80 whitespace-pre-line">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/50">{t('news.commentsEmpty')}</p>
        )}

        {/* Форма добавления комментария */}
        {auth.accessToken ? (
          <form onSubmit={submitComment} className="mt-6 border-t border-ink/10 pt-6 space-y-3">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('news.writeComment')}
              rows="3"
              className="w-full rounded-md border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-moss resize-none"
            />
            {commentError && <p className="text-xs font-semibold text-red-600">{commentError}</p>}
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="rounded bg-moss px-6 py-2.5 text-sm font-bold text-white hover:bg-moss/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? t('news.submitting') : t('common.send')}
            </button>
          </form>
        ) : (
          <div className="mt-6 border-t border-ink/10 pt-5">
            <p className="text-sm text-ink/60">
              <Link to={`/${lang}/cabinet`} className="font-semibold text-moss hover:underline">{t('common.signIn')}</Link>
              {' '}{t('news.signInToComment')}
            </p>
          </div>
        )}
      </Card>
    </article>
  )
}
