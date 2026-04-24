import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, poRes] = await Promise.all([
          api.get('/events?limit=4'),
          api.get('/pools?limit=4'),
        ])
        setEvents(evRes.data.data || [])
        setPools(poRes.data.data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">
            Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-on-surface-variant">Here&apos;s what&apos;s happening in your community today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/events" className="primary-gradient text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Create Event
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'event', value: user?.community_points || 0, label: 'Community Points', color: 'text-primary', bg: 'bg-primary-fixed' },
          { icon: 'military_tech', value: user?.badges?.length || 0, label: 'Badges Earned', color: 'text-tertiary', bg: 'bg-tertiary-fixed' },
          { icon: 'group', value: events.length, label: 'Active Events', color: 'text-secondary', bg: 'bg-secondary-fixed' },
          { icon: 'inventory_2', value: pools.length, label: 'Active Pools', color: 'text-primary-container', bg: 'bg-surface-container-high' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-container-low p-6 rounded-3xl flex flex-col items-center text-center hover:bg-surface-container transition-colors">
            <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined ${s.color} material-fill`}>{s.icon}</span>
            </div>
            <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-headline font-extrabold tracking-tight">Upcoming Events</h2>
          <Link to="/events" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event._id} className="bg-surface-container-low rounded-3xl overflow-hidden hover:bg-surface-container transition-all group">
              <div className="h-40 overflow-hidden">
                <img src={event.cover_image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-fixed text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">{event.category}</span>
                  <span className="text-[10px] font-label text-on-surface-variant">{new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">{event.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={event.organizer?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-xs font-medium">{event.organizer?.name}</span>
                  </div>
                  <span className="text-xs font-label text-secondary font-bold">{event.registered_count}/{event.max_volunteers || '∞'} joined</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Pools */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-headline font-extrabold tracking-tight">Active Pools</h2>
          <Link to="/pools" className="text-primary text-sm font-bold hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pools.map(pool => {
            const platformIcons = { blinkit: '⚡', swiggy: '🍔', zomato: '🍽️', amazon: '📦', flipkart: '🛍️', dmart: '🏬', zepto: '🚀', custom: '📋' }
            const platformColors = { blinkit: '#F8D000', swiggy: '#FF5200', zomato: '#E23744', amazon: '#FF9900', flipkart: '#2874F0', dmart: '#E31E24', zepto: '#8B3FFF', custom: '#03A6A1' }
            const pIcon = platformIcons[pool.platform] || '📋'
            const pColor = platformColors[pool.platform] || '#03A6A1'
            const pLabel = pool.platform === 'custom' ? (pool.platform_custom_name || 'Custom') : (pool.platform || 'custom').charAt(0).toUpperCase() + (pool.platform || 'custom').slice(1)
            const activeP = pool.active_participants || pool.participants?.filter(p => p.status !== 'cancelled').length || 0
            const itemCount = pool.item_count || 0
            return (
              <Link key={pool._id} to={`/pools/${pool._id}`} className="bg-surface-container-low rounded-3xl p-6 hover:bg-surface-container transition-all block">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl" style={{ background: `${pColor}20` }}>
                    {pIcon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white" style={{ background: pColor }}>{pLabel}</span>
                    </div>
                    <h3 className="font-bold mb-1">{pool.title}</h3>
                    <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">{pool.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">group</span>
                          <span className="text-xs font-bold">{activeP}/{pool.max_participants}</span>
                        </div>
                        {itemCount > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">shopping_cart</span>
                            <span className="text-xs font-bold">{itemCount} items</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(activeP / pool.max_participants) * 100}%`, background: pColor }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
