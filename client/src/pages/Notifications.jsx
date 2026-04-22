import { useState, useEffect } from 'react'
import api from '../services/api'

const typeStyles = {
  urgent: { border: 'border-error', bg: 'bg-error-container', icon: 'warning', iconColor: 'text-error', iconFill: true },
  event: { border: 'border-secondary', bg: 'bg-secondary-container/30', icon: 'volunteer_activism', iconColor: 'text-secondary', iconFill: true },
  skill: { border: 'border-primary', bg: 'bg-primary-fixed', icon: 'psychology', iconColor: 'text-primary', iconFill: true },
  pool: { border: 'border-secondary-fixed-dim', bg: 'bg-secondary-container', icon: 'group', iconColor: 'text-on-secondary-container', iconFill: true },
  badge: { border: 'border-tertiary', bg: 'bg-tertiary-fixed', icon: 'military_tech', iconColor: 'text-tertiary', iconFill: true },
  default: { border: 'border-outline-variant', bg: 'bg-surface-container', icon: 'check_circle', iconColor: 'text-on-surface-variant', iconFill: false },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.data || [])
      setUnread(data.unread || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      fetchNotifications()
    } catch (err) { console.error(err) }
  }

  const clearAll = async () => {
    try {
      await api.delete('/notifications/clear')
      fetchNotifications()
    } catch (err) { console.error(err) }
  }

  const groupByTime = (notifs) => {
    const now = new Date()
    const today = [], thisWeek = [], earlier = []
    notifs.forEach(n => {
      const diff = now - new Date(n.createdAt)
      if (diff < 86400000) today.push(n)
      else if (diff < 604800000) thisWeek.push(n)
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
            return (
              <div key={n._id} className={`group relative bg-surface-container rounded-xl p-5 border-l-4 ${style.border} shadow-sm hover:shadow-md hover:translate-x-1 transition-all flex gap-5 items-start`}>
                <div className={`w-12 h-12 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined ${style.iconColor} ${style.iconFill ? 'material-fill' : ''}`}>{style.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-on-surface">{n.title}</h3>
                    <span className="text-xs font-label text-on-surface-variant">{new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{n.message}</p>
                  {n.type === 'urgent' && (
                    <div className="mt-4 flex gap-2">
                      <button className="px-4 py-1.5 bg-error text-white text-xs font-bold rounded-full hover:bg-error/90 transition-colors">Respond Now</button>
                      <button className="px-4 py-1.5 bg-white/50 text-on-surface text-xs font-bold rounded-full hover:bg-white/80 transition-colors">Dismiss</button>
                    </div>
                  )}
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full absolute top-3 right-3"></div>}
              </div>
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
        <div className="flex gap-3">
          <button onClick={markAllRead} className="text-xs font-label uppercase tracking-widest text-secondary font-bold hover:opacity-70 transition-opacity">Mark all as read</button>
          <button onClick={clearAll} className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-bold hover:opacity-70 transition-opacity">Clear all</button>
        </div>
      </div>

      <div className="space-y-12">
        {renderSection('Today', groups.today)}
        {renderSection('This Week', groups.thisWeek)}
        {renderSection('Earlier', groups.earlier, true)}
      </div>

      {notifications.length === 0 && (
        <div className="mt-24 text-center md:text-left">
          <div className="inline-block relative">
            <span className="text-[8rem] md:text-[12rem] font-headline font-black text-surface-container absolute -top-24 md:-top-32 -left-8 md:-left-12 select-none pointer-events-none">CLEAN</span>
            <h2 className="text-3xl font-headline font-bold text-on-surface relative z-10">That&apos;s everything for now.</h2>
            <p className="text-on-surface-variant mt-2 relative z-10">We&apos;ll let you know when the hearth is humming with new activity.</p>
          </div>
        </div>
      )}
    </div>
  )
}
