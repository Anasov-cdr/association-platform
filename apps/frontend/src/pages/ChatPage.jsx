import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { io } from 'socket.io-client'
import { Card } from '../components/UI'
import { api } from '../api'
import { getSocketUrl } from '../config'
import { useAppStore } from '../store'
import { toAbsoluteUploadUrl } from '../uploads'
import { useSEO } from '../hooks/useSEO'

const SOCKET_URL = getSocketUrl()

function useSocket() {
  const { t } = useTranslation()
  const [socket, setSocket] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = io(SOCKET_URL, { autoConnect: true, transports: ['websocket', 'polling'] })
    s.on('connect', () => setError(''))
    s.on('connect_error', () => setError(t('chatPage.backendUnavailable')))
    setSocket(s)
    return () => s.disconnect()
  }, [t])

  return { socket, error }
}

// ── Общий чат ──────────────────────────────────────────────────────────────

function RoomChat({ socket, error }) {
  const { t, i18n } = useTranslation()
  const auth = useAppStore((s) => s)
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState('general')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/chat/rooms')
      .then(({ data }) => setRooms(data))
      .catch(() => setRooms([{ id: 'general', name: t('chatPage.generalRoom') }]))
  }, [t])

  useEffect(() => {
    if (!socket) return
    const onHistory = (h) => setMessages(h)
    const onMsg = (m) => setMessages((prev) => [...prev, m])
    socket.on('chat:history', onHistory)
    socket.on('chat:message', onMsg)
    return () => { socket.off('chat:history', onHistory); socket.off('chat:message', onMsg) }
  }, [socket])

  useEffect(() => {
    if (!socket) return
    setMessages([])
    socket.emit('chat:join', { roomId })
  }, [socket, roomId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = () => {
    if (!text.trim() || !socket) return
    socket.emit('chat:message', {
      roomId,
      author: auth.user?.profile?.fullName || auth.email || t('chatPage.guest'),
      authorId: auth.user?.id || null,
      text
    })
    setText('')
  }

  const report = async (messageId) => {
    if (!auth.accessToken) { alert(t('chatPage.reportLogin')); return }
    const reason = window.prompt(t('chatPage.reportReason'))
    if (!reason) return
    try {
      await api.post(`/chat/messages/${messageId}/report`, { reason })
      alert(t('chatPage.reportSent'))
    } catch (err) {
      alert(err.response?.data?.error || t('chatPage.reportError'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setRoomId(room.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              roomId === room.id ? 'bg-ink text-sand' : 'bg-sand text-ink/70 hover:bg-ink/10'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-4 text-sm text-ink/40">{t('chatPage.noRoomMessages')}</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-3xl border border-ink/10 bg-sand px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm text-ink/50">
              <span className="font-bold text-ink/70">{msg.author}</span>
              <span>{new Date(msg.createdAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="mt-1.5 text-ink/80">{msg.text}</p>
            <button
              onClick={() => report(msg.id)}
              className="mt-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              {t('chatPage.report')}
            </button>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder={auth.accessToken ? t('chatPage.messagePlaceholder') : t('chatPage.messageLoginPlaceholder')}
          disabled={!auth.accessToken}
          className="flex-1 rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-moss disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!auth.accessToken}
          className="rounded-full bg-ink px-6 py-3 font-bold text-sand hover:bg-ink/80 disabled:opacity-40 transition-colors"
        >
          {t('chatPage.send')}
        </button>
      </div>
    </div>
  )
}

// ── Личные сообщения ──────────────────────────────────────────────────────

function NewChatModal({ onClose, onSelect }) {
  const { t } = useTranslation()
  const [alumni, setAlumni] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/alumni', { params: { status: 'APPROVED' } })
      .then(({ data }) => setAlumni(data))
      .catch(() => {})
  }, [])

  const filtered = alumni.filter((a) =>
    a.fullName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{t('chatPage.newDialog')}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold hover:bg-ink/10 transition-colors"
          >
            ✕
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('chatPage.searchByName')}
          autoFocus
          className="mt-4 w-full rounded-2xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm outline-none focus:border-moss"
        />
        <div className="mt-3 max-h-[52vh] space-y-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-ink/40">{t('chatPage.alumniNotFound')}</p>
          )}
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-sand/60"
            >
              {a.photoUrl ? (
                <img src={toAbsoluteUploadUrl(a.photoUrl)} alt={a.fullName} className="h-9 w-9 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moss text-sm font-bold text-white">
                  {a.fullName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">{a.fullName}</p>
                {a.specialty && <p className="text-xs text-ink/45">{a.specialty}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DirectMessages({ socket, autoOpenChatId }) {
  const { t, i18n } = useTranslation()
  const auth = useAppStore((s) => s)
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const bottomRef = useRef(null)

  const setUnreadDms = useAppStore((s) => s.setUnreadDms)

  const loadChats = useCallback(() => {
    api.get('/chat/direct').then(({ data }) => {
      setChats(data)
      const total = (data || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      setUnreadDms(total)
    }).catch(() => {})
  }, [setUnreadDms])

  useEffect(() => {
    if (auth.accessToken) loadChats()
  }, [auth.accessToken, loadChats])

  useEffect(() => {
    if (autoOpenChatId && chats.length > 0 && !activeChatId) {
      const exists = chats.find((c) => c.id === autoOpenChatId)
      if (exists) openChat(autoOpenChatId)
    }
  }, [autoOpenChatId, chats, activeChatId])

  useEffect(() => {
    if (!socket) return
    const onHistory = (h) => setMessages(h)
    const onMsg = (m) => { setMessages((prev) => [...prev, m]); loadChats() }
    socket.on('dm:history', onHistory)
    socket.on('dm:message', onMsg)
    return () => { socket.off('dm:history', onHistory); socket.off('dm:message', onMsg) }
  }, [socket, loadChats])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const openChat = (chatId) => {
    setActiveChatId(chatId)
    setMessages([])
    if (socket) socket.emit('dm:join', { chatId })
    api.get(`/chat/direct/${chatId}/messages`).then(() => loadChats()).catch(() => {})
  }

  const send = () => {
    if (!text.trim() || !socket || !activeChatId) return
    socket.emit('dm:message', {
      chatId: activeChatId,
      text,
      senderId: auth.user?.id,
      senderName: auth.user?.profile?.fullName || auth.email
    })
    setText('')
  }

  const startChat = async (alumni) => {
    setShowNewChat(false)
    const targetUserId = alumni.userId || alumni.user?.id
    if (!targetUserId) { alert(t('chatPage.userDetectError')); return }
    try {
      const { data: chat } = await api.post(`/chat/direct/${targetUserId}`)
      loadChats()
      openChat(chat.id)
    } catch (err) {
      alert(err.response?.data?.error || t('chatPage.createDialogError'))
    }
  }

  if (!auth.accessToken) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-sand/40 px-6 py-16 text-center">
        <p className="text-base font-semibold text-ink/50">
          {t('chatPage.loginForDirect')}
        </p>
      </div>
    )
  }

  const activeChat = chats.find((c) => c.id === activeChatId)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Список диалогов */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 py-2.5 text-sm font-bold text-white hover:bg-moss/80 transition-colors"
          >
            + {t('chatPage.newDialog')}
          </button>

          {chats.length === 0 && (
            <p className="rounded-2xl bg-sand/50 px-4 py-8 text-center text-sm text-ink/40">
              {t('chatPage.noDialogs')}
            </p>
          )}

          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                  activeChatId === chat.id
                    ? 'bg-moss/10 ring-1 ring-moss/30'
                    : 'hover:bg-sand/60'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-moss text-sm font-bold text-white">
                  {chat.other?.name?.[0] || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-sm font-semibold">{chat.other?.name || t('chatPage.user')}</p>
                    {chat.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-moss px-1.5 py-0.5 text-xs font-bold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-ink/45">{chat.lastMessage.text}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Активный диалог */}
        {activeChatId ? (
          <div className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-white p-4">
            {activeChat && (
              <div className="flex items-center gap-3 border-b border-ink/10 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss text-sm font-bold text-white">
                  {activeChat.other?.name?.[0] || '?'}
                </div>
                <p className="font-bold">{activeChat.other?.name}</p>
              </div>
            )}

            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="py-8 text-center text-sm text-ink/35">
                  {t('chatPage.startDialog')}
                </p>
              )}
              {messages.map((msg) => {
                const isOwn = msg.senderId === auth.user?.id
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn ? 'bg-moss text-white' : 'bg-sand text-ink'
                      }`}
                    >
                      {!isOwn && (
                        <p className="mb-0.5 text-xs font-bold opacity-60">{msg.senderName}</p>
                      )}
                      <p className="text-sm">{msg.text}</p>
                      <p className={`mt-0.5 text-xs ${isOwn ? 'text-white/55' : 'text-ink/35'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 border-t border-ink/10 pt-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder={t('chatPage.messagePlaceholder')}
                className="flex-1 rounded-2xl border border-ink/10 bg-sand/30 px-4 py-2.5 text-sm outline-none focus:border-moss"
              />
              <button
                onClick={send}
                className="rounded-full bg-moss px-5 py-2.5 text-sm font-bold text-white hover:bg-moss/80 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-3xl border border-ink/10 bg-sand/30 px-6 py-16">
            <p className="text-sm text-ink/35">{t('chatPage.chooseDialog')}</p>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onSelect={startChat} />
      )}
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function ChatPage() {
  const { t } = useTranslation()
  useSEO({ title: t('seo.chat.title') })
  const location = useLocation()
  const openDmChatId = location.state?.openDmChatId || null
  const [tab, setTab] = useState(openDmChatId ? 'direct' : 'rooms')
  const { socket, error } = useSocket()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold">{t('chatPage.title')}</h1>
        <p className="mt-3 max-w-3xl text-ink/65">
          {t('chatPage.subtitle')}
        </p>
      </div>

      <div className="flex gap-1 border-b border-ink/10">
        {[
          { id: 'rooms', label: t('chatPage.roomsTab') },
          { id: 'direct', label: t('chatPage.directTab') }
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px rounded-t-xl border-b-2 px-5 py-2.5 text-sm font-bold transition-colors ${
              tab === id
                ? 'border-moss text-moss'
                : 'border-transparent text-ink/45 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'rooms' && <RoomChat socket={socket} error={error} />}
        {tab === 'direct' && <DirectMessages socket={socket} autoOpenChatId={openDmChatId} />}
      </Card>
    </div>
  )
}
