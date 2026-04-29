import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { Card, PageHero } from '../components/UI'
import { api } from '../api'
import { useAppStore } from '../store'

export function ChatPage() {
  const auth = useAppStore((state) => state)
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState('general')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [socket, setSocket] = useState(null)
  const [connectionError, setConnectionError] = useState('')

  useEffect(() => {
    api.get('/chat/rooms').then(({ data }) => setRooms(data)).catch(() => setRooms([{ id: 'general', name: 'Общий чат' }]))
  }, [])

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:4000'
    const nextSocket = io(socketUrl, { autoConnect: true, transports: ['websocket', 'polling'] })

    nextSocket.on('connect', () => setConnectionError(''))
    nextSocket.on('connect_error', () => setConnectionError('Backend на localhost:4000 не запущен. Запустите API и обновите страницу.'))
    nextSocket.on('chat:history', (history) => setMessages(history))
    nextSocket.on('chat:message', (message) => setMessages((prev) => [...prev, message]))
    setSocket(nextSocket)

    return () => nextSocket.disconnect()
  }, [])

  useEffect(() => {
    if (!socket) return
    setMessages([])
    socket.emit('chat:join', { roomId })
  }, [socket, roomId])

  const sendMessage = () => {
    if (!text.trim() || !socket) return
    socket.emit('chat:message', {
      roomId,
      author: auth.email || 'Гость',
      authorId: auth.user?.id || null,
      text
    })
    setText('')
  }

  const reportMessage = async (messageId) => {
    if (!auth.accessToken) {
      alert('Войдите, чтобы отправить жалобу.')
      return
    }
    const reason = window.prompt('Причина жалобы')
    if (!reason) return
    try {
      await api.post(`/chat/messages/${messageId}/report`, { reason })
      alert('Жалоба отправлена модератору.')
    } catch (error) {
      alert(error.response?.data?.error || 'Не удалось отправить жалобу')
    }
  }

  return (
    <div className="space-y-6">
      <PageHero>
        <h1 className="font-display text-4xl font-bold">Чат</h1>
        <p className="mt-3 max-w-3xl text-white/86">Общий чат, комнаты по вакансиям и менторству, жалобы и модерация сообщений.</p>
      </PageHero>
      <Card className="space-y-4">
        {connectionError && <div className="rounded-md border border-clay/20 bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">{connectionError}</div>}
        <div className="flex flex-wrap gap-2">
          {rooms.map((room) => (
            <button key={room.id} onClick={() => setRoomId(room.id)} className={`rounded px-4 py-2 text-sm font-bold ${roomId === room.id ? 'bg-moss text-white' : 'bg-[#eefbfc] text-ink/82'}`}>
              {room.name}
            </button>
          ))}
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-auto pr-3">
          {messages.map((message) => (
            <div key={message.id} className="rounded-md border border-ink/10 bg-[#eefbfc] px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-sm text-ink/72">
                <span>{message.author}</span>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-ink/82">{message.text}</p>
              <button onClick={() => reportMessage(message.id)} className="mt-2 text-xs font-bold text-red-700">Пожаловаться</button>
            </div>
          ))}
          {messages.length === 0 && <p className="text-ink/72">В этой комнате пока нет сообщений.</p>}
        </div>
        <div className="flex gap-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }} placeholder="Введите сообщение" className="flex-1 rounded-md border border-ink/10 bg-white px-4 py-3 outline-none" />
          <button onClick={sendMessage} className="rounded bg-moss px-6 py-3 font-bold text-white">Отправить</button>
        </div>
      </Card>
    </div>
  )
}
