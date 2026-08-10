import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import LegalNoticeModal from '../components/LegalNoticeModal'
import TrustBadge from '../components/TrustBadge'
import LocationPicker from '../components/LocationPicker'

const NearMeMap = lazy(() => import('../components/NearMeMap'))
const CarpoolMap = lazy(() => import('../components/CarpoolMap'))

const PLATFORM_META = {
  blinkit:  { label: 'Blinkit',  color: '#F8D000', icon: '⚡' },
  swiggy:   { label: 'Swiggy',   color: '#FF5200', icon: '🍔' },
  zomato:   { label: 'Zomato',   color: '#E23744', icon: '🍽️' },
  amazon:   { label: 'Amazon',   color: '#FF9900', icon: '📦' },
  flipkart: { label: 'Flipkart', color: '#2874F0', icon: '🛍️' },
  dmart:    { label: 'DMart',    color: '#E31E24', icon: '🏬' },
  zepto:    { label: 'Zepto',    color: '#8B3FFF', icon: '🚀' },
  custom:   { label: 'Custom',   color: '#03A6A1', icon: '📋' },
}

const STATUS_STYLES = {
  open:      { label: 'Open',      bg: '#03A6A1', color: '#fff' },
  ordering:  { label: 'Ordering',  bg: '#FFA673', color: '#4f2000' },
  ordered:   { label: 'Ordered',   bg: '#2874F0', color: '#fff' },
  completed: { label: 'Completed', bg: '#03A6A1', color: '#fff' },
  cancelled: { label: 'Cancelled', bg: '#ba1a1a', color: '#fff' },
}

const typeFilters = ['all', 'group_buy', 'carpool', 'custom']
const platformFilters = ['all', 'blinkit', 'swiggy', 'zomato', 'amazon', 'flipkart', 'dmart', 'zepto', 'custom']

const INITIAL_FORM = {
  title: '', description: '', type: 'group_buy', platform: 'custom',
  platform_custom_name: '', max_participants: 6, destination: '', tags: '',
  location: {},
  // Carpool extras
  carpool_origin: '', carpool_origin_coords: null,
  carpool_destination: '', carpool_destination_coords: null,
  carpool_fare_per_seat: '',
  carpool_total_seats: '', carpool_departure_time: ''
}

export default function Pools() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showLegal, setShowLegal] = useState(() => !sessionStorage.getItem('legal_noticed_pools'))
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [activePlatform, setActivePlatform] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'map'

  const fetchPools = async ({ q = '', type = '', platform = '' } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (type && type !== 'all') params.append('type', type)
      if (platform && platform !== 'all') params.append('platform', platform)
      const { data } = await api.get(`/pools?${params.toString()}`)
      setPools(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPools({ q: search, type: activeType, platform: activePlatform })
    }, 400)
    return () => clearTimeout(timer)
  }, [search, activeType, activePlatform])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        platform: form.type === 'carpool' ? 'custom' : form.platform,
        platform_custom_name: form.platform_custom_name,
        max_participants: form.type === 'carpool' ? Number(form.carpool_total_seats) || 6 : Number(form.max_participants),
        destination: form.type !== 'carpool' ? form.destination : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      }
      if (form.type === 'carpool') {
        payload.carpool_details = {
          origin: form.carpool_origin,
          destination_place: form.carpool_destination,
          fare_per_seat: Number(form.carpool_fare_per_seat) || 0,
          total_seats: Number(form.carpool_total_seats) || 4,
          departure_time: form.carpool_departure_time || undefined,
          origin_coords: form.carpool_origin_coords || undefined,
          destination_coords: form.carpool_destination_coords || undefined
        }
      } else {
        payload.location = form.location?.lat ? form.location : undefined
      }
      await api.post('/pools', payload)
      setShowCreate(false)
      setForm(INITIAL_FORM)
      fetchPools({ q: search, type: activeType, platform: activePlatform })
    } catch (err) { console.error(err) }
  }

  const handleJoin = async (poolId) => {
    try {
      await api.post(`/pools/${poolId}/join`)
      fetchPools({ q: search, type: activeType, platform: activePlatform })
    } catch (err) { alert(err.response?.data?.message || 'Failed to join') }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {showLegal && <LegalNoticeModal pageName="pools" onDismiss={() => setShowLegal(false)} />}
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">Group Pools</h1>
          <div className="h-1 w-24 bg-primary rounded-full"></div>
          <p className="text-on-surface-variant mt-3">Create shared orders, split costs, and buy together from any platform.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="primary-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-sm">add</span> New Pool
        </button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search pools by title, description, or tag..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none mb-4"
      />

      {/* Type + map/grid toggle row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <div className="flex gap-2 mb-0 overflow-x-auto hide-scrollbar pb-2">
          {typeFilters.map(t => (
            <button key={t} onClick={() => { setActiveType(t); setViewMode('grid') }} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeType === t ? 'bg-secondary text-on-secondary shadow-lg' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {t === 'group_buy' ? '🛒 Group Buy' : t === 'carpool' ? '🚗 Carpool' : t === 'all' ? 'All Types' : '📋 Custom'}
            </button>
          ))}
        </div>
        {/* Map/Grid toggle — only for non-carpool filters */}
        {activeType !== 'carpool' && (
          <div className="flex bg-surface-container rounded-xl p-1 shrink-0">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'grid' ? 'bg-white shadow text-on-surface' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-sm">grid_view</span> Grid
            </button>
            <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'map' ? 'bg-white shadow text-on-surface' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-sm">map</span> Map
            </button>
          </div>
        )}
      </div>

      {/* Platform Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
        {platformFilters.map(p => {
          const meta = PLATFORM_META[p]
          return (
            <button key={p} onClick={() => setActivePlatform(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activePlatform === p ? 'shadow-lg text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
              style={activePlatform === p ? { background: meta?.color || '#03A6A1' } : {}}>
              {p === 'all' ? '🌐 All Platforms' : `${meta?.icon} ${meta?.label}`}
            </button>
          )
        })}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-surface-container-low rounded-3xl p-8 mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-6">
            {form.type === 'carpool' ? '🚗 Create a Carpool' : '🛒 Create a Shared Order Pool'}
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="text" placeholder="Pool title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />

            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
              <option value="group_buy">🛒 Group Buy</option>
              <option value="carpool">🚗 Carpool</option>
              <option value="custom">📋 Custom</option>
            </select>

            {/* Non-carpool fields */}
            {form.type !== 'carpool' && (
              <>
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none">
                  {Object.entries(PLATFORM_META).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
                {form.platform === 'custom' && (
                  <input type="text" placeholder="Custom platform name" value={form.platform_custom_name} onChange={e => setForm({ ...form, platform_custom_name: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                )}
                <input type="number" placeholder="Max participants" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} min="2" className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <input type="text" placeholder="Delivery address / pickup point" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <div className="md:col-span-2">
                  <LocationPicker
                    label="📍 Pool location (so nearby people can discover it on the map)"
                    placeholder="Search your area or delivery zone..."
                    value={form.location?.address || ''}
                    onChange={(loc) => setForm({ ...form, location: { address: loc.address, city: loc.city, lat: loc.lat, lng: loc.lng } })}
                  />
                </div>
              </>
            )}

            {/* Carpool-specific fields */}
            {form.type === 'carpool' && (
              <>
                <div className="md:col-span-2">
                  <LocationPicker
                    label="🚩 Origin / Pickup point"
                    placeholder="Where are you departing from?"
                    value={form.carpool_origin}
                    onChange={(loc) => setForm({ ...form, carpool_origin: loc.address, carpool_origin_coords: { lat: loc.lat, lng: loc.lng } })}
                  />
                </div>
                <div className="md:col-span-2">
                  <LocationPicker
                    label="🏁 Destination / Drop-off"
                    placeholder="Where are you going?"
                    value={form.carpool_destination}
                    onChange={(loc) => setForm({ ...form, carpool_destination: loc.address, carpool_destination_coords: { lat: loc.lat, lng: loc.lng } })}
                  />
                </div>
                <input type="number" placeholder="💺 Total seats available" value={form.carpool_total_seats || ''} onChange={e => setForm({ ...form, carpool_total_seats: e.target.value })} min="1" required className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <input type="number" placeholder="💰 Fare per seat (₹)" value={form.carpool_fare_per_seat || ''} onChange={e => setForm({ ...form, carpool_fare_per_seat: e.target.value })} min="0" step="0.01" className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">🕐 Departure Date &amp; Time</label>
                  <input type="datetime-local" value={form.carpool_departure_time || ''} onChange={e => setForm({ ...form, carpool_departure_time: e.target.value })} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />
                </div>
              </>
            )}

            <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none" />

            <textarea
              placeholder={form.type === 'carpool' ? 'Carpool details — vehicle type, luggage limits, stops, etc.' : 'Description — what are you ordering? when will you place the order?'}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="md:col-span-2 bg-surface-container rounded-xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/30 outline-none resize-none h-24"
            />

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg">
                {form.type === 'carpool' ? '🚗 Create Carpool' : '🛒 Create Pool'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="bg-surface-container text-on-surface-variant px-6 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* CarpoolMap — shown when filtering by carpool */}
      {activeType === 'carpool' && (
        <div className="mb-8">
          <Suspense fallback={<div className="h-96 bg-surface-container-low rounded-3xl flex items-center justify-center"><span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span></div>}>
            <CarpoolMap onBook={(id) => navigate(`/pools/${id}`)} />
          </Suspense>
        </div>
      )}

      {/* NearMeMap — shown in map view for non-carpool */}
      {activeType !== 'carpool' && viewMode === 'map' && (
        <div className="mb-8">
          <Suspense fallback={<div className="h-96 bg-surface-container-low rounded-3xl flex items-center justify-center"><span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span></div>}>
            <NearMeMap types="pools" height="500px" onNavigate={(route) => navigate(route)} />
          </Suspense>
        </div>
      )}

      {/* Grid — shown in grid mode for non-carpool */}
      {activeType !== 'carpool' && viewMode === 'grid' && (loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span></div>
      ) : pools.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-surface-container-highest text-8xl">inventory_2</span>
          <h3 className="text-xl font-bold mt-4">No pools yet</h3>
          <p className="text-on-surface-variant mt-2">Create the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map(pool => {
            const isJoined = pool.participants?.some(p => (p.user?._id || p.user) === user?._id)
            const isCreator = (pool.creator?._id || pool.creator) === user?._id
            const participants = pool.active_participants || pool.participants?.filter(p => p.status !== 'cancelled').length || 0
            const isCarpool = pool.type === 'carpool'
            const platformMeta = isCarpool ? { color: '#6366F1', icon: '🚗' } : (PLATFORM_META[pool.platform] || PLATFORM_META.custom)
            const platformLabel = isCarpool ? 'Carpool' : (pool.platform === 'custom' ? (pool.platform_custom_name || 'Custom') : (PLATFORM_META[pool.platform]?.label || 'Custom'))
            const statusStyle = STATUS_STYLES[pool.status] || STATUS_STYLES.open
            const maxCount = isCarpool ? (pool.carpool_details?.total_seats || pool.max_participants) : pool.max_participants
            const pct = (participants / maxCount) * 100

            return (
              <div key={pool._id} onClick={() => navigate(`/pools/${pool._id}`)} className="bg-surface-container-low rounded-3xl p-6 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                {/* Platform badge */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${platformMeta.color}20` }}>
                    {platformMeta.icon}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full text-white" style={{ background: platformMeta.color }}>
                      {platformLabel}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{pool.title}</h3>

                {/* Carpool-specific display */}
                {isCarpool && pool.carpool_details?.origin && (
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-1 font-medium">
                    <span>🚩</span>
                    <span className="truncate max-w-[70px]">{pool.carpool_details.origin}</span>
                    <span className="material-symbols-outlined text-xs shrink-0">arrow_forward</span>
                    <span>🏁</span>
                    <span className="truncate max-w-[70px]">{pool.carpool_details.destination_place}</span>
                  </div>
                )}
                {isCarpool && pool.carpool_details?.fare_per_seat > 0 && (
                  <div className="text-base font-extrabold mb-1" style={{ color: '#6366F1' }}>
                    ₹{pool.carpool_details.fare_per_seat}<span className="text-xs font-normal text-on-surface-variant"> / seat</span>
                  </div>
                )}
                {isCarpool && pool.carpool_details?.departure_time && (
                  <p className="text-xs text-on-surface-variant mb-2">🕐 {new Date(pool.carpool_details.departure_time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}

                {!isCarpool && <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">{pool.description}</p>}

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">{isCarpool ? 'airline_seat_recline_normal' : 'group'}</span>
                    <span className="font-bold">{participants}/{maxCount}</span>
                    {isCarpool && <span className="text-xs text-on-surface-variant">seats</span>}
                  </div>
                  {!isCarpool && pool.item_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">shopping_cart</span>
                      <span className="font-bold">{pool.item_count} items</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: platformMeta.color }}></div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <img src={pool.creator?.avatar_url || 'https://ui-avatars.com/api/?name=U&background=e8e0d8&color=3c4948&bold=true&size=128'} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-xs text-on-surface-variant">{pool.creator?.name}</span>
                    <TrustBadge trust_score={pool.creator?.trust_score} trust_level={pool.creator?.trust_level} size="sm" />
                  </div>
                  {isCreator ? (
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">Your Pool</span>
                  ) : isJoined ? (
                    <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1 rounded-full">Joined ✓</span>
                  ) : pool.status === 'open' ? (
                    <button onClick={(e) => { e.stopPropagation(); handleJoin(pool._id) }} className="text-xs font-bold text-primary bg-primary-fixed px-4 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all">
                      {isCarpool ? '🚗 Book Seat' : 'Join Pool'}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant">{pool.status === 'ordering' ? 'Ordering...' : pool.status}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
