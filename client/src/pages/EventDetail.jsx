import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

  const fetchEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/events/${id}`)
      setEvent(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvent() }, [id])

  const handleJoin = async () => {
    setJoining(true)
    try {
      await api.post(`/events/${id}/join`)
      fetchEvent()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    try {
      await api.post(`/events/${id}/leave`)
      fetchEvent()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave')
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto flex justify-center py-32">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto text-center py-32">
      <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-on-surface-variant mb-6">{error}</p>
      <button onClick={() => navigate('/events')} className="primary-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Back to Events</button>
    </div>
  )

  if (!event) return null

  const isJoined = event.participants?.some(p => (p.user?._id || p.user) === user?._id)
  const isOrganizer = (event.organizer?._id || event.organizer) === user?._id
  const pct = event.max_volunteers ? (event.registered_count / event.max_volunteers) * 100 : 50

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate('/events')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm font-medium mb-6 group">
        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Events
      </button>

      {/* Hero Image */}
      <div className="rounded-3xl overflow-hidden mb-8 h-64 md:h-80 relative">
        <img src={event.cover_image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200'} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="bg-primary-fixed text-primary text-[10px] font-bold uppercase px-3 py-1 rounded-full">{event.category}</span>
          <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-white tracking-tighter mt-3">{event.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h2 className="font-bold text-lg mb-3">About this Event</h2>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
          </div>

          {/* Date & Location */}
          <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <h2 className="font-bold text-lg mb-1">Details</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary material-fill">calendar_today</span>
              </div>
              <div>
                <p className="text-sm font-bold">{new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs text-on-surface-variant">{new Date(event.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{event.ends_at ? ` — ${new Date(event.ends_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
              </div>
            </div>
            {event.location?.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container material-fill">location_on</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{event.location.address}</p>
                  {event.location.city && <p className="text-xs text-on-surface-variant">{event.location.city}</p>}
                </div>
              </div>
            )}
            {event.status && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary material-fill">info</span>
                </div>
                <div>
                  <p className="text-sm font-bold capitalize">{event.status}</p>
                  <p className="text-xs text-on-surface-variant">Event status</p>
                </div>
              </div>
            )}
          </div>

          {/* Participants List */}
          {event.participants?.length > 0 && (
            <div className="bg-surface-container-low rounded-3xl p-6">
              <h2 className="font-bold text-lg mb-4">Participants ({event.registered_count || event.participants.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {event.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2">
                    <img src={p.user?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-7 h-7 rounded-full" />
                    <span className="text-xs font-medium truncate">{p.user?.name || 'User'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, i) => (
                <span key={i} className="bg-surface-container text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Hosted by</h3>
            <div className="flex items-center gap-3 mb-4">
              <img src={event.organizer?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" className="w-12 h-12 rounded-2xl border-2 border-outline-variant/20" />
              <div>
                <p className="font-bold">{event.organizer?.name}</p>
                {event.organizer?.verified && <span className="material-symbols-outlined text-secondary text-sm material-fill">verified</span>}
              </div>
            </div>
            {event.organizer?.bio && <p className="text-xs text-on-surface-variant line-clamp-3">{event.organizer.bio}</p>}
          </div>

          {/* Progress */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-4">Spots</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-extrabold">{event.registered_count}</span>
              <span className="text-on-surface-variant text-sm">/ {event.max_volunteers || '∞'}</span>
            </div>
            <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-on-surface-variant">{event.max_volunteers ? event.max_volunteers - event.registered_count : '∞'} spots remaining</p>
          </div>

          {/* CTA */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            {isOrganizer ? (
              <div className="text-center py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold">Your Event</div>
            ) : isJoined ? (
              <div className="space-y-3">
                <div className="text-center py-3 rounded-xl bg-secondary-container text-on-secondary-container font-bold">Joined ✓</div>
                <button onClick={handleLeave} className="w-full py-2.5 rounded-xl border-2 border-error/30 text-error font-bold text-sm hover:bg-error hover:text-white transition-all">Leave Event</button>
              </div>
            ) : (
              <button onClick={handleJoin} disabled={joining} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50">
                {joining ? 'Joining...' : 'Join Event'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
