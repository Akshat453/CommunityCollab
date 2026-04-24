import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const categories = ['all', 'charity', 'cleanup', 'workshop', 'health', 'fundraiser', 'social']

export default function Events() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'workshop', starts_at: '', max_volunteers: 20, cover_image_url: '' })

  const fetchEvents = async ({ q = '', category = '', date = '' } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (category && category !== 'all') params.append('category', category)
      if (date) params.append('date', date)
      const { data } = await api.get(`/events?${params.toString()}`)
      setEvents(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Debounce search text; fire immediately for category/date
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents({ q: search, category: activeCategory, date: dateFilter })
    }, 400)
    return () => clearTimeout(timer)
  }, [search, activeCategory, dateFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/events', form)
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'workshop', starts_at: '', max_volunteers: 20, cover_image_url: '' })
      fetchEvents({ q: search, category: activeCategory, date: dateFilter })
    } catch (err) { console.error(err) }
  }

  const handleJoin = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`)
      fetchEvents({ q: search, category: activeCategory, date: dateFilter })
    } catch (err) { alert(err.response?.data?.message || 'Failed to join') }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-10 h-48 md:h-64">
        <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200" alt="Events" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#271902]/80 to-transparent flex items-center px-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-white tracking-tighter mb-2">Community Events</h1>
            <p className="text-white/80 max-w-md">Find and join local events, workshops, and gatherings in your community.</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search events by name, city, or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none"
        />
      </div>

      {/* Filter + Create */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === cat ? 'primary-gradient text-white shadow-lg' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="primary-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-sm">add</span> Create Event
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-surface-container-low rounded-3xl p-8 mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-6">New Event</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <input type="number" placeholder="Max volunteers" value={form.max_volunteers} onChange={e => setForm({ ...form, max_volunteers: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-24" />
            <input type="url" placeholder="Cover image URL (optional)" value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })} className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Publish Event</button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-surface-container text-on-surface-variant px-6 py-3 rounded-xl font-bold hover:bg-surface-container-high transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-surface-container-highest text-8xl">event_busy</span>
          <h3 className="text-xl font-bold mt-4">No events found</h3>
          <p className="text-on-surface-variant mt-2">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const isJoined = event.participants?.some(p => p.user?._id === user?._id || p.user === user?._id)
            const isOrganizer = event.organizer?._id === user?._id
            return (
              <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="bg-surface-container-low rounded-3xl overflow-hidden hover:shadow-md transition-all group cursor-pointer">
                <div className="h-48 relative overflow-hidden">
                  <img src={event.cover_image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-on-surface shadow-sm">
                    {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary-fixed text-primary text-[10px] font-bold uppercase px-2 py-1 rounded-full">{event.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                  <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">{event.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <img src={event.organizer?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-7 h-7 rounded-full border border-outline-variant/20" />
                      <span className="text-xs font-medium">{event.organizer?.name}</span>
                    </div>
                    <span className="text-xs font-label text-on-surface-variant">{event.registered_count}/{event.max_volunteers || '∞'}</span>
                  </div>
                  <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${event.max_volunteers ? (event.registered_count / event.max_volunteers) * 100 : 50}%` }}></div>
                  </div>
                  {isOrganizer ? (
                    <div className="text-center py-2 rounded-xl bg-surface-container text-on-surface-variant text-sm font-bold">Your Event</div>
                  ) : isJoined ? (
                    <div className="text-center py-2 rounded-xl bg-secondary-container text-on-secondary-container text-sm font-bold">Joined ✓</div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleJoin(event._id) }} className="w-full py-2.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">Join Event</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
