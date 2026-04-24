import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

const TYPE_ICON = {
  pool: 'shopping_cart',
  event: 'event',
  skill: 'school',
  resource: 'handyman',
  assistance: 'volunteer_activism',
  message: 'chat',
  badge: 'military_tech',
  urgent: 'warning'
}

const typeStyles = {
  urgent: { border: 'border-error', bg: 'bg-error-container', iconColor: 'text-error', iconFill: true },
  event: { border: 'border-secondary', bg: 'bg-secondary-container/30', iconColor: 'text-secondary', iconFill: true },
  skill: { border: 'border-primary', bg: 'bg-primary-fixed', iconColor: 'text-primary', iconFill: true },
  pool: { border: 'border-secondary-fixed-dim', bg: 'bg-secondary-container', iconColor: 'text-on-secondary-container', iconFill: true },
  badge: { border: 'border-tertiary', bg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', iconFill: true },
  resource: { border: 'border-secondary', bg: 'bg-secondary-container/20', iconColor: 'text-on-secondary-container', iconFill: true },
  assistance: { border: 'border-tertiary', bg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', iconFill: true },
  message: { border: 'border-primary', bg: 'bg-primary-fixed', iconColor: 'text-primary', iconFill: false },
  default: { border: 'border-outline-variant', bg: 'bg-surface-container', iconColor: 'text-on-surface-variant', iconFill: false }
}

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export default function Notifications() {
  const navigate = useNavigate()
  const { onEvent, offEvent } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  useEffect(() => {
    const handler = ({ notification }) => {
      if (notification) setNotifications(prev => [notification, ...prev])
    }
    onEvent('notification:new', handler)
    return () => offEvent('notification:new', handler)
  }, [])

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) { console.error(err) }
  }

  const handleClick = (n) => {
    navigate(n.link || '/notifications')
    api.patch(`/notifications/${n._id}/read`).catch(() => {})
    setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x))
  }

  const groupByTime = (notifs) => {
    const now = new Date()
    const nowDay = now.toDateString()
    const today = [], thisWeek = [], earlier = []
    notifs.forEach(n => {
      const d = new Date(n.createdAt)
      const diff = now - d
      if (d.toDateString() === nowDay) today.push(n)
      else if (diff < 7 * 86400000) thisWeek.push(n)
      else earlier.push(n)
    })
    return { today, thisWeek, earlier }
  }

  const groups = groupByTime(notifications)

  if (loading) return <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>

  const renderSection = (title, items, faded = false) => {
    if (items.length === 0) return null
    return (
      <section>
        <h2 className="text-xs font-label uppercase tracking-widest text-on-surface-variant/60 font-black mb-6 flex items-center gap-4">
          {title}
          <span className="flex-grow h-px bg-surface-container"></span>
        </h2>
        <div className={`grid gap-4 ${faded ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}>
          {items.map(n => {
            const style = typeStyles[n.type] || typeStyles.default
            const icon = TYPE_ICON[n.type] || 'check_circle'
            return (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`group relative bg-surface-container rounded-xl p-5 border-l-4 ${style.border} shadow-sm hover:shadow-md hover:translate-x-1 transition-all flex gap-5 items-start text-left w-full`}
              >
                <div className={`w-12 h-12 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined ${style.iconColor} ${style.iconFill ? 'material-fill' : ''}`}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-on-surface text-sm">{n.title}</h3>
                    <span className="text-xs font-label text-on-surface-variant shrink-0 ml-2">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{n.message}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full absolute top-3 right-3 shrink-0"></div>}
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
        <div className="relative">
          <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-on-surface mb-2">Updates</h1>
          <div className="h-1 w-24 bg-primary rounded-full"></div>
        </div>
        <button onClick={markAllRead} className="text-xs font-label uppercase tracking-widest text-secondary font-bold hover:opacity-70 transition-opacity">Mark all as read</button>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-24 text-center md:text-left">
          <div className="inline-block relative">
            <span className="text-[8rem] md:text-[12rem] font-headline font-black text-surface-container absolute -top-24 md:-top-32 -left-8 md:-left-12 select-none pointer-events-none">CLEAN</span>
            <div className="relative z-10 flex flex-col items-start gap-2">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">check_circle</span>
              <h2 className="text-3xl font-headline font-bold text-on-surface">You&apos;re all caught up!</h2>
              <p className="text-on-surface-variant">We&apos;ll let you know when there&apos;s new activity.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {renderSection('Today', groups.today)}
          {renderSection('This Week', groups.thisWeek)}
          {renderSection('Earlier', groups.earlier, true)}
        </div>
      )}
    </div>
  )
}
